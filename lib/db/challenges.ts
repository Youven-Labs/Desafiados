import { supabase } from "../supabase";
import { Challenge, ChallengeSubmission, Vote } from "../../models";

export async function createChallenge(challenge: Challenge) {
    console.log("Creating challenge:", challenge);
    const { data, error } = await supabase
        .from("challenge")
        .insert(
            {
                id: challenge.id,
                group_id: challenge.groupId,
                title: challenge.title,
                description: challenge.description,
                created_by: challenge.createdBy,
                created_at: challenge.createdAt,
                start_date: challenge.startDate,
                end_date: challenge.endDate,
                points: challenge.points,
                status: challenge.status
            }
        )
        .select()
        .single();

    console.log("Create challenge response:", data, error);

    if (error) {
        console.error("Error creating challenge:", error);
        throw new Error(error.message);
    }

    return data;
}


export async function addVoteToChallenge(challengeId: string, userId: string, approved: boolean) {
    console.log("Adding vote to challenge:", { challengeId, userId, approved });
    const { data, error } = await supabase
        .from("challenge_vote")
        .insert({
            challenge_id: challengeId,
            user_id: userId,
            approved: approved
        })
        .select()
        .single();

    console.log("Add vote response:", data, error);

    if (error) {
        console.error("Error adding vote:", error);
        throw new Error(error.message);
    }

    return data;
}

export async function activateChallenge(challengeId: string) {
    console.log("Activating challenge:", challengeId);
    const { data, error } = await supabase
        .from("challenge")
        .update({ status: "active" })
        .eq("id", challengeId)
        .select()
        .single();

    console.log("Activate challenge response:", data, error);

    if (error) {
        console.error("Error activating challenge:", error);
        throw new Error(error.message);
    }

    return data;
}

// Function to get Challenge by ID in the Challenge Class
export async function getChallengeById(challengeId: string) {
    console.log("Getting challenge by ID:", challengeId);
    const { data, error } = await supabase
        .from("challenge")
        .select("*")
        .eq("id", challengeId)
        .single();

    console.log("Get challenge by ID response:", data, error);

    const challenge: Challenge = {
        id: data?.id || "",
        groupId: data?.group_id || "",
        title: data?.title || "",
        description: data?.description || "",
        createdBy: data?.created_by || "",
        createdAt: data?.created_at || "",
        startDate: data?.start_date || "",
        endDate: data?.end_date || "",
        points: data?.points || 0,
        status: data?.status || "pending",
        completedCount: data?.completed_count || 0,
    };

    if (error) {
        console.error("Error getting challenge by ID:", error);
        throw new Error(error.message);
    }

    return challenge;
}

// FUnction to get all user submissions for challenges
export async function getUserChallengeSubmissions(userId: string) {
    console.log("Getting user challenge submissions for user:", userId);
    const { data, error } = await supabase
        .from("challenge_submission")
        .select("*")
        .eq("user_id", userId)
        .eq("approved", true);

    const challengeSubmissions: ChallengeSubmission[] = data?.map((submission) => ({
        id: submission.id,
        challengeId: submission.challenge_id,
        userId: submission.user_id,
        submittedProof: submission.submitted_proof,
        proofUrl: submission.proof_url || "",
        submittedAt: submission.submitted_at,
        approvedAt: submission.approved_at,
        approved: submission.approved,
        pointsEarned: submission.points_earned || 0,
    })) || [];

    console.log("Get user challenge submissions response:", data, error);

    if (error) {
        console.error("Error getting user challenge submissions:", error);
        throw new Error(error.message);
    }

    return challengeSubmissions;
}

