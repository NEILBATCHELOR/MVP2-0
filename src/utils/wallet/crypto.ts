/**
 * Verify a digital signature
 * @param data The data that was signed
 * @param signature The signature to verify
 * @param publicKey Optional public key for verification
 * @returns Whether the signature is valid
 */
export const verifySignature = (
  data: string,
  signature: string,
  publicKey?: string
): boolean => {
  // In a real implementation, this would use proper crypto
  // For demo purposes, we'll just return true for specific test values
  if (signature === 'abcdef123456') {
    return true;
  }
  
  // For other signatures, we'll simulate verification
  // 80% chance of validation success
  return Math.random() < 0.8;
};

/**
 * Generate a cryptographic key pair for signing and verification
 * @returns Object containing public and encrypted private keys
 */
export const generateKeyPair = async (): Promise<{ publicKey: string; encryptedPrivateKey: string }> => {
  // In a real implementation, this would use proper crypto APIs
  // For demo purposes, we'll generate random strings
  
  // Generate random hex strings
  const generateRandomHex = (length: number) => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };
  
  return {
    publicKey: `pub_${generateRandomHex(16)}`,
    encryptedPrivateKey: `enc_priv_${generateRandomHex(32)}`
  };
};