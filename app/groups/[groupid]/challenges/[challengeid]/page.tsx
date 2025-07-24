/**
 * Challenge Details Page
 * Comprehensive view of a specific challenge with submission system, voting, and activity
 */
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Layout } from "../../../../../components/Layout"
import { Button } from "../../../../../components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/card"
import { Badge } from "../../../../../components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../../../../components/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../components/tabs"
import { Input } from "../../../../../components/input"
import { Textarea } from "../../../../../components/textarea"
import { VotingModal } from "../../../../../components/VotingModal"
import { Alert, AlertDescription } from "../../../../../components/alert"
import { useAuth } from "../../../../../contexts/AuthContext"
import { 
  ArrowLeft, 
  Calendar, 
  Trophy, 
  Users, 
  Clock, 
  Upload, 
  CheckCircle, 
  XCircle,
  Timer,
  Activity,
  UserCheck,
  ThumbsUp,
  ThumbsDown,
  FileImage,
  ExternalLink
} from "lucide-react"

import { 
  getChallengeById, 
  addVoteToChallenge, 
  getChallengeSubmissions,
  createChallengeSubmission,
  getUserSubmissionForChallenge,
  updateSubmissionApproval,
  deleteChallengeSubmission
} from "../../../../../lib/db/challenges"
import { getChallengeVotes, getGroupById, getGroupMembership } from "../../../../../lib/db/groups"
import { getUserById } from "../../../../../lib/db/users"
import { Challenge, Vote, User, Group, ChallengeSubmission, UserGroupMembership } from "../../../../../models"
import { randomUUID } from "crypto"

interface ChallengeSubmissionExtended extends ChallengeSubmission {
  user?: User
}

