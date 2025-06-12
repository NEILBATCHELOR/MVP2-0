#!/bin/bash
# Script to demonstrate how to use the new consolidated Hardhat configuration

# Default to localhost network if not specified
NETWORK=${1:-localhost}
TOKEN_TYPE=${2:-erc20}

# Create the directory if it doesn't exist
mkdir -p scripts

echo "Deploying $TOKEN_TYPE token to $NETWORK network..."

# Use the new consolidated configuration to run deployments
case $TOKEN_TYPE in
  erc20)
    echo "Deploying ERC20 token..."
    npx hardhat run src/contracts/essential/deploy-with-hardhat.ts --network $NETWORK
    ;;
  erc721)
    echo "Deploying ERC721 token..."
    npx hardhat run src/contracts/standard/erc721-deployment.ts --network $NETWORK
    ;;
  erc1155)
    echo "Deploying ERC1155 token..."
    npx hardhat run src/contracts/standard/erc1155-deployment.ts --network $NETWORK
    ;;
  erc1400)
    echo "Deploying ERC1400 token..."
    npx hardhat run src/contracts/detailed/ERC1400Detailed.ts --network $NETWORK
    ;;
  erc3525)
    echo "Deploying ERC3525 token..."
    npx hardhat run src/contracts/detailed/ERC3525Detailed.ts --network $NETWORK
    ;;
  erc4626)
    echo "Deploying ERC4626 token..."
    npx hardhat run src/contracts/detailed/ERC4626Detailed.ts --network $NETWORK
    ;;
  all)
    echo "Deploying all detailed tokens..."
    npx hardhat run src/contracts/detailed/deploy-all.ts --network $NETWORK
    ;;
  *)
    echo "Unknown token type: $TOKEN_TYPE"
    echo "Available types: erc20, erc721, erc1155, erc1400, erc3525, erc4626, all"
    exit 1
    ;;
esac

echo "Deployment complete!"