"use client"; // Marks this as a client component to use hooks

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// FIX: Reverting to LuAlertTriangle, which is the standard name, to resolve the export conflict.
import { LuLeaf, LuSun, LuThermometer, LuHeart, LuTriangleAlert } from 'react-icons/lu'; // Icons

// --- STYLING CONSTANTS ---
const GREEN_PRIMARY = '#10B981'; 
const GREEN_HOVER = '#059669'; 
const GRAY_TEXT = '#4B5563'; 
const GRAY_BORDER = '#D1D5DB';
const RED_ALERT = '#EF4444';
const GREEN_LIGHT = '#D1FAE5'; // Assuming this was the definition from index.js

const styles = {
    card: {
        maxWidth: '800px', 
        margin: '40px auto', 
        padding: '30px', 
        fontFamily: 'Inter, sans-serif',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        backgroundColor: 'white',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
    },
    title: {
        fontSize: '2.2em',
        color: '#1F2937',
        margin: '0 0 5px 0',
        fontWeight: '800',
    },
    subtitle: {
        fontSize: '1em',
        color: GRAY_TEXT,
        fontStyle: 'italic',
        margin: 0,
    },
    imagePlaceholder: (url) => ({
        height: '250px',
        backgroundColor: '#F3F4F6',
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginBottom: '25px',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: GRAY_TEXT,
        fontSize: '0.9em',
        border: `1px dashed ${GRAY_BORDER}`,
    }),
    description: {
        lineHeight: '1.6',
        fontSize: '1.05em',
        color: '#374151',
        borderBottom: `1px solid ${GRAY_BORDER}`,
        paddingBottom: '20px',
        marginBottom: '20px',
    },
    careGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
    },
    careItem: {
        padding: '15px',
        borderRadius: '8px',
        backgroundColor: '#F9FAFB',
        borderLeft: `3px solid ${GREEN_PRIMARY}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    careLabel: {
        fontWeight: '600',
        color: GREEN_PRIMARY,
        textTransform: 'uppercase',
        fontSize: '0.8em',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '5px',
    },
    careValue: {
        color: '#1F2937',
        fontSize: '0.95em',
    },
    buttonContainer: {
        textAlign: 'center',
        marginTop: '30px',
    },
    collectionButton: (isLoggedIn, isAdded) => ({
        backgroundColor: isLoggedIn 
            ? (isAdded ? GREEN_HOVER : GREEN_PRIMARY)
            : GRAY_BORDER, // Disabled if logged out
        color: 'white',
        border: 'none',
        padding: '12px 25px',
        borderRadius: '25px',
        fontSize: '1em',
        fontWeight: '700',
        cursor: isLoggedIn ? 'pointer' : 'not-allowed',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '300px',
        margin: '0 auto',
    }),
    messageBox: (isError) => ({
        padding: '10px 15px',
        marginBottom: '15px',
        borderRadius: '6px',
        backgroundColor: isError ? RED_ALERT + '10' : GREEN_LIGHT,
        color: isError ? RED_ALERT : GREEN_PRIMARY,
        border: `1px solid ${isError ? RED_ALERT : GREEN_PRIMARY}`,
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    })
};

/**
 * Maps internal care keys to Lucide icons.
 */
const getCareIcon = (key) => {
    switch (key) {
        case 'light': return <LuSun size={16} style={{ marginRight: '5px' }} />;
        case 'watering': return <LuLeaf size={16} style={{ marginRight: '5px' }} />;
        case 'fertilization': return <LuHeart size={16} style={{ marginRight: '5px' }} />;
        case 'ideal_temp': return <LuThermometer size={16} style={{ marginRight: '5px' }} />;
        default: return <LuLeaf size={16} style={{ marginRight: '5px' }} />;
    }
};

export default function PlantDetailPage() {
    const { id: plantNameEncoded } = useParams(); // Get the name from the App Router URL
    const plantName = decodeURIComponent(plantNameEncoded);
    const router = useRouter();

    const [plant, setPlant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null); // success, error, or null

    // State for tracking login status
    const [userId, setUserId] = useState(null);
    const [isAdded, setIsAdded] = useState(false); // Mock state for demonstration

    // --- EFFECT: INITIAL DATA FETCH ---
    useEffect(() => {
        // Check for local storage token on load
        const uid = localStorage.getItem('supabase.userId');
        if (uid) setUserId(uid);
        
        // Fetch plant details from Flask API
        const fetchPlant = async () => {
            setLoading(true);
            setError(null);

            const API_URL = `http://localhost:5000/api/v1/plants?name=${encodeURIComponent(plantName)}`;

            try {
                const response = await fetch(API_URL);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || `Failed to fetch plant details. Status: ${response.status}`);
                }
                setPlant(data);
            } catch (err) {
                console.error("Plant Detail Fetch Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (plantName) {
            fetchPlant();
        }
    }, [plantName]);

    // --- HANDLER: SAVE PLANT TO COLLECTION ---
    const handleSavePlant = async () => {
        if (!userId) {
            alert('Please sign in to add plants to your collection.');
            router.push('/auth');
            return;
        }

        setSaveStatus(null);
        const token = localStorage.getItem('supabase.token');

        // DEBUG: Log the token to verify it's present and correct
        console.log('Sending JWT Token:', token ? token.substring(0, 10) + '...' : 'MISSING');


        if (!plant) {
            setSaveStatus({ message: 'Cannot save empty plant data.', isError: true });
            return;
        }

        try {
            const API_URL = 'http://localhost:5000/api/v1/collections';
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // CRITICAL: Send the JWT token
                },
                body: JSON.stringify({
                    plant_data: plant, // Send the full normalized plant data object
                    collection_name: 'Favorites', // Default collection name
                }),
            });
            
            const data = await response.json();

            if (!response.ok) {
                // Catches 401 (Unauthorized) or 500 (Database error)
                throw new Error(data.error || `Server responded with status ${response.status}.`);
            }

            // SUCCESS!
            setSaveStatus({ message: `Successfully added ${plant.common_name} to Favorites!`, isError: false });
            setIsAdded(true); // Update state to show confirmation
            
        } catch (err) {
            console.error('Save to Collection Error:', err);
            setSaveStatus({ message: err.message || 'An unknown error occurred while saving.', isError: true });
            setIsAdded(false);
        }
    };

    // --- RENDERING LOGIC ---

    if (loading) return <p style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em' }}>Searching the database for '{plantName}'... 🪴</p>;
    
    if (error) return (
        <div style={styles.card}>
            <div style={styles.messageBox(true)}>
                {/* Ensure the name matches the import */}
                <LuTriangleAlert size={20} style={{ marginRight: '10px' }} />
                <p style={{ margin: 0 }}>Error: {error}</p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link href="/" style={{ color: GREEN_PRIMARY, textDecoration: 'none' }}>← Try a different search</Link>
            </div>
        </div>
    );
    

    // --- RENDERING LOGIC ---

    if (loading) return <p style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em' }}>Searching the database for '{plantName}'... 🪴</p>;
    
    if (error) return (
        <div style={styles.card}>
            <div style={styles.messageBox(true)}>
                {/* Ensure the name matches the import */}
                <LuTriangleAlert size={20} style={{ marginRight: '10px' }} />
                <p style={{ margin: 0 }}>Error: {error}</p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link href="/" style={{ color: GREEN_PRIMARY, textDecoration: 'none' }}>← Try a different search</Link>
            </div>
        </div>
    );
    
    if (!plant) return <p style={{ textAlign: 'center', padding: '50px' }}>Plant data not available for '{plantName}'.</p>;
    
    const pageTitle = `${plant.common_name} Care Guide | GardenWise`;

    return (
        <div style={styles.card}>
            {/* FIX: Removed the invalid <head> tag */}
            
            {/* Display Save Status Messages */}
            {saveStatus && (
                <div style={styles.messageBox(saveStatus.isError)}>
                    {saveStatus.message}
                </div>
            )}

            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>{plant.common_name}</h1>
                    <p style={styles.subtitle}>{plant.scientific_name}</p>
                </div>
            </div>
            
            {/* Image and Description */}
            <div 
                style={styles.imagePlaceholder(plant.image_url)}
            >
                {!plant.image_url.includes('http') && <span>Image not available from source</span>}
            </div>
            
            <p style={styles.description}>
                {plant.description}
            </p>

            {/* Care Instructions Grid */}
            <div style={styles.careGrid}>
                {Object.entries(plant.care_instructions).map(([key, value]) => (
                    <div key={key} style={styles.careItem}>
                        <span style={styles.careLabel}>
                            {getCareIcon(key)} {key.replace('_', ' ')}
                        </span>
                        <span style={styles.careValue}>
                            {value || 'Not specified'}
                        </span>
                    </div>
                ))}
            </div>
            
            {/* Add to Collection Button */}
            <div style={styles.buttonContainer}>
                <button
                    onClick={handleSavePlant}
                    disabled={!userId}
                    style={styles.collectionButton(userId, isAdded)}
                >
                    <LuHeart size={18} style={{ marginRight: '10px' }} />
                    {isAdded ? "Added to Favorites" : (userId ? "Add to Favorites" : "Sign In to Collect")}
                </button>

                {!userId && (
                    <p style={{marginTop: '10px', fontSize: '0.9em', color: GRAY_TEXT}}>
                        <a 
                            href="/auth" 
                            style={{color: GREEN_PRIMARY, textDecoration: 'none', fontWeight: '600'}}
                        >
                            Log In Here
                        </a> to save this plant.
                    </p>
                )}
            </div>

        </div>
    );
}
