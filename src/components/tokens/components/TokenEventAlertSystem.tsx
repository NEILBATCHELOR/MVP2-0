import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Bell, 
  Check, 
  X, 
  Info, 
  AlertTriangle, 
  ShieldAlert,
  BarChart 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/infrastructure/database/client';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export interface TokenEvent {
  id: string;
  timestamp: string;
  token_id: string;
  event_type: 'transfer' | 'mint' | 'burn' | 'approval' | 'verification' | 'deployment' | 'security' | 'anomaly';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data?: any;
  is_read: boolean;
}

interface TokenEventAlertSystemProps {
  projectId?: string;
  tokenId?: string;
  onEventSelected?: (event: TokenEvent) => void;
}

const TokenEventAlertSystem: React.FC<TokenEventAlertSystemProps> = ({
  projectId,
  tokenId,
  onEventSelected
}) => {
  const [events, setEvents] = useState<TokenEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [alertPreferences, setAlertPreferences] = useState({
    transfers: true,
    mints: true,
    burns: true,
    approvals: false,
    security: true,
    deployment: true,
    verification: true,
    anomalies: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    
    // Set up a Supabase realtime subscription for new events
    let subscription: any;
    let mounted = true;
    
    const setupSubscription = async () => {
      let filter: string | undefined;
      
      if (tokenId) {
        filter = `token_id=eq.${tokenId}`;
      } else if (projectId) {
        // Get all token IDs for this project to set up proper filtering
        const { data: tokens } = await supabase
          .from('tokens')
          .select('id')
          .eq('project_id', projectId);
        
        if (tokens && tokens.length > 0) {
          // For realtime subscriptions, we'll need to check in the handler
          // since Supabase doesn't support complex filters in realtime
          filter = undefined; // We'll filter in the handler
        }
      }
      
      // Only proceed with subscription if component is still mounted
      if (!mounted) return null;
      
      const channelName = `token-events-${Math.random().toString(36).substr(2, 9)}`;
      subscription = supabase
        .channel(channelName)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'token_events',
          filter
        }, async (payload) => {
          const event = payload.new as TokenEvent;
          
          // If we're filtering by project, check if this token belongs to the project
          if (projectId && !tokenId) {
            const { data: token } = await supabase
              .from('tokens')
              .select('project_id')
              .eq('id', event.token_id)
              .single();
            
            if (token?.project_id === projectId) {
              handleNewEvent(event);
            }
          } else {
            handleNewEvent(event);
          }
        })
        .subscribe();
      
      return subscription;
    };
    
    setupSubscription().catch(error => {
      console.error('Error setting up token events subscription:', error);
    });
    
    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [tokenId, projectId]);

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('token_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (tokenId) {
        query = query.eq('token_id', tokenId);
      } else if (projectId) {
        // Get all token IDs for this project first
        const { data: tokens, error: tokensError } = await supabase
          .from('tokens')
          .select('id')
          .eq('project_id', projectId);
        
        if (tokensError) {
          throw tokensError;
        }
        
        if (tokens && tokens.length > 0) {
          const tokenIds = tokens.map(token => token.id);
          query = query.in('token_id', tokenIds);
        } else {
          // No tokens found for this project, return empty result
          setEvents([]);
          setUnreadCount(0);
          return;
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setEvents(data as TokenEvent[]);
        setUnreadCount(data.filter(event => !event.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching token events:', error);
    }
  };

  const handleNewEvent = (event: TokenEvent) => {
    // Check if we should alert based on user preferences
    const shouldAlert = (
      (event.event_type === 'transfer' && alertPreferences.transfers) ||
      (event.event_type === 'mint' && alertPreferences.mints) ||
      (event.event_type === 'burn' && alertPreferences.burns) ||
      (event.event_type === 'approval' && alertPreferences.approvals) ||
      (event.event_type === 'security' && alertPreferences.security) ||
      (event.event_type === 'deployment' && alertPreferences.deployment) ||
      (event.event_type === 'verification' && alertPreferences.verification) ||
      (event.event_type === 'anomaly' && alertPreferences.anomalies)
    );
    
    if (shouldAlert) {
      // Add to events list
      setEvents(prev => [event, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification for high severity events
      if (['high', 'critical'].includes(event.severity)) {
        toast({
          title: getEventTitle(event),
          description: event.message,
          variant: event.severity === 'critical' ? 'destructive' : undefined
        });
      }
    }
  };

  const markAsRead = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('token_events')
        .update({ is_read: true })
        .eq('id', eventId);
      
      if (error) {
        throw error;
      }
      
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId ? { ...event, is_read: true } : event
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking event as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const eventIds = events.filter(e => !e.is_read).map(e => e.id);
      
      if (eventIds.length === 0) return;
      
      const { error } = await supabase
        .from('token_events')
        .update({ is_read: true })
        .in('id', eventIds);
      
      if (error) {
        throw error;
      }
      
      setEvents(prev => 
        prev.map(event => ({ ...event, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all events as read:', error);
    }
  };

  const getEventIcon = (event: TokenEvent) => {
    switch (event.event_type) {
      case 'transfer':
        return <BarChart className="h-4 w-4 text-blue-500" />;
      case 'mint':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'burn':
        return <X className="h-4 w-4 text-orange-500" />;
      case 'approval':
        return <Check className="h-4 w-4 text-blue-500" />;
      case 'security':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'deployment':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'verification':
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getEventTitle = (event: TokenEvent) => {
    switch (event.event_type) {
      case 'transfer':
        return 'Token Transfer';
      case 'mint':
        return 'Token Mint';
      case 'burn':
        return 'Token Burn';
      case 'approval':
        return 'Token Approval';
      case 'security':
        return 'Security Alert';
      case 'anomaly':
        return 'Anomaly Detected';
      case 'deployment':
        return 'Deployment Update';
      case 'verification':
        return 'Verification Update';
      default:
        return 'Token Event';
    }
  };

  const getSeverityBadge = (severity: TokenEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Low</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If it's today, just show the time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  };

  const handleEventClick = (event: TokenEvent) => {
    if (!event.is_read) {
      markAsRead(event.id);
    }
    
    if (onEventSelected) {
      onEventSelected(event);
    }
    
    setOpen(false);
  };

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="end">
          <Card className="border-0">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Token Events</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </Button>
              </div>
              <CardDescription>
                Recent token activity and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto space-y-2 px-2">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-20" />
                  <p>No events to display</p>
                  <p className="text-sm">Events will appear here as they occur</p>
                </div>
              ) : (
                events.map(event => (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      event.is_read ? 'bg-background hover:bg-accent' : 'bg-accent/40 hover:bg-accent/60'
                    }`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getEventIcon(event)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{getEventTitle(event)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.message}
                        </p>
                        <div className="flex justify-between items-center pt-1">
                          {getSeverityBadge(event.severity)}
                          <div className="text-xs text-muted-foreground">
                            {event.token_id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter className="border-t pt-3">
              <div className="w-full space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Alert Preferences</h4>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0"
                    onClick={() => {/* Open full preferences panel */}}
                  >
                    View all
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="alert-transfers" 
                      checked={alertPreferences.transfers}
                      onCheckedChange={(checked) => 
                        setAlertPreferences(prev => ({ ...prev, transfers: checked }))
                      }
                    />
                    <Label htmlFor="alert-transfers">Transfers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="alert-security" 
                      checked={alertPreferences.security}
                      onCheckedChange={(checked) => 
                        setAlertPreferences(prev => ({ ...prev, security: checked }))
                      }
                    />
                    <Label htmlFor="alert-security">Security</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="alert-deployment" 
                      checked={alertPreferences.deployment}
                      onCheckedChange={(checked) => 
                        setAlertPreferences(prev => ({ ...prev, deployment: checked }))
                      }
                    />
                    <Label htmlFor="alert-deployment">Deployment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="alert-anomalies" 
                      checked={alertPreferences.anomalies}
                      onCheckedChange={(checked) => 
                        setAlertPreferences(prev => ({ ...prev, anomalies: checked }))
                      }
                    />
                    <Label htmlFor="alert-anomalies">Anomalies</Label>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TokenEventAlertSystem;