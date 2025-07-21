/**
 * Authentication Context
 * Manages user authentication state using Supabase
 * Provides login, signup, logout functionality and current user state
 */
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import type { User } from "../models/index"

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  sendResetPasswordEmail: (email: string) => Promise<{ error: any }>
  resetPassword: (password: string) => Promise<{ error: any }>
  fetchUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (error) {
        console.error("Error fetching user data:", error)
      } else {
        setUser(data as User)
      }
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Create a minimal user object from session data to avoid
        // making database calls that could cause auth hanging issues
        const sessionUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || '',
          createdAt: session.user.created_at
        }
        setUser(sessionUser)
        
        // Fetch full user data separately (outside of auth state change)
        setTimeout(() => {
          fetchUserData()
        }, 100)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      
      if (session?.user) {
        // Don't make Supabase calls inside onAuthStateChange due to a known bug
        // that causes subsequent auth calls to hang. Instead, we'll fetch user data
        // separately when needed.
        
        // Create a minimal user object from session data
        const sessionUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || '',
          createdAt: session.user.created_at
        }
        setUser(sessionUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error || !data.user) {
      return { error }
    }

    // Create user row in the database

    const { error: userError } = await supabase
      .from("users")
      .insert(
        [
          { 
            id: data.user.id, 
            username: username,
            email: data.user.email
          }
        ]
      )
      .select() 
      .single()

    if (userError) {
      console.error("Error creating user row:", userError)
      return { error: userError }
    }

    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const sendResetPasswordEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `desafiados.es/auth/reset-password`
    })
    return { error }
  }

  const resetPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ 
      password: password 
    })
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        sendResetPasswordEmail,
        resetPassword,
        fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
