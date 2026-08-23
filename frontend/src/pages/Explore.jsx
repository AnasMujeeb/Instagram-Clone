import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Explore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (!user?.token) return;
    fetchExplorePosts();
  }, [user?.token]);

  const fetchExplorePosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  if (!user) return null;

  const filteredPosts = searchQuery.trim()
    ? posts.filter(
        (p) =>
          p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  return (
    <div className="min-h-screen text-white py-4 px-1">
      <div className="mb-4 px-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" fill="currentColor" height="16" width="16" viewBox="0 0 24 24">
            <path d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.511" x2="22" y1="16.511" y2="22" />
          </svg>
          <input
            type="text"
            placeholder="Search users or posts..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {searchQuery.trim() !== '' && (
        <div className="mb-6 px-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Accounts</h3>
          {searchResults.length > 0 ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  onClick={() => navigate(`/profile/${u.username}`)}
                  className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer transition"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0">
                    {u.profilePic ? (
                      <img src={u.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      u.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{u.username}</span>
                    <span className="text-xs text-zinc-400">{u.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No accounts matching "{searchQuery}"</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-2 border-zinc-700 rounded-full flex items-center justify-center mb-4">
            <svg fill="currentColor" height="32" width="32" viewBox="0 0 24 24" className="text-zinc-600">
              <path d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557ZM2 18.605l3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"/>
              <path d="M18.44 2.004H5.56a3.556 3.556 0 0 0-3.556 3.556v12.88a3.556 3.556 0 0 0 3.556 3.556h12.88a3.556 3.556 0 0 0 3.556-3.556V5.56a3.556 3.556 0 0 0-3.556-3.556Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
            </svg>
          </div>
          <p className="text-sm text-zinc-500">
            {searchQuery.trim() ? `No posts matching "${searchQuery}"` : 'No posts to explore yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {filteredPosts.map((post, index) => {
            const isLargeCell = index % 10 === 2 || index % 10 === 7;

            return (
              <div
                key={post._id}
                onClick={() => navigate(`/p/${post._id}`)}
                className={`relative group cursor-pointer bg-zinc-900 overflow-hidden ${
                  isLargeCell ? 'row-span-2' : ''
                }`}
                style={{ aspectRatio: isLargeCell ? undefined : '1/1' }}
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt=""
                    className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${
                      isLargeCell ? 'aspect-auto min-h-full' : ''
                    }`}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-4">
                    <p className="text-xs text-zinc-400 text-center line-clamp-4 leading-relaxed">
                      {post.content || 'No content'}
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-1.5">
                    <svg fill="white" height="20" width="20" viewBox="0 0 48 48">
                      <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5Z"/>
                    </svg>
                    <span className="text-white font-bold text-sm">{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg fill="white" height="20" width="20" viewBox="0 0 24 24">
                      <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="white" stroke="white" strokeLinejoin="round" strokeWidth="2"/>
                    </svg>
                    <span className="text-white font-bold text-sm">{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
