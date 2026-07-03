import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { Inbox, Check, X, CheckSquare, History, ExternalLink, AlertTriangle } from 'lucide-react'

export default function HrActionCenter() {
  const [subTab, setSubTab] = useState('pending') // 'pending' or 'history'
  
  const [leaves, setLeaves] = useState({ pending: [], resolved: [] })
  const [disputes, setDisputes] = useState({ pending: [], resolved: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch Leaves
      const { data: leavesData } = await supabase.from('fact_leaves').select('*, dim_employees(first_name, last_name, department)').order('created_at', { ascending: false })
      const pLeaves = leavesData.filter(l => l.status === 'Pending')
      const rLeaves = leavesData.filter(l => l.status !== 'Pending')

      // Fetch Disputes
      const { data: disputesData } = await supabase.from('fact_disputes').select('*, dim_employees(first_name, last_name, department)').order('created_at', { ascending: false })
      const pDisputes = disputesData.filter(d => d.status === 'Pending')
      const rDisputes = disputesData.filter(d => d.status !== 'Pending')

      setLeaves({ pending: pLeaves, resolved: rLeaves })
      setDisputes({ pending: pDisputes, resolved: rDisputes })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (table, id, newStatus, disputeData = null) => {
    const isConfirmed = window.confirm(`Are you sure you want to ${newStatus.toUpperCase()} this request?`)
    if (!isConfirmed) return

    try {
      await supabase.from(table).update({ status: newStatus }).eq('id', id)
      
      // If it's an approved dispute, fix the attendance record automatically
      if (table === 'fact_disputes' && newStatus === 'Approved' && disputeData) {
        await supabase.from('fact_attendance')
          .update({ status_code: disputeData.proposed_status })
          .eq('employee_id', disputeData.employee_id)
          .eq('calendar_date', disputeData.disputed_date)
      }
      
      alert(`Successfully marked as ${newStatus}`)
      fetchData() // Refresh UI
    } catch (error) {
      alert("Error processing action: " + error.message)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-150">
      
      {/* Sub-Navigation */}
      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button onClick={() => setSubTab('pending')} className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-colors ${subTab === 'pending' ? 'text-teal-700 bg-white border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
          <Inbox className="w-5 h-5" /> Pending Actions
          {(leaves.pending.length + disputes.pending.length) > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{leaves.pending.length + disputes.pending.length}</span>
          )}
        </button>
        <button onClick={() => setSubTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-colors ${subTab === 'history' ? 'text-teal-700 bg-white border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
          <History className="w-5 h-5" /> Resolution History
        </button>
      </div>

      <div className="p-6 md:p-8">
        {loading ? (
          <div className="text-center text-slate-400 py-12 font-medium">Loading records...</div>
        ) : subTab === 'pending' ? (
          <div className="space-y-8">
            
            {/* PENDING DISPUTES (High Priority) */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Open Disputes</h3>
              {disputes.pending.length === 0 ? <p className="text-sm text-slate-400 bg-slate-50 p-4 rounded-xl">No open disputes. Attendance records are clean.</p> : 
                <div className="space-y-4">
                  {disputes.pending.map(d => (
                    <div key={d.id} className="border border-amber-200 rounded-2xl p-6 bg-amber-50/30 flex flex-col lg:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-slate-900">{d.dim_employees.first_name} {d.dim_employees.last_name}</h4>
                          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded-md">Needs Correction</span>
                        </div>
                        <p className="text-slate-600 text-sm mb-3">Requested change to <strong>{d.proposed_status}</strong> for {d.disputed_date}</p>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm text-slate-600 italic mb-2">"{d.reason}"</div>
                        <a href={d.proof_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal-600 flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" /> View Proof</a>
                      </div>
                      <div className="flex w-full lg:w-auto gap-3 shrink-0">
                        <button onClick={() => handleAction('fact_disputes', d.id, 'Denied')} className="flex-1 lg:flex-none px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition">Deny</button>
                        <button onClick={() => handleAction('fact_disputes', d.id, 'Approved', d)} className="flex-1 lg:flex-none px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition">Fix Record</button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>

            {/* PENDING LEAVES */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Inbox className="w-5 h-5 text-teal-600" /> Leave Queue</h3>
              {leaves.pending.length === 0 ? <p className="text-sm text-slate-400 bg-slate-50 p-4 rounded-xl">You are all caught up on leave requests.</p> : 
                <div className="space-y-4">
                  {leaves.pending.map(l => (
                    <div key={l.id} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col lg:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-slate-900">{l.dim_employees.first_name} {l.dim_employees.last_name}</h4>
                          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md">{l.leave_type}</span>
                        </div>
                        <p className="text-slate-500 text-sm mb-3">Dates: {l.start_date} to {l.end_date || 'N/A'}</p>
                        <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic">"{l.reason}"</div>
                      </div>
                      <div className="flex w-full lg:w-auto gap-3 shrink-0">
                        <button onClick={() => handleAction('fact_leaves', l.id, 'Denied')} className="flex-1 lg:flex-none px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition">Deny</button>
                        <button onClick={() => handleAction('fact_leaves', l.id, 'Approved')} className="flex-1 lg:flex-none px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-sm">Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>

          </div>
        ) : (
          <div className="space-y-8">
            {/* RESOLUTION HISTORY */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckSquare className="w-5 h-5 text-teal-600" /> Processed Leaves</h3>
              {leaves.resolved.length === 0 ? <p className="text-sm text-slate-400">No history found.</p> : 
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {leaves.resolved.map(l => (
                    <div key={l.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{l.dim_employees.first_name} {l.dim_employees.last_name}</p>
                        <p className="text-xs text-slate-500">{l.leave_type} ({l.start_date})</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase ${l.status === 'Approved' ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              }
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckSquare className="w-5 h-5 text-teal-600" /> Resolved Disputes</h3>
              {disputes.resolved.length === 0 ? <p className="text-sm text-slate-400">No history found.</p> : 
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {disputes.resolved.map(d => (
                    <div key={d.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{d.dim_employees.first_name} {d.dim_employees.last_name}</p>
                        <p className="text-xs text-slate-500">Date: {d.disputed_date}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase ${d.status === 'Approved' ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-700'}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              }
            </div>

          </div>
        )}
      </div>
    </div>
  )
}