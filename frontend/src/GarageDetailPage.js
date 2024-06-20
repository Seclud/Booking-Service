import React, {useEffect, useState} from 'react';
import {useParams, Link, useNavigate} from 'react-router-dom';
import {serverURL} from './config.js';
import {Button, Card, Center, Group, Loader, SimpleGrid, Space, Stack, Text, Title} from "@mantine/core";
import BookingModal from "./components/BookingModal.jsx";
import {useAuth} from "./AuthContext.js"
import styles from "./GaragePage.module.css";
import LiftModal from "./components/LiftCreateModal.jsx"
import LiftUpdateModal from "./components/LiftUpdateModal.jsx"

function GarageDetailPage() {
    const [service, setService] = useState(null);
    const [lifts, setLifts] = useState([]);
    const {id: serviceId} = useParams();
    const [liftId, setLiftId] = useState(0);
    const navigate = useNavigate();
    const {isAdmin} = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [bookingIsOpen, setBookingIsOpen] = useState(false);
    const [services, setServices] = useState([]);
    const [liftIsOpen, setLiftIsOpen] = useState(false);
    const [isOpenUpdate, setIsOpenUpdate] = useState(false);


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

        const fetchServices = async () => {
            try {
                const response = await fetch(`${serverURL}/services`);
                const data = await response.json();
                setServices(data);
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };

        fetchServices();
    }, []);

    const handleDelete = (liftId) => {
        const token = localStorage.getItem('authToken');
        const isConfirmed = window.confirm('Вы уверены что хотите удалить этот пост? Это действие также удалит все связанные с этим постом записи');
        if (isConfirmed) {
            fetch(`${serverURL}/lifts/${liftId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => {
                    if (response.ok) setLifts(lifts.filter(lift => lift.id !== liftId));
                    else console.error('Failed to delete service');
                    window.location.reload();
                })
                .catch(error => console.error('Error deleting service:', error));
        } else console.log('Service deletion cancelled');
    };

    const handleUpdateLift = (liftId) => {
        setLiftId(liftId);
        setIsOpenUpdate(true);
    };

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
                            Выберите услуги и время записи
                        </Title>
                        {isAdmin && (
                            <Stack
                                align="flex-end"
                                justify="center"
                                gap="xs"
                            >
                                <Button color="blue" mt="md" radius="md" onClick={() => {
                                    setLiftIsOpen(true)
                                }}>
                                    Добавить пост
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
                    Нет доступных постов!
                </Text>

            }
            <SimpleGrid cols={3}>
                {lifts && lifts.map(lift => (
                    <div key={lift.id}> {/* Container for Card and Button */}
                        <Card shadow="sm" padding="lg" radius="md" withBorder
                              onClick={() => {
                                  setLiftId(lift.id)
                                  setBookingIsOpen(true)
                                  console.log(services)
                              }}>
                            <Text ta="center">
                                {lift.name}
                            </Text>
                        </Card>
                        {isAdmin &&
                            <Group spacing="xs" mt="md">
                                <Button color="red" radius="md" style={{flex: 1}} onClick={() => handleDelete(lift.id)}>
                                    Удалить
                                </Button>
                                <Button color="yellow" radius="md" style={{flex: 1}} onClick={() => {
                                    handleUpdateLift(lift.id)
                                }}>
                                    Изменить
                                </Button>
                            </Group>
                        }
                    </div>
                ))}
            </SimpleGrid>
            <BookingModal isOpen={bookingIsOpen} setIsOpen={setBookingIsOpen} liftId={liftId} services={services}/>
            <LiftModal isOpen={liftIsOpen} setIsOpen={setLiftIsOpen} serviceId={serviceId}/>
            <LiftUpdateModal isOpen={isOpenUpdate} setIsOpen={setIsOpenUpdate} liftId={liftId} serviceId={serviceId}/>
        </div>
    );
}

export default GarageDetailPage;