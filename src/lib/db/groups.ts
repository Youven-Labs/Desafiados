import { supabase } from "../supabase";
import type { Group } from "@/models";

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