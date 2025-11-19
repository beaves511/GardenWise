"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuSend, LuLoader, LuLayoutList, LuSun, LuPencil } from 'react-icons/lu';
import { useAIPlanner } from '../hooks/useAIPlanner'; 
import { useRequireAuth } from '../hooks/useRequireAuth'; 

const SYSTEM_INSTRUCTIONS = "Example: I have a small (4x8 ft) balcony garden facing west. I want to grow vegetables that can handle afternoon sun, and I need space for one tomato plant (large), basil (medium), and carrots (small/root crop). Plan a textual layout for me.";
const RED_ERROR = '#EF4444';
/**
 * AI Garden Planner Page (app/planner/page.js)
 * Implements the chat UI for planning garden layouts using the Flask/Gemini backend.
 */
export default function AIPlannerPage() {
    const router = useRouter();
    const { isAuthenticated, isChecking } = useRequireAuth();
    
    // Consume the ViewModel Hook
    const { 
        prompt, 
        setPrompt, 
        response, 
        isLoading, 
        error, 
        handleSubmit 
    } = useAIPlanner();

    /*if (isChecking) {
        // Show minimal loading while checking token
        return <div style={{textAlign: 'center', paddingTop: '100px', fontSize: '1.2rem', color: styles.GRAY_TEXT}}>Checking access permissions...</div>;
    }*/

    if (!isAuthenticated) {
        // CRITICAL FIX: Consistent Access Denied View
        return (
            <div style={styles.errorContainer}>
                <h2 style={{color: styles.GRAY_TEXT_DARK}}>Access Denied</h2>
                <p>You must be signed in to use the AI Planner.</p>
                <button onClick={() => router.replace('/auth')} style={styles.signInButton}>
                    Go to Sign In
                </button>
            </div>
        );
    }

    const renderResponse = () => {
        // Define base properties
        const baseStyle = { 
            ...styles.chatBox, 
            borderWidth: '1px',
            borderStyle: 'solid',
        };
        
        if (isLoading) {
            return (
                <div style={styles.chatBox}>
                    <LuLoader size={20} style={{marginRight: '10px', animation: 'spin 1s linear infinite'}} /> 
                    Generating garden plan... (This may take a moment)
                </div>
            );
        }
        if (error) {
            // Error case: Apply dynamic borderColor
            return (
                <div style={{...baseStyle, borderColor: styles.RED_ERROR, color: styles.RED_ERROR}}>
                    <LuPencil size={20} style={{marginRight: '10px'}} /> 
                    {error}
                </div>
            );
        }
        if (response) {
            // Success case: Apply default/success border color
            // Format the response with proper line breaks and spacing
            const formattedResponse = response.split('\n').map((line, idx) => (
                <div key={idx} style={styles.responseLine}>
                    {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                </div>
            ));

            return (
                <div style={{...baseStyle, borderColor: styles.GRAY_BORDER, backgroundColor: styles.GRAY_LIGHT}}>
                    <LuLayoutList size={20} style={{marginRight: '10px', flexShrink: 0, color: styles.GREEN_PRIMARY}} />
                    <div style={styles.responseContent}>
                        {formattedResponse}
                    </div>
                </div>
            );
        }
        
        // Default prompt case: Apply default border color
        return (
            <div style={{...baseStyle, borderColor: styles.GRAY_BORDER, color: styles.GRAY_TEXT}}>
                <LuSun size={20} style={{marginRight: '10px'}} /> 
                Provide details about your space (size, direction, desired plants) to get started!
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>AI Garden Planner</h1>
            <p style={styles.subtitle}>
                Ask the AI to generate a textual layout for your space. Remember to specify plant **width and height**!
            </p>
            
            {/* AI Response Display Area */}
            <div style={styles.responseArea}>
                {renderResponse()}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
                <textarea
                    placeholder={SYSTEM_INSTRUCTIONS}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                    style={styles.textarea}
                    rows={4}
                    disabled={isLoading}
                />
                <button type="submit" style={styles.submitButton} disabled={isLoading || !prompt.trim()}>
                    {isLoading ? <LuLoader size={24} style={{ animation: 'spin 1s linear infinite' }} /> : <LuSend size={24} />}
                </button>
            </form>

            {/* Global Spin Animation Style for React */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// --- Inline Styles ---
const styles = {
    GREEN_PRIMARY: '#10B981',
    RED_ERROR: '#EF4444',
    GRAY_TEXT: '#6B7280',
    GRAY_BORDER: '#D1D5DB',
    GRAY_LIGHT: '#F3F4F6',
    GRAY_TEXT_DARK: '#1F2937', 

    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: '0.2rem',
    },
    subtitle: {
        color: '#6B7280',
        marginBottom: '2rem',
    },
    responseArea: {
        minHeight: '200px',
        marginBottom: '1.5rem',
    },
    chatBox: {
        display: 'flex',
        alignItems: 'flex-start',
        padding: '1.5rem',
        borderRadius: '1rem',
        // Removed shorthand border property to avoid conflict
        // border: `1px solid #D1D5DB`, 
        whiteSpace: 'pre-wrap', // Preserve whitespace/formatting
        minHeight: '150px',
    },
    responseContent: {
        flexGrow: 1,
        fontFamily: 'inherit',
        fontSize: '1rem',
        lineHeight: '1.6',
        color: '#1F2937',
    },
    responseLine: {
        marginBottom: '0.5rem',
        wordWrap: 'break-word',
    },
    form: {
        display: 'flex',
        alignItems: 'center',
        border: `1px solid #D1D5DB`, 
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    textarea: {
        flexGrow: 1,
        border: 'none',
        padding: '1rem',
        resize: 'none',
        fontSize: '1rem',
        fontFamily: 'inherit',
        outline: 'none',
    },
    submitButton: {
        backgroundColor: '#10B981',
        color: 'white',
        border: 'none',
        padding: '1rem',
        height: '100%',
        minWidth: '60px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    // New styles for Access Denied consistency
    errorContainer: { 
        textAlign: 'center',
        paddingTop: '3rem', 
        color: RED_ERROR, 
    },
    signInButton: {
        backgroundColor: '#EF4444', 
        color: 'white', 
        border: 'none', 
        padding: '10px 20px', 
        borderRadius: '0.5rem', 
        marginTop: '1rem', 
        cursor: 'pointer',
    }
};