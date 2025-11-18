"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LuArrowLeft, LuUser, LuClock, LuMessageSquare, LuSend, LuCornerDownRight } from 'react-icons/lu';
import { useRequireAuth } from '../../hooks/useRequireAuth';

const GREEN_PRIMARY = '#10B981';
const RED_ERROR = '#EF4444';
const GRAY_TEXT = '#6B7280';
const GRAY_BORDER = '#D1D5DB';
const GRAY_LIGHT = '#F3F4F6';

const styles = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem 1rem',
    },
    backButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: GREEN_PRIMARY,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '1.5rem',
    },
    postCard: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        marginBottom: '2rem',
    },
    postTitle: {
        fontSize: '2rem',
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: '0.5rem',
    },
    postMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '0.9rem',
        color: GRAY_TEXT,
        marginBottom: '1rem',
        paddingBottom: '1rem',
        borderBottom: `1px solid ${GRAY_BORDER}`,
    },
    postContent: {
        fontSize: '1.1rem',
        lineHeight: '1.6',
        color: '#374151',
    },
    commentsSection: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    },
    commentsTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    commentForm: {
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: GRAY_LIGHT,
        borderRadius: '0.75rem',
    },
    textarea: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: `1px solid ${GRAY_BORDER}`,
        fontSize: '1rem',
        resize: 'vertical',
        marginBottom: '0.75rem',
        boxSizing: 'border-box',
    },
    submitButton: {
        backgroundColor: GREEN_PRIMARY,
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    cancelButton: {
        backgroundColor: '#9CA3AF',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        fontWeight: '600',
        cursor: 'pointer',
    },
    comment: {
        padding: '1rem',
        borderBottom: `1px solid ${GRAY_BORDER}`,
        marginBottom: '0.5rem',
    },
    nestedComment: {
        marginLeft: '2rem',
        paddingLeft: '1rem',
        borderLeft: `3px solid ${GREEN_PRIMARY}`,
    },
    commentAuthor: {
        fontWeight: '600',
        color: GREEN_PRIMARY,
        fontSize: '0.9rem',
    },
    commentDate: {
        fontSize: '0.75rem',
        color: GRAY_TEXT,
        marginLeft: '0.5rem',
    },
    commentContent: {
        marginTop: '0.5rem',
        color: '#374151',
        lineHeight: '1.5',
    },
    replyButton: {
        background: 'none',
        border: 'none',
        color: GREEN_PRIMARY,
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
    },
    signInPrompt: {
        textAlign: 'center',
        padding: '1.5rem',
        backgroundColor: GRAY_LIGHT,
        borderRadius: '0.75rem',
        color: GRAY_TEXT,
    },
    signInLink: {
        color: GREEN_PRIMARY,
        fontWeight: '600',
        textDecoration: 'none',
    },
};

