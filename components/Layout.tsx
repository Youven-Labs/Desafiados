/**
 * Layout Component
 * Main layout wrapper with navigation and authentication
 * Provides consistent structure across all pages
 */
"use client"

import type React from "react"

import { useAuth } from "../contexts/AuthContext"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Home, Trophy, User, Settings, LogOut, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (!user) {
    return <>{children}</>
  }

  // Check if we're in a specific group context
  const isInGroup = pathname.startsWith("/groups/") && pathname !== "/groups"
  const groupId = isInGroup ? pathname.split("/")[2] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Desafiados</span>
              </Link>

              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-1 transition-colors ${
                    pathname === "/dashboard" ? "text-purple-600" : "text-gray-700 hover:text-purple-600"
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Groups</span>
                </Link>

                {isInGroup && (
                  <>
                    <Link
                      href={`/groups/${groupId}/rewards`}
                      className={`flex items-center space-x-1 transition-colors ${
                        pathname.includes("/rewards") ? "text-purple-600" : "text-gray-700 hover:text-purple-600"
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Rewards</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/profile"
                  className={`flex items-center space-x-1 transition-colors ${
                    pathname === "/profile" ? "text-purple-600" : "text-gray-700 hover:text-purple-600"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">

              {isInGroup && (
                <Button size="sm" className="hidden sm:flex" asChild>
                  <Link href={`/groups/${groupId}/challenges/create`}>
                    <Plus className="w-4 h-4 mr-1" />
                    New Challenge
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 rounded-full outline outline-offset-2 outline-2 outline-purple-500">
                      <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.username} />
                      <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.username}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
