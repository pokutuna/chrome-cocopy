#!/bin/bash

CWD=$(dirname "$0" && pwd)
ROOT=$(cd $CWD && cd .. && pwd)
IN="coco.png"
OUT=$ROOT/src/img/icon

set -x
mkdir -p $OUT
for px in 16 32 48 128; do
  convert -geometry ${px}x${px} $CWD/$IN $OUT/${px}.png
done
