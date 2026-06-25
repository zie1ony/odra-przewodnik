#!/usr/bin/env python3
"""Montaż mp3 przewodnika z pliku JSON przy użyciu ElevenLabs.

Tryby:
    # pojedynczy plik z pełną kontrolą:
    python generate.py --input part-1.json --lines 4 --langs pl,en \
        --output resources/en/part-1-pl-en.mp3

    # wszystkie części (part-1..3) dla podanych języków:
    python generate.py all-parts pl,en
        → audio/en/part-1-pl-en.mp3, audio/en/part-2-pl-en.mp3, audio/en/part-3-pl-en.mp3

Każda linia każdego języka jest generowana osobno w ElevenLabs i zapisywana
w pamięci podręcznej:
    lines/<język>/<part-name>/<line_index>_<hash>.mp3
gdzie hash = pierwsze 6 znaków md5 tekstu danej linii. Dzięki temu ta sama
linia generowana jest tylko raz. Na końcu fragmenty są sklejane z przerwami:
    - w obrębie linii tekstu: <język1> + 1s + <język2> + ...
    - między kolejnymi liniami tekstu: 1s
    - wpis "break": cisza o długości duration_seconds

Klucz API i (opcjonalnie) głos/parametry pobierane są z pliku .env:
    ELEVENLABS_API_KEY=...
    ELEVENLABS_VOICE_ID=...        # opcjonalne
    ELEVENLABS_MODEL_ID=...        # opcjonalne, domyślnie eleven_multilingual_v2
    ELEVENLABS_STABILITY=0.5       # Stability
    ELEVENLABS_SIMILARITY=0.75     # Similarity
    ELEVENLABS_STYLE=0.0           # Style exaggeration
    ELEVENLABS_SPEAKER_BOOST=true  # Speaker boost
    ELEVENLABS_SPEED=1.0           # Speed

Wymaga ffmpeg w PATH (pydub). Uwaga: klucz pamięci podręcznej zależy tylko od
tekstu — po zmianie głosu lub parametrów wyczyść katalog lines/, aby przegenerować.
"""
import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from pydub import AudioSegment

ROOT = Path(__file__).resolve().parent
TEKST_DIR = ROOT / "tekst"
LINES_DIR = ROOT / "lines"
AUDIO_DIR = ROOT / "audio"

# Domyślny głos (Rachel) i model wspierający wiele języków.
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
DEFAULT_MODEL_ID = "eleven_multilingual_v2"

LANG_GAP_MS = 1000   # cisza między językami w obrębie jednej linii
LINE_GAP_MS = 1000   # cisza między kolejnymi liniami tekstu

ALL_PARTS = ["part-1", "part-2", "part-3"]


def env_float(name, default):
    val = os.getenv(name)
    return float(val) if val not in (None, "") else default


