import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import ReactSelect from 'react-select';

function BookingForm() {
  const { liftId } = useParams();
  const [services, setServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const options = services.map(service => ({ value: service.id, label: `${service.description} (${service.duration} минут)` }));

  const [bookingData, setBookingData] = useState({
    lift_id: liftId,
    time_from: '',
    time_to: '',
    //services: [],
  });

  useEffect(() => {
    const fetchServices = async () => {
      const response = await fetch('http://localhost:8000/services');
      const data = await response.json();
      setServices(data);
    };
    fetchServices();
  }, []);

  const calculateAndSetTimeTo = (newSelectedServiceIds) => {
    const totalDuration = newSelectedServiceIds.reduce((acc, serviceId) => {
      const service = services.find(service => service.id === serviceId);
      return acc + (service ? service.duration : 0);
    }, 0);
    if (bookingData.time_from) {
      const timeFrom = new Date(bookingData.time_from);
      if (!isNaN(timeFrom.getTime())) {
        const timezoneOffset = timeFrom.getTimezoneOffset() * 60000;
        const timeTo = new Date(timeFrom.getTime() + totalDuration * 60000 - timezoneOffset);
        const formattedTimeTo = timeTo.toISOString().slice(0, 16);
        setBookingData({ ...bookingData, time_to: formattedTimeTo, services: selectedServiceIds });
      }
    }
  };

  const handleChange = (selectedOptions) => {
    const newSelectedServiceIds = selectedOptions.map(option => parseInt(option.value));
    setSelectedServiceIds(newSelectedServiceIds);
    calculateAndSetTimeTo(newSelectedServiceIds);
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setBookingData({ ...bookingData, [name]: value });
  };

  useEffect(() => {
    if (bookingData.time_from) {
      calculateAndSetTimeTo(selectedServiceIds);
    } // This effect should run only when bookingData.time_from changes
  }, [bookingData.time_from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('http://localhost:8000/bookings/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Assuming you have a way to get the current user's auth token
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify(bookingData),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log('Booking created successfully:', response.data);
      // Handle success (e.g., show a success message, redirect, etc.)
    } catch (error) {
      console.error('Error creating booking:', error.detail);
      // Handle error (e.g., show error message)
    }
  };

  return (
    //display: 'flex', flexDirection: 'column', alignItems: 'center', 
    <form onSubmit={handleSubmit}>
      <Navbar />
      <div className= "bookingform" style={{ margin: '10px 0' }}>
        <label>
          Lift ID:
          <span>{bookingData.lift_id}</span>
        </label>
      </div>
      <div className= "bookingform" style={{ margin: '10px 0' }}>
        <label>
          Services:
          <ReactSelect
            options={options}
            isMulti
            onChange={handleChange}
          />
        </label>
      </div>
      <div className= "bookingform" style={{ margin: '10px 0' }}>
        <label>
          Time From:
          <input
            type="datetime-local"
            name="time_from"
            value={bookingData.time_from}
            onChange={handleTimeChange}
            required
          />
        </label>
      </div>
      <div className= "bookingform" style={{ margin: '10px 0' }}>
        <label>
          Time To:
          <input
            type="datetime-local"
            name="time_to"
            value={bookingData.time_to}
            disabled
          />
        </label>
      </div>
      <button className= "bookingform" type="submit" style={{ marginTop: '20px' }}>Create Booking</button>
    </form>
  );
}

export default BookingForm;