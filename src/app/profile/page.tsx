/**
 * User Profile Page
 * Display user information, completed challenges, point history, and activity log
 * Allows users to view their progress and achievements
 */
"use client"

import { useEffect, useState } from "react"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card"
import { Badge } from "@/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { Trophy, Calendar, Activity, Edit, Award } from "lucide-react"

import { getUserById } from "@/lib/db/users"
import { Challenge } from "@/models"
import { getAllSubmittedChallenges, getNumberOfChallengesCreated } from "@/lib/db/challenges"

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([])
  const [totalPointsEarned, setTotalPointsEarned] = useState(0)
  const [challengesCreated, setChallengesCreated] = useState(0)
  const [userData, setUserData] = useState(user)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch completed challenges and points
    getAllSubmittedChallenges(user.id)
      .then((challenges) => {
        setCompletedChallenges(challenges)
        const points = challenges.reduce((sum, challenge) => sum + challenge.points, 0)
        setTotalPointsEarned(points)
      })
      .catch((error) => console.error("Error fetching completed challenges:", error))

    // Fetch number of challenges created by user
    getNumberOfChallengesCreated(user.id)
      .then((count) => setChallengesCreated(count))
      .catch((error) => console.error("Error fetching challenges created:", error))

    // Fetch user data
    getUserById(user.id)
      .then((data) => setUserData(data))
      .catch((error) => console.error("Error fetching user data:", error))

    setLoading(false)
  }, [user.id])

  return (
    <Layout>
      <div className="space-y-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={userData.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">{user.username.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">

                <p className="text-muted-foreground mb-4">{user.email}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{totalPointsEarned}</div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{completedChallenges.length}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{challengesCreated}</div>
                    <div className="text-sm text-muted-foreground">Created</div>
                  </div>
                </div>
              </div>

              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Challenge History</CardTitle>
                  <CardDescription>Your participation in group challenges</CardDescription>
                </CardHeader>
                <CardContent>
                  {completedChallenges.length > 0 ? (
                    <div className="space-y-4">
                      {completedChallenges.map((challenge) => (
                        <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{challenge.title}</h3>
                            <p className="text-sm text-muted-foreground">{challenge.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(challenge.endDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                {challenge.points} points
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              className={
                                challenge.status === "completed"
                                  ? "bg-green-500"
                                  : challenge.status === "active"
                                    ? "bg-blue-500"
                                    : challenge.status === "pending"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                              }
                            >
                              {challenge.status}
                            </Badge>
                            {challenge.createdBy === user.id && (
                              <Badge variant="outline" className="text-xs">
                                Created by you
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🎯</div>
                      <p className="text-muted-foreground">No challenges yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Badges Earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {completedChallenges.length >= 1 && (
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl mb-1">🏃</div>
                        <div className="text-xs font-medium">First Challenge</div>
                      </div>
                    )}
                    {completedChallenges.length >= 5 && (
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl mb-1">🔥</div>
                        <div className="text-xs font-medium">On Fire</div>
                      </div>
                    )}
                    {challengesCreated >= 1 && (
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl mb-1">💡</div>
                        <div className="text-xs font-medium">Idea Maker</div>
                      </div>
                    )}
                    {totalPointsEarned >= 100 && (
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-2xl mb-1">💯</div>
                        <div className="text-xs font-medium">Century Club</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Point Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Challenges Completed</span>
                      <span className="font-medium">+{completedChallenges.length}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Points</span>
                      <span>{totalPointsEarned}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}