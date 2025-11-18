"use client";

import { useState, useEffect, useCallback } from 'react';

const FORUM_API_URL = 'http://localhost:5000/api/v1/forum/posts';

/**
 * ViewModel Hook for Forum Posts
 * Handles all business logic and state management for forum operations
 */
export const useForumPosts = () => {
    // State
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPosting, setIsPosting] = useState(false);

    // Fetch posts (on mount)
    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('supabase.token'); 
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(FORUM_API_URL, { headers });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to load posts. Status: ${response.status}`);
            }

            const data = await response.json();
            setPosts(Array.isArray(data) ? data : []);

        } catch (e) {
            console.error("Forum Fetch Error:", e);
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createPost = useCallback(async (title, content) => {
        setIsPosting(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('supabase.token');
            const payload = { title, content };

            const response = await fetch(FORUM_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || data.error || `Post failed (Status ${response.status}).`);
            }
            
            // Optimistic UI update
            const newPost = {
                id: data.post_id || Date.now(),
                title,
                content,
                user_id: localStorage.getItem('supabase.userId'),
                created_at: new Date().toISOString(),
                author_email: 'You'
            };
            
            setPosts(prevPosts => [newPost, ...prevPosts]);
            
            return { success: true, message: 'Post created successfully!' };

        } catch (e) {
            console.error("Post Submission Error:", e);
            setError(e.message);
            return { success: false, error: e.message };
        } finally {
            setIsPosting(false);
        }
    }, []);

    return {
        // State
        posts,
        isLoading,
        error,
        isPosting,
        
        // Actions
        createPost,
        refreshPosts: fetchPosts,
    };
};