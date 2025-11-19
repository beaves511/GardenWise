"use client"; // Must be a Client Component hook to use React state/effects

import { useState, useEffect } from 'react';

const FALLBACK_IMAGE = "https://placehold.co/800x250/065f46/ffffff?text=Image+Unavailable";

/**
 * Custom hook to handle all logic and state related to fetching plant details.
 * Acts as the ViewModel, keeping the UI component clean.
 * @param {string} plantName - The name of the plant to search for.
 */
export function usePlantDetails(plantName) {
    const [plant, setPlant] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (!plantName) return;

        setLoading(true);
        setError(null);
        setImageError(false);

        const encodedPlantName = encodeURIComponent(plantName);

        // Get the plant type from localStorage (set by the modal)
        const plantType = localStorage.getItem('selectedPlantType') || 'indoor';

        // CRITICAL: The URL to the Flask backend with plant type parameter
        const API_URL = `http://localhost:5000/api/v1/plants?name=${encodedPlantName}&type=${plantType}`;

        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`Plant **'${plantName}'** not found in the database or external API.`);
                    }
                    throw new Error(`Server returned status code: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setPlant(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                setError(err.message);
                setLoading(false);
            });
    }, [plantName]);

    // Derived State: Logic to determine the final image URL
    const displayImageUrl = plant && (imageError || plant.image_url === '/default_image.jpg')
        ? FALLBACK_IMAGE 
        : (plant ? plant.image_url : FALLBACK_IMAGE);

    // Return all necessary state and methods for the View
    return {
        plant,
        loading,
        error,
        displayImageUrl,
        setImageError, // Allows the View's <img> tag to report errors back
        pageTitle: plant ? `${plant.common_name} Care Guide` : 'Loading...',
    };
}
