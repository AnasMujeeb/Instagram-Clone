import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StoryModal from '../components/StoryModal';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'JUST NOW';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} MINUTE${minutes > 1 ? 'S' : ''} AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} HOUR${hours > 1 ? 'S' : ''} AGO`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} DAY${days > 1 ? 'S' : ''} AGO`;
  const weeks = Math.floor(days / 7);
  return `${weeks} WEEK${weeks > 1 ? 'S' : ''} AGO`;
}

const HeartIcon = ({ filled }) => filled ? (
  <svg aria-label="Unlike" fill="#ff3040" height="24" width="24" viewBox="0 0 48 48">
    <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5Z"/>
  </svg>
) : (
  <svg aria-label="Like" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
    <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z"/>
  </svg>
);

const CommentIcon = () => (
  <svg aria-label="Comment" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
    <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"/>
  </svg>
);

const ShareIcon = () => (
  <svg aria-label="Share Post" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
    <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"/>
    <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"/>
  </svg>
);

const BookmarkIcon = ({ filled }) => filled ? (
  <svg aria-label="Remove" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
    <path d="M20 22a.999.999 0 0 1-.687-.273L12 14.815l-7.313 6.912A1 1 0 0 1 3 21V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1Z"/>
  </svg>
) : (
  <svg aria-label="Save" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
    <polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
  </svg>
);

const MoreIcon = () => (
  <svg aria-label="More options" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>
  </svg>
);

