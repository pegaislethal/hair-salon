'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { authService } from '../services/authService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ResendVerificationFormProps {
  initialEmail?: string;
}

export function ResendVerificationForm({ initialEmail = '' }: ResendVerificationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setHasError(false);

    try {
      const result = await authService.resendVerificationEmail(email);
      setMessage(result.message);
    } catch (error) {
      const responseMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      setHasError(true);
      setMessage(responseMessage || 'We could not process your request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />
      <Button type="submit" variant="outline" isLoading={loading} className="w-full">
        Resend verification email
      </Button>
      {message && (
        <p role={hasError ? 'alert' : 'status'} className={`text-xs ${hasError ? 'text-rose-600' : 'text-zinc-600'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
