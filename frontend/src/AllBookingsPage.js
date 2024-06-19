import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import {Button, Center, Group, Loader, Paper, Stack, Text, Title} from '@mantine/core';
import { serverURL } from './config.js';
import styles from './BookingsPage.module.css'
import BookingUpdateModal from "./components/BookingUpdateModal.jsx";
import { set } from 'date-fns';

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingIsOpen, setBookingIsOpen] = useState(false);
  const [bookingId, setbookingId] = useState(0);

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
      setIsLoading(false);
    })
    .catch(error => {
      console.error('Error fetching bookings:', error); 
      setIsLoading(false);
    });
  }, []);

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

    const handleUpdateBooking = (bookingId, updatedBookingData) => {
        const token = localStorage.getItem('authToken');
        fetch(`${serverURL}/bookings/${bookingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedBookingData)
        })
        .then(response => {
          if (response.ok) {
            // Optionally, fetch all bookings again or update the state locally
            console.log('Booking updated successfully');
          } else {
            console.error('Failed to update booking');
          }
        })
        .catch(error => console.error('Error updating booking:', error));
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
                    </Stack>

                    <Text fw={600}>Услуги: </Text>
                    <ul style={{marginTop: 0}}>
                        {booking.services.map(service => (
                            <li key={service.id}>{service.description} (Продолжительность: {service.duration} минут)</li>
                        ))}
                    </ul>
                    <Button color="red" onClick={() => handleCancelBooking(booking.booking.id)}>
                        Отменить запись
                    </Button>
                    <Button color="yellow" ml="10" onClick={() => {
                        setBookingIsOpen(true)
                        setbookingId(booking.booking.id)
                        }}>
                        Изменить запись
                    </Button>
                    <BookingUpdateModal isOpen={bookingIsOpen} setIsOpen={setBookingIsOpen} bookingId={bookingId}/>
                </Paper>
            ))}
        </Stack>
    </div>
);
}

export default BookingsPage;