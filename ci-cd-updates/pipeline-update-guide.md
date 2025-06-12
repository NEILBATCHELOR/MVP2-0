# CI/CD Pipeline Updates
To finish this migration, make the following changes to your CI/CD pipeline configuration:

1. Update build scripts to use the root hardhat.config.ts:
   - Replace: `cd src/contracts/detailed && npx hardhat compile`
   - With: `npx hardhat compile`

2. Update test scripts to use root configuration:
   - Replace: `cd src/contracts/standard && npx hardhat test`
   - With: `npx hardhat test src/contracts/standard/sample-test.ts`

3. Update deployment scripts to use root configuration:
   - Replace: `cd src/contracts/essential && npx hardhat run deploy-script.ts --network sepolia`
   - With: `npx hardhat run src/contracts/essential/deploy-script.ts --network sepolia`

4. Update verification scripts:
   - Replace: `cd src/contracts/detailed && npx hardhat verify --network mainnet <address> <args>`
   - With: `npx hardhat verify --network mainnet <address> <args>`

These changes ensure all operations use the central hardhat configuration and ProviderManager for network access.

