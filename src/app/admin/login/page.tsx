'use strict';
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  auth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from '@/lib/firebase';
import { translateFirebaseError } from '@/lib/admin-utils';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/admin/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('أدخل بريدك الإلكتروني أولاً.');
      return;
    }

    try {
      setErrorMsg('');
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg(translateFirebaseError(err));
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <img
          src="/assets/logo.png"
          alt="جذع"
          style={{ width: '60px', marginBottom: '10px' }}
        />
        <h2>تسجيل الدخول</h2>

        <form onSubmit={handleLogin} id="login-form">
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <div className="input-with-icon">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                id="toggle-pwd"
                title="إظهار/إخفاء"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>

          {errorMsg && (
            <div id="error-message" className="error-msg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                color: 'var(--success)',
                marginTop: '12px',
                fontSize: '0.9rem',
              }}
            >
              {successMsg}
            </div>
          )}

          <a
            id="forgot-password"
            className="forgot-link"
            onClick={handleForgotPassword}
          >
            نسيت كلمة المرور؟
          </a>
        </form>
      </div>
    </div>
  );
}
