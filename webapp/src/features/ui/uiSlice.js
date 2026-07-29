import { createSlice } from "@reduxjs/toolkit";

export const PAGES = ["Feed", "My Tasks", "Requests", "My Requests", "Add Task", "Settings"];

const initialState = {
    activePage: "Feed",
    searchTerm: "",
    showMenu: false,
    showNotifications: false,
    showLogoutConfirm: false,
    busy: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setActivePage(state, action) {
            if (!PAGES.includes(action.payload)) return;
            state.activePage = action.payload;
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
