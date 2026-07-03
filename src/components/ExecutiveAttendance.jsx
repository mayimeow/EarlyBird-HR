import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { CalendarSearch } from 'lucide-react'

export default function ExecutiveAttendance() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [employees, setEmployees] = useState([])
  const [masterLog, setMasterLog] = useState([])
  const [loading, setLoading] = useState(true)

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const yearOptions = [2024, 2025, 2026, 2027]

  useEffect(() => {
    fetchData()
  }, [selectedMonth, selectedYear])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Get all employees
      const { data: empData } = await supabase.from('dim_employees').select('*').order('department')
      setEmployees(empData || [])

      // Get logs for the month
      const startDate = `${selectedYear}-${('0' + (selectedMonth + 1)).slice(-2)}-01`
      const endDate = `${selectedYear}-${('0' + (selectedMonth + 1)).slice(-2)}-31` 

      const { data: logData } = await supabase.from('fact_attendance')
        .select('*')
        .gte('calendar_date', startDate)
        .lte('calendar_date', endDate)
      
      setMasterLog(logData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="p-6 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
          <CalendarSearch className="w-5 h-5 text-teal-600" /> Organizational Master Log
        </h3>
        <div className="flex gap-2 w-full md:w-auto">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="flex-1 md:flex-none px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none bg-white shadow-sm focus:ring-2 focus:ring-teal-500/50">
            {monthNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="flex-1 md:flex-none px-4 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none bg-white shadow-sm focus:ring-2 focus:ring-teal-500/50">
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Loading organization records...</div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <table className="w-max min-w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 w-56 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] pl-6">
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
                    <span className="block text-sm font-bold text-slate-900 truncate w-48">{emp.first_name} {emp.last_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium truncate w-48 block">{emp.department}</span>
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
  )
}