#!/bin/sh

set -eu

SUITE="test/cli-rules"
TMP="$PWD/.tmp"
mkdir -p "$TMP"

for test_case in $(find "$SUITE" -type d -depth 1)
do
  echo "================================="
  echo "TEST CASE: $test_case"
  echo "================================="

  OUTPUT="$TMP/$test_case/output"
  rm -rf "$OUTPUT"
  mkdir -p "$(dirname "$OUTPUT")"

  set +e
  node bin/cli.js --directory . --configuration "$test_case/config" \
    >> "$OUTPUT" 2>&1
  CODE="$?"
  set -e
  tail -n +2 "$test_case/expected" > "$TMP/$test_case/expected"
  EXPECTED_CODE="$(head -n 1 "$test_case/expected")"
  diff "$OUTPUT" "$TMP/$test_case/expected"

  if [ "$CODE" != "$EXPECTED_CODE" ]
  then
    echo "Exit code is expected to be $EXPECTED_CODE, but was $CODE"
    echo "The output is:"
    echo ""
    cat "$OUTPUT"
    exit 1
  fi

  echo "pass"
done