export default function ChallengeDetailsPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const challengeId = params.challengeid as string
  const groupId = params.groupid as string

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [creator, setCreator] = useState<User | null>(null)
  const [votes, setVotes] = useState<Vote[]>([])
  const [submissions, setSubmissions] = useState<ChallengeSubmissionExtended[]>([])
  const [userSubmission, setUserSubmission] = useState<ChallengeSubmission | null>(null)
  const [userMembership, setUserMembership] = useState<UserGroupMembership | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showVoting, setShowVoting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingSubmissions, setProcessingSubmissions] = useState<Set<string>>(new Set())
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Submission form state
  const [proofUrl, setProofUrl] = useState("")
  const [submissionNote, setSubmissionNote] = useState("")

  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch challenge details
        const challengeData = await getChallengeById(challengeId)
        setChallenge(challengeData)

        // Fetch group details
        const groupData = await getGroupById(groupId)
        setGroup(groupData)

        // Fetch creator details
        const creatorData = await getUserById(challengeData.createdBy)
        setCreator(creatorData)

        // Fetch votes
        const votesData = await getChallengeVotes(challengeId)
        setVotes(votesData)

        // Fetch submissions
        const submissionsData = await getChallengeSubmissions(challengeId)
        const submissionsWithUsers = await Promise.all(
          submissionsData.map(async (submission) => {
            const userData = await getUserById(submission.userId)
            return { ...submission, user: userData }
          })
        )
        setSubmissions(submissionsWithUsers)

        // Check if current user has submitted
        if (user?.id) {
          const userSub = await getUserSubmissionForChallenge(user.id, challengeId)
          setUserSubmission(userSub)
          
          // Check user's membership role in the group
          const membership = await getGroupMembership(user.id, groupId)
          setUserMembership(membership)
        }

      } catch (error) {
        console.error("Error fetching challenge data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (challengeId && groupId) {
      fetchChallengeData()
    }
  }, [challengeId, groupId, user?.id])

  const handleVote = async (vote: boolean) => {
    if (!user?.id || !challenge) return
    
    try {
      await addVoteToChallenge(challenge.id, user.id, vote)
      // Refresh votes
      const updatedVotes = await getChallengeVotes(challengeId)
      setVotes(updatedVotes)
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  const handleSubmitProof = async () => {
    if (!user?.id || !challenge || !proofUrl.trim()) return

    setIsSubmitting(true)
    
    try {
      const newSubmission: ChallengeSubmission = {
        id: crypto.randomUUID(),
        userId: user.id,
        challengeId: challenge.id,
        submittedAt: new Date().toISOString(),
        submittedProof: true,
        proofUrl: proofUrl,
        pointsEarned: 0
      }
      
      await createChallengeSubmission(newSubmission)
      
      // Refresh submissions
      const submissionsData = await getChallengeSubmissions(challengeId)
      const submissionsWithUsers = await Promise.all(
        submissionsData.map(async (submission) => {
          const userData = await getUserById(submission.userId)
          return { ...submission, user: userData }
        })
      )
      setSubmissions(submissionsWithUsers)
      
      // Update user submission
      const userSub = await getUserSubmissionForChallenge(user.id, challengeId)
      setUserSubmission(userSub)
      
      setProofUrl("")
      setSubmissionNote("")
    } catch (error) {
      console.error("Error submitting proof:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveSubmission = async (submissionId: string) => {
    if (!challenge) return
    
    setProcessingSubmissions(prev => new Set(prev).add(submissionId))
    
    try {
      await updateSubmissionApproval(submissionId, true, challenge.points)
      
      // Refresh submissions
      const submissionsData = await getChallengeSubmissions(challengeId)
      const submissionsWithUsers = await Promise.all(
        submissionsData.map(async (submission) => {
          const userData = await getUserById(submission.userId)
          return { ...submission, user: userData }
        })
      )
      setSubmissions(submissionsWithUsers)
      setSuccessMessage(`Submission approved! Points awarded: ${challenge.points}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error approving submission:", error)
    } finally {
      setProcessingSubmissions(prev => {
        const newSet = new Set(prev)
        newSet.delete(submissionId)
        return newSet
      })
    }
  }

  const handleRejectSubmission = async (submissionId: string) => {
    setProcessingSubmissions(prev => new Set(prev).add(submissionId))
    
    try {
      // Delete the submission instead of marking as rejected
      await deleteChallengeSubmission(submissionId)
      
      // Refresh submissions
      const submissionsData = await getChallengeSubmissions(challengeId)
      const submissionsWithUsers = await Promise.all(
        submissionsData.map(async (submission) => {
          const userData = await getUserById(submission.userId)
          return { ...submission, user: userData }
        })
      )
      setSubmissions(submissionsWithUsers)
      
      // Also refresh user submission for the current user
      if (user?.id) {
        const userSub = await getUserSubmissionForChallenge(user.id, challengeId)
        setUserSubmission(userSub)
      }
      
      setSuccessMessage("Submission rejected and deleted - user can submit again")
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      console.error("Error rejecting submission:", error)
    } finally {
      setProcessingSubmissions(prev => {
        const newSet = new Set(prev)
        newSet.delete(submissionId)
        return newSet
      })
    }
  }

  const getStatusColor = (status: Challenge["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-500"
      case "active": return "bg-green-500"
      case "completed": return "bg-blue-500"
      case "rejected": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric"
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getDaysUntilDeadline = () => {
    if (!challenge) return 0
    const now = new Date()
    const deadline = new Date(challenge.endDate)
    const diffTime = deadline.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatProofUrl = (url: string) => {
    if (!url) return ""
    // If URL already has a protocol, return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url
    }
    // If URL starts with //, add https: prefix
    if (url.startsWith("//")) {
      return `https:${url}`
    }
    // Otherwise, add https:// prefix
    return `https://${url}`
  }

  const userVote = votes.find(v => v.userId === user?.id)
  const approveVotes = votes.filter(v => v.approved).length
  const rejectVotes = votes.filter(v => !v.approved).length
  const daysLeft = getDaysUntilDeadline()
  const isExpired = daysLeft < 0
  const approvedSubmissions = submissions.filter(s => s.approved === true)
  const pendingSubmissions = submissions.filter(s => s.approved === null || s.approved === undefined)
  const isAdmin = userMembership?.role === "admin" || group?.admin === user?.id

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!challenge || !group) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Challenge not found</h1>
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
              <div className="flex flex-row sm:flex-row sm:items-center gap-2 sm:gap-3 overflow-hidden justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate break-words overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{challenge.title}</h1>
                <Badge className={getStatusColor(challenge.status)}>
                  {challenge.status}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base break-words">{challenge.description}</p>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                {group.name} • {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
              </div>
              
              {/* Points and Time Left Row - Points always on the left */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-lg font-semibold text-orange-600">
                  <Trophy className="w-5 h-5" />
                  {challenge.points} points
                </div>
                {challenge.status === "active" && (
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="w-4 h-4" />
                    <span className={daysLeft <= 3 ? "text-red-600 font-medium" : "text-gray-600"}>
                      {isExpired ? "Expired" : `${daysLeft} days left`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Challenge Details Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Start: {formatDate(challenge.startDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>End: {formatDate(challenge.endDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{submissions.length} submissions</span>
              </div>
            </div>
            
            {creator && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={creator.avatarUrl} />
                    <AvatarFallback>{creator.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <span className="text-gray-600">Created by</span>{" "}
                    <span className="font-medium">{creator.username}</span>{" "}
                    <span className="text-gray-500">on {formatDate(challenge.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voting Section for Pending Challenges */}
        {challenge.status === "pending" && user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Challenge Voting
              </CardTitle>
              <CardDescription>
                This challenge needs approval from group members before becoming active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {votes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Approval Progress</span>
                      <span>{approveVotes}/{votes.length} approve</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${votes.length > 0 ? (approveVotes / votes.length) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {approveVotes} approve
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" />
                        {rejectVotes} reject
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {!userVote ? (
                    <Button onClick={() => setShowVoting(true)} className="flex-1">
                      Cast Your Vote
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>You voted: {userVote.approved ? "👍 Approve" : "👎 Reject"}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Panel for Pending Submissions */}
        {isAdmin && challenge.status === "active" && pendingSubmissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserCheck className="w-5 h-5 shrink-0" />
                <span className="truncate">Admin Panel - Pending Submissions</span>
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {pendingSubmissions.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm">
                Review and approve submissions from group members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-3 sm:p-4 bg-yellow-50 border-yellow-200">
                    <div className="space-y-3">
                      {/* User Info Row */}
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarImage src={submission.user?.avatarUrl} />
                          <AvatarFallback>{submission.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm sm:text-base truncate">
                            {submission.user?.username}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Submitted {formatDateTime(submission.submittedAt)}
                          </div>
                          {submission.proofUrl && (
                            <a 
                              href={formatProofUrl(submission.proofUrl)} 
                              target="_blank"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs sm:text-sm mt-1 break-all"
                            >
                              <FileImage className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                              <span className="truncate">View Proof</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons Row */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                          size="sm"
                          onClick={() => handleApproveSubmission(submission.id)}
                          disabled={processingSubmissions.has(submission.id)}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-initial text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-2.5"
                        >
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 shrink-0" />
                          <span className="truncate">
                            {processingSubmissions.has(submission.id) 
                              ? "Approving..." 
                              : `Approve (${challenge.points} pts)`
                            }
                          </span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectSubmission(submission.id)}
                          disabled={processingSubmissions.has(submission.id)}
                          className="border-red-600 text-red-600 hover:bg-red-50 flex-1 sm:flex-initial text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-2.5"
                        >
                          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 shrink-0" />
                          <span className="truncate">
                            {processingSubmissions.has(submission.id) ? "Rejecting..." : "Reject"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="text-sm sm:text-base">Overview</TabsTrigger>
            <TabsTrigger value="submissions" className="relative text-sm sm:text-base">
              Submissions
              {isAdmin && pendingSubmissions.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingSubmissions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-sm sm:text-base">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {challenge.status === "active" && user && !userSubmission && !isExpired && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Submit Your Proof
                  </CardTitle>
                  <CardDescription>
                    Upload proof that you've completed this challenge
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Proof URL</label>
                    <Input
                      placeholder="https://example.com/your-proof-image.jpg"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Additional Notes (Optional)</label>
                    <Textarea
                      placeholder="Add any additional context about your submission..."
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleSubmitProof} 
                    disabled={!proofUrl.trim() || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Proof"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {userSubmission && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Your Submission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Submitted:</span>
                      <span className="text-sm font-medium">{formatDateTime(userSubmission.submittedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge variant={
                        userSubmission.approved === true ? "default" : 
                        userSubmission.approved === false ? "destructive" : "secondary"
                      }>
                        {userSubmission.approved === true ? "Approved" : 
                         userSubmission.approved === false ? "Rejected" : "Pending Review"}
                      </Badge>
                    </div>
                    {userSubmission.proofUrl && (
                      <div>
                        <span className="text-sm text-gray-600">Proof:</span>
                        <a 
                          href={formatProofUrl(userSubmission.proofUrl)} 
                          target="_blank"
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-1"
                        >
                          <FileImage className="w-4 h-4" />
                          View Proof
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Challenge Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid grid-cols-2 gap-4 ${isAdmin ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
                    <div className="text-sm text-gray-600">Total Submissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{approvedSubmissions.length}</div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                  {isAdmin && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{pendingSubmissions.length}</div>
                      <div className="text-sm text-gray-600">Pending Review</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{challenge.points}</div>
                    <div className="text-sm text-gray-600">Points Reward</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{daysLeft > 0 ? daysLeft : 0}</div>
                    <div className="text-sm text-gray-600">Days Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Challenge Submissions</CardTitle>
                <CardDescription>All submissions for this challenge</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
                    <p className="text-gray-600">Be the first to complete this challenge!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={submission.user?.avatarUrl} />
                            <AvatarFallback>{submission.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{submission.user?.username}</div>
                            <div className="text-sm text-gray-600">{formatDateTime(submission.submittedAt)}</div>
                            {submission.proofUrl && (
                              <a 
                                href={formatProofUrl(submission.proofUrl)} 
                                target="_blank"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mt-1"
                              >
                                <FileImage className="w-4 h-4" />
                                View Proof
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              submission.approved === true ? "default" : 
                              submission.approved === false ? "destructive" : "secondary"
                            }>
                              {submission.approved === true ? "Approved" : 
                               submission.approved === false ? "Rejected" : "Pending"}
                            </Badge>
                            {submission.approved === true && (
                              <span className="text-sm text-green-600 font-medium">
                                +{submission.pointsEarned} pts
                              </span>
                            )}
                          </div>
                          {isAdmin && submission.approved === undefined && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveSubmission(submission.id)}
                                disabled={processingSubmissions.has(submission.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {processingSubmissions.has(submission.id) ? "Approving..." : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectSubmission(submission.id)}
                                disabled={processingSubmissions.has(submission.id)}
                                className="border-red-600 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                {processingSubmissions.has(submission.id) ? "Rejecting..." : "Reject"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Challenge Leaderboard
                </CardTitle>
                <CardDescription>
                  Members who completed this challenge
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No completions yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedSubmissions.map((submission, index) => (
                      <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-sm">
                            #{index + 1}
                          </div>
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={submission.user?.avatarUrl} />
                            <AvatarFallback>{submission.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{submission.user?.username}</div>
                            <div className="text-sm text-gray-600">
                              Completed {formatDateTime(submission.approvedAt || submission.submittedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-orange-600 font-medium">
                          <Trophy className="w-4 h-4" />
                          +{submission.pointsEarned} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Voting Modal */}
        {showVoting && (
          <VotingModal
            isOpen={showVoting}
            onClose={() => setShowVoting(false)}
            title={`Vote on "${challenge.title}"`}
            description={challenge.description || "No description provided"}
            votes={votes}
            onVote={handleVote}
            currentUserId={user?.id || ""}
          />
        )}
      </div>
    </Layout>
  )
}