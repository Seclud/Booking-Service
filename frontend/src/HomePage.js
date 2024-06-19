import React from 'react';
import {Navigate} from "react-router-dom";
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';

function HomePage() {
    // const { isAuthenticated, logout } = useAuth();

    // const handleLogout = () => {
    //     logout();
    // }; 

    // return (
    //     <div>
    //     <Navbar />
    //     <h1>Welcome to the App</h1>
    //     <nav>
    //     <ul>
    //         {!isAuthenticated ? (
    //         <>
    //           <li><Link to="/login">Login</Link></li>
    //           <li><Link to="/register">Register</Link></li>
    //         </>
    //         ) : (
    //             <>
    //             <li><Link to="/garages">Garages</Link></li>
    //             <li><button onClick={handleLogout}>Logout</button></li>
    //             </>
    //         )}
    //         </ul>
    //     </nav>
    //     </div>
    // );
    // }
    return <Navigate to="/garages" replace/>
}

export default HomePage;