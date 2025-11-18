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
    
    # DEBUG: Check what we're getting back
    print(f"DEBUG get_posts_route - Response status: {response['status']}")
    if response['status'] == 'success':
        print(f"DEBUG get_posts_route - Number of posts: {len(response['data'])}")
        if len(response['data']) > 0:
            print(f"DEBUG get_posts_route - First post sample: {response['data'][0]}")
    
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
    print(f"DEBUG: Fetching comments for post {post_id}")  # DEBUG
    response = get_post_comments(post_id)
    
    print(f"DEBUG: Response status: {response['status']}")  # DEBUG
    print(f"DEBUG: Response data: {response.get('data', 'No data')}")  # DEBUG
    
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
    print(f"DEBUG: Received data: {data}")  # DEBUG
    
    content = data.get('content')
    parent_comment_id = data.get('parent_comment_id')
    
    print(f"DEBUG: content = {content}")  # DEBUG
    print(f"DEBUG: parent_comment_id = {parent_comment_id}")  # DEBUG
    print(f"DEBUG: parent_comment_id type = {type(parent_comment_id)}")  # DEBUG
    
    if not content:
        return jsonify({"error": "Missing content for the comment."}), 400
    
    user_id = request.user_id
    
    # FIX: Only pass parent_comment_id if it actually exists and is not None/empty
    if parent_comment_id and parent_comment_id != "null":
        print(f"DEBUG: Creating reply to comment {parent_comment_id}")
        response = create_forum_comment(user_id, post_id, content, parent_comment_id)
    else:
        print(f"DEBUG: Creating top-level comment")
        response = create_forum_comment(user_id, post_id, content)
    
    if response['status'] == 'success':
        return jsonify({"status": "success", "message": "Comment posted successfully.", "data": response['data']}), 201
    
    return jsonify({"error": response['message']}), 500