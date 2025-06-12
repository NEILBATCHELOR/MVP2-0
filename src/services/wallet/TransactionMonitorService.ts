import { supabase } from '@/infrastructure/database/client';
import type { WalletTransactionsTable, TransactionNotificationsTable } from '@/types/core/database';
import type { Transaction } from '@/types/core/centralModels';
import { mapBlockchainTransactionToTransaction } from '@/types/domain/wallet/transactionTypes';

/**
 * Service for monitoring and tracking blockchain transactions
 */
class TransactionMonitorService {
  /**
   * Fetches transaction details by hash
   * @param txHash - The transaction hash to fetch
   * @returns The transaction details object
   */
  async getTransactionDetails(txHash: string) {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('tx_hash', txHash)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Fetches transaction history for a specific wallet address
   * @param walletAddress - The wallet address to fetch transactions for
   * @param limit - Maximum number of transactions to fetch
   * @returns Array of transaction objects
   */
  async getWalletTransactionHistory(walletAddress: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .or(`from_address.eq.${walletAddress},to_address.eq.${walletAddress}`)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  }

  /**
   * Fetches all transactions for a specific wallet address
   * @param walletAddress - The wallet address to fetch transactions for
   * @returns Array of transaction objects
   */
  async getTransactionsByWalletAddress(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .or(`from_address.eq.${walletAddress},to_address.eq.${walletAddress}`)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      throw error;
    }
  }

  /**
   * Fetches transaction notifications for a specific wallet address
   * @param walletAddress - The wallet address to fetch notifications for
   * @returns Array of notification objects
   */
  async getTransactionNotifications(walletAddress: string) {
    try {
      const { data, error } = await supabase
        .from('transaction_notifications')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transaction notifications:', error);
      throw error;
    }
  }

  /**
   * Marks a notification as read
   * @param notificationId - The ID of the notification to mark as read
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('transaction_notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Subscribes to transaction status updates for a specific transaction
   * @param txHash - The transaction hash to monitor
   * @param callback - The callback function to execute when updates occur
   * @returns An unsubscribe function
   */
  subscribeToTransactionUpdates(txHash: string, callback: (update: any) => void) {
    // Create a realtime subscription for transaction updates
    const subscription = supabase
      .channel(`tx-updates-${txHash}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `tx_hash=eq.${txHash}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Subscribes to new transactions for a specific wallet address
   * @param walletAddress - The wallet address to monitor
   * @param callback - The callback function to execute when new transactions are detected
   * @returns An unsubscribe function
   */
  subscribeToNewTransactions(walletAddress: string, callback: (transaction: any) => void) {
    // Create a realtime subscription for new transactions
    const subscription = supabase
      .channel(`wallet-txs-${walletAddress}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `or(from_address.eq.${walletAddress},to_address.eq.${walletAddress})`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  }

  /**
   * Subscribes to new notifications for a specific wallet address
   * @param walletAddress - The wallet address to monitor
   * @param callback - The callback function to execute when new notifications are received
   * @returns An unsubscribe function
   */
  subscribeToNotifications(walletAddress: string, callback: (notification: any) => void) {
    // Create a realtime subscription for new notifications
    const subscription = supabase
      .channel(`wallet-notifications-${walletAddress}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transaction_notifications',
          filter: `wallet_address=eq.${walletAddress}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  }
}

// Export singleton instance
export const transactionMonitorService = new TransactionMonitorService();

// Default export for backward compatibility
export default TransactionMonitorService;