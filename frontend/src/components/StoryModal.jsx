import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { API_URL } from '../config/env';

export default function StoryModal({ stories, initialIndex, currentUser, onClose }) {
  const props = arguments[0] || {};
  const onDelete = props.onDelete;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [subIndex, setSubIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const [showViewers, setShowViewers] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [localViewers, setLocalViewers] = useState([]);
  const trackedViewRef = useRef(new Set());
  const pendingViewRef = useRef(null);

  const currentGroup = stories?.[currentIndex];
  const storyList = currentGroup?.stories || (currentGroup?.image ? [currentGroup] : []);
  const activeStory = storyList[subIndex] || currentGroup;
  const storyUser = currentGroup?.user || activeStory?.user;

  const getImageUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    let formattedUrl = url.replace(/\\/g, '/');

    if (
      formattedUrl.startsWith('http://') || 
      formattedUrl.startsWith('https://') || 
      formattedUrl.startsWith('data:')
    ) {
      return formattedUrl;
    }

    const cleanPath = formattedUrl.startsWith('/') ? formattedUrl : `/${formattedUrl}`;
    return `${API_URL}${cleanPath}`;
  };

  const getStoryMedia = (story) => {
    const mediaUrl = story?.mediaUrl || story?.image || story?.imageUrl || story?.media || story?.url || story?.path || '';
    const rawMediaType = typeof story?.mediaType === 'string' ? story.mediaType.toLowerCase() : '';
    const mediaType = rawMediaType === 'video' || story?.videoUrl ? 'video' : rawMediaType === 'image' ? 'image' : 'image';

    return {
      mediaUrl,
      mediaType,
    };
  };

  useEffect(() => {
    setShowViewers(false);
    setProgress(0);
    setImgError(false);
    setLocalViewers(activeStory?.viewers || []);
  }, [currentIndex, subIndex, activeStory]);

  useEffect(() => {
    const storyId = activeStory?._id || activeStory?.id;
    const viewerId = currentUser?._id || currentUser?.id;
    const ownerId = storyUser?._id || activeStory?.user?._id;

    if (!storyId || !currentUser?.token || !viewerId) {
      return;
    }

    if (ownerId && viewerId && ownerId.toString() === viewerId.toString()) {
      setLocalViewers(activeStory?.viewers || []);
      return;
    }

    if (pendingViewRef.current === storyId || trackedViewRef.current.has(storyId)) {
      setLocalViewers(activeStory?.viewers || []);
      return;
    }

    pendingViewRef.current = storyId;

    api
      .put(`/stories/${storyId}/view`, {})
      .then((res) => {
        if (res.data?.viewers) {
          setLocalViewers(res.data.viewers);
        }
        trackedViewRef.current.add(storyId);
      })
      .catch((err) => console.error('Error marking view:', err))
      .finally(() => {
        if (pendingViewRef.current === storyId) {
          pendingViewRef.current = null;
        }
      });
  }, [currentIndex, subIndex, activeStory, storyUser, currentUser]);

  const storyMedia = getStoryMedia(activeStory);

  useEffect(() => {
    if (showViewers) return;

    if (storyMedia.mediaType === 'video') {
      return;
    }

    if (progress >= 100) {
      handleNext();
      return;
    }

    const timer = setTimeout(() => {
      setProgress((prev) => prev + 2);
    }, 100);

    return () => clearTimeout(timer);
  }, [progress, showViewers]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || storyMedia.mediaType !== 'video') return;

    const onTimeUpdate = () => {
      if (!videoEl.duration) return;
      const pct = Math.min(100, (videoEl.currentTime / videoEl.duration) * 100);
      setProgress(pct);
    };

    const onEnded = () => handleNext();

    videoEl.addEventListener('timeupdate', onTimeUpdate);
    videoEl.addEventListener('ended', onEnded);
    videoEl.play().catch(() => {});

    return () => {
      videoEl.pause?.();
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
      videoEl.removeEventListener('ended', onEnded);
      setProgress(0);
    };
  }, [activeStory]);

  const handleNext = () => {
    if (subIndex < storyList.length - 1) {
      setSubIndex((prev) => prev + 1);
    } else if (stories && currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSubIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (subIndex > 0) {
      setSubIndex((prev) => prev - 1);
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSubIndex(0);
    }
  };

  if (!activeStory && !currentGroup) return null;

  const storyImageUrl = getImageUrl(storyMedia.mediaUrl);
  const userProfilePic = getImageUrl(storyUser?.profilePic);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-[400px] h-[80vh] bg-zinc-900 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xl border border-zinc-800">
        
        <div className="absolute top-0 left-0 right-0 z-30 p-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex gap-1 w-full mb-3">
            {storyList.map((_, idx) => (
              <div key={idx} className="flex-1 bg-zinc-700/50 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-100 ease-linear"
                  style={{ 
                    width: idx < subIndex ? '100%' : idx === subIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                {userProfilePic ? (
                  <img src={userProfilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  storyUser?.username ? storyUser.username[0].toUpperCase() : 'U'
                )}
              </div>
              <span className="text-sm font-semibold text-white">
                {storyUser?.username || 'user'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {currentUser && storyUser && currentUser._id === storyUser._id && (
                <button
                  onClick={async () => {
                    const storyId = activeStory?._id || activeStory?.id;
                    if (!storyId) return;
                    if (!window.confirm('Delete this story?')) return;
                    try {
                      await api.delete(`/stories/${storyId}`);
                      if (typeof onDelete === 'function') onDelete(storyId);
                      else onClose();
                    } catch (err) {
                      console.error('Failed to delete story:', err);
                      alert('Failed to delete story');
                    }
                  }}
                  className="text-red-400 hover:text-red-300 p-1 text-sm font-semibold cursor-pointer z-40"
                >
                  Delete
                </button>
              )}

              <button 
                onClick={onClose}
                className="text-white hover:text-zinc-400 p-1 text-xl font-bold cursor-pointer z-40"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="w-full h-full flex items-center justify-center bg-black">
          {storyMedia.mediaType === 'video' ? (
            storyMedia.mediaUrl ? (
              <video
                ref={videoRef}
                src={getImageUrl(storyMedia.mediaUrl)}
                className="w-full h-full object-cover"
                muted
                playsInline
                controls={false}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-zinc-400 text-sm font-medium">Video failed to load</p>
              </div>
            )
          ) : (
            storyImageUrl && !imgError ? (
              <img 
                src={storyImageUrl} 
                alt="Story" 
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-zinc-400 text-sm font-medium">Image failed to load</p>
              </div>
            )
          )}
        </div>

        <div 
          onClick={handlePrev} 
          className="absolute left-0 top-16 bottom-16 w-1/3 z-20 cursor-pointer" 
        />
        <div 
          onClick={handleNext} 
          className="absolute right-0 top-16 bottom-16 w-2/3 z-20 cursor-pointer" 
        />

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between z-30">
          <button 
            onClick={() => setShowViewers(!showViewers)}
            className="flex items-center gap-2 text-xs font-semibold text-white bg-black/50 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 transition-all cursor-pointer"
          >
            <span>👁️ {localViewers.length} views</span>
            <span className="text-[10px] text-zinc-400">{showViewers ? '▲ Hide' : '▼ See who viewed'}</span>
          </button>
        </div>

        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-700 rounded-t-2xl z-40 p-4 flex flex-col transition-all duration-300">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>👁️ Viewers</span>
                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                  {localViewers.length}
                </span>
              </h3>
              <button 
                onClick={() => setShowViewers(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {localViewers.length > 0 ? (
                localViewers.map((viewer, idx) => {
                  const isObject = typeof viewer === 'object' && viewer !== null;
                  const displayName = isObject 
                    ? (viewer.username || viewer.name || 'User') 
                    : `User (${typeof viewer === 'string' ? viewer.slice(0, 6) : 'ID'})`;
                  const profilePic = isObject && viewer.profilePic 
                    ? getImageUrl(viewer.profilePic) 
                    : null;

                  return (
                    <div key={viewer?._id || idx} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg transition">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                        {profilePic ? (
                          <img src={profilePic} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          displayName?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <span className="text-xs font-medium text-zinc-200">{displayName}</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-zinc-500 text-xs py-8">
                  No views yet
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}