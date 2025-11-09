"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react'; // Added useCallback

// --- STYLING CONSTANTS (Matching Your Preferred Aesthetic) ---
const GREEN_PRIMARY = '#10B981'; // Tailwind emerald-500
const GREEN_LIGHT = '#D1FAE5'; // Tailwind emerald-100
const GRAY_TEXT = '#4B5563'; // Tailwind gray-600
const RED_ERROR = '#EF4444';

const styles = {
    // Navigation Bar component wrapper
    navBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 50px',
        borderBottom: `1px solid ${GREEN_LIGHT}`,
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    logo: {
        fontSize: '1.4em',
        fontWeight: '700',
        color: GREEN_PRIMARY,
        margin: 0,
        cursor: 'pointer',
    },
    navCenter: {
        display: 'flex',
        gap: '25px',
    },
    navLink: {
        background: 'none',
        border: 'none',
        textDecoration: 'none',
        color: GRAY_TEXT,
        fontSize: '0.95em',
        fontWeight: '600', 
        cursor: 'pointer',
        transition: 'color 0.2s',
    },
    navLinkDisabled: {
        background: 'none',
        border: 'none',
        textDecoration: 'none',
        color: '#D1D5DB', // Light Gray
        fontSize: '0.95em',
        fontWeight: '600',
        cursor: 'not-allowed',
    },
    navRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    signUpButton: {
        backgroundColor: GREEN_PRIMARY,
        color: 'white',
        border: 'none',
        padding: '8px 18px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: `0 2px 4px rgba(16, 185, 129, 0.3)`,
        transition: 'background-color 0.2s',
    },
    signOutButton: {
        backgroundColor: RED_ERROR,
        color: 'white',
        border: 'none',
        padding: '8px 18px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    mainContent: {
        padding: '20px 50px',
        maxWidth: '1200px',
        margin: '0 auto',
    }
};

/**
 * Root Layout Component for the App Router.
 * This wraps all pages and defines the main structure (Header, Footer, etc.).
 */
export default function RootLayout({ children }) {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Use useCallback to memoize the function, making it stable
    const checkAuthStatus = useCallback(() => {
        const token = localStorage.getItem('supabase.token');
        setIsLoggedIn(!!token);
    }, []); 

    useEffect(() => {
        // 1. Initial check when component mounts
        checkAuthStatus();
        
        // 2. Set up event listener for custom events dispatched by the ViewModel (FIX)
        window.addEventListener('storageChange', checkAuthStatus);

        // 3. Cleanup: Remove event listener when component unmounts
        return () => {
            window.removeEventListener('storageChange', checkAuthStatus);
        };
    }, []); // <-- FIX: Set dependency array back to [] to suppress warning

    const handleSignOut = () => {
        localStorage.removeItem('supabase.token');
        localStorage.removeItem('supabase.userId');
        setIsLoggedIn(false);
        router.push('/auth');
    };

    // --- Global Style Injection (for text rendering) ---
    const globalStyles = `
        body {
            margin: 0;
            font-family: 'Inter', sans-serif;
            background-color: #F9FAF9; 
            /* Improve font rendering */
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
    `;

    // --- Navigation Bar Component ---
    const NavBar = () => (
        <header style={styles.navBar}>
            {/* Left: Logo and Brand Name (Functional) */}
            <div style={styles.navLeft}>
                <h1 
                    style={styles.logo}
                    onClick={() => router.push('/')}
                >
                    <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🌱</span>
                    GardenWise
                </h1>
            </div>

            {/* Center: Main Navigation Links (Functional) */}
            <div style={styles.navCenter}>
                <button onClick={() => router.push('/')} style={styles.navLink}>Plants</button>
                <button onClick={() => router.push('/collections')} style={styles.navLink}>My Collections</button>
                <button onClick={() => router.push('/planner')} style={styles.navLink}>Garden Planner</button>
                <button style={styles.navLinkDisabled} disabled>Forums</button>
            </div>

            {/* Right: Auth Buttons (Conditional Logic) */}
            <div style={styles.navRight}>
                {isLoggedIn ? (
                    <button onClick={handleSignOut} style={styles.signOutButton}>
                        Sign Out
                    </button>
                ) : (
                    <>
                        <button onClick={() => router.push('/auth')} style={styles.navLink}>Sign In</button>
                        {/* The Sign Up link is handled via the in-page toggle */}
                    </>
                )}
            </div>
        </header>
    );

    return (
        <html lang="en">
            {/* Inject Global Styles for text rendering and background */}
            <head>
                <title>GardenWise</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>{globalStyles}</style>
            </head>
            <body>
                <NavBar />
                <main style={styles.mainContent}>
                    {children}
                </main>
            </body>
        </html>
    );
}
