import React, {useEffect, useState} from 'react';
import {Modal, Button, Text, Select, TextInput, MultiSelect} from '@mantine/core';
import {DateTimePicker, TimeInput} from '@mantine/dates';
import {serverURL} from '../config.js';
import {addMinutes, formatISO} from 'date-fns';
import {useAuth} from '../AuthContext.js';


const BookingUpdateModal = ({isOpen, setIsOpen, bookingId, bookingDetails, servicesProp}) => {
    const {isAdmin} = useAuth();

    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [timeFrom, setTimeFrom] = useState(new Date());
    const [timeTo, setTimeTo] = useState(new Date());
    const [status, setStatus] = useState('');

    const [errorMessage, setErrorMessage] = useState('');
    const [services, setServices] = useState(servicesProp)
    const selectedOptions = selectedServices.map(service => service.id.toString());
    const options = services.map(service => ({
        value: `${service.id}`,
        label: `${service.description} (${service.duration} минут)`
    }));

    useEffect(() => {
        setServices(servicesProp);
    }, [servicesProp]);

    useEffect(() => {
        if (bookingDetails) {

            setTimeFrom(new Date(bookingDetails.booking.time_from));
            setTimeTo(new Date(bookingDetails.booking.time_to));
            setStatus(bookingDetails.booking.status);


            const selectedServices = bookingDetails.services.map(service => ({
                id: service.id,
                description: service.description,
                duration: service.duration,
            }));
            setSelectedServices(selectedServices);
            setSelectedServiceIds(selectedServices.map(service => service.id.toString()));
        }
    }, [bookingDetails]); // Dependency array includes bookingDetails to re-run this effect when bookingDetails changes

    // const fetchBookingDetails = async () => {
    //   try {
    //     const response = await fetch(`${serverURL}/bookings/${bookingId}`, {
    //       method: 'GET',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    //       },
    //     });
    //     if (!response.ok) throw new Error('Failed to fetch booking details');
    //     const dataArray  = await response.json();
    //     if (dataArray.length === 0) throw new Error('No booking details found');
    //     const data = dataArray[0];
    //     setTimeFrom(new Date(data.booking.time_from));
    //     setTimeTo(new Date(data.booking.time_to));
    //     setStatus(data.booking.status);
    //     setSelectedServices(data.services);
    //   } catch (error) {
    //     console.error('Error fetching booking details:', error);
    //     setErrorMessage(error.message);
    //   }
    // };

    // useEffect(() => {
    //   if (bookingId) {
    //     fetchBookingDetails();
    //   }
    // }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            function toISOStringAndAddHours(localTime, hoursToAdd) {
                const date = new Date(localTime);
            
                date.setTime(date.getTime() + (hoursToAdd * 60 * 60 * 1000));
            
                return date.toISOString();
            }

            const response = await fetch(`${serverURL}/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    booking: {
                        time_from: toISOStringAndAddHours(timeFrom, 5),
                        time_to: toISOStringAndAddHours(timeTo, 5),
                        status: status,
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
            console.log(timeFrom,timeTo);
            console.log(timeFrom.toISOString(),timeTo.toISOString())
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
        setTimeTo(newtimeTo)
        setSelectedServices(updatedSelectedServices);
    };

    const handleTimeChange = (time) => {
        setTimeFrom(time);

        const totalDuration = selectedServices.reduce((acc, service) => acc + service.duration, 0);

        const newTimeTo = addMinutes(time, totalDuration);
        setTimeTo(newTimeTo);
    };

    return (
        <Modal
            opened={isOpen}
            onClose={() => {
                setIsOpen(false);
            }}
            title="Изменить данные"
        >
            <form onSubmit={handleSubmit}>
                <Text>Изменить данные для записи с ID: {bookingId}</Text>
                <DateTimePicker
                    label="С"
                    value={timeFrom}
                    onChange={handleTimeChange}
                />
                <DateTimePicker
                    label="До"
                    value={timeTo}
                    onChange={setTimeTo}
                />
                {isAdmin && (
                    <Select
                        label="Статус"
                        placeholder="Выберите статус"
                        value={status}
                        onChange={setStatus}
                        data={[
                            {value: 'await_confirm', label: 'Ожидает подтверждения'},
                            {value: 'cancelled', label: 'Отменена'},
                            {value: 'confirmed', label: 'Подтверждена'},
                        ]}
                    />
                )}
                <MultiSelect
                    label="Услуги"
                    placeholder="Выберите услуги"
                    data={options}
                    value={selectedOptions}
                    onChange={handleChange}
                />
                <Button mt="10" onClick={handleSubmit}>Изменить запись</Button>
            </form>
            {errorMessage && <Text c="red">{errorMessage}</Text>}
        </Modal>
    );
};

export default BookingUpdateModal;