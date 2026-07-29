import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "../../styles/dashboard.css";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileMenu from "./MobileMenu";
import FeedPage from "./pages/FeedPage";
import MyTasksPage from "./pages/MyTasksPage";
import ReceivedRequestsPage from "./pages/ReceivedRequestsPage";
import SentRequestsPage from "./pages/SentRequestsPage";
import AddTaskPage from "./pages/AddTaskPage";
import EditTaskModal from "./modals/EditTaskModal";
import SendRequestModal from "./modals/SendRequestModal";
import ConfirmModal from "./modals/ConfirmModal";
import Settings from "../Settings/Settings";
import Loader from "../Loader";

import useDebouncedValue from "../../hooks/useDebouncedValue";
import useRealtime from "../../hooks/useRealtime";

import { logoutUser, selectCurrentUser, selectLogoutPending } from "../../features/auth/authSlice";
import { fetchFeed, fetchMyTasks } from "../../features/tasks/tasksSlice";
import {
    fetchReceivedRequests,
    fetchSentRequests,
    selectActionInFlight,
    selectPendingCount,
    selectRequestSending,
} from "../../features/requests/requestsSlice";
import { selectTasksSaving } from "../../features/tasks/tasksSlice";
import {
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    selectNotifications,
    selectNotificationsMeta,
    selectUnreadCount,
} from "../../features/notifications/notificationsSlice";
import {
    selectActivePage,
    selectSearchTerm,
    selectUiFlags,
    setActivePage,
    setSearchTerm,
    setShowLogoutConfirm,
    setShowMenu,
    toggleNotifications,
} from "../../features/ui/uiSlice";

