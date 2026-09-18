/**
 * Speech for PhonicsTeacher.
 *
 * Primary: pre-generated Microsoft neural clips (Aria / Xiaoxiao) so English
 * phonics sounds natural on any phone, including over the public HTTPS site.
 * Fallback: browser SpeechSynthesis with language-aware neural voice picking.
 */

import phonemeMapJson from "@/data/phoneme-map.json";

type SpeechEventCallback = (text: string) => void;

export type SpeakKind = "word" | "sentence" | "phoneme";

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  lang?: "en-US" | "zh-CN" | "auto";
  kind?: SpeakKind;
}

interface SpeechSegment {
  text: string;
  lang: "en" | "zh";
  kind: SpeakKind;
}

const PHONEME_HINTS: Record<string, string> = phonemeMapJson;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

function isCanceledError(error: string | undefined): boolean {
  return error === "interrupted" || error === "canceled" || error === "not-allowed";
}

function isLatinLetter(text: string): boolean {
  return /^[a-z]$/i.test(text);
}

function isEnglishToken(text: string): boolean {
  return /^[a-zA-Z']+$/.test(text);
}

function scoreVoice(voice: SpeechSynthesisVoice, lang: "en" | "zh"): number {
  const code = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  const langOk =
    lang === "zh"
      ? code.startsWith("zh") || code.startsWith("cmn") || /chinese|普通话|國語|国语/.test(name)
      : code.startsWith("en");
  if (!langOk) return -1;

  let score = 0;
  if (/natural|neural|online|premium|enhanced/.test(name)) score += 55;
  if (/google/.test(name)) score += 45;
  if (lang === "en" && /aria|jenny|samantha|amy|emma|joanna|susan|zira/.test(name)) score += 30;
  if (lang === "zh" && /xiaoxiao|xiaoyi|tingting|yaoyao|huihui|meijia|yaoyao/.test(name)) score += 40;
  if (!voice.localService) score += 12;
  if (/female|woman|girl/.test(name)) score += 6;
  if (/compact|eloquence|espeak|robot/.test(name)) score -= 30;
  return score;
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: "en" | "zh"
): SpeechSynthesisVoice | undefined {
  const ranked = voices
    .map((voice) => ({ voice, score: scoreVoice(voice, lang) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.voice;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private generation = 0;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private manifest: Record<string, string> | null = null;
  private manifestPromise: Promise<Record<string, string> | null> | null = null;
  private voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
    }
  }

  get ttsAvailable(): boolean {
    return typeof window !== "undefined";
  }

  get asrAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition)
    );
  }

  /** Warm caches and unlock autoplay after the first user tap. */
  async unlock(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const silent = new Audio(SILENT_WAV);
      silent.volume = 0;
      await silent.play();
      silent.pause();
    } catch {
      /* autoplay may still be blocked until a later gesture */
    }
    void this.loadManifest();
    void this.getVoices();
  }

  preload(): void {
    void this.loadManifest();
    void this.getVoices();
  }

  /**
   * Speak text with natural intonation.
   * Mixed Chinese/English is split so each part uses the right voice.
   */
  async speak(text: string, options?: SpeakOptions): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.cancelSpeech();
    const gen = this.generation;
    await this.speakUninterrupted(trimmed, options, gen);
  }

  async speakBlend(
    letters: string[],
    options?: { rate?: number; gap?: number }
  ): Promise<void> {
    this.cancelSpeech();
    const gen = this.generation;
    const gap = options?.gap ?? 200;
    const slow = { rate: options?.rate ?? 0.5 };

    for (const letter of letters) {
      if (this.isStale(gen)) return;
      await this.speakUninterrupted(letter, { ...slow, kind: "phoneme", lang: "en-US" }, gen);
      await this.delay(gap, gen);
    }

    if (this.isStale(gen)) return;
    await this.delay(280, gen);
    await this.speakUninterrupted(letters.join(""), { kind: "word", lang: "en-US" }, gen);
  }

  async speakPhonemes(phonemes: string[]): Promise<void> {
    await this.speakBlend(phonemes, { rate: 0.5, gap: 150 });
  }

  startListening(onResult: SpeechEventCallback, onError?: (err: string) => void): void {
    if (!this.asrAvailable) {
      onError?.("SpeechRecognition not available in this browser");
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.lang = "en-US";
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      this.isListening = false;
      onResult(transcript);
    };

    this.recognition.onerror = (event: Event & { error?: string }) => {
      this.isListening = false;
      onError?.(event.error || "Recognition error");
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.isListening = true;
    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  cancelSpeech(): void {
    this.generation += 1;
    if (this.currentAudio) {
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.src = "";
      this.currentAudio = null;
    }
    try {
      this.synth?.cancel();
    } catch {
      /* Safari can throw if nothing is speaking */
    }
    this.currentUtterance = null;
  }

  private async speakUninterrupted(
    text: string,
    options: SpeakOptions | undefined,
    gen: number
  ): Promise<void> {
    if (options?.kind !== "phoneme") {
      const exact = await this.lookupExact(text);
      if (exact) {
        try {
          await this.playUrl(exact, this.playbackRate(options), gen);
          return;
        } catch {
          /* split and fall back */
        }
      }
    }

    const segments = this.toSegments(text, options);
    for (let i = 0; i < segments.length; i += 1) {
      if (this.isStale(gen)) return;
      await this.speakSegment(segments[i], options, gen);
      if (i < segments.length - 1) {
        await this.delay(90, gen);
      }
    }
  }

  private async lookupExact(text: string): Promise<string | null> {
    const manifest = await this.loadManifest();
    if (!manifest) return null;
    const trimmed = text.trim();
    const keys = [`zh:${trimmed}`, `en:${trimmed.toLowerCase()}`];
    for (const key of keys) {
      const rel = manifest[key];
      if (rel) return `${BASE_PATH}/audio/${rel}`;
    }
    return null;
  }

  private toSegments(text: string, options?: SpeakOptions): SpeechSegment[] {
    if (options?.kind === "phoneme" || (isLatinLetter(text) && options?.kind !== "word")) {
      return [{ text: text.toLowerCase(), lang: "en", kind: "phoneme" }];
    }

    if (options?.lang === "en-US") {
      return [{ text: text.toLowerCase(), lang: "en", kind: options.kind ?? "word" }];
    }

    if (options?.lang === "zh-CN") {
      return [{ text, lang: "zh", kind: "sentence" }];
    }

    const chunks = text.split(/([A-Za-z']+)/).filter((part) => part.length > 0);
    const segments: SpeechSegment[] = [];

    for (const chunk of chunks) {
      if (isEnglishToken(chunk)) {
        segments.push({
          text: chunk.toLowerCase(),
          lang: "en",
          kind: chunk.length === 1 ? "phoneme" : "word",
        });
        continue;
      }

      const zh = chunk.replace(/["'“”‘’→]/g, " ").replace(/\s+/g, " ").trim();
      if (!zh || /^[，。！？、,.!?~\s]+$/.test(zh)) continue;
      segments.push({ text: zh, lang: "zh", kind: "sentence" });
    }

    return segments.length > 0
      ? segments
      : [{ text, lang: "en", kind: options?.kind ?? "word" }];
  }

  private async speakSegment(
    segment: SpeechSegment,
    options: SpeakOptions | undefined,
    gen: number
  ): Promise<void> {
    const clip = await this.lookupClip(segment);
    if (clip) {
      try {
        await this.playUrl(clip, this.playbackRate(options), gen);
        return;
      } catch {
        /* fall through to browser TTS */
      }
    }
    await this.speakBrowser(segment, options, gen);
  }

  private playbackRate(options?: SpeakOptions): number {
    const rate = options?.rate;
    if (rate !== undefined && rate < 0.55) return 0.78;
    return 1;
  }

  private async lookupClip(segment: SpeechSegment): Promise<string | null> {
    const manifest = await this.loadManifest();
    if (!manifest) return null;

    const keys =
      segment.kind === "phoneme"
        ? [`phoneme:${segment.text.toLowerCase()}`]
        : segment.lang === "en"
          ? [`en:${segment.text.toLowerCase()}`]
          : [`zh:${segment.text}`, `zh:${segment.text.replace(/～/g, "~")}`];

    for (const key of keys) {
      const rel = manifest[key];
      if (rel) return `${BASE_PATH}/audio/${rel}`;
    }
    return null;
  }

  private async loadManifest(): Promise<Record<string, string> | null> {
    if (this.manifest) return this.manifest;
    if (typeof window === "undefined") return null;
    if (!this.manifestPromise) {
      this.manifestPromise = fetch(`${BASE_PATH}/audio/manifest.json`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null)
        .then((data) => {
          this.manifest = data;
          return data;
        });
    }
    return this.manifestPromise;
  }

  private playUrl(url: string, playbackRate: number, gen: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isStale(gen)) {
        resolve();
        return;
      }
      const audio = new Audio(url);
      audio.playbackRate = playbackRate;
      audio.preload = "auto";
      this.currentAudio = audio;

      const finish = (ok: boolean, err?: Error) => {
        if (this.currentAudio === audio) this.currentAudio = null;
        if (!ok && err) reject(err);
        else resolve();
      };

      audio.onended = () => finish(true);
      audio.onerror = () => finish(false, new Error(`audio error: ${url}`));
      audio.play().catch((err: Error) => finish(false, err));
    });
  }

  private async speakBrowser(
    segment: SpeechSegment,
    options: SpeakOptions | undefined,
    gen: number
  ): Promise<void> {
    if (!this.synth) return;
    if (this.isStale(gen)) return;

    const voices = await this.getVoices();
    if (this.isStale(gen)) return;

    const spoken =
      segment.kind === "phoneme"
        ? PHONEME_HINTS[segment.text.toLowerCase()] || segment.text
        : segment.text;

    await new Promise<void>((resolve) => {
      if (this.isStale(gen) || !this.synth) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(spoken);
      const requestedRate = options?.rate;
      const scaffold = requestedRate !== undefined && requestedRate < 0.55;
      utterance.rate = scaffold
        ? requestedRate
        : segment.kind === "phoneme"
          ? 0.86
          : segment.lang === "zh"
            ? 1.02
            : 0.96;
      utterance.pitch = options?.pitch ?? (segment.lang === "zh" ? 1.06 : 1.08);
      utterance.lang = segment.lang === "zh" ? "zh-CN" : "en-US";

      const voice = pickVoice(voices, segment.lang);
      if (voice) utterance.voice = voice;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        if (!isCanceledError(event.error)) {
          /* keep UI moving even if a voice engine glitches */
        }
        resolve();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  private getVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.synth) return Promise.resolve([]);
    const immediate = this.synth.getVoices();
    if (immediate.length > 0) return Promise.resolve(immediate);
    if (!this.voicesPromise) {
      this.voicesPromise = new Promise((resolve) => {
        const done = () => {
          resolve(this.synth?.getVoices() ?? []);
        };
        this.synth?.addEventListener("voiceschanged", done, { once: true });
        setTimeout(done, 1500);
      });
    }
    return this.voicesPromise;
  }

  private isStale(gen: number): boolean {
    return gen !== this.generation;
  }

  private delay(ms: number, gen?: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (gen !== undefined && this.isStale(gen)) resolve();
        else resolve();
      }, ms);
    });
  }
}

export const speechService = new SpeechService();
