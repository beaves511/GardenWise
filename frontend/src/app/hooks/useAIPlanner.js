"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const AI_API_URL = 'http://localhost:5000/api/v1/ai/plan';

/**
 * ViewModel Hook for managing the AI Garden Planner chat session.
 * Handles state, user input, and secure API communication.
 */
export const useAIPlanner = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setResponse(null);

        const payload = { user_input: prompt };
        const token = localStorage.getItem('supabase.token');

        if (!token) {
            setError("Please log in to use the AI Garden Planner.");
            setIsLoading(false);
            return;
        }

        try {
            const apiResponse = await fetch(AI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (apiResponse.status === 401) {
                throw new Error("Session expired. Please log in again.");
            }
            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.message || `Server error (Status ${apiResponse.status}).`);
            }

            const data = await apiResponse.json();
            
            if (data.status === 'success') {
                setResponse(data.plan);
            } else {
                throw new Error(data.message || "Plan generation failed.");
            }

        } catch (err) {
            console.error("AI Planner Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        prompt,
        setPrompt,
        response,
        isLoading,
        error,
        handleSubmit
    };
};