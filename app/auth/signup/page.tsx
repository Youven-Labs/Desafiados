/**
 * Sign Up Page
 * User registration form for new users
 * Integrates with Supabase authentication
 */
"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../../../contexts/AuthContext"
import { Button } from "../../../components/button"
import { Input } from "../../../components/input"
import { Label } from "../../../components/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/card"
import { Alert, AlertDescription } from "../../../components/alert"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("SignUpPage: handleSubmit called")
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 6) {
      console.log("SignUpPage: Password validation failed")
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    console.log("SignUpPage: Calling signUp with email, password, username")
    const { error } = await signUp(email, password, username)

    if (error) {
      console.error("SignUpPage: Error during sign up", error)
      setError(error.message)
    } else {
      console.log("SignUpPage: Sign up successful, redirecting to verify email")
      setSuccess(true)
    }

    console.log("SignUpPage: Setting loading to false")
    setLoading(false)
  }



  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="text-white font-bold text-2xl">📧</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email!</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We've sent a verification email to <strong>{email}</strong>. 
              Please check your inbox and click the verification link to activate your account.
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" 
                asChild
              >
                <Link href="/auth/signin">Continue to Sign In</Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-purple-600 border-purple-200 hover:bg-purple-50" 
                asChild
              >
                <Link href="/">← Back to Home</Link>
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <CardTitle className="text-2xl">Join Desafiados</CardTitle>
          <CardDescription>Create your account and start challenging your friends</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/signin" className="text-purple-600 hover:underline">
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
