import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { UserMinus, Users, ArchiveX, X, AlertTriangle } from 'lucide-react'
import EmployeeOnboardingForm from './EmployeeOnboardingForm'

export default function DirectoryManager() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('active')
  const [offboardTarget, setOffboardTarget] = useState(null)
  const [offboardReason, setOffboardReason] = useState('Resigned')

  useEffect(() => { fetchDirectory() }, [])

  const fetchDirectory = async () => {
    const { data } = await supabase.from('dim_employees').select('*').order('department', { ascending: true })
    setEmployees(data || [])
    setLoading(false)
  }

  const executeOffboard = async () => {
    await supabase.from('dim_employees').update({ employment_status: offboardReason }).eq('employee_id', offboardTarget.employee_id)
    setOffboardTarget(null)
    fetchDirectory()
  }

  const activeStaff = employees.filter(emp => emp.employment_status === 'Active')
  const formerStaff = employees.filter(emp => emp.employment_status !== 'Active')

  return (
    <div className="space-y-8">
      {offboardTarget && (
        <div className="fixed inset-0 bg-slate-900/40 z-110 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-500"/> Offboard Staff</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Specify reason for removing <b>{offboardTarget.first_name}</b>.</p>
            <select value={offboardReason} onChange={(e) => setOffboardReason(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl mb-6 font-bold text-slate-700 outline-none">
              <option value="Resigned">Resigned</option><option value="Retired">Retired</option><option value="Terminated">Terminated</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setOffboardTarget(null)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-50 rounded-xl transition">Cancel</button>
              <button onClick={executeOffboard} className="flex-1 py-3 font-bold text-white bg-rose-600 rounded-xl transition">Terminate</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <EmployeeOnboardingForm onSuccess={fetchDirectory} />
        </div>
        
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-175">
          <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-extrabold text-slate-900 text-xl">Company Roster</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button onClick={() => setViewMode('active')} className={`flex-1 sm:px-6 py-2 text-xs font-bold rounded-lg transition ${viewMode === 'active' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}>Active ({activeStaff.length})</button>
              <button onClick={() => setViewMode('former')} className={`flex-1 sm:px-6 py-2 text-xs font-bold rounded-lg transition ${viewMode === 'former' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500'}`}>Former ({formerStaff.length})</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {(viewMode === 'active' ? activeStaff : formerStaff).map(emp => (
              <div key={emp.employee_id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition">
                <div>
                  <p className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</p>
                  <p className="text-xs font-medium text-slate-500">{emp.department} • {emp.system_role}</p>
                </div>
                {viewMode === 'active' && <button onClick={() => setOffboardTarget(emp)} className="p-2 text-rose-400 hover:text-rose-600 bg-white shadow-sm border border-slate-100 rounded-xl transition"><UserMinus className="w-5 h-5" /></button>}
                {viewMode === 'former' && <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-tighter bg-rose-50 px-2 py-1 rounded">{emp.employment_status}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}