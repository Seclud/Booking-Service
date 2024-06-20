import React, {useEffect, useState} from 'react';
import {addMinutes, formatISO} from 'date-fns';
import {serverURL} from "../config";
import {Button, Modal, MultiSelect, Space, Stack, Text, Title} from "@mantine/core";
import {DateTimePicker} from '@mantine/dates';
import {notifications} from "@mantine/notifications";
import {useNavigate} from "react-router-dom";
import ReactSelect from 'react-select';


export default function BookingModal(props) {
    const navigate = useNavigate();
    const [services, setServices] = useState(props.services);
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const options = services.map(service => ({
        value: `${service.id}`,
        label: `${service.description} (${service.duration} минут)`
    }));
    const [errorMessage, setErrorMessage] = useState('');

    const [bookingData, setBookingData] = useState({
        lift_id: props.liftId,
        time_from: '',
        time_to: '',
    });

    const calculateAndSetTimeTo = (newSelectedServiceIds) => {
            const totalDuration = newSelectedServiceIds.reduce((acc, serviceId) => {
                const service = services.find(service => service.id === serviceId);
                return acc + (service ? service.duration : 0);
            }, 0);

            if (bookingData.time_from) {
                const timeFrom = new Date(bookingData.time_from);
                const timeTo = addMinutes(timeFrom, totalDuration);
                const formattedTimeTo = formatISO(timeTo, {representation: 'complete'});
                const formattedTimeToCorrected = formattedTimeTo.slice(0, 19)
                setBookingData({...bookingData, time_to: formattedTimeToCorrected});
            }
        }
    ;
    const handleChange = (selectedOptions) => {
        const newSelectedServiceIds = selectedOptions.map(option => parseInt(option.value));
        setSelectedServiceIds(newSelectedServiceIds);
        calculateAndSetTimeTo(newSelectedServiceIds);
    };

    const handleTimeChange = (name, value) => {
        setBookingData({...bookingData, [name]: value});
    };

    useEffect(() => {
        if (bookingData.time_from)
            calculateAndSetTimeTo(selectedServiceIds);
    }, [bookingData.time_from]);

    useEffect(() => {
        setBookingData({...bookingData, lift_id: props.liftId});
    }, [props.liftId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const selectedServiceDescriptions = services
                .filter(service => selectedServiceIds.includes(service.id))
                .map(service => service.description)
                .join(', ');

            const response = await fetch(`${serverURL}/bookings/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    booking: {
                        status: "await_confirm",
                        time_from: bookingData.time_from,
                        time_to: bookingData.time_to,
                        lift_id: parseInt(bookingData.lift_id),
                    },
                    service_ids: selectedServiceIds.map(service => parseInt(service)),
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.detail || 'An error occurred while creating the booking.';
                throw new Error(errorMessage);
            }
            setErrorMessage('');
            //console.log('Booking created successfully:', await response.data);

            notifications.show({
                title: 'Вы успешно записались',
                message: (
                    <div>
                        Вы записаны
                        на {new Date(bookingData.time_from).toLocaleDateString()} С {new Date(bookingData.time_from).toLocaleTimeString()} до {new Date(bookingData.time_to).toLocaleTimeString()}<br/>
                        На выбранные услуги: {selectedServiceDescriptions} <br/>
                        Запись можно отменить в "Мои записи"
                    </div>
                ),
                color: 'green',
                autoClose: 15000
            })

            setBookingData({
                lift_id: '',
                time_from: '',
                time_to: '',
            });

            props.setIsOpen(false)
        } catch (error) {
            console.error('Error creating booking:', error.message);
            setErrorMessage(error.message);
        }
    };

    return (
        <Modal opened={props.isOpen} onClose={() => props.setIsOpen(false)}>
            <Stack
                align="stretch"
                justify="flex-start"
                gap="md"
            >
                <Title order={2} ta="center" mt="md">Записаться на</Title>
                {/* <MultiSelect
                    label="Услуги"
                    placeholder="Выберите услуги"
                    data={options}
                    value={selectedServiceIds}
                    onChange={handleChange}
                /> */}
                <ReactSelect
                    options={options}
                    isMulti
                    onChange={handleChange}
                />
                <DateTimePicker
                    label="Время начала"
                    placeholder="Выберите дату и время начала записи"
                    value={bookingData.time_from}
                    onChange={(value) => handleTimeChange("time_from", value)}
                />
                {/* <DateTimePicker
                    label="Время окончания"
                    value={bookingData.time_to && new Date(bookingData.time_to)}
                    disabled
                /> */}
                <Text>
                    Время
                    окончания: {selectedServiceIds.length > 0 && bookingData.time_to ? new Date(bookingData.time_to).toLocaleString() : 'Выберите услуги и время начала'}
                </Text>

                {errorMessage &&
                    <>
                        <Space h='md'/>
                        <Text c='red'>{errorMessage}</Text>
                    </>
                }

                <Button onClick={handleSubmit} disabled={!bookingData.time_to || selectedServiceIds.length === 0}>
                    Забронировать
                </Button>
            </Stack>
        </Modal>
    );
}
