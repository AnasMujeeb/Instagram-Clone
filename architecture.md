Instagram-Style Full-Stack Clone — Complete
Architecture
Purpose: Cursor Agent ke through existing project ko audit karke, jo features already complete hain unhein repeat kiye baghair
remaining functionality implement karna. Target stack: React + Vite + Tailwind/CSS + Node.js + Express + MongoDB + Socket.IO
+ Cloudinary.
1. Product Scope
Module
Required Features
Auth
Home Feed
Register, login, logout, session persistence, forgot/reset password, protected routes
Stories bar, posts, carousel, video, like, comment, share, save, infinite scroll, suggestions
Posts
Stories
Create/edit/delete, image/video upload, caption, hashtags, mentions, location, comments controls
Create/view, image/video/text, viewer, seen state, replies, likes, close friends, archive
Profile
Explore/Search
Posts/Reels/Tagged, followers/following, follow/request, bio, highlights, edit profile
User/hashtag/location search, recent searches, explore grid, recommended content
Reels
DM
Vertical feed, autoplay, like/comment/share/save, audio metadata, upload/create
Conversation list, real-time messages, typing, seen, reactions, media, shared posts/reels
Notifications
Saved
Likes, comments, follows, requests, mentions, tags, story/reel interactions
Save/unsave, collections, saved posts/reels
Social Graph
Settings
Follow/unfollow, private accounts, requests, remove follower, block, restrict
Profile, privacy, security, notifications, account controls, theme
Moderation
Admin
Report post/comment/user, admin review, delete/suspend/warn
Dashboard, users, posts, reels, reports, moderation, basic analytics
Responsive
Desktop, tablet, mobile navigation and layouts
2. Frontend Architecture
Pages: /, /login, /register, /forgot-password, /explore, /reels, /messages, /notifications, /search, /saved, /p/:postId, /reel/:reelId,
/profile/:username, /settings, /admin/*
Core components: Layout, Sidebar, MobileNavbar, Stories, StoryViewer, CreateStory, Post, PostHeader, PostMedia,
PostActions, Comments, CreatePost, ProfileHeader, PostGrid, Reel, ReelViewer, ChatList, ChatWindow, Message,
MessageInput, Search, Notifications, ShareModal, FollowersModal, ReportModal, EditProfile.
State: Use a consistent global store/context for auth, user/session, notifications and socket state. Keep local UI state inside
components. Avoid duplicating the same API/state logic in multiple places.
Data fetching: Centralize API calls in a service/API layer. Add loading, error and empty states. Use pagination/infinite scrolling for
feed, comments, search, notifications, followers and messages.
3. Backend Architecture
Express modules: auth, users, posts, comments, likes, follows, stories, highlights, reels, messages, notifications, saved,
hashtags, locations, reports, blocks/restrictions, admin.
Recommended layering: routes fi controllers fi services fi models/repositories. Keep business logic out of routes and avoid
giant controller files.
Middleware: JWT/session authentication, authorization, validation, upload handling, error handler, rate limiting, request logging
and security headers.
Realtime: Socket.IO namespaces/rooms for conversations. Events: message:new, message:seen, typing:start, typing:stop,
notification:new, presence:update. Do not duplicate REST and socket business logic; share services.
4. MongoDB Data Model
Model
User
Post
Important fields / relationships
_id, username, email, passwordHash, name, avatar, bio, isPrivate, verified, settings
author, media[], caption, hashtags[], mentions[], location, commentsEnabled, createdAt
Comment
Like
post, author, text, parentComment, likesCount, createdAt
user, targetType, targetId, createdAt; unique user+target index
Follow
FollowRequest
follower, following, status, createdAt; unique pair index
sender, receiver, status, createdAt
Story
Highlight
author, media, type, viewers[], expiresAt, createdAt
owner, title, cover, storyIds[]
Reel
Conversation
author, video, thumbnail, caption, audio, hashtags[], mentions[]
participants[], lastMessage, updatedAt
Message
Notification
conversation, sender, type, text/media, replyTo, reactions, seenBy, createdAt
recipient, actor, type, entityId, read, createdAt
Saved/Collection
Report
user, target, collectionId / collection owner and items
reporter, targetType, targetId, reason, status, reviewedBy
Block/Restriction
Session/Reset
user, target, type, createdAt
user, refresh/session metadata; password reset token + expiry
5. API Groups
• Auth: register, login, logout, refresh/session, forgot/reset password.
• Users: profile, edit profile, search, followers, following, suggestions, block/restrict.
• Posts: create, list feed, get, edit, delete, like/unlike, comments, share.
• Stories: create, list active, view, reply/like, delete, archive, highlights.
• Reels: create, feed, get, like/comment/share/save, audio lookup.
• Messages: conversations, history, send, react, reply, unsend/delete, seen.
• Notifications: list, mark read, unread count.
• Saved: save/unsave, collections.
• Explore: search users/hashtags/locations and recommended content.
• Admin: stats, users, content, reports, moderation.
6. Media / Storage
Use Cloudinary (or an equivalent object/media service) for images/videos. Store only URLs, public IDs and metadata in
MongoDB. Validate file type/size, generate thumbnails where needed, lazy-load media, and avoid storing large binary files directly
in MongoDB.
7. Security & Quality
• Hash passwords with bcrypt/argon2; never store plaintext passwords.
• Validate request bodies and IDs on the server.
• Protect private routes and admin routes with authorization checks.
• Rate-limit authentication and sensitive endpoints.
• Prevent users from editing/deleting content they do not own.
• Use unique indexes for username/email and relationship pairs.
• Handle upload failures and partial failures cleanly.
• Central error format so frontend can display useful errors.
• Never trust client-side role/admin flags.
• Keep secrets in environment variables; never commit .env.
8. Recommended Implementation Order
Phase
Build
0 — Audit
1 — Foundation
Inspect existing repo, run app, inspect routes/components/models/API, identify completed/partial/broken features.
Auth, layout, routing, user model, protected routes, API layer, base responsive shell.
2 — Core Social
3 — Stories
Profiles, posts, feed, likes, comments, follow system, search.
Story create/view/seen/reply, highlights.
4 — Explore/Reels
5 — Messaging
Explore grid, reels feed, reel creation/interactions.
Conversations, Socket.IO, typing, seen, reactions, media.
6 — Notifications
7 — Privacy/Safety
All interaction notifications + unread state.
Private accounts, requests, block, restrict, reports.
8 — Saved/Admin
9 — Polish
Collections, admin dashboard, moderation.
Responsive fixes, loading/error states, performance, accessibility, security, tests.
9. Cursor Agent — Audit-First Rules
• FIRST inspect the existing codebase. Do not start implementing from assumptions.
• Run the project and inspect the current UI/API/database behavior before changing code.
• Map every requested feature to one of: COMPLETE, PARTIAL, BROKEN, MISSING, or UNKNOWN.
• Reuse existing components, routes, models, services and utilities when correct.
• Do not recreate a feature that already works. Modify only what is necessary.
• Fix blockers and broken dependencies before adding new dependent features.
• After each logical module, test it and update the audit/status.
• Keep architecture consistent; do not introduce a new library when the existing stack can solve it.
• Do not rewrite large files just for style. Make focused changes.
• At the end, report exactly what was changed, what remains, and any manual setup required.
Important: This document describes an Instagram-style learning/portfolio clone. Do not ship Instagram's proprietary branding, assets or trademarks
as your own production product.