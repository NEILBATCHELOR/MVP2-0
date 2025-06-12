# WalletConnect Setup Guide

This guide provides instructions for setting up and using WalletConnect in the application.

## Setup WalletConnect

WalletConnect is a protocol that enables wallet connections via QR code, allowing users to connect their mobile wallets to the application.

### Prerequisites

1. You need a WalletConnect Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create an account and create a new project
3. Copy the Project ID

### Configuration

1. Add the WalletConnect Project ID to your environment variables in the `.env` file:

```
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

2. Restart the application for the changes to take effect

### Troubleshooting WalletConnect

If users are having trouble using WalletConnect:

1. Check that the VITE_WALLET_CONNECT_PROJECT_ID is set correctly in your .env file
2. When using WalletConnect, click the dedicated "Connect" button with the QR code icon
3. Make sure the user is scanning the QR code with a WalletConnect-compatible mobile wallet
4. Check the browser console for any error messages related to WalletConnect
5. If using WalletConnect in an iframe or embedded context, it may not work properly
6. Consider using MetaMask or Browser wallet options if WalletConnect continues to have issues

## Using WalletConnect in the Deployment Panel

When deploying tokens:

1. Go to the Deploy tab in the Token Administration interface
2. Click on "Connect Wallet" tab
3. Click the "Connect Wallet" button
4. In the wallet selection modal, find WalletConnect
5. Click the "Connect" button with the QR code icon next to WalletConnect
6. Scan the QR code with your mobile wallet
7. Approve the connection in your mobile wallet
8. Your wallet should now be connected and ready for deployment

## Implementation Notes

The WalletConnect implementation uses:

1. Wagmi library for wallet connections
2. WalletConnect v2 protocol
3. QR code modal for mobile wallet connections

For developers looking to enhance WalletConnect functionality:

- Check the WalletConnect component in `src/components/wallet/WalletConnect.tsx`
- The connector configuration is in `src/infrastructure/web3/wallet/walletConnectors.ts`
- Wallet detection is handled in `src/infrastructure/web3/wallet/walletDetector.ts` 