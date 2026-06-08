import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
    timeout: 60000,
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
    // Let browser set Content-Type for FormData (includes boundary)
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;

        // Only retry on genuine timeout (no response at all), never on 4xx/5xx
        if (
            error.code === 'ECONNABORTED' &&
            !error.config._retry &&
            !status
        ) {
            error.config._retry = true;
            try {
                return await api(error.config); // use api not axios to keep auth header
            } catch (retryError) {
                return Promise.reject(retryError);
            }
        }

        // Auto logout on 401
        if (status === 401) {
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
