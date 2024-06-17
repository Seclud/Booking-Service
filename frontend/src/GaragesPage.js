import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { Link, useNavigate  } from 'react-router-dom';
import { serverURL } from './config';

function CarServicesPage() {
  const [services, setServices] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate(); // Use useHistory hook for navigation

  const navigateToCreateService = () => {
    navigate('/carservices/create'); // Adjust the path as needed
  };

  
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetch(`${serverURL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      setIsAdmin(data.is_superuser);
    })
    .catch(error => console.error('Error fetching user data:', error));

    fetch(`${serverURL}/carservices/`, {
      headers: {
        'Authorization': `Bearer ${token}` // Adjust according to how your backend expects the token
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch garages: ' + response.statusText);
        }
        return response.json();
      })
      .then(data => setServices(data.data)) // Adjust according to the actual response structure
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
        if (response.ok) {
          // Update the services state to reflect the deletion
          setServices(services.filter(service => service.id !== serviceId));
        } else {
          console.error('Failed to delete service');
        }
      })
      .catch(error => console.error('Error deleting service:', error));
    } else {
      console.log('Service deletion cancelled');
    }
  };



  return (
    <div>
      <Navbar />
      <h1>Available Garages</h1>
      {isAdmin && (
        <button onClick={navigateToCreateService}>Create New CarService</button>
      )}
      <ul>
        {services.map(service => (
          <li key={service.id}>
            <Link to={`/carservices/${service.id}`}>
              {service.name} - Owner ID: {service.owner_id}
            </Link>
            {isAdmin && (
              <button onClick={() => handleDeleteService(service.id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CarServicesPage;