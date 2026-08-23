import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { name, username, email, password } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/register', formData);
      if (response.data) {
        login(response.data);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name.trim() && username.trim() && email.trim() && password.trim().length >= 6;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <div className="w-full max-w-[350px] flex flex-col items-center">
        <div className="w-full border border-zinc-800 bg-black px-10 pt-8 pb-6 flex flex-col items-center">
          <h1 className="text-4xl font-semibold text-white mb-3 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            Instagram
          </h1>

          <p className="text-zinc-500 text-center text-[15px] font-semibold mb-5 leading-tight">
            Sign up to see photos and videos from your friends.
          </p>

          {error && (
            <div className="w-full mb-4 p-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="w-full flex flex-col gap-2">
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Email address"
              className="w-full px-3 py-[9px] rounded-[4px] bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              required
            />
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="Full Name"
              className="w-full px-3 py-[9px] rounded-[4px] bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              required
            />
            <input
              type="text"
              name="username"
              value={username}
              onChange={onChange}
              placeholder="Username"
              className="w-full px-3 py-[9px] rounded-[4px] bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              required
            />
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Password"
              className="w-full px-3 py-[9px] rounded-[4px] bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              required
            />

            <p className="text-[11px] text-zinc-600 text-center mt-2 leading-relaxed">
              People who use our service may have uploaded your contact information to Instagram.{' '}
              <span className="text-zinc-500">Learn More</span>
            </p>
            <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
              By signing up, you agree to our{' '}
              <span className="text-zinc-500">Terms</span>,{' '}
              <span className="text-zinc-500">Privacy Policy</span> and{' '}
              <span className="text-zinc-500">Cookies Policy</span>.
            </p>

            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full mt-2 py-[7px] rounded-lg text-sm font-semibold text-white transition ${isFormValid && !loading
                  ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                  : 'bg-blue-500/40 cursor-not-allowed'
                }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                'Sign up'
              )}
            </button>
          </form>
        </div>

        <div className="w-full border border-zinc-800 bg-black px-10 py-5 mt-3 text-center">
          <p className="text-sm text-zinc-400">
            Have an account?{' '}
            <Link to="/login" className="text-blue-500 font-semibold hover:text-blue-400 transition">
              Log in
            </Link>
          </p>
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          <p className="text-sm text-zinc-400">Get the app.</p>
          <div className="flex gap-2">
            <div className="h-10 px-4 bg-zinc-900 rounded-lg flex items-center justify-center text-xs text-zinc-400 border border-zinc-800">
              App Store
            </div>
            <div className="h-10 px-4 bg-zinc-900 rounded-lg flex items-center justify-center text-xs text-zinc-400 border border-zinc-800">
              Google Play
            </div>
          </div>
        </div>

        <div className="mt-8 text-[11px] text-zinc-700 text-center leading-loose">
          <span>Meta · About · Blog · Jobs · Help · API · Privacy · Terms · Locations · Instagram Lite · Threads · Contact Uploading & Non-Users · Meta Verified</span>
          <p className="mt-4">© 2026 Instagram from Meta</p>
        </div>
      </div>
    </div>
  );
}