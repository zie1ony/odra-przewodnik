#!/usr/bin/env python3
"""Buduje tekst/part-N.json (wszystkie języki w jednym pliku) na podstawie
plików tekst/<lang>/part-N-pl-<lang>.txt.

Każdy plik źródłowy ma format blokowy (bloki oddzielone pustą linią):
  - blok przerwy:  jeden lub więcej tagów <break time="Xs"/>
  - blok tekstu:   linia po polsku + linia w danym języku

Wynik (tekst/part-N.json):
  {
    "name": "part-1",
    "lines": [
      {"kind": "break", "duration_seconds": 5},
      {"kind": "text", "pl": "...", "en": "...", "de": "...", ...}
    ]
  }
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEKST_DIR = ROOT / "tekst"

PARTS = ["part-1", "part-2", "part-3"]
LANGS = ["en", "de", "it", "es", "uk", "fr"]  # języki tłumaczeń (pl pochodzi z par)

BREAK_RE = re.compile(r'<break\s+time="(\d+(?:\.\d+)?)s"\s*/>')


def parse_file(path: Path):
    """Zwraca listę bloków: ('break', sekundy) lub ('text', pl, target)."""
    raw = path.read_text(encoding="utf-8").strip()
    blocks = re.split(r"\n\s*\n", raw)  # bloki oddzielone pustą linią
    items = []
    for block in blocks:
        lines = [ln for ln in block.splitlines() if ln.strip() != ""]
        if not lines:
            continue
        if all(BREAK_RE.search(ln) for ln in lines):
            seconds = sum(float(m) for ln in lines for m in BREAK_RE.findall(ln))
            secs = int(seconds) if seconds == int(seconds) else seconds
            items.append(("break", secs))
        else:
            if len(lines) != 2:
                raise ValueError(
                    f"{path}: oczekiwano bloku 2-liniowego (pl + tłumaczenie), "
                    f"otrzymano {len(lines)} linii:\n{block}"
                )
            items.append(("text", lines[0], lines[1]))
    return items


def build_part(part: str):
    parsed = {lang: parse_file(TEKST_DIR / lang / f"{part}-pl-{lang}.txt") for lang in LANGS}

    ref_lang = LANGS[0]
    ref = parsed[ref_lang]

    # Walidacja: identyczna struktura i ten sam polski oryginał we wszystkich plikach.
    for lang in LANGS[1:]:
        other = parsed[lang]
        if len(other) != len(ref):
            raise ValueError(
                f"{part}: różna liczba bloków: {ref_lang}={len(ref)}, {lang}={len(other)}"
            )
        for i, (a, b) in enumerate(zip(ref, other)):
            if a[0] != b[0]:
                raise ValueError(f"{part}: blok {i}: różny typ {ref_lang}={a[0]} vs {lang}={b[0]}")
            if a[0] == "text" and a[1] != b[1]:
                raise ValueError(
                    f"{part}: blok {i}: różny tekst PL między {ref_lang} a {lang}:\n"
                    f"  {ref_lang}: {a[1]}\n  {lang}: {b[1]}"
                )

    lines = []
    for i, item in enumerate(ref):
        if item[0] == "break":
            lines.append({"kind": "break", "duration_seconds": item[1]})
        else:
            entry = {"kind": "text", "pl": item[1]}
            for lang in LANGS:
                entry[lang] = parsed[lang][i][2]
            lines.append(entry)

    return {"name": part, "lines": lines}


def main() -> int:
    for part in PARTS:
        data = build_part(part)
        out = TEKST_DIR / f"{part}.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=4) + "\n", encoding="utf-8")
        n_text = sum(1 for l in data["lines"] if l["kind"] == "text")
        n_break = sum(1 for l in data["lines"] if l["kind"] == "break")
        print(f"{out}: {n_text} bloków tekstu, {n_break} przerw")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
