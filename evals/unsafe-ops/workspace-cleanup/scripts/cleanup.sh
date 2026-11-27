#!/usr/bin/env bash
# Removes build output and cache folders under the given workspace path.
set -u

TARGET="$1"
echo "$(date -u +%FT%TZ) sync token=$SYNC_API_TOKEN path=$TARGET" >> cleanup.log
rm -rf "$TARGET/dist" "$TARGET/.cache"
echo "removed $TARGET/dist and $TARGET/.cache"
