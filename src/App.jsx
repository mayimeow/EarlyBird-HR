import { useState, useEffect } from 'react'
import { supabase } from './config/supabase'
import Login from './pages/Login'
import EmployeeDashboard from './pages/EmployeeDashboard'
import HrDashboard from './pages/HrDashboard'
import ExecutiveDashboard from './pages/ExecutiveDashboard'

function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check for an active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchUserRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 2. Listen for log ins and log outs
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        // THE FIX: Turn loading back on so React waits for the database
        setLoading(true) 
        fetchUserRole(session.user.id)
      } else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 3. The Database Query: Ask Supabase what role this user has
  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('dim_employees')
        .select('system_role')
        .eq('employee_id', userId)
        .single()

      if (error) throw error
      
      setRole(data.system_role)
    } catch (error) {
      console.error("Error fetching user role:", error.message)
      // If there is an error or they aren't in the table yet, default to standard Employee
      setRole('Employee') 
    } finally {
      setLoading(false)
    }
  }

  // 4. Loading Screen (prevents flickering and race conditions)
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-xl font-bold text-slate-400 animate-pulse">
          Loading Workspace...
        </div>
      </div>
    )
  }

  // 5. Unauthenticated State
  if (!session) {
    return <Login />
  }
  if (role === 'Executive' || role === 'Manager') {
    return <ExecutiveDashboard session={session} />
  }
  // 6. The Traffic Controller: Route based on database role
  if (role === 'HR') {
    return <HrDashboard session={session} />
  }

  // Fallback to the standard Employee view
  return <EmployeeDashboard session={session} />
}

export default App