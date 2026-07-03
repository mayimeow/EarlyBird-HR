import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { Save, Loader2, CalendarSearch, ListChecks } from 'lucide-react'

export default function HrAttendanceBoard() {
  const [subTab, setSubTab] = useState('daily') // 'daily' or 'spreadsheet'
  
  // Daily State
  const [employees, setEmployees] = useState([])
  const [saving, setSaving] = useState(false)
  
  // Spreadsheet State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [masterLog, setMasterLog] = useState([])
  const [loadingSpreadsheet, setLoadingSpreadsheet] = useState(false)

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const yearOptions = [2024, 2025, 2026, 2027]

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (subTab === 'spreadsheet') fetchSpreadsheet()
  }, [subTab, selectedMonth, selectedYear])

  const fetchEmployees = async () => {
    const { data } = await supabase.from('dim_employees').select('*').eq('system_role', 'Employee').eq('employment_status', 'Active').order('department')
    setEmployees((data || []).map(emp => ({ ...emp, status: 'Office' })))
  }

  const handleBulkSubmit = async () => {
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const records = employees.map(emp => ({ employee_id: emp.employee_id, calendar_date: today, status_code: emp.status }))

    try {
      await supabase.from('fact_attendance').insert(records)
      alert("Today's logs locked securely in the database.")
    } catch (e) { alert(e.message) } finally { setSaving(false) }
  }

  const fetchSpreadsheet = async () => {
    setLoadingSpreadsheet(true)
    const startDate = `${selectedYear}-${('0' + (selectedMonth + 1)).slice(-2)}-01`
    const endDate = `${selectedYear}-${('0' + (selectedMonth + 1)).slice(-2)}-31` // OK for DB filtering

    const { data } = await supabase.from('fact_attendance')
      .select('*')
      .gte('calendar_date', startDate)
      .lte('calendar_date', endDate)
    
    setMasterLog(data || [])
    setLoadingSpreadsheet(false)
  }

  // --- SPREADSHEET ENGINE ---
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  
  const getWeekday = (dayIndex) => {
    const date = new Date(selectedYear, selectedMonth, dayIndex)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  const getRecord = (empId, dayIndex) => {
    const dayStr = ('0' + dayIndex).slice(-2)
    const targetDate = `${selectedYear}-${('0' + (selectedMonth + 1)).slice(-2)}-${dayStr}`
    return masterLog.find(r => r.employee_id === empId && r.calendar_date === targetDate)
  }

  const getStatusColor = (code) => {
    if (code === 'Office' || code === 'WFH') return 'bg-teal-100 text-teal-800'
    if (code === 'Absent') return 'bg-rose-100 text-rose-800'
    if (code === 'Leave' || code === 'Sick Leave') return 'bg-amber-100 text-amber-800'
    return 'bg-slate-100 text-slate-800'
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      
      {/* Sub-Navigation */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button onClick={() => setSubTab('daily')} className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-colors ${subTab === 'daily' ? 'text-teal-700 bg-white border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
          <ListChecks className="w-5 h-5" /> Daily Data Entry
        </button>
        <button onClick={() => setSubTab('spreadsheet')} className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-colors ${subTab === 'spreadsheet' ? 'text-teal-700 bg-white border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
          <CalendarSearch className="w-5 h-5" /> Master Spreadsheet
        </button>
      </div>

      <div className="p-0">
        {subTab === 'daily' ? (
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-500 font-medium">Review and commit statuses for today.</p>
              <button onClick={handleBulkSubmit} disabled={saving} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm transition disabled:opacity-70">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Logs
              </button>
            </div>
            
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr><th className="p-4 text-slate-500 text-xs uppercase font-bold pl-6">Employee Name</th><th className="p-4 text-slate-500 text-xs uppercase font-bold">Department</th><th className="p-4 text-slate-500 text-xs uppercase font-bold">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map(emp => (
                    <tr key={emp.employee_id} className="hover:bg-slate-50/50">
                      <td className="p-4 pl-6 font-bold text-slate-900">{emp.first_name} {emp.last_name}</td>
                      <td className="p-4 text-slate-500 text-sm">{emp.department}</td>
                      <td className="p-4">
                        <select value={emp.status} onChange={(e) => setEmployees(employees.map(item => item.employee_id === emp.employee_id ? {...item, status: e.target.value} : item))} className="w-full max-w-45 p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none">
                          <option value="Office">Office</option><option value="WFH">WFH</option><option value="Absent">Absent</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100">
              <p className="text-slate-500 font-medium text-sm">Full read-only database view.</p>
              <div className="flex gap-2">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none">
                  {monthNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none">
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {loadingSpreadsheet ? (
              <div className="p-12 text-center text-slate-400 font-medium">Generating spreadsheet...</div>
            ) : (
              <div className="overflow-x-auto pb-6">
                {/* Changed from w-full min-w-[1200px] to w-max min-w-full to prevent aggressive cell stretching */}
                <table className="w-max min-w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 w-48 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] pl-6">
                        Employee
                      </th>
                      {daysArray.map(day => (
                        <th key={day} className="p-1.5 text-center border-r border-slate-100 min-w-12 max-w-12 w-12">
                          <span className="block text-sm font-extrabold text-slate-700">{day}</span>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{getWeekday(day)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => (
                      <tr key={emp.employee_id} className="hover:bg-slate-50/50 transition group">
                        <td className="p-2 pl-6 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
                          <span className="block text-sm font-bold text-slate-900 truncate w-40">{emp.first_name} {emp.last_name}</span>
                          <span className="text-[10px] text-slate-400 font-medium truncate w-40 block">{emp.department}</span>
                        </td>
                        {daysArray.map(day => {
                          const record = getRecord(emp.employee_id, day)
                          return (
                            <td key={day} className="p-1 text-center border-r border-slate-50 align-middle">
                              {record ? (
                                <div className={`w-full py-1.5 rounded text-[9px] font-bold truncate px-0.5 mx-auto ${getStatusColor(record.status_code)}`} title={record.status_code}>
                                  {record.status_code.substring(0, 3).toUpperCase()}
                                </div>
                              ) : (
                                <span className="text-slate-200 text-xs">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}