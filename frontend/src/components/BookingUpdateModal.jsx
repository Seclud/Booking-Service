import React, { useEffect, useState } from 'react';
import { Modal, Button, Text, Select, TextInput, MultiSelect } from '@mantine/core';
import {DateTimePicker, TimeInput} from '@mantine/dates';
import { serverURL } from '../config.js';
import {addMinutes, formatISO} from 'date-fns';
import ReactSelect from 'react-select';


const BookingUpdateModal = ({ isOpen, setIsOpen, bookingId }) => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [timeFrom, setTimeFrom] = useState(new Date());
  const [timeTo, setTimeTo] = useState(new Date());
  const [status, setStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [services, setServices] = useState([]);
  const selectedOptions = selectedServices.map(service => service.id.toString());
  const options = services.map(service => ({
    value: `${service.id}`,
    label: `${service.description} (${service.duration} минут)`
}));

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`${serverURL}/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch booking details');
      const dataArray  = await response.json();
      if (dataArray.length === 0) throw new Error('No booking details found');
      const data = dataArray[0];
      setTimeFrom(new Date(data.booking.time_from));
      setTimeTo(new Date(data.booking.time_to));
      setStatus(data.booking.status);
      setSelectedServices(data.services);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setErrorMessage(error.message);
    }
  };
  const fetchServices = async () => {
    const response = await fetch(`${serverURL}/services`);
    const data = await response.json();
    setServices(data);
};

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
      fetchServices();
    }
  }, [bookingId, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch(`${serverURL}/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({
                booking:{
                  time_from: timeFrom.toISOString(),
                  time_to: timeTo.toISOString(),
                  status: status
                },
                service_ids: selectedServiceIds
              })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'An error occurred while updating the booking.');
        }
        setIsOpen(false);
        setErrorMessage('');
        window.location.reload();
    } catch (error) {
        console.error('Error updating booking:', error.message);
        setErrorMessage(error.message);
    }
};

const handleChange = (selectedValues) => {
  setSelectedServiceIds(selectedValues)
  const updatedSelectedServices = services.filter(service =>
    selectedValues.includes(service.id.toString())
  );

  const totalDuration = updatedSelectedServices.reduce((acc, service) => acc + service.duration, 0);

  const newtimeTo = addMinutes(timeFrom, totalDuration);
  setTimeTo(newtimeTo);
  setSelectedServices(updatedSelectedServices);
};



return (
    <Modal
      opened={isOpen}
      onClose={() => setIsOpen(false)}
      title="Обновить детали"
    >
      <form onSubmit={handleSubmit}>
        <Text>Обновить детали для записи с ID: {bookingId}</Text>
        <DateTimePicker
          label="Time From"
          value={timeFrom}
          onChange={setTimeFrom}
        />
        <DateTimePicker
          label="Time To"
          value={timeTo}
          onChange={setTimeTo}
        />
        <Select
          label="Status"
          placeholder="Select status"
          value={status}
          onChange={setStatus}
          data={[
            {value: 'await_confirm', label: 'Ожидает подтверждения'},
            //{ value: 'cancelled', label: 'Отменено' },
            { value: 'confirmed', label: 'Подтверждено' },
          ]}
        />
        <MultiSelect
            label="Услуги"
            placeholder="Выберите услуги"
            data={options}
            value={selectedOptions}
            onChange={handleChange}
        />
        <Button mt="10" onClick={handleSubmit} >Update Booking</Button>
      </form>
      {errorMessage && <Text c="red">{errorMessage}</Text>}
    </Modal>
  );
};

export default BookingUpdateModal;