/**
 * Manage Rewards Page
 * Allow group admins to view, edit, and manage all rewards
 */
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "../../../../../contexts/AuthContext"
import { Layout } from "../../../../../components/Layout"
import { Button } from "../../../../../components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/card"
import { Badge } from "../../../../../components/badge"
import { Input } from "../../../../../components/input"
import { Label } from "../../../../../components/label"
import { Textarea } from "../../../../../components/textarea"
import { Alert, AlertDescription } from "../../../../../components/alert"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../../components/dialog"
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  Users,
  Trophy,
  CheckCircle,
  AlertCircle
} from "lucide-react"

import { 
  getRewardsByGroup,
  updateReward,
  getRewardRedemptions,
  deactivateReward
} from "../../../../../lib/db/rewards"
import { getGroupById } from "../../../../../lib/db/groups"
import { Reward, Group } from "../../../../../models"

interface RewardWithRedemptions extends Reward {
  redemptionCount: number
}

export default function ManageRewardsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupid as string

  const [group, setGroup] = useState<Group | null>(null)
  const [rewards, setRewards] = useState<RewardWithRedemptions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Edit dialog state
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    pointsRequired: "",
    isActive: true
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !groupId) return

      try {
        setIsLoading(true)
        
        // Fetch group details
        const groupData = await getGroupById(groupId)
        setGroup(groupData)

        // Fetch all rewards (including inactive)
        const rewardsData = await getRewardsByGroup(groupId, false)
        
        // Get redemption counts for each reward
        const rewardsWithCounts = await Promise.all(
          rewardsData.map(async (reward) => {
            const redemptions = await getRewardRedemptions(reward.id)
            return {
              ...reward,
              redemptionCount: redemptions.length
            }
          })
        )

        setRewards(rewardsWithCounts)

      } catch (error) {
        console.error("Error fetching data:", error)
        setErrorMessage("Failed to load rewards. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, groupId])

  const handleEditReward = (reward: Reward) => {
    setSelectedReward(reward)
    setEditForm({
      name: reward.name,
      description: reward.description || "",
      pointsRequired: reward.pointsRequired.toString(),
      isActive: reward.isActive
    })
    setErrors({})
    setShowEditDialog(true)
  }

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {}

    if (!editForm.name.trim()) {
      newErrors.name = "Reward name is required"
    } else if (editForm.name.trim().length < 3) {
      newErrors.name = "Reward name must be at least 3 characters"
    }

    const pointsValue = parseInt(editForm.pointsRequired)
    if (!editForm.pointsRequired.trim()) {
      newErrors.pointsRequired = "Points required is required"
    } else if (isNaN(pointsValue) || pointsValue <= 0) {
      newErrors.pointsRequired = "Points must be a positive number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdateReward = async () => {
    if (!selectedReward || !validateEditForm()) return

    setIsUpdating(true)
    try {
      await updateReward(selectedReward.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        pointsRequired: parseInt(editForm.pointsRequired),
        isActive: editForm.isActive
      })

      // Refresh rewards
      const rewardsData = await getRewardsByGroup(groupId, false)
      const rewardsWithCounts = await Promise.all(
        rewardsData.map(async (reward) => {
          const redemptions = await getRewardRedemptions(reward.id)
          return {
            ...reward,
            redemptionCount: redemptions.length
          }
        })
      )
      setRewards(rewardsWithCounts)

      setSuccessMessage("Reward updated successfully!")
      setShowEditDialog(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error updating reward:", error)
      setErrorMessage("Failed to update reward")
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleActive = async (reward: Reward) => {
    try {
      await updateReward(reward.id, { isActive: !reward.isActive })
      
      // Refresh rewards
      const rewardsData = await getRewardsByGroup(groupId, false)
      const rewardsWithCounts = await Promise.all(
        rewardsData.map(async (reward) => {
          const redemptions = await getRewardRedemptions(reward.id)
          return {
            ...reward,
            redemptionCount: redemptions.length
          }
        })
      )
      setRewards(rewardsWithCounts)

      setSuccessMessage(`Reward ${reward.isActive ? 'deactivated' : 'activated'} successfully!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error toggling reward status:", error)
      setErrorMessage("Failed to update reward status")
      setTimeout(() => setErrorMessage(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/groups/${groupId}/rewards`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Rewards
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Manage Rewards</h1>
              <p className="text-sm text-gray-500">{group?.name}</p>
            </div>
          </div>
          <Button 
            onClick={() => router.push(`/groups/${groupId}/rewards/create`)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Reward
          </Button>
        </div>

        {/* Messages */}
        {successMessage && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rewards</p>
                  <p className="text-2xl font-bold">{rewards.length}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Rewards</p>
                  <p className="text-2xl font-bold">{rewards.filter(r => r.isActive).length}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Redemptions</p>
                  <p className="text-2xl font-bold">{rewards.reduce((sum, r) => sum + r.redemptionCount, 0)}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rewards List */}
        <Card>
          <CardHeader>
            <CardTitle>All Rewards</CardTitle>
            <CardDescription>
              Manage your group's rewards. You can edit details, change status, or view redemption history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rewards.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rewards yet</h3>
                <p className="text-gray-600 mb-4">Create your first reward to get started!</p>
                <Button onClick={() => router.push(`/groups/${groupId}/rewards/create`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Reward
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium">{reward.name}</h3>
                          <Badge variant={reward.isActive ? "default" : "secondary"}>
                            {reward.pointsRequired} pts
                          </Badge>
                          <Badge variant={reward.isActive ? "default" : "secondary"}>
                            {reward.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {reward.description && (
                          <p className="text-gray-600 mb-2">{reward.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{reward.redemptionCount} redemptions</span>
                          <span>Created {new Date(reward.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditReward(reward)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(reward)}
                        >
                          {reward.isActive ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Reward Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Reward</DialogTitle>
              <DialogDescription>
                Make changes to the reward details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Reward Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-points">Points Required</Label>
                <Input
                  id="edit-points"
                  type="number"
                  value={editForm.pointsRequired}
                  onChange={(e) => setEditForm(prev => ({ ...prev, pointsRequired: e.target.value }))}
                  className={errors.pointsRequired ? "border-red-500" : ""}
                />
                {errors.pointsRequired && <p className="text-sm text-red-600">{errors.pointsRequired}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="edit-active">Active (visible to users)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateReward}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
