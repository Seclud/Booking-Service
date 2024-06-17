import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';

function LiftCreationPage() {
  const [liftName, setLiftName] = useState('');
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:8000/lifts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: liftName, carservice_id: serviceId })
    });

    if (response.ok) {
      navigate(`/carservices/${serviceId}`);
    } else {
      alert('Failed to create lift');
    }
  };

  return (
    <div>
      <Navbar />
      <h1>Create New Lift</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Lift Name:
          <input
            type="text"
            value={liftName}
            onChange={(e) => setLiftName(e.target.value)}
            required
          />
        </label>
        <button type="submit">Create Lift</button>
      </form>
    </div>
  );
}

export default LiftCreationPage;