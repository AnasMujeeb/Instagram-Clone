import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

const HeartIcon = ({ filled }) => filled ? (
  <svg fill="#ff3040" height="28" width="28" viewBox="0 0 48 48">
    <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5Z"/>
  </svg>
) : (
  <svg fill="white" height="28" width="28" viewBox="0 0 48 48">
    <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5Z"/>
  </svg>
);

const CommentIcon = () => (
  <svg fill="white" height="28" width="28" viewBox="0 0 24 24">
    <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="white" strokeLinejoin="round" strokeWidth="2"/>
  </svg>
);

const ShareIcon = () => (
  <svg fill="white" height="28" width="28" viewBox="0 0 24 24">
    <line fill="none" stroke="white" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"/>
    <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="white" strokeLinejoin="round" strokeWidth="2"/>
  </svg>
);

const MusicIcon = () => (
  <svg fill="white" height="16" width="16" viewBox="0 0 24 24">
    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z"/>
  </svg>
);

const PlayIcon = () => (
  <svg fill="white" height="64" width="64" viewBox="0 0 24 24" opacity="0.8">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const MuteIcon = ({ muted }) => muted ? (
  <svg fill="white" height="16" width="16" viewBox="0 0 24 24">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
  </svg>
) : (
  <svg fill="white" height="16" width="16" viewBox="0 0 24 24">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);

const BookmarkIcon = ({ filled }) => filled ? (
  <svg aria-label="Remove" color="white" fill="white" height="28" width="28" viewBox="0 0 24 24">
    <path d="M20 22a.999.999 0 0 1-.687-.273L12 14.815l-7.313 6.912A1 1 0 0 1 3 21V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1Z"></path>
  </svg>
) : (
  <svg aria-label="Save" color="white" fill="transparent" height="28" width="28" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
    <polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></polygon>
  </svg>
);

const TrashIcon = () => (
  <svg fill="none" stroke="#ef4444" height="24" width="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

function ReelCard({ reel, isActive, initialSaved, onSaveChange, onDeleteReel }) {
  const videoRef = useRef(null);
  const { user } = useAuth();
  const currentUserId = user?._id;

  const isOwner = reel.user?._id === currentUserId || reel.user === currentUserId;

  const initialLikesCount = Array.isArray(reel.likes) ? reel.likes.length : (reel.likes || 0);
  const initialLikedState = Array.isArray(reel.likes) ? reel.likes.includes(currentUserId) : false;

  const [liked, setLiked] = useState(initialLikedState);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(reel.comments || []);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }, [isActive]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const handleDoubleClick = () => {
    if (!liked) {
      toggleLike();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const toggleLike = async () => {
    const prevLiked = liked;
    setLiked(!prevLiked);
    setLikesCount(prev => prevLiked ? prev - 1 : prev + 1);

    try {
      await api.put(`/reels/like/${reel._id}`, {});
    } catch (error) {
      console.log("Error liking reel:", error);
      setLiked(prevLiked);
      setLikesCount(prev => prevLiked ? prev + 1 : prev - 1);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setMuted(prev => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !muted;
    }
  };

  const handleSaveReel = async () => {
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    try {
      const res = await api.post(`/reels/save/${reel._id}`, {});
      onSaveChange?.(reel._id, res.data.saved);
    } catch (error) {
      console.log('Error saving reel', error);
      setIsSaved(wasSaved);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return;
    setIsDeleting(true);
    try {
      await api.delete(`/reels/${reel._id}`);
      onDeleteReel?.(reel._id);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete reel');
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await api.post(`/reels/${reel._id}/comment`, { text: commentText.trim() });
      setComments(res.data);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/reels/${reel._id}/comment/${commentId}`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleUpdateComment = async (commentId, text) => {
    try {
      const res = await api.put(`/reels/${reel._id}/comment/${commentId}`, { text });
      setComments(res.data);
      setEditingCommentId(null);
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  return (
    <div className="reel-card relative">
      <video
        ref={videoRef}
        src={reel.videoUrl || reel.video}
        className="reel-video"
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        onDoubleClick={handleDoubleClick}
      />

      {paused && (
        <div className="reel-pause-overlay" onClick={togglePlay}>
          <PlayIcon />
        </div>
      )}

      {showHeart && (
        <div className="reel-heart-animation">
          <svg fill="white" height="100" width="100" viewBox="0 0 48 48">
            <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5Z"/>
          </svg>
        </div>
      )}

      <div className="reel-actions">
        <button className="reel-action-btn" onClick={toggleLike}>
          <HeartIcon filled={liked} />
          <span className="reel-action-count">{formatCount(likesCount)}</span>
        </button>
        
        <button className="reel-action-btn" onClick={() => setShowComments(!showComments)}>
          <CommentIcon />
          <span className="reel-action-count">{formatCount(comments.length)}</span>
        </button>
        
        <button className="reel-action-btn" onClick={handleSaveReel}>
          <BookmarkIcon filled={isSaved} />
        </button>

        {isOwner && (
          <button className="reel-action-btn" onClick={handleDelete} disabled={isDeleting} title="Delete Reel">
            <TrashIcon />
          </button>
        )}

        <div className="reel-music-disc">
          <div className="reel-disc-inner" />
        </div>
      </div>

      <div className="reel-bottom-overlay">
        <div className="reel-user-row">
          <div className="reel-user-avatar">
            {reel.user?.profilePic ? (
              <img src={reel.user.profilePic} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              reel.user?.username ? reel.user.username[0].toUpperCase() : 'U'
            )}
          </div>
          <span className="reel-username">{reel.user?.username || reel.username || 'user'}</span>
          {!isOwner && <button className="reel-follow-btn">Follow</button>}
        </div>
        <p className="reel-caption">{reel.caption}</p>
        <div className="reel-song-row">
          <MusicIcon />
          <span className="reel-song-name">{reel.song || 'Original Audio'}</span>
        </div>
      </div>

      <button className="reel-mute-btn" onClick={toggleMute}>
        <MuteIcon muted={muted} />
      </button>

      {showComments && (
        <div className="absolute inset-x-0 bottom-0 max-h-[60%] bg-zinc-950/95 backdrop-blur-md rounded-t-2xl border-t border-zinc-800 z-50 flex flex-col p-4 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-sm font-bold">Comments ({comments.length})</span>
            <button onClick={() => setShowComments(false)} className="text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer">✕ Close</button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {comments.length > 0 ? (
              comments.map((c) => {
                const commentUser = c.user;
                const isAuthor = (commentUser?._id || commentUser) === currentUserId;
                const canDelete = isOwner || isAuthor;
                const isEditing = editingCommentId === c._id;

                return (
                  <div key={c._id} className="flex items-center justify-between gap-2 text-xs py-0.5">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-white outline-none"
                        />
                        <button
                          onClick={() => handleUpdateComment(c._id, editingCommentText)}
                          className="text-xs text-blue-400 font-semibold hover:text-blue-300"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingCommentId(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="font-bold text-zinc-200">{commentUser?.username || 'user'}:</span>
                        <span className="text-zinc-300">{c.text}</span>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-1.5">
                        {isAuthor && (
                          <button
                            onClick={() => {
                              setEditingCommentId(c._id);
                              setEditingCommentText(c.text);
                            }}
                            className="text-zinc-400 hover:text-white font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDeleteComment(c._id)} className="text-red-500 hover:text-red-400 font-bold ml-1">
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-500 text-center py-4">No comments yet. Be the first!</p>
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-zinc-800">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            />
            <button type="submit" disabled={commentSubmitting || !commentText.trim()} className="text-xs font-bold text-blue-500 hover:text-blue-400 disabled:opacity-40">
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Reels() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [savedReelIds, setSavedReelIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!user?.token) return;

    const fetchReels = async () => {
      try {
        const [reelsRes, savedRes] = await Promise.all([
          api.get('/reels'),
          api.get('/reels/saved-ids'),
        ]);

        setReels(reelsRes.data);
        setSavedReelIds(new Set(savedRes.data));
        setLoading(false);
      } catch (error) {
        console.log('Error fetching reels:', error);
        setLoading(false);
      }
    };

    fetchReels();
  }, [user?.token]);

  const handleSaveChange = (reelId, saved) => {
    setSavedReelIds((prev) => {
      const next = new Set(prev);
      if (saved) {
        next.add(reelId);
      } else {
        next.delete(reelId);
      }
      return next;
    });
  };

  const handleDeleteReel = (reelId) => {
    setReels((prev) => prev.filter((r) => r._id !== reelId));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            setActiveIndex(index);
          }
        });
      },
      { root: container, threshold: 0.7 }
    );

    const cards = container.querySelectorAll('.reel-card');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [reels]);

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50vh' }}>Loading reels...</div>;
  }

  if (reels.length === 0) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50vh' }}>No reels found!</div>;
  }

  return (
    <div className="reels-container" ref={containerRef}>
      {reels.map((reel, index) => (
        <div key={reel._id || index} data-index={index}>
          <ReelCard
            reel={reel}
            isActive={index === activeIndex}
            initialSaved={savedReelIds.has(reel._id)}
            onSaveChange={handleSaveChange}
            onDeleteReel={handleDeleteReel}
          />
        </div>
      ))}
    </div>
  );
}