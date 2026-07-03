import { useState } from 'react'
import { supabase } from '../config/supabase'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import logo from '../assets/earlybird-logo.png' 

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Custom validation to bypass the ugly browser default popup
    if (!email || !password) {
      setMessage({ text: "Please enter both your work email and password.", type: 'error' })
      return
    }

    setLoading(true)
    setMessage({ text: '', type: '' })

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Map cryptic Supabase errors to user-friendly text
      const errorMessage = error.message.includes("Invalid login") 
        ? "Invalid email or password. Please try again."
        : error.message
      
      setMessage({ text: errorMessage, type: 'error' })
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) {
      setMessage({ text: 'Please enter your email address first to receive a reset link.', type: 'error' })
      return
    }
    
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Password reset instructions have been sent to your email.', type: 'success' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* Left Column: Branding (Hidden on mobile/tablets) */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-700 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute -top-32 -left-32 w-125 h-125 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute -bottom-32 -right-32 w-125 h-125 bg-teal-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        
        {/* Restored Header: Logo set to size 18 and aligned with text */}
        <div className="relative z-10 flex items-center gap-4">
          <img src={logo} alt="EarlyBird Logo" className="w-18 h-18 object-contain" />
          <span className="text-2xl font-bold text-white tracking-wide">EarlyBird HR</span>
        </div>

        <div className="relative z-10 mb-16">
          <h1 className="text-6xl font-extrabold text-white mb-6 leading-[1.1]">
            Attendance <br /> made easy.
          </h1>
          <p className="text-teal-100 text-lg max-w-md leading-relaxed font-medium">
            The all-in-one workspace for enterprise attendance tracking, dispute resolution, and workforce analytics.
          </p>
        </div>
        
        <div className="relative z-10 text-teal-200/80 text-sm font-medium">
          © {new Date().getFullYear()} EarlyBird Enterprise. All rights reserved.
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 lg:bg-transparent lg:shadow-none lg:border-none lg:p-0">
          
          {/* Mobile Header (Only visible on small screens) */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-2 mb-10 text-center">
            <div className="flex items-center gap-3">
              <img src={logo} alt="EarlyBird Logo" className="w-18 h-18 object-contain" />
              <span className="text-3xl font-bold text-teal-700 tracking-wide">EarlyBird HR</span>
            </div>
            <p className="text-slate-500 font-bold mt-1 text-sm">Attendance made easy.</p>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500 font-medium">Please enter your credentials to access your account.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin} noValidate>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Work Email</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
            
            {/* Highly Polished Error/Success UI matching the app theme */}
            {message.text && (
              <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-semibold border ${message.type === 'error' ? 'bg-rose-50/80 text-rose-600 border-rose-200' : 'bg-teal-50/80 text-teal-700 border-teal-200'}`}>
                {message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 shrink-0 text-teal-500" />
                )}
                <span className="leading-relaxed mt-0.5">{message.text}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl hover:bg-teal-700 hover:shadow-md hover:shadow-teal-500/20 active:scale-[0.99] transition-all disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure Sign In'}
              </button>
            </div>
          </form>
          
        </div>
      </div>

    </div>
  )
}