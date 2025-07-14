/**
 * Type definitions for the Desafiados app
 * Defines all data structures used throughout the application
 */

export interface User {
  id: string
  email: string
  username: string
  createdAt?: string
  avatarUrl?: string
}


export interface Group {
  id: string
  name: string
  description?: string
  admin: string
  createdAt: string
  inviteCode: string
  membersCount?: number
  activeChallenges?: number
}

export interface UserGroupMembership {
  userId: string
  groupId: string
  role: "admin" | "member"
  joinedAt: string
  points: number
}

export interface Challenge {
  id: string
  groupId: string
  title: string
  description?: string
  createdBy: string
  createdAt: string
  startDate: string
  endDate: string
  points: number
  status: "active" | "completed" | "rejected" | "pending"
  completedCount?: number
}


export interface ChallengeSubmission {
  id: string
  userId: string
  challengeId: string
  submittedAt: string
  submittedProof: boolean
  proofUrl?: string
  approved?: boolean
  approvedAt?: string
  pointsEarned: number
}

export interface Vote {
  id: string
  challengeId: string
  userId: string
  approved: boolean // true for approve, false for reject
  votedAt: string
}

export interface Reward {
  id: string
  groupId: string
  name: string
  description?: string
  pointsRequired: number
  createdBy: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface UserRewardRedemption {
  id: string
  userId: string
  rewardId: string
  redeemedAt: string
  pointsSpent: number
}

// Extended interfaces for UI components
export interface RewardWithStats extends Reward {
  totalRedemptions?: number
  canAfford?: boolean
  userPoints?: number
}

export interface RewardRedemptionWithDetails extends UserRewardRedemption {
  reward?: Reward
  user?: User
  group?: Group
}