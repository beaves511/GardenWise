"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// API base URL for Flask Auth endpoints
const AUTH_API_URL = 'http://localhost:5000/api/v1/auth';

/**
 * ViewModel Hook for handling all Sign In and Sign Up logic.
 * It manages form state, communicates with the Flask API, and handles navigation/tokens.
 */
export const useAuthForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    // --- Helper to trigger layout update ---
    const dispatchLoginEvent = () => {
        // Dispatches a simple browser event that the layout component can listen for.
        window.dispatchEvent(new Event('storageChange'));
    };

    /**
     * Executes the login API call and handles successful token storage and navigation.
     */
    const handlePostSignupLogin = async (email, password) => {
        const url = `${AUTH_API_URL}/login`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.token && data.user_id) {
            // Store token and user ID for persistent session
            localStorage.setItem('supabase.token', data.token);
            localStorage.setItem('supabase.userId', data.user_id);
            
            // --- CRITICAL FIX 1: Dispatch Event ---
            dispatchLoginEvent();
            
            router.refresh(); 
            router.push('/collections');
            return true;
        } else {
            // If automatic login fails, show error and default to login screen
            setError('Sign up successful, but automatic login failed. Please try manually.');
            return false;
        }
    };


    /**
     * Handles authentication by calling the relevant Flask endpoint.
     * @param {object} e - The submission event
     * @param {boolean} isLoginMode - True for login, False for signup
     */
    const handleAuth = async (e, isLoginMode) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const endpoint = isLoginMode ? 'login' : 'signup';
        const url = `${AUTH_API_URL}/${endpoint}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // If Flask returns 400/401/500
                throw new Error(data.error || `Server responded with status ${response.status}.`);
            }
            
            // --- SUCCESS HANDLING ---
            if (endpoint === 'login' && data.token && data.user_id) {
                // Scenario 1: Manual Login Success
                localStorage.setItem('supabase.token', data.token);
                localStorage.setItem('supabase.userId', data.user_id);
                
                // --- CRITICAL FIX 2: Dispatch Event ---
                dispatchLoginEvent();
                
                // Force state update and redirect
                router.refresh(); 
                router.push('/collections');

            } else if (endpoint === 'signup') {
                // Scenario 2: Sign Up Success -> Attempt Automatic Login
                alert('Sign Up successful! Attempting automatic sign-in...');
                
                // The handlePostSignupLogin function now dispatches the event
                await handlePostSignupLogin(email, password);
            }

        } catch (err) {
            console.error('Auth Error Caught:', err);
            // Check if the error is a malformed JSON response from Flask crash
            if (err.message.includes("Unexpected token '<'") || err.message.includes("Server responded with status 500")) {
                 setError('Server communication failed. Please ensure Flask is running and JWT secret is configured.');
            } else {
                setError(err.message || 'An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        handleAuth,
    };
};

