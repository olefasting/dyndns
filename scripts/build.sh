#!/usr/bin/env bash
deno compile --allow-env --allow-read="/etc/dyndns.env" --allow-net --env-file=/etc/dyndns.env --output=build/dyndns src/main.ts
