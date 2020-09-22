#!/bin/bash

CWD=$(dirname "$0" && pwd)
ROOT=$(cd $CWD && cd .. && pwd)

set -x

OUT=$ROOT/src/img/icon
mkdir -p $OUT
for px in 16 32 48 128; do
  convert -geometry ${px}x${px} $CWD/"coco.png" $OUT/${px}.png
done

OUT=$ROOT/src/img
mkdir -p $OUT
convert -geometry 360x $CWD/"cocopy.png" $OUT/logo.png
convert -geometry 360x $CWD/"cocopy.png" $CWD/img/logo.png
