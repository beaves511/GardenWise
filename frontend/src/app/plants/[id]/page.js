"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCollectionPicker } from '../../hooks/useCollectionPicker';
import Link from 'next/link';
import { LuLeaf, LuSun, LuThermometer, LuHeart, LuTriangleAlert } from 'react-icons/lu';

// --- STYLING CONSTANTS ---
const GREEN_PRIMARY = '#10B981'; 
const GREEN_HOVER = '#059669'; 
const GRAY_TEXT = '#4B5563'; 
const GRAY_BORDER = '#D1D5DB';
const RED_ALERT = '#EF4444';
const GREEN_LIGHT = '#D1FAE5';

const styles = {
    saveActionArea: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        marginBottom: '25px',
        padding: '15px',
        backgroundColor: '#F7F7F7',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
    },
    collectionSelect: {
        padding: '10px 15px',
        borderRadius: '6px',
        border: `1px solid #D1D5DB`,
        fontSize: '1em',
        backgroundColor: 'white',
        cursor: 'pointer',
        flexGrow: 1,
    },
    saveButton: {
        backgroundColor: '#10B981',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        fontSize: '1em',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
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
            : GRAY_BORDER,
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
    const { id: plantNameEncoded } = useParams();
    const plantName = decodeURIComponent(plantNameEncoded);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [plant, setPlant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState('Favorites');
    const [actualPlantType, setActualPlantType] = useState(null);

    const { collections: collectionNames, isLoading: isPickerLoading, refreshCollections } = useCollectionPicker();
    const [userId, setUserId] = useState(null);
    const [isAdded, setIsAdded] = useState(false);

    // --- EFFECT: INITIAL DATA FETCH ---
    useEffect(() => {
        const uid = localStorage.getItem('supabase.userId');
        if (uid) setUserId(uid);

        const fetchPlant = async () => {
            setLoading(true);
            setError(null);

            // Check query parameter first (from collections), then fall back to localStorage (from type selector)
            const typeFromUrl = searchParams.get('type');
            let plantType = typeFromUrl || localStorage.getItem('selectedPlantType') || 'indoor';

            console.log(`Fetching plant with type: ${plantType}${typeFromUrl ? ' (from saved plant data)' : ' (from type selector)'}`);

            let API_URL = `http://localhost:5000/api/v1/plants?name=${encodeURIComponent(plantName)}&type=${plantType}`;

            try {
                let response = await fetch(API_URL);
                let data = await response.json();

                // If first attempt fails, try the other plant type
                if (!response.ok) {
                    console.log(`Failed to fetch with type '${plantType}', trying alternate type...`);
                    const alternateType = plantType === 'indoor' ? 'other' : 'indoor';
                    API_URL = `http://localhost:5000/api/v1/plants?name=${encodeURIComponent(plantName)}&type=${alternateType}`;

                    response = await fetch(API_URL);
                    data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || `Failed to fetch plant details. Status: ${response.status}`);
                    }

                    // Update plantType to the one that worked
                    plantType = alternateType;
                    console.log(`Successfully found plant with type '${alternateType}'`);
                }

                setPlant(data);
                // Store the actual type used for successful fetch
                setActualPlantType(plantType);
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
    }, [plantName, searchParams]);

    // Set the default collection to the first available one
    useEffect(() => {
        if (collectionNames.length > 0 && !collectionNames.includes(selectedCollection)) {
            setSelectedCollection(collectionNames[0]);
        }
    }, [collectionNames]);

    // --- HANDLER: SAVE PLANT TO COLLECTION ---
    const handleSavePlant = async () => {
        if (!userId) {
            alert('Please sign in to add plants to your collection.');
            router.push('/auth');
            return;
        }

        setSaveStatus({type: 'loading', message: `Saving to ${selectedCollection}...`});
        const token = localStorage.getItem('supabase.token');

        if (!plant) {
            setSaveStatus({ message: 'Cannot save empty plant data.', isError: true });
            return;
        }

        try {
            const API_URL = 'http://localhost:5000/api/v1/collections';

            // Add plant_type to the plant data before saving
            // Use the actual type that was used to successfully fetch this plant
            const plantDataWithType = {
                ...plant,
                plant_type: actualPlantType || 'indoor'
            };

            console.log('Saving plant with type:', actualPlantType);
            console.log('Plant data being saved:', plantDataWithType);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    plant_data: plantDataWithType,
                    collection_name: selectedCollection,
                }),
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server responded with status ${response.status}.`);
            }

            setSaveStatus({ message: `Successfully added ${plant.common_name} to "${selectedCollection}"!`, isError: false });
            setIsAdded(true);
            refreshCollections();
            
        } catch (err) {
            console.error('Save to Collection Error:', err);
            setSaveStatus({ message: err.message || 'An unknown error occurred while saving.', isError: true });
            setIsAdded(false);
        }
    };

    // --- RENDERING LOGIC ---
    if (loading) return <p style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em' }}>Searching for {plantName}... 🪴</p>;
    
    if (error) return (
        <div style={styles.card}>
            <div style={styles.messageBox(true)}>
                <LuTriangleAlert size={20} style={{ marginRight: '10px' }} />
                <p style={{ margin: 0 }}>Error: {error}</p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link href="/" style={{ color: GREEN_PRIMARY, textDecoration: 'none' }}>← Try a different search</Link>
            </div>
        </div>
    );
    
    if (!plant) return <p style={{ textAlign: 'center', padding: '50px' }}>Plant data not available for {plantName}.</p>;
    
    const isLoggedIn = !!userId;

    return (
        <div style={styles.card}>
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
            
            <div style={styles.imagePlaceholder(plant.image_url)}>
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
            
            {/* Bottom Add to Collection Button */}
            <div style={styles.buttonContainer}>
                {/* Collection Selector - Side by Side Layout */}
                {userId && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        maxWidth: '500px',
                        margin: '0 auto 20px auto',
                        justifyContent: 'center'
                    }}>
                        <label 
                            htmlFor="collection-select"
                            style={{
                                fontSize: '0.95em',
                                fontWeight: '600',
                                color: GRAY_TEXT,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Save to:
                        </label>
                        <select 
                            id="collection-select"
                            value={selectedCollection}
                            onChange={(e) => setSelectedCollection(e.target.value)}
                            style={{
                                ...styles.collectionSelect,
                                flexGrow: 1,
                                minWidth: '200px'
                            }}
                            disabled={saveStatus?.type === 'loading'}
                        >
                            {collectionNames.length > 0 ? (
                                collectionNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))
                            ) : (
                                <option value="Favorites">Favorites (will be created)</option>
                            )}
                        </select>
                    </div>
                )}

                <button
                    onClick={handleSavePlant}
                    disabled={!userId}
                    style={styles.collectionButton(userId, isAdded)}
                >
                    <LuHeart size={18} style={{ marginRight: '10px' }} />
                    {isAdded 
                        ? `Added to ${selectedCollection}` 
                        : (userId ? `Add to ${selectedCollection}` : "Sign In to Collect")
                    }
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