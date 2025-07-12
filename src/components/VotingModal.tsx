/**
 * VotingModal Component
 * Reusable modal for voting on challenges, submissions, or rewards
 * Displays voting options and current vote status
 */
"use client"

import { useState } from "react"
import { Button } from "@/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog"
import type { Vote } from "@/models"
import { ThumbsUp, ThumbsDown } from "lucide-react"

interface VotingModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  votes: Vote[]
  onVote: (vote: boolean) => void
  currentUserId: string
}

export function VotingModal({ isOpen, onClose, title, description, votes, onVote, currentUserId }: VotingModalProps) {
  const [isVoting, setIsVoting] = useState(false)

  const userVote = votes.find((v) => v.userId === currentUserId)
  const approveVotes = votes.filter((v) => v.approved ).length
  const rejectVotes = votes.filter((v) => !v.approved).length
  const totalVotes = votes.length

  const handleVote = async (vote: boolean) => {
    setIsVoting(true)
    await onVote(vote)
    setIsVoting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          {totalVotes > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(approveVotes / totalVotes) * 100}%` }}
              />
            </div>
          )}

          {userVote && (
            <div className="text-center text-sm text-muted-foreground">
              You voted: {userVote.approved ? "👍 Approve" : "👎 Reject"}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!userVote && (
            <>
              <Button variant="outline" onClick={() => handleVote(false)} disabled={isVoting} className="flex-1">
                <ThumbsDown className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button variant="outline" onClick={() => handleVote(true)} disabled={isVoting} className="flex-1">
                <ThumbsUp className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
