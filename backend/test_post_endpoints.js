(async () => {
  const base = 'http://localhost:5002';
  const suffix = Date.now();
  const user = {
    name: 'Copilot Test',
    username: `copilot_test_${suffix}`,
    email: `copilot_test_${suffix}@example.com`,
    password: 'Password1!'
  };

  const results = [];
  function push(name, ok, info) { results.push({ name, ok, info }); }

  try {
    let r = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const reg = await r.json();
    push('register', r.ok, reg);

    r = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password })
    });
    const login = await r.json();
    push('login', r.ok, login);

    if (!r.ok) {
      console.log(JSON.stringify({ results, note: 'Login failed, aborting' }, null, 2));
      process.exit(0);
    }

    const token = login.token;
    const authHeader = { Authorization: 'Bearer ' + token };

    const fd = new FormData();
    fd.append('content', 'Hello from test script');
    r = await fetch(base + '/api/posts', { method: 'POST', headers: authHeader, body: fd });
    const created = await r.json();
    push('create post', r.ok, created);

    const postId = created._id || (created && created._id);
    if (!postId) {
      console.log(JSON.stringify({ results, note: 'Post not created, aborting' }, null, 2));
      process.exit(0);
    }

    r = await fetch(base + '/api/posts');
    const posts = await r.json();
    push('get posts', r.ok, { count: Array.isArray(posts) ? posts.length : null, sample: Array.isArray(posts) ? posts[0] : posts });

    r = await fetch(base + '/api/posts/timeline', { headers: authHeader });
    const timeline = await r.json();
    push('timeline', r.ok, { count: Array.isArray(timeline) ? timeline.length : null, sample: Array.isArray(timeline) ? timeline[0] : timeline });

    r = await fetch(base + `/api/posts/${postId}/like`, { method: 'PUT', headers: authHeader });
    const likeResp = await r.json();
    push('like post', r.ok, likeResp);

    r = await fetch(base + `/api/posts/${postId}/like`, { method: 'PUT', headers: authHeader });
    const unlikeResp = await r.json();
    push('unlike post', r.ok, unlikeResp);

    r = await fetch(base + `/api/posts/${postId}/comment`, { method: 'POST', headers: { ...authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Nice post!' }) });
    const commentResp = await r.json();
    push('add comment', r.ok, { len: Array.isArray(commentResp) ? commentResp.length : null, resp: commentResp });

    r = await fetch(base + `/api/posts/${postId}`, { method: 'PUT', headers: { ...authHeader, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'Edited content by test' }) });
    const editResp = await r.json();
    push('edit post', r.ok, editResp);

    r = await fetch(base + `/api/posts/${postId}`, { method: 'DELETE', headers: authHeader });
    const delResp = await r.json();
    push('delete post', r.ok, delResp);

  } catch (err) {
    push('exception', false, String(err));
  }

  console.log(JSON.stringify({ results }, null, 2));
})();
