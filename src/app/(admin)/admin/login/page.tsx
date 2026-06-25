'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '../../../../actions/actions';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await loginAction(password);
      
      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-md font-sans">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">관리자 로그인</h1>
          <p className="mt-2 text-sm text-gray-500">비밀번호를 입력하세요</p>
        </div>

        {error && <p className="mb-4 text-center text-sm font-medium text-red-600 whitespace-pre-line">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            className="flex w-full justify-center rounded-md bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-800">
            ← Back to Blog Home
          </Link>
        </div>
      </div>
    </div>
  );
}