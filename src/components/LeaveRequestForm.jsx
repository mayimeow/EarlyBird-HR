import { useState } from 'react'
import { supabase } from '../config/supabase'
import { Send, Clock } from 'lucide-react'

export default function LeaveRequestForm({ session, onSuccess }) {
  const [leaveType, setLeaveType] = useState('Vacation Leave')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const calculateDates = (type, start) => {
    if (!start) return
    if (type === 'Maternity Leave') {
      const date = new Date(start)
      date.setDate(date.getDate() + 105) 
      setEndDate(date.toISOString().split('T')[0])
    } else if (type === 'Business Trip') {
      const date = new Date(start)
      date.setDate(date.getDate() + 3)
      setEndDate(date.toISOString().split('T')[0])
    } else {
      setEndDate('')
    }
  }

  const handleTypeChange = (e) => {
    const newType = e.target.value
    setLeaveType(newType)
    calculateDates(newType, startDate)
  }

  const handleStartChange = (e) => {
    const newStart = e.target.value
    setStartDate(newStart)
    calculateDates(leaveType, newStart)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase.from('fact_leaves').insert([{
        employee_id: session.user.id, leave_type: leaveType, start_date: startDate, end_date: endDate, reason: reason, status: 'Pending'
      }])
      if (error) throw error
      alert('Leave request submitted successfully!')
      setLeaveType('Vacation Leave'); setStartDate(''); setEndDate(''); setReason('')
      if (onSuccess) onSuccess() 
    } catch (error) {
      alert("Error submitting request: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">File New Request</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Leave Type</label>
          <select 
            value={leaveType} onChange={handleTypeChange}
            className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition font-medium text-slate-700"
            required
          >
            <option value="Vacation Leave">Vacation Leave</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Maternity Leave">Maternity Leave (105 Days)</option>
            <option value="Business Trip">Official Business Trip</option>
            <option value="Bereavement">Bereavement Leave</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
            <input type="date" value={startDate} onChange={handleStartChange} className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition font-medium text-slate-700" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition font-medium text-slate-700" required readOnly={leaveType === 'Maternity Leave'} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Reason / Notes</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition min-h-30 font-medium text-slate-700 resize-none" placeholder="Provide any relevant details for HR..." required></textarea>
        </div>

        <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-[0.99] mt-2">
          {submitting ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}