import { supabase  } from "../supabase";


// Function to get user by ID

export const getUserById = async (userId: string) => {

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }

  

  return data;
};

// Function to create a new user row with id, and username

export const createUserWithUsername= async (userId: string, username: string) => {
  const { data, error } = await supabase
    .from("users")
    .insert([{ id: userId, username }])
    .select()
    .single();

  if (error) {
    console.error("Error creating user:", error);
    return null;
  }

  return data;
};

// Function to update user information
export const updateUser = async (userId: string, updates: { username?: string; avatarUrl?: string }) => {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    throw new Error(error.message);
  }

  return data;
};