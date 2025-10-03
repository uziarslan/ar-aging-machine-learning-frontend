import axios from "axios";
import authService from "./authService";
import API_CONFIG from "../config/api";

const axiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (
            typeof window !== "undefined" &&
            window.location.pathname.includes("dashboard") &&
            !token
        ) {
            authService.logout();
            window.location.href = "/login";
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response &&
            error.response.status === 401 &&
            typeof window !== "undefined" &&
            window.location.pathname.includes("dashboard")
        ) {
            authService.logout();
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;


