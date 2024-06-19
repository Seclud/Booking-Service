import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { serverURL } from './config.js';
import {Button, Card, Center, Group, Loader, SimpleGrid, Space, Stack, Text, Title} from "@mantine/core";
import BookingModal from "./components/BookingModal.jsx";
import {useAuth} from "./AuthContext.js"
import styles from "./GaragePage.module.css";

function GarageDetailPage() {
  const [service, setService] = useState(null);
  const [lifts, setLifts] = useState([]);
  const { id: serviceId } = useParams();
  const [liftId, setLiftId] = useState(0);
  const navigate = useNavigate();
  const {isAdmin} = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [bookingIsOpen, setBookingIsOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetch(`${serverURL}/carservices/${serviceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch service details: ' + response.statusText);
      return response.json();
    })
    .then(data => setService(data))
    .catch(error => console.error('Error fetching data:', error));

    fetch(`${serverURL}/lifts/${serviceId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
        })
        .then(response => {
        if (!response.ok) throw new Error('Failed to fetch lifts: ' + response.statusText);
        setIsLoading(false);
        return response.json();
        })
        .then(data => setLifts(data))
        .catch(error => console.error('Error fetching lifts data:', error));
  }, [serviceId]);

  if (!service) {
    return <div>Loading...</div>;
  }

//   return (
//     <div>
//       <h1>{service.name}</h1>
//       <p>Owner ID: {service.owner_id}</p>
//       <button onClick={() => navigate(`/lifts/create/${serviceId}`)}>Add New Lift</button>
//       <h2>Available Lifts</h2>
//         <ul>
//             {lifts.map(lift => (
//                 <li key={lift.id}>
//                     <Link to={`/book/lift/${lift.id}`}>
//                         {lift.name}
//                     </Link>
//                 </li>
//             ))}
//         </ul>
//     </div>
//   );
// }

return (
  <div className={styles.container}>
      {
          !isLoading && service &&
          <>
              <Title order={1} ta="center" mt="md" mb={50}>
                  {service.name}
              </Title>
              <Group align="center" justify="space-between">
                  <Title order={2}>
                      Доступные подъёмники
                  </Title>
                  {isAdmin && (
                      <Stack
                          align="flex-end"
                          justify="center"
                          gap="xs"
                      >
                          <Button color="blue" mt="md" radius="md">
                              Добавить подъёмник
                          </Button>
                          <Space h='md'/>
                      </Stack>
                  )}
              </Group>
          </>
      }
      {
          isLoading &&
          <Center className={styles.loaderContainer}>
              <Loader/>
          </Center>
      }
      {
          !isLoading && !lifts.length &&
          <Text ta="center" mt="md" mb={50}>
              Нет доступных подъёмников!
          </Text>

      }
      <SimpleGrid cols={3}>
          {lifts && lifts.map(lift => (
              <Card shadow="sm" padding="lg" radius="md" withBorder key={lift.id}
                    onClick={() => {
                        setLiftId(lift.id)
                        setBookingIsOpen(true)
                    }}>
                  <Text ta="center">
                      {lift.name}
                  </Text>
              </Card>
          ))}
      </SimpleGrid>
      <BookingModal isOpen={bookingIsOpen} setIsOpen={setBookingIsOpen} liftId={liftId}/>
  </div>
);
}

export default GarageDetailPage;