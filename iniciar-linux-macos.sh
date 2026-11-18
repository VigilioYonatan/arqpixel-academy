#!/usr/bin/env sh
# ARQPIXEL Academy: inicia la aplicación local, sin npm ni cuenta.
set -eu
cd "$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server 4173 --bind 127.0.0.1 --directory dist
else
  echo "Se requiere Python 3 para servir los archivos de dist/" >&2
  exit 1
fi
