import React, {useEffect, useState} from 'react';
import {Button, Center, Group, Loader, Paper, Stack, Text, Title} from '@mantine/core';
import {serverURL} from './config.js';
import styles from './BookingsPage.module.css'
import BookingUpdateModal from "./components/BookingUpdateModal.jsx";

function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [services, setServices] = useState([]);
    const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
    const [openBookingId, setOpenBookingId] = useState(null);

    const fetchBookingDetails = async (bookingId, setBookingDetails) => {
        try {
            const response = await fetch(`${serverURL}/bookings/${bookingId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch booking details');
            const data = await response.json();
            if (data.length === 0) throw new Error('No booking details found');
            setBookingDetails(data[0]);
        } catch (error) {
            console.error('Error fetching booking details:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const response = await fetch(`${serverURL}/services`);
            const data = await response.json();
            setServices(data);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        fetch(`${serverURL}/bookings/admin/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                setBookings(data);
                console.log(data)
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching bookings:', error);
                setIsLoading(false);
            });


        fetchServices();
    }, []);

    const handleBookingSelect = (bookingId) => {
        fetchBookingDetails(bookingId, setSelectedBookingDetails);
    };

    const formatDateTime = (dateTimeStr) => {
        const date = new Date(dateTimeStr);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Yekaterinburg'
        };
        return date.toLocaleString('ru-RU', options);
    };

    const handleCancelBooking = (bookingId) => {
        const token = localStorage.getItem('authToken');
        const isConfirmed = window.confirm('Вы точно хотите удалить эту запись?');
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
                        console.error('Failed to delete booking');
                    }
                    window.location.reload();
                })
                .catch(error => console.error('Error deleting booking:', error));
        } else {
            console.log('Booking is not deleted');
        }
    };
    

    //   if (isLoading) {
    //     return <div>
    //       <Navbar />
    //       <h1>My Bookings</h1>
    //       <div>Loading...</div>;
    //     </div>

    //   }

    //   return (
    //     <div>
    //       <Navbar />
    //       <h1>My Bookings</h1>
    //       <div id="bookings">
    //     {bookings.map((booking, index) => (
    //       <div key={booking.booking.id}>
    //         Бронирование {index + 1}, C {formatDateTime(booking.booking.time_from)}; До {formatDateTime(booking.booking.time_to)}
    //         <div>Services:</div>
    //         <ul>
    //           {booking.services.map(service => (
    //             <li key={service.id}>{service.description} (Duration: {service.duration} minutes)</li>
    //           ))}
    //         </ul>
    //         <button onClick={() => handleCancelBooking(booking.booking.id)}>Cancel</button>
    //       </div>
    //     ))}
    //   </div>
    //     </div>
    //   );
    // }


    return (
        <div className={styles.container}>
            <Title order={1} ta="center" mt="md" mb={50}>
                Все записи бронирований
            </Title>
            <Stack
                align="stretch"
                justify="center"
                gap="md"
                id='bookings'
            >
                {
                    isLoading &&
                    <Center>
                        <Loader/>
                    </Center>
                }
                {!isLoading && bookings && bookings.map((booking, index) => (
                    <Paper shadow="md" radius="md" p="xl" key={booking.booking.id} withBorder>
                        <Title order={3} ta="center">Бронирование {index + 1}</Title>
                        <Stack
                            align="stretch"
                            justify="center"
                            gap="xs"
                        >
                            <Group>
                                <Text fw={600}>Начало обслуживания: </Text>
                                <Text>{formatDateTime(booking.booking.time_from)}</Text>
                            </Group>
                            <Group>
                                <Text fw={600}>Конец обслуживания: </Text>
                                <Text>{formatDateTime(booking.booking.time_to)}</Text>
                            </Group>
                            <Group>
                                <Text fw={600}>Статус брони: </Text>
                                <Text>{booking.booking.status}</Text>
                            </Group>
                            <Group>
                                <Text fw={600}>Название сервиса: </Text>
                                <Text>{booking.carServiceName}</Text>
                            </Group>
                            <Group>
                                <Text fw={600}>Название поста: </Text>
                                <Text>{booking.liftName}</Text>
                            </Group>
                        </Stack>

                        <Text fw={600}>Услуги: </Text>
                        <ul style={{marginTop: 0}}>
                            {booking.services.map(service => (
                                <li key={service.id}>{service.description} (Продолжительность: {service.duration} минут)</li>
                            ))}
                        </ul>
                        <Button color="red" onClick={() => handleCancelBooking(booking.booking.id)}>
                            Удалить запись
                        </Button>
                        <Button color="yellow" ml="10" onClick={() => {
                            handleBookingSelect(booking.booking.id)
                            setOpenBookingId(booking.booking.id)
                        }}>
                            Изменить запись
                        </Button>
                        <BookingUpdateModal isOpen={openBookingId === booking.booking.id} setIsOpen={setOpenBookingId}
                                            bookingId={booking.booking.id} bookingDetails={selectedBookingDetails}
                                            servicesProp={services}/>
                    </Paper>
                ))}
            </Stack>
        </div>
    );
}

export default BookingsPage;