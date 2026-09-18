#!/usr/bin/env python3
"""Generate neural TTS clips for PhonicsTeacher (Microsoft Aria / Xiaoxiao)."""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
DATA_TS = ROOT / "src" / "data" / "stage2-short-vowels.ts"
PHONEME_MAP = json.loads((ROOT / "src" / "data" / "phoneme-map.json").read_text())
OUT = ROOT / "public" / "audio"
MANIFEST_PATH = OUT / "manifest.json"

VOICE_EN = "en-US-AriaNeural"
VOICE_ZH = "zh-CN-XiaoxiaoNeural"

# Kid-friendly but still natural — not the old 0.7 "drowsy robot" rate.
EN_RATE = "-8%"
EN_PITCH = "+8Hz"
ZH_RATE = "+4%"
ZH_PITCH = "+6Hz"

CONCURRENCY = 4

# L5 audio-option spelling tricks (must match src/lib/learning-engine.ts)
LONG_SPELLING = {"a": "ay", "e": "ee", "i": "igh", "o": "oa", "u": "oo"}
WRONG_SPELLING = {"a": "e", "e": "a", "i": "e", "o": "u", "u": "o"}

ZH_PHRASES = [
    "准备好学新规则了吗？",
    "张大嘴巴，跟我一起说！",
    "准备好练习了吗？",
    "仔细听！有这个音吗？",
    "听一听，是哪个词？",
    "没错！",
    "对啦！这个词就是",
    "这是",
    "它有这个音哦",
    "它没有这个音哦",
    "正确答案是",
    "再听一次？",
    "听词拼字！把字母拖到方格里～",
    "太棒了！",
    "换一换，变成新词！",
    "把",
    "换成",
    "不是",
    "再试一次！",
    "厉害！",
    "用你学的规则，读这个词！听听看哪个发音是对的？",
    "牛！你用规则读出了一个没见过的词！",
    "想想短元音怎么发～再听一次！",
    "练习薄弱环节，越来越棒！",
    "没有需要复习的规则！",
    "完成学习赢星星！",
    "点喇叭听发音",
    "点喇叭听单词",
    "点喇叭听3遍，跟着读！",
    "每个词都能点来听！",
    "听一听，它们没有今天的音！",
    "现在就来做练习吧",
    "apple 里就有这个音！",
    "egg 的第一个音就是它！",
    "igloo 的第一个音！",
    "octopus 的第一个音！",
    "umbrella 的第一个音！",
    "张大嘴巴，发 aaaa，像咬一口大苹果",
    "嘴巴微微张开，发 ehhh，像看到小老鼠轻轻叫一声",
    "嘴巴微微笑，发 i-i-i，像小老鼠吱吱叫",
    "嘴巴圆圆，发 o-o-o，像一只小青蛙呱呱叫",
    "嘴巴微微张开，发 u-u-u，像肚子饿的时候叫一声",
    "今天我们来学短元音 Aa！",
    "今天我们来学短元音 Ee！",
    "今天我们来学短元音 Ii！",
    "今天我们来学短元音 Oo！",
    "今天我们来学短元音 Uu！",
    '听这些词，都有 "a" 的音！',
    '听这些词，都有 "e" 的音！',
    '听这些词，都有 "i" 的音！',
    '听这些词，都有 "o" 的音！',
    '听这些词，都有 "u" 的音！',
    '这个没有 "a" 的音：',
    '这个没有 "e" 的音：',
    '这个没有 "i" 的音：',
    '这个没有 "o" 的音：',
    '这个没有 "u" 的音：',
    "已经掌握了 1 个规则！",
    "已经掌握了 2 个规则！",
    "已经掌握了 3 个规则！",
    "已经掌握了 4 个规则！",
    "已经掌握了 5 个规则！",
]


def extract_quoted_words(text: str) -> set[str]:
    return set(re.findall(r'["\']([a-z]+)["\']', text))


def audio_option_variants(word: str) -> list[str]:
    chars = list(word)
    if len(chars) < 2:
        return [word]
    vowel = chars[1]
    if vowel not in LONG_SPELLING:
        return [word]
    long_word = "".join(chars[:1] + [LONG_SPELLING[vowel]] + chars[2:])
    wrong_word = "".join(chars[:1] + [WRONG_SPELLING[vowel]] + chars[2:])
    return [word, long_word, wrong_word]


def zh_key(text: str) -> str:
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]
    return digest


async def synthesize(text: str, voice: str, dest: Path, rate: str, pitch: str) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 1000:
        return
    last_err: Exception | None = None
    for attempt in range(4):
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            await communicate.save(str(dest))
            if dest.exists() and dest.stat().st_size > 500:
                return
            last_err = RuntimeError(f"tiny file for {text!r}")
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            await asyncio.sleep(0.6 * (attempt + 1))
    raise RuntimeError(f"failed {text!r}: {last_err}")


async def main() -> None:
    source = DATA_TS.read_text(encoding="utf-8")
    words = extract_quoted_words(source)
    words.update(["apple", "egg", "igloo", "octopus", "umbrella"])

    extra: set[str] = set()
    for word in list(words):
        extra.update(audio_option_variants(word))
    words.update(extra)

    # Keep only plausible TTS tokens (letters/words, not ids like short_a)
    words = {w for w in words if re.fullmatch(r"[a-z]+", w) and w not in {"short", "id"}}

    jobs: list[tuple[str, str, str, Path, str, str]] = []
    manifest: dict[str, str] = {}

    for word in sorted(words):
        rel = f"en/{word}.mp3"
        dest = OUT / rel
        jobs.append((f"en:{word}", word, VOICE_EN, dest, EN_RATE, EN_PITCH))
        manifest[f"en:{word}"] = rel

    for letter, spoken in PHONEME_MAP.items():
        rel = f"phoneme/{letter}.mp3"
        dest = OUT / rel
        jobs.append((f"phoneme:{letter}", spoken, VOICE_EN, dest, EN_RATE, EN_PITCH))
        manifest[f"phoneme:{letter}"] = rel

    for phrase in ZH_PHRASES:
        rel = f"zh/{zh_key(phrase)}.mp3"
        dest = OUT / rel
        jobs.append((f"zh:{phrase}", phrase, VOICE_ZH, dest, ZH_RATE, ZH_PITCH))
        manifest[f"zh:{phrase}"] = rel

    OUT.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    done = 0
    total = len(jobs)

    async def run_job(job: tuple[str, str, str, Path, str, str]) -> None:
        nonlocal done
        _key, text, voice, dest, rate, pitch = job
        async with sem:
            await synthesize(text, voice, dest, rate, pitch)
            done += 1
            if done % 20 == 0 or done == total:
                print(f"  {done}/{total}", flush=True)

    print(f"Generating {total} clips ({len(words)} english, {len(PHONEME_MAP)} phonemes, {len(ZH_PHRASES)} zh)...")
    results = await asyncio.gather(*(run_job(j) for j in jobs), return_exceptions=True)
    failures = [r for r in results if isinstance(r, Exception)]
    if failures:
        print(f"Failures: {len(failures)}", file=sys.stderr)
        for err in failures[:8]:
            print(f"  {err}", file=sys.stderr)
        sys.exit(1)

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {MANIFEST_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
