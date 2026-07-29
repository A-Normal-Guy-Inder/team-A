import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthChecked, selectCurrentUser } from "../features/auth/authSlice";

const PublicOnlyRoute = ({ children }) => {
    const user = useSelector(selectCurrentUser);
    const checked = useSelector(selectAuthChecked);

    if (checked && user) return <Navigate to="/Dashboard" replace />;

    return children;
};

export default PublicOnlyRoute;
