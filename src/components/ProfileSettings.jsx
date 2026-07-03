import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { UserCircle, ShieldCheck, KeyRound, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProfileSettings({ session }) {
  const [profile, setProfile] = useState({ first_name: '', last_name: '', department: '' })
  const [loading, setLoading] = useState(true)

  // Password State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('dim_employees')
        .select('first_name, last_name, department')
        .eq('employee_id', session.user.id)
        .single()

      if (error) throw error
      if (data) {
        setProfile({
          first_name: data.first_name || 'Not assigned',
          last_name: data.last_name || '',
          department: data.department || 'Unassigned'
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: 'error' })
      return
    }
    
    if (newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: 'error' })
      return
    }

    setUpdatingPassword(true)
    setMessage({ text: '', type: '' })

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      setMessage({ text: "Your password has been successfully updated.", type: 'success' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setUpdatingPassword(false)
    }
  }

  if (loading) return <div className="text-slate-400 font-medium py-8">Loading profile...</div>

  return (
    <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* PANEL 1: Identity (Read Only) */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-fit">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100">
            <UserCircle className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Employee Identity</h3>
            <p className="text-xs text-slate-500 font-medium">Official records mapped to your account.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold">
              {profile.first_name} {profile.last_name}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Work Email</label>
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold">
              {session.user.email}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-bold inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              {profile.department}
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium pt-2 italic">
            * Note: Name and department corrections must be requested directly through an HR administrator.
          </p>
        </div>
      </div>

      {/* PANEL 2: Security & Password */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-fit">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <KeyRound className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Security Settings</h3>
            <p className="text-xs text-slate-500 font-medium">Update your account password.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none font-medium text-slate-700 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none font-medium text-slate-700 transition"
              placeholder="••••••••"
              required
            />
          </div>

          {message.text && (
            <div className={`flex items-start gap-2 p-3.5 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-teal-50 text-teal-800 border border-teal-200'}`}>
              {message.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <span className="leading-relaxed">{message.text}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={updatingPassword}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm active:scale-[0.98] mt-2"
          >
            {updatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>

    </div>
  )
}