#!/usr/bin/env bash
# Update bynana di server dengan aman:
#   cd /opt/bynana && ./scripts/deploy.sh
# 1. Ambil kode terbaru dari GitHub.
# 2. Build di folder terpisah (build-next). Situs lama tetap jalan selama build.
# 3. Kalau build gagal, situs tidak disentuh.
# 4. Kalau berhasil, folder ditukar, aplikasi di-restart, lalu dicek.
#    Kalau situs tidak hidup, otomatis kembali ke versi sebelumnya.
# Pengaturan opsional: APP_NAME (nama Node Project di aaPanel, bawaan bynana), NODE_BIN.
set -euo pipefail
cd "$(dirname "$0")/.."

NODE_BIN="${NODE_BIN:-/www/server/nodejs/v24.13.0/bin}"
[ -d "$NODE_BIN" ] && export PATH="$NODE_BIN:$PATH"
if [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  echo "Node $(node -v) terlalu lama. Butuh Node 22 atau lebih baru. Atur NODE_BIN ke folder bin Node v24." >&2
  exit 1
fi
echo "==> Node $(node -v)"

if [ ! -f .env ]; then
  echo ".env belum ada. Salin dari .env.example lalu isi (lihat docs/DEPLOY-AAPANEL.md)." >&2
  exit 1
fi

# git pull bisa mengubah skrip ini sendiri, jadi skrip dimuat ulang setelah pull.
if [ "${DEPLOY_PULLED:-}" != "1" ]; then
  export LOCK_BEFORE="$(sha1sum package-lock.json | cut -d' ' -f1)"
  echo "==> Ambil kode terbaru"
  git pull --ff-only
  export DEPLOY_PULLED=1
  exec bash "$0" "$@"
fi

if [ ! -d node_modules ] || [ "${LOCK_BEFORE:-}" != "$(sha1sum package-lock.json | cut -d' ' -f1)" ]; then
  echo "==> Daftar paket berubah, pasang ulang"
  npm ci --include=dev --no-audit --no-fund
fi

echo "==> Build di folder sementara (situs tetap jalan)"
rm -rf build-next
if ! BUILD_OUT=build-next npm run build; then
  rm -rf build-next
  echo "" >&2
  echo "BUILD GAGAL. Situs tidak diubah dan tetap memakai versi sebelumnya." >&2
  exit 1
fi

echo "==> Tukar ke build baru"
rm -rf build-old
[ -d build ] && mv build build-old
mv build-next build

DATA_DIR_VALUE="$(grep -E '^DATA_DIR=' .env | cut -d= -f2- || true)"
PORT="$(grep -E '^PORT=' .env | cut -d= -f2- || true)"
PORT="${PORT:-3200}"
APP_NAME="${APP_NAME:-bynana}"
AAPANEL_SCRIPT="/www/server/nodejs/vhost/scripts/${APP_NAME}.sh"
AAPANEL_PID="/www/server/nodejs/vhost/pids/${APP_NAME}.pid"

if id www >/dev/null 2>&1; then
  chown -R www:www build ${DATA_DIR_VALUE:+"$DATA_DIR_VALUE"} 2>/dev/null || true
fi

healthy() { [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://127.0.0.1:${PORT}/robots.txt" || true)" = "200" ]; }

port_pids() {
  {
    command -v ss >/dev/null 2>&1 && ss -ltnpH "sport = :${PORT}" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2
    command -v lsof >/dev/null 2>&1 && lsof -t -iTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null
  } | grep -E '^[0-9]+$' | sort -u
}

restart_app() {
  if command -v pm2 >/dev/null 2>&1 && pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    echo "==> Restart lewat PM2 ($APP_NAME)"
    pm2 reload "$APP_NAME" --update-env >/dev/null
    return 0
  fi
  if [ -f "$AAPANEL_SCRIPT" ]; then
    echo "==> Restart lewat skrip aaPanel ($AAPANEL_SCRIPT)"
    local pids
    pids="$( { [ -f "$AAPANEL_PID" ] && cat "$AAPANEL_PID"; port_pids; } 2>/dev/null | grep -E '^[0-9]+$' | sort -u | tr '\n' ' ')"
    for pid in $pids; do pkill -TERM -P "$pid" 2>/dev/null || true; kill "$pid" 2>/dev/null || true; done
    for _ in $(seq 1 20); do healthy || break; sleep 0.5; done
    if id www >/dev/null 2>&1 && command -v runuser >/dev/null 2>&1 && ! grep -qE '(^|[^a-z])(su|sudo|runuser)[[:space:]]' "$AAPANEL_SCRIPT"; then
      mkdir -p /tmp/www-home && chown www /tmp/www-home
      runuser -u www -- env HOME=/tmp/www-home bash "$AAPANEL_SCRIPT" >/dev/null 2>&1 &
    else
      bash "$AAPANEL_SCRIPT" >/dev/null 2>&1 &
    fi
    return 0
  fi
  return 1
}

wait_healthy() {
  for _ in $(seq 1 60); do healthy && return 0; sleep 1; done
  return 1
}

if restart_app; then
  echo "==> Menunggu situs hidup lagi"
  if wait_healthy; then
    rm -rf build-old
    echo ""
    echo "Selesai. Versi baru sudah jalan di port ${PORT}."
  else
    echo "" >&2
    echo "Situs tidak menjawab setelah restart. Kembali ke versi sebelumnya..." >&2
    if [ -d build-old ]; then
      rm -rf build-failed && mv build build-failed && mv build-old build
      id www >/dev/null 2>&1 && chown -R www:www build
      restart_app >/dev/null || true
      if wait_healthy; then
        echo "Versi sebelumnya sudah jalan lagi. Build yang gagal disimpan di build-failed untuk diperiksa." >&2
      else
        echo "Versi sebelumnya juga tidak jalan. Cek log project '${APP_NAME}' di aaPanel." >&2
      fi
    fi
    exit 1
  fi
else
  echo ""
  echo "Build baru sudah siap, tapi cara restart otomatis tidak ditemukan."
  echo "Klik Restart pada project '${APP_NAME}' di aaPanel (Website > Node Project)."
fi
