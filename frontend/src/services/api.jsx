// frontend/src/services/api.jsx
import axios from 'axios';

const api = axios.create({
	baseURL: '/api',
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	}
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(config => {
	const token = localStorage.getItem('synapse_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Interceptor para manejar respuestas de error
api.interceptors.response.use(
	response => {
		// Algunos endpoints devuelven { code: 403, ... } con HTTP 200 -> tratar como error
		if (response?.data && typeof response.data.code === 'number' && response.data.code >= 400) {
			const err = new Error(response.data.msg || 'API error');
			err.response = response;
			// Si es error de autorización, limpiar token y redirigir
			if (response.data.code === 401 || response.data.code === 403) {
				localStorage.removeItem('synapse_token');
				localStorage.removeItem('synapse_usuario');
				window.location.href = '/login';
			}
			return Promise.reject(err);
		}
		return response;
	},
	error => {
		if (error.response?.status === 401) {
			// Token expirado o inválido (respuesta HTTP real 401)
			localStorage.removeItem('synapse_token');
			localStorage.removeItem('synapse_usuario');
			window.location.href = '/login';
		}
		return Promise.reject(error);
	}
);

export default api;