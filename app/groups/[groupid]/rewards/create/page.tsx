/**
 * Create Reward Page
 * Allow group admins to create new rewards for their group
 */
"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "../../../../../contexts/AuthContext"
import { Layout } from "../../../../../components/Layout"
import { Button } from "../../../../../components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/card"
import { Input } from "../../../../../components/input"
import { Label } from "../../../../../components/label"
import { Textarea } from "../../../../../components/textarea"
import { Alert, AlertDescription } from "../../../../../components/alert"
import { ArrowLeft, Gift, AlertCircle, CheckCircle } from "lucide-react"

import { createReward } from "../../../../../lib/db/rewards"
import { Reward } from "../../../../../models"

export default function CreateRewardPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupid as string

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pointsRequired: ""
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Reward name is required"
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Reward name must be at least 3 characters"
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Reward name must be less than 100 characters"
    }

    if (formData.description.trim().length > 500) {
      newErrors.description = "Description must be less than 500 characters"
    }

    const pointsValue = parseInt(formData.pointsRequired)
    if (!formData.pointsRequired.trim()) {
      newErrors.pointsRequired = "Points required is required"
    } else if (isNaN(pointsValue)) {
      newErrors.pointsRequired = "Points must be a valid number"
    } else if (pointsValue <= 0) {
      newErrors.pointsRequired = "Points must be greater than 0"
    } else if (pointsValue > 10000) {
      newErrors.pointsRequired = "Points cannot exceed 10,000"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const rewardData: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'> = {
        groupId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        pointsRequired: parseInt(formData.pointsRequired),
        createdBy: user.id,
        isActive: true
      }

      await createReward(rewardData)

      setSuccessMessage("Reward created successfully!")
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        pointsRequired: ""
      })

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/groups/${groupId}/rewards`)
      }, 2000)

    } catch (error) {
      console.error("Error creating reward:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to create reward")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/groups/${groupId}/rewards`)
  }

  // Prevent access if user is not logged in
  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need to be logged in to create rewards.</p>
            <Button onClick={() => router.push(`/groups/${groupId}`)} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancel}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Rewards
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Reward</h1>
            <p className="text-sm text-gray-500">Add a reward for your group members</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="bg-green-50 border-green-200 mb-6">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert className="bg-red-50 border-red-200 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Create Reward Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Reward Details
            </CardTitle>
            <CardDescription>
              Create an attractive reward that members can redeem with their earned points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reward Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Reward Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Coffee Gift Card, Team Lunch, Extra Day Off"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={errors.name ? "border-red-500" : ""}
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
                <p className="text-xs text-gray-500">
                  {formData.name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the reward in detail. What does it include? Any terms and conditions?"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className={errors.description ? "border-red-500" : ""}
                  rows={4}
                  maxLength={500}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  {formData.description.length}/500 characters (optional)
                </p>
              </div>

              {/* Points Required */}
              <div className="space-y-2">
                <Label htmlFor="pointsRequired">
                  Points Required <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pointsRequired"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.pointsRequired}
                  onChange={(e) => handleInputChange("pointsRequired", e.target.value)}
                  className={errors.pointsRequired ? "border-red-500" : ""}
                  min="1"
                  max="10000"
                />
                {errors.pointsRequired && (
                  <p className="text-sm text-red-600">{errors.pointsRequired}</p>
                )}
                <p className="text-xs text-gray-500">
                  How many points members need to redeem this reward
                </p>
              </div>

              {/* Preview */}
              {formData.name && formData.pointsRequired && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{formData.name}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {formData.pointsRequired} pts
                      </span>
                    </div>
                    {formData.description && (
                      <p className="text-sm text-gray-600">{formData.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim() || !formData.pointsRequired.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? "Creating..." : "Create Reward"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Tips for Creating Great Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Make rewards achievable - consider how many points members typically earn</li>
              <li>• Be specific in descriptions - clearly explain what's included</li>
              <li>• Offer variety - different point levels for different interests</li>
              <li>• Consider both individual and team rewards</li>
              <li>• Keep it engaging - rewards should motivate participation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
