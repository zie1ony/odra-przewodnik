#!/usr/bin/env python3
"""Zamiana plików tekstowych przewodnika na mp3 przy użyciu ElevenLabs.

Użycie:
    python generate.py <język> <część>
    python generate.py de part-1

Czyta:    tekst/<język>/<część>-pl-<język>.txt
Zapisuje: resources/<język>/<część>-pl-<język>.mp3

Klucz API i (opcjonalnie) głos pobierane są z pliku .env:
    ELEVENLABS_API_KEY=...
    ELEVENLABS_VOICE_ID=...      # opcjonalne, domyślnie głos poniżej
    ELEVENLABS_MODEL_ID=...      # opcjonalne, domyślnie eleven_multilingual_v2
"""
import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings

ROOT = Path(__file__).resolve().parent
TEKST_DIR = ROOT / "tekst"
OUT_DIR = ROOT / "resources"

# Domyślny głos (Rachel) i model wspierający wiele języków oraz tagi <break/>.
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
DEFAULT_MODEL_ID = "eleven_multilingual_v2"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generuje mp3 z pliku tekstowego przewodnika (ElevenLabs)."
    )
    parser.add_argument("lang", help="kod języka, np. de, en, it, es, uk, fr")
    parser.add_argument("part", help="nazwa części, np. part-1")
    parser.add_argument(
        "-f", "--force", action="store_true",
        help="nadpisz istniejący plik mp3 bez pytania"
    )
    args = parser.parse_args()

    load_dotenv(ROOT / ".env")
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("Błąd: brak ELEVENLABS_API_KEY w pliku .env", file=sys.stderr)
        return 1

    voice_id = os.getenv("ELEVENLABS_VOICE_ID", DEFAULT_VOICE_ID)
    model_id = os.getenv("ELEVENLABS_MODEL_ID", DEFAULT_MODEL_ID)

    # Ustawienia głosu — odpowiadają suwakom na stronie ElevenLabs.
    def env_float(name, default):
        val = os.getenv(name)
        return float(val) if val not in (None, "") else default

    voice_settings = VoiceSettings(
        stability=env_float("ELEVENLABS_STABILITY", 0.5),          # Stability
        similarity_boost=env_float("ELEVENLABS_SIMILARITY", 0.75), # Similarity
        style=env_float("ELEVENLABS_STYLE", 0.0),                  # Style exaggeration
        use_speaker_boost=os.getenv("ELEVENLABS_SPEAKER_BOOST", "true").lower()
            in ("1", "true", "t", "tak", "yes"),                   # Speaker boost
        speed=env_float("ELEVENLABS_SPEED", 1.0),                  # Speed
    )

    filename = f"{args.part}-pl-{args.lang}.txt"
    in_path = TEKST_DIR / args.lang / filename
    out_path = OUT_DIR / args.lang / f"{args.part}-pl-{args.lang}.mp3"

    if not in_path.is_file():
        print(f"Błąd: nie znaleziono pliku {in_path}", file=sys.stderr)
        return 1

    text = in_path.read_text(encoding="utf-8").strip()
    if not text:
        print(f"Błąd: plik {in_path} jest pusty", file=sys.stderr)
        return 1

    if out_path.exists() and not args.force:
        ans = input(f"{out_path} już istnieje. Nadpisać? [t/N] ").strip().lower()
        if ans not in ("t", "tak", "y", "yes"):
            print("Przerwano.")
            return 0

    print(f"Czytam:   {in_path}")
    print(f"Głos: {voice_id} | model: {model_id}")
    print("Generuję audio w ElevenLabs…")

    client = ElevenLabs(api_key=api_key)
    audio = client.text_to_speech.convert(
        voice_id=voice_id,
        model_id=model_id,
        text=text,
        output_format="mp3_44100_128",
        voice_settings=voice_settings,
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as f:
        for chunk in audio:
            if chunk:
                f.write(chunk)

    print(f"Zapisano: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
