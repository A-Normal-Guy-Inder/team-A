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
    feed: emptyList(),
    myTasks: emptyList(),
    saving: false,
    error: null,
};

function buildParams(query) {
    return toQueryParams({
        page: query.page,
        limit: config.pageSize,
        search: query.search,
        status: query.status,
        category: query.category,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
    });
}

export const fetchFeed = createAsyncThunk(
    "tasks/fetchFeed",
    async (overrides = {}, { getState, rejectWithValue }) => {
        const query = { ...getState().tasks.feed.query, ...overrides };
        try {
            const { data } = await api.get("/task/feed", { params: buildParams(query) });
            return { ...unwrapList(data), query };
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Failed to load the feed"));
        }
    }
);

export const fetchMyTasks = createAsyncThunk(
    "tasks/fetchMyTasks",
    async (overrides = {}, { getState, rejectWithValue }) => {
        const query = { ...getState().tasks.myTasks.query, ...overrides };
        try {
            const { data } = await api.get("/task/me", { params: buildParams(query) });
            return { ...unwrapList(data), query };
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Failed to load your tasks"));
        }
    }
);

export const createTask = createAsyncThunk(
    "tasks/createTask",
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/task/create", formData);
            return data.data.task;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Task creation failed"));
        }
    }
);

export const updateTask = createAsyncThunk(
    "tasks/updateTask",
    async ({ taskId, formData }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/task/${taskId}`, formData);
            return data.data.task;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Failed to update task"));
        }
    }
);

const tasksSlice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        setFeedQuery(state, action) {
            state.feed.query = { ...state.feed.query, ...action.payload, page: action.payload.page ?? 1 };
        },
        setMyTasksQuery(state, action) {
            state.myTasks.query = {
                ...state.myTasks.query,
                ...action.payload,
                page: action.payload.page ?? 1,
            };
        },
        markTaskRequested(state, action) {
            const task = state.feed.items.find((item) => item._id === action.payload);
            if (task) task.hasRequested = true;
        },
        resetTasks() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFeed.pending, (state) => listPending(state.feed))
            .addCase(fetchFeed.fulfilled, (state, action) => {
                state.feed.query = action.payload.query;
                listFulfilled(state.feed, action);
            })
            .addCase(fetchFeed.rejected, (state, action) => listRejected(state.feed, action))

            .addCase(fetchMyTasks.pending, (state) => listPending(state.myTasks))
            .addCase(fetchMyTasks.fulfilled, (state, action) => {
                state.myTasks.query = action.payload.query;
                listFulfilled(state.myTasks, action);
            })
            .addCase(fetchMyTasks.rejected, (state, action) => listRejected(state.myTasks, action))

            .addCase(createTask.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createTask.fulfilled, (state) => {
                state.saving = false;
            })
            .addCase(createTask.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload;
            })

            .addCase(updateTask.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                state.saving = false;
                const updated = action.payload;
                const index = state.myTasks.items.findIndex((task) => task._id === updated._id);
                if (index !== -1) {
                    state.myTasks.items[index] = { ...state.myTasks.items[index], ...updated };
                }
            })
            .addCase(updateTask.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload;
            });
    },
});

export const { setFeedQuery, setMyTasksQuery, markTaskRequested, resetTasks } = tasksSlice.actions;

export const selectFeed = (state) => state.tasks.feed;
export const selectMyTasks = (state) => state.tasks.myTasks;
export const selectTasksSaving = (state) => state.tasks.saving;

export default tasksSlice.reducer;
