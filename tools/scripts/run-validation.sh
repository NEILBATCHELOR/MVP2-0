#!/bin/bash

# Run the validation script and capture the output
NODE_OPTIONS="--loader ts-node/esm" ts-node --esm scripts/validate-types.ts > validation_results.txt 2>&1

# Display the output
cat validation_results.txt 