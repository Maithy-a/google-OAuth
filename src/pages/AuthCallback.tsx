import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleCallback() {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        navigate('/login', { state: { error: error.message } })
        return
      }
      if (data.session) {
        navigate('/dashboard')
      } else {
        navigate('/login', { state: { error: 'No session found' } })
      }
    }
    handleCallback()
  }, [navigate])

  return <div>Loading...</div>
}