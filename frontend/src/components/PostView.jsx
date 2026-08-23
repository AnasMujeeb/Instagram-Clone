import React, { useState } from 'react';

export default function PostView({
  post,
  user,
  isLiked,
  isSaved,
  isExpanded,
  onLike,
  onToggleSave,
  onToggleCaption,
  commentInputs,
  onCommentChange,
  onAddComment,
  onDeleteComment,
  onUpdateComment,
  ownerMenu,
  editMode,
  editContent,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}) {
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const timeAgo = (dateStr) => {
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
  };

  const isPostOwner = (post.user?._id || post.user)?.toString() === user?._id?.toString();

  return (
    <article className="border-b border-zinc-800 pb-1 mb-3">
      <div className="flex items-center justify-between px-1 py-3">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-full p-[2px]">
            <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-white">
              {post.user?.profilePic ? (
                <img src={post.user.profilePic} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                post.user?.username ? post.user.username[0].toUpperCase() : 'U'
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[13px] text-white">{post.user?.username || 'user'}</span>
            <span className="text-zinc-500 text-[13px]">•</span>
            <span className="text-zinc-500 text-[13px]">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
        {ownerMenu}
      </div>

      {post.image && (
        <div className="w-full bg-black rounded-[4px] overflow-hidden border border-zinc-900">
          <img src={post.image} alt="Post" className="w-full object-cover" style={{ maxHeight: '585px' }} />
        </div>
      )}

      <div className="flex items-center justify-between pt-3 pb-1 px-1">
        <div className="flex items-center gap-4">
          <button onClick={() => onLike(post._id)} className={`hover:opacity-60 transition cursor-pointer ${isLiked ? 'animate-[like-heart_0.3s_ease]' : ''}`}>
            <svg aria-label="Like" fill={isLiked ? '#ff3040' : 'currentColor'} height="24" width="24" viewBox="0 0 24 24">
              <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938"/>
            </svg>
          </button>
          <button className="text-white hover:opacity-60 transition cursor-pointer">
            <svg aria-label="Comment" fill="currentColor" height="24" width="24" viewBox="0 0 24 24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"/></svg>
          </button>
          <button className="text-white hover:opacity-60 transition cursor-pointer">
            <svg aria-label="Share" fill="currentColor" height="24" width="24" viewBox="0 0 24 24"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"/><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"/></svg>
          </button>
        </div>
        <button onClick={() => onToggleSave(post._id)} className="text-white hover:opacity-60 transition cursor-pointer">
          {isSaved ? (
            <svg fill="currentColor" height="24" width="24" viewBox="0 0 24 24"><path d="M20 22a.999.999 0 0 1-.687-.273L12 14.815l-7.313 6.912A1 1 0 0 1 3 21V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1Z"/></svg>
          ) : (
            <svg fill="currentColor" height="24" width="24" viewBox="0 0 24 24"><polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
          )}
        </button>
      </div>

      <div className="px-1 pt-1">
        <button className="text-sm font-semibold text-white hover:opacity-70 transition cursor-pointer">{post.likes ? post.likes.length : 0} likes</button>
      </div>

      {editMode ? (
        <div className="px-1 pt-1">
          <textarea value={editContent} onChange={(e) => onEditChange(e.target.value)} rows={3} className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none resize-none border border-zinc-800 rounded p-2" />
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => onSaveEdit(post._id)} className="text-sm font-semibold text-blue-500 hover:text-blue-400">Save</button>
            <button onClick={onCancelEdit} className="text-sm text-zinc-400 hover:text-zinc-300">Cancel</button>
          </div>
        </div>
      ) : (
        post.content && (
          <div className="px-1 pt-1">
            <p className="text-sm text-white"><span className="font-semibold mr-1.5">{post.user?.username || 'user'}</span><span className="text-zinc-300">{isExpanded ? post.content : (post.content.length > 100 ? post.content.slice(0,100) + '...' : post.content)}</span>{post.content.length > 100 && !isExpanded && <button onClick={() => onToggleCaption(post._id)} className="text-zinc-500 ml-1 cursor-pointer">... more</button>}</p>
          </div>
        )
      )}

      <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto px-1">
        {post.comments && post.comments.map((comment) => {
          const commentUserId = (comment.user?._id || comment.user);
          const isCommentAuthor = commentUserId?.toString() === user?._id?.toString();
          const canDeleteComment = isPostOwner || isCommentAuthor;
          const isEditing = editingCommentId === comment._id;

          return (
            <div key={comment._id || comment.createdAt} className="flex items-center justify-between group/comment text-sm py-0.5">
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingCommentText}
                    onChange={(e) => setEditingCommentText(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-white outline-none"
                  />
                  <button
                    onClick={async () => {
                      if (!editingCommentText.trim()) return;
                      if (onUpdateComment) await onUpdateComment(post._id, comment._id, editingCommentText);
                      setEditingCommentId(null);
                    }}
                    className="text-xs text-blue-400 font-semibold hover:text-blue-300"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingCommentId(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                    Cancel
                  </button>
                </div>
              ) : (
                <p className="flex-1 min-w-0">
                  <span className="font-semibold text-white mr-1.5">{comment.user?.username || 'user'}</span>
                  <span className="text-zinc-300">{comment.text}</span>
                </p>
              )}

              {!isEditing && (
                <div className="flex items-center gap-1.5 opacity-0 group-hover/comment:opacity-100 transition">
                  {isCommentAuthor && onUpdateComment && (
                    <button
                      onClick={() => {
                        setEditingCommentId(comment._id);
                        setEditingCommentText(comment.text);
                      }}
                      className="text-xs text-zinc-400 hover:text-white font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                  {canDeleteComment && onDeleteComment && (
                    <button onClick={() => onDeleteComment(post._id, comment._id)} className="text-xs text-red-500 hover:text-red-400 font-bold px-1 transition cursor-pointer">
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-1 pt-3 pb-1"><span className="text-[10px] text-zinc-600 uppercase tracking-wide">{post.createdAt ? timeAgo(post.createdAt) : ''}</span></div>

      <form onSubmit={(e) => { e.preventDefault(); onAddComment(e, post._id); }} className="flex items-center gap-3 px-1 py-3 border-t border-zinc-800 mt-1">
        <button type="button" className="text-white hover:opacity-60 transition cursor-pointer flex-shrink-0">🙂</button>
        <input type="text" placeholder="Add a comment..." value={commentInputs[post._id] || ''} onChange={(e) => onCommentChange(post._id, e.target.value)} className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none" />
        {commentInputs[post._id]?.trim() && <button type="submit" className="text-sm font-semibold text-blue-500 hover:text-blue-300">Post</button>}
      </form>
    </article>
  );
}
