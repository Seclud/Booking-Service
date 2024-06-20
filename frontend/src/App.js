import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import './App.css'
import LoginPage from './LoginPage.js';
import RegistrationPage from './RegistrationPage';
import HomePage from './HomePage';
import GaragesPage from './GaragesPage';
import GarageDetailPage from './GarageDetailPage';
import LiftBookingPage from './LiftBookingPage';
import BookingsPage from './BookingsPage.js';
import CreateGaragePage from './CreateGaragePage.js';
import LiftCreationPage from './LiftCreationPage';
import AllBookingsPage from './AllBookingsPage.js'
import {MantineProvider} from "@mantine/core";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import {Notifications} from "@mantine/notifications";
import Layout from './components/Layout';
import EmailConfirmationPage from './EmailConfirmationPage';

function App() {
  return (
    <MantineProvider>
      <Notifications />
      <AuthProvider>
        <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registration" element={<RegistrationPage />} />
                <Route path="/garages" element={<GaragesPage />} />
                <Route path="/garage/:id" element={<GarageDetailPage/>} />
                <Route path="/book/lift/:liftId" element={<LiftBookingPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/garage/create" element={<CreateGaragePage />} />
                <Route path="/lifts/create/:serviceId" element={<LiftCreationPage />} />
                <Route path="/all-bookings" element={<AllBookingsPage />} />
                <Route path="/email-confirmation/:confirmationToken" element={<EmailConfirmationPage />} />            
              </Route>
            </Routes>
        </Router>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;