import { supabase } from "../supabase";
import type { Group, Challenge, Vote, UserGroupMembership } from "@/models";

// Function to get all groups for a user

export const getUserGroups = async (userId: string): Promise<Group[]> => {
    const { data, error } = await supabase
        .from("user_group_memberships")
        .select(`
        groups (
            id,
            name,
            description,
            admin,
            created_at,
            invite_code,
            members_count,
            active_challenges
        )
        `)
        .eq("user_id", userId);  

    if (error) {
        console.error("Error fetching user groups:", error);
        return [];
    }

    console.log("Fetched user groups:", data);

    // Extract the groups from the nested structure and add members array
    const groups: Group[] = data?.map((item: any) => ({
        id: item.groups.id,
        name: item.groups.name,
        description: item.groups.description,
        admin: item.groups.admin,
        createdAt: item.groups.created_at,
        inviteCode: item.groups.invite_code,
        membersCount: item.groups.members_count,
        activeChallenges: item.groups.active_challenges,
    })) || [];

    return groups;
};

// Function to create a new group

export const createGroup = async (group: Group): Promise<Group | null> => {
    console.log("🚀 Starting group creation...");
    console.log("📝 Group data to insert:", {
        name: group.name,
        description: group.description,
        admin: group.admin,
        invite_code: group.inviteCode,
    });

    try {
        console.log("📡 Testing Supabase connection...");
        
        // Test connection first
        const testStart = Date.now();
        const { data: testData, error: testError } = await supabase
            .from("groups")
            .select("count")
            .limit(1);
        
        console.log(`⏱️ Connection test took ${Date.now() - testStart}ms`);
            
        if (testError) {
            console.error("❌ Supabase connection test failed:", testError);
            throw new Error(`Database connection failed: ${testError.message}`);
        }
        
        console.log("✅ Supabase connection successful");
        console.log("💾 Inserting group into database...");

        const insertStart = Date.now();
        const { data, error } = await supabase
            .from("groups")
            .insert([{
                name: group.name,
                description: group.description,
                admin: group.admin,
                invite_code: group.inviteCode,
            }])
            .select()
            .single();

        console.log(`⏱️ Group insert took ${Date.now() - insertStart}ms`);
        console.log("📊 Database response:", { data, error });

        if (error) {
            console.error("❌ Database error creating group:", error);
            console.error("❌ Error details:", JSON.stringify(error, null, 2));
            throw new Error(`Database error: ${error.message}`);
        }

        if (!data) {
            console.error("❌ No data returned from group creation");
            throw new Error("No data returned from database");
        }

        console.log("✅ Group created successfully:", data);
        console.log("👤 Adding admin membership...");

        // Automatically add the admin as a member
        const membershipStart = Date.now();
        const membershipAdded = await addGroupMembership(group.admin, data.id, "admin");
        console.log(`⏱️ Membership addition took ${Date.now() - membershipStart}ms`);
        
        if (!membershipAdded) {
            console.error("⚠️ Failed to add admin membership, but group was created");
            // Still return the group even if membership addition fails
        } else {
            console.log("✅ Admin membership added successfully");
        }

        const result = {
            id: data.id,
            name: data.name,
            description: data.description || "",
            admin: data.admin,
            createdAt: data.created_at,
            inviteCode: data.invite_code,
            membersCount: data.members_count || 1,
            activeChallenges: data.active_challenges || 0,
        } as Group;

        console.log("🎉 Group creation completed:", result);
        return result;
    } catch (error) {
        console.error("💥 Unexpected error creating group:", error);
        console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        throw error; // Re-throw to let the UI handle it
    }
};

// Function to add a membership to a group

export const addGroupMembership = async (userId: string, groupId: string, role: string): Promise<boolean> => {
    console.log("👥 Adding group membership:", { userId, groupId, role });
    
    try {
        const { error } = await supabase
            .from("user_group_memberships")
            .insert([{ user_id: userId, group_id: groupId, role: role }]);

        if (error) {
            console.error("❌ Error adding group membership:", error);
            console.error("❌ Membership error details:", JSON.stringify(error, null, 2));
            return false;
        }

        console.log("✅ Group membership added successfully for user:", userId, "to group:", groupId);
        return true;
    } catch (error) {
        console.error("💥 Unexpected error adding membership:", error);
        return false;
    }
};

// Function to get group memebrship given a user ID and group ID

export const getGroupMembership = async (userId: string, groupId: string): Promise<UserGroupMembership | null> => {
    try {
        const { data, error } = await supabase
            .from("user_group_memberships")
            .select("*")
            .eq("user_id", userId)
            .eq("group_id", groupId)
            .single();

        if (error) {
            console.error("Error fetching group membership:", error);
            return null;
        }

        if (!data) {
            console.warn("No membership found for user:", userId, "in group:", groupId);
            return null;
        }

        console.log("Fetched group membership:", data);
        return {
            userId: data.user_id,
            groupId: data.group_id,
            role: data.role,
            joinedAt: data.joined_at,
            points: data.points || 0,
        } as UserGroupMembership;
    } catch (error) {
        console.error("Unexpected error fetching group membership:", error);
        return null;
    }
};

// Function to join a group using an invite code

