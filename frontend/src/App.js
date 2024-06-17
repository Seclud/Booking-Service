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
import CreateCarServicePage from './CreateCarServicePage';
import LiftCreationPage from './LiftCreationPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/garages" element={<GaragesPage />} />
          <Route path="/carservices/:id" element={<GarageDetailPage/>} />
          <Route path="/book/lift/:liftId" element={<LiftBookingPage />} />
          <Route path="/mybookings" element={<BookingsPage />} />
          <Route path="/carservices/create" element={<CreateCarServicePage />} />
          <Route path="/lifts/create/:serviceId" element={<LiftCreationPage />} />
          {/* Add other routes here */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;