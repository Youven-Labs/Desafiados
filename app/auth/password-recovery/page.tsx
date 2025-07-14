/**
 * Password Recovery Page
 * Allows users to reset their password by sending a recovery email
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
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const { sendResetPasswordEmail } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!email) {
      setError("Please enter your email address")
      setLoading(false)
      return
    }

    const { error } = await sendResetPasswordEmail(email)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-600">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a password reset link to your email address
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  If an account with <strong>{email}</strong> exists, you'll receive a password reset email within a few minutes.
                </AlertDescription>
              </Alert>

              <div className="text-center text-sm text-muted-foreground">
                <p>Didn't receive the email? Check your spam folder or try again in a few minutes.</p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setSuccess(false)
                    setEmail("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Send Another Email
                </Button>
                
                <Link href="/auth/signin" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
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
            <Mail className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Remember your password? </span>
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