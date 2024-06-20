import React, {useEffect, useState} from 'react';
import {serverURL} from "../config";
import {Button, Space, Text, TextInput, Title, Modal, Stack} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {useNavigate} from "react-router-dom";


export default function LifeCreateModal(props) {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const liftId = props.liftId
    const carservice_id = props.serviceId;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const post = {name, carservice_id};

        try {
            const response = await fetch(`${serverURL}/lifts/${liftId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(post)
            });

            if (!response.ok) {
                throw new Error('Failed to update post');
            }

            //   window.location.reload();
            notifications.show({
                title: 'Пост успешно изменен',
                message: `Пост ${name} успешно изменен, обновите страницу`,
                color: 'green',
                autoClose: 15000
            })
            navigate('/garage/' + carservice_id);
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
                    value={name}
                />

                {errorMessage &&
                    <>
                        <Space h='md'/>
                        <Text c='red'>{errorMessage}</Text>
                    </>
                }

                <Button onClick={handleSubmit} disabled={!name}>
                    Изменить
                </Button>
            </Stack>
        </Modal>
    );
}
