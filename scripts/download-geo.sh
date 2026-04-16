#!/bin/bash
set -e

BASE_URL="https://geo.datav.aliyun.com/areas_v3/bound"
OUT_DIR="public/geo"

mkdir -p "$OUT_DIR"

# National boundary (province borders)
echo "Downloading 100000_full.json ..."
curl -sS -o "$OUT_DIR/100000_full.json" "$BASE_URL/100000_full.json"

# Whole-region codes (municipalities, Taiwan, HK, Macau) - no _full suffix
WHOLE_CODES="110000 120000 310000 500000 710000 810000 820000"

# All province adcodes
ALL_CODES="110000 120000 130000 140000 150000 210000 220000 230000 310000 320000 330000 340000 350000 360000 370000 410000 420000 430000 440000 450000 460000 500000 510000 520000 530000 540000 610000 620000 630000 640000 650000 710000 810000 820000"

for code in $ALL_CODES; do
  if echo "$WHOLE_CODES" | grep -qw "$code"; then
    file="${code}.json"
  else
    file="${code}_full.json"
  fi
  echo "Downloading $file ..."
  curl -sS -o "$OUT_DIR/$file" "$BASE_URL/$file"
done

echo "Done! All GeoJSON files saved to $OUT_DIR/"
