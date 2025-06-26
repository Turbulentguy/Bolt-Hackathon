// src/components/Login.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import DiscordCanary from '../assets/Discord_Canary.png';
import BoltBadge from '../assets/black_circle_360x360.png';

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
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Responsive Bolt.new Badge with Text Extension */}
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="group absolute top-4 right-4 sm:top-6 sm:right-6 z-10 transition-all duration-300 ease-in-out hover:scale-105"
        title="Built with bolt.new"
      >
        <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src={BoltBadge}
              alt="bolt.new"
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 transition-all duration-300"
            />
          </div>
          
          {/* Expandable Text */}
          <div className="overflow-hidden transition-all duration-300 ease-in-out w-0 group-hover:w-32 sm:group-hover:w-36 md:group-hover:w-40">
            <div className="px-3 py-2 whitespace-nowrap">
              <span className="text-gray-800 font-semibold text-xs sm:text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                Built with bolt.new
              </span>
            </div>
          </div>
        </div>
        
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-lg"></div>
      </a>

      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-4">
              <img src={DiscordCanary} alt="Discord Canary Logo" className="w-12 h-12" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your BOTCHANA account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-yellow-600 hover:to-orange-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <a
                href="/register"
                className="text-yellow-600 hover:text-orange-700 font-semibold transition-colors duration-200"
              >
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}