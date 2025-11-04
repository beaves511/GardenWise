"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthForm } from '../hooks/useAuthForm'; // ViewModel hook

// --- STYLING CONSTANTS (Assumed from layout.js) ---
const GREEN_PRIMARY = '#10B981';
const RED_ERROR = '#EF4444';
const GRAY_BORDER = '#D1D5DB';

/**
 * Auth Page View (app/auth/page.js)
 * Renders the Sign In / Sign Up form and consumes state from the ViewModel hook.
 */
export default function AuthPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // --- FIX: Read initial state directly from URL ---
    // Check URL once to set the initial value of isLogin state: 
    // If ?type=signup is in URL, start in Signup mode (isLoginMode = false).
    const isSignupUrl = searchParams.get('type') === 'signup';
    
    // We must initialize the state based on the URL check.
    const [isLoginMode, setIsLoginMode] = useState(!isSignupUrl); 

    // Consume the ViewModel hook
    const {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        error,
        handleAuth,
    } = useAuthForm();

    // --- CRITICAL FIX: Pass the current mode to handleAuth ---
    const handleLocalAuthSubmit = (e) => {
        // Now passing e (event) and isLoginMode (boolean)
        handleAuth(e, isLoginMode); 
    };

    // Logic to handle token redirect only
    useEffect(() => {
        // Redirect user if they are already logged in
        const token = localStorage.getItem('supabase.token');
        if (token) {
            router.push('/collections');
        }
    }, [router]);


    const toggleMode = () => {
        const newMode = !isLoginMode;
        
        // CRITICAL FIX: Remove router.replace() to prevent the instability bug
        // We now rely ONLY on the fast, local state flip (setIsLoginMode)
        setIsLoginMode(newMode);
        
        // Clearing inputs and errors when switching
        setEmail('');
        setPassword('');
    };
    
    const title = isLoginMode ? 'Sign In' : 'Sign Up';
    const otherMode = isLoginMode ? 'Sign Up' : 'Sign In';

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>{title} to GardenWise</h2>
                <p style={styles.subtitle}>
                    {isLoginMode ? 
                        "Welcome back! Access your plant collections." :
                        "Create your free account to start tracking your garden."
                    }
                </p>

                {/* Display Error Message */}
                {error && (
                    <div style={styles.errorBox}>
                        {error}
                    </div>
                )}
                
                {/* Auth Form */}
                <form onSubmit={handleLocalAuthSubmit} style={styles.form}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={styles.input}
                        disabled={isLoading}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={styles.input}
                        disabled={isLoading}
                    />

                    <button
                        type="submit"
                        style={styles.submitButton({isLoading})}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : title}
                    </button>
                </form>

                <div style={styles.toggleText}>
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                    {/* FIX: This button now calls the local toggle function */}
                    <button onClick={toggleMode} style={styles.toggleButton} disabled={isLoading}>
                        {otherMode}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Inline Styles (Remaining styles remain unchanged for brevity) ---
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 1rem',
        minHeight: '80vh',
    },
    card: {
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '2rem',
        textAlign: 'center',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1F2937',
        margin: '0 0 0.5rem 0',
    },
    subtitle: {
        color: '#6B7280',
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
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
        transition: 'border-color 0.2s',
    },
    submitButton: ({isLoading}) => ({
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: 'none',
        backgroundColor: isLoading ? GRAY_BORDER : GREEN_PRIMARY,
        color: 'white',
        fontWeight: '600',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        boxShadow: isLoading ? 'none' : `0 2px 4px rgba(16, 185, 129, 0.3)`,
    }),
    toggleText: {
        marginTop: '1.5rem',
        color: '#6B7280',
        fontSize: '0.9rem',
    },
    toggleButton: {
        background: 'none',
        border: 'none',
        color: GREEN_PRIMARY,
        marginLeft: '0.5rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'color 0.2s',
        padding: '0',
    },
    errorBox: {
        backgroundColor: '#FEF2F2',
        color: RED_ERROR,
        border: `1px solid ${RED_ERROR}`,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        fontSize: '0.9rem',
    }
};
