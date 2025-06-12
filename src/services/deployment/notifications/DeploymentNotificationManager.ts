import { EventEmitter } from 'events';
import { DeploymentStatus, DeploymentResult } from '@/types/deployment/deployment';
import { deploymentService } from '../DeploymentService';
import { supabase } from '@/infrastructure/supabaseClient';
import { deploymentTransactionMonitor } from '../transactions/DeploymentTransactionMonitor';
import { v4 as uuidv4 } from 'uuid';

/**
 * Notification types for token deployments
 */
export enum DeploymentNotificationType {
  STARTED = 'deployment_started',
  PROGRESS = 'deployment_progress',
  SUCCESS = 'deployment_success',
  FAILED = 'deployment_failed',
  CONTRACT_EVENT = 'contract_event'
}

/**
 * Interface for deployment notifications
 */
export interface DeploymentNotification {
  id: string;
  tokenId: string;
  projectId?: string;
  userId?: string;
  type: DeploymentNotificationType;
  title: string;
  message: string;
  status: DeploymentStatus;
  transactionHash?: string;
  contractAddress?: string;
  blockchain?: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

/**
 * Interface for token contract event notifications
 */
export interface TokenContractEventNotification {
  id: string;
  tokenId: string;
  contractAddress: string;
  eventName: string;
  blockchain: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  read: boolean;
  data: any;
}

/**
 * DeploymentNotificationManager handles notifications for token deployments
 * and post-deployment contract events.
 */
export class DeploymentNotificationManager extends EventEmitter {
  private static instance: DeploymentNotificationManager;
  private notificationQueue: DeploymentNotification[] = [];
  private isInitialized = false;
  private realtimeSubscription: any = null;
  private userId: string | null = null;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    super();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DeploymentNotificationManager {
    if (!DeploymentNotificationManager.instance) {
      DeploymentNotificationManager.instance = new DeploymentNotificationManager();
    }
    return DeploymentNotificationManager.instance;
  }
  
  /**
   * Initialize notification manager with user ID
   * @param userId The user ID
   * @returns Promise resolving to initialization status
   */
  async initialize(userId: string): Promise<boolean> {
    try {
      this.userId = userId;
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up Supabase realtime subscription
      this.setupRealtimeSubscription();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize DeploymentNotificationManager:', error);
      return false;
    }
  }
  
  /**
   * Set up event listeners for deployment events
   */
  private setupEventListeners(): void {
    // Listen for deployment events
    deploymentService.on('deployment:success', (data) => {
      this.createDeploymentNotification(
        data.tokenId,
        DeploymentNotificationType.SUCCESS,
        'Deployment Successful',
        `Your token has been successfully deployed to the blockchain.`,
        DeploymentStatus.SUCCESS,
        {
          transactionHash: data.result.transactionHash,
          contractAddress: data.result.tokenAddress,
          blockNumber: data.result.blockNumber,
          timestamp: new Date().toISOString()
        }
      );
    });
    
    deploymentService.on('deployment:failed', (data) => {
      this.createDeploymentNotification(
        data.tokenId,
        DeploymentNotificationType.FAILED,
        'Deployment Failed',
        `Your token deployment failed: ${data.error}`,
        DeploymentStatus.FAILED,
        {
          error: data.error,
          timestamp: new Date().toISOString()
        }
      );
    });
    
    deploymentService.on('deployment:status', (data) => {
      if (data.status === DeploymentStatus.DEPLOYING) {
        this.createDeploymentNotification(
          data.tokenId,
          DeploymentNotificationType.STARTED,
          'Deployment Started',
          'Your token deployment has started. This process may take a few minutes.',
          DeploymentStatus.DEPLOYING,
          {
            timestamp: new Date().toISOString()
          }
        );
      }
    });
    
    // Listen for deployment transaction progress
    deploymentTransactionMonitor.on('deployment:progress', (data) => {
      if (data.confirmationCount && data.confirmationCount % 3 === 0) { // Only notify every 3 confirmations
        this.createDeploymentNotification(
          data.tokenId,
          DeploymentNotificationType.PROGRESS,
          'Deployment Progress',
          `Your token deployment has received ${data.confirmationCount} confirmations.`,
          DeploymentStatus.DEPLOYING,
          {
            transactionHash: data.transactionHash,
            confirmationCount: data.confirmationCount,
            timestamp: new Date().toISOString()
          }
        );
      }
    });
    
    // Listen for token contract events
    deploymentService.on('token:event', (event) => {
      this.createTokenEventNotification(
        event.tokenAddress,
        event.eventName,
        event.blockchain,
        event.transactionHash,
        event.blockNumber,
        event.timestamp,
        event.data
      );
    });
  }
  
