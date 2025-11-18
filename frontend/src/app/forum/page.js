"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuSend, LuClock, LuUser, LuLoader } from 'react-icons/lu';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useForumPosts } from '../hooks/useForumPosts'; // ViewModel hook

const GREEN_PRIMARY = '#10B981';
const RED_ERROR = '#EF4444';
const GRAY_TEXT = '#6B7280';
const GRAY_BORDER = '#D1D5DB';
const GRAY_LIGHT = '#F3F4F6';

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
    },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1F2937', marginBottom: '0.2rem' },
    subtitle: { color: GRAY_TEXT, marginBottom: '2rem' },
    loading: { textAlign: 'center', paddingTop: '3rem', fontSize: '1.2rem' },
    
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '2rem',
    },
    
    formColumn: {
        paddingRight: '1rem',
    },
    postFormContainer: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    },
    postFormTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: GREEN_PRIMARY,
        marginBottom: '1rem',
        borderBottom: `2px solid ${GRAY_BORDER}`, 
        paddingBottom: '0.5rem',
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
    textarea: {
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: `1px solid ${GRAY_BORDER}`,
        fontSize: '1rem',
        resize: 'vertical',
    },
    submitButton: {
        backgroundColor: GREEN_PRIMARY,
        color: 'white',
        border: 'none',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
    },
    errorBox: {
        backgroundColor: '#FEF2F2',
        color: RED_ERROR,
        border: `1px solid ${RED_ERROR}`,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
    },
    signInPrompt: {
        textAlign: 'center',
        padding: '2rem',
        border: `2px dashed ${GRAY_BORDER}`,
        borderRadius: '1rem',
    },
    signInButton: {
        backgroundColor: RED_ERROR,
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '0.5rem',
        marginTop: '1rem',
        cursor: 'pointer',
    },
    
    postsColumn: {
        paddingLeft: '1rem',
        borderLeft: `1px solid ${GRAY_BORDER}`,
    },
    postsTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: '1rem',
    },
    postCard: {
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '0.75rem',
        marginBottom: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${GRAY_BORDER}`,
    },
    postHeader: {
        borderBottom: `1px solid ${GRAY_BORDER}`,
        paddingBottom: '0.5rem',
        marginBottom: '0.5rem',
    },
    postTitle: {
        fontSize: '1.25rem',
        color: GREEN_PRIMARY,
        margin: 0,
        fontWeight: '800',
    },
    postContent: {
        color: '#374151',
        fontSize: '1rem',
        lineHeight: '1.4',
    },
    postMeta: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.85rem',
        color: GRAY_TEXT,
        marginTop: '5px',
    },
    postAuthor: {
        fontWeight: '600',
    },
    postDate: {
        fontSize: '0.75rem',
        color: GRAY_TEXT,
        display: 'flex',
        alignItems: 'center',
    },
    viewButton: {
        background: 'none',
        border: 'none',
        color: GREEN_PRIMARY,
        fontWeight: '600',
        cursor: 'pointer',
    },
    emptyState: {
        textAlign: 'center',
        padding: '2rem',
        color: GRAY_TEXT,
        border: `1px dashed ${GRAY_BORDER}`,
        borderRadius: '0.75rem',
    }
};

// Presentational Component - Pure UI
function PostCard({ post, onViewThread }) {
    return (
        <div style={styles.postCard}>
            <div style={styles.postHeader}>
                <h3 style={styles.postTitle}>{post.title}</h3>
                <div style={styles.postMeta}>
                    <LuUser size={14} style={{marginRight: '5px'}} /> 
                    <span style={styles.postAuthor}>{post.author_email || `User ${post.user_id.substring(0, 8)}...`}</span>
                </div>
            </div>
            <p style={styles.postContent}>{post.content}</p>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
                <span style={styles.postDate}>
                    <LuClock size={14} style={{marginRight: '5px'}} />
                    {new Date(post.created_at).toLocaleDateString()}
                </span>
                <button onClick={() => onViewThread(post.id)} style={styles.viewButton}>View Thread</button>
            </div>
        </div>
    );
}

// Container Component - Uses ViewModel
export default function ForumPage() {
    const router = useRouter();
    const { isAuthenticated, isChecking } = useRequireAuth();
    
    // ViewModel hook - handles all business logic
    const { posts, isLoading, error, isPosting, createPost } = useForumPosts();
    
    // Local UI state only
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');

    // Event handlers - delegate to ViewModel
    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Please sign in to create a post.');
            return;
        }

        const result = await createPost(newPostTitle, newPostContent);
        
        if (result.success) {
            setNewPostTitle('');
            setNewPostContent('');
            alert(result.message);
        } else {
            alert(`Error: ${result.error}`);
        }
    };

    const handleViewThread = (postId) => {
        router.push(`/forum/${postId}`);
    };

    // Only show loading for posts, not auth checking
    if (isLoading) {
        return <p style={styles.loading}>Loading community forum... 💬</p>;
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Community Forum</h1>
            <p style={styles.subtitle}>Share tips, ask questions, and connect with other gardeners.</p>

            <div style={styles.grid}>
                {/* Left Column: Post Creation */}
                <div style={styles.formColumn}>
                    {isAuthenticated ? (
                        <div style={styles.postFormContainer}> 
                            <h3 style={styles.postFormTitle}>Start a New Discussion</h3>
                            {error && <div style={styles.errorBox}>{error}</div>}
                            
                            <form onSubmit={handlePostSubmit} style={styles.form}>
                                <input
                                    type="text"
                                    placeholder="Post Title"
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)} 
                                    required
                                    style={styles.input}
                                    disabled={isPosting}
                                />
                                <textarea
                                    placeholder="Share your gardening question or tip..."
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    required
                                    rows={4}
                                    style={styles.textarea}
                                    disabled={isPosting}
                                />
                                <button type="submit" style={styles.submitButton} disabled={isPosting}>
                                    {isPosting ? (
                                        <>
                                            <LuLoader size={18} style={{animation: 'spin 1s linear infinite'}} />
                                            Posting...
                                        </>
                                    ) : (
                                        <>
                                            <LuSend size={18} />
                                            Post to Forum
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div style={styles.signInPrompt}>
                            <p>You must be signed in to start a new discussion.</p>
                            <button onClick={() => router.push('/auth')} style={styles.signInButton}>
                                Sign In / Register
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Recent Posts */}
                <div style={styles.postsColumn}>
                    <h3 style={styles.postsTitle}>Recent Threads</h3>
                    {posts.length === 0 ? (
                        <p style={styles.emptyState}>No posts yet. Start the first thread!</p>
                    ) : (
                        posts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                onViewThread={handleViewThread}
                            />
                        ))
                    )}
                </div>
            </div>
            
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}