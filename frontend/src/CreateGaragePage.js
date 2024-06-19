import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serverURL } from './config.js';

function CreateCarServicePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    const service = { name, description };

    try {
      const response = await fetch(`${serverURL}/carservices/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(service)
      });

      if (!response.ok) {
        throw new Error('Failed to create CarService');
      }

      alert('CarService created successfully!');
      navigate('/garages'); // Adjust the navigate path as needed
    } catch (error) {
      console.error('Error creating CarService:', error);
      alert('Error creating CarService');
    }
  };

  return (
    <div>
      <h1>Create New CarService</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create CarService</button>
      </form>
    </div>
  );
}

export default CreateCarServicePage;