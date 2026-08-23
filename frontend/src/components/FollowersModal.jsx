import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FollowersModal({ open, onClose, title, userId, userIds = [], initialUsers = [], onToggle }) {
  const { user: loggedInUser } = useAuth();
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState({});

  React.useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      if (!open) return;
      if (initialUsers && initialUsers.length > 0) {
        setUsers(initialUsers);
        return;
      }
      
      const targetUserId = userId || (userIds && userIds.length > 0 ? (typeof userIds[0] === 'string' ? userIds[0] : userIds[0]._id) : null);
      if (!targetUserId) {
        setUsers([]);
        return;
      }

      const isFollowers = title?.toLowerCase().includes('follower');
      const endpoint = isFollowers ? 'followers' : 'following';

      setLoading(true);
      try {
        const res = await api.get(`/users/${targetUserId}/${endpoint}`);
        if (mounted) setUsers(res.data || []);
      } catch (err) {
        console.error('Failed to fetch users for modal:', err);
        if (userIds && userIds.length > 0) {
          try {
            const items = await Promise.all(userIds.map(async (id) => {
              const res = await api.get(`/users/${typeof id === 'string' ? id : id._id}`);
              return res.data;
            }));
            if (mounted) setUsers(items.filter(Boolean));
          } catch (e) {
            console.error('Fallback fetch failed:', e);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchUsers();
    return () => { mounted = false; };
  }, [open, userId, userIds, title, initialUsers]);

  const toggleFollow = async (targetId) => {
    if (!loggedInUser) return;
    setToggling((s) => ({ ...s, [targetId]: true }));
    try {
      const res = await api.put(`/users/${targetId}/follow`, {});
      if (typeof onToggle === 'function') onToggle(targetId, res.data);
      setUsers((prev) =>
        prev.map(u =>
          u._id === targetId
            ? {
                ...u,
                followers:
                  u.followers.includes(loggedInUser._id)
                    ? u.followers.filter((id) => id !== loggedInUser._id)
                    : [...u.followers, loggedInUser._id],
              amFollowing:
                u._id !== loggedInUser._id && u.followers.includes(loggedInUser._id),
              isMe: u._id === loggedInUser?._id,
            }
          : u
        )
      );
    } catch (err) {
      console.error('Follow toggle failed:', err);
    } finally {
      setToggling((s) => ({ ...s, [targetId]: false }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">Close</button>
        </div>
        <div className="max-h-96 overflow-auto">
          {loading ? (
            <div className="py-6 flex items-center justify-center"><div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin"/></div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-zinc-500">No users to show.</div>
          ) : (
            users.map((u) => {
              const isMe = u._id === loggedInUser?._id;
              const amFollowing = loggedInUser && loggedInUser._id && u.followers && u.followers.includes(loggedInUser._id);
              return (
                <div key={u._id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                      {u.profilePic ? <img src={u.profilePic} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm text-white">{u.username?.[0]?.toUpperCase()}</div>}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{u.username}</div>
                      {u.name && <div className="text-xs text-zinc-500">{u.name}</div>}
                    </div>
                  </div>
                  <div>
                    {isMe ? (
                      <span className="text-xs text-zinc-500">You</span>
                    ) : (
                      <button
                        onClick={() => toggleFollow(u._id)}
                        disabled={!!toggling[u._id]}
                        className={`px-3 py-1 rounded text-sm font-semibold ${amFollowing ? 'bg-zinc-800 text-white' : 'bg-blue-500 text-white'}`}
                      >
                        {toggling[u._id] ? '...' : (amFollowing ? 'Following' : 'Follow')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