const EmojiIcon = () => (
  <svg aria-label="Emoji" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
    <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"/>
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stories, setStories] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [uploadingStory, setUploadingStory] = useState(false);
  const storiesRef = useRef(null);
  const storyInputRef = useRef(null);
  
  const handleStoryFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStory(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchStories();
    } catch (err) {
      console.error('Failed to upload story:', err);
    } finally {
      setUploadingStory(false);
      if (storyInputRef.current) storyInputRef.current.value = '';
    }
  };

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [expandedCaptions, setExpandedCaptions] = useState(new Set());
  const [showCreatePost, setShowCreatePost] = useState(false);

  const [editPostId, setEditPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [menuOpenPostId, setMenuOpenPostId] = useState(null);

  const fetchStories = useCallback(async () => {
    try {
      const res = await api.get('/stories');
      setStories(res.data);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  }, []);

  const fetchSavedPosts = useCallback(async () => {
    try {
      const res = await api.get('/users/saved');
      const ids = new Set(res.data.map((post) => post._id));
      setSavedPosts(ids);
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
    }
  }, []);

  const fetchPage = useCallback(async (p = 1, append = false) => {
    try {
      if (p === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/posts/timeline?page=${p}&limit=${limit}`);
      const data = res.data || [];

      if (append) {
        setPosts((prev) => [...prev, ...data]);
      } else {
        setPosts(data);
      }

      setHasMore(data.length === limit);
    } catch (err) {
      console.error('Failed to fetch posts page:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!user?.token) return;
    setPage(1);
    fetchPage(1, false);
    fetchSavedPosts();
    fetchStories();
  }, [user?.token, fetchPage, fetchSavedPosts, fetchStories]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (!hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !loadingMore && !loading) {
          setPage((prev) => prev + 1);
        }
      });
    }, { root: null, rootMargin: '300px', threshold: 0.1 });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading]);

  useEffect(() => {
    if (page === 1) return;
    fetchPage(page, true);
  }, [page, fetchPage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    try {
      const formData = new FormData();
      formData.append('content', content);
      if (image) formData.append('image', image);

      const response = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPosts((prev) => [response.data, ...prev]);
      setContent(''); setImage(null); setImagePreview(null); setError(''); setShowCreatePost(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    }
  };

  const handleLike = async (postId) => {
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    const alreadyLiked = post.likes && post.likes.includes(user._id);
    const updatedLikes = alreadyLiked ? post.likes.filter(id => id !== user._id) : [...(post.likes || []), user._id];
    setPosts(posts.map(p => p._id === postId ? { ...p, likes: updatedLikes } : p));
    try { await api.put(`/posts/${postId}/like`, {}); } catch (err) { setPosts(posts.map(p => p._id === postId ? post : p)); console.error(err); }
  };

  const handleCommentChange = (postId, value) => setCommentInputs({ ...commentInputs, [postId]: value });

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;
    try {
      const response = await api.post(`/posts/${postId}/comment`, { text: commentText });
      setPosts(posts.map(p => p._id === postId ? { ...p, comments: response.data } : p));
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await api.delete(`/posts/${postId}/comment/${commentId}`);
      setPosts(posts.map(p => p._id === postId ? { ...p, comments: res.data } : p));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const toggleSave = async (postId) => {
    const wasSaved = savedPosts.has(postId);
    setSavedPosts(prev => { const next = new Set(prev); wasSaved ? next.delete(postId) : next.add(postId); return next; });
    try {
      const res = await api.post(`/users/save/${postId}`, {});
      setSavedPosts(prev => { const next = new Set(prev); res.data.saved ? next.add(postId) : next.delete(postId); return next; });
    } catch (err) { console.error('Save error:', err); }
  };

  const openEdit = (post) => { setMenuOpenPostId(null); setEditPostId(post._id); setEditContent(post.content || ''); };
  const saveEdit = async (postId) => { try { const res = await api.put(`/posts/${postId}`, { content: editContent }); setPosts(posts.map(p => p._id === postId ? res.data : p)); setEditPostId(null); setEditContent(''); } catch (err) { console.error('Failed to save post edit:', err); } };
  const cancelEdit = () => { setEditPostId(null); setEditContent(''); };
  const handleDelete = async (postId) => { const ok = window.confirm('Delete this post? This action cannot be undone.'); if (!ok) return; try { await api.delete(`/posts/${postId}`); setPosts(posts.filter(p => p._id !== postId)); } catch (err) { console.error('Failed to delete post:', err); } };
  const toggleCaption = (postId) => setExpandedCaptions(prev => { const next = new Set(prev); next.has(postId) ? next.delete(postId) : next.add(postId); return next; });

  if (!user) return null;

  const userStoryIndex = stories.findIndex((group) => (group.user?._id || group.user)?.toString() === user._id?.toString());
  const userStoryExists = userStoryIndex !== -1;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center">
      <div className="w-full max-w-[470px] px-0 md:px-0 py-0 flex flex-col">

        <input type="file" accept="image/*,video/*" ref={storyInputRef} onChange={handleStoryFileChange} className="hidden" />

        <div className="w-full border-b border-zinc-800 bg-black py-4 mb-1">
          <div ref={storiesRef} className="flex gap-4 overflow-x-auto scrollbar-hide px-4">
            <div onClick={() => { if (userStoryExists) setActiveStoryIndex(userStoryIndex); else storyInputRef.current.click(); }} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
              <div className="relative w-[66px] h-[66px]">
                <div className={`w-full h-full rounded-full p-[3px] ${userStoryExists ? 'bg-gradient-to-tr from-amber-400 via-red-500 to-purple-600' : 'bg-zinc-800'}`}>
                  <div className="w-full h-full rounded-full bg-black p-[2px]">
                    <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-white overflow-hidden">
                      {user.profilePic ? (
                        <img src={user.profilePic} alt={user.username || ''} className="w-full h-full object-cover" />
                      ) : (
                        user.username ? user.username[0].toUpperCase() : 'Y'
                      )}
                    </div>
                  </div>
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); storyInputRef.current.click(); }} 
                  className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center hover:scale-110 transition z-10 shadow-md"
                  title="Add to story"
                >
                  {uploadingStory ? (
                    <span className="text-[10px] font-bold leading-none text-white animate-pulse">...</span>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-white">
                      <line x1="6" y1="2" x2="6" y2="10" />
                      <line x1="2" y1="6" x2="10" y2="6" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 w-[66px] text-center truncate group-hover:text-zinc-300 transition">Your story</span>
            </div>

            {stories.map((storyGroup, index) => {
              const groupUserId = (storyGroup.user?._id || storyGroup.user)?.toString();
              if (groupUserId === user._id?.toString()) return null;
              return (
                <div key={groupUserId || index} onClick={() => setActiveStoryIndex(index)} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                  <div className="w-[66px] h-[66px] rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-red-500 to-purple-600">
                    <div className="w-full h-full rounded-full bg-black p-[2px]">
                      <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-white overflow-hidden">
                        {storyGroup.user?.profilePic ? (
                          <img src={storyGroup.user.profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          storyGroup.user?.username ? storyGroup.user.username[0].toUpperCase() : 'U'
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-400 w-[66px] text-center truncate group-hover:text-zinc-300 transition">{storyGroup.user?.username || 'user'}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col">
          {loading && posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20"><div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin"/></div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20"><div className="w-16 h-16 border-2 border-zinc-700 rounded-full flex items-center justify-center mb-4"/><p className="text-sm text-zinc-500">No posts yet. Share your first photo!</p></div>
          ) : (
            posts.map((post) => {
              const isLiked = user && post.likes && post.likes.includes(user._id);
              const isSaved = savedPosts.has(post._id);
              const isExpanded = expandedCaptions.has(post._id);
              const captionIsLong = post.content && post.content.length > 100;
              const ownerId = (post.user?._id || post.user);
              const isOwner = ownerId?.toString() === user?._id?.toString();

              return (
                <article key={post._id} className="border-b border-zinc-800 pb-1 mb-3">
                  <div className="flex items-center justify-between px-1 py-3">
                    <div className="flex items-center gap-3" onClick={() => navigate(`/profile/${post.user?.username || ''}`)}>
                      <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-tr from-amber-400 via-red-500 to-purple-600 p-[2px]"><div className="w-full h-full rounded-full bg-black p-[1px]"><div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center text-[11px] font-bold text-white">{post.user?.profilePic ? <img src={post.user.profilePic} alt="" className="w-full h-full rounded-full object-cover" /> : (post.user?.username ? post.user.username[0].toUpperCase() : 'U')}</div></div></div>
                      <div className="flex items-center gap-1.5"><span className="font-semibold text-[13px] text-white hover:opacity-70 cursor-pointer transition">{post.user?.username || 'user'}</span><span className="text-zinc-500 text-[13px]">•</span><span className="text-zinc-500 text-[13px]">{timeAgo(post.createdAt)}</span></div>
                    </div>
                    <div className="relative">
                      <button onClick={() => setMenuOpenPostId(menuOpenPostId === post._id ? null : post._id)} className="text-white hover:opacity-60 transition cursor-pointer p-1"><MoreIcon /></button>
                      {menuOpenPostId === post._id && isOwner && (
                        <div className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded shadow z-20"><button onClick={() => openEdit(post)} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-xs">Edit caption</button><button onClick={() => handleDelete(post._id)} className="w-full text-left px-3 py-2 text-red-400 hover:bg-zinc-800 text-xs">Delete post</button></div>
                      )}
                    </div>
                  </div>

                  {post.image && (
                    <div className="w-full bg-black rounded-[4px] overflow-hidden border border-zinc-900"><img src={post.image} alt="Post" className="w-full object-cover cursor-pointer" style={{ maxHeight: '585px' }} onClick={() => navigate(`/p/${post._id}`)} onDoubleClick={() => handleLike(post._id)} /></div>
                  )}

                  <div className="flex items-center justify-between pt-3 pb-1 px-1">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(post._id)} className={`hover:opacity-60 transition cursor-pointer ${isLiked ? 'animate-[like-heart_0.3s_ease]' : ''}`}><HeartIcon filled={isLiked} /></button>
                      <button onClick={() => navigate(`/p/${post._id}`)} className="text-white hover:opacity-60 transition cursor-pointer"><CommentIcon /></button>
                      <button className="text-white hover:opacity-60 transition cursor-pointer"><ShareIcon /></button>
                    </div>
                    <button onClick={() => toggleSave(post._id)} className="text-white hover:opacity-60 transition cursor-pointer"><BookmarkIcon filled={isSaved} /></button>
                  </div>

                  <div className="px-1 pt-1"><button className="text-sm font-semibold text-white hover:opacity-70 transition cursor-pointer">{post.likes ? post.likes.length : 0} likes</button></div>

                  {editPostId === post._id ? (
                    <div className="px-1 pt-1"><textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none resize-none border border-zinc-800 rounded p-2" /><div className="flex items-center gap-3 mt-2"><button onClick={() => saveEdit(post._id)} className="text-sm font-semibold text-blue-500 hover:text-blue-400">Save</button><button onClick={cancelEdit} className="text-sm text-zinc-400 hover:text-zinc-300">Cancel</button></div></div>
                  ) : (
                    post.content && (
                      <div className="px-1 pt-1"><p className="text-sm text-white"><span onClick={() => navigate(`/profile/${post.user?.username || ''}`)} className="font-semibold mr-1.5 hover:opacity-70 cursor-pointer transition">{post.user?.username || 'user'}</span>{captionIsLong && !isExpanded ? (<><>{post.content.slice(0, 100)}</><button onClick={() => toggleCaption(post._id)} className="text-zinc-500 ml-1 cursor-pointer">... more</button></>) : (<span className="text-zinc-300">{post.content}</span>)}</p></div>
                    )
                  )}

                  {post.comments && post.comments.length > 2 && (
                    <button onClick={() => navigate(`/p/${post._id}`)} className="px-1 pt-1 text-sm text-zinc-500 hover:text-zinc-400 transition cursor-pointer block">
                      View all {post.comments.length} comments
                    </button>
                  )}

                  {post.comments && post.comments.slice(-2).map((comment) => {
                    const commentUserId = (comment.user?._id || comment.user);
                    const canDeleteComment = isOwner || commentUserId?.toString() === user?._id?.toString();
                    return (
                      <div key={comment._id || comment.createdAt} className="px-1 pt-0.5 flex items-center justify-between group/comment">
                        <p className="text-sm">
                          <span onClick={() => navigate(`/profile/${comment.user?.username || ''}`)} className="font-semibold text-white mr-1.5 hover:opacity-70 cursor-pointer transition">
                            {comment.user?.username || 'user'}
                          </span>
                          <span className="text-zinc-300">{comment.text}</span>
                        </p>
                        {canDeleteComment && (
                          <button onClick={() => handleDeleteComment(post._id, comment._id)} className="text-xs text-red-500 opacity-0 group-hover/comment:opacity-100 hover:text-red-400 font-bold px-1 transition">
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <div className="px-1 pt-2 pb-1"><span className="text-[10px] text-zinc-600 uppercase tracking-wide">{post.createdAt ? timeAgo(post.createdAt) : ''}</span></div>

                  <form onSubmit={(e) => handleAddComment(e, post._id)} className="flex items-center gap-3 px-1 py-3 border-t border-zinc-800 mt-1"><button type="button" className="text-white hover:opacity-60 transition cursor-pointer flex-shrink-0"><EmojiIcon /></button><input type="text" placeholder="Add a comment..." value={commentInputs[post._id] || ''} onChange={(e) => handleCommentChange(post._id, e.target.value)} className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none" />{commentInputs[post._id]?.trim() && (<button type="submit" className="text-sm font-semibold text-blue-500 hover:text-blue-300 transition cursor-pointer">Post</button>)}</form>
                </article>
              );
            })
          )}

          <div ref={sentinelRef} className="h-6" />

          {loadingMore && (
            <div className="py-4 flex items-center justify-center"><div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin"/></div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="py-6 text-center text-zinc-500 text-sm">You have reached the end of the feed.</div>
          )}

        </div>
      </div>

      {activeStoryIndex !== null && (
        <StoryModal
          stories={stories}
          initialIndex={activeStoryIndex}
          currentUser={user}
          onClose={() => setActiveStoryIndex(null)}
          onDelete={async () => {
            try {
              await fetchStories();
            } catch (err) {
              console.error('Failed to refresh stories after delete:', err);
            }
            setActiveStoryIndex(null);
          }}
        />
      )}
    </div>
  );
}
