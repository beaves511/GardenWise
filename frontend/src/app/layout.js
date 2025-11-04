/*
import React from 'react';

// --- STYLING CONSTANTS (Copied from index.js) ---
const GREEN_PRIMARY = '#10B981'; // Tailwind emerald-500
const GREEN_LIGHT = '#D1FAE5'; // Tailwind emerald-100
const GRAY_TEXT = '#4B5563'; // Tailwind gray-600

const styles = {
  // Navigation Bar component
  navBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 50px',
    borderBottom: `1px solid ${GREEN_LIGHT}`,
    backgroundColor: 'white',
  },
  logo: {
    fontSize: '1.4em',
    fontWeight: '700',
    color: GREEN_PRIMARY,
    margin: 0,
  },
  navCenter: {
    display: 'flex',
    gap: '25px',
  },
  navLink: {
    textDecoration: 'none',
    color: GRAY_TEXT,
    fontSize: '0.95em',
    fontWeight: '500',
    transition: 'color 0.2s',
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
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
    transition: 'background-color 0.2s',
  },
};

const Navigation = () => (
  <nav style={styles.navBar}>
    <div style={styles.navLeft}>
      <h1 style={styles.logo}>GardenWise</h1>
    </div>
    <div style={styles.navCenter}>
      <a href="/" style={styles.navLink}>Plants</a>
      <a href="#" style={styles.navLink}>My Collections</a>
      <a href="#" style={styles.navLink}>Garden Planner</a>
      <a href="#" style={styles.navLink}>Forums</a>
    </div>
    <div style={styles.navRight}>
      <a href="#" style={styles.navLink}>Sign In</a>
      <button style={styles.signUpButton}>🌱 Sign Up</button>
    </div>
  </nav>
);

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>GardenWise</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          body {
            margin: 0;
            font-family: 'Inter', sans-serif;
            background-color: #F9FAF9; 
          }
        `}</style>
      </head>
      <body>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}*/

/*
"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Define theme colors for styling consistency
const GREEN_PRIMARY = '#10B981'; // Tailwind emerald-500
const GREEN_DARK = '#059669';   // Tailwind emerald-600
const GRAY_LIGHT = '#F3F4F6';   // Tailwind gray-100
const GRAY_HOVER = '#E5E7EB';   // Tailwind gray-200


export default function RootLayout({ children }) {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check if the user has a token saved from a successful login
        const token = localStorage.getItem('supabase.token');
        setIsLoggedIn(!!token);
    }, [router.pathname]); // Re-check state on route change

    const handleSignOut = () => {
        localStorage.removeItem('supabase.token');
        localStorage.removeItem('supabase.userId');
        setIsLoggedIn(false);
        router.push('/auth');
    };

    // --- Navigation Bar Component ---
    const NavBar = () => (
        <header style={styles.header}>
            <div style={styles.navContainer}>
                <div 
                    style={styles.logo}
                    onClick={() => router.push('/')}
                >
                    <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🌱</span>
                    <span style={{ fontWeight: '700', fontSize: '1.25rem', color: GREEN_DARK }}>GardenWise</span>
                </div>
                <nav style={styles.navLinks}>
                    <button onClick={() => router.push('/')} style={styles.navButton}>
                        Plants
                    </button>
                    
                    <button onClick={() => router.push('/collections')} style={styles.navButton}>
                        My Collections
                    </button>
                    <button style={styles.navButtonDisabled} disabled>
                        Garden Planner
                    </button>

                    <button style={styles.navButtonDisabled} disabled>
                        Forums
                    </button>
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isLoggedIn ? (
                        <button 
                            onClick={handleSignOut} 
                            style={styles.signOutButton}
                        >
                            Sign Out
                        </button>
                    ) : (
                        <>
                            <button onClick={() => router.push('/auth')} style={styles.signInButton}>
                                Sign In
                            </button>
                            <button onClick={() => router.push('/auth')} style={styles.signUpButton}>
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );

    return (
        <html lang="en">
            <body>
                <NavBar />
                <main style={styles.mainContent}>
                    {children}
                </main>
            </body>
        </html>
    );
}

// --- Inline Styles ---
const styles = {
    header: {
        backgroundColor: '#FFFFFF',
        // Enhanced shadow for a lifted look
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        padding: '0.75rem 1rem',
        borderBottom: `1px solid ${GRAY_HOVER}`,
    },
    navContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
    },
    navLinks: {
        display: 'flex',
        gap: '1.5rem',
    },
    navButton: {
        background: 'none',
        border: 'none',
        color: '#4B5563', // Gray-700
        cursor: 'pointer',
        fontWeight: '500',
        padding: '0.5rem 0', // Padding top/bottom, zero left/right
        transition: 'color 0.2s',
        // Adding pseudo-class for hover effect (requires CSS-in-JS library, but we use an object for approximation)
        textDecoration: 'none',
        ':hover': {
            color: GREEN_PRIMARY,
        }
    },
    navButtonDisabled: {
        background: 'none',
        border: 'none',
        color: '#D1D5DB', // Gray-300
        fontWeight: '500',
        padding: '0.5rem 0',
        cursor: 'not-allowed',
    },
    // Enhanced styles for better button contrast and visibility
    signInButton: {
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        background: 'none',
        border: `1px solid ${GRAY_HOVER}`,
        color: '#4B5563',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: GRAY_HOVER,
        }
    },
    signUpButton: {
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        backgroundColor: GREEN_PRIMARY,
        color: 'white',
        border: 'none',
        fontWeight: '600',
        cursor: 'pointer',
        marginLeft: '0.5rem',
        transition: 'background-color 0.2s',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        ':hover': {
            backgroundColor: GREEN_DARK,
        }
    },
    signOutButton: {
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        backgroundColor: '#EF4444', // Red-500
        color: 'white',
        border: 'none',
        fontWeight: '600',
        cursor: 'pointer',
        marginLeft: '0.5rem',
        transition: 'background-color 0.2s',
        ':hover': {
            backgroundColor: '#DC2626', // Red-600
        }
    },
    mainContent: {
        padding: '1.5rem 1rem',
        maxWidth: '1200px',
        margin: '0 auto',
    }
};
*/
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
                <button style={styles.navLinkDisabled} disabled>Garden Planner</button>
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
