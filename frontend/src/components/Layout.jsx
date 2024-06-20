import React from 'react';
import {AppShell, Button, Group, Text} from '@mantine/core';
import styles from './Layout.module.css'
import {Link, Outlet} from "react-router-dom";
import {useAuth} from "../AuthContext";

export default function Layout() {
    const {isAuthenticated, isAdmin, logout} = useAuth();

    return (
        <AppShell header={{height: 74}}>
            <AppShell.Header>
                <div className={styles.header}>
                    <Link to="/garages">
                        {/* <img alt="logo" src={Logo} className={styles.logo}/> */}
                        <Button variant="subtle" color="rgba(82, 82, 82, 1)" size="md">Главная</Button>
                    </Link>
                    {
                        isAuthenticated &&
                        <Group>
                            <Link to="garages">
                                <Button variant="subtle" color="rgba(82, 82, 82, 1)" size="md">Автосервисы</Button>
                            </Link>
                            <Link to="bookings">
                                <Button variant="subtle" color="rgba(82, 82, 82, 1)" size="md">Мои записи</Button>
                            </Link>
                            {
                                isAdmin &&
                                <Link to="all-bookings">
                                    <Button variant="subtle" color="rgba(82, 82, 82, 1)" size="md">Все записи</Button>
                                </Link>
                            }
                        </Group>
                    }
                    {
                        !isAuthenticated &&
                        <Group>
                            <Link to="login">
                                <Button variant="subtle" color="gray" size="md">Авторизоваться</Button>
                            </Link>
                            <Link to="registration">
                                <Button variant="filled" color="indigo" size="md">Зарегистрироваться</Button>
                            </Link>
                        </Group>
                    }
                    {
                        isAuthenticated &&
                        <Group>
                            <Button variant="subtle" color="gray" size="md" onClick={() => logout()}>Выйти</Button>
                        </Group>
                    }
                </div>
            </AppShell.Header>

            <AppShell.Main>
                <Outlet/>
            </AppShell.Main>
        </AppShell>
    );
};
