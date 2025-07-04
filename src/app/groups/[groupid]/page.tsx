/**
 * Individual Group Dashboard Page
 * Specific group's challenges, leaderboard, and activity
 * The original dashboard functionality but scoped to a single group
 */
"use client"

import { useEffect, useState } from "react"
import { Layout } from "@/components/Layout"
import { ChallengeCard } from "@/components/ChallengeCard"
import { Button } from "@/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card"
import { Badge } from "@/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { Plus, Trophy, Activity, Users, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { getGroupChallenges, getChallengeVotes, getGroupById, getGroupMembership, getAllGroupMemberShips } from "@/lib/db/groups"
import { getUserById } from "@/lib/db/users"

import { User, Group, Challenge, UserGroupMembership } from "@/models"

export default function GroupDashboard() {
  const { user } = useAuth()
  const params = useParams()
  const groupId = params.groupid as string

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [userMembership, setUserMembership] = useState<UserGroupMembership | null>(null)
  const [groupMemberShips, setGroupMemberShips] = useState<UserGroupMembership[]>([])
  const [membersData, setMembersData] = useState<User[]>([])

  useEffect(() => {
    // Fetch group data and challenges when component mounts
    const fetchGroupData = async () => {
        try {
            const groupData = await getGroupById(groupId)
            const challengesData = await getGroupChallenges(groupId)

            setChallenges(challengesData)
            setGroup(groupData)
        } catch (error) {
            console.error("Error fetching group data:", error)
        }
    }
    fetchGroupData()
  }, [groupId])

  useEffect(() => {
    // Fetch user data for the current user
    const fetchUserData = async () => {
      if (user) {
        try {
          const userData = await getUserById(user.id)
          setUserData(userData)
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
    }

    // Fetch user membership in the group
    const fetchUserMembership = async () => {
      if (user && groupId) {
        try {
          const membershipData = await getGroupMembership(user.id, groupId)
          setUserMembership(membershipData)
        } catch (error) {
          console.error("Error fetching user membership:", error)
        }
      }
    }

    // Fetch all group memberships to get leaderboard and member data
    const fetchGroupMemberships = async () => {
        if (groupId) {
            try {
                const memberships = await getAllGroupMemberShips(groupId)
                setGroupMemberShips(memberships)
            } catch (error) {
                console.error("Error fetching group memberships:", error)
            }
        }
    }

    // Fetch all members' data for leaderboard
    const fetchMembersData = async () => {
      if (groupMemberShips.length > 0) {
        try {
          const members = await Promise.all(
            groupMemberShips.map((membership) => getUserById(membership.userId))
          )
          setMembersData(members)
        } catch (error) {
          console.error("Error fetching members data:", error)
        }
      }
    }

    fetchUserData()
    fetchUserMembership()
    fetchGroupMemberships()
    fetchMembersData()
  }, [user, groupId])

  if (!user || !group) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Group Not Found</h1>
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

  const activeChallenges = challenges.filter((c) => c.status === "active")
  const pendingChallenges = challenges.filter((c) => c.status === "pending")
  const completedChallenges = challenges.filter((c) => c.status === "completed")

  // Sort group members by points for leaderboard
  const leaderboard = [...groupMemberShips].sort((a, b) => b.points - a.points).map((membership) => {
        const memberData = membersData.find((m) => m.id === membership.userId)
        return {
        ...membership,
        ...memberData,
        points: membership.points || 0, // Ensure points is always a number
        }
    })

  const isAdmin = group.admin === user.id

  const handleVoteOnChallenge = (challengeId: string, vote: boolean) => {
    console.log(`Voting ${vote} on challenge ${challengeId}`)
    // In a real app, this would make an API call
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Group Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Groups
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                {isAdmin && <Badge className="bg-purple-500">Admin</Badge>}
              </div>
              {group.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                {group.membersCount} members • Invite code: <span className="font-mono">{group.inviteCode}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href={`/groups/${groupId}/challenges/create`}>
                <Plus className="w-4 h-4 mr-2" />
                New Challenge
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/groups/${groupId}/rewards`}>
                <Trophy className="w-4 h-4 mr-2" />
                Rewards
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link href={`/groups/${groupId}/admin`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userMembership?.points}</div>
              <p className="text-xs text-muted-foreground">In this group</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeChallenges.length}</div>
              <p className="text-xs text-muted-foreground">{pendingChallenges.length} pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Badge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedChallenges.length}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Group Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{group.membersCount}</div>
              <p className="text-xs text-muted-foreground">Active participants</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-6">
            {pendingChallenges.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Approval</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      currentUserId={user.id}
                      onVote={handleVoteOnChallenge}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold mb-4">Active Challenges</h2>
              {activeChallenges.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      currentUserId={user.id}
                    />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-6xl mb-4">🎯</div>
                    <CardTitle className="mb-2">No Active Challenges</CardTitle>
                    <CardDescription className="mb-4">Create a new challenge to get started!</CardDescription>
                    <Button asChild>
                      <Link href={`/groups/${groupId}/challenges/create`}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Challenge
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Group Leaderboard</CardTitle>
                <CardDescription>Points earned by completing challenges in {group.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((member, index) => (
                    <div key={ member.username } className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback>{member.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.username}</p>
                          {member.id === group.admin && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{member.points}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