export const joinGroup = async (userId: string, inviteCode: string): Promise<Group | null> => {
    try {
        // First, find the group by invite code
        const { data: groupData, error: groupError } = await supabase
            .from("groups")
            .select("*")
            .eq("invite_code", inviteCode)
            .single();

        if (groupError || !groupData) {
            console.error("Error finding group with invite code:", groupError);
            return null;
        }

        console.log("Found group:", groupData);

        // Check if user is already a member
        const { data: existingMembership, error: membershipCheckError } = await supabase
            .from("user_group_memberships")
            .select("*")
            .eq("user_id", userId)
            .eq("group_id", groupData.id)
            .single();

        if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
            console.error("Error checking existing membership:", membershipCheckError);
            return null;
        }

        if (existingMembership) {
            console.log("User is already a member of this group");
            // Return the group data even if already a member
            return {
                id: groupData.id,
                name: groupData.name,
                description: groupData.description || "",
                admin: groupData.admin,
                createdAt: groupData.created_at,
                inviteCode: groupData.invite_code,
                membersCount: groupData.members_count || 1,
                activeChallenges: groupData.active_challenges || 0,
            } as Group;
        }

        // Add user as a member
        const membershipAdded = await addGroupMembership(userId, groupData.id, "member");
        
        if (!membershipAdded) {
            console.error("Failed to add user to group");
            return null;
        }

        // Update member count
        const { error: updateError } = await supabase
            .from("groups")
            .update({ 
                members_count: (groupData.members_count || 1) + 1 
            })
            .eq("id", groupData.id);

        if (updateError) {
            console.error("Error updating member count:", updateError);
            // Don't fail the join operation for this
        }

        console.log("Successfully joined group:", groupData.name);

        return {
            id: groupData.id,
            name: groupData.name,
            description: groupData.description || "",
            admin: groupData.admin,
            createdAt: groupData.created_at,
            inviteCode: groupData.invite_code,
            membersCount: (groupData.members_count || 1) + 1,
            activeChallenges: groupData.active_challenges || 0,
        } as Group;
    } catch (error) {
        console.error("Unexpected error joining group:", error);
        return null;
    }
};

// FUnction to get a group by ID
export const getGroupById = async (groupId: string): Promise<Group | null> => {
        try {
            const { data, error } = await supabase
                .from("groups")
                .select("*")
                .eq("id", groupId)
                .single();
    
            if (error) {
                console.error("Error fetching group by ID:", error);
                return null;
            }
    
            if (!data) {
                console.warn("No group found with ID:", groupId);
                return null;
            }
    
            console.log("Fetched group by ID:", data);
            return {
                id: data.id,
                name: data.name,
                description: data.description || "",
                admin: data.admin,
                createdAt: data.created_at,
                inviteCode: data.invite_code,
                membersCount: data.members_count || 0,
                activeChallenges: data.active_challenges || 0,
            } as Group;
        } catch (error) {
            console.error("Unexpected error fetching group by ID:", error);
            return null;
        }
    }

// Function to get all challenges of a group

export const getGroupChallenges = async (groupId: string): Promise<Challenge[]> => {
    try {
        const { data, error } = await supabase
            .from("challenge")
            .select("*")
            .eq("group_id", groupId);

        if (error) {
            console.error("Error fetching group challenges:", error);
            return [];
        }

        if (!data || data.length === 0) {
            console.warn("No challenges found for group:", groupId);
            return [];
        }

        // Map the data to Challenge structure
        const challenges: Challenge[] = data.map((item: any) => ({
            id: item.id,
            groupId: item.group_id,
            title: item.title,
            description: item.description || "No Description",
            createdBy: item.created_by,
            createdAt: item.created_at,
            startDate: item.start_date,
            endDate: item.end_date,
            points: item.points || 0,
            status: item.status || "pending",
            participantsCount: item.participants_count || 0,
            completedCount: item.completed_count || 0,
        }));

        console.log("Fetched group challenges:", data);
        return challenges;
    } catch (error) {
        console.error("Unexpected error fetching group challenges:", error);
        return [];
    }
};

// Function to get member votes for a challenge

export const getChallengeVotes = async (challengeId: string): Promise<Vote[]> => {
    try {
        const { data, error } = await supabase
            .from("challenge_vote")
            .select("*")
            .eq("challenge_id", challengeId);

        if (error) {
            console.error("Error fetching challenge votes:", error);
            return [];
        }

        if (!data || data.length === 0) {
            console.warn("No votes found for challenge:", challengeId);
            return [];
        }

        // Map the data to Vote structure
        const votes: Vote[] = data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            challengeId: item.challenge_id,
            approved: item.approved,
            votedAt: item.voted_at,
        }));

        console.log("Fetched challenge votes:", votes);
        return votes;
    } catch (error) {
        console.error("Unexpected error fetching challenge votes:", error);
        return [];
    }
};

// Function to get all members of a group

export const getAllGroupMemberShips = async (groupId: string): Promise<UserGroupMembership[]> => {
    try {
        const { data, error } = await supabase
            .from("user_group_memberships")
            .select("*")
            .eq("group_id", groupId);

        if (error) {
            console.error("Error fetching group members:", error);
            return [];
        }
        
        if (!data || data.length === 0) {
            console.warn("No members found for group:", groupId);
            return [];
        }

        // Map the data to UserGroupMembership structure

        const memberships: UserGroupMembership[] = data.map((item: any) => ({
            userId: item.user_id,
            groupId: item.group_id,
            role: item.role,
            joinedAt: item.joined_at,
            points: item.points || 0, // Ensure points is always a number
        }));

        console.log("Fetched group members:", data);
        return memberships;
    } catch (error) {
        console.error("Unexpected error fetching group members:", error);
        return [];
    }
};