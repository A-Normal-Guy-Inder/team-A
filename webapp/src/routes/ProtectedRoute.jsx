import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../components/Loader";
import {
    fetchCurrentUser,
    selectAuthChecked,
    selectAuthStatus,
    selectCurrentUser,
} from "../features/auth/authSlice";

const ProtectedRoute = ({ children }) => {
    const dispatch = useDispatch();
    const location = useLocation();

    const user = useSelector(selectCurrentUser);
    const checked = useSelector(selectAuthChecked);
    const status = useSelector(selectAuthStatus);

    useEffect(() => {
        if (!checked && status !== "loading") {
            dispatch(fetchCurrentUser());
        }
    }, [checked, status, dispatch]);

    if (!checked) return <Loader />;

    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

    return children;
};

export default ProtectedRoute;
