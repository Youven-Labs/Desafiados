/**
 * ChallengeCard Component
 * Displays challenge information in a card format
 * Shows status, participants, deadline, and voting information
 */
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/card"
import { Button } from "@/components/button"
import { Badge } from "@/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar"
import type { Challenge, User, Vote } from "@/models"
import { VotingModal } from "@/components/VotingModal"
import { Calendar, Users, Trophy } from "lucide-react"
import { getChallengeVotes } from "@/lib/db/groups"
import { getUserById } from "@/lib/db/users"

interface ChallengeCardProps {
  challenge: Challenge
  currentUserId: string
  onVote?: (challengeId: string, vote: boolean) => void
  onViewChallenge?: (challengeId: string) => void
}

export function ChallengeCard({ challenge, currentUserId, onVote, onViewChallenge}: ChallengeCardProps) {
  const [showVoting, setShowVoting] = useState(false)
  const [votes, setVotes] = useState<Vote[]>([])
  const [creatorData, setCreatorData] = useState<User | null>(null)

  const creator = challenge.createdBy

  useEffect(() => {
    const fetchVotes = async () => {
      if (challenge.id) {
        const votes = await getChallengeVotes(challenge.id)
        setVotes(votes)
      }
    }

    const fetchCreatorData = async () => {
      if (creator) {
        // Assuming you have a function to fetch user data by ID
        const userData = await getUserById(creator)
        setCreatorData(userData)
      }
    }

    fetchVotes()
    fetchCreatorData()
  }, [challenge.id])

  const isParticipant = true
  const userVote = votes.find((vote) => vote.userId === currentUserId)

  const getStatusColor = (status: Challenge["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "active":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            <Badge className={getStatusColor(challenge.status)}>{challenge.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Deadline: {formatDate(challenge.endDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="w-4 h-4" />
            <span>{challenge.points} points</span>
          </div>

          <div className="text-xs text-muted-foreground">
            Created by {creatorData?.username} on {formatDate(challenge.createdAt)}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          {challenge.status === "pending" && onVote && !userVote && (
            <Button variant="outline" size="sm" onClick={() => setShowVoting(true)}>
              Vote
            </Button>
          )}

          {challenge.status === "active" && (
            <Button variant="outline" size="sm" onClick={() => onViewChallenge?.(challenge.id)}>
              View Challenge
            </Button>
          )}

          {userVote && (
            <Badge variant="outline" className="text-xs">
              You voted: {userVote.approved ? "👍 Approve" : "👎 Reject"}
            </Badge>
          )}
        </CardFooter>
      </Card>

      {showVoting && onVote && (
        <VotingModal
          isOpen={showVoting}
          onClose={() => setShowVoting(false)}
          title={`Vote on "${challenge.title}"`}
          description={challenge.description || "No description provided"}
          votes={votes}
          onVote={(vote) => onVote(challenge.id, vote)}
          currentUserId={currentUserId}
        />
      )}
    </>
  )
}
