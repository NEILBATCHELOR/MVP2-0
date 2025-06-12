import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Users,
  TrendingUp,
  Settings,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, addMonths, isWithinInterval, isSameDay, startOfDay, endOfDay } from 'date-fns';

export interface RedemptionWindow {
  id: string;
  startDate: Date;
  endDate: Date;
  submissionStartDate: Date;
  submissionEndDate: Date;
  frequency: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
  nav?: number;
  status: 'upcoming' | 'submission_open' | 'submission_closed' | 'processing' | 'completed';
  maxRedemptionAmount?: number;
  currentRequests?: number;
  totalRequestValue?: number;
  lockUpPeriod?: number;
}

export interface RedemptionCalendarProps {
  windows?: RedemptionWindow[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onWindowSelect?: (window: RedemptionWindow) => void;
  onCreateRedemption?: (windowId: string) => void;
  className?: string;
  showActions?: boolean;
  viewMode?: 'month' | 'quarter' | 'year';
}

export const RedemptionCalendar: React.FC<RedemptionCalendarProps> = ({
  windows = [],
  selectedDate,
  onDateSelect,
  onWindowSelect,
  onCreateRedemption,
  className,
  showActions = true,
  viewMode = 'month'
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [selectedWindow, setSelectedWindow] = useState<RedemptionWindow | null>(null);

  // Calculate which dates have redemption windows
  const windowDates = useMemo(() => {
    const dates: Record<string, RedemptionWindow[]> = {};
    
    // Handle undefined or empty windows array
    if (!windows || windows.length === 0) {
      return dates;
    }
    
    windows.forEach(window => {
      const start = startOfDay(window.submissionStartDate);
      const end = endOfDay(window.submissionEndDate);
      
      // Add all dates in the submission window
      let currentDay = start;
      while (currentDay <= end) {
        const dateKey = format(currentDay, 'yyyy-MM-dd');
        if (!dates[dateKey]) {
          dates[dateKey] = [];
        }
        dates[dateKey].push(window);
        currentDay = addDays(currentDay, 1);
      }
    });
    
    return dates;
  }, [windows]);

  // Get window status color
  const getWindowStatusColor = (status: RedemptionWindow['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submission_open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'submission_closed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get window status icon
  const getWindowStatusIcon = (status: RedemptionWindow['status']) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="h-3 w-3" />;
      case 'submission_open':
        return <CheckCircle className="h-3 w-3" />;
      case 'submission_closed':
        return <AlertCircle className="h-3 w-3" />;
      case 'processing':
        return <TrendingUp className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setCurrentDate(date);
    onDateSelect?.(date);
    
    // Check if this date has any windows
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayWindows = windowDates[dateKey];
    
    if (dayWindows && dayWindows.length > 0) {
      setSelectedWindow(dayWindows[0]);
      onWindowSelect?.(dayWindows[0]);
    }
  };

  // Custom day content for calendar
  const customDayContent = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayWindows = windowDates[dateKey];
    
    if (!dayWindows || dayWindows.length === 0) {
      return <div className="relative w-full h-full" />;
    }

    const primaryWindow = dayWindows[0];
    const statusColor = getWindowStatusColor(primaryWindow.status);
    
    return (
      <div className="relative w-full h-full">
        <div className={cn(
          "absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full",
          statusColor.includes('blue') && "bg-blue-500",
          statusColor.includes('green') && "bg-green-500",
          statusColor.includes('yellow') && "bg-yellow-500",
          statusColor.includes('purple') && "bg-purple-500",
          statusColor.includes('gray') && "bg-gray-500"
        )} />
        {dayWindows.length > 1 && (
          <div className="absolute top-0 right-0 w-1 h-1 bg-orange-500 rounded-full" />
        )}
      </div>
    );
  };

  // Get upcoming windows
  const upcomingWindows = (windows || [])
    .filter(w => w.status === 'upcoming' || w.status === 'submission_open')
    .sort((a, b) => a.submissionStartDate.getTime() - b.submissionStartDate.getTime())
    .slice(0, 3);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Redemption Calendar</h2>
          <p className="text-sm text-gray-600">
            View and manage interval fund redemption windows
          </p>
        </div>
        {showActions && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure Windows
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Redemption Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                components={{
                  DayContent: ({ date }) => (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span>{format(date, 'd')}</span>
                            {customDayContent(date)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {(() => {
                            const dateKey = format(date, 'yyyy-MM-dd');
                            const dayWindows = windowDates[dateKey];
                            
                            if (!dayWindows || dayWindows.length === 0) {
                              return <p>No redemption windows</p>;
                            }

                            const window = dayWindows[0];
                            return (
                              <div className="space-y-1">
                                <p className="font-medium">{window.frequency} Redemption Window</p>
                                <p className="text-xs">Status: {window.status.replace('_', ' ')}</p>
                                {window.nav && (
                                  <p className="text-xs">NAV: {formatCurrency(window.nav)}</p>
                                )}
                              </div>
                            );
                          })()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                }}
              />
              
              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Upcoming</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Open for Submission</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>Submission Closed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>Processing</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <span>Completed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Window Details */}
          {selectedWindow && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Window Details</span>
                  <Badge className={getWindowStatusColor(selectedWindow.status)}>
                    {getWindowStatusIcon(selectedWindow.status)}
                    <span className="ml-1">{selectedWindow.status.replace('_', ' ')}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600">Frequency</Label>
                  <p className="font-medium">{selectedWindow.frequency.replace('_', ' ')}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Submission Period</Label>
                  <p className="text-sm">
                    {format(selectedWindow.submissionStartDate, 'MMM d, yyyy')} - {format(selectedWindow.submissionEndDate, 'MMM d, yyyy')}
                  </p>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Redemption Date</Label>
                  <p className="text-sm">
                    {format(selectedWindow.endDate, 'MMM d, yyyy')}
                  </p>
                </div>

                {selectedWindow.nav && (
                  <div>
                    <Label className="text-xs text-gray-600">Current NAV</Label>
                    <p className="font-medium text-lg">{formatCurrency(selectedWindow.nav)}</p>
                  </div>
                )}

                {selectedWindow.currentRequests && (
                  <div>
                    <Label className="text-xs text-gray-600">Current Requests</Label>
                    <p className="text-sm">{selectedWindow.currentRequests} requests</p>
                    {selectedWindow.totalRequestValue && (
                      <p className="text-xs text-gray-500">
                        Total: {formatCurrency(selectedWindow.totalRequestValue)}
                      </p>
                    )}
                  </div>
                )}

                {selectedWindow.lockUpPeriod && (
                  <div>
                    <Label className="text-xs text-gray-600">Lock-up Period</Label>
                    <p className="text-sm">{selectedWindow.lockUpPeriod} days</p>
                  </div>
                )}

                {showActions && selectedWindow.status === 'submission_open' && (
                  <Button 
                    className="w-full"
                    onClick={() => onCreateRedemption?.(selectedWindow.id)}
                  >
                    Submit Redemption Request
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Windows */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Windows</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingWindows.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming redemption windows
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingWindows.map((window) => (
                    <div
                      key={window.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedWindow(window);
                        setCurrentDate(window.submissionStartDate);
                        onWindowSelect?.(window);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getWindowStatusColor(window.status)}>
                          {getWindowStatusIcon(window.status)}
                          <span className="ml-1">{window.status.replace('_', ' ')}</span>
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {window.frequency.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium">
                        {format(window.submissionStartDate, 'MMM d')} - {format(window.submissionEndDate, 'MMM d, yyyy')}
                      </p>
                      
                      {window.nav && (
                        <p className="text-xs text-gray-600">
                          NAV: {formatCurrency(window.nav)}
                        </p>
                      )}
                      
                      {window.currentRequests && (
                        <p className="text-xs text-gray-600">
                          {window.currentRequests} requests submitted
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  Next Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setCurrentDate(addMonths(currentDate, 3))}
                >
                  Next Quarter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate sample windows for development
export const generateSampleWindows = (): RedemptionWindow[] => {
  const windows: RedemptionWindow[] = [];
  const now = new Date();
  
  // Generate quarterly windows for the next year
  for (let i = 0; i < 4; i++) {
    const windowStart = addMonths(now, i * 3);
    const submissionStart = addDays(windowStart, -14); // 14 days before
    const submissionEnd = addDays(windowStart, -1); // 1 day before
    const windowEnd = addDays(windowStart, 7); // 7 days processing
    
    const status: RedemptionWindow['status'] = 
      i === 0 ? 'submission_open' :
      i === 1 ? 'upcoming' : 'upcoming';
    
    windows.push({
      id: `window-${i}`,
      startDate: windowStart,
      endDate: windowEnd,
      submissionStartDate: submissionStart,
      submissionEndDate: submissionEnd,
      frequency: 'quarterly',
      nav: 1000 + Math.random() * 200,
      status,
      maxRedemptionAmount: 1000000,
      currentRequests: Math.floor(Math.random() * 50),
      totalRequestValue: Math.floor(Math.random() * 500000),
      lockUpPeriod: 90
    });
  }
  
  return windows;
};

export default RedemptionCalendar;

// Type for component props
type Label = ({ className, children, ...props }: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => JSX.Element;

// Simple Label component
const Label: Label = ({ className, children, ...props }) => (
  <label className={cn("text-sm font-medium", className)} {...props}>
    {children}
  </label>
);
