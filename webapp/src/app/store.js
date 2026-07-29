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
            serializableCheck: {
                ignoredActionPaths: ["meta.arg", "payload.formData"],
            },
        }),
});

setUnauthorizedHandler(() => store.dispatch(sessionExpired()));

export default store;
