#!/bin/bash
# SSH tunnel to xserver MySQL (auto-reconnect)

KEY="/c/projects/SmartClock/twinklemark.key"
REMOTE_HOST="twinklemark@sv16114.xserver.jp"
REMOTE_PORT=10022
LOCAL_PORT=3307
REMOTE_MYSQL_PORT=3306

check_tunnel() {
  netstat -an 2>/dev/null | grep -q "127.0.0.1:${LOCAL_PORT}.*LISTENING"
}

start_tunnel() {
  echo "[$(date '+%H:%M:%S')] Starting SSH tunnel (localhost:${LOCAL_PORT} -> MySQL:${REMOTE_MYSQL_PORT})..."
  ssh -N \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -o ConnectTimeout=10 \
    -o StrictHostKeyChecking=no \
    -L ${LOCAL_PORT}:localhost:${REMOTE_MYSQL_PORT} \
    -i "${KEY}" \
    -p ${REMOTE_PORT} \
    "${REMOTE_HOST}"
}

# Kill existing tunnel if any stale process
if check_tunnel; then
  echo "SSH tunnel already running on port ${LOCAL_PORT}"
  exit 0
fi

echo "SSH Tunnel Manager - Press Ctrl+C to stop"
while true; do
  start_tunnel
  EXIT_CODE=$?
  echo "[$(date '+%H:%M:%S')] Tunnel exited (code: ${EXIT_CODE}). Reconnecting in 3s..."
  sleep 3
done
