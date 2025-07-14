/**
 * Challenge Creation Page
 * Form for creating new challenges with title, description, deadline, and participants
 * Submits challenges for group voting
 */
"use client"

import type React from "react"

import { useState, use } from "react"
import { Layout } from "../../../../../components/Layout"
import { Button } from "../../../../../components/button"
import { Input } from "../../../../../components/input"
import { Label } from "../../../../../components/label"
import { Textarea } from "../../../../../components/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/card"
import { Alert, AlertDescription } from "../../../../../components/alert"
import { useAuth } from "../../../../../contexts/AuthContext"
import { Calendar, Users, Target, ArrowLeft } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

import { createChallenge } from "../../../../../lib/db/challenges"
import { Challenge } from "../../../../../models"

export default function CreateChallengePage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const resolvedParams = useParams()
  const groupId = resolvedParams.groupid as string

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")
  const [points, setPoints] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")


  if (!user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!title.trim() || !description.trim() || !deadline) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    if (new Date(deadline) <= new Date()) {
      setError("Deadline must be in the future")
      setLoading(false)
      return
    }

    try {

        const challenge: Challenge = {
            id: crypto.randomUUID(), // Generate a unique ID for the challenge
            groupId: groupId, // Assuming you have groupId in user context
            title,
            description,
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(deadline).toISOString(),
            points,
            status: "pending",
        }

      const result = await createChallenge(challenge)
      if (result) {
        router.push(`/groups/${groupId}/`)
      } else {
        setError("Failed to create challenge")
      }
    } catch (err) {
      console.error("Error creating challenge:", err)
      setError("An error occurred while creating the challenge")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-8 overflow-hidden">
        {/* Header */}
        <div className="space-y-4">
          {/* Back Button */}
          <div className="flex items-center">
            <Button variant="outline" size="sm" asChild className="p-2 border border-black hover:bg-gray-50">
              <Link href={`/groups/${groupId}`}>
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Back to Group</span>
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 overflow-hidden">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate break-words overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>Create New Challenge</h1>
              </div>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base break-words">Propose a fun challenge for your group to vote on and complete together</p>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Challenge Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
              <CardDescription>Fill in the information about your challenge</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Challenge Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Morning Run Challenge"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what participants need to do..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="deadline"
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">Points Reward</Label>
                    <Input
                      id="points"
                      type="number"
                      min="10"
                      max="100"
                      step="5"
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button type="button" variant="outline" onClick={() => router.push(`/groups/${groupId}`)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? "Creating..." : "Create Challenge"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
