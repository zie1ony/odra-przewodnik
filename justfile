default:
    just -l

# Serwer deweloperski (audio i tak jest cache'owane lokalnie w przeglądarce).
serve:
    python3 -m http.server 8000

gen-all:
    python3 generate.py all-parts pl,de
    python3 generate.py all-parts pl,en
    python3 generate.py all-parts pl,en
    python3 generate.py all-parts pl,es
    python3 generate.py all-parts pl,fr
    python3 generate.py all-parts pl,it
    python3 generate.py all-parts pl,uk
