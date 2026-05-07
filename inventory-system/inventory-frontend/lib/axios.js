import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
    timeout: 30000, // 30 seconds
    headers: {
        'Accept': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle timeout — retry once automatically
        if (error.code === 'ECONNABORTED' && !error.config._retry) {
            error.config._retry = true;
            try {
                return await axios(error.config);
            } catch (retryError) {
                return Promise.reject(retryError);
            }
        }

        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;