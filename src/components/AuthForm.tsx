import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store';
import { Button } from './Button';
import { ErrorHandler } from './ErrorHandler';
import { FormInput } from './FormInput';
import { emailValidator, passwordValidator, nameValidator } from '../utils/validation';

export function AuthForm() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuthStore();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Form validation
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  
  const validateEmail = (email: string): boolean => {
    const result = emailValidator(email);
    setEmailError(result.valid ? null : result.message);
    return result.valid;
  };
  
  const validatePassword = (password: string): boolean => {
    const result = passwordValidator(password);
    setPasswordError(result.valid ? null : result.message);
    return result.valid;
  };
  
  const validateName = (name: string): boolean => {
    if (authMode === 'signup') {
      const result = nameValidator(name);
      setNameError(result.valid ? null : result.message);
      return result.valid;
    }
    setNameError(null);
    return true;
  };
  
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) throw error;
      
      // Navigate to dashboard on successful sign in
      // This will happen automatically via the auth state change
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };
  
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Validate form
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isNameValid = validateName(name);
    
    if (!isEmailValid || !isPasswordValid || (authMode === 'signup' && !isNameValid)) {
      return;
    }
    
    setEmailLoading(true);
    
    try {
      if (authMode === 'signin') {
        // Sign in with email and password
        const { error } = await signIn(email, password);
        
        if (error) throw error;
        
        // Navigate to dashboard on successful sign in
        navigate('/dashboard');
      } else {
        // Sign up with email and password
        const { error, user } = await signUp(email, password, name);
        
        if (error) throw error;
        
        if (user && !user.session) {
          // Email confirmation is required
          setSuccess('Please check your email for a confirmation link to complete your registration.');
        } else if (user && user.session) {
          // Auto-confirmed, navigate to complete profile
          navigate('/complete-profile');
        }
      }
    } catch (err) {
      console.error('Email auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div id="auth-form" className="w-full max-w-lg p-8 bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 transform transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF8A00]/10">
      <h2 className="text-3xl font-bold text-white mb-6 text-center tracking-tight">
        {authMode === 'signin' ? 'Sign In' : 'Create Account'}
      </h2>

      <div className="space-y-6">
        <ErrorHandler 
          error={error}
          onClose={() => setError(null)}
          className="mb-2"
        />
        
        {success && (
          <Alert 
            variant="success"
            message={success}
            onClose={() => setSuccess(null)}
            autoClose={10000}
          />
        )}
        
        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {authMode === 'signup' && !success && (
            <FormInput
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateName(e.target.value);
              }}
              label="Full Name"
              placeholder="Enter your full name"
              icon={User}
              error={nameError}
              validation={nameValidator}
              helpText="Your full name will be used for your profile"
              validation={emailValidator}
            />
          )}
          
          <FormInput
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) validateEmail(e.target.value);
            }}
            label="Email"
            placeholder="Enter your email"
            icon={Mail}
            error={emailError}
          />
          
          <div className="relative">
            <FormInput
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              label="Password"
              placeholder="Enter your password"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              error={passwordError}
              validation={passwordValidator}
              helpText={authMode === 'signup' ? "Password must be at least 6 characters" : undefined}
            />
            <button
              type="button"
              className="absolute right-3 top-[42px] text-gray-400 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            isLoading={emailLoading} 
            fullWidth
            className="mt-2"
          >
            {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>
        
        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-700 w-full"></div>
          <span className="bg-gray-800 px-3 text-gray-500 text-sm relative z-10">OR</span>
          <div className="border-t border-gray-700 w-full"></div>
        </div>
        
        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          isLoading={googleLoading}
          fullWidth
          onClick={handleGoogleSignIn}
          className="flex items-center justify-center gap-2 group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center font-medium">
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="mr-2 group-hover:scale-110 transition-transform">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Sign in with Google
          </span>
        </Button>

        {/* Switch between sign in and sign up */}
        <div className="text-center text-gray-400 text-sm mt-4">
          {authMode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setAuthMode('signup')}
                className="text-[#FF8A00] hover:text-[#E67A00] transition-colors"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setAuthMode('signin')}
                className="text-[#FF8A00] hover:text-[#E67A00] transition-colors"
              >
                Sign In
              </button>
            </>
          )}
        </div>

        <div className="text-center text-gray-400 text-sm mt-6">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-[#FF8A00] hover:text-[#E67A00] transition-colors" target="_blank">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-[#FF8A00] hover:text-[#E67A00] transition-colors" target="_blank">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}