"use client";

import { useState, useEffect, useCallback } from 'react';

const COLLECTIONS_API_URL = 'http://localhost:5000/api/v1/collections';

/**
 * ViewModel Hook for managing a user's collection data.
 * Fetches and groups data by collection name.
 */
export const useCollections = () => {
    const [collections, setCollections] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

    // Use a state variable to force a refresh of the data
    const [refreshTrigger, setRefreshTrigger] = useState(0); 

    // Function exposed to the View to force a refresh
    const refreshCollections = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
        // Dispatch event to force layout update (for Sign Out button sync)
        window.dispatchEvent(new Event('storageChange')); 
    }, []);

    // --- NEW FUNCTION: Deletes an entire collection container ---
    const deleteCollection = useCallback(async (collectionName) => {
        const token = localStorage.getItem('supabase.token');
        const collectionList = collections[collectionName];
        
        if (!collectionList || collectionList.length === 0) {
            // Handle case where collection might be empty or missing
            if (window.confirm(`Collection '${collectionName}' is empty. Do you want to delete the container?`)) {
                // If the collection is truly empty, we can still try to delete the container via a dedicated route
                // NOTE: A dedicated backend endpoint is required to delete the container by name/user_id if empty.
                // For simplicity, we assume the backend will handle an empty collection deletion via a dedicated route.
            } else {
                return;
            }
        }
        
        // CRITICAL: We need the ID of the parent collection (which is the collection_id of the first item)
        // Since the collection might be empty, we must rely on a dedicated backend endpoint that finds the ID by name.
        
        if (!window.confirm(`Are you sure you want to delete the ENTIRE collection "${collectionName}"? All ${collectionList.length} plants will be lost.`)) {
            return;
        }

        try {
            // We use the DELETE endpoint, but the ID must be retrieved. 
            // Since we don't have the parent collection ID in state, 
            // we'll hit a hypothetical new endpoint that deletes by name.
            
            // NOTE: The most robust architecture would expose a /collections/container/<name> DELETE endpoint.
            const response = await fetch(`http://localhost:5000/api/v1/collections/container/${encodeURIComponent(collectionName)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                alert(`Collection "${collectionName}" deleted successfully.`);
                refreshCollections();
            } else {
                const data = await response.json();
                throw new Error(data.message || `Failed to delete collection: Server error.`);
            }
        } catch (e) {
            console.error('Delete collection error:', e);
            alert(`Error: ${e.message}`);
        }
    }, [collections, refreshCollections]); // Dependency on collections ensures we have up-to-date IDs


    // Memoized function for fetching data
    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('supabase.token');
        const currentUserId = localStorage.getItem('supabase.userId');

        if (!token || !currentUserId) {
            setUserId(null);
            setIsLoading(false);
            return;
        }

        setUserId(currentUserId);
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(COLLECTIONS_API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                throw new Error("Invalid or expired session. Please sign in again.");
            }
            
            if (!response.ok) {
                let errorDetails = "Server Error.";
                
                // CRITICAL FIX: Explicitly check for 500 status to direct debugging
                if (response.status === 500) {
                     throw new Error(`Critical Server Crash (500). Please check Flask console for database traceback.`);
                }
                
                try {
                    const errorData = await response.json();
                    errorDetails = errorData.message || `API Error (Status ${response.status}).`;
                } catch {
                    errorDetails = `Server returned status ${response.status}. Failed to parse response.`;
                }
                throw new Error(`Failed to load collections: ${errorDetails}`);
            }

            const apiResponse = await response.json();
            
            // --- CRITICAL DEBUG LINE ---
            console.log("DEBUG: Final API Response Data:", apiResponse);
            // ---------------------------

            // --- FINAL FIX: Access the nested 'data' property if it exists, otherwise use the response object ---
            // The data structure is expected to be: {"status": "success", "data": {CollectionName: [...]}}
            const finalData = apiResponse.data || apiResponse;
            
            if (Object.keys(finalData).length > 0) {
                // If it has keys (collection names), it's a success
                setCollections(finalData);
            } else {
                // If the response is empty (but status was 200)
                setCollections({});
            }

        } catch (e) {
            console.error('Error fetching collections:', e);
            // FINAL FIX: Ensure the error message is always a string
            setError(e.message || 'A critical network failure occurred.');
            // If fetching fails, clear the collections state
            setCollections({}); 
        } finally {
            setIsLoading(false);
        }
    }, [refreshTrigger]); // DEPENDS ON refreshTrigger

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        collections,
        isLoading,
        error,
        userId,
        refreshCollections,
        deleteCollection, // Expose the delete function
    };
};

