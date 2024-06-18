import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { serverURL } from './config.js';

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetch(`${serverURL}/bookings/my/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {setBookings(data); setIsLoading(false);})
    .catch(error => {console.error('Error fetching bookings:', error); setIsLoading(false);});
  }, []);

  // const formatDateTime = (dateTimeStr) => {
  //   const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  //   return new Date(dateTimeStr).toLocaleDateString(undefined, options);
  // };

    const formatDateTime = (dateTimeStr) => {
      const date = new Date(dateTimeStr);
      const year = date.getFullYear();
      const month = date.toLocaleString('default', { month: 'long' });
      const day = date.getDate();
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year} ${hour}:${minute}`;
    };

    const handleCancelBooking = (bookingId) => {
      const token = localStorage.getItem('authToken');
      const isConfirmed = window.confirm('Are you sure you want to cancel this booking?');
      if (isConfirmed) {
      fetch(`${serverURL}/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          setBookings(bookings.filter(booking => booking.id !== bookingId));
        } else {
          console.error('Failed to cancel booking');
        }
      })
      .catch(error => console.error('Error canceling booking:', error));
    } else{
      console.log('Booking is not canceled');
    }
    };

    if (isLoading) { 
      return <div>
        <Navbar />
        <h1>My Bookings</h1>
        <div>Loading...</div>;
      </div>
       
    }

    return (
      <div>
        <Navbar />
        <h1>My Bookings</h1>
        <div id="bookings">
      {bookings.map((booking, index) => (
        <div key={booking.booking.id}>
          Бронирование {index + 1}, C {formatDateTime(booking.booking.time_from)}; До {formatDateTime(booking.booking.time_to)}
          <div>Services:</div>
          <ul>
            {booking.services.map(service => (
              <li key={service.id}>{service.description} (Duration: {service.duration} minutes)</li>
            ))}
          </ul>
          <button onClick={() => handleCancelBooking(booking.booking.id)}>Cancel</button>
        </div>
      ))}
    </div>
      </div>
    );
  }

export default BookingsPage;