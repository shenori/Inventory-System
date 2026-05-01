'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
        } catch {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'DM Sans', sans-serif; }

                .login-root {
                    min-height: 100vh;
                    background: #060810;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .bg-orb {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                }
                .orb1 {
                    width: 500px; height: 500px;
                    background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
                    top: -120px; right: -120px;
                }
                .orb2 {
                    width: 350px; height: 350px;
                    background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
                    bottom: -80px; left: -80px;
                }
                .bg-grid {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }

                .login-card {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 410px;
                    padding: 48px 40px;
                }

                .login-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 40px;
                }
                .brand-mark {
                    width: 38px; height: 38px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 18px; font-weight: 900;
                    color: #fff;
                    font-family: 'Syne', sans-serif;
                    box-shadow: 0 0 20px rgba(99,102,241,0.4);
                }
                .brand-name {
                    font-family: 'Syne', sans-serif;
                    font-weight: 700;
                    font-size: 17px;
                    color: #f1f5f9;
                    letter-spacing: -0.3px;
                }

                .login-eyebrow {
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 2px;
                    color: #6366f1;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }
                .login-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 28px;
                    font-weight: 800;
                    color: #f8fafc;
                    letter-spacing: -1px;
                    line-height: 1.2;
                    margin-bottom: 6px;
                }
                .login-sub {
                    font-size: 13px;
                    color: #475569;
                    margin-bottom: 32px;
                }

                .field { margin-bottom: 16px; }
                .field-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 500;
                    color: #64748b;
                    margin-bottom: 7px;
                    letter-spacing: 0.3px;
                    text-transform: uppercase;
                }
                .field-wrap { position: relative; }
                .field-icon {
                    position: absolute;
                    left: 13px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 15px;
                    opacity: 0.35;
                    pointer-events: none;
                }
                .field-input {
                    width: 100%;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 10px;
                    padding: 12px 16px 12px 40px;
                    font-size: 14px;
                    font-family: 'DM Sans', sans-serif;
                    color: #e2e8f0;
                    outline: none;
                    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
                }
                .field-input:focus {
                    border-color: #6366f1;
                    background: rgba(99,102,241,0.06);
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
                }
                .field-input::placeholder { color: #1e293b; }

                .forgot {
                    text-align: right;
                    margin-bottom: 24px;
                    margin-top: -4px;
                }
                .forgot a {
                    font-size: 12px;
                    color: #6366f1;
                    text-decoration: none;
                    transition: opacity 0.2s;
                }
                .forgot a:hover { opacity: 0.75; }

                .error-box {
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.2);
                    color: #f87171;
                    font-size: 13px;
                    padding: 12px 16px;
                    border-radius: 10px;
                    margin-bottom: 18px;
                }

                .submit-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border: none;
                    border-radius: 10px;
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    font-family: 'DM Sans', sans-serif;
                    letter-spacing: 0.3px;
                    cursor: pointer;
                    transition: opacity 0.2s, transform 0.1s;
                    box-shadow: 0 4px 24px rgba(99,102,241,0.35), 0 0 0 1px rgba(99,102,241,0.2);
                }
                .submit-btn:hover { opacity: 0.9; }
                .submit-btn:active { transform: scale(0.99); }
                .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 24px 0;
                }
                .divider-line {
                    flex: 1;
                    height: 1px;
                    background: rgba(255,255,255,0.07);
                }
                .divider-text {
                    font-size: 12px;
                    color: #334155;
                }

                .trust-badges {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                }
                .trust-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .trust-icon { font-size: 13px; }
                .trust-label { font-size: 11px; color: #334155; }
            `}</style>

            <div className="login-root">
                <div className="bg-orb orb1" />
                <div className="bg-orb orb2" />
                <div className="bg-grid" />

                <div className="login-card">
                    <div className="login-brand">
                        <div className="brand-mark">I</div>
                        <div className="brand-name">Inventory System</div>
                    </div>

                    <p className="login-eyebrow">Welcome back</p>
                    <h1 className="login-title">Sign in to your<br />account</h1>
                    <p className="login-sub">Manage your inventory with confidence</p>

                    {error && <div className="error-box">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label className="field-label">Email Address</label>
                            <div className="field-wrap">
                                <span className="field-icon">✉</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="field-input"
                                    placeholder="you@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label className="field-label">Password</label>
                            <div className="field-wrap">
                                <span className="field-icon">🔒</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="field-input"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="forgot">
                            <a href="#">Forgot password?</a>
                        </div>

                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? 'Signing in…' : 'Sign In →'}
                        </button>
                    </form>

                    <div className="divider">
                        <div className="divider-line" />
                        <span className="divider-text">secured access</span>
                        <div className="divider-line" />
                    </div>

                    <div className="trust-badges">
                        <div className="trust-item">
                            <span className="trust-icon">🔐</span>
                            <span className="trust-label">256-bit encrypted</span>
                        </div>
                        <div className="trust-item">
                            <span className="trust-icon">✅</span>
                            <span className="trust-label">Role-based access</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
