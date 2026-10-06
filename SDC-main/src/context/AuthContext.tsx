import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { classifyEmail, validatePassword, isUniversityEmail } from '@/lib/authRules'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  memberType?: 'university' | 'external'
  approvalStatus: 'approved' | 'pending' | 'rejected'
  joinedAt: string
  avatarUrl?: string
  bio?: string
  githubUrl?: string
  linkedinUrl?: string
  discordTag?: string
  phone?: string
  dept?: string
  year?: string
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isAdmin: boolean
  login: (
    email: string,
    password: string,
    captchaToken: string
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>
  register: (
    name: string,
    email: string,
    password: string,
    customRole?: 'admin' | 'member',
    captchaToken?: string
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean; message?: string }>
  resendConfirmation: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>
  updateProfilePhoto: (photoUrl: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: {
    name?: string
    avatarUrl?: string
    bio?: string
    githubUrl?: string
    linkedinUrl?: string
    discordTag?: string
    phone?: string
    dept?: string
    year?: string
  }) => Promise<{ success: boolean; error?: string }>
  checkApprovalStatus: () => Promise<'approved' | 'pending' | 'rejected'>
  logout: () => Promise<void>
}

const STORAGE_KEY = 'sdc_auth_user'

async function mapSupabaseUser(sbUser: SupabaseUser): Promise<User> {
  const metadata = sbUser.user_metadata || {}
  const email = sbUser.email || ''

  // 1. Fetch authoritative profile row directly from database table public.profiles
  let dbProfile: any = null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, approval_status, member_type')
      .eq('id', sbUser.id)
      .maybeSingle()
    if (!error && data) {
      dbProfile = data
    }
  } catch (err) {
    console.warn('Could not load profile from table:', err)
  }

  // 2. Fallback check API status if profile was missing locally
  let apiStatus: any = null
  if (!dbProfile && (sbUser.id || email)) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/status`, {
        headers,
        credentials: 'omit',
      })
      if (res.ok) {
        apiStatus = await res.json()
      }
    } catch (e) {}
  }

  // 3. Database table & server status are strictly authoritative (never trusting user_metadata)
  const role: 'admin' | 'member' = dbProfile?.role || apiStatus?.role || 'member'
  const approvalStatus: 'approved' | 'pending' | 'rejected' =
    dbProfile?.approval_status || apiStatus?.approval_status || 'pending'
  const isUniv = isUniversityEmail(email)
  const memberType: 'university' | 'external' =
    dbProfile?.member_type || apiStatus?.member_type || (isUniv ? 'university' : 'external')
  const name =
    dbProfile?.full_name ||
    metadata.name ||
    email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const joinedAt = sbUser.created_at ? sbUser.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
  const avatarUrl = metadata.avatar_url || metadata.picture || (typeof window !== 'undefined' ? localStorage.getItem(`sdc_avatar_${sbUser.id}`) || undefined : undefined)
  const bio = metadata.bio || (typeof window !== 'undefined' ? localStorage.getItem(`sdc_bio_${sbUser.id}`) || undefined : undefined)
  const githubUrl = metadata.github_url || (typeof window !== 'undefined' ? localStorage.getItem(`sdc_github_${sbUser.id}`) || undefined : undefined)
  const linkedinUrl = metadata.linkedin_url || (typeof window !== 'undefined' ? localStorage.getItem(`sdc_linkedin_${sbUser.id}`) || undefined : undefined)
  const discordTag = metadata.discord_tag || (typeof window !== 'undefined' ? localStorage.getItem(`sdc_discord_${sbUser.id}`) || undefined : undefined)
  const phone = metadata.phone || (typeof window !== 'undefined' ? localStorage.getItem(`sdc_phone_${sbUser.id}`) || undefined : undefined)
  const dept = metadata.dept || (typeof window !== 'undefined' ? localStorage.getItem(`sdc_dept_${sbUser.id}`) || undefined : undefined)
  const year = metadata.year || (typeof window !== 'undefined' ? localStorage.getItem(`sdc_year_${sbUser.id}`) || undefined : undefined)

  return {
    id: sbUser.id,
    name,
    email,
    role,
    memberType,
    approvalStatus,
    joinedAt,
    avatarUrl,
    bio,
    githubUrl,
    linkedinUrl,
    discordTag,
    phone,
    dept,
    year,
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse cached auth user', e)
      }
    }
    return null
  })

  // Sync Supabase Auth session on mount and subscribe to changes
  useEffect(() => {
    let isMounted = true

    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return
      if (session?.user) {
        const mapped = await mapSupabaseUser(session.user)
        if (isMounted) {
          setUser(mapped)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
        }
      }
    }).catch((err) => {
      console.warn('Supabase getSession error:', err)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
      if (!isMounted) return
      if (session?.user) {
        const mapped = await mapSupabaseUser(session.user)
        if (isMounted) {
          setUser(mapped)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
        }
      } else {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (
    email: string,
    password?: string,
    captchaToken?: string
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' }
    }

    if (!password) {
      return { success: false, error: 'Password is required to sign in.' }
    }

    // Password length validation (minimum 8 characters)
    const passCheck = validatePassword(password)
    if (!passCheck.valid) {
      return { success: false, error: passCheck.error }
    }

    if (!captchaToken) {
      return { success: false, error: 'Security verification (CAPTCHA) is required.' }
    }

    try {
      // 1. Authenticate via Express API router (enforcing rate limiting and CAPTCHA)
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, captchaToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'EMAIL_NOT_CONFIRMED' || (data.error && data.error.includes('not been confirmed'))) {
          return {
            success: false,
            requiresEmailConfirmation: true,
            error: data.error || 'Please confirm your email before signing in.',
          }
        }
        return { success: false, error: data.error || 'Invalid credentials.' }
      }

      if (data.session) {
        await supabase.auth.setSession(data.session)
      }

      if (data.user) {
        const mapped: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          memberType: data.user.member_type,
          approvalStatus: data.user.approval_status || 'pending',
          joinedAt: new Date().toISOString().split('T')[0],
        }
        setUser(mapped)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
      }

      return { success: true }
    } catch (err: any) {
      // Fallback: direct Supabase Client sign in
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            return {
              success: false,
              requiresEmailConfirmation: true,
              error: 'Your email has not been confirmed yet. Please verify your email using the link sent to your inbox.',
            }
          }
          return { success: false, error: error.message }
        }

        if (data.user) {
          const mapped = await mapSupabaseUser(data.user)
          setUser(mapped)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
        }

        return { success: true }
      } catch (clientErr: any) {
        return { success: false, error: clientErr.message || 'An unexpected error occurred during login.' }
      }
    }
  }

  const register = async (
    name: string,
    email: string,
    password?: string,
    customRole?: 'admin' | 'member',
    captchaToken?: string
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    if (!cleanName) {
      return { success: false, error: 'Please enter your name.' }
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' }
    }
    if (!password) {
      return { success: false, error: 'Password is required to create an account.' }
    }

    // Password length validation (minimum 8 characters)
    const passCheck = validatePassword(password)
    if (!passCheck.valid) {
      return { success: false, error: passCheck.error }
    }

    if (!captchaToken) {
      return { success: false, error: 'Security verification (CAPTCHA) is required.' }
    }

    const classification = classifyEmail(cleanEmail)
    // External users cannot be admins; university emails can be admin if designated
    const assignedRole = classification.isExternal
      ? 'member'
      : (customRole || classification.suggestedRole)

    try {
      // Register through API endpoint (enforces rate limits, CAPTCHA, and triggers Supabase email confirmation)
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          role: assignedRole,
          captchaToken,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to complete registration.' }
      }

      return {
        success: true,
        requiresEmailConfirmation: data.requiresEmailConfirmation,
        message: data.message || 'Registration successful! Please check your email to verify your account.',
      }
    } catch (err: any) {
      // Fallback: direct Supabase Client sign up (email confirmation required by default)
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
              role: assignedRole,
              member_type: classification.memberType,
            },
          },
        })

        if (error) {
          return { success: false, error: error.message }
        }

        return {
          success: true,
          requiresEmailConfirmation: !data.user?.email_confirmed_at,
          message: 'Registration successful! Please check your inbox for the confirmation email.',
        }
      } catch (clientErr: any) {
        return { success: false, error: clientErr.message || 'Failed to complete registration.' }
      }
    }
  }

  const resendConfirmation = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Valid email is required.' }
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to resend confirmation email.' }
      }
      return { success: true, message: data.message }
    } catch {
      const { error } = await supabase.auth.resend({ type: 'signup', email: cleanEmail })
      if (error) return { success: false, error: error.message }
      return { success: true, message: 'Confirmation email sent! Please check your inbox and spam folder.' }
    }
  }

  const updateProfilePhoto = async (photoUrl: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (user?.id) {
        localStorage.setItem(`sdc_avatar_${user.id}`, photoUrl)
      }
      setUser(prev => {
        if (!prev) return null
        const updated = { ...prev, avatarUrl: photoUrl }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return updated
      })
      // Persist to Supabase user metadata if session is active
      try {
        await supabase.auth.updateUser({
          data: { avatar_url: photoUrl }
        })
      } catch (sbErr) {
        console.warn('Supabase avatar update warning:', sbErr)
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile photo.' }
    }
  }

  const updateProfile = async (updates: {
    name?: string
    avatarUrl?: string
    bio?: string
    githubUrl?: string
    linkedinUrl?: string
    discordTag?: string
    phone?: string
    dept?: string
    year?: string
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (user?.id) {
        if (updates.avatarUrl !== undefined) localStorage.setItem(`sdc_avatar_${user.id}`, updates.avatarUrl)
        if (updates.bio !== undefined) localStorage.setItem(`sdc_bio_${user.id}`, updates.bio)
        if (updates.githubUrl !== undefined) localStorage.setItem(`sdc_github_${user.id}`, updates.githubUrl)
        if (updates.linkedinUrl !== undefined) localStorage.setItem(`sdc_linkedin_${user.id}`, updates.linkedinUrl)
        if (updates.discordTag !== undefined) localStorage.setItem(`sdc_discord_${user.id}`, updates.discordTag)
        if (updates.phone !== undefined) localStorage.setItem(`sdc_phone_${user.id}`, updates.phone)
        if (updates.dept !== undefined) localStorage.setItem(`sdc_dept_${user.id}`, updates.dept)
        if (updates.year !== undefined) localStorage.setItem(`sdc_year_${user.id}`, updates.year)
      }

      setUser(prev => {
        if (!prev) return null
        const updated = {
          ...prev,
          ...updates,
          name: updates.name ? updates.name.trim() : prev.name,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        return updated
      })

      // Persist name to public.profiles table (governed by "update own name" RLS policy)
      if (updates.name && user?.id) {
        try {
          await supabase
            .from('profiles')
            .update({ full_name: updates.name.trim() })
            .eq('id', user.id)
        } catch (err) {
          console.warn('profiles table update note:', err)
        }
      }

      // Persist to Supabase user metadata if session is active
      try {
        await supabase.auth.updateUser({
          data: {
            name: updates.name ? updates.name.trim() : undefined,
            avatar_url: updates.avatarUrl,
            bio: updates.bio,
            github_url: updates.githubUrl,
            linkedin_url: updates.linkedinUrl,
            discord_tag: updates.discordTag,
            phone: updates.phone,
            dept: updates.dept,
            year: updates.year,
          }
        })
      } catch (sbErr) {
        console.warn('Supabase profile metadata update warning:', sbErr)
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile.' }
    }
  }

  const checkApprovalStatus = async (): Promise<'approved' | 'pending' | 'rejected'> => {
    if (!user?.id && !user?.email) return 'pending'
    const isUniv = isUniversityEmail(user?.email || '')
    const lookupKey = user?.id || user?.email || ''

    try {
      // 1. Primary: Query API status endpoint with Authorization token
      const { data: sessionData } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/auth/status`, {
        headers,
        credentials: 'omit',
      })
      if (res.ok) {
        const data = await res.json()
        const newStatus = (data.approval_status || 'pending') as 'approved' | 'pending' | 'rejected'
        const newRole = (data.role || 'member') as 'admin' | 'member'
        const newMemberType = (data.member_type || (isUniv ? 'university' : 'external')) as 'university' | 'external'
        setUser(prev => {
          if (!prev) return null
          const updated: User = {
            ...prev,
            approvalStatus: newStatus,
            role: newRole,
            memberType: newMemberType,
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
        return newStatus
      }

      // 2. Secondary: Fallback to client-side public.profiles table query
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, approval_status, member_type')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        const newStatus = (profile.approval_status || 'pending') as 'approved' | 'pending' | 'rejected'
        const newRole = (profile.role || 'member') as 'admin' | 'member'
        const newMemberType = (profile.member_type || (isUniv ? 'university' : 'external')) as 'university' | 'external'
        setUser(prev => {
          if (!prev) return null
          const updated: User = {
            ...prev,
            approvalStatus: newStatus,
            role: newRole,
            memberType: newMemberType,
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          return updated
        })
        return newStatus
      }
    } catch (err) {
      console.warn('Status check error:', err)
    }
    return user?.approvalStatus || 'pending'
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Supabase signOut warning:', err)
    } finally {
      setUser(null)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'admin' && user?.approvalStatus === 'approved',
    login,
    register,
    resendConfirmation,
    updateProfilePhoto,
    updateProfile,
    checkApprovalStatus,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
