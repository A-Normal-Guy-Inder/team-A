import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import Login from "./components/Login";
import Signup from "./components/Signup";
import VerifyEmail from "./components/VerifyEmail";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Loader from "./components/Loader";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";

const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const ChangeEmail = lazy(() => import("./components/Settings/ChangeEmail"));
const ChangePassword = lazy(() => import("./components/Settings/ChangePassword"));

const guarded = (element) => <ProtectedRoute>{element}</ProtectedRoute>;
const publicOnly = (element) => <PublicOnlyRoute>{element}</PublicOnlyRoute>;

function App() {
    return (
        <BrowserRouter>
            <ToastContainer position="top-right" autoClose={3000} />
            <Suspense fallback={<Loader />}>
                <Routes>
                    <Route path="/" element={publicOnly(<Login />)} />
                    <Route path="/login" element={publicOnly(<Login />)} />
                    <Route path="/signup" element={publicOnly(<Signup />)} />
                    <Route path="/ForgotPassword" element={publicOnly(<ForgotPassword />)} />
                    <Route path="/verify" element={<VerifyEmail />} />
                    <Route path="/ResetPassword" element={<ResetPassword />} />

                    <Route path="/Dashboard" element={guarded(<Dashboard />)} />
                    {}
                    <Route path="/change-email" element={guarded(<ChangeEmail />)} />
                    <Route path="/change-password" element={guarded(<ChangePassword />)} />

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
