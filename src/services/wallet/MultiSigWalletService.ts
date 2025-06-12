import { supabase } from "@/infrastructure/database/client";
import type { Tables } from "@/types/core/database";

/**
 * Checks if a wallet is a multi-signature wallet
 * @param walletAddress The wallet address to check
 * @returns True if the wallet is a multi-signature wallet, false otherwise
 */
export async function isMultiSigWallet(walletAddress: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("multi_sig_wallets")
    .select("id")
    .eq("address", walletAddress)
    .single();
  
  if (error || !data) {
    console.error("Error checking if wallet is multi-sig:", error);
    return false;
  }
  
  return true;
}

/**
 * Gets the details for a multi-signature wallet
 * @param walletAddress The wallet address
 * @returns The wallet details or null if not found
 */
export async function getMultiSigWalletDetails(walletAddress: string): Promise<Tables<'multi_sig_wallets'> | null> {
  const { data, error } = await supabase
    .from("multi_sig_wallets")
    .select("*")
    .eq("address", walletAddress)
    .single();
  
  if (error) {
    console.error("Error getting multi-sig wallet details:", error);
    return null;
  }
  
  return data;
}

/**
 * Get the pending transactions for a multi-signature wallet
 * @param walletId The wallet ID
 * @returns An array of pending transactions
 */
export async function getPendingTransactions(walletId: string) {
  const { data, error } = await supabase
    .from("multi_sig_transactions")
    .select(`
      *,
      multi_sig_confirmations(*)
    `)
    .eq("wallet_id", walletId)
    .eq("executed", false)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error getting pending transactions:", error);
    return [];
  }
  
  return data;
}

/**
 * Sign a multi-signature transaction
 * @param txId The transaction ID
 * @param signerAddress The address of the signer
 * @param signature The signature
 * @returns True if the signature was added successfully
 */
export async function signTransaction(
  txId: string,
  signerAddress: string,
  signature: string
): Promise<boolean> {
  // Get the transaction details to find the wallet_id
  const { data: txData, error: txError } = await supabase
    .from("multi_sig_transactions")
    .select("wallet_id")
    .eq("id", txId)
    .single();
  
  if (txError || !txData) {
    console.error("Error getting transaction details:", txError);
    return false;
  }
  
  // Check if signer is an owner of the wallet
  const { data: walletData, error: walletError } = await supabase
    .from("multi_sig_wallets")
    .select("owners")
    .eq("id", txData.wallet_id)
    .single();
  
  if (walletError || !walletData) {
    console.error("Error getting wallet details:", walletError);
    return false;
  }
  
  // Check if the signer is in the owners array
  if (!walletData.owners.includes(signerAddress)) {
    console.error("Signer is not an owner of this wallet");
    return false;
  }
  
  // Add the signature
  const { error: sigError } = await supabase
    .from("multi_sig_confirmations")
    .insert({
      transaction_id: txId,
      signer: signerAddress,
      owner: signerAddress,
      signature: signature,
      confirmed: true,
      timestamp: new Date().toISOString(),
    });
  
  if (sigError) {
    console.error("Error adding signature:", sigError);
    return false;
  }
  
  // Check if we have enough signatures to execute the transaction
  await checkAndUpdateTransactionStatus(txId, txData.wallet_id);
  
  return true;
}

/**
 * Check if a transaction has enough signatures and update its status
 * @param txId The transaction ID
 * @param walletId The wallet ID
 */
async function checkAndUpdateTransactionStatus(txId: string, walletId: string) {
  // Get the wallet threshold
  const { data: walletData, error: walletError } = await supabase
    .from("multi_sig_wallets")
    .select("threshold")
    .eq("id", walletId)
    .single();
  
  if (walletError || !walletData) {
    console.error("Error getting wallet threshold:", walletError);
    return;
  }
  
  // Count signatures
  const { count, error: countError } = await supabase
    .from("multi_sig_confirmations")
    .select("*", { count: "exact" })
    .eq("transaction_id", txId)
    .eq("confirmed", true);
  
  if (countError) {
    console.error("Error counting signatures:", countError);
    return;
  }
  
  // If we have enough signatures, update the transaction status
  if (count !== null && count >= walletData.threshold) {
    const { error: updateError } = await supabase
      .from("multi_sig_transactions")
      .update({
        confirmations: count,
        updated_at: new Date().toISOString(),
      })
      .eq("id", txId);
    
    if (updateError) {
      console.error("Error updating transaction status:", updateError);
    }
  }
}

/**
 * Execute a multi-signature transaction that has reached its threshold
 * @param txId The transaction ID
 * @returns The transaction hash if successful
 */
