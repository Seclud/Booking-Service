import React, {useEffect, useState} from 'react';
import {serverURL} from "../config";
import {Button, Space, Text, TextInput, Title, Modal, Stack} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {useNavigate} from "react-router-dom";
import { set } from 'date-fns';


export default function GarageCreateModal(props) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState( '');
    const [errorMessage, setErrorMessage] = useState('');
    const [id, setId] = useState('')

    useEffect(() => {
        setName(props.name || '');
        setDescription(props.description || '');
        setId(props.garageId || '')
    }, [props.name, props.description, props.garageId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const garage = { name, description };
    
        try {
          const response = await fetch(`${serverURL}/carservices/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(garage)
          });
    
          if (!response.ok) {
            throw new Error('Failed to create CarService');
          }
    
          notifications.show({
            title: 'Автосервис успешно изменен',
            message:`Автосервис ${name} успешно изменен, обновите страницу`,
            color:'green',
            autoClose:15000
        })
            navigate('/garages');
            props.setIsOpen(false);
        } catch (error) {
            console.error('Error creating CarService:', error);
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
                <Title order={2} ta="center" mt="md">Изменить автосервис</Title>
                <TextInput
                    label="Название"
                    placeholder="Введите название сервиса"
                    onChange={(e) => setName(e.target.value)}
                    value= {name}
                />
                <TextInput
                    label="Описание"
                    placeholder="Введите описание сервиса"
                    onChange={(e) => setDescription(e.target.value)}
                    value= {description}
                />
                
                {errorMessage &&
                    <>
                        <Space h='md'/>
                        <Text c='red'>{errorMessage}</Text>
                    </>
                }

                <Button onClick={handleSubmit} disabled={!name || !description}>
                    Изменить
                </Button>
            </Stack>
        </Modal>
    );
}
