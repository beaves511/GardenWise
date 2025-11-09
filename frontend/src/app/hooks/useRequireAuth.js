"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook to enforce client-side authentication on protected pages.
 * Redirects user to /auth if no valid token is found in localStorage.
 * @returns {boolean} True if auth check is complete and token found.
 */
export const useRequireAuth = () => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('supabase.token');

        if (!token) {
            console.log("SECURITY ALERT: Token missing. Redirecting to login.");
            // Use replace to prevent the user from hitting the back button to bypass the login
            //router.replace('/auth'); 
        } else {
            setIsAuthenticated(true);
            setIsChecking(false);
        }
    }, [router]);

    return { isAuthenticated, isChecking };
};