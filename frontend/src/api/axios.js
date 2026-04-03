import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', 
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        // ── Handle 401 Unauthorized ──
        if (status === 401) {
            // Safer check to catch ANY login route and prevent redirects
            // This prevents the infinite redirect loop on login pages!
            const url = error.config?.url || "";
            if (url.includes('login') || url.includes('auth')) {
                return Promise.reject(error);
            }

            // Token expired or invalid for protected routes — clear storage & redirect
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = '/login'; 
        }

        // ── Handle 429 Too Many Requests ──
        if (status === 429) {
            // Rate limit hit — surface a readable message
            const serverMsg = error.response?.data?.error;
            error.message =
                serverMsg ||
                "You've made too many requests. Please wait a moment and try again.";
        }

        return Promise.reject(error);
    }
);

export default api;