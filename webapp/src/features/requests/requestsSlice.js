import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, toQueryParams } from "../../services/api";
import config from "../../config";
import {
    emptyList,
    listFulfilled,
    listPending,
    listRejected,
    unwrapList,
} from "../shared/pagination";

const initialState = {
    received: { ...emptyList(), meta: { ...emptyList().meta, pendingCount: 0 } },
    sent: emptyList(),
    sending: false,
    actionInFlight: {},
};

function buildParams(query) {
    return toQueryParams({
        page: query.page,
        limit: config.pageSize,
        search: query.search,
        status: query.status,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
    });
}

export const fetchReceivedRequests = createAsyncThunk(
    "requests/fetchReceived",
    async (overrides = {}, { getState, rejectWithValue }) => {
        const query = { ...getState().requests.received.query, ...overrides };
        try {
            const { data } = await api.get("/requests/received", { params: buildParams(query) });
            return { ...unwrapList(data), query };
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Failed to load received requests"));
        }
    }
);

export const fetchSentRequests = createAsyncThunk(
    "requests/fetchSent",
    async (overrides = {}, { getState, rejectWithValue }) => {
        const query = { ...getState().requests.sent.query, ...overrides };
        try {
            const { data } = await api.get("/requests/sent", { params: buildParams(query) });
            return { ...unwrapList(data), query };
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Failed to load sent requests"));
        }
    }
);

export const sendRequest = createAsyncThunk(
    "requests/send",
    async ({ taskId, description }, { rejectWithValue }) => {
        try {
            const { data } = await api.post(`/requests/${taskId}/send`, { description });
            return { taskId, requestId: data.data.requestId };
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Failed to send request. Please try again."));
        }
    }
);

export const respondToRequest = createAsyncThunk(
    "requests/respond",
    async ({ requestId, status }, { rejectWithValue }) => {
        try {
            await api.put(`/requests/${requestId}`, { status });
            return { requestId, status };
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, `Failed to ${status.replace("ed", "")} request`));
        }
    }
);

const requestsSlice = createSlice({
    name: "requests",
    initialState,
    reducers: {
        setReceivedQuery(state, action) {
            state.received.query = {
                ...state.received.query,
                ...action.payload,
                page: action.payload.page ?? 1,
            };
        },
        setSentQuery(state, action) {
            state.sent.query = { ...state.sent.query, ...action.payload, page: action.payload.page ?? 1 };
        },
        resetRequests() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReceivedRequests.pending, (state) => listPending(state.received))
            .addCase(fetchReceivedRequests.fulfilled, (state, action) => {
                state.received.query = action.payload.query;
                listFulfilled(state.received, action);
            })
            .addCase(fetchReceivedRequests.rejected, (state, action) =>
                listRejected(state.received, action)
            )

            .addCase(fetchSentRequests.pending, (state) => listPending(state.sent))
            .addCase(fetchSentRequests.fulfilled, (state, action) => {
                state.sent.query = action.payload.query;
                listFulfilled(state.sent, action);
            })
            .addCase(fetchSentRequests.rejected, (state, action) => listRejected(state.sent, action))

            .addCase(sendRequest.pending, (state) => {
                state.sending = true;
            })
            .addCase(sendRequest.fulfilled, (state) => {
                state.sending = false;
            })
            .addCase(sendRequest.rejected, (state) => {
                state.sending = false;
            })

            .addCase(respondToRequest.pending, (state, action) => {
                state.actionInFlight[action.meta.arg.requestId] = action.meta.arg.status;
            })
            .addCase(respondToRequest.fulfilled, (state, action) => {
                delete state.actionInFlight[action.payload.requestId];
                const row = state.received.items.find((item) => item.requestId === action.payload.requestId);
                if (row) row.status = action.payload.status;
                if (state.received.meta.pendingCount > 0) state.received.meta.pendingCount -= 1;
            })
            .addCase(respondToRequest.rejected, (state, action) => {
                delete state.actionInFlight[action.meta.arg.requestId];
            });
    },
});

export const { setReceivedQuery, setSentQuery, resetRequests } = requestsSlice.actions;

export const selectReceivedRequests = (state) => state.requests.received;
export const selectSentRequests = (state) => state.requests.sent;
export const selectPendingCount = (state) => state.requests.received.meta.pendingCount || 0;
export const selectRequestSending = (state) => state.requests.sending;
export const selectActionInFlight = (state) => state.requests.actionInFlight;

export default requestsSlice.reducer;
