import axios from "axios";
import authService from "./authService";

const END_POINT = process.env.REACT_APP_END_POINT || "http://localhost:8000";

const axiosInstance = axios.create({
    baseURL: END_POINT,
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


