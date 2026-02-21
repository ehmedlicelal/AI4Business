import { supabase } from './supabase';
import { authStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Sends an authenticated request to the backend API.
 */
export async function apiFetch(path, options = {}) {
    let token = authStore.getToken();

    if (!token) {
        // Fallback or error
        console.warn('No token in store, trying fallback...');
        const { data } = await supabase.auth.getSession();
        token = data.session?.access_token;
    }

    if (!token) {
        throw new Error('Not authenticated');
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[apiFetch API ERROR]', data.error || data);
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (err) {
        console.error('[apiFetch NETWORK ERROR for path]', path, err);
        throw err;
    }
}
