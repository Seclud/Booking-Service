import React from 'react';
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {useAuth} from "./AuthContext";

export default function AuthGuard () {
    const {isAuthenticated} = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        const redirect = {
            pathname: 'login',
            search: location.pathname,
        };
        return <Navigate to={redirect} replace />;
    }

    return <Outlet/>;
};
