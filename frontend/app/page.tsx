'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { GradientButton } from '@/components/ui/GradientButton';
import { fetcher } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        const res = await fetcher('/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
        if (res.error) throw new Error(res.error);

        // Auto login after register or ask to login
        setIsRegistering(false);
        setError('Registration successful! Please login.');
      } else {
        const res = await fetcher('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (res.error) throw new Error(res.error);

        localStorage.setItem('user_id', res.id);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <GlassCard className="w-full max-w-md z-10 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2 text-gray-800 tracking-tight">HerSpace</h1>
        <p className="text-gray-500 mb-8">{isRegistering ? 'Join our community 🌸' : 'Welcome back 💖'}</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {isRegistering && (
            <Input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <GradientButton type="submit" className="w-full mt-4">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </GradientButton>
        </form>

        <div className="mt-6 text-sm text-gray-600">
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-pink-500 font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            {isRegistering ? 'Login' : 'Sign Up'}
          </button>
        </div>
      </GlassCard>
    </main>
  );
}
