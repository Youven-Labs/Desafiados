/**
 * Landing Page
 * Welcome page with app introduction and authentication options
 * Entry point for new users to learn about and join Desafiados
 */
"use client"

import { useEffect } from "react"
// import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card"
import { Trophy, Users, Target, Star } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  // const { user, loading } = useAuth()
  
  const router = useRouter()

  var loading = false // Simulating loading state, replace with actual loading logic

  /*
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard")
    }
  }, [user, loading, router])
  */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  /*
  if (user) {
    return null // Will redirect to dashboard
  }
  */

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">D</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Desafiados
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create, share, and complete challenges with your friends. Earn points, unlock rewards, and make every day
              an adventure!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-3" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Desafiados Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, fun, and engaging. Challenge your friends and make every day count.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Create Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Propose fun and exciting challenges for your friend group to vote on and complete together.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-pink-600" />
                </div>
                <CardTitle className="text-xl">Vote Together</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Group members vote on proposed challenges and submissions to keep everyone engaged and fair.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Earn Points</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Complete challenges to earn points and climb the leaderboard. Show off your achievements!
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Unlock Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Spend your points on group rewards and experiences that everyone can enjoy together.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Start Your Adventure?</h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of friends already making memories and achieving goals together.
          </p>
          <div className="inline-block group relative">
            <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-pink-400 via-purple-400 to-orange-400 blur opacity-70 group-hover:opacity-100 group-hover:blur-md transition-all duration-500 animate-pulse z-0"></span>
            <Button size="lg" variant="secondary" className="relative z-10 text-lg px-8 py-3 font-bold rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:from-pink-500 group-hover:to-orange-400 focus:outline-none focus:ring-4 focus:ring-pink-300 text-white" asChild>
              <Link href="/auth/signup">Create Your Group Today</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
