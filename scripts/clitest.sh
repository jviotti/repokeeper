#!/bin/sh

set -e
ARGV_TESTS="$*"
set -u

if [ -z "$ARGV_TESTS" ]
then
  echo "Pass test files as command line arguments" 1>&2
  exit 1
fi

for definition in $ARGV_TESTS
do
  echo "#### $definition"

  command="$(head -n 1 "$definition" | cut -f 2- -d ' ')"
  set +e
  output="$($command 2>&1)"
  code="$?"
  set -e

  expected_output="$(tail -n +2 "$definition")"
  if [ "$output" != "$expected_output" ]
  then
    echo ">>>> EXPECTED" 1>&2
    echo "$expected_output" 1>&2
    echo ">>>> RECEIVED" 1>&2
    echo "$output" 1>&2
    exit 1
  fi

  expected_code="$(head -n 1 "$definition" | cut -f 1 -d ' ')"
  if [ "$code" != "$expected_code" ]
  then
    echo "Expected exit code $expected_code. Got $code" 1>&2
    exit 1
  fi

  echo ">>>> PASS"
done
