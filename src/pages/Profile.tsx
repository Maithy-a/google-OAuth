import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { v4 as uuidv4 } from 'uuid'

export function Profile() {
    const [fullName, setFullName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const navigate = useNavigate()

    useEffect(() => {
        async function loadProfile() {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error || !user) {
                navigate('/')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single()

            setFullName(profile?.full_name || '')
            setAvatarUrl(profile?.avatar_url || user.user_metadata?.avatar_url || '')
            setEmail(user.email || '')
            setIsLoading(false)
        }

        loadProfile()
    }, [navigate])

    async function handleSave() {
        setStatus('Saving...')
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setStatus('User not found.')
            return
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                avatar_url: avatarUrl,
            })
            .eq('id', user.id)

        if (error) {
            setStatus('Error updating profile.')
        } else {
            setStatus('Profile updated successfully.')
        }
    }

    async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        const fileExt = file.name.split('.').pop() || 'png'
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError.message)
            setStatus('Failed to upload image.')
            return
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        setAvatarUrl(data.publicUrl)
        setStatus('Image uploaded! Don’t forget to save your profile.')
    }


    if (isLoading) return <div className="flex justify-center mt-10">Loading...</div>

    return (
        <div className="max-w-xl mx-auto mt-8 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={avatarUrl} alt="User avatar" />
                            <AvatarFallback>{fullName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            Upload New Avatar
                        </Button>
                    </div>
                    <div>
                        <Label htmlFor="email">Email (read-only)</Label>
                        <Input id="email" value={email} disabled className='mt-2' />
                    </div>
                    <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            className='mt-2'
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSave}>Save</Button>
                        {status && <p className="text-sm text-muted-foreground mt-2">{status}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
