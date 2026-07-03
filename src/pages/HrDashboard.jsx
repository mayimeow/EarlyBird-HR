import { useState } from 'react'
import { supabase } from '../config/supabase'
import { LayoutDashboard, Users, LogOut, ArrowRightLeft, ClipboardCheck, Building } from 'lucide-react'
import HrActionCenter from '../components/HrActionCenter'
import HrAttendanceBoard from '../components/HrAttendanceBoard'
import DirectoryManager from '../components/DirectoryManager'
import EmployeeDashboard from './EmployeeDashboard'
import logo from '../assets/earlybird-logo.png'

export default function HrDashboard({ session }) {
  const [activeTab, setActiveTab] = useState('action_center')
  const [viewMode, setViewMode] = useState('HR') // 'HR' or 'Employee'
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // 1. ROLE SWITCHER
  if (viewMode === 'Employee') {
    return (
      <div className="relative">
        <EmployeeDashboard session={session} />
        {/* Floating Button to Return to HR View */}
        <button 
          onClick={() => setViewMode('HR')} 
          className="fixed bottom-24 md:bottom-10 right-6 z-100 bg-teal-900 text-white px-6 py-4 rounded-full shadow-2xl font-bold flex gap-2 items-center hover:scale-105 hover:bg-teal-950 transition border-4 border-white"
        >
          <ArrowRightLeft className="w-5 h-5"/> Switch to HR Portal
        </button>
      </div>
    )
  }

  // 2. HR PORTAL UI
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      
      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 z-100 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><LogOut className="w-5 h-5 text-rose-500" /> Exit Portal</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">Are you sure you want to log out of the HR Admin panel?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition">Cancel</button>
              <button onClick={() => supabase.auth.signOut()} className="flex-1 py-3 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition">Log Out</button>
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
        <button onClick={() => setShowLogoutConfirm(true)} className="text-rose-500 p-2"><LogOut className="w-5 h-5" /></button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <img src={logo} alt="EarlyBird Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-extrabold tracking-wide text-slate-900">EarlyBird</h1>
        </div>
        <div className="px-6 pb-4 mb-2 border-b border-slate-100">
          <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">HR Administrator</span>
          <p className="text-sm font-bold text-slate-700 truncate">{session.user.email}</p>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('action_center')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'action_center' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard className="w-4 h-4" /> Action Center
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'attendance' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ClipboardCheck className="w-4 h-4" /> Attendance Board
          </button>
          <button onClick={() => setActiveTab('directory')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'directory' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Building className="w-4 h-4" /> Directory & Staff
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button onClick={() => setViewMode('Employee')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold rounded-lg transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> View My Profile
          </button>
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-24 md:pb-0">
        <header className="px-6 md:px-10 py-8 max-w-7xl mx-auto w-full">
          <h2 className="text-3xl font-extrabold text-slate-900 capitalize">
            {activeTab === 'action_center' && 'Action Center'}
            {activeTab === 'attendance' && 'Attendance Board'}
            {activeTab === 'directory' && 'Directory & Onboarding'}
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            {activeTab === 'action_center' && 'Manage pending leave requests, handle disputes, and view resolution history.'}
            {activeTab === 'attendance' && 'Log daily statuses and analyze the spreadsheet master log.'}
            {activeTab === 'directory' && 'Manage company roster and provision new employee accounts.'}
          </p>
        </header>

        <div className="px-6 md:px-10 pb-12 max-w-7xl mx-auto w-full">
          {activeTab === 'action_center' && <HrActionCenter />}
          {activeTab === 'attendance' && <HrAttendanceBoard />}
          {activeTab === 'directory' && <DirectoryManager />}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('action_center')} className={`flex flex-col items-center gap-1 p-3 flex-1 ${activeTab === 'action_center' ? 'text-teal-600' : 'text-slate-400'}`}>
          <LayoutDashboard className="w-5 h-5" /><span className="text-[10px] font-bold tracking-wide">Actions</span>
        </button>
        <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center gap-1 p-3 flex-1 ${activeTab === 'attendance' ? 'text-teal-600' : 'text-slate-400'}`}>
          <ClipboardCheck className="w-5 h-5" /><span className="text-[10px] font-bold tracking-wide">Board</span>
        </button>
        <button onClick={() => setActiveTab('directory')} className={`flex flex-col items-center gap-1 p-3 flex-1 ${activeTab === 'directory' ? 'text-teal-600' : 'text-slate-400'}`}>
          <Building className="w-5 h-5" /><span className="text-[10px] font-bold tracking-wide">Directory</span>
        </button>
        <button onClick={() => setViewMode('Employee')} className="flex flex-col items-center gap-1 p-3 flex-1 text-slate-400 hover:text-teal-600">
          <ArrowRightLeft className="w-5 h-5" /><span className="text-[10px] font-bold tracking-wide">My Portal</span>
        </button>
      </nav>
    </div>
  )
}