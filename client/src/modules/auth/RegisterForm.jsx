import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Input } from '../../components/index.js';

export function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'DISPATCHER',
    phone: '',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(formData);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
          {error}
        </div>
      )}

      <Input
        label="Full Name"
        name="fullName"
        placeholder="Alexander Mikhalkov"
        value={formData.fullName}
        onChange={handleChange}
        required
      />

      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="user@logistics.by"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <Input
        label="Password"
        name="password"
        type="password"
        placeholder="At least 6 characters"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Role
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="DISPATCHER">Dispatcher</option>
          <option value="DRIVER">Driver</option>
        </select>
      </div>

      <Input
        label="Phone (optional)"
        name="phone"
        placeholder="+375291112233"
        value={formData.phone}
        onChange={handleChange}
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Create Account
      </Button>

      {onSwitchToLogin && (
        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            Sign In
          </button>
        </p>
      )}
    </form>
  );
}

export default RegisterForm;
