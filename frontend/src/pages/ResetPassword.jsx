import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.put(`/auth/reset-password/${token}`, { password });
      setMessage(response.data.message || 'Password reset successful.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = password.trim().length >= 6 && confirmPassword.trim().length >= 6;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <div className="w-full max-w-[350px] flex flex-col items-center">
        <div className="w-full border border-zinc-800 bg-black px-10 pt-10 pb-6 flex flex-col items-center">
          <h1 className="text-4xl font-semibold text-white mb-3 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            Instagram
          </h1>
          <p className="text-zinc-500 text-center text-[15px] font-semibold mb-5 leading-tight">
            Choose a new password for your account.
          </p>

          {error && (
            <div className="w-full mb-4 p-3 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-center">
              {error}
            </div>
          )}

          {message && (
            <div className="w-full mb-4 p-3 text-sm bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-center">
              {message}
            </div>
          )}

          <form onSubmit={onSubmit} className="w-full flex flex-col gap-2">
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-3 py-[9px] rounded-[4px] bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
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
                'Reset password'
              )}
            </button>
          </form>
        </div>

        <div className="w-full border border-zinc-800 bg-black px-10 py-5 mt-3 text-center">
          <p className="text-sm text-zinc-400">
            Back to{' '}
            <Link to="/login" className="text-blue-500 font-semibold hover:text-blue-400 transition">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
