import axios from 'axios';

const API_URL = "http://localhost:5000/api";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const loginUser = async (credentials) => {
    return await api.post("/users/login", credentials);
};

export const registerUser = async (userData) => {
    return await api.post("/users/register", userData);
};
