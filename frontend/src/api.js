import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
});

// Auto-attach token to every request
API.interceptors.request.use((config) => {
  const user = localStorage.getItem('ci_user');
  if (user) {
    const parsed = JSON.parse(user);
    if (parsed.token) {
      config.headers.Authorization = `Bearer ${parsed.token}`;
    }
  }
  return config;
});

export default API;