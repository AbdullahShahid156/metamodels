import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Cpu, ShieldCheck, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [resetStep, setResetStep] = useState(0); // 0=none, 1=email, 2=code
  const [verifyStep, setVerifyStep] = useState(false); // true = show OTP verification after signup
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (user) {
      if (user.email?.toLowerCase() === 'admin@metamodels.com') {
        navigate('/admin');
      } else {
        navigate('/marketplace');
      }
    }
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'buyer',
    resetCode: '',
    newPassword: '',
    verifyCode: ''
  });

  const handleChange = (e) => {
    setAuthError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setAuthError("Please enter your email first.");
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email);
      if (error) throw error;
      toast.success("Recovery code sent to your email");
      setResetStep(2);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: formData.resetCode,
        type: 'recovery'
      });
      if (verifyError) throw verifyError;
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });
      if (updateError) throw updateError;
      
      toast.success("Password updated successfully!");
      navigate('/marketplace');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle email verification OTP after signup
  const handleVerifySignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: formData.verifyCode,
        type: 'signup'
      });

      if (verifyError) throw verifyError;

      toast.success("Email verified! Signing you in...");

      // The verifyOtp will automatically sign the user in, but just in case:
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (signInError && signInError.message !== 'User already registered') throw signInError;
      
      navigate('/marketplace');
    } catch (err) {
      console.error("Verify error:", err);
      setAuthError(err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email
      });

      if (error) throw error;

      toast.success("New code sent to your email");
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      toast.error(err.message || "Failed to resend code");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        toast.success("Welcome back!");
        if (formData.email.toLowerCase() === 'admin@metamodels.com') {
          navigate('/admin');
        } else {
          navigate('/marketplace');
        }
      } else {
        // Register natively via Supabase client to trigger the automated verification email
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              display_name: formData.displayName,
              role: formData.role
            }
          }
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Please sign in instead.');
          }
          throw error;
        }

        toast.success("Verification code sent to your email!");
        
        // Switch to verification step
        setVerifyStep(true);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError(err.message || "An unexpected error occurred.");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[85vh] px-4 relative"
    >
      {/* Background orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E2B340]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#8B8CF8]/8 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center space-x-2.5 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E2B340] to-[#F59E0B] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <Cpu className="text-[#0C0F1A] h-5 w-5" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#E2B340] to-[#F59E0B] blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Meta<span className="gradient-text">Models</span>
            </span>
          </Link>
        </div>

        {/* Tab switcher — only show when NOT in verify or reset mode */}
        {resetStep === 0 && !verifyStep && (
          <div className="flex justify-center space-x-1 mb-8 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            <button 
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isLogin 
                  ? 'bg-white/[0.08] text-white shadow-sm' 
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button 
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                !isLogin 
                  ? 'bg-white/[0.08] text-white shadow-sm' 
                  : 'text-[#94a3b8] hover:text-white'
              }`}
              onClick={() => setIsLogin(false)}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="glass-card-static overflow-hidden">
          <AnimatePresence mode="wait">
            {/* ═══ EMAIL VERIFICATION STEP ═══ */}
            {verifyStep ? (
              <motion.div
                key="verifySignup"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <form onSubmit={handleVerifySignup} className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 rounded-full bg-[#E2B340]/15 flex items-center justify-center mb-4 border border-[#E2B340]/20">
                      <Mail className="text-[#F0D060]" size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Verify Your Email</h3>
                    <p className="text-sm text-[#64748b]">
                      We sent a verification code to{' '}
                      <span className="text-[#F0D060] font-medium">{formData.email}</span>
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3 bg-[#F87171]/10 border border-[#F87171]/20 text-[#f87171] rounded-xl text-sm">
                      {authError}
                    </div>
                  )}

                  <Input 
                    label="Verification Code" 
                    name="verifyCode"
                    type="text"
                    value={formData.verifyCode}
                    onChange={handleChange}
                    required
                    placeholder="Enter verification code"
                    maxLength={8}
                  />

                  <Button type="submit" className="w-full py-3 text-base gap-2" disabled={loading}>
                    <ShieldCheck size={18} />
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </Button>

                  <div className="text-center space-y-3 pt-2">
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0}
                      className={`text-sm transition-colors ${
                        resendCooldown > 0 
                          ? 'text-[#6B7280] cursor-not-allowed' 
                          : 'text-[#E2B340] hover:text-[#F0D060] cursor-pointer'
                      }`}
                    >
                      {resendCooldown > 0 
                        ? `Resend code in ${resendCooldown}s` 
                        : "Didn't receive the code? Resend"
                      }
                    </button>
                    <div>
                      <button 
                        type="button" 
                        onClick={() => { setVerifyStep(false); setAuthError(null); }}
                        className="text-sm text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
                      >
                        ← Back to Sign Up
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>

            /* ═══ FORGOT PASSWORD — STEP 1 ═══ */
            ) : resetStep === 1 ? (
              <motion.div
                key="forgotPassword"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleResetRequest} className="space-y-5">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
                    <p className="text-sm text-[#64748b]">Enter your email and we'll send you a recovery code.</p>
                  </div>

                  {authError && (
                    <div className="p-3 bg-[#F87171]/10 border border-[#F87171]/20 text-[#f87171] rounded-xl text-sm">
                      {authError}
                    </div>
                  )}

                  <Input 
                    label="Email" 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@domain.com"
                  />

                  <Button type="submit" className="w-full py-3 text-base" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Recovery Code'}
                  </Button>

                  <div className="text-center mt-4">
                    <button 
                      type="button" 
                      onClick={() => { setResetStep(0); setAuthError(null); }}
                      className="text-sm text-[#94a3b8] hover:text-white transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </motion.div>

            /* ═══ FORGOT PASSWORD — STEP 2 ═══ */
            ) : resetStep === 2 ? (
              <motion.div
                key="verifyCode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handlePasswordUpdate} className="space-y-5">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">Set New Password</h3>
                    <p className="text-sm text-[#64748b]">Enter the code sent to your email and choose a new password.</p>
                  </div>

                  {authError && (
                    <div className="p-3 bg-[#F87171]/10 border border-[#F87171]/20 text-[#f87171] rounded-xl text-sm">
                      {authError}
                    </div>
                  )}

                  <Input 
                    label="Verification Code" 
                    name="resetCode"
                    type="text"
                    value={formData.resetCode}
                    onChange={handleChange}
                    required
                    placeholder="Enter code"
                    maxLength={8}
                  />

                  <Input 
                    label="New Password" 
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                  />

                  <Button type="submit" className="w-full py-3 text-base mt-2" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password & Login'}
                  </Button>
                </form>
              </motion.div>

            /* ═══ LOGIN / REGISTER FORM ═══ */
            ) : (
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ x: isLogin ? -20 : 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: isLogin ? 20 : -20, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <form onSubmit={handleSubmit} className="space-y-5">
                  {authError && (
                    <div className="p-3 bg-[#F87171]/10 border border-[#F87171]/20 text-[#f87171] rounded-xl text-sm">
                      {authError}
                    </div>
                  )}
                  
                  {!isLogin && (
                    <Input 
                      label="Display Name" 
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                    />
                  )}
                  
                  <Input 
                    label="Email" 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@domain.com"
                  />

                  <div>
                    <Input 
                      label="Password" 
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                    />
                    {isLogin && (
                      <div className="flex justify-end mt-2">
                        <button 
                          type="button" 
                          onClick={() => { setResetStep(1); setAuthError(null); }}
                          className="text-xs text-[#E2B340] hover:text-[#F0D060] transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>

                  {!isLogin && (
                    <div className="space-y-2.5 pt-1">
                      <label className="text-sm font-medium text-[#94a3b8]">I want to:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['buyer', 'seller', 'both'].map((r) => (
                          <div 
                            key={r}
                            onClick={() => setFormData({ ...formData, role: r })}
                            className={`
                              cursor-pointer rounded-xl border p-3 text-center transition-all duration-200
                              ${formData.role === r 
                                ? 'border-[#E2B340]/40 bg-[#E2B340]/10 text-[#F0D060] shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                : 'border-white/[0.06] bg-white/[0.02] text-[#94a3b8] hover:border-white/[0.12] hover:bg-white/[0.04]'
                              }
                            `}
                          >
                            <span className="capitalize text-sm font-semibold">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full mt-6 py-3 text-base" disabled={loading}>
                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom text */}
        <p className="text-center text-xs text-[#64748b] mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </motion.div>
  );
};
