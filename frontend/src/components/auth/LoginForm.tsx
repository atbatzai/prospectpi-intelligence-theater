'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ email, password });
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="detective-card max-w-md mx-auto mt-8 p-8">
      <div className="text-center mb-8">
        <h2 className="detective-text-primary text-2xl font-bold mb-2">
          ProspectPI Intelligence Theater
        </h2>
        <div className="credibility-badge">
          🔐 Secure Intelligence Access
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          <span className="font-medium">🚫 Authentication Failed:</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium detective-text-primary mb-2">
            🎯 Intelligence Officer Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-md focus:border-prospectpi-navy focus:ring-prospectpi-navy focus:ring-opacity-20"
            placeholder="agent@intelligence.theater"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium detective-text-primary mb-2">
            🔐 Security Clearance Code
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-md focus:border-prospectpi-navy focus:ring-prospectpi-navy focus:ring-opacity-20"
            placeholder="••••••••••••"
            required
          />
        </div>

        <Button
          type="submit"
          className="detective-button-primary w-full py-3 px-4 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!email || !password}
        >
          🚀 Access Intelligence Theater
        </Button>
        
        <div className="text-center mt-6">
          <p className="detective-text-secondary text-xs">
            🛡️ Trusted by intelligence professionals worldwide
          </p>
        </div>
      </form>
    </div>
  );
}