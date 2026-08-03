export interface User {
  _id: string;
  first_name?: string;
  last_name?: string;
  email_id?: string;
  phone_number?: string;
  profile_picture?: string;
  [key: string]: unknown;
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pendingCount?: number;
  unreadCount?: number;
  /** How many sent requests sit in each status — drives the My Requests tabs. */
  statusCounts?: Record<string, number>;
}

export interface ListQuery {
  page: number;
  search: string;
  status: string;
  category: string;
  sortBy: string;
  sortOrder: string;
}

export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface TaskAuthor {
  _id?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  picture?: string;
}

export interface Task {
  _id: string;
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  picture?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  hasRequested?: boolean;
  user_id?: TaskAuthor | string;
}

export interface HelpRequest {
  requestId: string;
  status: string;
  description?: string;
  creationDate?: string;
  taskTitle?: string;
  taskPicture?: string;
  taskLocation?: string;
  taskOwnerName?: string;
  requester?: {
    name?: string;
    first_name?: string;
    profilePicture?: string;
    picture?: string;
  };
}

export interface AppNotification {
  _id: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
  /*
   * The backend has always sent these two — both the list endpoint and the
   * socket payload include them — they just were not declared here. `type` is
   * what tells the dropdown which page a notification belongs to; see
   * notification-routing.ts.
   */
  type?: string;
  reference_id?: string | null;
}

/** The envelope every backend endpoint wraps its payload in. */
export interface ApiEnvelope<T> {
  message?: string;
  data?: T;
  meta?: Partial<ListMeta>;
}
