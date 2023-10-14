#!/usr/bin/env bash
set -euo pipefail

if [ ! "$(command -v htmlq)" ]
then
  echo 'htmlq is required for this script'
  exit 1
fi

if [ ! "$(command -v openssl)" ]
then
  echo 'openssl is required for this script'
  exit 1
fi

scriptContent=$(htmlq -f 'src/template.html' -t 'script')
hash=$(echo -n "$scriptContent" | openssl sha256 -binary | openssl base64)
