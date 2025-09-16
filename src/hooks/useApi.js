import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const useApi = (endpoint, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const get = async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            setData(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const post = async (url, body) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_BASE_URL}${url}`, body, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            setData(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const postWithApiKey = async (url, body) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_BASE_URL}${url}`, body, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'demo-api-key-123',
                },
            });

            setData(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.message || 'An error occurred';
            setError(errorMessage);
            throw new Error(errorMessage);
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