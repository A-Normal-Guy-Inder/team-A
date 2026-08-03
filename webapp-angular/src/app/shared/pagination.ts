import config from '../core/config';
import { ApiEnvelope, ListMeta, ListQuery, LoadStatus } from '../core/api.types';

export interface ListState<T> {
  items: T[];
  meta: ListMeta;
  query: ListQuery;
  status: LoadStatus;
  error: string | null;
}

export const emptyList = <T>(): ListState<T> => ({
  items: [],
  meta: {
    page: 1,
    limit: config.pageSize,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  query: { page: 1, search: '', status: '', category: '', sortBy: 'createdAt', sortOrder: 'desc' },
  status: 'idle',
  error: null,
});

/* Helpers return fresh objects */

export function listPending<T>(slice: ListState<T>): ListState<T> {
  return { ...slice, status: 'loading', error: null };
}

export function listFulfilled<T>(
  slice: ListState<T>,
  payload: { items: T[]; meta: Partial<ListMeta>; query?: ListQuery },
): ListState<T> {
  return {
    ...slice,
    status: 'succeeded',
    items: payload.items,
    meta: { ...slice.meta, ...(payload.meta || {}) },
    query: payload.query ?? slice.query,
  };
}

export function listRejected<T>(slice: ListState<T>, error: string): ListState<T> {
  return { ...slice, status: 'failed', error };
}

export function unwrapList<T>(
  data: ApiEnvelope<T[]>,
  fallbackLimit = config.pageSize,
): { items: T[]; meta: Partial<ListMeta> } {
  const items = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta || {
    page: 1,
    limit: fallbackLimit,
    total: items.length,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };
  return { items, meta };
}

/** Query keys for lists */
export function buildListParams(
  query: ListQuery,
  extra: { category?: boolean } = {},
): Record<string, unknown> {
  return {
    page: query.page,
    limit: config.pageSize,
    search: query.search,
    status: query.status,
    ...(extra.category ? { category: query.category } : {}),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
}
