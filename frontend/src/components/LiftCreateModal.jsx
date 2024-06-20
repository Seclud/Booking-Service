import React, {useEffect, useState} from 'react';
import {serverURL} from "../config";
import {Button, Space, Text, TextInput, Title, Modal, Stack} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {useNavigate} from "react-router-dom";


export default function LifeCreateModal(props) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const carservice_id = props.serviceId;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const post = { name, carservice_id };
    
        try {
          const response = await fetch(`${serverURL}/lifts/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(post)
          });
    
          if (!response.ok) {
            throw new Error('Failed to create post');
          }
    
          notifications.show({
            title: 'Пост успешно создан',
            message:`Пост ${name} успешно создан, обновите страницу`,
            color:'green',
            autoClose:15000
        })
            navigate('/garage/'+carservice_id);
            props.setIsOpen(false);
        } catch (error) {
            console.error('Error creating post:', error);
            setErrorMessage(error.message);
        }
      };

    return (
        <Modal opened={props.isOpen} onClose={() => props.setIsOpen(false)}>
            <Stack
                align="stretch"
                justify="flex-start"
                gap="md"
            >
                <Title order={2} ta="center" mt="md">Создать пост</Title>
                <TextInput
                    label="Название"
                    placeholder="Введите название поста"
                    onChange={(e) => setName(e.target.value)}
                />
                
                {errorMessage &&
                    <>
                        <Space h='md'/>
                        <Text c='red'>{errorMessage}</Text>
                    </>
                }

                <Button onClick={handleSubmit} disabled={!name}>
                    Создать
                </Button>
            </Stack>
        </Modal>
    );
}
