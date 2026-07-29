import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, toQueryParams } from "../../services/api";

const PAGE_SIZE = 20;

const initialState = {
    items: [],
    unreadCount: 0,
    meta: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false },
    status: "idle",
    error: null,
    connected: false,
};

export const fetchNotifications = createAsyncThunk(
    "notifications/fetch",
    async ({ page = 1, status = "unread" } = {}, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/notifications", {
                params: toQueryParams({ page, limit: PAGE_SIZE, status }),
            });
            return { items: data.data || [], meta: data.meta || {}, page };
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Failed to load notifications"));
        }
    }
);

export const markNotificationRead = createAsyncThunk(
    "notifications/markRead",
    async (notificationId, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/notifications/${notificationId}/read`);
            return { notificationId, unreadCount: data.data?.unreadCount };
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Failed to mark notification as read"));
        }
    }
);

export const markAllNotificationsRead = createAsyncThunk(
    "notifications/markAllRead",
    async (_, { rejectWithValue }) => {
        try {
            await api.put("/notifications/read-all");
            return true;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Failed to mark notifications as read"));
        }
    }
);

const notificationsSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        /**
         * Pushed in by the socket listener. Replaces the 10s poll the dashboard
         * used to run: notifications now arrive the moment they are created.
         */
        notificationReceived(state, action) {
            const incoming = action.payload;
            if (!incoming?._id) return;
            if (state.items.some((item) => item._id === incoming._id)) return;

            state.items.unshift(incoming);
            if (!incoming.read) state.unreadCount += 1;
            state.meta.total += 1;
        },
        notificationReadRemotely(state, action) {
            const { _id, unreadCount } = action.payload || {};
            const item = state.items.find((entry) => entry._id === _id);
            if (item) item.read = true;
            if (typeof unreadCount === "number") state.unreadCount = unreadCount;
        },
        allNotificationsReadRemotely(state) {
            state.items.forEach((item) => {
                item.read = true;
            });
            state.unreadCount = 0;
        },
        setSocketConnected(state, action) {
            state.connected = action.payload;
        },
        resetNotifications() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.status = "succeeded";
                const { items, meta, page } = action.payload;
                // Page 1 replaces; later pages append ("load more" in the dropdown).
                state.items = page > 1 ? [...state.items, ...items] : items;
                state.meta = { ...state.meta, ...meta, page };
                if (typeof meta.unreadCount === "number") state.unreadCount = meta.unreadCount;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            .addCase(markNotificationRead.fulfilled, (state, action) => {
                const item = state.items.find((entry) => entry._id === action.payload.notificationId);
                if (item) item.read = true;
                state.unreadCount =
                    typeof action.payload.unreadCount === "number"
                        ? action.payload.unreadCount
                        : Math.max(0, state.unreadCount - 1);
            })
            .addCase(markAllNotificationsRead.fulfilled, (state) => {
                state.items.forEach((item) => {
                    item.read = true;
                });
                state.unreadCount = 0;
            });
    },
});

export const {
    notificationReceived,
    notificationReadRemotely,
    allNotificationsReadRemotely,
    setSocketConnected,
    resetNotifications,
} = notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationsMeta = (state) => state.notifications.meta;

export default notificationsSlice.reducer;
