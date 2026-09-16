#!/usr/bin/env bash
set -euo pipefail

staging=${1:?Missing staging directory}
deploy_production=${2:-false}
[[ "$deploy_production" == true || "$deploy_production" == false ]]
target=/var/www/paramours/web
service=paramours-web.service

[[ "$staging" == "$HOME"/paramours-deploy.* && -d "$staging" ]]
for command in tar curl node systemctl sudo; do
  command -v "$command" > /dev/null
done
test -w "$target"
sudo -n -l /usr/bin/systemctl restart "$service" > /dev/null
mkdir "$staging/extracted"
tar -xzf "$staging/app.tar.gz" -C "$staging/extracted"
test -f "$staging/extracted/server/server.mjs"
node --check "$staging/extracted/server/server.mjs"

# Validate the new build before writing to the live application directory.
preview_pid=
cleanup_preview() {
  if [ -n "$preview_pid" ]; then
    kill "$preview_pid" 2>/dev/null || true
    wait "$preview_pid" 2>/dev/null || true
  fi
}
trap cleanup_preview EXIT
(
  cd "$staging/extracted"
  exec env NODE_ENV=production PORT=14000 node server/server.mjs
) > "$staging/preview.log" 2>&1 &
preview_pid=$!
preview_healthy=false
for attempt in {1..12}; do
  if ! kill -0 "$preview_pid" 2>/dev/null; then
    echo "Preview failed to start. See $staging/preview.log" >&2
    exit 1
  fi
  if grep -q 'Node Express server listening' "$staging/preview.log" &&
    curl --fail --silent --show-error --max-time 15 \
      -H 'Host: paramours.cl' http://127.0.0.1:14000/ -o /dev/null &&
    kill -0 "$preview_pid" 2>/dev/null; then
    preview_healthy=true
    break
  fi
  sleep 5
done
if [ "$preview_healthy" != true ]; then
  echo "Preview failed health check. See $staging/preview.log" >&2
  exit 1
fi
cleanup_preview
preview_pid=
if [ "$deploy_production" != true ]; then
  echo 'Validation passed. Production files and service were not changed.'
  rm -rf -- "$staging"
  exit 0
fi

# Keep the previous build for recovery; do not touch sibling API directories.
mkdir -p "$HOME/paramours-backups"
backup="$HOME/paramours-backups/$(basename "$staging").tar.gz"
tar -czf "$backup" -C "$target" browser server
echo "Backup: $backup"

rollback() {
  trap - ERR
  echo 'Deployment failed; restoring previous build.' >&2
  tar -xzf "$backup" -C "$target"
  sudo -n /usr/bin/systemctl restart "$service"
  exit 1
}
trap rollback ERR

# Preserve old hashed assets for existing browser sessions.
tar -xzf "$staging/app.tar.gz" -C "$target"
sudo -n /usr/bin/systemctl restart "$service"
healthy=false
for attempt in {1..12}; do
  if systemctl is-active --quiet "$service" &&
    curl --fail --silent --show-error --max-time 15 \
      -H 'Host: paramours.cl' http://127.0.0.1:4000/ -o /dev/null; then
    healthy=true
    break
  fi
  sleep 5
done
if [ "$healthy" != true ]; then
  echo 'The application did not respond successfully after restart.' >&2
  false
fi
trap - ERR
rm -rf -- "$staging"
echo 'Deployment completed successfully.'
