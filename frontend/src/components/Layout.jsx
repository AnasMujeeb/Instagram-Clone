import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import SettingsModal from './SettingsModal';
import ReportProblemModal from './ReportProblemModal';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

const Icons = {
  home: (active) => (
    <svg aria-label="Home" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      {active ? (
        <path d="M22 23h-6.001a1 1 0 0 1-1-1v-5.455a2.997 2.997 0 1 0-5.993 0V22a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V11.543a1.002 1.002 0 0 1 .31-.724l10-9.543a1.001 1.001 0 0 1 1.38 0l10 9.543a1.002 1.002 0 0 1 .31.724V22a1 1 0 0 1-1 1Z" />
      ) : (
        <path d="M9.005 16.545a2.997 2.997 0 0 1 2.997-2.997A2.997 2.997 0 0 1 15 16.545V22h7V11.543L12 2 2 11.543V22h7.005Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      )}
    </svg>
  ),
  search: () => (
    <svg aria-label="Search" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      <path d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.511" x2="22" y1="16.511" y2="22" />
    </svg>
  ),
  explore: (active) => (
    <svg aria-label="Explore" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      {active ? (
        <path d="m13.173 13.164 1.491-3.829-3.83 1.49ZM12.001.5a11.5 11.5 0 1 0 0 23 11.5 11.5 0 0 0 0-23Zm5.35 7.443-2.478 6.369a1 1 0 0 1-.57.569l-6.36 2.47a1 1 0 0 1-1.294-1.294l2.48-6.369a1 1 0 0 1 .57-.569l6.359-2.47a1 1 0 0 1 1.294 1.294Z" />
      ) : (
        <>
          <polygon fill="none" points="13.941 13.953 7.581 16.424 10.06 10.056 16.42 7.585" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <circle cx="12.001" cy="12.005" fill="none" r="10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </>
      )}
    </svg>
  ),
  reels: (active) => (
    <svg aria-label="Reels" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      {active ? (
        <path d="m12.823 1 2.974 5.002h-5.58l-2.65-4.971c.206-.013.419-.022.642-.027L8.55 1Zm2.327 0h.298c3.06 0 4.468.754 5.64 1.887a.38.38 0 0 1-.087.058l-3.41 2.024-2.4-3.97Zm-8.999-.065-2.2 4.127L.78 3.29a.553.553 0 0 1-.12-.266C1.145 1.682 2.669.966 4.926.96L6.151.935Zm5.26 7.073H.117L0 20.065c0 1.333.462 2.637 1.472 3.453a5.036 5.036 0 0 0 3.287 1.455l.216.026h14.043c1.07-.044 2.067-.454 2.86-1.167 1.07-1.012 1.372-2.095 1.372-3.652l-.147-12.163Zm-2.573 6.35-4.517 2.607a.474.474 0 0 1-.71-.41V11.97a.474.474 0 0 1 .71-.41l4.517 2.608a.474.474 0 0 1 0 .82Z" fillRule="evenodd" />
      ) : (
        <>
          <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="2.049" x2="21.95" y1="7.002" y2="7.002" />
          <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="13.504" x2="16.362" y1="2.001" y2="7.002" />
          <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="7.207" x2="10.002" y1="2.11" y2="7.002" />
          <path d="M2 12.001v3.449c0 2.849.698 4.006 1.606 4.945.94.908 2.098 1.607 4.946 1.607h6.896c2.849 0 4.006-.699 4.946-1.607.908-.939 1.606-2.096 1.606-4.945V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.699 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.703 2 8.552Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.63a.909.909 0 0 1 1.364-.788l4.631 2.624a.909.909 0 0 1 0 1.575l-4.63 2.624a.913.913 0 0 1-.91 0Z" fillRule="evenodd" />
        </>
      )}
    </svg>
  ),
  messages: (active) => (
    <svg aria-label="Messenger" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      {active ? (
        <path d="M12.003 1.131a10.487 10.487 0 0 0-10.87 10.497 10.44 10.44 0 0 0 3.67 8.05v3.325a1 1 0 0 0 1.498.866l2.858-1.654a10.823 10.823 0 0 0 2.844.377 10.487 10.487 0 0 0 10.87-10.497A10.487 10.487 0 0 0 12.003 1.13Zm5.26 8.737-2.578 4.08a1.5 1.5 0 0 1-2.167.436l-2.05-1.536a.6.6 0 0 0-.72 0l-2.767 2.097a.473.473 0 0 1-.686-.659l2.578-4.08a1.5 1.5 0 0 1 2.167-.436l2.05 1.536a.6.6 0 0 0 .72 0l2.767-2.097a.473.473 0 0 1 .686.659Z" />
      ) : (
        <>
          <path d="M12.003 2.001a9.705 9.705 0 1 1 0 19.4 10.876 10.876 0 0 1-2.895-.384.798.798 0 0 0-.533.04l-1.984.876a.801.801 0 0 1-1.123-.708l-.054-1.78a.806.806 0 0 0-.27-.569 9.49 9.49 0 0 1-3.14-7.175 9.65 9.65 0 0 1 10-9.7Z" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="1.739" />
          <path d="M17.79 10.132a.659.659 0 0 0-.962-.873l-2.556 2.05a.63.63 0 0 1-.758.002L11.06 9.47a1.576 1.576 0 0 0-2.277.42l-2.567 3.98a.659.659 0 0 0 .961.873l2.556-2.05a.63.63 0 0 1 .759-.002l2.452 1.84a1.576 1.576 0 0 0 2.278-.42Z" fillRule="evenodd" />
        </>
      )}
    </svg>
  ),
  notifications: () => (
    <svg aria-label="Notifications" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z" />
    </svg>
  ),
  create: () => (
    <svg aria-label="New post" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      <path d="M2 12v3.45c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.849 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.547 2 5.703 2 8.552Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="6.545" x2="17.455" y1="12.001" y2="12.001" />
      <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="12.003" x2="12.003" y1="6.545" y2="17.455" />
    </svg>
  ),
  profile: (active) => (
    <svg aria-label="Profile" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      {active ? (
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 3.333A3.333 3.333 0 1 1 8.667 8.667 3.333 3.333 0 0 1 12 5.333Zm0 14.334a7.667 7.667 0 0 1-5.867-2.734A4.333 4.333 0 0 1 10 14.667h4a4.333 4.333 0 0 1 3.867 2.266A7.667 7.667 0 0 1 12 19.667Z" />
      ) : (
        <>
          <circle cx="12.004" cy="12.004" fill="none" r="10.5" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" />
          <path d="M18.793 20.014a6.08 6.08 0 0 0-1.778-2.447 3.991 3.991 0 0 0-2.386-.791H9.38a3.994 3.994 0 0 0-2.386.791 6.09 6.09 0 0 0-1.779 2.447" fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" />
          <circle cx="12.006" cy="9.718" fill="none" r="4.109" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" />
        </>
      )}
    </svg>
  ),
  more: () => (
    <svg aria-label="Settings" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="3" x2="21" y1="4" y2="4" />
      <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="3" x2="21" y1="12" y2="12" />
      <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="3" x2="21" y1="20" y2="20" />
    </svg>
  ),
  instagram: () => (
    <svg aria-label="Instagram" fill="currentColor" height="29" viewBox="0 0 174.875 51" width="103">
      <path clipRule="evenodd" d="M25.868 0C18.802 0 17.94.034 15.185.16 12.433.287 10.55.69 8.895 1.3 7.184 1.93 5.73 2.78 4.28 4.23 2.83 5.68 1.98 7.134 1.35 8.845.74 10.5.337 12.383.21 15.135.085 17.89.05 18.752.05 25.818s.034 7.928.16 10.682c.128 2.753.53 4.636 1.14 6.29.63 1.712 1.48 3.166 2.93 4.616 1.45 1.45 2.904 2.3 4.615 2.93 1.655.61 3.538 1.013 6.29 1.14 2.756.127 3.618.16 10.684.16s7.928-.033 10.683-.16c2.752-.127 4.636-.53 6.29-1.14 1.711-.63 3.166-1.48 4.616-2.93 1.45-1.45 2.3-2.904 2.93-4.615.608-1.655 1.012-3.538 1.14-6.29.126-2.755.16-3.617.16-10.683 0-7.066-.034-7.928-.16-10.683-.128-2.752-.532-4.636-1.14-6.29-.63-1.711-1.48-3.166-2.93-4.616-1.45-1.45-2.905-2.3-4.616-2.93C41.187.69 39.304.287 36.552.16 33.797.033 32.935 0 25.87 0Z" fillRule="evenodd" transform="translate(62.173 0) scale(.39)"/>
    </svg>
  ),
  instagramGlyph: () => (
    <svg aria-label="Instagram" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
      <path d="M12 2.982c2.937 0 3.285.011 4.445.064a6.087 6.087 0 0 1 2.042.379 3.408 3.408 0 0 1 1.265.823 3.408 3.408 0 0 1 .823 1.265 6.087 6.087 0 0 1 .379 2.042c.053 1.16.064 1.508.064 4.445s-.011 3.285-.064 4.445a6.087 6.087 0 0 1-.379 2.042 3.643 3.643 0 0 1-2.088 2.088 6.087 6.087 0 0 1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.087 6.087 0 0 1-2.042-.379 3.408 3.408 0 0 1-1.265-.823 3.408 3.408 0 0 1-.823-1.265 6.087 6.087 0 0 1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.087 6.087 0 0 1 .379-2.042 3.408 3.408 0 0 1 .823-1.265 3.408 3.408 0 0 1 1.265-.823 6.087 6.087 0 0 1 2.042-.379c1.16-.053 1.508-.064 4.445-.064M12 1c-2.987 0-3.362.013-4.535.066a8.074 8.074 0 0 0-2.67.51 5.392 5.392 0 0 0-1.949 1.27 5.392 5.392 0 0 0-1.269 1.948 8.074 8.074 0 0 0-.51 2.67C1.012 8.638 1 9.013 1 12s.013 3.362.066 4.535a8.074 8.074 0 0 0 .51 2.67 5.392 5.392 0 0 0 1.27 1.949 5.392 5.392 0 0 0 1.948 1.269 8.074 8.074 0 0 0 2.67.51C8.638 22.988 9.013 23 12 23s3.362-.013 4.535-.066a8.074 8.074 0 0 0 2.67-.51 5.625 5.625 0 0 0 3.218-3.218 8.074 8.074 0 0 0 .51-2.67C22.988 15.362 23 14.987 23 12s-.013-3.362-.066-4.535a8.074 8.074 0 0 0-.51-2.67 5.392 5.392 0 0 0-1.27-1.949 5.392 5.392 0 0 0-1.948-1.269 8.074 8.074 0 0 0-2.67-.51C15.362 1.012 14.987 1 12 1Zm0 5.351A5.649 5.649 0 1 0 17.649 12 5.649 5.649 0 0 0 12 6.351Zm0 9.316A3.667 3.667 0 1 1 15.667 12 3.667 3.667 0 0 1 12 15.667Zm5.872-10.859a1.32 1.32 0 1 0 1.32 1.32 1.32 1.32 0 0 0-1.32-1.32Z"/>
    </svg>
  ),
};

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { user, logout } = useAuth();
  
  const [showMore, setShowMore] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [createType, setCreateType] = useState('post'); 
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef(null);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [createContent, setCreateContent] = useState('');
  const [createImage, setCreateImage] = useState(null);
  const [createImagePreview, setCreateImagePreview] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!user?.token) return;
    const fetchSuggested = async () => {
      try {
        const response = await api.get('/users/suggestions');
        setSuggestedUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    };
    fetchSuggested();
  }, []);

  useEffect(() => {
    if (!user?.token || !user?._id) return;
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${user._id}`);
        if (res.data.following) {
          setFollowingIds(new Set(res.data.following.map(id => id.toString())));
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [user?.token]);

  useEffect(() => {
    if (showNotifications && user?.token) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          setNotifications(res.data);
          setUnreadCount(0);
          await api.put('/notifications/read', {});
        } catch (err) {
          console.error('Notifications error:', err);
        }
      };
      fetchNotifications();
    }
  }, [showNotifications]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!showNotifications) {
        setUnreadCount(prev => prev + 1);
      }
    };
    
    socket.on('newNotification', handleNewNotification);
    return () => socket.off('newNotification', handleNewNotification);
  }, [socket, showNotifications]);

  const handleFollow = async (userId) => {
    try {
      await api.put(`/users/${userId}/follow`, {});
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.has(userId) ? next.delete(userId) : next.add(userId);
        return next;
      });
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleCreateImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCreateImage(file);
      setCreateImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async () => {
    if (createType === 'reel') {
      if (!createImage) {
        setCreateError('Please upload a video for the reel');
        return;
      }
      setCreateLoading(true);
      setCreateError('');

      try {
        const formData = new FormData();
        formData.append('video', createImage);
        formData.append('caption', createContent);

        await api.post('/reels', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setCreateContent('');
        setCreateImage(null);
        setCreateImagePreview(null);
        setShowCreatePost(false);
        navigate('/reels');
      } catch (err) {
        setCreateError(err.response?.data?.message || 'Failed to create reel');
      } finally {
        setCreateLoading(false);
      }
    } else {
      if (!createContent.trim() && !createImage) return;
      setCreateLoading(true);
      setCreateError('');

      try {
        const formData = new FormData();
        formData.append('content', createContent);
        if (createImage) {
          formData.append('image', createImage);
        }

        await api.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setCreateContent('');
        setCreateImage(null);
        setCreateImagePreview(null);
        setShowCreatePost(false);
        window.location.reload();
      } catch (err) {
        setCreateError(err.response?.data?.message || 'Failed to create post');
      } finally {
        setCreateLoading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeAllPanels = () => {
    setShowSearch(false);
    setShowNotifications(false);
  };

  const isMessagesPage = location.pathname === '/messages';

  if (!user) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">{children}</div>;
  }

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: Icons.home, hasActive: true },
    { path: null, label: 'Search', icon: Icons.search, hasActive: false, action: 'search' },
    { path: '/explore', label: 'Explore', icon: Icons.explore, hasActive: true },
    { path: '/reels', label: 'Reels', icon: Icons.reels, hasActive: true },
    { path: null, label: 'Messages', icon: Icons.messages, hasActive: true, action: 'messages' },
    { path: null, label: 'Notifications', icon: Icons.notifications, hasActive: false, action: 'notifications' },
    { path: null, label: 'Create', icon: Icons.create, hasActive: false, action: 'create' },
    { path: '/profile', label: 'Profile', icon: Icons.profile, hasActive: true },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex relative selection:bg-zinc-800">
      
      <aside className="hidden md:flex flex-col w-[72px] xl:w-[244px] fixed left-0 top-0 h-screen border-r border-zinc-800 pt-6 pb-5 px-3 xl:px-3 z-50 bg-black justify-between transition-all duration-200">
        
        <div className="flex flex-col">
          <div className="px-3 pt-1 pb-5 mb-2">
            <Link to="/" className="hidden xl:block text-white hover:opacity-80 transition">
              <span className="text-[22px] font-semibold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>Instagram</span>
            </Link>
            <Link to="/" className="xl:hidden flex justify-center text-white hover:opacity-80 transition">
              {Icons.instagramGlyph()}
            </Link>
          </div>

          <nav className="flex flex-col gap-0.5">
            {navItems.map((item, i) => {
              const active = item.path ? isActive(item.path) : false;

              const className = `group flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-900 transition-all duration-200 w-full text-left cursor-pointer ${
                active ? 'font-bold' : 'font-normal'
              }`;

              if (item.path && !item.action) {
                return (
                  <Link key={i} to={item.path} className={className} onClick={closeAllPanels}>
                    <span className="flex-shrink-0 transition-transform group-hover:scale-105">
                      {item.hasActive ? item.icon(active) : item.icon()}
                    </span>
                    <span className="hidden xl:inline text-[15px]">{item.label}</span>
                  </Link>
                );
              }

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (item.action === 'messages') {
                      closeAllPanels();
                      navigate('/messages');
                    } else if (item.action === 'search') {
                      setShowNotifications(false);
                      setShowSearch(!showSearch);
                      setSearchQuery('');
                      setSearchResults([]);
                    } else if (item.action === 'notifications') {
                      setShowSearch(false);
                      setShowNotifications(!showNotifications);
                    } else if (item.action === 'create') {
                      closeAllPanels();
                      setShowCreatePost(true);
                    }
                  }}
                  className={`${className} relative`}
                >
                  <span className="flex-shrink-0 relative transition-transform group-hover:scale-105">
                    {item.hasActive ? item.icon(active) : item.icon()}
                    {item.action === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="hidden xl:inline text-[15px]">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-0.5 relative">
          <button 
            onClick={() => setShowMore(!showMore)}
            className="group flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-900 transition-all duration-200 w-full text-left cursor-pointer font-normal"
          >
            <span className="flex-shrink-0 transition-transform group-hover:scale-105">
              {Icons.more()}
            </span>
            <span className="hidden xl:inline text-[15px]">More</span>
          </button>

          {showMore && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
              <div className="absolute bottom-14 left-0 w-[266px] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 z-50 overflow-hidden">
                <div className="p-1">
                  <button onClick={() => { setShowMore(false); setShowSettingsModal(true); }} className="flex items-center gap-3 w-full p-3.5 hover:bg-zinc-800 rounded-xl text-sm text-left transition cursor-pointer">
                    Settings
                  </button>
                  <button onClick={() => { setShowMore(false); setShowReportModal(true); }} className="flex items-center gap-3 w-full p-3.5 hover:bg-zinc-800 rounded-xl text-sm text-left transition cursor-pointer">
                    Report a problem
                  </button>
                </div>
                <div className="border-t border-zinc-800">
                  <button onClick={() => { setShowMore(false); handleLogout(); navigate('/login'); }} className="flex items-center gap-3 w-full p-3.5 hover:bg-zinc-800 rounded-xl text-sm text-left transition cursor-pointer">
                    Switch accounts
                  </button>
                </div>
                <div className="border-t border-zinc-800">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full p-3.5 hover:bg-zinc-800 rounded-xl text-sm text-left text-red-400 transition cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {showSearch && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowSearch(false)} />
          <div className="fixed left-[72px] xl:left-[244px] top-0 h-screen w-[400px] bg-black border-r border-zinc-800 z-40 slide-panel flex flex-col">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-white mb-6">Search</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="flex flex-col">
                  {searchResults.map((result) => (
                    <div
                      key={result._id}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-900 cursor-pointer transition"
                      onClick={() => {
                          setShowSearch(false);
                          navigate(`/profile/${result.username}`);
                        }}
                    >
                      <div className="w-11 h-11 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0">
                        {result.profilePic ? (
                          <img src={result.profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          result.username?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{result.username}</span>
                        <span className="text-xs text-zinc-500">{result.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  {searchLoading ? 'Searching...' : 'No results found.'}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-zinc-500 text-sm font-semibold">Recent</p>
                  <p className="text-zinc-600 text-xs mt-2">No recent searches.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showNotifications && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
          <div className="fixed left-[72px] xl:left-[244px] top-0 h-screen w-[400px] bg-black border-r border-zinc-800 z-40 slide-panel flex flex-col">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className="flex items-center gap-3 px-6 py-3.5 hover:bg-zinc-900 transition cursor-pointer"
                      onClick={() => {
                        setShowNotifications(false);
                        if (notif.postId) navigate(`/p/${notif.postId._id || notif.postId}`);
                        else if (notif.reelId) navigate('/reels');
                        else if (notif.sender?.username) navigate(`/profile/${notif.sender.username}`);
                      }}
                    >
                      <div className="w-11 h-11 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0">
                        {notif.sender?.profilePic ? (
                          <img src={notif.sender.profilePic} alt="" className="w-full h-full object-cover" />
                        ) : (
                          notif.sender?.username?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">
                          <span className="font-semibold">{notif.sender?.username || 'User'}</span>
                          {' '}
                          <span className="text-zinc-400">
                            {notif.type === 'follow' 
                              ? 'started following you.' 
                              : notif.type === 'like' 
                              ? (notif.reelId ? 'liked your reel.' : 'liked your post.') 
                              : 'commented on your post.'}
                          </span>
                          {' '}
                          <span className="text-zinc-600 text-xs">{timeAgo(notif.createdAt)}</span>
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-zinc-500">
                        {notif.type === 'follow' ? (
                          <svg fill="currentColor" height="16" width="16" viewBox="0 0 24 24">
                            <path d="M16 11h4v2h-4v4h-2v-4H10v-2h4V7h2v4Zm-4 11C5.4 22 0 17 0 10.5S5.4-1 12-1s12 5 12 11.5S18.6 22 12 22Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        ) : notif.type === 'like' ? (
                          <svg fill="#ff3040" height="16" width="16" viewBox="0 0 48 48">
                            <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5Z"/>
                          </svg>
                        ) : (
                          notif.postId?.image ? (
                            <img src={notif.postId.image} alt="" className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <svg fill="currentColor" height="16" width="16" viewBox="0 0 24 24">
                              <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"/>
                            </svg>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 border-2 border-zinc-700 rounded-full flex items-center justify-center mb-4">
                    <svg fill="currentColor" height="32" width="32" viewBox="0 0 24 24" className="text-zinc-600">
                      <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-500">No notifications yet</p>
                  <p className="text-xs text-zinc-600 mt-1">When someone interacts with your posts, you'll see it here.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showCreatePost && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center create-modal-overlay" onClick={() => setShowCreatePost(false)}>
          <div className="w-full max-w-[520px] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <button onClick={() => { setShowCreatePost(false); setCreateImage(null); setCreateImagePreview(null); setCreateContent(''); setCreateError(''); setCreateType('post'); }} className="text-sm text-zinc-400 hover:text-white transition cursor-pointer">
                Cancel
              </button>
              
              <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg">
                <button 
                  onClick={() => { setCreateType('post'); setCreateImage(null); setCreateImagePreview(null); setCreateError(''); }} 
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${createType === 'post' ? 'bg-zinc-950 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                >
                  Post
                </button>
                <button 
                  onClick={() => { setCreateType('reel'); setCreateImage(null); setCreateImagePreview(null); setCreateError(''); }} 
                  className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${createType === 'reel' ? 'bg-zinc-950 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                >
                  Reel
                </button>
              </div>

              <button 
                onClick={handleCreatePost} 
                disabled={createLoading || (createType === 'post' ? (!createContent.trim() && !createImage) : !createImage)}
                className={`text-sm font-bold transition cursor-pointer ${createLoading || (createType === 'post' ? (!createContent.trim() && !createImage) : !createImage) ? 'text-blue-500/40' : 'text-blue-500 hover:text-blue-400'}`}
              >
                {createLoading ? 'Sharing...' : 'Share'}
              </button>
            </div>
            
            {createError && <div className="px-4 py-2 text-xs bg-red-500/10 text-red-400 text-center">{createError}</div>}
            
            {createImagePreview && (
              <div className="relative w-full aspect-square bg-zinc-950 max-h-[360px] overflow-hidden flex items-center justify-center">
                {createImage?.type?.startsWith('video/') || createType === 'reel' ? (
                  <video src={createImagePreview} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={createImagePreview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => { setCreateImage(null); setCreateImagePreview(null); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black transition cursor-pointer z-10"
                >
                  ✕
                </button>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  {user?.profilePic ? (
                    <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <span className="text-sm font-semibold text-white">{user?.username}</span>
              </div>
              <textarea
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                placeholder={createType === 'reel' ? "Write a reel caption..." : "Write a caption..."}
                rows="3"
                className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 mt-2">
                <label className="cursor-pointer text-zinc-400 hover:text-white transition flex items-center gap-2">
                  <svg fill="currentColor" height="20" width="20" viewBox="0 0 24 24">
                    <path d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557ZM2 18.605l3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"/>
                    <path d="M18.44 2.004H5.56a3.556 3.556 0 0 0-3.556 3.556v12.88a3.556 3.556 0 0 0 3.556 3.556h12.88a3.556 3.556 0 0 0 3.556-3.556V5.56a3.556 3.556 0 0 0-3.556-3.556Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                  </svg>
                  <span className="text-xs font-medium">{createType === 'reel' ? 'Select Video' : 'Photo/Video'}</span>
                  <input 
                    type="file" 
                    accept={createType === 'reel' ? 'video/*' : 'image/*,video/*'} 
                    onChange={handleCreateImageChange} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 md:ml-[72px] xl:ml-[244px] bg-black ${isMessagesPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        {isMessagesPage ? (
          <div className="w-full h-full">
            {children}
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-full max-w-[630px] min-h-screen pb-16 md:pb-0">
              {children}
            </div>

            <div className="hidden xl:block w-[320px] flex-shrink-0 pt-9 pl-16 pr-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-white overflow-hidden border-2 border-zinc-700">
                    {user?.profilePic ? (
                      <img src={user.profilePic} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">{user.username ? user.username[0].toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <Link to="/profile" className="font-semibold text-sm text-white hover:opacity-70 transition">{user.username}</Link>
                    <span className="text-zinc-500 text-xs">{user.name || user.username}</span>
                  </div>
                </div>
                <button onClick={() => { handleLogout(); navigate('/login'); }} className="text-xs font-semibold text-blue-500 hover:text-white transition cursor-pointer">Switch</button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-500 text-sm font-semibold">Suggested for you</span>
                <button onClick={() => navigate('/explore')} className="text-xs font-semibold text-white hover:text-zinc-400 transition cursor-pointer">See All</button>
              </div>

              <div className="flex flex-col gap-3">
                {suggestedUsers.length > 0 ? suggestedUsers.map((sugUser) => {
                  const isFollowing = followingIds.has(sugUser._id);
                  return (
                    <div key={sugUser._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                          {sugUser.profilePic ? (
                            <img src={sugUser.profilePic} alt="" className="w-full h-full object-cover" />
                          ) : (
                            sugUser.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white">{sugUser.username}</span>
                          <span className="text-[11px] text-zinc-500">{sugUser.name || 'Suggested for you'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleFollow(sugUser._id)}
                        className={`text-xs font-bold transition cursor-pointer ${isFollowing ? 'text-zinc-400 hover:text-white' : 'text-blue-500 hover:text-white'}`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  );
                }) : (
                  <p className="text-xs text-zinc-600">No suggestions yet.</p>
                )}
              </div>

              <div className="mt-8 text-[11px] text-zinc-700 leading-relaxed">
                <span>About · Help · Press · API · Jobs · Privacy · Terms · Locations · Language · Meta Verified</span>
                <p className="mt-4 text-zinc-700">© 2026 INSTAGRAM FROM META</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isMessagesPage && (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-black border-t border-zinc-800 flex justify-around items-center h-12 z-50">
          <Link to="/" className="p-2 text-white">{Icons.home(isActive('/'))}</Link>
          <Link to="/explore" className="p-2 text-white">{Icons.explore(isActive('/explore'))}</Link>
          <Link to="/reels" className="p-2 text-white">{Icons.reels(isActive('/reels'))}</Link>
          <button onClick={() => navigate('/messages')} className="p-2 text-white cursor-pointer">{Icons.messages(false)}</button>
          <Link to="/profile" className="p-2 text-white">{Icons.profile(isActive('/profile'))}</Link>
        </div>
      )}

      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
      {showReportModal && <ReportProblemModal onClose={() => setShowReportModal(false)} />}
    </div>
  );
}