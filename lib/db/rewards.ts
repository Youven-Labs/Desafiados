import { supabase } from "../supabase";
import { Reward, UserRewardRedemption, User } from "../../models";

// ===== REWARD CRUD OPERATIONS =====

// Create a new reward (admin only)
export async function createReward(reward: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'>) {
    console.log("Creating reward:", reward);
    const { data, error } = await supabase
        .from("rewards")
        .insert({
            group_id: reward.groupId,
            name: reward.name,
            description: reward.description,
            points_required: reward.pointsRequired,
            created_by: reward.createdBy,
            is_active: reward.isActive
        })
        .select()
        .single();

    console.log("Create reward response:", data, error);

    if (error) {
        console.error("Error creating reward:", error);
        throw new Error(error.message);
    }

    return mapRewardFromDB(data);
}

// Get all rewards for a specific group
export async function getRewardsByGroup(groupId: string, activeOnly: boolean = true) {
    console.log("Getting rewards for group:", groupId, "activeOnly:", activeOnly);
    
    let query = supabase
        .from("rewards")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

    if (activeOnly) {
        query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    console.log("Get rewards response:", data, error);

    if (error) {
        console.error("Error fetching rewards:", error);
        throw new Error(error.message);
    }

    return data.map(mapRewardFromDB);
}

// Get reward by ID
export async function getRewardById(rewardId: string) {
    console.log("Getting reward by ID:", rewardId);
    const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("id", rewardId)
        .single();

    console.log("Get reward by ID response:", data, error);

    if (error) {
        console.error("Error fetching reward:", error);
        throw new Error(error.message);
    }

    return mapRewardFromDB(data);
}

// Update reward (admin only)
export async function updateReward(rewardId: string, updates: Partial<Omit<Reward, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'groupId'>>) {
    console.log("Updating reward:", rewardId, updates);
    
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.pointsRequired !== undefined) updateData.points_required = updates.pointsRequired;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
        .from("rewards")
        .update(updateData)
        .eq("id", rewardId)
        .select()
        .single();

    console.log("Update reward response:", data, error);

    if (error) {
        console.error("Error updating reward:", error);
        throw new Error(error.message);
    }

    return mapRewardFromDB(data);
}

// Deactivate reward (soft delete)
export async function deactivateReward(rewardId: string) {
    console.log("Deactivating reward:", rewardId);
    return updateReward(rewardId, { isActive: false });
}

// ===== REWARD REDEMPTION OPERATIONS =====

// Check if user has enough points to redeem a reward
export async function canUserRedeemReward(userId: string, rewardId: string): Promise<{ canRedeem: boolean; userPoints: number; requiredPoints: number }> {
    console.log("Checking if user can redeem reward:", { userId, rewardId });

    // Get reward details
    const reward = await getRewardById(rewardId);
    
    // Get user's points in this group
    const { data: membershipData, error: membershipError } = await supabase
        .from("user_group_memberships")
        .select("points")
        .eq("user_id", userId)
        .eq("group_id", reward.groupId)
        .single();

    if (membershipError) {
        console.error("Error fetching user membership:", membershipError);
        throw new Error("User is not a member of this group");
    }

    const userPoints = membershipData.points || 0;
    const canRedeem = userPoints >= reward.pointsRequired && reward.isActive;

    console.log("Can user redeem:", { canRedeem, userPoints, requiredPoints: reward.pointsRequired });

    return {
        canRedeem,
        userPoints,
        requiredPoints: reward.pointsRequired
    };
}

// Redeem a reward
export async function redeemReward(userId: string, rewardId: string): Promise<UserRewardRedemption> {
    console.log("Redeeming reward:", { userId, rewardId });

    // First check if user can redeem
    const { canRedeem, userPoints, requiredPoints } = await canUserRedeemReward(userId, rewardId);
    
    if (!canRedeem) {
        throw new Error(`Insufficient points. You have ${userPoints} points but need ${requiredPoints} points.`);
    }

    // Create redemption record
    const { data, error } = await supabase
        .from("user_reward_redemptions")
        .insert({
            user_id: userId,
            reward_id: rewardId,
            points_spent: requiredPoints
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating redemption:", error);
        throw new Error(error.message);
    }

    // Update user points in the group
    const reward = await getRewardById(rewardId);
    const { error: updateError } = await supabase
        .from("user_group_memberships")
        .update({
            points: userPoints - requiredPoints
        })
        .eq("user_id", userId)
        .eq("group_id", reward.groupId);

    if (updateError) {
        console.error("Error updating user points:", updateError);
        // Rollback the redemption
        await supabase.from("user_reward_redemptions").delete().eq("id", data.id);
        throw new Error("Failed to update user points");
    }

    console.log("Reward redeemed successfully:", data);
    return mapRedemptionFromDB(data);
}

// Get user's redemption history
export async function getUserRedemptions(userId: string, groupId?: string) {
    console.log("Getting user redemptions:", { userId, groupId });

    let query = supabase
        .from("user_reward_redemptions")
        .select(`
            *,
            rewards (
                id,
                name,
                description,
                points_required,
                group_id,
                groups (
                    id,
                    name
                )
            )
        `)
        .eq("user_id", userId)
        .order("redeemed_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching user redemptions:", error);
        throw new Error(error.message);
    }

    // Filter by group if specified
    let filteredData = data;
    if (groupId) {
        filteredData = data.filter(redemption => redemption.rewards.group_id === groupId);
    }

    return filteredData.map(redemption => ({
        ...mapRedemptionFromDB(redemption),
        reward: mapRewardFromDB(redemption.rewards),
        group: redemption.rewards.groups
    }));
}

