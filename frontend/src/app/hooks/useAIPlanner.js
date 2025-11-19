"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '../utils/api';

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
        setPrompt(''); // Clear the input immediately after submission

        try {
            const apiResponse = await authenticatedFetch('/ai/plan', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

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
            if (err.message.includes('Session expired')) {
                // authenticatedFetch already handled the redirect
                return;
            }
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