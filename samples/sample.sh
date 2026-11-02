#!/usr/bin/env bash
set -euo pipefail

# Inspect a Compose configuration without starting services.
project_dir="${1:-.}"
compose_file="$project_dir/compose.yaml"

show_services() {
  if [[ ! -f "$compose_file" ]]; then
    printf 'Missing Compose file: %s\n' "$compose_file" >&2
    return 1
  fi

  local service
  while IFS= read -r service; do
    printf 'Service: %s\n' "$service"
  done < <(docker compose -f "$compose_file" config --services)
}

case "${2:-list}" in
  list) show_services ;;
  *) printf 'Usage: %s [directory] [list]\n' "$0" >&2; exit 2 ;;
esac
