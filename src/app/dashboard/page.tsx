"use client"

import { useAuth } from "@/contexts/AuthContext"

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">You are not signed in.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user.username || user.email}!</h1>
        <div className="mb-2">
          <span className="font-semibold">Email:</span> {user.email}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Username:</span> {user.username}
        </div>
        {user.avatarUrl && (
          <img src={user.avatarUrl} alt="Avatar" className="mx-auto mt-4 w-24 h-24 rounded-full border" />
        )}
        <div className="mt-4 text-sm text-gray-400">User ID: {user.id}</div>
      </div>
    </div>
  )
}
