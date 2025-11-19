/**
 * Centralized API utility with automatic session expiration handling
 */

const API_BASE_URL = 'http://localhost:5000/api/v1';

/**
 * Custom fetch wrapper that handles authentication and token expiration
 * @param {string} endpoint - API endpoint (e.g., '/profile', '/collections')
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise} - Fetch response
 */
export async function authenticatedFetch(endpoint, options = {}) {
    const token = localStorage.getItem('supabase.token');

    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add auth token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge options
    const fetchOptions = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

        // Handle 401 Unauthorized (expired or invalid token)
        if (response.status === 401) {
            handleSessionExpired();
            throw new Error('Session expired. Please log in again.');
        }

        return response;
    } catch (error) {
        // If it's a network error or the session expired error, throw it
        throw error;
    }
}

/**
 * Handles session expiration by clearing storage and redirecting to login
 */
function handleSessionExpired() {
    // Clear all auth data
    localStorage.removeItem('supabase.token');
    localStorage.removeItem('supabase.userId');

    // Dispatch event to update UI
    window.dispatchEvent(new Event('storageChange'));

    // Store a message to show on the login page
    sessionStorage.setItem('sessionExpiredMessage', 'Your session has expired. Please log in again.');

    // Redirect to login page
    window.location.href = '/auth';
}

/**
 * Helper function for GET requests
 */
export async function apiGet(endpoint) {
    const response = await authenticatedFetch(endpoint, { method: 'GET' });
    return response.json();
}

/**
 * Helper function for POST requests
 */
export async function apiPost(endpoint, data) {
    const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.json();
}

/**
 * Helper function for PUT requests
 */
export async function apiPut(endpoint, data) {
    const response = await authenticatedFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    return response.json();
}

/**
 * Helper function for DELETE requests
 */
export async function apiDelete(endpoint) {
    const response = await authenticatedFetch(endpoint, { method: 'DELETE' });
    return response.json();
}
