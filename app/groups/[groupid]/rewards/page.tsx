/**
 * Group Rewards Page
 * Display available rewards, allow redemption, and provide admin controls
 */
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Layout } from "../../../../components/Layout"
import { Button } from "../../../../components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/card"
import { Badge } from "../../../../components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/tabs"
import { Alert, AlertDescription } from "../../../../components/alert"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/dialog"
import { useAuth } from "../../../../contexts/AuthContext"
import { 
  ArrowLeft, 
  Gift, 
  Plus, 
  Trophy, 
  Clock, 
  Users,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Settings
} from "lucide-react"

import { 
  getAvailableRewardsForUser,
  redeemReward,
  getUserRedemptions,
  getGroupRedemptionStats,
  isUserRewardAdmin
} from "../../../../lib/db/rewards"
import { getGroupById, getGroupMembership } from "../../../../lib/db/groups"
import { getUserById } from "../../../../lib/db/users"
import { Reward, UserRewardRedemption, Group, User, UserGroupMembership, RewardRedemptionWithDetails } from "../../../../models"

interface RewardWithAffordability extends Reward {
  canAfford: boolean
  userPoints: number
}

export default function RewardsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupid as string

  const [group, setGroup] = useState<Group | null>(null)
  const [userMembership, setUserMembership] = useState<UserGroupMembership | null>(null)
  const [rewards, setRewards] = useState<RewardWithAffordability[]>([])
  const [userRedemptions, setUserRedemptions] = useState<RewardRedemptionWithDetails[]>([])
  const [groupStats, setGroupStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Redemption state
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [showRedemptionDialog, setShowRedemptionDialog] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
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

        // Fetch user membership
        const membership = await getGroupMembership(user.id, groupId)
        setUserMembership(membership)

        // Check if user is admin
        const adminStatus = membership?.role === "admin" || (groupData?.admin === user.id)
        setIsAdmin(!!adminStatus)

        // Fetch available rewards with affordability info
        const rewardsData = await getAvailableRewardsForUser(user.id, groupId)
        setRewards(rewardsData)

        // Fetch user's redemption history for this group
        const redemptionsData = await getUserRedemptions(user.id, groupId)
        setUserRedemptions(redemptionsData)

        // Fetch group statistics (admin only)
        if (adminStatus) {
          const stats = await getGroupRedemptionStats(groupId)
          setGroupStats(stats)
        }

      } catch (error) {
        console.error("Error fetching rewards data:", error)
        setErrorMessage("Failed to load rewards. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, groupId])

  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward)
    setShowRedemptionDialog(true)
  }

  const handleConfirmRedemption = async () => {
    if (!selectedReward || !user) return

    setIsRedeeming(true)
    try {
      await redeemReward(user.id, selectedReward.id)
      
      // Refresh data
      const rewardsData = await getAvailableRewardsForUser(user.id, groupId)
      setRewards(rewardsData)
      
      const redemptionsData = await getUserRedemptions(user.id, groupId)
      setUserRedemptions(redemptionsData)

      // Update membership data
      const membership = await getGroupMembership(user.id, groupId)
      setUserMembership(membership)

      setSuccessMessage(`Successfully redeemed "${selectedReward.name}"!`)
      setShowRedemptionDialog(false)
      setSelectedReward(null)
      
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      console.error("Error redeeming reward:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to redeem reward")
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsRedeeming(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
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

  if (!group || !userMembership) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Group not found</h1>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
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
              onClick={() => router.push(`/groups/${groupId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Group
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Rewards</h1>
              <p className="text-sm text-gray-500">{group.name}</p>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => router.push(`/groups/${groupId}/rewards/create`)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Reward
            </Button>
          )}
        </div>

        {/* Success/Error Messages */}
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

        {/* User Points Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Your Points</h3>
                  <p className="text-sm text-gray-600">Available in {group.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{userMembership.points}</div>
                <div className="text-sm text-gray-500">points available</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Available Rewards</TabsTrigger>
            <TabsTrigger value="history">My Redemptions</TabsTrigger>
            {isAdmin && <TabsTrigger value="manage">Manage</TabsTrigger>}
          </TabsList>

          {/* Available Rewards Tab */}
          <TabsContent value="available" className="space-y-4">
            {rewards.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rewards available</h3>
                  <p className="text-gray-600">
                    {isAdmin ? "Create the first reward for your group!" : "Ask your group admin to create some rewards."}
                  </p>
                  {isAdmin && (
                    <Button 
                      className="mt-4"
                      onClick={() => router.push(`/groups/${groupId}/rewards/create`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Reward
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => (
                  <Card key={reward.id} className={`relative ${!reward.canAfford ? 'opacity-60' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <Badge variant={reward.canAfford ? "default" : "secondary"}>
                          {reward.pointsRequired} pts
                        </Badge>
                      </div>
                      {reward.description && (
                        <CardDescription>{reward.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Your points:</span>
                          <span className="font-medium">{reward.userPoints}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Required:</span>
                          <span className="font-medium">{reward.pointsRequired}</span>
                        </div>
                        <Button
                          className="w-full"
                          disabled={!reward.canAfford}
                          onClick={() => handleRedeemClick(reward)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {reward.canAfford ? "Redeem" : "Insufficient Points"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* User Redemptions History Tab */}
          <TabsContent value="history" className="space-y-4">
            {userRedemptions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No redemptions yet</h3>
                  <p className="text-gray-600">Your reward redemption history will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {userRedemptions.map((redemption) => (
                  <Card key={redemption.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{redemption.reward?.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {redemption.reward?.description}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(redemption.redeemedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              {redemption.pointsSpent} points spent
                            </span>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Redeemed
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Admin Management Tab */}
          {isAdmin && (
            <TabsContent value="manage" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Redemption Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {groupStats ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Redemptions:</span>
                          <span className="font-medium">{groupStats.totalRedemptions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Points Spent:</span>
                          <span className="font-medium">{groupStats.totalPointsSpent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Users:</span>
                          <span className="font-medium">{groupStats.uniqueUsers}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">No redemptions yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => router.push(`/groups/${groupId}/rewards/create`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Reward
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/groups/${groupId}/rewards/manage`)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage All Rewards
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Redemption Confirmation Dialog */}
        <Dialog open={showRedemptionDialog} onOpenChange={setShowRedemptionDialog}>
          <DialogContent className="bg-white rounded-lg shadow-lg max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Confirm Redemption</DialogTitle>
              <DialogDescription>
                Are you sure you want to redeem this reward?
              </DialogDescription>
            </DialogHeader>
            {selectedReward && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium">{selectedReward.name}</h3>
                  {selectedReward.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedReward.description}</p>
                  )}
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm">Cost:</span>
                    <span className="font-medium text-orange-600">{selectedReward.pointsRequired} points</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  You currently have {userMembership?.points} points. After redemption, you'll have{' '}
                  {(userMembership?.points || 0) - selectedReward.pointsRequired} points remaining.
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowRedemptionDialog(false)}
                disabled={isRedeeming}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmRedemption}
                disabled={isRedeeming}
              >
                {isRedeeming ? "Redeeming..." : "Confirm Redemption"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}
