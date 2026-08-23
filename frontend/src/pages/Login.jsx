import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { email, password } = formData;

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
      const response = await api.post('/auth/login', formData);
      if (response.data) {
        login(response.data);
        const redirectTo = location.state?.from?.pathname || '/';
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email.trim() && password.trim().length >= 6;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <div className="w-full max-w-[350px] flex flex-col items-center">
        <div className="w-full border border-zinc-800 bg-black px-10 pt-10 pb-6 flex flex-col items-center">
          <h1 className="text-4xl font-semibold text-white mb-8 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            Instagram
          </h1>

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
              placeholder="Phone number, username, or email"
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
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full mt-2 py-[7px] rounded-lg text-sm font-semibold text-white transition ${
                isFormValid && !loading
                  ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                  : 'bg-blue-500/40 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 w-full my-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs font-semibold text-zinc-500 uppercase">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition">
            Forgot password?
          </Link>
        </div>

        <div className="w-full border border-zinc-800 bg-black px-10 py-5 mt-3 text-center">
          <p className="text-sm text-zinc-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 font-semibold hover:text-blue-400 transition">
              Sign up
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
