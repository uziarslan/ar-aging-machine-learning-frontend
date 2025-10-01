import axiosInstance from "./axiosInstance";

const API_URL = "/api/auth";

const notifyExtensionWithToken = (token) => {
    try {
        window.postMessage({ type: "FROM_WEB_TO_EXTENSION", token }, "*");
    } catch (err) {
        console.warn("Failed to notify extension:", err);
    }
};

const register = async (userData) => {
    const response = await axiosInstance.post(`${API_URL}/user/signup`, userData);
    if (response.data) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        notifyExtensionWithToken(token);
    }
    return response;
};

const login = async (userData) => {
    // supports JSON body with email/password
    const response = await axiosInstance.post(`${API_URL}/user/login`, userData);
    if (response.data) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        notifyExtensionWithToken(token);
    }
    return response;
};

const logout = () => {
    localStorage.removeItem("token");
};

const getUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const response = await axiosInstance.get(`${API_URL}/user`);
        return response.data;
    } catch (_err) {
        return null;
    }
};

const googleLogin = async () => {
    throw new Error("Not implemented");
};

const authService = { register, login, logout, getUser, googleLogin };

export default authService;


