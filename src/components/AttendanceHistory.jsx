import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { Upload, AlertCircle, Loader2, X, CalendarSearch } from 'lucide-react'

export default function AttendanceHistory({ session }) {
  const [history, setHistory] = useState([])
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  
  // View Controls
  const [viewMode, setViewMode] = useState('month') // 'month' or 'year'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()) // 0 = Jan, 11 = Dec
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // Dispute Modal State
  const [disputingDate, setDisputingDate] = useState(null)
  const [proposedStatus, setProposedStatus] = useState('WFH')
  const [customStatus, setCustomStatus] = useState('')
  const [reason, setReason] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const yearOptions = [2024, 2025, 2026, 2027] // Expand as needed

  // Fetch data whenever the selected YEAR changes
  useEffect(() => {
    fetchData()
  }, [selectedYear])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch the whole year so month-toggling is instant
      const startDate = `${selectedYear}-01-01`
      const endDate = `${selectedYear}-12-31`

      const { data: attData, error: attErr } = await supabase
        .from('fact_attendance')
        .select('*')
        .eq('employee_id', session.user.id)
        .gte('calendar_date', startDate)
        .lte('calendar_date', endDate)

      if (attErr) throw attErr
      setHistory(attData || [])

      const { data: dispData, error: dispErr } = await supabase
        .from('fact_disputes')
        .select('*')
        .eq('employee_id', session.user.id)
        .order('created_at', { ascending: false })

      if (dispErr) throw dispErr
      setDisputes(dispData || [])
    } catch (error) {
      console.error("Error fetching records:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisputeSubmit = async (e) => {
    e.preventDefault()
    if (!proofFile) return alert("Please upload a file to support your dispute.")
    setSubmitting(true)

    try {
      const fileExt = proofFile.name.split('.').pop()
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
      const filePath = `disputes/${fileName}`

      const { error: uploadError } = await supabase.storage.from('attendance_proofs').upload(filePath, proofFile)
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('attendance_proofs').getPublicUrl(filePath)
      const finalStatus = proposedStatus === 'Others' ? customStatus : proposedStatus

      const { error: dbError } = await supabase.from('fact_disputes').insert([{
        employee_id: session.user.id, 
        disputed_date: disputingDate, 
        proposed_status: finalStatus, 
        reason: reason, 
        proof_url: publicUrlData.publicUrl, 
        status: 'Pending'
      }])
      if (dbError) throw dbError

      alert("Dispute submitted to HR.")
      setDisputingDate(null); setProofFile(null); setReason(''); setCustomStatus('')
      fetchData() // Refresh list
    } catch (error) {
      alert("Error submitting dispute: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- SPREADSHEET ENGINE ---
  const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  
  // If Month View, show exactly the days in that month. If Year View, show 1-31.
  const daysToRender = viewMode === 'month' 
    ? Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1)
    
  // If Month View, show only 1 row. If Year View, show all 12 rows.
  const monthsToRender = viewMode === 'month'
    ? [selectedMonth] 
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  const getWeekday = (monthIndex, dayIndex) => {
    const date = new Date(selectedYear, monthIndex, dayIndex)
    if (date.getMonth() !== monthIndex) return '' // Invalid date fallback
    return date.toLocaleDateString('en-US', { weekday: 'short' }) 
  }

  const getRecordForDate = (monthIndex, dayIndex) => {
    const monthStr = ('0' + (monthIndex + 1)).slice(-2)
    const dayStr = ('0' + dayIndex).slice(-2)
    const targetDate = `${selectedYear}-${monthStr}-${dayStr}`
    return history.find(record => record.calendar_date === targetDate)
  }

  const getStatusColor = (code) => {
    if (code === 'Office' || code === 'WFH') return 'bg-teal-100 text-teal-800 ring-teal-200'
    if (code === 'Absent') return 'bg-rose-100 text-rose-800 ring-rose-200'
    if (code === 'Leave') return 'bg-amber-100 text-amber-800 ring-amber-200'
    return 'bg-slate-100 text-slate-800 ring-slate-200'
  }

  return (
    <div className="space-y-8">
      
      {/* SPREADSHEET VIEW PANEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Advanced Filters Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <CalendarSearch className="w-5 h-5 text-teal-600" /> Attendance Spreadsheet
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Review your logs by specific dates. Click any logged cell to file an error report.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            {/* Dropdowns for Month & Year */}
            <div className="flex gap-2">
              <select 
                value={selectedMonth} 
                onChange={(e) => { setSelectedMonth(Number(e.target.value)); setViewMode('month'); }} 
                className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                {monthNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))} 
                className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Toggle View Mode */}
            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
              <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'month' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Month View</button>
              <button onClick={() => setViewMode('year')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'year' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Year View</button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-bold">Building spreadsheet data...</div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse min-w-200">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 w-24 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Month</th>
                  {daysToRender.map(day => (
                    <th key={day} className="p-2 text-center border-r border-slate-100 min-w-13.75">
                      <span className="block text-sm font-extrabold text-slate-700">{day}</span>
                      {/* Only show day names in Month View so the columns align perfectly */}
                      {viewMode === 'month' && (
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          {getWeekday(selectedMonth, day)}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthsToRender.map((mIndex) => (
                  <tr key={mIndex} className="hover:bg-slate-50/50 transition group">
                    <td className="p-3 text-sm font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
                      {monthNames[mIndex]}
                    </td>
                    {daysToRender.map(day => {
                      // Block out invalid dates (e.g., Feb 30th) in the Year View grid
                      const isValidDay = new Date(selectedYear, mIndex, day).getMonth() === mIndex
                      if (!isValidDay) return <td key={day} className="bg-slate-100/50 border-r border-slate-50"></td>

                      const record = getRecordForDate(mIndex, day)
                      const dayName = getWeekday(mIndex, day)

                      return (
                        <td key={day} className="p-1.5 text-center border-r border-slate-50 last:border-0 align-middle">
                          {record ? (
                            <button 
                              onClick={() => setDisputingDate(record.calendar_date)}
                              className={`w-full py-2 rounded-md text-[10px] font-bold truncate px-1 hover:ring-2 transition-all cursor-pointer ${getStatusColor(record.status_code)}`}
                              title={`${monthNames[mIndex]} ${day} (${dayName}): ${record.status_code}. Click to dispute.`}
                            >
                              {record.status_code}
                            </button>
                          ) : (
                            <span className="text-slate-200 text-xs font-medium" title={`${monthNames[mIndex]} ${day} (${dayName}): No Record`}>-</span>
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

      {/* DISPUTE HISTORY PANEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <h3 className="font-bold text-slate-900 text-lg mb-6">Dispute & Report History</h3>
        {disputes.length === 0 ? (
          <p className="text-sm text-slate-500 font-medium">You have no past reports or disputes.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {disputes.map(dispute => (
              <div key={dispute.id} className="flex flex-col p-5 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm gap-4 transition hover:border-slate-200">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Disputed</p>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide rounded-md border ${
                    dispute.status === 'Approved' || dispute.status === 'Acknowledged' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                    dispute.status === 'Denied' || dispute.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {dispute.status}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-900 mb-1">{dispute.disputed_date}</p>
                  <p className="text-sm text-slate-600 font-medium">Requested Change: <span className="font-bold text-teal-700">{dispute.proposed_status}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: FILE A DISPUTE */}
      {disputingDate && (
        <div className="fixed inset-0 bg-slate-900/40 z-60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-teal-600" /> File a Correction
              </h3>
              <button onClick={() => setDisputingDate(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleDisputeSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Disputed Date</label>
                <input type="text" value={disputingDate} disabled className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-bold" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Correct Status</label>
                <select value={proposedStatus} onChange={(e) => setProposedStatus(e.target.value)} className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none font-medium text-slate-700">
                  <option value="WFH">Should be WFH</option>
                  <option value="Office">Should be Office</option>
                  <option value="Sick Leave">Should be Sick Leave</option>
                  <option value="Others">Others (Specify)</option>
                </select>
              </div>

              {proposedStatus === 'Others' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Specify Status</label>
                  <input type="text" placeholder="e.g., Offsite Client Meeting" value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none font-medium text-sm text-slate-800" required />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Reason</label>
                <input type="text" placeholder="e.g., System failed to scan biometrics" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/50 outline-none font-medium text-sm text-slate-800" required />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Supporting Document</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setProofFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition cursor-pointer" required />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => {setDisputingDate(null); setProposedStatus('WFH')}} className="flex-1 py-3.5 font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 flex justify-center items-center gap-2 py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition disabled:opacity-70 shadow-sm active:scale-[0.98]">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />} Submit Error
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}