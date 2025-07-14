/**
 * Groups Dashboard Page
 * Main hub showing all user's groups, create/join functionality
 * Entry point after authentication before accessing specific groups
 */
"use client"

import { useState } from "react"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card"
import { Badge } from "@/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu"

import { Label } from "@/components/label"
import { Textarea } from "@/components/textarea"

import { useAuth } from "@/contexts/AuthContext"

import { createGroup, getUserGroups, joinGroup, getGroupMembership } from "@/lib/db/groups"

import { Plus, Users, Trophy, Activity, MoreVertical, Copy, LogOut, Settings, UserPlus } from "lucide-react"

import Link from "next/link"

import { Group } from "@/models/index" 

import { useEffect } from "react"
import { createInviteCode } from "@/lib/utils"
import { getAllSubmittedChallenges } from "@/lib/db/challenges"

export default function GroupsDashboard() {
  const { user } = useAuth()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [userGroups, setUserGroups] = useState<Group[]>([]) // Fetch user groups from the database or context
  const [userPoints, setUserPoints] = useState(0) // Placeholder for user points

  useEffect(() => {
    if (!user) return
    
    const initialzeData = async () => {
      try {
        const groups = await getUserGroups(user.id)
        setUserGroups(groups || [])
        
        const challenges = await getAllSubmittedChallenges(user.id)
        const points = challenges.reduce((sum, challenge) => sum + challenge.points, 0)
        setUserPoints(points)
      } catch (error) {
        console.error("Error fetching user groups:", error)
        alert("Failed to load your groups. Please try again later.")
      }
    }

    initialzeData()
  }, [user?.id])

  if (!user) return null

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return

    console.log("Creating new group:", newGroupName, newGroupDescription)
    console.log("User ID:", user.id)
    setLoading(true)

    const newGroup: Group = {
      id: crypto.randomUUID(), 
      name: newGroupName,
      description: newGroupDescription,
      admin: user.id,
      createdAt: new Date().toISOString(),
      inviteCode: createInviteCode(),
      membersCount: 1, // Admin is the first member
      activeChallenges: 0, // No challenges yet
    }

    console.log("New group object:", newGroup)

    // Add a timeout to the entire operation
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Operation timed out")), 20000)
    );

    try {
      const createdGroup = await Promise.race([
        createGroup(newGroup),
        timeoutPromise
      ]);
      
      console.log("Group created successfully:", createdGroup)
      
      if (createdGroup) {
        setUserGroups((prev) => [...prev, createdGroup])
        setNewGroupName("")
        setNewGroupDescription("")
        setShowCreateDialog(false)
        alert(`Successfully created "${createdGroup.name}"!`)
      } else {
        console.error("Group creation returned null")
        alert("Failed to create group. Please check your database connection and try again.")
      }
    } catch (error) {
      console.error("Error creating group:", error)
      
      if (error instanceof Error && error.message.includes("timed out")) {
        alert("The operation timed out. Please check your internet connection and try again.")
      } else if (error instanceof Error && error.message.includes("Database connection failed")) {
        alert("Database connection failed. Please check your configuration.")
      } else {
        alert("An unexpected error occurred while creating the group. Please try again.")
      }
    } finally {
      console.log("Finished creating group")
      setLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return

    console.log("Joining group with code:", joinCode)
    console.log("User ID:", user.id)
    setLoading(true)

    try {
      const joinedGroup = await joinGroup(user.id, joinCode.trim())
      console.log("Group joined successfully:", joinedGroup)
      
      if (joinedGroup) {
        // Check if group is already in the list (in case user was already a member)
        const groupExists = userGroups.some(group => group.id === joinedGroup.id)
        
        if (!groupExists) {
          setUserGroups((prev) => [...prev, joinedGroup])
        }
        
        setJoinCode("")
        setShowJoinDialog(false)
        alert(`Successfully joined "${joinedGroup.name}"!`)
      } else {
        console.error("Group join returned null")
        alert("Failed to join group. Please check the invite code and try again.")
      }
    } catch (error) {
      console.error("Error joining group:", error)
      alert("An unexpected error occurred while joining the group. Please try again.")
    } finally {
      console.log("Finished joining group")
      setLoading(false)
    }
  }

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

  const handleLeaveGroup = (groupId: string, groupName: string) => {
    console.log("Leaving group:", groupId)
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Groups</h1>
            <p className="text-muted-foreground mt-1">Manage your challenge groups and create new adventures</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Join a Group</DialogTitle>
                  <DialogDescription>
                    Enter the invite code shared by your friends to join their group.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">Invite Code</Label>
                    <Input
                      id="joinCode"
                      placeholder="Enter invite code (e.g., AWE123)"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleJoinGroup} disabled={loading || !joinCode.trim()}>
                    {loading ? "Joining..." : "Join Group"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                  <DialogDescription>Start a new challenge group and invite your friends to join.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      placeholder="Enter group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupDescription">Description (Optional)</Label>
                    <Textarea
                      id="groupDescription"
                      placeholder="Describe your group's purpose..."
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={loading || !newGroupName.trim()}>
                    {loading ? "Creating..." : "Create Group"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userGroups.length}</div>
              <p className="text-xs text-muted-foreground">Active memberships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points Earned</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userPoints}</div>
              <p className="text-xs text-muted-foreground">Combined from all groups, lifetime points</p>
            </CardContent>
          </Card>
        </div>

        {/* Groups Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Groups</h2>

          {userGroups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userGroups.map((group) => {
                const isAdmin = group.admin === user.id

                return (
                  <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          {group.description && <CardDescription className="mt-1">{group.description}</CardDescription>}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyInviteCode(group.inviteCode)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Invite Code
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/groups/${group.id}/admin`}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    Group Settings
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {!isAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleLeaveGroup(group.id, group.name)}
                                  className="text-red-600"
                                >
                                  <LogOut className="mr-2 h-4 w-4" />
                                  Leave Group
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {isAdmin && <Badge className="w-fit bg-purple-500">Admin</Badge>}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Group Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">{group.membersCount}</div>
                          <div className="text-xs text-muted-foreground">Members</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{group.activeChallenges}</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                      </div>

                      {/* Member Avatars */}

                      {/* Invite Code */}
                      <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <span className="text-sm font-mono">{group.inviteCode}</span>
                        <Button size="sm" variant="ghost" onClick={() => handleCopyInviteCode(group.inviteCode)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Enter Group Button */}
                      <Button asChild className="w-full">
                        <Link href={`/groups/${group.id}`}>Enter Group</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">👥</div>
                <CardTitle className="mb-2">No Groups Yet</CardTitle>
                <CardDescription className="mb-4">
                  Create your first group or join an existing one to start challenging your friends!
                </CardDescription>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                  <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}
