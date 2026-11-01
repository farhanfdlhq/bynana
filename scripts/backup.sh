#!/usr/bin/env bash
# Backup database dan foto. Hasilnya satu file .tar.gz per hari, disimpan 14 hari.
#   cd /opt/bynana && ./scripts/backup.sh
# Pengaturan opsional: BACKUP_DIR (bawaan /www/backup/bynana), KEEP_DAYS (bawaan 14).
set -euo pipefail
cd "$(dirname "$0")/.."

DATA_DIR="$(grep -E '^DATA_DIR=' .env 2>/dev/null | cut -d= -f2- || true)"
DATA_DIR="${DATA_DIR:-./data}"
BACKUP_DIR="${BACKUP_DIR:-/www/backup/bynana}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y-%m-%d_%H%M)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# Salinan database yang konsisten walaupun aplikasi sedang jalan (API backup SQLite).
NODE_BIN="${NODE_BIN:-/www/server/nodejs/v24.13.0/bin}"
[ -d "$NODE_BIN" ] && export PATH="$NODE_BIN:$PATH"
node -e "
const D = require('better-sqlite3');
const db = new D(process.argv[1], { readonly: true, fileMustExist: true });
db.backup(process.argv[2]).then(() => { db.close(); }).catch((e) => { console.error(e.message); process.exit(1); });
" "$DATA_DIR/bynana.sqlite" "$WORK/bynana.sqlite"

if [ -d "$DATA_DIR/uploads" ]; then cp -a "$DATA_DIR/uploads" "$WORK/uploads"; fi

OUT="$BACKUP_DIR/bynana-$STAMP.tar.gz"
tar -czf "$OUT" -C "$WORK" .
chmod 600 "$OUT"
find "$BACKUP_DIR" -name 'bynana-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup tersimpan: $OUT ($(du -h "$OUT" | cut -f1))"
