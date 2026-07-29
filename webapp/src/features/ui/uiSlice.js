import { createSlice } from "@reduxjs/toolkit";

export const PAGES = ["Feed", "My Tasks", "Requests", "My Requests", "Add Task", "Settings"];

const initialState = {
    activePage: "Feed",
    searchTerm: "",
    showMenu: false,
    showNotifications: false,
    showLogoutConfirm: false,
    // Global blocking loader, used only for genuinely blocking operations.
    busy: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setActivePage(state, action) {
            if (!PAGES.includes(action.payload)) return;
            state.activePage = action.payload;
            // The search box is shared across tabs and its term deliberately
            // carries over, matching how the dashboard has always behaved —
            // the difference is only that the filtering now runs server-side.
            state.showMenu = false;
        },
        setSearchTerm(state, action) {
            state.searchTerm = action.payload;
        },
        setShowMenu(state, action) {
            state.showMenu = action.payload;
        },
        toggleNotifications(state, action) {
            state.showNotifications = action.payload ?? !state.showNotifications;
        },
        setShowLogoutConfirm(state, action) {
            state.showLogoutConfirm = action.payload;
        },
        setBusy(state, action) {
            state.busy = action.payload;
        },
        resetUi() {
            return initialState;
        },
    },
});

export const {
    setActivePage,
    setSearchTerm,
    setShowMenu,
    toggleNotifications,
    setShowLogoutConfirm,
    setBusy,
    resetUi,
} = uiSlice.actions;

export const selectActivePage = (state) => state.ui.activePage;
export const selectSearchTerm = (state) => state.ui.searchTerm;
export const selectUiFlags = (state) => state.ui;

export default uiSlice.reducer;