// Function to get all challenges, whose submission was made and approved
export async function getAllSubmittedChallenges(userId: string) {
    console.log("Getting all submitted challenges");
    
    const challengeSubmissions = await getUserChallengeSubmissions(userId);

    const { data, error } = await supabase
        .from("challenge")
        .select("*")
        .in("id", challengeSubmissions.map(submission => submission.challengeId));
    
    console.log("Get all submitted challenges response:", data, error);

    const challenges: Challenge[] = data?.map((challenge) => ({
        id: challenge.id,
        groupId: challenge.group_id,
        title: challenge.title,
        description: challenge.description,
        createdBy: challenge.created_by,
        createdAt: challenge.created_at,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        points: challenge.points,
        status: challenge.status,
        completedCount: challenge.completed_count || 0,
    })) || [];

    if (error) {
        console.error("Error getting all submitted challenges:", error);
        throw new Error(error.message);
    }

    return challenges
}

export async function getNumberOfChallengesCreated(userId: string) {
    console.log("Getting number of challenges created by user:", userId);
    const { count, error } = await supabase
        .from("challenge")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .eq("created_by", userId);

    console.log("Get number of challenges created response:", count, error);

    if (error) {
        console.error("Error getting number of challenges created:", error);
        throw new Error(error.message);
    }

    return count || 0;
}

// Function to get all submissions for a specific challenge
export async function getChallengeSubmissions(challengeId: string) {
    console.log("Getting challenge submissions for challenge:", challengeId);
    const { data, error } = await supabase
        .from("challenge_submission")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("submitted_at", { ascending: false });

    const challengeSubmissions: ChallengeSubmission[] = data?.map((submission) => ({
        id: submission.id,
        challengeId: submission.challenge_id,
        userId: submission.user_id,
        submittedProof: submission.submitted_proof,
        proofUrl: submission.proof_url || "",
        submittedAt: submission.submitted_at,
        approvedAt: submission.approved_at,
        approved: submission.approved,
        pointsEarned: submission.points_earned || 0,
    })) || [];

    console.log("Get challenge submissions response:", data, error);

    if (error) {
        console.error("Error getting challenge submissions:", error);
        throw new Error(error.message);
    }

    return challengeSubmissions;
}

// Function to create a new challenge submission
export async function createChallengeSubmission(submission: ChallengeSubmission) {
    console.log("Creating challenge submission:", submission);
    const { data, error } = await supabase
        .from("challenge_submission")
        .insert({
            id: submission.id,
            challenge_id: submission.challengeId,
            user_id: submission.userId,
            submitted_proof: submission.submittedProof,
            proof_url: submission.proofUrl,
            submitted_at: submission.submittedAt,
            points_earned: submission.pointsEarned
        })
        .select()
        .single();

    console.log("Create challenge submission response:", data, error);

    if (error) {
        console.error("Error creating challenge submission:", error);
        throw new Error(error.message);
    }

    return data;
}

// Function to approve/reject a challenge submission
export async function updateSubmissionApproval(submissionId: string, approved: boolean, pointsEarned: number = 0) {
    console.log("Updating submission approval:", { submissionId, approved, pointsEarned });
    const { data, error } = await supabase
        .from("challenge_submission")
        .update({
            approved: approved,
            approved_at: approved ? new Date().toISOString() : null,
            points_earned: approved ? pointsEarned : 0
        })
        .eq("id", submissionId)
        .select()
        .single();

    console.log("Update submission approval response:", data, error);

    if (error) {
        console.error("Error updating submission approval:", error);
        throw new Error(error.message);
    }

    return data;
}

// Function to get user's submission for a specific challenge
export async function getUserSubmissionForChallenge(userId: string, challengeId: string) {
    console.log("Getting user submission for challenge:", { userId, challengeId });
    const { data, error } = await supabase
        .from("challenge_submission")
        .select("*")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is okay
        console.error("Error getting user submission for challenge:", error);
        throw new Error(error.message);
    }

    if (!data) {
        return null;
    }

    const submission: ChallengeSubmission = {
        id: data.id,
        challengeId: data.challenge_id,
        userId: data.user_id,
        submittedProof: data.submitted_proof,
        proofUrl: data.proof_url || "",
        submittedAt: data.submitted_at,
        approvedAt: data.approved_at,
        approved: data.approved,
        pointsEarned: data.points_earned || 0,
    };

    console.log("Get user submission for challenge response:", submission);
    return submission;
}