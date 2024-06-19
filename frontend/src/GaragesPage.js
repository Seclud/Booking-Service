import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { Link, useNavigate  } from 'react-router-dom';
import { serverURL } from './config.js';
import { useAuth } from './AuthContext';
import {Button, Card, Center, Group, Loader, SimpleGrid, Space, Stack, Text, Title} from "@mantine/core";
import styles from "./GaragesPage.module.css"

function GaragesPage() {
    const [services, setServices] = useState([]);
    const {isAdmin} = useAuth();
    const navigate = useNavigate(); 
    const [isLoading, setIsLoading] = useState(true)

  const navigateToCreateService = () => {
    navigate('/carservices/create'); 
  };

  
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetch(`${serverURL}/carservices/`, {
      headers: {
        'Authorization': `Bearer ${token}` 
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch garages: ' + response.statusText);
        setIsLoading(false);
        return response.json();
      })
      .then(data => setServices(data.data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const handleDeleteService = (serviceId) => {
    const token = localStorage.getItem('authToken');
    const isConfirmed = window.confirm('Are you sure you want to delete this service?');
    if (isConfirmed) {
      fetch(`${serverURL}/carservices/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) setServices(services.filter(service => service.id !== serviceId));
        else console.error('Failed to delete service');
      })
      .catch(error => console.error('Error deleting service:', error));
    } 
    else console.log('Service deletion cancelled');
  };



//   return (
//     <div>
//       <Navbar />
//       <h1>Available Garages</h1>
//       {isAdmin && (
//         <button onClick={navigateToCreateService}>Create New CarService</button>
//       )}
//       <ul>
//         {services.map(service => (
//           <li key={service.id}>
//             <Link to={`/carservices/${service.id}`}>
//               {service.name} - Owner ID: {service.owner_id}
//             </Link>
//             {isAdmin && (
//               <button onClick={() => handleDeleteService(service.id)}>Delete</button>
//             )}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

return (
  <div className={styles.container}>
      <Title order={1} ta="center" mt="md" mb={50}>
          Доступные автосервисы
      </Title>

      {isAdmin && (
          <Stack
              align="flex-end"
              justify="center"
              gap="xs"
          >
              <Button color="blue" mt="md" radius="md" onClick={navigateToCreateService}>
                  Добавить автосервис
              </Button>
              <Space h='md'/>
          </Stack>
      )}

      {
          isLoading &&
          <Center>
              <Loader/>
          </Center>
      }

      <SimpleGrid cols={3}>
          {services.map(service => (
              <Card shadow="sm" padding="lg" radius="md" withBorder key={service.id}>
                  <Group justify="space-between" mt="md" mb="xs">
                      <Text fw={500}>{service.name}</Text>
                  </Group>

                  <Text size="sm" c="dimmed">
                      {service.description}
                  </Text>

                  <Button color="blue" mt="md" radius="md" onClick={() => navigate(`/garage/${service.id}`)}>
                      Подробнее
                  </Button>

                  {isAdmin &&
                      <Button color="red" mt="md" radius="md" onClick={() => handleDeleteService(service.id)}>
                          Удалить автосервис
                      </Button>
                  }

              </Card>


              // <li key={service.id}>
              //     <Link to={`/carservices/${service.id}`}>
              //         {service.name} - Owner ID: {service.owner_id}
              //     </Link>
              //     {isAdmin && (
              //         <button onClick={() => handleDeleteService(service.id)}>Delete</button>
              //     )}
              // </li>
          ))}
      </SimpleGrid>
  </div>
);
}


export default GaragesPage;