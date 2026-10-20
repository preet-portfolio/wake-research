#!/bin/sh
# usage: tools/plotcheck.sh <in.svg> [--paper a3] [--pen 0.3]
cd "$(dirname "$0")/.." && exec .venv/bin/python tools/plotcheck.py "$@"
