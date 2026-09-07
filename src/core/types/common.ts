/**
 * Shared entity types used across all features.
 * All API responses should conform to these shapes.
 */

export interface PagedResult<T> {
  items:      T[];
  page:       number;
  pageSize:   number;
  totalCount: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ApiError {
  message:    string;
  statusCode?: number;
  errors?:    Record<string, string[]>;
}

/** Base fields every entity from the backend has */
export interface BaseEntity {
  id:          string;
  tenantId?:   string;
  createdAt?:  string;
  updatedAt?:  string;
}
