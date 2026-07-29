import { configureStore } from "@reduxjs/toolkit";
import authReducer, { sessionExpired } from "../features/auth/authSlice";
import tasksReducer from "../features/tasks/tasksSlice";
import requestsReducer from "../features/requests/requestsSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import uiReducer from "../features/ui/uiSlice";
import { setUnauthorizedHandler } from "../services/api";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tasks: tasksReducer,
        requests: requestsReducer,
        notifications: notificationsReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            // FormData instances are passed to upload thunks; they are not
            // serialisable and are never stored in state.
            serializableCheck: {
                ignoredActionPaths: ["meta.arg", "payload.formData"],
            },
        }),
});

// A dropped session is reported by the API layer and handled in exactly one
// place, instead of every component checking for 401 itself.
setUnauthorizedHandler(() => store.dispatch(sessionExpired()));

export default store;
