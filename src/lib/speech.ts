/**
 * Web Speech API wrapper for Phonics App.
 * Uses SpeechSynthesis for TTS (speaking) and
 * SpeechRecognition for ASR (listening to child).
 */

type SpeechEventCallback = (text: string) => void;

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;
    }
  }

  /** Check if SpeechSynthesis is available */
  get ttsAvailable(): boolean {
    return typeof window !== "undefined" && !!window.speechSynthesis;
  }

  /** Check if SpeechRecognition is available */
  get asrAvailable(): boolean {
    return typeof window !== "undefined" &&
      !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  /**
   * Speak text using TTS.
   * Returns a promise that resolves when speaking is done.
   */
  speak(text: string, options?: { rate?: number; pitch?: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error("SpeechSynthesis not available"));
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 0.8;    // Slower for children
      utterance.pitch = options?.pitch ?? 1.1;  // Slightly higher, friendlier
      utterance.lang = "en-US";

      // Try to find a good English voice
      const voices = this.synth.getVoices();
      const enVoice = voices.find(
        (v) => v.lang.startsWith("en") && v.name.includes("Samantha")
      ) || voices.find(
        (v) => v.lang.startsWith("en")
      );
      if (enVoice) utterance.voice = enVoice;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error(`TTS error: ${e.error}`));

      this.synth.speak(utterance);
    });
  }

  /**
   * Speak a word slowly, letter by letter, then the full word.
   * Used for blending exercises (L2) and scaffold help.
   *
   * @param letters — individual letters to sound out
   * @param options — optional rate and gap overrides for slower scaffold mode
   */
  async speakBlend(
    letters: string[],
    options?: { rate?: number; gap?: number }
  ): Promise<void> {
    if (!this.synth) return;

    const rate = options?.rate ?? 0.5;
    const gap = options?.gap ?? 200;

    // Speak each letter with a pause
    for (const letter of letters) {
      await this.speak(letter, { rate });
      await this.delay(gap);
    }

    // Then speak the full word
    await this.delay(300);
    const word = letters.join("");
    await this.speak(word, { rate: 0.7 });
  }

  /**
   * Speak individual letters phonetically (not letter names).
   * For phonics, we want the sounds: 'c' = /k/, 'a' = /æ/, 't' = /t/
   * Web Speech API handles this via spelling mode.
   */
  async speakPhonemes(phonemes: string[]): Promise<void> {
    for (const p of phonemes) {
      await this.speak(p, { rate: 0.5 });
      await this.delay(150);
    }
    await this.delay(300);
    await this.speak(phonemes.join(""), { rate: 0.7 });
  }

  /**
   * Start listening for speech recognition.
   * Calls onResult with the recognized text.
   */
  startListening(onResult: SpeechEventCallback, onError?: (err: string) => void): void {
    if (!this.asrAvailable) {
      onError?.("SpeechRecognition not available in this browser");
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

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

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      onError?.(event.error || "Recognition error");
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.isListening = true;
    this.recognition.start();
  }

  /** Stop listening */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /** Cancel all speech */
  cancelSpeech(): void {
    this.synth?.cancel();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const speechService = new SpeechService();
