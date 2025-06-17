import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { RadarChartComponent } from '@/components/charts/RadarChartComponent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PanelRightOpen, PanelLeftOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LogOut, User } from 'lucide-react'
import { ModeToggle } from '@/components/mode-toggle'

interface UserProfile {
  email: string
  full_name?: string
  avatar_url?: string
}

export function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true)
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!user) {
          navigate('/')
          return
        }

        // Get Google avatar from metadata
        const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') throw profileError

        // If avatar_url is not in the profile, update it from Google
        if (!profile?.avatar_url && googleAvatar) {
          await supabase
            .from('profiles')
            .update({ avatar_url: googleAvatar })
            .eq('id', user.id)
        }

        setUserProfile({
          email: user.email || '',
          full_name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email,
          avatar_url: profile?.avatar_url || googleAvatar,
        })
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [navigate])


  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false)
      }
    }
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSidebarOpen])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLogoutModalOpen(false)
    }
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>
  if (error) return <div className="flex min-h-screen items-center justify-center text-red-500">{error}</div>
  if (!userProfile) return null

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:static md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">KaasHub</h2>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <PanelRightOpen />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => {
              navigate('/dashboard')
              setIsSidebarOpen(false)
            }}>
            Dashboard
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => {
              navigate('/profile')
              setIsSidebarOpen(false)
            }}>
            Profile
          </Button>
        </nav>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}


      <div className="flex-1 flex flex-col">
        <header className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}>
              <PanelLeftOpen />
              <span className="sr-only">Open sidebar</span>
            </Button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile.avatar_url} />
                    <AvatarFallback>
                      {userProfile.full_name?.[0] || userProfile.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">
                    {userProfile.full_name || userProfile.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsLogoutModalOpen(true)}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl' >Welcome, {userProfile.full_name || userProfile.email}!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You’re logged in with: <span className="font-medium">{userProfile.email}</span>
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => navigate('/profile')}>Edit Profile</Button>
                <Button variant="destructive" onClick={() => setIsLogoutModalOpen(true)}>
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-card rounded-xl border p-4">
              <h3 className="text-lg font-semibold mb-2 text-foreground">Performance Overview A</h3>
              <RadarChartComponent />
            </div>
          </div>


        </main>
      </div>

      {/* Logout Dialog */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
