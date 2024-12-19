#!/bin/bash
SCRIPT_PATH=$(dirname $(realpath -s $0))

rm -rf \
    $SCRIPT_PATH/../node_modules \
    $SCRIPT_PATH/../client/tsconfig.tsbuildinfo \
    $SCRIPT_PATH/../out
