import { useState } from 'react'
import { supabase } from '../config/supabase'
import { UserPlus, Loader2, Building, MailCheck } from 'lucide-react'

export default function EmployeeOnboardingForm({ onSuccess }) {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    department: 'Engineering', 
    role: 'Employee', 
    hireDate: new Date().toISOString().split('T')[0] 
  })
  const [submitting, setSubmitting] = useState(false)
  
  // NEW: State to hold and display the generated credentials
  const [provisionedAccount, setProvisionedAccount] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    // Generate a secure, readable temporary password
    // e.g., "EB-X7K9P!"
    const tempPassword = "EB-" + Math.random().toString(36).slice(-5).toUpperCase() + "!"

    try {
      // 1. Create the secure Supabase Auth Account 
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: { 
          data: { 
            first_name: formData.firstName, 
            last_name: formData.lastName 
          } 
        }
      })
      
      if (authError) throw authError

      // 2. Add them to the active Company Directory
      const { error: dbError } = await supabase.from('dim_employees').insert([{
        employee_id: authData.user.id,
        first_name: formData.firstName, 
        last_name: formData.lastName, 
        work_email: formData.email, 
        department: formData.department, 
        system_role: formData.role, 
        hire_date: formData.hireDate,
        employment_status: 'Active'
      }])
      
      if (dbError) throw dbError

      // 3. Show the success screen with the credentials
      setProvisionedAccount({ 
        email: formData.email, 
        password: tempPassword,
        name: `${formData.firstName} ${formData.lastName}`
      })
      
      // Reset the form in the background
      setFormData({ firstName: '', lastName: '', email: '', department: 'Engineering', role: 'Employee', hireDate: new Date().toISOString().split('T')[0] })
      
      // Tell the parent component to refresh the directory list
      if (onSuccess) onSuccess()
      
    } catch (e) { 
      alert("Error provisioning account: " + e.message) 
    } finally { 
      setSubmitting(false) 
    }
  }

  // SUCCESS UI: This replaces the form after a successful registration
  if (provisionedAccount) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-teal-200 shadow-lg text-center animate-in fade-in">
        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-xl mb-2">Account Provisioned!</h3>
        <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
          <b>{provisionedAccount.name}</b> has been added to the directory. Please securely send them the login credentials below.
        </p>
        
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left mb-6 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Work Email</p>
            <div className="p-3 bg-white border border-slate-100 rounded-xl font-bold text-slate-900 text-sm">
              {provisionedAccount.email}
            </div>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Temporary Password</p>
            <div className="p-3 bg-white border border-slate-100 rounded-xl font-mono font-bold text-teal-600 text-lg text-center tracking-widest">
              {provisionedAccount.password}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setProvisionedAccount(null)} 
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-sm active:scale-[0.98]"
        >
          Register Another Employee
        </button>
      </div>
    )
  }

  // STANDARD REGISTRATION FORM
  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100"><Building className="w-5 h-5 text-teal-600" /></div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">New Hire Provisioning</h3>
          <p className="text-xs text-slate-500 font-medium">Auto-generates auth credentials.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Name</label>
          <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/50 outline-none transition font-bold text-slate-700 text-sm" required />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
          <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/50 outline-none transition font-bold text-slate-700 text-sm" required />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Work Email</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/50 outline-none transition font-bold text-slate-700 text-sm" required />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
          <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/50 outline-none transition font-bold text-slate-700 text-sm cursor-pointer">
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Operations">Operations</option>
            <option value="Human Resources">Human Resources</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">System Role</label>
          <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/50 outline-none transition font-bold text-slate-700 text-sm cursor-pointer">
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
            <option value="HR">HR Admin</option>
          </select>
        </div>

        <button type="submit" disabled={submitting} className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition flex justify-center items-center gap-2 shadow-sm active:scale-[0.98] mt-6">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />} 
          Provision Secure Account
        </button>
      </form>
    </div>
  )
}