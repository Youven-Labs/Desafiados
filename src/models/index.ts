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