import React from 'react';
import {Navigate, Outlet, useLocation} from 'react-router-dom';
import {useAuth} from "./AuthContext";

export default function NotAuthGuard() {
    const {isAuthenticated} = useAuth();
    const location = useLocation();

    if (isAuthenticated) {
        const redirect = {
            pathname: location.search.slice(1) || '/garages',
        };

        return <Navigate to={redirect} replace/>
    }

    return <Outlet/>;
};
