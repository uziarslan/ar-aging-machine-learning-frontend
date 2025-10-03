import { useState, useEffect } from 'react';
import axios from 'axios';
import API_CONFIG, { getApiHeaders } from '../config/api';

const useApi = (endpoint, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const get = async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}${url}`, {
                headers: getApiHeaders(),
            });

            setData(response.data);
            return response.data;
        } catch (err) {
            const statusText = navigator.onLine ? 'Server unavailable' : 'Offline';
            const errorMessage = err?.response?.data?.detail || statusText;
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const post = async (url, body) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}${url}`, body, {
                headers: getApiHeaders(),
            });

            setData(response.data);
            return response.data;
        } catch (err) {
            const statusText = navigator.onLine ? 'Server unavailable' : 'Offline';
            const errorMessage = err?.response?.data?.detail || statusText;
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const postWithApiKey = async (url, body) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}${url}`, body, {
                headers: getApiHeaders(true), // Include API key
            });

            setData(response.data);
            return response.data;
        } catch (err) {
            const statusText = navigator.onLine ? 'Server unavailable' : 'Offline';
            const errorMessage = err?.response?.data?.detail || statusText;
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount if endpoint is provided
    useEffect(() => {
        if (endpoint && options.autoFetch !== false) {
            get(endpoint);
        }
    }, [endpoint, options.autoFetch]);

    return {
        data,
        loading,
        error,
        get,
        post,
        postWithApiKey,
        refetch: () => get(endpoint),
    };
};

export default useApi;