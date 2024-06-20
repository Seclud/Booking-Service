import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Text, Center } from '@mantine/core';

function EmailConfirmationPage() {
    const navigate = useNavigate();
    const { confirmationToken } = useParams(); 
    const [confirmationState, setConfirmationState] = useState('confirming');
  
    useEffect(() => {
      const confirmUser = async () => {
        try {
          const response = await fetch(`http://${process.env.REACT_APP_SERVER_IP}:8000/users/confirm/${confirmationToken}`, {
            method: 'GET',
          });
          const data = await response.json();
          if (data.message === 'Email confirmed successfully') {
            setConfirmationState('success');
            setTimeout(() => {
              navigate('/login');
            }, 5000); 
          } else {
            setConfirmationState('failure');
          }
        } catch (error) {
          console.error('Error confirming user:', error);
          setConfirmationState('failure');
        }
      };
  
      confirmUser();
    }, [confirmationToken, navigate]);
  
    let message;
    switch (confirmationState) {
      case 'confirming':
        message = 'Подтверждение почты...';
        break;
      case 'success':
        message = 'Почта успешно подтверждена. Вы будете перенаправлены на страницу логина через 5 секунд...';
        break;
      case 'failure':
        message = 'Ошибка в подтверждении почты. Пожалуйста, попробуйте еще раз перейти по ссылке или связаться с поддержкой';
        break;
      default:
        message = 'Unexpected state.';
    }
  
    return (
      <Center style={{ height: '100vh' }}>
        <Text>{message}</Text>
      </Center>
    );
  }

export default EmailConfirmationPage;