  /**
   * Set up Supabase realtime subscription for notifications
   */
  private setupRealtimeSubscription(): void {
    if (!this.userId) return;
    
    try {
      // Subscribe to notifications table for this user
      this.realtimeSubscription = supabase
        .channel('deployment-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'deployment_notifications',
            filter: `user_id=eq.${this.userId}`
          },
          (payload) => {
            // New notification received
            this.emit('new-notification', payload.new);
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Failed to set up realtime subscription:', error);
    }
  }
  
  /**
   * Create a deployment notification
   */
  async createDeploymentNotification(
    tokenId: string,
    type: DeploymentNotificationType,
    title: string,
    message: string,
    status: DeploymentStatus,
    data: any = {}
  ): Promise<void> {
    try {
      if (!this.userId) {
        // Queue notification if not initialized
        this.notificationQueue.push({
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          tokenId,
          type,
          title,
          message,
          status,
          timestamp: new Date().toISOString(),
          read: false,
          data
        });
        return;
      }
      
      // Get project ID from token
      const { data: tokenData, error: tokenError } = await supabase
        .from('tokens')
        .select('project_id')
        .eq('id', tokenId)
        .single();
        
      if (tokenError) {
        console.error('Error fetching token data:', tokenError);
        return;
      }
      
      const projectId = tokenData?.project_id || '';
      
      // Create notification in memory only for now since the table may not exist
      const notification: DeploymentNotification = {
        id: uuidv4(),
        tokenId,
        projectId,
        userId: this.userId || '',
        type,
        title,
        message,
        status,
        transactionHash: data.transactionHash,
        contractAddress: data.contractAddress,
        blockchain: data.blockchain,
        timestamp: new Date().toISOString(),
        read: false,
        data
      };
      
      // Add to memory queue
      this.notificationQueue.push(notification);
      
      // Emit event for real-time notification
      this.emit(`notification:${type}`, notification);
      
      // You can optionally implement database persistence when the tables are created:
      // await supabase.from('deployment_notifications').insert({...})
      
      return;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
  
  /**
   * Create a token contract event notification
   */
  async createTokenEventNotification(
    contractAddress: string,
    eventName: string,
    blockchain: string,
    transactionHash: string,
    blockNumber: number,
    timestamp: string,
    data: any
  ): Promise<void> {
    try {
      // Look up token ID from contract address
      const { data: tokenData, error: tokenError } = await supabase
        .from('tokens')
        .select('id, project_id')
        .eq('address', contractAddress)
        .single();
      
      if (tokenError) {
        console.error('Error finding token for contract address:', tokenError);
        return;
      }
      
      const tokenId = tokenData?.id;
      const projectId = tokenData?.project_id || '';
      
      if (!tokenId) {
        console.warn(`No token found for contract address ${contractAddress}`);
        return;
      }
      
      // Create event notification in memory
      const eventNotification: TokenContractEventNotification = {
        id: uuidv4(),
        tokenId,
        contractAddress,
        eventName,
        blockchain,
        transactionHash,
        blockNumber,
        timestamp,
        read: false,
        data
      };
      
      // Emit event for real-time notification
      this.emit('token:event', eventNotification);
      
      // Emit specific event type for dedicated listeners
      this.emit(`token:event:${eventName.toLowerCase()}`, eventNotification);
      
      // You can optionally implement database persistence when the tables are created:
      // await supabase.from('token_contract_events').insert({...})
      
    } catch (error) {
      console.error('Error creating token event notification:', error);
    }
  }
  
  /**
   * Format an Ethereum address for display
   */
  private formatAddress(address: string): string {
    if (!address) return 'Unknown';
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.userId) {
      return 0;
    }
    
    // Return count from memory queue for now
    return this.notificationQueue.filter(n => !n.read && n.userId === this.userId).length;
  }
  
  /**
   * Get recent notifications
   * @param limit Maximum number of notifications to retrieve
   * @param offset Offset for pagination
   */
  async getRecentNotifications(limit: number = 10, offset: number = 0): Promise<DeploymentNotification[]> {
    if (!this.userId) {
      return [];
    }
    
    // Return from memory queue for now
    return this.notificationQueue
      .filter(n => n.userId === this.userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);
  }
  
  /**
   * Mark notification as read
   * @param notificationId Notification ID
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    if (!this.userId) {
      return false;
    }
    
    // Update in memory
    const notification = this.notificationQueue.find(n => n.id === notificationId && n.userId === this.userId);
    if (notification) {
      notification.read = true;
      return true;
    }
    
    return false;
  }
  
  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    if (!this.userId) {
      return false;
    }
    
    // Update all in memory
    this.notificationQueue.forEach(n => {
      if (n.userId === this.userId) {
        n.read = true;
      }
    });
    
    return true;
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
    
    this.removeAllListeners();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const deploymentNotificationManager = DeploymentNotificationManager.getInstance();