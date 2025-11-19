"use client";

import { useCollections } from '../hooks/useCollections';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '../utils/api';
// import Image from 'next/image';
import { LuDroplet, LuSun, LuSettings, LuTrash2, LuPencil, LuArchive, LuImageOff, LuX } from 'react-icons/lu';
import { useState, useEffect, useRef } from 'react';

// --- STYLING CONSTANTS ---
const GREEN_PRIMARY = '#10B981';
const GRAY_BORDER = '#D1D5DB';
const GREEN_LIGHTEST = '#F0FFF4'; 
const RED_ERROR = '#EF4444';
const GRAY_TEXT_DARK = '#374151';
const GRAY_HOVER = '#F5F5F5'; 

// --- HELPER FUNCTION: Robust Data Check ---
const isDataPresent = (value) => {
    if (value === null || value === undefined) return false;
    
    const trimmedValue = String(value).trim().toLowerCase();
    
    return trimmedValue !== 'n/a' && 
           trimmedValue !== 'unknown' && 
           trimmedValue !== '' &&
           trimmedValue !== 'not specified in api response.'; 
};

// --- MODAL COMPONENT ---

const CreateCollectionModal = ({ userId, onClose, refreshCollections }) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await authenticatedFetch('/collections/create', {
                method: 'POST',
                body: JSON.stringify({ collection_name: name, user_id: userId }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                alert(`Collection '${name}' created successfully!`);
                refreshCollections();
                onClose();
            } else {
                throw new Error(data.message || 'Failed to create collection.');
            }

        } catch (e) {
            if (e.message.includes('Session expired')) {
                return;
            }
            console.error('Modal submit error:', e);
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    <h3 style={modalStyles.title}>Create New Collection</h3>
                    <button onClick={onClose} style={modalStyles.closeButton} disabled={isLoading}>
                        <LuX size={20} />
                    </button>
                </div>

                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleSubmit} style={modalStyles.form}>
                    <input
                        type="text"
                        placeholder="e.g., Summer Herbs, Wishlist, Indoor Foliage"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={3}
                        style={modalStyles.input}
                        disabled={isLoading}
                    />
                    <button type="submit" style={modalStyles.submitButton} disabled={isLoading || name.length < 3}>
                        {isLoading ? 'Creating...' : 'Create Collection'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- RENAME COLLECTION MODAL COMPONENT ---

const RenameCollectionModal = ({ currentName, onClose, onRename }) => {
    const [newName, setNewName] = useState(currentName);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await onRename(currentName, newName);

            if (result.success) {
                alert(result.message || `Collection renamed successfully!`);
                onClose();
            } else {
                setError(result.message || 'Failed to rename collection.');
            }
        } catch (e) {
            console.error('Modal submit error:', e);
            setError(e.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    <h3 style={modalStyles.title}>Rename Collection</h3>
                    <button onClick={onClose} style={modalStyles.closeButton} disabled={isLoading}>
                        <LuX size={20} />
                    </button>
                </div>

                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleSubmit} style={modalStyles.form}>
                    <input
                        type="text"
                        placeholder="Enter new collection name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                        minLength={3}
                        style={modalStyles.input}
                        disabled={isLoading}
                        autoFocus
                    />
                    <button type="submit" style={modalStyles.submitButton} disabled={isLoading || newName.length < 3}>
                        {isLoading ? 'Renaming...' : 'Rename Collection'}
                    </button>
                </form>
            </div>
        </div>
    );
};


// --- GLOBAL HELPER FUNCTIONS ---

const handleDeletePlant = async (plantId, commonName, refreshCollections) => {
    if (!window.confirm(`Are you sure you want to delete ${commonName} from your collections? This cannot be undone.`)) {
        return;
    }

    try {
        const response = await authenticatedFetch(`/collections/${plantId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert(`SUCCESS! ${commonName} deleted.`);
            refreshCollections();
        } else {
            const data = await response.json();
            alert(`FAILURE! Could not delete plant: ${data.message || 'Server error.'}`);
        }

    } catch (e) {
        if (e.message.includes('Session expired')) {
            return;
        }
        console.error('Frontend delete error:', e);
        alert('A network error occurred while trying to delete the plant.');
    }
};

const handleDeleteCollectionContainer = async (collectionName, collections, refreshCollections) => {
    const collectionList = collections[collectionName] || [];

    if (!window.confirm(`WARNING: This will delete the ENTIRE collection "${collectionName}" and ALL ${collectionList.length} plants inside it. Are you sure?`)) {
        return;
    }

    try {
        const response = await authenticatedFetch(`/collections/container/${encodeURIComponent(collectionName)}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert(`SUCCESS! Collection "${collectionName}" and all associated plants have been removed.`);
            refreshCollections(); 
        } else {
            const data = await response.json();
            console.error("DELETE COLLECTION: Server Error Details:", data);
            alert(`FAILURE! Could not delete collection: ${data.message || 'Server error.'}`);
        }

    } catch (e) {
        if (e.message.includes('Session expired')) {
            return;
        }
        console.error('Frontend collection delete error:', e);
        alert('A network error occurred while trying to delete the collection.');
    }
};


// --- Main Collections Page Component ---

export default function CollectionsPage() {
    const { collections, isLoading, error, userId, refreshCollections, renameCollection } = useCollections();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddCollection = () => {
        if (!userId) {
             alert('Please sign in to add collections.');
             router.push('/auth');
             return;
        }
        setIsModalOpen(true);
    };

    if (!userId && !isLoading) {
        return (
            <div style={styles.errorContainer}>
                <h2 style={{color: GRAY_TEXT_DARK}}>Access Denied</h2>
                <p>You must be signed in to view your collections.</p>
                <button onClick={() => router.push('/auth')} style={styles.signInButton}>
                    Go to Sign In
                </button>
            </div>
        );
    }

    if (isLoading) {
        return <p style={styles.loading}>Loading your collections... 🪴</p>;
    }

    if (error) {
        return <p style={styles.error}>Error loading data: {error}</p>;
    }

    const collectionNames = Object.keys(collections);

    return (
        <div style={styles.container}>
            {isModalOpen && (
                <CreateCollectionModal 
                    userId={userId}
                    onClose={() => setIsModalOpen(false)}
                    refreshCollections={refreshCollections}
                />
            )}
            
            <h1 style={styles.title}>My Collections</h1>
            <p style={styles.subtitle}>Viewing {collectionNames.length} Active Collections</p>
            
            <button 
                onClick={handleAddCollection} 
                style={styles.globalActionButton}
            >
                Add New Collection
            </button>

            {collectionNames.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>You haven&apos;t saved any plants yet. Start building your garden!</p>
                    <button onClick={() => router.push('/')} style={styles.searchButton}>
                        Start Exploring Plants
                    </button>
                </div>
            ) : (
                <div style={styles.collectionsGrid}>
                    {collectionNames.map(name => (
                        <CollectionCard
                            key={name}
                            name={name}
                            plants={collections[name]}
                            router={router}
                            onDelete={(plantId, commonName) => handleDeletePlant(plantId, commonName, refreshCollections)}
                            onDeleteCollection={(collectionName) => handleDeleteCollectionContainer(collectionName, collections, refreshCollections)}
                            onRename={renameCollection}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}


// --- Helper Component: Collection Management Menu ---

const CollectionSettingsMenu = ({ collectionName, onDeleteCollection, onRenameClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const buttonRef = useRef(null);
    const wrapperRef = useRef(null); // New ref for the entire wrapper

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleAction = (event, action, isDelete = false, isRename = false) => {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);

        if (isDelete) {
            onDeleteCollection(collectionName);
        } else if (isRename) {
            onRenameClick(collectionName);
        } else {
            alert(`${action} collection: ${collectionName}`);
        }
    };

    const MenuItem = ({ icon: Icon, label, onClick, style = {} }) => {
        const [isHovered, setIsHovered] = useState(false);
        
        return (
            <div
                onClick={(e) => {
                    onClick(e);
                }}
                onMouseEnter={() => {
                    setIsHovered(true);
                }}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    ...styles.menuItem, 
                    ...style, 
                    cursor: 'pointer',
                    backgroundColor: isHovered ? GREEN_LIGHTEST : 'white',
                    pointerEvents: 'auto',
                }} 
            >
                <Icon size={16} style={{marginRight: '8px', pointerEvents: 'none'}} />
                <span style={{pointerEvents: 'none'}}>{label}</span>
            </div>
        );
    };

    return (
        <div
            ref={wrapperRef}
            style={styles.settingsWrapper}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                onMouseEnter={() => {
                    setIsButtonHovered(true);
                }}
                onMouseLeave={() => setIsButtonHovered(false)}
                style={{
                    ...styles.settingsButton,
                    color: isButtonHovered ? GREEN_PRIMARY : GRAY_TEXT_DARK,
                    minWidth: '32px',
                    minHeight: '32px',
                }}
                ref={buttonRef}
            >
                <LuSettings size={18} style={{pointerEvents: 'none'}} />
            </button>
            {isOpen && (
                <div style={styles.settingsDropdown}>
                    <MenuItem
                        icon={LuPencil}
                        label="Rename Collection"
                        onClick={(e) => handleAction(e, 'Rename', false, true)}
                    />
                    <MenuItem 
                        icon={LuArchive} 
                        label="Toggle Active Status" 
                        onClick={(e) => handleAction(e, 'Toggle Status')} 
                    />
                    <MenuItem 
                        icon={LuTrash2} 
                        label="Delete All Plants" 
                        onClick={(e) => handleAction(e, 'Bulk Delete')} 
                        style={{ color: RED_ERROR }}
                    />
                    <MenuItem 
                        icon={LuTrash2} 
                        label="Delete Collection" 
                        onClick={(e) => handleAction(e, 'Delete Collection', true)} 
                        style={{ color: RED_ERROR }}
                    />
                </div>
            )}
        </div>
    );
};


// --- Helper Component: Care Info Popover ---

const CareInfoPopover = ({ icon: Icon, label, text, onClose }) => {
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={popoverRef} style={styles.carePopover}>
            <div style={styles.carePopoverHeader}>
                <Icon size={16} style={{color: GREEN_PRIMARY, marginRight: '6px'}} />
                <span style={styles.carePopoverLabel}>{label}</span>
            </div>
            <div style={styles.carePopoverText}>{text}</div>
        </div>
    );
};

// --- Helper Component: Collection Card ---

const CollectionCard = ({ name, plants, router, onDelete, onDeleteCollection, onRename }) => {
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

    const displayList = plants.filter(p => p.common_name && Object.keys(p.plant_details_json || {}).length > 0);
    const count = displayList.length;

    const handleRenameClick = () => {
        setIsRenameModalOpen(true);
    };

    const PlantItem = ({ plant, index }) => {
        const details = plant.plant_details_json;
        const common_name = details.common_name || 'Unnamed Plant';
        const [activePopover, setActivePopover] = useState(null);

        const handleDelete = (e) => {
            e.stopPropagation();
            onDelete(plant.id, common_name);
        };

        const handleIconClick = (e, popoverType) => {
            e.stopPropagation();
            setActivePopover(activePopover === popoverType ? null : popoverType);
        };

        const backgroundColor = index % 2 === 0 ? 'white' : GRAY_HOVER;

        const imageUrl = details.image_url;

        const careDetails = details.care_instructions || {};

        const handlePlantClick = () => {
            // Get the plant type from the saved data and pass it as a query parameter
            const plantType = details.plant_type || 'indoor';
            router.push(`/plants/${encodeURIComponent(common_name)}?type=${plantType}`);
        };

        return (
            <div
                key={plant.id}
                style={{...styles.plantItem, backgroundColor: backgroundColor}}
                onClick={handlePlantClick}
            >
                <div style={styles.itemSectionNameMerged}>

                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={common_name}
                            width={45}
                            height={45}
                            style={styles.plantImage}
                            onError={(e) => e.target.src = previewImage}
                        />
                    ) : (
                        <div style={styles.noImagePlaceholder}>
                            <LuImageOff size={20} />
                        </div>
                    )}

                    <div style={{marginLeft: '10px'}}>
                        <div style={styles.plantName}>{common_name}</div>
                        <div style={styles.careIconWrapper}>
                            {isDataPresent(careDetails.watering) && (
                                <div style={styles.careIconContainer}>
                                    <LuDroplet
                                        size={14}
                                        style={{...styles.careIcon, cursor: 'pointer'}}
                                        onClick={(e) => handleIconClick(e, 'water')}
                                    />
                                    {activePopover === 'water' && (
                                        <CareInfoPopover
                                            icon={LuDroplet}
                                            label="Watering"
                                            text={careDetails.watering}
                                            onClose={() => setActivePopover(null)}
                                        />
                                    )}
                                </div>
                            )}
                            {isDataPresent(careDetails.light) && (
                                <div style={styles.careIconContainer}>
                                    <LuSun
                                        size={14}
                                        style={{...styles.careIcon, cursor: 'pointer'}}
                                        onClick={(e) => handleIconClick(e, 'sun')}
                                    />
                                    {activePopover === 'sun' && (
                                        <CareInfoPopover
                                            icon={LuSun}
                                            label="Light"
                                            text={careDetails.light}
                                            onClose={() => setActivePopover(null)}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleDelete}
                    style={styles.plantDeleteButton}
                >
                    <LuTrash2 size={16} />
                </button>
            </div>
        );
    };

    return (
        <div style={styles.collectionCard}>
            {isRenameModalOpen && (
                <RenameCollectionModal
                    currentName={name}
                    onClose={() => setIsRenameModalOpen(false)}
                    onRename={onRename}
                />
            )}

            <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{name} ({count} plants)</h3>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>

                    <button style={styles.viewAllButton}>View All</button>
                    <CollectionSettingsMenu
                        collectionName={name}
                        onDeleteCollection={onDeleteCollection}
                        onRenameClick={handleRenameClick}
                    />
                </div>
            </div>

            <div style={styles.plantListHeader}>
                <div style={styles.plantListHeaderTitleMerged}>Plants</div>
                <div style={styles.plantDeleteButtonPlaceholder}></div>
            </div>

            <div style={styles.plantList}>
                {displayList.length === 0 ? (
                    <div style={styles.emptyCollectionText}>
                        This collection is empty. Add a plant from the search page to get started!
                    </div>
                ) : (
                    displayList.map((plant, index) => (
                        <PlantItem key={plant.id} plant={plant} index={index} />
                    ))
                )}
            </div>
            
        </div>
    );
};


// --- Inline Styles ---

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: GRAY_TEXT_DARK,
        margin: 0,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: GRAY_TEXT_DARK,
        padding: '0.25rem',
        transition: 'color 0.2s',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    input: {
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: `1px solid ${GRAY_BORDER}`,
        fontSize: '1rem',
    },
    submitButton: {
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        backgroundColor: GREEN_PRIMARY,
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
};

const styles = {
    container: {
        maxWidth: '1000px',
        margin: '0 auto',
    },
    title: {
        fontSize: '2rem',
        fontWeight: '800',
        color: GRAY_TEXT_DARK,
        marginBottom: '0.2rem',
    },
    subtitle: {
        color: '#6B7280',
        marginBottom: '1.5rem',
    },
    globalActionButton: {
        backgroundColor: GREEN_PRIMARY,
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '0.5rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginBottom: '2rem',
        transition: 'background-color 0.2s',
    },
    collectionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '2.5rem',
    },
    collectionCard: {
        backgroundColor: '#FFFFFF',
        padding: '1rem',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        position: 'relative',
    },
    cardTitle: {
        fontSize: '1.2rem',
        fontWeight: '700',
        color: GRAY_TEXT_DARK,
        margin: 0,
    },
    viewAllButton: {
        backgroundColor: GREEN_PRIMARY,
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '0.5rem',
        fontSize: '0.8rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
    plantListHeader: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: GRAY_BORDER,
        padding: '8px 12px',
        borderRadius: '0.25rem',
        fontWeight: '600',
        color: GRAY_TEXT_DARK,
        fontSize: '0.9rem',
        marginTop: '10px',
    },
    plantListHeaderTitleMerged: {
        flexGrow: 1,
    },
    plantList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    plantItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px',
        border: `1px solid ${GRAY_BORDER}`,
        borderRadius: '0.25rem',
        cursor: 'pointer',
        transition: 'background-color 0.1s',
    },
    plantImage: {
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        objectFit: 'cover',
    },
    plantName: {
        fontWeight: '600',
        fontSize: '1rem',
        color: GRAY_TEXT_DARK,
        marginBottom: '2px',
    },
    itemSectionNameMerged: {
        flexGrow: 1, 
        display: 'flex',
        alignItems: 'center',
    },
    noImagePlaceholder: {
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        backgroundColor: GRAY_BORDER,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: GRAY_TEXT_DARK,
    },
    careIconWrapper: {
        display: 'flex',
        gap: '8px',
        color: GREEN_PRIMARY,
    },
    careIconContainer: {
        position: 'relative',
    },
    careIcon: {
        minWidth: '16px',
        minHeight: '16px',
    },
    carePopover: {
        position: 'absolute',
        top: '24px',
        left: '0',
        backgroundColor: 'white',
        border: `2px solid ${GREEN_PRIMARY}`,
        borderRadius: '0.5rem',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        minWidth: '200px',
        maxWidth: '300px',
    },
    carePopoverHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '6px',
        fontWeight: '600',
        fontSize: '0.9rem',
        color: GRAY_TEXT_DARK,
    },
    carePopoverLabel: {
        color: GRAY_TEXT_DARK,
    },
    carePopoverText: {
        fontSize: '0.95rem',
        color: GRAY_TEXT_DARK,
        lineHeight: '1.4',
    },
    plantDeleteButton: {
        background: 'none',
        border: 'none',
        color: RED_ERROR,
        cursor: 'pointer',
        padding: '5px',
        transition: 'color 0.1s',
        minWidth: '40px',
    },
    plantDeleteButtonPlaceholder: {
        width: '40px',
    },
    emptyCollectionText: {
        textAlign: 'center',
        padding: '2rem 1rem',
        color: '#6B7280',
        fontSize: '0.95rem',
        fontStyle: 'italic',
    },
    settingsWrapper: {
        position: 'relative',
        display: 'inline-block',
        zIndex: 100,
    },
    settingsButton: {
        background: 'none',
        border: 'none',
        color: GRAY_TEXT_DARK,
        cursor: 'pointer',
        padding: '5px',
        transition: 'color 0.1s',
        position: 'relative',
        zIndex: 101,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsDropdown: {
        position: 'absolute',
        top: '100%',
        right: '0',
        backgroundColor: 'white',
        border: `1px solid ${GRAY_BORDER}`,
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 102,
        minWidth: '200px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginTop: '4px',
    },
    menuItem: {
        padding: '10px 15px',
        width: '100%',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9rem',
        color: GRAY_TEXT_DARK,
        transition: 'background-color 0.1s',
        display: 'flex',
        alignItems: 'center',
    },
    loading: { textAlign: 'center', paddingTop: '3rem', fontSize: '1.2rem', },
    errorContainer: { textAlign: 'center', paddingTop: '3rem', color: RED_ERROR, },
    errorBox: { backgroundColor: '#FEE2E2', color: RED_ERROR, padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', border: `1px solid ${RED_ERROR}`, },
    signInButton: { backgroundColor: RED_ERROR, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '0.5rem', marginTop: '1rem', cursor: 'pointer', },
    emptyState: { textAlign: 'center', padding: '3rem', border: `2px dashed ${GRAY_BORDER}`, borderRadius: '1rem', marginTop: '2rem', },
    searchButton: { backgroundColor: GREEN_PRIMARY, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '0.5rem', marginTop: '1rem', cursor: 'pointer', }
};