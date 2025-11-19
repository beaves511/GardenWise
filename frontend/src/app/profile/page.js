"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '../utils/api';

// STYLING CONSTANTS
const GREEN_PRIMARY = '#10B981';
const GREEN_LIGHT = '#D1FAE5';
const GRAY_TEXT = '#4B5563';
const RED_ERROR = '#EF4444';
const BLUE_INFO = '#3B82F6';

const styles = {
    container: {
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px',
    },
    pageTitle: {
        fontSize: '2.5em',
        color: GREEN_PRIMARY,
        fontWeight: '700',
        marginBottom: '30px',
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    sectionTitle: {
        fontSize: '1.5em',
        color: '#1F2937',
        fontWeight: '600',
        marginBottom: '20px',
        borderBottom: `2px solid ${GREEN_LIGHT}`,
        paddingBottom: '10px',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 0',
        borderBottom: '1px solid #F3F4F6',
    },
    label: {
        fontSize: '0.95em',
        fontWeight: '600',
        color: GRAY_TEXT,
    },
    value: {
        fontSize: '0.95em',
        color: '#1F2937',
    },
    formGroup: {
        marginBottom: '20px',
    },
    inputLabel: {
        display: 'block',
        fontSize: '0.9em',
        fontWeight: '600',
        color: GRAY_TEXT,
        marginBottom: '8px',
    },
    input: {
        width: '100%',
        padding: '12px 15px',
        fontSize: '1em',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    },
    inputFocus: {
        borderColor: GREEN_PRIMARY,
    },
    button: {
        backgroundColor: GREEN_PRIMARY,
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.2s',
        width: '100%',
    },
    buttonHover: {
        backgroundColor: '#059669',
    },
    cancelButton: {
        backgroundColor: '#6B7280',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.2s',
        width: '100%',
        marginTop: '10px',
    },
    editButton: {
        backgroundColor: BLUE_INFO,
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '0.9em',
        transition: 'background-color 0.2s',
    },
    message: {
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '0.95em',
        fontWeight: '500',
    },
    successMessage: {
        backgroundColor: GREEN_LIGHT,
        color: '#065F46',
        border: `1px solid ${GREEN_PRIMARY}`,
    },
    errorMessage: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
        border: `1px solid ${RED_ERROR}`,
    },
    infoMessage: {
        backgroundColor: '#DBEAFE',
        color: '#1E40AF',
        border: '1px solid #3B82F6',
    },
    loadingText: {
        textAlign: 'center',
        color: GRAY_TEXT,
        fontSize: '1.1em',
        padding: '40px',
    },
};

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingEmail, setEditingEmail] = useState(false);
    const [editingPassword, setEditingPassword] = useState(false);

    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('success');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const token = localStorage.getItem('supabase.token');

        if (!token) {
            router.push('/auth');
            return;
        }

        try {
            const response = await authenticatedFetch('/profile', {
                method: 'GET',
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setNewEmail(data.email);
            } else {
                showMessage('Failed to load profile. Please try logging in again.', 'error');
                setTimeout(() => router.push('/auth'), 2000);
            }
        } catch (error) {
            if (error.message.includes('Session expired')) {
                // Session expired, redirect is already handled by authenticatedFetch
                return;
            }
            showMessage('Network error. Please check your connection.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(null), 5000);
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();

        if (!newEmail || newEmail === profile.email) {
            showMessage('Please enter a different email address.', 'error');
            return;
        }

        try {
            const response = await authenticatedFetch('/profile/email', {
                method: 'PUT',
                body: JSON.stringify({ email: newEmail }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message || 'Email updated successfully!', 'success');
                setProfile({ ...profile, email: newEmail });
                setEditingEmail(false);
            } else {
                showMessage(data.error || 'Failed to update email.', 'error');
            }
        } catch (error) {
            if (error.message.includes('Session expired')) {
                return;
            }
            showMessage('Network error. Please try again.', 'error');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (!newPassword) {
            showMessage('Please enter a new password.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match.', 'error');
            return;
        }

        try {
            const response = await authenticatedFetch('/profile/password', {
                method: 'PUT',
                body: JSON.stringify({ password: newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Password updated successfully!', 'success');
                setEditingPassword(false);
                setNewPassword('');
                setConfirmPassword('');
            } else {
                showMessage(data.error || 'Failed to update password.', 'error');
            }
        } catch (error) {
            if (error.message.includes('Session expired')) {
                return;
            }
            showMessage('Network error. Please try again.', 'error');
        }
    };

    if (loading) {
        return <div style={styles.loadingText}>Loading profile...</div>;
    }

    if (!profile) {
        return <div style={styles.loadingText}>Unable to load profile.</div>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.pageTitle}>My Profile</h1>

            {message && (
                <div
                    style={{
                        ...styles.message,
                        ...(messageType === 'success' ? styles.successMessage : {}),
                        ...(messageType === 'error' ? styles.errorMessage : {}),
                        ...(messageType === 'info' ? styles.infoMessage : {}),
                    }}
                >
                    {message}
                </div>
            )}

            {/* Profile Information Card */}
            <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Account Information</h2>

                <div style={styles.infoRow}>
                    <span style={styles.label}>Member Since:</span>
                    <span style={styles.value}>
                        {new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                </div>
            </div>

            {/* Email Update Card */}
            <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Email Address</h2>

                {!editingEmail ? (
                    <div>
                        <div style={styles.infoRow}>
                            <span style={styles.label}>Current Email:</span>
                            <span style={styles.value}>{profile.email}</span>
                        </div>
                        <button
                            onClick={() => setEditingEmail(true)}
                            style={styles.editButton}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
                            onMouseOut={(e) => e.target.style.backgroundColor = BLUE_INFO}
                        >
                            Change Email
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleUpdateEmail}>
                        <div style={styles.formGroup}>
                            <label style={styles.inputLabel}>New Email Address</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                style={styles.input}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            style={styles.button}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                            onMouseOut={(e) => e.target.style.backgroundColor = GREEN_PRIMARY}
                        >
                            Update Email
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingEmail(false);
                                setNewEmail(profile.email);
                            }}
                            style={styles.cancelButton}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#4B5563'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#6B7280'}
                        >
                            Cancel
                        </button>
                    </form>
                )}
            </div>

            {/* Password Update Card */}
            <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Password</h2>

                {!editingPassword ? (
                    <div>
                        <div style={styles.infoRow}>
                            <span style={styles.label}>Password:</span>
                            <span style={styles.value}>••••••••</span>
                        </div>
                        <button
                            onClick={() => setEditingPassword(true)}
                            style={styles.editButton}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
                            onMouseOut={(e) => e.target.style.backgroundColor = BLUE_INFO}
                        >
                            Change Password
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleUpdatePassword}>
                        <div style={styles.formGroup}>
                            <label style={styles.inputLabel}>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={styles.input}
                                placeholder="At least 6 characters"
                                required
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.inputLabel}>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={styles.input}
                                placeholder="Re-enter your password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            style={styles.button}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                            onMouseOut={(e) => e.target.style.backgroundColor = GREEN_PRIMARY}
                        >
                            Update Password
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingPassword(false);
                                setNewPassword('');
                                setConfirmPassword('');
                            }}
                            style={styles.cancelButton}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#4B5563'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#6B7280'}
                        >
                            Cancel
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
