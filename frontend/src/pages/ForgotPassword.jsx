import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [devResetToken, setDevResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDevResetToken('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'If an account exists, reset instructions have been sent.');

      if (response.data.resetToken) {
        setDevResetToken(response.data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
      <div className="w-full max-w-[350px] flex flex-col items-center">
        <div className="w-full border border-zinc-800 bg-black px-10 pt-10 pb-6 flex flex-col items-center">
          <h1 className="text-4xl font-semibold text-white mb-3 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
            Instagram
          </h1>
          <p className="text-zinc-500 text-center text-[15px] font-semibold mb-5 leading-tight">
            Enter your email and we&apos;ll send you a link to get back into your account.
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
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
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
                'Send reset link'
              )}
            </button>
          </form>

          {devResetToken && (
            <div className="w-full mt-4 p-3 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300">
              <p className="font-semibold text-zinc-200 mb-2">Development only</p>
              <p className="mb-2 break-all">Reset token: {devResetToken}</p>
              <Link
                to={`/reset-password/${devResetToken}`}
                className="text-blue-500 font-semibold hover:text-blue-400 transition"
              >
                Continue to reset password
              </Link>
            </div>
          )}
        </div>

        <div className="w-full border border-zinc-800 bg-black px-10 py-5 mt-3 text-center">
          <p className="text-sm text-zinc-400">
            Remember your password?{' '}
            <Link to="/login" className="text-blue-500 font-semibold hover:text-blue-400 transition">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
