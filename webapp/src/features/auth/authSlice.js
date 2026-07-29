import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "../../services/api";

const initialState = {
    user: null,
    status: "idle", // idle | loading | succeeded | failed
    checked: false, // has a session probe completed at least once?
    error: null,
    logoutPending: false,
};

/** Probes the session cookie. Used by the route guard and on app start. */
export const fetchCurrentUser = createAsyncThunk(
    "auth/fetchCurrentUser",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/auth/me");
            return data.data.user;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Not authenticated"));
        }
    }
);

export const loginUser = createAsyncThunk(
    "auth/login",
    async (credentials, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/login", credentials);
            return data.data?.user ?? null;
        } catch (error) {
            return rejectWithValue(getErrorMessage(error, "Login failed"));
        }
    }
);

export const logoutUser = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
    try {
        await api.post("/auth/logout");
        return true;
    } catch (error) {
        return rejectWithValue(getErrorMessage(error, "Logout failed"));
    }
});

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        /** Called by the axios interceptor when the server rejects the session. */
        sessionExpired(state) {
            state.user = null;
            state.status = "idle";
            state.checked = true;
        },
        setUser(state, action) {
            state.user = action.payload;
        },
        /** Patches the cached profile after a settings update. */
        patchUser(state, action) {
            if (state.user) state.user = { ...state.user, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload;
                state.checked = true;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.status = "failed";
                state.user = null;
                state.checked = true;
                state.error = action.payload;
            })
            .addCase(loginUser.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload;
                state.checked = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            .addCase(logoutUser.pending, (state) => {
                state.logoutPending = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.logoutPending = false;
                state.user = null;
                state.checked = true;
            })
            .addCase(logoutUser.rejected, (state) => {
                state.logoutPending = false;
            });
    },
});

export const { sessionExpired, setUser, patchUser } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthChecked = (state) => state.auth.checked;
export const selectAuthStatus = (state) => state.auth.status;
export const selectLogoutPending = (state) => state.auth.logoutPending;

export default authSlice.reducer;
