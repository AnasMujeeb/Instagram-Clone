import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SettingsModal from '../components/SettingsModal';
import ArchiveModal from '../components/ArchiveModal';

const GridIcon = () => (
  <svg aria-label="Posts" fill="currentColor" height="12" width="12" viewBox="0 0 24 24">
    <rect
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      width="18"
      x="3"
      y="3"
      rx="2"
    />
    <line
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      x1="9.015"
      x2="9.015"
      y1="3"
      y2="21"
    />
    <line
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      x1="14.985"
      x2="14.985"
      y1="3"
      y2="21"
    />
    <line
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      x1="21"
      x2="3"
      y1="9.015"
      y2="9.015"
    />
    <line
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      x1="21"
      x2="3"
      y1="14.985"
      y2="14.985"
    />
  </svg>
);

const SavedIcon = () => (
  <svg aria-label="Saved" fill="currentColor" height="12" width="12" viewBox="0 0 24 24">
    <polygon
      fill="none"
      points="20 21 12 13.44 4 21 4 3 20 3 20 21"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const TaggedIcon = () => (
  <svg aria-label="Tagged" fill="currentColor" height="12" width="12" viewBox="0 0 24 24">
    <path
      d="M10.201 3.797 12 1.997l1.799 1.8a1.59 1.59 0 0 0 1.124.465h2.18a1.59 1.59 0 0 1 1.59 1.59v2.18a1.59 1.59 0 0 0 .466 1.125L21 10.96v2.08l-1.841 1.803a1.59 1.59 0 0 0-.466 1.125v2.18a1.59 1.59 0 0 1-1.59 1.59h-2.18a1.59 1.59 0 0 0-1.124.466L12 22.003l-1.799-1.8a1.59 1.59 0 0 0-1.124-.465h-2.18a1.59 1.59 0 0 1-1.59-1.59v-2.18a1.59 1.59 0 0 0-.466-1.125L3 13.04v-2.08l1.841-1.803a1.59 1.59 0 0 0 .466-1.125v-2.18a1.59 1.59 0 0 1 1.59-1.59h2.18a1.59 1.59 0 0 0 1.124-.466Z"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg aria-label="Options" fill="currentColor" height="24" width="24" viewBox="0 0 24 24">
    <circle
      cx="12"
      cy="12"
      fill="none"
      r="8.635"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
    <path
      d="M14.232 3.656a1.269 1.269 0 0 1-.796-.66L12.93 2h-1.86l-.505.996a1.269 1.269 0 0 1-.796.66m-.001 16.688a1.269 1.269 0 0 1 .796.66l.505.996h1.862l.505-.996a1.269 1.269 0 0 1-.796-.66M3.656 9.768a1.269 1.269 0 0 1-.66.796L2 11.07v1.862l.996.505a1.269 1.269 0 0 1 .66.796m16.688-.001a1.269 1.269 0 0 1 .66-.796L22 12.93v-1.86l-.996-.505a1.269 1.269 0 0 1-.66-.796M7.678 4.522a1.269 1.269 0 0 1-1.03.096l-1.06-.348L4.27 5.587l.348 1.062a1.269 1.269 0 0 1-.096 1.03m11.8 11.799a1.269 1.269 0 0 1 1.03-.096l1.06.348 1.318-1.317-.348-1.062a1.269 1.269 0 0 1 .096-1.03m-2.956-11.8a1.269 1.269 0 0 1 .096-1.03l.348-1.06-1.317-1.318-1.062.348a1.269 1.269 0 0 1-1.03-.096m-8.443 11.8a1.269 1.269 0 0 1-.096 1.03l-.348 1.06 1.317 1.318 1.062-.348a1.269 1.269 0 0 1 1.03.096"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

function UserListModal({
  open,
  onClose,
  title,
  userId,
  navigate,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !userId) return;

    let cancelled = false;

    const fetchUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const endpoint =
          title === 'Followers'
            ? `/users/${userId}/followers`
            : `/users/${userId}/following`;

        const response = await api.get(endpoint);

        if (cancelled) return;

        let data = response.data;

        if (Array.isArray(data)) {
          setUsers(data);
        } else if (Array.isArray(data?.users)) {
          setUsers(data.users);
        } else if (Array.isArray(data?.followers)) {
          setUsers(data.followers);
        } else if (Array.isArray(data?.following)) {
          setUsers(data.following);
        } else {
          setUsers([]);
        }
      } catch (err) {
        if (cancelled) return;

        console.error(`Failed to fetch ${title.toLowerCase()}:`, err);
        setUsers([]);
        setError(`Failed to load ${title.toLowerCase()}.`);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [open, userId, title]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="py-12 px-5 text-center">
              <p className="text-sm text-red-400">
                {error}
              </p>

              <button
                onClick={onClose}
                className="mt-3 text-xs text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-500">
                {title === 'Followers'
                  ? 'No followers yet.'
                  : 'Not following anyone yet.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {users.map((person) => {
                const personId =
                  typeof person === 'string'
                    ? person
                    : person?._id;

                const username =
                  typeof person === 'string'
                    ? person
                    : person?.username;

                const name =
                  typeof person === 'string'
                    ? ''
                    : person?.name;

                const profilePic =
                  typeof person === 'string'
                    ? ''
                    : person?.profilePic;

                if (!personId) return null;

                return (
                  <div
                    key={personId}
                    className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800 transition"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer"
                      onClick={() => {
                        onClose();

                        if (username) {
                          navigate(`/profile/${username}`);
                        } else {
                          navigate(`/profile/${personId}`);
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
                        {profilePic ? (
                          <img
                            src={profilePic}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          username?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {username || 'User'}
                        </p>

                        {name && (
                          <p className="text-xs text-zinc-500 truncate">
                            {name}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();

                        if (username) {
                          navigate(`/profile/${username}`);
                        } else {
                          navigate(`/profile/${personId}`);
                        }
                      }}
                      className="text-xs font-semibold text-blue-500 hover:text-white transition cursor-pointer flex-shrink-0 ml-3"
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user: loggedInUser, updateUser, logout } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  const [savedPosts, setSavedPosts] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [savedTab, setSavedTab] = useState('posts');
  const [savedLoading, setSavedLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPicFile, setEditPicFile] = useState(null);
  const [editPicPreview, setEditPicPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [showFullSettingsModal, setShowFullSettingsModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [chatLoading, setChatLoading] = useState(false);

  const isOwnProfile =
    !identifier ||
    identifier === loggedInUser?._id ||
    identifier === loggedInUser?.username;

  const handleMessage = async () => {
    if (!profileUser?._id) return;

    setChatLoading(true);

    try {
      const res = await api.post('/messages/conversation', {
        receiverId: profileUser._id,
      });

      navigate('/messages', {
        state: {
          openChat: res.data,
        },
      });
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (!loggedInUser) return;

    const resolveAndFetch = async () => {
      let targetId = null;

      if (!identifier) {
        targetId = loggedInUser._id;
      } else {
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

        if (isObjectId) {
          targetId = identifier;
        } else {
          try {
            const res = await api.get(
              `/users/username/${encodeURIComponent(identifier)}`
            );

            targetId = res.data._id;
          } catch (err) {
            console.error('Failed to resolve username:', err);

            setProfileUser(null);
            setLoading(false);

            return;
          }
        }
      }

      fetchProfileData(targetId);
      fetchUserPosts(targetId);

      const fetchReelsForUser = async () => {
        setReelsLoading(true);

        try {
          const res = await api.get('/reels');

          const userReels = res.data.filter(
            (r) =>
              r.user?._id === targetId ||
              r.user === targetId
          );

          setReels(userReels);
        } catch (err) {
          console.error(
            'Failed to fetch reels for profile:',
            err
          );
        } finally {
          setReelsLoading(false);
        }
      };

      fetchReelsForUser();
    };

    resolveAndFetch();
  }, [
    identifier,
    loggedInUser?._id,
    loggedInUser?.username,
  ]);

  useEffect(() => {
    if (
      activeTab !== 'saved' ||
      !isOwnProfile ||
      !loggedInUser?.token
    ) {
      return;
    }

    const fetchSavedData = async () => {
      setSavedLoading(true);

      try {
        if (savedTab === 'posts') {
          const res = await api.get('/users/saved');
          setSavedPosts(res.data || []);
        } else {
          const res = await api.get('/reels/saved');
          setSavedReels(res.data || []);
        }
      } catch (err) {
        console.error(
          'Failed to fetch saved content:',
          err
        );
      } finally {
        setSavedLoading(false);
      }
    };

    fetchSavedData();
  }, [
    activeTab,
    savedTab,
    isOwnProfile,
    loggedInUser?.token,
  ]);

  const fetchProfileData = async (targetId) => {
    try {
      const response = await api.get(`/users/${targetId}`);

      setProfileUser(response.data);

      if (!isOwnProfile) {
        setIsFollowing(
          response.data.followers?.some(
            (id) =>
              id?.toString() ===
              loggedInUser?._id?.toString()
          ) || false
        );
      }
    } catch (err) {
      console.error(
        'Failed to fetch profile:',
        err
      );
    }
  };

  const fetchUserPosts = async (targetId) => {
    try {
      setLoading(true);

      const response = await api.get('/posts');

      const myPosts = response.data.filter(
        (post) =>
          post.user?._id === targetId ||
          post.user === targetId
      );

      setUserPosts(myPosts);
    } catch (err) {
      console.error(
        'Error fetching posts:',
        err
      );
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setEditName(profileUser?.name || '');
    setEditBio(profileUser?.bio || '');
    setEditPicFile(null);
    setEditPicPreview(profileUser?.profilePic || null);
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditPicChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setEditPicFile(file);
      setEditPicPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async () => {
    setEditLoading(true);
    setEditError('');

    try {
      const formData = new FormData();

      formData.append('name', editName);
      formData.append('bio', editBio);

      if (editPicFile) {
        formData.append(
          'profilePic',
          editPicFile
        );
      }

      const res = await api.put(
        '/users/profile/update',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

      const updatedData = res.data;

      setProfileUser((prev) => ({
        ...prev,
        ...updatedData,
      }));

      updateUser(updatedData);

      setShowEditModal(false);
    } catch (err) {
      setEditError(
        err.response?.data?.message ||
          'Failed to update profile'
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profileUser?._id) return;

    setFollowLoading(true);

    try {
      await api.put(
        `/users/${profileUser._id}/follow`,
        {}
      );

      const currentlyFollowing = isFollowing;

      setIsFollowing(!currentlyFollowing);

      setProfileUser((prev) => {
        if (!prev) return prev;

        const currentFollowers =
          prev.followers || [];

        const currentUserId =
          loggedInUser?._id?.toString();

        if (currentlyFollowing) {
          return {
            ...prev,
            followers:
              currentFollowers.filter(
                (id) =>
                  id?.toString() !==
                  currentUserId
              ),
          };
        }

        return {
          ...prev,
          followers: [
            ...currentFollowers,
            loggedInUser._id,
          ],
        };
      });
    } catch (err) {
      console.error(
        'Follow error:',
        err
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!profileUser && !loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-2xl font-bold mb-2">
          User Not Found
        </h2>

        <p className="text-sm text-zinc-500 mb-6">
          The link you followed may be broken,
          or the user may have been removed.
        </p>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold text-white transition cursor-pointer"
        >
          Go back to Home
        </button>
      </div>
    );
  }

  const tabs = [
    {
      id: 'posts',
      label: 'POSTS',
      icon: <GridIcon />,
    },

    ...(isOwnProfile
      ? [
          {
            id: 'saved',
            label: 'SAVED',
            icon: <SavedIcon />,
          },
        ]
      : []),

    ...(reels && reels.length > 0
      ? [
          {
            id: 'reels',
            label: 'REELS',
            icon: <SavedIcon />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen text-white">

      <div className="px-6 md:px-8 pt-8 pb-6 max-w-[935px] mx-auto">

        <div className="flex items-start gap-8 md:gap-20">

          <div className="flex-shrink-0">

            <div className="w-[77px] h-[77px] md:w-[150px] md:h-[150px] rounded-full p-[3px] md:p-[4px] bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600">

              <div className="w-full h-full rounded-full bg-black p-[2px]">

                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-2xl md:text-5xl font-bold text-white overflow-hidden">

                  {profileUser?.profilePic ? (
                    <img
                      src={profileUser.profilePic}
                      alt={profileUser.username}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    profileUser?.username
                      ? profileUser.username[0].toUpperCase()
                      : 'U'
                  )}

                </div>

              </div>

            </div>

          </div>

          <div className="flex-1 min-w-0">

            <div className="flex flex-wrap items-center gap-4 mb-5">

              <div className="flex flex-col">

                <h1 className="text-xl font-normal text-white m-0">
                  {profileUser?.username}
                </h1>

                {profileUser?.name && (
                  <div className="text-sm text-zinc-400">
                    {profileUser.name}
                  </div>
                )}

              </div>

              {isOwnProfile ? (
                <>
                  <button
                    onClick={openEditModal}
                    className="px-5 py-1.5 rounded-lg bg-zinc-800 text-sm font-semibold text-white hover:bg-zinc-700 transition cursor-pointer"
                  >
                    Edit profile
                  </button>

                  <button
                    onClick={() =>
                      setShowArchiveModal(true)
                    }
                    className="px-5 py-1.5 rounded-lg bg-zinc-800 text-sm font-semibold text-white hover:bg-zinc-700 transition cursor-pointer"
                  >
                    View archive
                  </button>

                  <button
                    onClick={() =>
                      setShowSettings(true)
                    }
                    className="text-white hover:opacity-70 transition cursor-pointer"
                  >
                    <SettingsIcon />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`px-6 py-1.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                      isFollowing
                        ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {followLoading
                      ? '...'
                      : isFollowing
                      ? 'Following'
                      : 'Follow'}
                  </button>

                  <button
                    onClick={handleMessage}
                    disabled={chatLoading}
                    className="px-5 py-1.5 rounded-lg bg-zinc-800 text-sm font-semibold text-white hover:bg-zinc-700 transition cursor-pointer"
                  >
                    {chatLoading
                      ? '...'
                      : 'Message'}
                  </button>
                </>
              )}

            </div>

            <div className="hidden md:flex gap-10 mb-5 items-center">

              <div className="text-[15px]">
                <span className="font-semibold text-white">
                  {userPosts.length}
                </span>{' '}
                <span className="text-zinc-400">
                  posts
                </span>
              </div>

              <button
                onClick={() => {
                  setShowFollowingModal(false);
                  setShowFollowersModal(true);
                }}
                className="text-[15px] hover:opacity-70 transition cursor-pointer"
              >
                <span className="font-semibold text-white">
                  {profileUser?.followers?.length || 0}
                </span>{' '}
                <span className="text-zinc-400">
                  followers
                </span>
              </button>

              <button
                onClick={() => {
                  setShowFollowersModal(false);
                  setShowFollowingModal(true);
                }}
                className="text-[15px] hover:opacity-70 transition cursor-pointer"
              >
                <span className="font-semibold text-white">
                  {profileUser?.following?.length || 0}
                </span>{' '}
                <span className="text-zinc-400">
                  following
                </span>
              </button>

              {reelsLoading ? (
                <div className="text-[13px] text-zinc-500">
                  Checking reels…
                </div>
              ) : (
                reels &&
                reels.length > 0 && (
                  <div className="text-[15px]">
                    <span className="font-semibold text-white">
                      {reels.length}
                    </span>{' '}
                    <span className="text-zinc-400">
                      reels
                    </span>
                  </div>
                )
              )}

            </div>

            <div className="hidden md:block">

              <p className="text-sm font-semibold text-white">
                {profileUser?.name ||
                  profileUser?.username}
              </p>

              {profileUser?.bio && (
                <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">
                  {profileUser.bio}
                </p>
              )}

            </div>

          </div>

        </div>

        <div className="md:hidden mt-4">

          <p className="text-sm font-semibold text-white">
            {profileUser?.name ||
              profileUser?.username}
          </p>

          {profileUser?.bio && (
            <p className="text-sm text-zinc-300 mt-1">
              {profileUser.bio}
            </p>
          )}

        </div>

        <div className="md:hidden flex justify-around py-3 mt-4 border-t border-b border-zinc-800">

          <div className="flex flex-col items-center">

            <span className="text-sm font-semibold text-white">
              {userPosts.length}
            </span>

            <span className="text-xs text-zinc-500">
              posts
            </span>

          </div>

          <div className="flex flex-col items-center">

            <button
              onClick={() => {
                setShowFollowingModal(false);
                setShowFollowersModal(true);
              }}
              className="text-sm font-semibold text-white"
            >
              {profileUser?.followers?.length || 0}
            </button>

            <button
              onClick={() => {
                setShowFollowingModal(false);
                setShowFollowersModal(true);
              }}
              className="text-xs text-zinc-500"
            >
              followers
            </button>

          </div>

          <div className="flex flex-col items-center">

            <button
              onClick={() => {
                setShowFollowersModal(false);
                setShowFollowingModal(true);
              }}
              className="text-sm font-semibold text-white"
            >
              {profileUser?.following?.length || 0}
            </button>

            <button
              onClick={() => {
                setShowFollowersModal(false);
                setShowFollowingModal(true);
              }}
              className="text-xs text-zinc-500"
            >
              following
            </button>

          </div>

        </div>

      </div>

      <UserListModal
        open={showFollowersModal}
        onClose={() =>
          setShowFollowersModal(false)
        }
        title="Followers"
        userId={profileUser?._id}
        navigate={navigate}
      />

      <UserListModal
        open={showFollowingModal}
        onClose={() =>
          setShowFollowingModal(false)
        }
        title="Following"
        userId={profileUser?._id}
        navigate={navigate}
      />

      <div className="border-t border-zinc-800">

        <div className="max-w-[935px] mx-auto flex justify-center gap-0">

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`flex items-center gap-1.5 px-6 py-4 text-xs font-semibold tracking-widest transition cursor-pointer border-t ${
                activeTab === tab.id
                  ? 'border-white text-white -mt-px'
                  : 'border-transparent text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {tab.icon}

              <span>
                {tab.label}
              </span>
            </button>
          ))}

        </div>

      </div>

      <div className="max-w-[935px] mx-auto px-1">

        {activeTab === 'posts' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
              </div>
            ) : userPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">

                <div className="w-20 h-20 border-2 border-zinc-700 rounded-full flex items-center justify-center mb-4">

                  <svg
                    fill="currentColor"
                    height="40"
                    width="40"
                    viewBox="0 0 24 24"
                    className="text-zinc-600"
                  >
                    <path
                      d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557ZM2 18.605l3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905"
                      fill="none"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />

                    <path
                      d="M18.44 2.004H5.56a3.556 3.556 0 0 0-3.556 3.556v12.88a3.556 3.556 0 0 0 3.556 3.556h12.88a3.556 3.556 0 0 0 3.556-3.556V5.56a3.556 3.556 0 0 0-3.556-3.556Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>

                </div>

                <h2 className="text-[28px] font-extrabold text-white mb-1">
                  {isOwnProfile
                    ? 'Share Photos'
                    : 'No Posts Yet'}
                </h2>

                <p className="text-sm text-zinc-500">
                  {isOwnProfile
                    ? 'When you share photos, they will appear on your profile.'
                    : 'When this user shares photos, they will appear here.'}
                </p>

                {isOwnProfile && (
                  <button className="mt-4 text-sm font-semibold text-blue-500 hover:text-blue-400 transition cursor-pointer">
                    Share your first photo
                  </button>
                )}

              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 pb-12">

                {userPosts.map((post) => (
                  <div
                    key={post._id}
                    className="relative group cursor-pointer bg-zinc-900 overflow-hidden aspect-square"
                  >

                    {post.image ? (
                      <img
                        src={post.image}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-4">
                        <p className="text-xs text-zinc-400 text-center line-clamp-3">
                          {post.content ||
                            'No content'}
                        </p>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">

                      <div className="flex items-center gap-1.5">

                        <svg
                          fill="white"
                          height="20"
                          width="20"
                          viewBox="0 0 48 48"
                        >
                          <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5Z" />
                        </svg>

                        <span className="text-white font-bold text-sm">
                          {post.likes?.length || 0}
                        </span>

                      </div>

                      <div className="flex items-center gap-1.5">

                        <svg
                          fill="white"
                          height="20"
                          width="20"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                            fill="white"
                            stroke="white"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>

                        <span className="text-white font-bold text-sm">
                          {post.comments?.length || 0}
                        </span>

                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <>
            <div className="flex items-center justify-center gap-4 py-3 border-b border-zinc-800/80 mb-4">

              <button
                onClick={() =>
                  setSavedTab('posts')
                }
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
                  savedTab === 'posts'
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Saved Posts
              </button>

              <button
                onClick={() =>
                  setSavedTab('reels')
                }
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
                  savedTab === 'reels'
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Saved Reels
              </button>

            </div>

            {savedLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
              </div>
            ) : savedTab === 'posts' ? (
              savedPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">

                  <div className="w-20 h-20 border-2 border-zinc-700 rounded-full flex items-center justify-center mb-4">

                    <svg
                      fill="currentColor"
                      height="40"
                      width="40"
                      viewBox="0 0 24 24"
                      className="text-zinc-600"
                    >
                      <polygon
                        fill="none"
                        points="20 21 12 13.44 4 21 4 3 20 3 20 21"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>

                  </div>

                  <h2 className="text-[28px] font-extrabold text-white mb-1">
                    Saved Posts
                  </h2>

                  <p className="text-sm text-zinc-500 text-center max-w-xs">
                    Save photos and posts that you want to see again.
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 pb-12">

                  {savedPosts.map((post) => (
                    <div
                      key={post._id}
                      onClick={() =>
                        navigate(`/p/${post._id}`)
                      }
                      className="relative group cursor-pointer bg-zinc-900 overflow-hidden aspect-square"
                    >

                      {post.image ? (
                        <img
                          src={post.image}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center p-4">

                          <p className="text-xs text-zinc-400 text-center line-clamp-3">
                            {post.content ||
                              'No content'}
                          </p>

                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">

                        <div className="flex items-center gap-1.5">

                          <svg
                            fill="white"
                            height="20"
                            width="20"
                            viewBox="0 0 48 48"
                          >
                            <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5Z" />
                          </svg>

                          <span className="text-white font-bold text-sm">
                            {post.likes?.length || 0}
                          </span>

                        </div>

                        <div className="flex items-center gap-1.5">

                          <svg
                            fill="white"
                            height="20"
                            width="20"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                              fill="white"
                              stroke="white"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                          </svg>

                          <span className="text-white font-bold text-sm">
                            {post.comments?.length || 0}
                          </span>

                        </div>

                      </div>

                    </div>
                  ))}

                </div>
              )
            ) : savedReels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">

                <div className="w-20 h-20 border-2 border-zinc-700 rounded-full flex items-center justify-center mb-4">

                  <svg
                    fill="currentColor"
                    height="40"
                    width="40"
                    viewBox="0 0 24 24"
                    className="text-zinc-600"
                  >
                    <path d="m10 15 5-3-5-3v6Z" />
                  </svg>

                </div>

                <h2 className="text-[28px] font-extrabold text-white mb-1">
                  Saved Reels
                </h2>

                <p className="text-sm text-zinc-500 text-center max-w-xs">
                  Save reels that you want to watch again.
                </p>

              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 pb-12">

                {savedReels.map((reel) => (
                  <div
                    key={reel._id}
                    onClick={() =>
                      navigate('/reels')
                    }
                    className="relative group cursor-pointer bg-zinc-900 overflow-hidden aspect-[9/16]"
                  >

                    <video
                      src={reel.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">

                      <div className="flex items-center gap-1.5">

                        <svg
                          fill="white"
                          height="20"
                          width="20"
                          viewBox="0 0 48 48"
                        >
                          <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5Z" />
                        </svg>

                        <span className="text-white font-bold text-sm">
                          {reel.likes?.length || 0}
                        </span>

                      </div>

                      <div className="flex items-center gap-1.5">

                        <svg
                          fill="white"
                          height="20"
                          width="20"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                            fill="white"
                            stroke="white"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>

                        <span className="text-white font-bold text-sm">
                          {reel.comments?.length || 0}
                        </span>

                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </>
        )}

        {activeTab === 'reels' && (
          <>
            {reelsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
              </div>
            ) : reels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-zinc-500">
                  No reels yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 pb-12">

                {reels.map((r) => (
                  <div
                    key={r._id}
                    className="relative group cursor-pointer bg-zinc-900 overflow-hidden aspect-square flex items-center justify-center"
                  >
                    <video
                      src={r.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      controls={false}
                    />
                  </div>
                ))}

              </div>
            )}
          </>
        )}

        {activeTab === 'tagged' && (
          <div className="flex flex-col items-center justify-center py-16">

            <div className="w-20 h-20 border-2 border-zinc-700 rounded-full flex items-center justify-center mb-4">

              <svg
                fill="currentColor"
                height="40"
                width="40"
                viewBox="0 0 24 24"
                className="text-zinc-600"
              >
                <path
                  d="M10.201 3.797 12 1.997l1.799 1.8a1.59 1.59 0 0 0 1.124.465h2.18a1.59 1.59 0 0 1 1.59 1.59v2.18a1.59 1.59 0 0 0 .466 1.125L21 10.96v2.08l-1.841 1.803a1.59 1.59 0 0 0-.466 1.125v2.18a1.59 1.59 0 0 1-1.59 1.59h-2.18a1.59 1.59 0 0 0-1.124.466L12 22.003l-1.799-1.8a1.59 1.59 0 0 0-1.124-.465h-2.18a1.59 1.59 0 0 1-1.59-1.59v-2.18a1.59 1.59 0 0 0-.466-1.125L3 13.04v-2.08l1.841-1.803a1.59 1.59 0 0 0 .466-1.125v-2.18a1.59 1.59 0 0 1 1.59-1.59h2.18a1.59 1.59 0 0 0 1.124-.466Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>

            </div>

            <h2 className="text-[28px] font-extrabold text-white mb-1">
              Photos of you
            </h2>

            <p className="text-sm text-zinc-500 text-center max-w-xs">
              When people tag you in photos,
              they'll appear here.
            </p>

          </div>
        )}

      </div>

     

      {showEditModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center create-modal-overlay"
          onClick={() =>
            setShowEditModal(false)
          }
        >

          <div
            className="w-full max-w-[480px] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">

              <button
                onClick={() =>
                  setShowEditModal(false)
                }
                className="text-sm text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>

              <span className="text-base font-bold">
                Edit profile
              </span>

              <button
                onClick={handleEditSubmit}
                disabled={editLoading}
                className={`text-sm font-bold transition cursor-pointer ${
                  editLoading
                    ? 'text-blue-500/40'
                    : 'text-blue-500 hover:text-blue-400'
                }`}
              >
                {editLoading
                  ? 'Saving...'
                  : 'Done'}
              </button>

            </div>

            {editError && (
              <div className="px-5 py-2 text-xs bg-red-500/10 text-red-400">
                {editError}
              </div>
            )}

            <div className="flex flex-col items-center py-6 px-5 border-b border-zinc-800">

              <div className="w-[80px] h-[80px] rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-white overflow-hidden mb-4 border-2 border-zinc-700">

                {editPicPreview ? (
                  <img
                    src={editPicPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileUser?.username?.[0]?.toUpperCase() ||
                  'U'
                )}

              </div>

              <label className="text-sm font-bold text-blue-500 hover:text-blue-400 transition cursor-pointer">

                Change profile photo

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditPicChange}
                  className="hidden"
                />

              </label>

            </div>

            <div className="px-5 py-4 flex flex-col gap-4">

              <div>

                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">
                  Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) =>
                    setEditName(e.target.value)
                  }
                  placeholder="Name"
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-zinc-400 mb-1.5">
                  Bio
                </label>

                <textarea
                  value={editBio}
                  onChange={(e) =>
                    setEditBio(e.target.value)
                  }
                  placeholder="Bio"
                  rows="3"
                  maxLength={150}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition resize-none"
                />

                <span className="text-[11px] text-zinc-600 mt-1 block text-right">
                  {editBio.length}/150
                </span>

              </div>

            </div>

          </div>

        </div>
      )}

      {showSettings && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center create-modal-overlay"
          onClick={() =>
            setShowSettings(false)
          }
        >

          <div
            className="w-full max-w-[400px] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {[
              {
                label: 'Notifications',
                action: () => {
                  setShowSettings(false);
                  setShowFullSettingsModal(true);
                },
              },
              {
                label: 'Settings and Privacy',
                action: () => {
                  setShowSettings(false);
                  setShowFullSettingsModal(true);
                },
              },
              {
                label: 'Log Out',
                action: handleLogout,
                danger: true,
              },
              {
                label: 'Cancel',
                action: () =>
                  setShowSettings(false),
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className={`w-full py-3.5 text-sm text-center border-b border-zinc-800 last:border-b-0 transition cursor-pointer ${
                  item.danger
                    ? 'text-red-400 font-bold hover:bg-zinc-800'
                    : 'text-white hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </button>
            ))}

          </div>

        </div>
      )}

      {showFullSettingsModal && (
        <SettingsModal
          onClose={() =>
            setShowFullSettingsModal(false)
          }
        />
      )}

      {showArchiveModal && (
        <ArchiveModal
          onClose={() =>
            setShowArchiveModal(false)
          }
        />
      )}

    </div>
  );
}