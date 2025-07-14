/**
 * Group Admin/Settings Page
 * Allows group admins to manage group settings, edit details, and delete groups
 */
"use client"

import { useEffect, useState } from "react"
import { Layout } from "../../../../components/Layout"
import { Button } from "../../../../components/button"
import { Input } from "../../../../components/input"
import { Label } from "../../../../components/label"
import { Textarea } from "../../../../components/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/card"
import { Badge } from "../../../../components/badge"
import { Alert, AlertDescription } from "../../../../components/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../components/dialog"
import { useAuth } from "../../../../contexts/AuthContext"
import { ArrowLeft, Settings, Trash2, Users, Activity, AlertTriangle, Save, Copy } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { getGroupById, updateGroup, deleteGroup, getAllGroupMemberShips } from "../../../../lib/db/groups"
import { getUserById } from "../../../../lib/db/users"
import { Group, User, UserGroupMembership } from "../../../../models"

export default function GroupSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupid as string

  // Group data state
  const [group, setGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<User[]>([])
  const [membershipData, setMembershipData] = useState<UserGroupMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  // Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!user || !groupId) return

      try {
        setIsLoading(true)
        
        // Fetch group details
        const groupData = await getGroupById(groupId)
        if (!groupData) {
          setErrorMessage("Group not found")
          return
        }

        // Check if user is admin
        if (groupData.admin !== user.id) {
          setErrorMessage("You don't have permission to access this page")
          return
        }

        setGroup(groupData)
        setGroupName(groupData.name)
        setGroupDescription(groupData.description || "")

        // Fetch group members
        const memberships = await getAllGroupMemberShips(groupId)
        setMembershipData(memberships)

        if (memberships.length > 0) {
          const members = await Promise.all(
            memberships.map((membership) => getUserById(membership.userId))
          )
          setGroupMembers(members)
        }

      } catch (error) {
        console.error("Error fetching group data:", error)
        setErrorMessage("Failed to load group data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroupData()
  }, [user, groupId])

  const handleUpdateGroup = async () => {
    if (!group || !groupName.trim()) {
      setErrorMessage("Group name is required")
      return
    }

    setIsUpdating(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const updatedGroup = await updateGroup(group.id, {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined
      })

      if (updatedGroup) {
        setGroup(updatedGroup)
        setSuccessMessage("Group settings updated successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setErrorMessage("Failed to update group settings")
      }
    } catch (error) {
      console.error("Error updating group:", error)
      setErrorMessage("An error occurred while updating group settings")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!group || deleteConfirmation !== group.name) {
      setErrorMessage("Please type the group name exactly to confirm deletion")
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)

    try {
      const success = await deleteGroup(group.id)
      
      if (success) {
        // Redirect to dashboard after successful deletion
        router.push("/dashboard")
      } else {
        setErrorMessage("Failed to delete group")
      }
    } catch (error) {
      console.error("Error deleting group:", error)
      setErrorMessage("An error occurred while deleting the group")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteConfirmation("")
    }
  }

  const handleCopyInviteCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode)
      setSuccessMessage("Invite code copied to clipboard!")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    )
  }

  if (!group || !user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {errorMessage || "The group you're looking for doesn't exist or you don't have permission to access it."}
          </p>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Groups
            </Link>
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="p-2 hover:bg-gray-100">
              <Link href={`/groups/${groupId}`}>
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Back to Group</span>
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Group Settings</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">{group.name}</p>
                </div>
              </div>
              <Badge className="bg-purple-500">Admin Access</Badge>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Group Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{group.membersCount}</div>
              <p className="text-xs text-muted-foreground">Active participants</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invite Code</CardTitle>
              <Copy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold font-mono">{group.inviteCode}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyInviteCode}
                className="p-0 h-auto text-xs text-purple-600 hover:text-purple-700"
              >
                Copy to clipboard
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {new Date(group.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </div>
              <p className="text-xs text-muted-foreground">Group creation date</p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Group Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Group Details</CardTitle>
            <CardDescription>Update your group's name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {groupName.length}/50 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupDescription">Description</Label>
              <Textarea
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Describe your group's purpose..."
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {groupDescription.length}/200 characters
              </p>
            </div>

            <Button 
              onClick={handleUpdateGroup} 
              disabled={isUpdating || !groupName.trim()}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Group Members */}
        <Card>
          <CardHeader>
            <CardTitle>Group Members ({groupMembers.length})</CardTitle>
            <CardDescription>People in your group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupMembers.map((member) => {
                const membership = membershipData.find(m => m.userId === member.id)
                const isGroupAdmin = member.id === group.admin
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {member.username?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.username}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{membership?.points || 0} pts</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions that affect your group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h3 className="font-medium text-red-900">Delete Group</h3>
                <p className="text-sm text-red-700">
                  Permanently delete this group and all its data. This action cannot be undone.
                </p>
              </div>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Group
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle className="text-red-600">Delete Group</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete the group "{group.name}" 
                      and remove all members, challenges, and associated data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deleteConfirmation">
                        Type the group name <strong>{group.name}</strong> to confirm:
                      </Label>
                      <Input
                        id="deleteConfirmation"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder={group.name}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteGroup}
                      disabled={isDeleting || deleteConfirmation !== group.name}
                    >
                      {isDeleting ? "Deleting..." : "Delete Group"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
