"use client";

import { useState, useEffect, useCallback } from 'react';

const COLLECTIONS_API_URL = 'http://localhost:5000/api/v1/collections';

/**
 * Hook to fetch the list of existing collection names for the current user.
 * Returns the data needed for a selection dropdown/modal.
 */
export const useCollectionPicker = () => {
    const [collections, setCollections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshCollections = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('supabase.token');

        if (!token) {
            console.log('No token found, skipping collection fetch');
            setIsLoading(false);
            return;
        }

        const fetchCollectionNames = async () => {
            try {
                console.log('Fetching collections from:', COLLECTIONS_API_URL);
                
                const response = await fetch(COLLECTIONS_API_URL, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                console.log('Response status:', response.status);

                if (response.status === 401) {
                    throw new Error("Session expired. Please log in again.");
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to load collections.`);
                }

                const apiResponse = await response.json();
                console.log('Raw API Response:', apiResponse);
                
                // The backend returns collections directly as an object keyed by collection name
                // Example: { "Favorites": [...], "wishlist": [...] }
                // OR wrapped in a data field: { data: { "Favorites": [...] } }
                
                const collectionsData = apiResponse.data || apiResponse;
                
                if (collectionsData && typeof collectionsData === 'object') {
                    console.log('Collections data:', collectionsData);
                    console.log('Type of data:', typeof collectionsData);
                    
                    // Extract just the names into an array
                    const names = Object.keys(collectionsData);
                    console.log('Collection names extracted:', names);
                    setCollections(names);
                } else {
                    console.log('Invalid response structure, setting empty array');
                    setCollections([]);
                }
            } catch (e) {
                console.error("Collection Picker Fetch Error:", e);
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCollectionNames();
    }, [refreshTrigger]);

    return {
        collections, // Array of collection names: ["Favorites", "Wishlist"]
        isLoading,
        error,
        refreshCollections,
    };
};