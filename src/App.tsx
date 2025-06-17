import './index.css'
import { Routes, Route } from 'react-router-dom'
import { LoginForm } from '@/components/login-form'
import { AuthCallback } from '@/pages/AuthCallback'
import { Dashboard } from '@/pages/Dashboard'
import { ThemeProvider } from "@/components/theme-provider"
import { Profile } from '@/pages/Profile'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={
          <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-3xl">
              <LoginForm />
            </div>
          </div>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/Dashboard" element={<Dashboard />} />

      </Routes>
    </ThemeProvider>
  )
}

export default App