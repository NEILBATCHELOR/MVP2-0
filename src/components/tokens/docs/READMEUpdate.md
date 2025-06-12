# Tokenization Platform Components Update

This directory contains components for the tokenization platform, enabling users to create, deploy, and manage tokenized financial assets across multiple blockchains.

## Enhanced Web3 Interaction Components

The enhanced Web3 interaction components provide advanced functionality for transaction monitoring, gas fee optimization, and multi-chain support:

### Transaction Monitoring

- `TransactionStatusMonitor`: A comprehensive transaction monitoring component that displays transaction status, confirmation counts, estimated times, and allows for transaction acceleration or cancellation.
- `TransactionStatusBadge`: A visual indicator of transaction status (confirmed, pending, failed, replaced, sped up, canceled).
- `TransactionDetails`: Displays detailed information about a transaction including gas usage, block number, and other metadata.

### Gas Optimization

- `GasEstimator`: Provides real-time gas fee estimates based on network congestion levels, with options for different priority levels (low, medium, high, urgent).

These components integrate with the enhanced `TransactionMonitor` service, which provides:

- Multi-chain transaction tracking
- Transaction speedup and cancellation capabilities
- Gas fee optimization based on network congestion
- Improved event notification system
- Detailed transaction metadata tracking

## Advanced Token Templates

The visual token composition system allows users to create complex financial products by connecting multiple token standards:

### Visual Token Composer

- `VisualTokenComposer`: A drag-and-drop interface for creating complex token templates, with support for multiple token types and relationships.
- `VisualToken`: Visual representation of a token with standard-specific styling and information.
- `TokenNodePanel`: Edit panel for configuring token properties, settings, and establishing relationships.
- `RelationshipMenu`: Interface for defining relationships between tokens.

The visual composer enables users to:

1. Create and place multiple token types on a canvas
2. Connect tokens with relationships that define how they interact
3. Configure standard-specific properties for each token
4. Import/export templates as JSON
5. Save templates to the database

## Supported Token Standards

The platform supports multiple token standards, each suited for different financial applications:

- **ERC20**: Fungible tokens for currencies, utility tokens, etc.
- **ERC721**: Non-fungible tokens for unique assets like real estate.
- **ERC1155**: Multi-token standard for mixed fungible/non-fungible assets.
- **ERC1400**: Security token standard with transfer restrictions.
- **ERC3525**: Semi-fungible tokens for assets with quantity and class.
- **ERC4626**: Tokenized vault standard for yield-bearing assets.

## Token Relationships

Tokens can be connected through various relationships to create complex financial products:

- **Issues/Redeems**: For vault tokens that issue shares based on deposits.
- **Wraps/Unwraps**: For wrapped tokens that represent another asset.
- **Fractionalized By**: For tokens that represent fractional ownership.
- **Collateralized By**: For tokens backed by other assets as collateral.
- **Linked To/Pegged To**: For tokens with value linked to other tokens.

## Usage Examples

### Transaction Monitoring

```tsx
<TransactionStatusMonitor
  transactions={userTransactions}
  walletAddress={currentWallet}
  blockchain="ethereum-goerli"
  privateKey={walletKey}
  onSpeedUp={(txHash, newTxHash) => {
    console.log(`Transaction ${txHash} sped up with ${newTxHash}`);
  }}
  explorerBaseUrl="https://goerli.etherscan.io"
/>
```

### Gas Estimation

```tsx
<GasEstimator
  blockchain="ethereum-mainnet"
  defaultPriority={FeePriority.MEDIUM}
  onSelectFeeData={(feeData) => {
    setMaxFeePerGas(feeData.maxFeePerGas);
    setMaxPriorityFeePerGas(feeData.maxPriorityFeePerGas);
  }}
/>
```

### Visual Token Composer

```tsx
<VisualTokenComposer
  projectId="project-123"
  onSave={(templateId, template) => {
    console.log(`Template ${templateId} saved:`, template);
    navigate(`/templates/${templateId}`);
  }}
/>
```

## Integration with Existing Systems

These components integrate with the existing tokenization infrastructure:

- Uses the blockchain adapter system for multi-chain support
- Leverages the `TokenizationManager` for deployment operations
- Utilizes the template service for persisting token templates
- Integrates with the wallet management system

## Future Enhancements

Potential future enhancements include:

1. Support for custom token standards
2. Template validation against regulatory requirements
3. Real-time transaction simulation
4. Token relationship analysis tools
5. Integration with off-chain systems via oracles
6. Template marketplace for sharing and discovering token structures
7. Governance token support for DAO-based asset management