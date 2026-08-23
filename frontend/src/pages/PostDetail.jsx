import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostView from '../components/PostView';

export default function PostDetail() {
  const { postId } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [expanded, setExpanded] = useState(new Set());
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const res = await api.get('/posts');
      const found = res.data.find((p) => p._id === postId);
      if (found) {
        setPost(found);
        try {
          const savedRes = await api.get('/users/saved');
          setIsSaved(savedRes.data.some((p) => p._id === postId));
        } catch (e) {
        }
      }
    } catch (err) {
      console.error('Failed to fetch post:', err);
    }
  };

  const handleLike = async (id) => {
    if (!post) return;
    try {
      await api.put(`/posts/${id}/like`, {});
      fetchPost();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSave = async (id) => {
    try {
      const res = await api.post(`/users/save/${id}`, {});
      setIsSaved(res.data.saved);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCaption = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs({ ...commentInputs, [postId]: value });
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;
    try {
      const response = await api.post(`/posts/${postId}/comment`, { text: commentText });
      setPost((p) => ({ ...p, comments: response.data }));
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this post? This action cannot be undone.');
    if (!ok) return;
    try {
      await api.delete(`/posts/${id}`);
      setPost(null);
    } catch (err) {
      console.error(err);
    }
  };

  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');

  const openEdit = () => {
    if (!post) return;
    setEditContent(post.content || '');
    setEditMode(true);
  };

  const saveEdit = async (id) => {
    try {
      const res = await api.put(`/posts/${id}`, { content: editContent });
      setPost(res.data);
      setEditMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await api.delete(`/posts/${postId}/comment/${commentId}`);
      setPost((p) => ({ ...p, comments: res.data }));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleUpdateComment = async (postId, commentId, text) => {
    try {
      const res = await api.put(`/posts/${postId}/comment/${commentId}`, { text });
      setPost((p) => ({ ...p, comments: res.data }));
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  if (!post) return <div className="min-h-screen flex items-center justify-center text-white">Post not found or loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center py-8">
      <div className="w-full max-w-[760px] px-4">
        <PostView
          post={post}
          user={user}
          isLiked={post.likes?.includes(user?._id)}
          isSaved={isSaved}
          isExpanded={expanded.has(post._id)}
          onLike={handleLike}
          onToggleSave={toggleSave}
          onToggleCaption={toggleCaption}
          commentInputs={commentInputs}
          onCommentChange={handleCommentChange}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          onUpdateComment={handleUpdateComment}
          ownerMenu={(
            <div className="flex gap-2">
              {post.user && post.user._id?.toString() === user?._id?.toString() && (
                <>
                  <button onClick={openEdit} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded">Edit</button>
                  <button onClick={() => handleDelete(post._id)} className="px-3 py-1 bg-red-900 text-red-300 border border-red-800 rounded">Delete</button>
                </>
              )}
            </div>
          )}
          editMode={editMode}
          editContent={editContent}
          onEditChange={setEditContent}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditMode(false)}
        />
      </div>
    </div>
  );
}
