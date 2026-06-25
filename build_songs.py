#!/usr/bin/env python3
"""Buduje audio/songs/songs.json — listę utworów do zakładki „Muzyka”.

Skanuje audio/songs/*.mp3 i zapisuje manifest (statyczny hosting nie pozwala
listować katalogu, więc aplikacja czyta tę listę). Tytuł powstaje z nazwy pliku
po usunięciu rozszerzenia i końcowego znacznika [id].
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SONGS_DIR = ROOT / "audio" / "songs"


def main() -> int:
    items = []
    for p in sorted(SONGS_DIR.glob("*.mp3")):
        title = re.sub(r"\s*\[[^\]]*\]\s*$", "", p.stem).strip()
        items.append({"file": p.name, "title": title})

    out = SONGS_DIR / "songs.json"
    out.write_text(json.dumps({"songs": items}, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    print(f"{len(items)} utworów → {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
