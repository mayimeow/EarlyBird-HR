import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { CheckCircle2, Clock, XCircle, LayoutDashboard, History, LogOut, AlertTriangle, X, CalendarDays, TrendingUp, BarChart3, UserCircle } from 'lucide-react'
import LeaveRequestForm from '../components/LeaveRequestForm'
import AttendanceHistory from '../components/AttendanceHistory'
import ProfileSettings from '../components/ProfileSettings'
import logo from '../assets/earlybird-logo.png' 

export default function EmployeeDashboard({ session }) {
  const [activeTab, setActiveTab] = useState('overview') 
  const [myLeaves, setMyLeaves] = useState([])
  const [loadingLeaves, setLoadingLeaves] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    fetchMyLeaves()
  }, [])

  const fetchMyLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('fact_leaves')
        .select('*')
        .eq('employee_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyLeaves(data)
    } catch (error) {
      console.error("Error fetching personal leaves:", error.message)
    } finally {
      setLoadingLeaves(false)
    }
  }

  const executeLogout = async () => {
    await supabase.auth.signOut()
  }

  const getStatusBadge = (status) => {
    if (status === 'Approved') return <span className="flex items-center gap-1 text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md text-xs font-bold"><CheckCircle2 className="w-3 h-3" /> Approved</span>
    if (status === 'Denied') return <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-xs font-bold"><XCircle className="w-3 h-3" /> Denied</span>
    return <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-bold"><Clock className="w-3 h-3" /> Pending</span>
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      
      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Sign Out
              </h3>
              <button onClick={() => setShowLogoutConfirm(false)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-slate-500 text-sm mb-8 font-medium">Are you sure you want to end your session?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 px-4 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition">Cancel</button>
              <button onClick={executeLogout} className="flex-1 py-3 px-4 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm">Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE TOP HEADER */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src={logo} alt="EarlyBird Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-lg font-extrabold text-slate-900">EarlyBird</h1>
        </div>
        <button onClick={() => setShowLogoutConfirm(true)} className="text-rose-500 p-2">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <img src={logo} alt="EarlyBird Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-extrabold tracking-wide text-slate-900">EarlyBird</h1>
        </div>
        <div className="px-6 pb-4 mb-2 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account</p>
          <p className="text-sm font-bold text-teal-700 truncate">{session.user.email}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('time_off')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'time_off' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <CalendarDays className="w-4 h-4" /> Time Off
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'history' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <History className="w-4 h-4" /> Full Log
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <UserCircle className="w-4 h-4" /> Profile
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-24 md:pb-0">
        <header className="px-6 md:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            {activeTab === 'overview' && 'My Dashboard'}
            {activeTab === 'time_off' && 'Time Off & Requests'}
            {activeTab === 'history' && 'Attendance Log'}
            {activeTab === 'profile' && 'Account Profile'}
          </h2>
          <p className="text-slate-500 text-sm md:text-base font-medium mt-1">
            {activeTab === 'overview' && 'A high-level overview of your attendance metrics.'}
            {activeTab === 'time_off' && 'Manage your leave balances and file requests.'}
            {activeTab === 'history' && 'Review your logs in spreadsheet view and file disputes.'}
            {activeTab === 'profile' && 'View your official employee records and manage security.'}
          </p>
        </header>

        <div className="px-4 md:px-8 pb-12 max-w-6xl mx-auto w-full">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-teal-50 rounded-xl"><TrendingUp className="w-6 h-6 text-teal-600" /></div>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">+2.4%</span>
                  </div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Attendance Rate</p>
                  <h3 className="text-3xl font-extrabold text-slate-900">98.5%</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 rounded-xl"><Clock className="w-6 h-6 text-indigo-600" /></div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">On Track</span>
                  </div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Hours Logged (Week)</p>
                  <h3 className="text-3xl font-extrabold text-slate-900">32.5 <span className="text-lg text-slate-400 font-bold">/ 40</span></h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-amber-50 rounded-xl"><CalendarDays className="w-6 h-6 text-amber-600" /></div>
                  </div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Available Vacation</p>
                  <h3 className="text-3xl font-extrabold text-slate-900">15 <span className="text-lg text-slate-400 font-bold">Days</span></h3>
                </div>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-8">
                  <BarChart3 className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Weekly Activity Breakdown</h3>
                </div>
                <div className="flex items-end gap-2 sm:gap-6 h-48 w-full">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-3">
                      <div className={`w-full ${i === 4 ? 'bg-slate-100' : 'bg-teal-500'} rounded-t-lg transition-all`} style={{ height: i === 3 ? '80%' : i === 4 ? '100%' : '100%' }}></div>
                      <span className="text-xs font-bold text-slate-400">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: TIME OFF */}
          {activeTab === 'time_off' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <LeaveRequestForm session={session} onSuccess={fetchMyLeaves} />
              </div>
              <div className="space-y-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Leave Balances</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-slate-700">Vacation Leave (VL)</span><span className="text-teal-600">15 / 15</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-teal-500 h-2 rounded-full w-full"></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-slate-700">Sick Leave (SL)</span><span className="text-teal-600">12 / 15</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-teal-500 h-2 rounded-full w-4/5"></div></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-87.5">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 shrink-0">Recent Requests</h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {loadingLeaves ? <div className="text-slate-400 text-sm">Loading...</div> : myLeaves.length === 0 ? <div className="text-slate-400 text-sm">No recent requests.</div> : (
                      myLeaves.map((leave) => (
                        <div key={leave.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-900 text-sm">{leave.leave_type}</span>
                            {getStatusBadge(leave.status)}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">{leave.start_date} to {leave.end_date || 'N/A'}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && <AttendanceHistory session={session} />}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && <ProfileSettings session={session} />}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 p-3 flex-1 transition-colors ${activeTab === 'overview' ? 'text-teal-600' : 'text-slate-400'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide">Dash</span>
        </button>
        <button onClick={() => setActiveTab('time_off')} className={`flex flex-col items-center gap-1 p-3 flex-1 transition-colors ${activeTab === 'time_off' ? 'text-teal-600' : 'text-slate-400'}`}>
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide">Time Off</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-3 flex-1 transition-colors ${activeTab === 'history' ? 'text-teal-600' : 'text-slate-400'}`}>
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide">Logs</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 p-3 flex-1 transition-colors ${activeTab === 'profile' ? 'text-teal-600' : 'text-slate-400'}`}>
          <UserCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wide">Profile</span>
        </button>
      </nav>

    </div>
  )
}