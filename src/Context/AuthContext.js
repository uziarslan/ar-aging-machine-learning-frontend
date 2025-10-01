import React, { createContext, useState, useEffect } from "react";
import authService from "../services/authService";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const u = await authService.getUser();
                if (u) setUser(u);
            } catch (e) {
                // silent
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, []);

    const login = async (userData) => {
        setIsLoading(true);
        try {
            const response = await authService.login(userData);
            if (response.data) {
                const loggedInUser = await authService.getUser();
                setUser(loggedInUser);
            }
            return response;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData) => {
        setIsLoading(true);
        try {
            await authService.register(userData);
            const registeredUser = await authService.getUser();
            setUser(registeredUser);
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = async () => {
        throw new Error("Not implemented");
    };

    const logout = () => {
        setIsLoading(true);
        authService.logout();
        setUser(null);
        setIsLoading(false);
        window.location.href = "/";
    };

    return (
        <AuthContext.Provider
            value={{ user, login, register, googleLogin, logout, isLoading, setIsLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;


