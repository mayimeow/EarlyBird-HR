import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react'

export default function RoleManager() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchDirectory()
  }, [])

  const fetchDirectory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('dim_employees')
        .select('*')
        .order('employment_status', { ascending: false }) // Sorts Active to top
        .order('first_name', { ascending: true })

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error fetching directory:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (employeeId, newRole) => {
    setProcessingId(employeeId)
    try {
      const { error } = await supabase
        .from('dim_employees')
        .update({ system_role: newRole })
        .eq('employee_id', employeeId)
      if (error) throw error
      
      setEmployees(employees.map(emp => emp.employee_id === employeeId ? { ...emp, system_role: newRole } : emp))
      setSuccessMsg(`Permissions updated.`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (error) {
      alert("Failed to update role: " + error.message)
    } finally {
      setProcessingId(null)
    }
  }

  const activeStaff = employees.filter(e => e.employment_status === 'Active')
  const inactiveStaff = employees.filter(e => e.employment_status !== 'Active')

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-150 flex flex-col">
      <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-600" /> System Permissions
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Manage administrative roles for active personnel.</p>
        </div>
        {successMsg && <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-sm font-bold border border-teal-100"><CheckCircle2 className="w-4 h-4" /> {successMsg}</div>}
      </div>

      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading security roster...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="p-5 pl-8 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Employee Name</th>
                <th className="p-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Work Email</th>
                <th className="p-5 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="p-5 pr-8 text-xs font-extrabold text-slate-500 uppercase tracking-wider">System Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* ACTIVE STAFF */}
              {activeStaff.map(emp => (
                <tr key={emp.employee_id} className="hover:bg-slate-50 transition">
                  <td className="p-5 pl-8 font-bold text-slate-900">{emp.first_name} {emp.last_name}</td>
                  <td className="p-5 text-sm font-medium text-slate-500">{emp.work_email}</td>
                  <td className="p-5 text-sm font-medium text-slate-500">{emp.department}</td>
                  <td className="p-5 pr-8">
                    <select 
                      value={emp.system_role} 
                      onChange={(e) => handleRoleChange(emp.employee_id, e.target.value)}
                      disabled={processingId === emp.employee_id}
                      className="w-full max-w-45 p-2.5 rounded-xl text-sm font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/50"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="HR">HR Admin</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </td>
                </tr>
              ))}
              
              {/* INACTIVE STAFF (Visual Separator) */}
              {inactiveStaff.length > 0 && (
                <>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <td colSpan="4" className="p-4 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Inactive / Former Employees
                    </td>
                  </tr>
                  {inactiveStaff.map(emp => (
                    <tr key={emp.employee_id} className="bg-slate-50/50 opacity-60">
                      <td className="p-5 pl-8 font-bold text-slate-500">
                        {emp.first_name} {emp.last_name}
                        <span className="ml-2 bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{emp.employment_status}</span>
                      </td>
                      <td className="p-5 text-sm font-medium text-slate-400">{emp.work_email}</td>
                      <td className="p-5 text-sm font-medium text-slate-400">{emp.department}</td>
                      <td className="p-5 pr-8 text-sm font-bold text-slate-400">---</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}