function CommentComponent({ comment, onReply, replyingTo, replyContent, setReplyContent, handleReplySubmit, cancelReply, getReplies, isAuthenticated }) {
    const isNested = !!comment.parent_comment_id;
    const replies = getReplies(comment.id);

    return (
        <div style={isNested ? { ...styles.comment, ...styles.nestedComment } : styles.comment}>
            <div>
                <span style={styles.commentAuthor}>
                    <LuUser size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {comment.author_email}
                </span>
                <span style={styles.commentDate}>
                    {new Date(comment.created_at).toLocaleDateString()}
                </span>
            </div>
            <p style={styles.commentContent}>{comment.content}</p>
            
            {isAuthenticated && !isNested && (
                <button
                    onClick={() => onReply(comment.id)}
                    style={styles.replyButton}
                >
                    <LuCornerDownRight size={14} />
                    Reply
                </button>
            )}
            
            {replyingTo === comment.id && (
                <div style={{ marginTop: '1rem', paddingLeft: '1rem' }}>
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                        rows={3}
                        style={styles.textarea}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleReplySubmit(comment.id)} style={styles.submitButton}>
                            <LuSend size={14} /> Post Reply
                        </button>
                        <button onClick={cancelReply} style={styles.cancelButton}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            
            {/* Render nested replies */}
            {replies.map(reply => (
                <CommentComponent 
                    key={reply.id} 
                    comment={reply}
                    onReply={onReply}
                    replyingTo={replyingTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    handleReplySubmit={handleReplySubmit}
                    cancelReply={cancelReply}
                    getReplies={getReplies}
                    isAuthenticated={isAuthenticated}
                />
            ))}
        </div>
    );
}

export default function ForumPostDetail() {
    const { id: postId } = useParams();
    const router = useRouter();
    const { isAuthenticated } = useRequireAuth();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        const fetchPostAndComments = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('supabase.token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                // Fetch all posts and find the one we need
                const postResponse = await fetch(`http://localhost:5000/api/v1/forum/posts`, { headers });
                const postsData = await postResponse.json();
                const foundPost = postsData.find(p => p.id === postId);
                setPost(foundPost);

                // Fetch comments for this post
                console.log('Fetching comments for post:', postId);
                const commentsResponse = await fetch(
                    `http://localhost:5000/api/v1/forum/posts/${postId}/comments`,
                    { headers }
                );
                
                console.log('Comments response status:', commentsResponse.status);
                const commentsData = await commentsResponse.json();
                console.log('Comments data received:', commentsData);
                
                // Handle both array response and error response
                if (Array.isArray(commentsData)) {
                    setComments(commentsData);
                } else if (commentsData.error) {
                    console.error('Error fetching comments:', commentsData.error);
                    setComments([]);
                } else {
                    setComments([]);
                }
            } catch (e) {
                console.error("Error fetching post:", e);
                setComments([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPostAndComments();
    }, [postId]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Please sign in to comment.');
            return;
        }

        console.log('Submitting comment to post:', postId);
        console.log('Comment content:', newComment);

        try {
            const token = localStorage.getItem('supabase.token');
            console.log('Token exists:', !!token);
            
            // CRITICAL FIX: Ensure we're only sending content, no parent_comment_id
            const payload = { content: newComment };
            console.log('Payload:', payload);
            
            const response = await fetch(
                `http://localhost:5000/api/v1/forum/posts/${postId}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response data:', result);

            if (response.ok) {
                const newCommentObj = {
                    id: result.data[0].id,
                    content: newComment,
                    author_email: 'You',
                    created_at: new Date().toISOString(),
                    parent_comment_id: null,
                };
                setComments([...comments, newCommentObj]);
                setNewComment('');
                alert('Comment posted successfully!');
            } else {
                alert(`Error: ${result.error || 'Failed to post comment'}`);
            }
        } catch (e) {
            console.error("Error posting comment:", e);
            alert(`Error posting comment: ${e.message}`);
        }
    };

    const handleReplySubmit = async (parentId) => {
        if (!isAuthenticated) {
            alert('Please sign in to reply.');
            return;
        }

        console.log('Submitting reply to comment:', parentId);
        console.log('Reply content:', replyContent);

        try {
            const token = localStorage.getItem('supabase.token');
            const response = await fetch(
                `http://localhost:5000/api/v1/forum/posts/${postId}/comments`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        content: replyContent,
                        parent_comment_id: parentId,
                    }),
                }
            );

            console.log('Reply response status:', response.status);
            const result = await response.json();
            console.log('Reply response data:', result);

            if (response.ok) {
                const newReply = {
                    id: result.data[0].id,
                    content: replyContent,
                    author_email: 'You',
                    created_at: new Date().toISOString(),
                    parent_comment_id: parentId,
                };
                setComments([...comments, newReply]);
                setReplyContent('');
                setReplyingTo(null);
                alert('Reply posted successfully!');
            } else {
                alert(`Error: ${result.error || 'Failed to post reply'}`);
            }
        } catch (e) {
            console.error("Error posting reply:", e);
            alert(`Error posting reply: ${e.message}`);
        }
    };

    const handleReplyClick = (commentId) => {
        setReplyingTo(replyingTo === commentId ? null : commentId);
        setReplyContent('');
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setReplyContent('');
    };

    // Organize comments into threads
    const topLevelComments = comments.filter(c => !c.parent_comment_id);
    const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

    if (isLoading) return <p style={{ textAlign: 'center', padding: '3rem' }}>Loading post...</p>;
    if (!post) return <p style={{ textAlign: 'center', padding: '3rem' }}>Post not found.</p>;

    return (
        <div style={styles.container}>
            <button onClick={() => router.push('/forum')} style={styles.backButton}>
                <LuArrowLeft size={20} /> Back to Forum
            </button>

            <div style={styles.postCard}>
                <h1 style={styles.postTitle}>{post.title}</h1>
                <div style={styles.postMeta}>
                    <span>
                        <LuUser size={16} style={{ display: 'inline', marginRight: '4px' }} />
                        {post.author_email}
                    </span>
                    <span>
                        <LuClock size={16} style={{ display: 'inline', marginRight: '4px' }} />
                        {new Date(post.created_at).toLocaleDateString()}
                    </span>
                </div>
                <p style={styles.postContent}>{post.content}</p>
            </div>

            <div style={styles.commentsSection}>
                <h2 style={styles.commentsTitle}>
                    <LuMessageSquare size={24} />
                    Comments ({comments.length})
                </h2>

                {isAuthenticated ? (
                    <form onSubmit={handleCommentSubmit} style={styles.commentForm}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share your thoughts..."
                            rows={3}
                            style={styles.textarea}
                            required
                        />
                        <button type="submit" style={styles.submitButton}>
                            <LuSend size={16} /> Post Comment
                        </button>
                    </form>
                ) : (
                    <div style={styles.signInPrompt}>
                        <p>
                            <a href="/auth" style={styles.signInLink}>Sign in</a> to join the discussion
                        </p>
                    </div>
                )}

                {topLevelComments.length === 0 ? (
                    <p style={{ textAlign: 'center', color: GRAY_TEXT, padding: '2rem' }}>
                        No comments yet. Be the first to share your thoughts!
                    </p>
                ) : (
                    topLevelComments.map(comment => (
                        <CommentComponent 
                            key={comment.id} 
                            comment={comment}
                            onReply={handleReplyClick}
                            replyingTo={replyingTo}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            handleReplySubmit={handleReplySubmit}
                            cancelReply={cancelReply}
                            getReplies={getReplies}
                            isAuthenticated={isAuthenticated}
                        />
                    ))
                )}
            </div>
        </div>
    );
}