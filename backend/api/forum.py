from flask import Blueprint, request, jsonify
# NOTE: Assuming the token_required decorator is available in api.collections
from api.collections import token_required
# Import the function from the AI Service Layer
from db_service import create_forum_comment, create_forum_post, get_post_comments, get_recent_forum_posts

forum_bp = Blueprint('forum', __name__)

@forum_bp.route('/forum/posts', methods=['GET'])
def get_posts_route():
    """
    Public endpoint to retrieve the list of recent forum posts.
    """
    response = get_recent_forum_posts()

    if response['status'] == 'success':
        return jsonify(response['data']), 200
    
    if response['status'] == 'empty':
        return jsonify([]), 200
    
    return jsonify({"error": response['message']}), 500

@forum_bp.route('/forum/posts', methods=['POST'])
@token_required
def create_post_route():
    """
    Protected endpoint to create a new forum post.
    """
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    
    if not title or not content:
        return jsonify({"error": "Missing title or content for the post."}), 400

    user_id = request.user_id # Guaranteed by @token_required
    
    # Delegate to the Service Layer
    response = create_forum_post(user_id, title, content)
    
    if response['status'] == 'success':
        return jsonify({"status": "success", "message": "Post created successfully."}), 201
    
    return jsonify({"error": response['message']}), 500

@forum_bp.route('/forum/posts/<post_id>/comments', methods=['GET'])
def get_comments_route(post_id):
    """
    Public endpoint to retrieve all comments for a specific post.
    """
    response = get_post_comments(post_id)

    if response['status'] == 'success':
        return jsonify(response['data']), 200
    
    if response['status'] == 'empty':
        return jsonify([]), 200
    
    return jsonify({"error": response['message']}), 500


@forum_bp.route('/forum/posts/<post_id>/comments', methods=['POST'])
@token_required
def create_comment_route(post_id):
    """
    Protected endpoint to create a new comment or reply on a post.
    """
    data = request.get_json()

    content = data.get('content')
    parent_comment_id = data.get('parent_comment_id')

    if not content:
        return jsonify({"error": "Missing content for the comment."}), 400
    
    user_id = request.user_id

    # FIX: Only pass parent_comment_id if it actually exists and is not None/empty
    if parent_comment_id and parent_comment_id != "null":
        response = create_forum_comment(user_id, post_id, content, parent_comment_id)
    else:
        response = create_forum_comment(user_id, post_id, content)
    
    if response['status'] == 'success':
        return jsonify({"status": "success", "message": "Comment posted successfully.", "data": response['data']}), 201
    
    return jsonify({"error": response['message']}), 500