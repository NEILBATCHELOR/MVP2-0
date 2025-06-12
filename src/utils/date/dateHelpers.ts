export const toISOString = (date: Date | string | null): string => {
  if (date === null) return new Date().toISOString();
  if (typeof date === 'string') return new Date(date).toISOString();
  return date.toISOString();
};

export const formatDate = (date: Date | string | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
};

export const formatDistanceToNow = (date: Date | string | null): string => {
  if (!date) return '';
  
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return years === 1 ? '1 year' : `${years} years`;
  if (months > 0) return months === 1 ? '1 month' : `${months} months`;
  if (days > 0) return days === 1 ? '1 day' : `${days} days`;
  if (hours > 0) return hours === 1 ? '1 hour' : `${hours} hours`;
  if (minutes > 0) return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  return 'just now';
};
