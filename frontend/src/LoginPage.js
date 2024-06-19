import React, { useState } from 'react';
import {Link, useNavigate} from "react-router-dom";
import { useAuth } from './AuthContext';
import { serverURL } from './config.js';
import {Button, Group, Paper, PasswordInput, Space, Text, TextInput, Title} from "@mantine/core";
import styles from './LoginPage.module.css'

function LoginPage() {
  const [username, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      const body = new URLSearchParams();
      body.append('username', username);
      body.append('password', password);
  
      const response = await fetch(`${serverURL}/login/access-token`, {
        method: 'POST', headers: headers, body: body,
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();

      localStorage.setItem('authToken', data.access_token);
      login();
      navigate('/garages');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Login failed. Please check your credentials.');
    }
  };

//   return (
//     <div>
//       <Navbar />
//       <h2>Login</h2>
//       <form onSubmit={handleSubmit}>
//         <div>
//           <label>Email:</label>
//           <input type="text" value={username} onChange={(e) => setName(e.target.value)} />
//         </div>
//         <div>
//           <label>Password:</label>
//           <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
//         </div>
//         {errorMessage && <div style={{color: 'red'}}>{errorMessage}</div>}
//         <button type="submit">Login</button>
//       </form>
//     </div>
//   );
// }

return (
  <div className={styles.wrapper}>
      <Paper className={styles.form} radius={0} p={30}>
          <Title order={2} className={styles.title} ta="center" mt="md" mb={50}>
              👋 C возвращением!
          </Title>

          <TextInput
              label="Почта"
              placeholder="hello@gmail.com"
              size="md"
              value={username}
              onChange={(event) => setName(event.currentTarget.value)}
          />
          <PasswordInput
              label="Пароль"
              placeholder="******"
              mt="md"
              size="md"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
          />

          {
              errorMessage &&
              <>
                  <Space h="md"/>
                  <Text ta="center" c="red">{errorMessage}</Text>
              </>
          }

          <Button fullWidth mt="xl" size="md" onClick={(event) => handleSubmit(event)}>
              Войти
          </Button>

          <Space h="md"/>
          <Group justify="space-between">
              <Text ta="space-between">
                  Нет аккаунта?
              </Text>
              <Link to="/registration">
                  <Button variant="transparent" size="md">Зарегистрироваться</Button>
              </Link>
          </Group>
      </Paper>
  </div>
  );
}

export default LoginPage;