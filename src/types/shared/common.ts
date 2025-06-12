// Common utility types
export type ID = string;
export type Timestamp = string;
export type UUID = string;

export interface BaseEntity {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface EmptyStateProps {
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
  action?: React.ReactNode;
}
