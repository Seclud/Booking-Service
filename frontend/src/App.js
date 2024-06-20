import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import {AuthProvider} from './AuthContext';
import './App.css'
import LoginPage from './LoginPage.js';
import RegistrationPage from './RegistrationPage';
import HomePage from './HomePage';
import GaragesPage from './GaragesPage';
import GarageDetailPage from './GarageDetailPage';
import BookingsPage from './BookingsPage.js';
import AllBookingsPage from './AllBookingsPage.js'
import {MantineProvider} from "@mantine/core";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import {Notifications} from "@mantine/notifications";
import Layout from './components/Layout';
import EmailConfirmationPage from './EmailConfirmationPage';
import AuthGuard from './authGuard';
import NotAuthGuard from './notAuthGuard';

function App() {
    return (
        <MantineProvider>
            <Notifications/>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route element={<Layout/>}>
                            <Route element={<NotAuthGuard/>}>
                                <Route path="/" element={<HomePage/>}/>
                                <Route path="/login" element={<LoginPage/>}/>
                                <Route path="/registration" element={<RegistrationPage/>}/>
                            </Route>
                            <Route path="/email-confirmation/:confirmationToken" element={<EmailConfirmationPage/>}/>
                            <Route path="/garages" element={<GaragesPage/>}/>
                            <Route element={<AuthGuard/>}>
                                <Route path="/garages" element={<GaragesPage/>}/>
                                <Route path="/garage/:id" element={<GarageDetailPage/>}/>
                                <Route path="/bookings" element={<BookingsPage/>}/>
                                <Route path="/all-bookings" element={<AllBookingsPage/>}/>
                            </Route>
                        </Route>
                    </Routes>
                </Router>
            </AuthProvider>
        </MantineProvider>
    );
}

export default App;