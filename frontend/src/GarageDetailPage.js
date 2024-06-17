import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

function GarageDetailPage() {
  const [service, setService] = useState(null);
  const [lifts, setLifts] = useState([]);
  const { id: serviceId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetch(`http://localhost:8000/carservices/${serviceId}`, {
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

    // Fetch lifts for the service
    fetch(`http://localhost:8000/lifts/${serviceId}`, { // Adjust the URL as needed
        headers: {
            'Authorization': `Bearer ${token}`
        }
        })
        .then(response => {
        if (!response.ok) throw new Error('Failed to fetch lifts: ' + response.statusText);
        return response.json();
        })
        .then(data => setLifts(data)) // Adjust according to the actual response structure
        .catch(error => console.error('Error fetching lifts data:', error));
  }, [serviceId]);

  if (!service) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Navbar />
      <h1>{service.name}</h1>
      <p>Owner ID: {service.owner_id}</p>
      {/* Display more details about the service here */}
      <button onClick={() => navigate(`/lifts/create/${serviceId}`)}>Add New Lift</button>
      <h2>Available Lifts</h2>
        <ul>
            {lifts.map(lift => (
                <li key={lift.id}>
                    <Link to={`/book/lift/${lift.id}`}>
                        {lift.name}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
  );
}

export default GarageDetailPage;