export async function executeTransaction(txId: string): Promise<string | null> {
  // Get the transaction details
  const { data: txData, error: txError } = await supabase
    .from("multi_sig_transactions")
    .select("*, multi_sig_wallets!inner(*)")
    .eq("id", txId)
    .single();
  
  if (txError || !txData) {
    console.error("Transaction not found:", txError);
    return null;
  }
  
  // Check if we have enough confirmations
  if (txData.confirmations < txData.multi_sig_wallets.threshold) {
    console.error("Not enough confirmations to execute this transaction");
    return null;
  }
  
  if (txData.executed) {
    console.error("Transaction already executed");
    return null;
  }
  
  // In a real app, this would submit the transaction to the blockchain
  // For this implementation, we'll just update the status
  const { error: updateError } = await supabase
    .from("multi_sig_transactions")
    .update({
      executed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", txId);
  
  if (updateError) {
    console.error("Error updating transaction status:", updateError);
    return null;
  }
  
  return txData.hash;
}

/**
 * Get a transaction by ID
 * @param txId The transaction ID
 * @returns The transaction details
 */
export async function getTransactionById(txId: string) {
  const { data, error } = await supabase
    .from("multi_sig_transactions")
    .select(`
      *,
      multi_sig_confirmations(*)
    `)
    .eq("id", txId)
    .single();
  
  if (error) {
    console.error("Error getting transaction:", error);
    return null;
  }
  
  return data;
}

/**
 * Get the wallet owners for a multi-signature wallet
 * @param walletId The wallet ID
 * @returns An array of owner addresses
 */
export async function getWalletOwners(walletId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("multi_sig_wallets")
    .select("owners")
    .eq("id", walletId)
    .single();
  
  if (error) {
    console.error("Error getting wallet owners:", error);
    return [];
  }
  
  return data.owners;
}

/**
 * Get all multi-signature wallets
 * @param limit Optional limit for number of wallets to return
 * @returns An array of multi-signature wallets
 */
export async function getMultiSigWallets(limit?: number): Promise<Tables<'multi_sig_wallets'>[]> {
  let query = supabase
    .from("multi_sig_wallets")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error getting multi-sig wallets:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Propose a new transaction for a multi-signature wallet
 * @param walletId The wallet ID
 * @param to The recipient address
 * @param value The value to send
 * @param data Optional transaction data
 * @param proposer The address of the proposer
 * @returns The transaction ID if successful
 */
export async function proposeTransaction(
  walletId: string,
  to: string,
  value: string,
  data?: string,
  proposer?: string
): Promise<string | null> {
  // Generate transaction hash
  const hash = '0x' + Math.random().toString(16).substr(2, 64);
  
  const { data: txData, error } = await supabase
    .from("multi_sig_transactions")
    .insert({
      wallet_id: walletId,
      blockchain: 'ethereum',
      destination_wallet_address: to,
      value: value, // Use 'value' field instead of 'amount'
      data: data || '',
      hash,
      nonce: 0,
      confirmations: 0,
      executed: false
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error proposing transaction:", error);
    return null;
  }
  
  return txData.id;
}

/**
 * Confirm a proposed transaction
 * @param txId The transaction ID
 * @param confirmer The address of the confirmer
 * @param signature Optional signature
 * @returns True if confirmation was successful
 */
export async function confirmTransaction(
  txId: string,
  confirmer: string,
  signature?: string
): Promise<boolean> {
  // Check if transaction exists and get wallet details
  const { data: txData, error: txError } = await supabase
    .from("multi_sig_transactions")
    .select("wallet_id, executed")
    .eq("id", txId)
    .single();
  
  if (txError || !txData) {
    console.error("Transaction not found:", txError);
    return false;
  }
  
  if (txData.executed) {
    console.error("Transaction already executed");
    return false;
  }
  
  // Check if confirmer is an owner
  const { data: walletData, error: walletError } = await supabase
    .from("multi_sig_wallets")
    .select("owners, threshold")
    .eq("id", txData.wallet_id)
    .single();
  
  if (walletError || !walletData) {
    console.error("Wallet not found:", walletError);
    return false;
  }
  
  if (!walletData.owners.includes(confirmer)) {
    console.error("Confirmer is not an owner of this wallet");
    return false;
  }
  
  // Add confirmation
  const { error: confirmError } = await supabase
    .from("multi_sig_confirmations")
    .insert({
      transaction_id: txId,
      signer: confirmer,
      owner: confirmer,
      signature: signature || '',
      confirmed: true,
      timestamp: new Date().toISOString()
    });
  
  if (confirmError) {
    console.error("Error adding confirmation:", confirmError);
    return false;
  }
  
  // Update transaction confirmation count
  const { count } = await supabase
    .from("multi_sig_confirmations")
    .select("*", { count: "exact" })
    .eq("transaction_id", txId)
    .eq("confirmed", true);
  
  if (count !== null) {
    await supabase
      .from("multi_sig_transactions")
      .update({
        confirmations: count,
        updated_at: new Date().toISOString()
      })
      .eq("id", txId);
  }
  
  return true;
}

// Default export for backward compatibility
const MultiSigWalletService = {
  isMultiSigWallet,
  getMultiSigWalletDetails,
  getPendingTransactions,
  signTransaction,
  executeTransaction,
  getTransactionById,
  getWalletOwners,
  getMultiSigWallets,
  proposeTransaction,
  confirmTransaction
};

export default MultiSigWalletService;