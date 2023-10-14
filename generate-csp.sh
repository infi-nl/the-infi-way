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

# Get the text from the script tag.
scriptContent=$(htmlq -f 'src/template.html' -t 'script')
# Calculate the new hash.
hash=$(echo -n "$scriptContent" | openssl sha256 -binary | openssl base64)
# Replace the old hash in the CSP with the new hash.
# Note that we use '|' as the sed delimiter here, because '/' can be part of the hash.
newHtml=$(sed -E "s|^(.*sha256-).*('.*)$|\1$hash\2|" 'src/template.html')
# Save the newly generated file.
echo "$newHtml" > 'src/template.html'
