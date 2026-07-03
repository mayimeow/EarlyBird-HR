import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { Bird, BarChart3, Users, FileText, Calendar, LayoutDashboard, ShieldAlert, LogOut, TrendingUp, CalendarSearch } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExecutiveAttendance from '../components/ExecutiveAttendance'
import RoleManager from '../components/RoleManager'
import logo from '../assets/earlybird-logo.png'

export default function ExecutiveDashboard({ session }) {
  const [activeTab, setActiveTab] = useState('analytics')
  const [dateRange, setDateRange] = useState('today') // 'today', '7days', '30days'
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [metrics, setMetrics] = useState({
    totals: { total: 0, office: 0, wfh: 0, absent: 0 },
    pieData: [],
    barData: [],
    lineData: [], // NEW: For the trend chart
    rawData: [] 
  })

  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics()
  }, [dateRange, activeTab])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const endNode = new Date()
      const startNode = new Date()
      
      if (dateRange === '7days') startNode.setDate(endNode.getDate() - 7)
      if (dateRange === '30days') startNode.setDate(endNode.getDate() - 30)
      
      const endDate = endNode.toISOString().split('T')[0]
      const startDate = startNode.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('fact_attendance')
        .select(`calendar_date, status_code, dim_employees!inner (department, first_name, last_name)`)
        .gte('calendar_date', startDate)
        .lte('calendar_date', endDate)

      if (error) throw error

      let office = 0, wfh = 0, absent = 0
      const deptMap = {}
      const trendMap = {}

      data.forEach(record => {
        const status = record.status_code
        const dept = record.dim_employees.department
        const date = record.calendar_date

        // Totals
        if (status === 'Office') office++
        else if (status === 'WFH') wfh++
        else absent++

        // Department Bar Data
        if (!deptMap[dept]) deptMap[dept] = { department: dept, Office: 0, WFH: 0, Absent: 0 }
        if (status === 'Office') deptMap[dept].Office++
        else if (status === 'WFH') deptMap[dept].WFH++
        else deptMap[dept].Absent++

        // NEW: Trend Line Data
        if (!trendMap[date]) trendMap[date] = { date, Present: 0, Leave: 0 }
        if (status === 'Office' || status === 'WFH') trendMap[date].Present++
        else trendMap[date].Leave++
      })

      const pieData = [
        { name: 'In Office', value: office, color: '#0d9488' }, // Teal 600
        { name: 'Remote (WFH)', value: wfh, color: '#0ea5e9' }, // Sky 500
        { name: 'On Leave', value: absent, color: '#e11d48' }   // Rose 600
      ].filter(item => item.value > 0)

      const barData = Object.values(deptMap)
      const lineData = Object.values(trendMap).sort((a,b) => new Date(a.date) - new Date(b.date))

      setMetrics({ totals: { total: data.length, office, wfh, absent }, pieData, barData, lineData, rawData: data })
    } catch (error) {
      console.error("Error fetching analytics:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(22)
      doc.setTextColor(13, 148, 136) // Teal
      doc.text('EarlyBird Executive Report', 14, 22)
      doc.setFontSize(14)
      doc.setTextColor(15, 23, 42)
      const rangeText = dateRange === 'today' ? "Today's" : dateRange === '7days' ? '7-Day' : '30-Day'
      doc.text(`${rangeText} Workforce Analytics`, 14, 32)
      doc.setFontSize(11)
      doc.setTextColor(100, 116, 139)
      doc.text(`Total Records: ${metrics.totals.total}  |  Office: ${metrics.totals.office}  |  Remote: ${metrics.totals.wfh}  |  Leave: ${metrics.totals.absent}`, 14, 45)

      const tableBody = metrics.rawData.map(row => [
        row.calendar_date, `${row.dim_employees.first_name} ${row.dim_employees.last_name}`, row.dim_employees.department, row.status_code
      ])

      autoTable(doc, {
        startY: 55,
        head: [['Date', 'Employee', 'Department', 'Status']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] },
      })
      doc.save(`EarlyBird_Analytics_${dateRange}.pdf`)
    } catch (error) { alert("Failed to generate PDF: " + error.message) }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8fafc] font-sans text-slate-800">
      
      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 z-100 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><LogOut className="w-5 h-5 text-rose-500" /> Exit Portal</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">Are you sure you want to log out of the Executive panel?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition">Cancel</button>
              <button onClick={() => supabase.auth.signOut()} className="flex-1 py-3 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition">Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-lg font-extrabold text-slate-900">Executive</h1>
        </div>
        <button onClick={() => setShowLogoutConfirm(true)} className="text-rose-500 p-2"><LogOut className="w-5 h-5" /></button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-extrabold tracking-wide text-slate-900">EarlyBird</h1>
        </div>
        <div className="px-6 pb-4 mb-2 border-b border-slate-100">
          <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">C-Suite Admin</span>
          <p className="text-sm font-bold text-slate-700 truncate">{session.user.email}</p>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <BarChart3 className="w-4 h-4" /> Analytics & KPIs
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'attendance' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <CalendarSearch className="w-4 h-4" /> Master Spreadsheet
          </button>
          <button onClick={() => setActiveTab('access')} className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-colors ${activeTab === 'access' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ShieldAlert className="w-4 h-4" /> Role Management
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
        <header className="px-6 md:px-10 py-8 max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 capitalize">
              {activeTab === 'analytics' && 'Workforce Analytics'}
              {activeTab === 'attendance' && 'Master Spreadsheet'}
              {activeTab === 'access' && 'Access Control'}
            </h2>
            <p className="text-slate-500 font-medium mt-1">
              {activeTab === 'analytics' && 'High-level metrics and organizational insights.'}
              {activeTab === 'attendance' && 'Read-only view of the entire organization\'s attendance logs.'}
              {activeTab === 'access' && 'Super-admin powers to assign or revoke HR privileges.'}
            </p>
          </div>
          
          {activeTab === 'analytics' && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm w-full md:w-auto">
                <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none w-full">
                  <option value="today">Today</option><option value="7days">Last 7 Days</option><option value="30days">Last 30 Days</option>
                </select>
              </div>
              <button onClick={handleExportPDF} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm shrink-0">
                <FileText className="w-4 h-4" /> Export PDF
              </button>
            </div>
          )}
        </header>

        <div className="px-6 md:px-10 pb-12 max-w-7xl mx-auto w-full">
          
          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* KPI CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Total Logs</p>
                  <h3 className="text-3xl font-extrabold text-slate-900">{loading ? '-' : metrics.totals.total}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-teal-500">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">In Office</p>
                  <h3 className="text-3xl font-extrabold text-slate-900">{loading ? '-' : metrics.totals.office}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-sky-500">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Remote Work</p>
                  <h3 className="text-3xl font-extrabold text-slate-900">{loading ? '-' : metrics.totals.wfh}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-rose-500">
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">On Leave</p>
                  <h3 className="text-3xl font-extrabold text-slate-900">{loading ? '-' : metrics.totals.absent}</h3>
                </div>
              </div>

              {/* CHARTS ROW 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 flex flex-col h-87.5">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-teal-600" /> Distribution
                  </h3>
                  <div className="flex-1 w-full relative">
                    {loading ? <div className="absolute inset-0 flex items-center justify-center text-slate-400">Loading...</div> : metrics.pieData.length === 0 ? <div className="absolute inset-0 flex items-center justify-center text-slate-400">No data</div> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={metrics.pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            {metrics.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Stacked Bar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col h-87.5">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-500" /> Department Breakdown
                  </h3>
                  <div className="flex-1 w-full relative">
                    {loading ? <div className="absolute inset-0 flex items-center justify-center text-slate-400">Loading...</div> : metrics.barData.length === 0 ? <div className="absolute inset-0 flex items-center justify-center text-slate-400">No data</div> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                          <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                          <Legend iconType="circle" />
                          <Bar dataKey="Office" stackId="a" fill="#0d9488" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="WFH" stackId="a" fill="#0ea5e9" />
                          <Bar dataKey="Absent" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} name="On Leave" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

              {/* NEW CHART: TREND LINE */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-87.5">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" /> Daily Attendance Trend
                </h3>
                <div className="flex-1 w-full relative">
                  {loading ? <div className="absolute inset-0 flex items-center justify-center text-slate-400">Loading...</div> : metrics.lineData.length === 0 ? <div className="absolute inset-0 flex items-center justify-center text-slate-400">No data available for trend analysis.</div> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metrics.lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                        <Legend iconType="circle" />
                        <Line type="monotone" dataKey="Present" stroke="#0d9488" strokeWidth={3} dot={{r: 4, fill: '#0d9488', strokeWidth: 0}} activeDot={{r: 6}} />
                        <Line type="monotone" dataKey="Leave" stroke="#e11d48" strokeWidth={3} dot={{r: 4, fill: '#e11d48', strokeWidth: 0}} activeDot={{r: 6}} name="Absent/Leave" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: ATTENDANCE SPREADSHEET */}
          {activeTab === 'attendance' && <ExecutiveAttendance />}

          {/* TAB: ACCESS CONTROL */}
          {activeTab === 'access' && <RoleManager />}

        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1 p-3 flex-1 ${activeTab === 'analytics' ? 'text-teal-600' : 'text-slate-400'}`}>
          <BarChart3 className="w-5 h-5" /><span className="text-[10px] font-bold">Analytics</span>
        </button>
        <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center gap-1 p-3 flex-1 ${activeTab === 'attendance' ? 'text-teal-600' : 'text-slate-400'}`}>
          <CalendarSearch className="w-5 h-5" /><span className="text-[10px] font-bold">Logs</span>
        </button>
        <button onClick={() => setActiveTab('access')} className={`flex flex-col items-center gap-1 p-3 flex-1 ${activeTab === 'access' ? 'text-teal-600' : 'text-slate-400'}`}>
          <ShieldAlert className="w-5 h-5" /><span className="text-[10px] font-bold">Roles</span>
        </button>
      </nav>
    </div>
  )
}