const PAGE_FETCHERS = {
    Feed: fetchFeed,
    "My Tasks": fetchMyTasks,
    Requests: fetchReceivedRequests,
    "My Requests": fetchSentRequests,
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const user = useSelector(selectCurrentUser);
    const activePage = useSelector(selectActivePage);
    const searchTerm = useSelector(selectSearchTerm);
    const { showMenu, showNotifications, showLogoutConfirm } = useSelector(selectUiFlags);
    const pendingCount = useSelector(selectPendingCount);
    const notifications = useSelector(selectNotifications);
    const notificationsMeta = useSelector(selectNotificationsMeta);
    const unreadCount = useSelector(selectUnreadCount);
    const logoutPending = useSelector(selectLogoutPending);
    const tasksSaving = useSelector(selectTasksSaving);
    const requestSending = useSelector(selectRequestSending);
    const actionInFlight = useSelector(selectActionInFlight);

    const busy =
        tasksSaving || requestSending || logoutPending || Object.keys(actionInFlight).length > 0;

    const [editingTask, setEditingTask] = useState(null);
    const [requestTarget, setRequestTarget] = useState(null);

    const debouncedSearch = useDebouncedValue(searchTerm, 400);
    const effectiveSearch = searchTerm === "" ? "" : debouncedSearch;

    const activePageRef = useRef(activePage);
    activePageRef.current = activePage;

    const handleRequestUpdated = useCallback(
        (payload) => {
            const scope = payload?.scope;
            if (scope === "received") dispatch(fetchReceivedRequests());
            if (scope === "sent" && activePageRef.current === "My Requests") {
                dispatch(fetchSentRequests());
            }
        },
        [dispatch]
    );

    const handleTaskUpdated = useCallback(() => {
        if (activePageRef.current === "Feed") dispatch(fetchFeed());
        if (activePageRef.current === "My Tasks") dispatch(fetchMyTasks());
    }, [dispatch]);

    useRealtime(user?._id, {
        onRequestUpdated: handleRequestUpdated,
        onTaskUpdated: handleTaskUpdated,
    });

    useEffect(() => {
        const fetcher = PAGE_FETCHERS[activePage];
        if (fetcher) dispatch(fetcher({ search: effectiveSearch, page: 1 }));
    }, [activePage, effectiveSearch, dispatch]);

    const seeded = useRef(false);
    useEffect(() => {
        if (!user?._id || seeded.current) return;
        seeded.current = true;

        dispatch(fetchNotifications({ page: 1 }));
        if (activePageRef.current !== "Requests") dispatch(fetchReceivedRequests({ page: 1 }));
    }, [dispatch, user?._id]);

    useEffect(() => {
        if (location.state?.openPage) {
            dispatch(setActivePage(location.state.openPage));
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state, location.pathname, dispatch, navigate]);

    const handleNavigate = useCallback((page) => dispatch(setActivePage(page)), [dispatch]);
    const handleSearchChange = useCallback((value) => dispatch(setSearchTerm(value)), [dispatch]);
    const handleOpenMenu = useCallback(() => dispatch(setShowMenu(true)), [dispatch]);
    const handleCloseMenu = useCallback(() => dispatch(setShowMenu(false)), [dispatch]);
    const handleToggleNotifications = useCallback(() => dispatch(toggleNotifications()), [dispatch]);
    const handleMarkRead = useCallback((id) => dispatch(markNotificationRead(id)), [dispatch]);
    const handleMarkAllRead = useCallback(() => dispatch(markAllNotificationsRead()), [dispatch]);
    const handleLoadMoreNotifications = useCallback(
        () => dispatch(fetchNotifications({ page: (notificationsMeta.page || 1) + 1 })),
        [dispatch, notificationsMeta.page]
    );

    const handleLogout = useCallback(async () => {
        const result = await dispatch(logoutUser());
        if (logoutUser.rejected.match(result)) {
            toast.error("Logout failed");
            return;
        }
        toast.success("Logged out successfully 👋");
        dispatch(setShowLogoutConfirm(false));
        navigate("/login", { replace: true });
    }, [dispatch, navigate]);

    const handleMenuNavigate = useCallback(
        (page) => {
            dispatch(setActivePage(page));
            dispatch(setShowMenu(false));
        },
        [dispatch]
    );

    const handleMenuLogout = useCallback(() => {
        dispatch(setShowMenu(false));
        dispatch(setShowLogoutConfirm(true));
    }, [dispatch]);

    return (
        <>
            {busy && <Loader />}
            <div className="dashboard-layout">
            <Sidebar
                activePage={activePage}
                onNavigate={handleNavigate}
                user={user && { ...user, email: user.email_id, picture: user.profile_picture }}
                pendingCount={pendingCount}
                onLogoutClick={() => dispatch(setShowLogoutConfirm(true))}
            />

            <div className="dashboard-right">
                <Topbar
                    activePage={activePage}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onOpenMenu={handleOpenMenu}
                    showNotifications={showNotifications}
                    onToggleNotifications={handleToggleNotifications}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAllRead={handleMarkAllRead}
                    onMarkRead={handleMarkRead}
                    onLoadMoreNotifications={handleLoadMoreNotifications}
                    canLoadMoreNotifications={Boolean(notificationsMeta.hasNextPage)}
                />

                <main className="main">
                    {activePage === "Feed" && <FeedPage onRequestTask={setRequestTarget} />}

                    {activePage === "My Tasks" && (
                        <MyTasksPage
                            onAddTask={() => handleNavigate("Add Task")}
                            onEditTask={setEditingTask}
                        />
                    )}

                    {activePage === "Requests" && <ReceivedRequestsPage />}

                    {activePage === "My Requests" && <SentRequestsPage />}

                    {activePage === "Add Task" && <AddTaskPage />}

                    {activePage === "Settings" && <Settings />}
                </main>

                {editingTask && (
                    <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />
                )}

                {requestTarget && (
                    <SendRequestModal task={requestTarget} onClose={() => setRequestTarget(null)} />
                )}

                {showMenu && (
                    <MobileMenu
                        onClose={handleCloseMenu}
                        onNavigate={handleMenuNavigate}
                        onLogoutClick={handleMenuLogout}
                    />
                )}

                {showLogoutConfirm && (
                    <ConfirmModal
                        message="Do you really want to logout?"
                        onConfirm={handleLogout}
                        onCancel={() => dispatch(setShowLogoutConfirm(false))}
                        busy={logoutPending}
                    />
                )}
            </div>
            </div>
        </>
    );
};

export default Dashboard;
