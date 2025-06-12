# Blockchain Adapters Dependencies Installation Script
#!/bin/bash

echo "Installing blockchain dependencies..."

# Install Ripple (XRP) library
npm install --save ripple-lib@1.10.1

# Install Solana libraries
npm install --save @solana/web3.js@1.98.0 @solana/spl-token@0.4.13

# Install NEAR Protocol libraries
npm install --save near-api-js@5.1.1 bn.js@5.2.1

# Install other common blockchain tools
npm install --save ethers@5.7.2 

echo "All blockchain dependencies installed successfully!"
echo "Note: If you encounter any TypeScript errors, you may need to add appropriate type declarations."
