import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthChecked, selectCurrentUser } from "../features/auth/authSlice";

/**
 * Keeps an already-authenticated user out of the login/signup screens.
 *
 * No probe is issued here — it only redirects when a session is *already*
 * known, so an anonymous visitor still reaches the login page immediately.
 */
const PublicOnlyRoute = ({ children }) => {
    const user = useSelector(selectCurrentUser);
    const checked = useSelector(selectAuthChecked);

    if (checked && user) return <Navigate to="/Dashboard" replace />;

    return children;
};

export default PublicOnlyRoute;
