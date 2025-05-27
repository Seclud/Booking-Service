const REACT_APP_LOAD_BALANCER_URL = process.env.REACT_APP_LOAD_BALANCER_URL || 'http://localhost:8000'; // Default for local dev

export const serverURL = `${REACT_APP_LOAD_BALANCER_URL}/api`;