// Get redemptions for a specific reward (admin view)
export async function getRewardRedemptions(rewardId: string) {
    console.log("Getting reward redemptions:", rewardId);

    const { data, error } = await supabase
        .from("user_reward_redemptions")
        .select(`
            *,
            users (
                id,
                username,
                email
            )
        `)
        .eq("reward_id", rewardId)
        .order("redeemed_at", { ascending: false });

    if (error) {
        console.error("Error fetching reward redemptions:", error);
        throw new Error(error.message);
    }

    return data.map(redemption => ({
        ...mapRedemptionFromDB(redemption),
        user: redemption.users
    }));
}

// Get group redemption statistics
export async function getGroupRedemptionStats(groupId: string) {
    console.log("Getting group redemption stats:", groupId);

    const { data, error } = await supabase
        .from("user_reward_redemptions")
        .select(`
            *,
            rewards!inner (
                group_id,
                name,
                points_required
            )
        `)
        .eq("rewards.group_id", groupId);

    if (error) {
        console.error("Error fetching group redemption stats:", error);
        throw new Error(error.message);
    }

    const totalRedemptions = data.length;
    const totalPointsSpent = data.reduce((sum, redemption) => sum + redemption.points_spent, 0);
    const uniqueUsers = new Set(data.map(redemption => redemption.user_id)).size;

    return {
        totalRedemptions,
        totalPointsSpent,
        uniqueUsers,
        redemptionsByReward: data.reduce((acc, redemption) => {
            const rewardName = redemption.rewards.name;
            if (!acc[rewardName]) {
                acc[rewardName] = 0;
            }
            acc[rewardName]++;
            return acc;
        }, {} as Record<string, number>)
    };
}

// ===== UTILITY FUNCTIONS =====

// Map database reward object to TypeScript model
function mapRewardFromDB(dbReward: any): Reward {
    return {
        id: dbReward.id,
        groupId: dbReward.group_id,
        name: dbReward.name,
        description: dbReward.description,
        pointsRequired: dbReward.points_required,
        createdBy: dbReward.created_by,
        createdAt: dbReward.created_at,
        updatedAt: dbReward.updated_at,
        isActive: dbReward.is_active
    };
}

// Map database redemption object to TypeScript model
function mapRedemptionFromDB(dbRedemption: any): UserRewardRedemption {
    return {
        id: dbRedemption.id,
        userId: dbRedemption.user_id,
        rewardId: dbRedemption.reward_id,
        redeemedAt: dbRedemption.redeemed_at,
        pointsSpent: dbRedemption.points_spent
    };
}

// Check if user is admin of the group that owns the reward
export async function isUserRewardAdmin(userId: string, rewardId: string): Promise<boolean> {
    console.log("Checking if user is reward admin:", { userId, rewardId });

    // Get the reward and its group
    const { data: rewardData, error: rewardError } = await supabase
        .from("rewards")
        .select("group_id")
        .eq("id", rewardId)
        .single();

    if (rewardError) {
        console.error("Error fetching reward:", rewardError);
        return false;
    }

    // Check if user is group admin
    const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("admin")
        .eq("id", rewardData.group_id)
        .single();

    if (groupError) {
        console.error("Error fetching group:", groupError);
        return false;
    }

    // Check if user is admin via group.admin or membership role
    const { data: membershipData, error: membershipError } = await supabase
        .from("user_group_memberships")
        .select("role")
        .eq("user_id", userId)
        .eq("group_id", rewardData.group_id)
        .single();

    if (membershipError) {
        console.error("Error fetching membership:", membershipError);
        return false;
    }

    return groupData.admin === userId || membershipData.role === "admin";
}

// Get available rewards for a user (rewards they can afford)
export async function getAvailableRewardsForUser(userId: string, groupId: string) {
    console.log("Getting available rewards for user:", { userId, groupId });

    // Get user's points in the group
    const { data: membershipData, error: membershipError } = await supabase
        .from("user_group_memberships")
        .select("points")
        .eq("user_id", userId)
        .eq("group_id", groupId)
        .single();

    if (membershipError) {
        console.error("Error fetching user membership:", membershipError);
        throw new Error("User is not a member of this group");
    }

    const userPoints = membershipData.points || 0;

    // Get active rewards for the group
    const rewards = await getRewardsByGroup(groupId, true);

    // Return rewards with affordability info
    return rewards.map(reward => ({
        ...reward,
        canAfford: userPoints >= reward.pointsRequired,
        userPoints
    }));
}