def line_hash(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()[:6]


def make_client():
    """Tworzy klienta i ustawienia głosu z .env. Zwraca (client, vinfo) lub None."""
    load_dotenv(ROOT / ".env")
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("Błąd: brak ELEVENLABS_API_KEY w pliku .env", file=sys.stderr)
        return None

    vinfo = {
        "voice_id": os.getenv("ELEVENLABS_VOICE_ID", DEFAULT_VOICE_ID),
        "model_id": os.getenv("ELEVENLABS_MODEL_ID", DEFAULT_MODEL_ID),
        "voice_settings": VoiceSettings(
            stability=env_float("ELEVENLABS_STABILITY", 0.5),
            similarity_boost=env_float("ELEVENLABS_SIMILARITY", 0.75),
            style=env_float("ELEVENLABS_STYLE", 0.0),
            use_speaker_boost=os.getenv("ELEVENLABS_SPEAKER_BOOST", "true").lower()
                in ("1", "true", "t", "tak", "yes"),
            speed=env_float("ELEVENLABS_SPEED", 1.0),
        ),
    }
    return ElevenLabs(api_key=api_key), vinfo


def synth_line(client, vinfo, lang, part, idx, text):
    """Zwraca ścieżkę mp3 dla danej linii/języka, generując ją w razie potrzeby."""
    cache_path = LINES_DIR / lang / part / f"{idx}_{line_hash(text)}.mp3"
    if cache_path.exists():
        print(f"  cache: {cache_path.relative_to(ROOT)}")
        return cache_path

    print(f"  ElevenLabs [{lang}] linia {idx}: {text[:50]}…")
    audio = client.text_to_speech.convert(
        voice_id=vinfo["voice_id"],
        model_id=vinfo["model_id"],
        text=text,
        output_format="mp3_44100_128",
        voice_settings=vinfo["voice_settings"],
    )
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    with open(cache_path, "wb") as f:
        for chunk in audio:
            if chunk:
                f.write(chunk)
    return cache_path


def render(client, vinfo, in_path, n_lines, langs, out_path, force):
    """Buduje pojedynczy plik mp3 z części JSON. Zwraca True przy sukcesie."""
    if not in_path.is_file():
        print(f"Błąd: nie znaleziono pliku JSON {in_path}", file=sys.stderr)
        return False

    data = json.loads(in_path.read_text(encoding="utf-8"))
    part = data["name"]
    all_lines = data["lines"]
    selected = all_lines if n_lines is None else all_lines[:n_lines]

    if out_path.exists() and not force:
        ans = input(f"{out_path} już istnieje. Nadpisać? [t/N] ").strip().lower()
        if ans not in ("t", "tak", "y", "yes"):
            print("Przerwano.")
            return True

    print(f"Wejście: {in_path}  ({part})")
    print(f"Linie: {len(selected)} z {len(all_lines)} | języki: {', '.join(langs)}")

    # Segmenty per linia z informacją o typie (do wstawiania przerw między liniami).
    segments = []
    for idx, line in enumerate(selected):
        kind = line.get("kind")
        if kind == "break":
            secs = line.get("duration_seconds", 0)
            segments.append(("break", AudioSegment.silent(duration=int(secs * 1000))))
        elif kind == "text":
            print(f"Linia {idx} (text):")
            seg = AudioSegment.empty()
            for j, lang in enumerate(langs):
                if lang not in line:
                    print(f"Błąd: linia {idx} nie ma języka '{lang}'", file=sys.stderr)
                    return False
                if j > 0:
                    seg += AudioSegment.silent(duration=LANG_GAP_MS)
                seg += AudioSegment.from_mp3(synth_line(client, vinfo, lang, part, idx, line[lang]))
            segments.append(("text", seg))
        else:
            print(f"Ostrzeżenie: pomijam wpis {idx} o nieznanym kind={kind!r}")

    final = AudioSegment.empty()
    prev_kind = None
    for kind, seg in segments:
        if prev_kind == "text" and kind == "text":
            final += AudioSegment.silent(duration=LINE_GAP_MS)
        final += seg
        prev_kind = kind

    out_path.parent.mkdir(parents=True, exist_ok=True)
    final.export(out_path, format="mp3")
    print(f"Zapisano: {out_path}  ({len(final) / 1000:.1f}s)\n")
    return True


def parse_langs(value):
    langs = [c.strip() for c in value.split(",") if c.strip()]
    if not langs:
        print("Błąd: lista języków jest pusta", file=sys.stderr)
    return langs


def main() -> int:
    # Tryb wsadowy: generate.py all-parts <języki>
    if len(sys.argv) >= 2 and sys.argv[1] == "all-parts":
        ap = argparse.ArgumentParser(prog="generate.py all-parts")
        ap.add_argument("langs", help="kody języków po przecinku, np. pl,en")
        args = ap.parse_args(sys.argv[2:])
        langs = parse_langs(args.langs)
        if not langs:
            return 1

        ready = make_client()
        if ready is None:
            return 1
        client, vinfo = ready

        suffix = "-".join(langs)
        for part in ALL_PARTS:
            in_path = TEKST_DIR / f"{part}.json"
            out_path = AUDIO_DIR / langs[-1] / f"{part}-{suffix}.mp3"
            # tryb wsadowy nadpisuje istniejące pliki bez pytania
            if not render(client, vinfo, in_path, None, langs, out_path, force=True):
                return 1
        return 0

    # Tryb pojedynczego pliku
    parser = argparse.ArgumentParser(
        description="Montaż mp3 przewodnika z pliku JSON (ElevenLabs)."
    )
    parser.add_argument("--input", required=True,
                        help="plik JSON, np. part-1.json (szukany też w tekst/)")
    parser.add_argument("--lines", type=int, default=None,
                        help="weź pierwsze N wpisów z lines (domyślnie wszystkie)")
    parser.add_argument("--langs", required=True,
                        help="kody języków po przecinku, w kolejności, np. pl,en")
    parser.add_argument("--output", required=True, help="docelowy plik mp3")
    parser.add_argument("-f", "--force", action="store_true",
                        help="nadpisz output bez pytania")
    args = parser.parse_args()

    langs = parse_langs(args.langs)
    if not langs:
        return 1

    in_path = Path(args.input)
    if not in_path.is_file():
        in_path = TEKST_DIR / args.input

    ready = make_client()
    if ready is None:
        return 1
    client, vinfo = ready

    ok = render(client, vinfo, in_path, args.lines, langs, Path(args.output), args.force)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
