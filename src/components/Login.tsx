import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import DiscordCanary from '../assets/Discord_Canary.png';

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('Attempting to log in with:', { email, password })
      const success = await login(email, password)
      if (success) {
        navigate('/dashboard')
      } else {
        setError('Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient and blur effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/30 to-accent-500/30 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary-400/30 to-primary-400/30 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-accent-300/20 to-secondary-300/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow border-2 border-white/80 animate-pulse-slow">
                <img src={DiscordCanary} alt="Discord Canary Logo" className="w-10 h-10 drop-shadow-lg animate-float" />
              </div>
              <h1 className="text-3xl font-display font-extrabold text-gray-800 tracking-wide text-shadow" style={{letterSpacing: '0.04em'}}>
                BOTCHANA
              </h1>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-gray-800 bg-gradient-to-r from-primary-700 via-accent-700 to-secondary-700 inline-block text-transparent bg-clip-text">
                Welcome Back
              </h2>
              <p className="text-gray-600 leading-relaxed">Sign in to continue your research journey</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-glass rounded-3xl shadow-card p-8 border border-white/40 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-3 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent shadow-sm transition-all duration-200 bg-white/80"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-3 ml-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-400 focus:border-transparent shadow-sm transition-all duration-200 bg-white/80"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 animate-fadeIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-xl hover:shadow-purple-glow focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 text-gray-500 rounded-full">Don't have an account?</span>
                </div>
              </div>
              <Link
                to="/register"
                className="mt-4 inline-flex items-center space-x-2 text-accent-600 hover:text-accent-700 font-semibold transition-colors duration-200 group"
              >
                <span>Create your account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Secure login powered by Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}