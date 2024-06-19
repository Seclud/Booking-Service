import React, { useState } from 'react';
import { serverURL } from './config.js';
import {Button, Group, Paper, PasswordInput, Space, Text, TextInput, Title} from "@mantine/core";
import {Link} from "react-router-dom";
import styles from "./LoginPage.module.css";

function RegistrationPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      const response = await fetch(`${serverURL}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      const data = await response.json();
      console.log('Registration successful', data);
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(error)
    }
  };

//   return (
//     <div>
//       <h2>Registration</h2>
//       <form onSubmit={handleSubmit}>
//         <div>
//           <label>Email:</label>
//           <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
//         </div>
//         <div>
//           <label>Password:</label>
//           <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
//         </div>
//         <div>
//           <label>Confirm Password:</label>
//           <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
//         </div>
//         <button type="submit">Register</button>
//       </form>
//     </div>
//   );
// }

return (
  <div className={styles.wrapper}>
      <Paper className={styles.form} radius={0} p={30}>
          <Title order={2} className={styles.title} ta="center" mt="md" mb={50}>
              👋 Добро пожаловать!
          </Title>

          <TextInput
              label="Почта"
              placeholder="hello@gmail.com"
              size="md"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
          />
          <PasswordInput
              label="Пароль"
              placeholder="******"
              mt="md"
              size="md"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <PasswordInput
              label="Подтвердите пароль"
              placeholder="******"
              mt="md"
              size="md"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.currentTarget.value)}
          />

          {
              errorMessage &&
              <>
                  <Space h="md"/>
                  <Text ta="center" c="red">{errorMessage}</Text>
              </>
          }
          <Button fullWidth mt="xl" size="md" onClick={(event) => handleSubmit(event)}>
              Зарегистрироваться
          </Button>

          <Space h="md"/>
          <Group justify="space-between">
              <Text ta="space-between">
                  Уже есть аккаунт?
              </Text>
              <Link to="/login">
                  <Button variant="transparent" size="md">Войти</Button>
              </Link>
          </Group>
      </Paper>
  </div>
);
}

export default RegistrationPage;