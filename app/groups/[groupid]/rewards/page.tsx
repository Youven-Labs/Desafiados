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
      <div className="space-y-8 overflow-hidden">
        {/* Header */}
        <div className="space-y-4">
          {/* Back Button */}
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/groups/${groupId}`)}
              className="p-2 border border-black hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">Back to Group</span>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 overflow-hidden">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate break-words overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Rewards</h1>
              </div>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base break-words">{group.name}</p>
            </div>
          </div>
          
          {/* Action Buttons - Mobile-first responsive design */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {isAdmin && (
              <Button 
                onClick={() => router.push(`/groups/${groupId}/rewards/create`)}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="sm:inline">Create Reward</span>
              </Button>
            )}
          </div>
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

        {/* Stats Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userMembership.points}</div>
              <p className="text-xs text-muted-foreground">Available to spend</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Rewards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewards.length}</div>
              <p className="text-xs text-muted-foreground">{rewards.filter(r => r.canAfford).length} you can afford</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userRedemptions.length}</div>
              <p className="text-xs text-muted-foreground">Total rewards claimed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="available" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="available" className="text-sm sm:text-base">Available</TabsTrigger>
            <TabsTrigger value="history" className="text-sm sm:text-base">My History</TabsTrigger>
            {isAdmin && <TabsTrigger value="manage" className="text-sm sm:text-base">Manage</TabsTrigger>}
          </TabsList>

          {/* Available Rewards Tab */}
          <TabsContent value="available" className="space-y-6">
            {rewards.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">🎁</div>
                  <CardTitle className="mb-2">No Rewards Available</CardTitle>
                  <CardDescription className="mb-4">
                    {isAdmin ? "Create the first reward for your group!" : "Ask your group admin to create some rewards."}
                  </CardDescription>
                  {isAdmin && (
                    <Button 
                      onClick={() => router.push(`/groups/${groupId}/rewards/create`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Reward
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
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
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>My Redemption History</CardTitle>
                <CardDescription>Your reward redemptions in {group.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {userRedemptions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🕐</div>
                    <CardTitle className="mb-2">No Redemptions Yet</CardTitle>
                    <CardDescription>Your reward redemption history will appear here.</CardDescription>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userRedemptions.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Management Tab */}
          {isAdmin && (
            <TabsContent value="manage" className="space-y-4">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
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
