import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabase } from "./client";
import type { Database } from "./database.types";

// Data access for the app. Selects alias snake_case columns to the camelCase
// shapes the UI uses, and RLS on every table decides what each user can see.

export type PostType = "OFFER" | "ASK";

export interface Author {
  id: string;
  username: string | null;
}

export interface SkillPost {
  id: number;
  title: string;
  description: string;
  type: PostType;
  posterImageUrl: string | null;
  archived: boolean;
  createdAt: string;
  author: Author;
}

export interface Connection {
  id: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
  createdAt: string;
  acceptedAt: string | null;
  skillPost: SkillPost;
  requester: Author;
  approver: Author;
}

export interface Message {
  id: number;
  content: string;
  timestamp: string;
  connectionId: number;
  sender: Author;
}

export interface AppStats {
  totalUsers: number;
  totalConnections: number;
  activeConnections: number;
  totalPosts: number;
  activePosts: number;
}

const AUTHOR = "id, username";
const POST_SELECT = `id, title, description, type, posterImagePath:poster_image_path, archived, createdAt:created_at, author:profiles!author_id(${AUTHOR})`;
const CONNECTION_SELECT = `id, status, createdAt:created_at, acceptedAt:accepted_at, skillPost:skill_posts!skill_post_id(${POST_SELECT}), requester:profiles!requester_id(${AUTHOR}), approver:profiles!approver_id(${AUTHOR})`;
const MESSAGE_SELECT = `id, content, timestamp:created_at, connectionId:connection_id, sender:profiles!sender_id(${AUTHOR})`;

const POST_IMAGES_BUCKET = "post-images";

// Rows as selected; posters are stored as paths in the post-images bucket.
type PostRow = Omit<SkillPost, "posterImageUrl"> & {
  posterImagePath: string | null;
};
type ConnectionRow = Omit<Connection, "skillPost"> & { skillPost: PostRow };

function toSkillPost({ posterImagePath, ...post }: PostRow): SkillPost {
  return {
    ...post,
    posterImageUrl: posterImagePath
      ? getSupabase().storage.from(POST_IMAGES_BUCKET).getPublicUrl(posterImagePath)
          .data.publicUrl
      : null,
  };
}

function toConnection(row: ConnectionRow): Connection {
  return { ...row, skillPost: toSkillPost(row.skillPost) };
}

// Turns Postgres/PostgREST errors into messages fit for a toast.
function toError(error: PostgrestError, fallback: string): Error {
  if (error.code === "23505") {
    return new Error(
      error.message.includes("connections_one_open_request_idx")
        ? "You've already sent a request for this post."
        : error.message,
    );
  }
  if (error.code === "23514") {
    return new Error("Some fields are empty or too long.");
  }
  if (error.code === "42501") {
    return new Error("You're not allowed to do that.");
  }
  // Messages raised by our own functions/triggers are user-facing.
  if (error.code?.startsWith("P0") || error.code === "22023") {
    return new Error(error.message);
  }
  console.error(fallback, error);
  return new Error(fallback);
}

// ---------------------------------------------------------------- posts

export async function fetchNearbyPosts(lat: number, lon: number) {
  const { data, error } = await getSupabase()
    .rpc("nearby_posts", { lat, lon })
    .select(POST_SELECT);
  if (error) throw toError(error, "Failed to load nearby skills");
  return (data as unknown as PostRow[]).map(toSkillPost);
}

export async function fetchMyPosts(userId: string) {
  const { data, error } = await getSupabase()
    .from("skill_posts")
    .select(POST_SELECT)
    .eq("author_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw toError(error, "Failed to load your skills");
  return (data as unknown as PostRow[]).map(toSkillPost);
}

export async function archivePost(postId: number) {
  const { data, error } = await getSupabase()
    .from("skill_posts")
    .update({ archived: true })
    .eq("id", postId)
    .select("id");
  if (error) throw toError(error, "Failed to archive post");
  if (data.length === 0) throw new Error("You can only archive your own posts.");
}

export async function createPost(input: {
  title: string;
  description: string;
  type: PostType;
  posterImagePath: string | null;
}) {
  // author_id defaults to auth.uid(); RLS requires the poster to be in the
  // author's own storage folder.
  const { data, error } = await getSupabase()
    .from("skill_posts")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      poster_image_path: input.posterImagePath,
    })
    .select(POST_SELECT)
    .single();
  if (error) throw toError(error, "Failed to create post");
  return toSkillPost(data as unknown as PostRow);
}

// Uploads into `<userId>/` in the post-images bucket and returns the path.
export async function uploadPosterImage(userId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await getSupabase()
    .storage.from(POST_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) {
    console.error("Image upload failed", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
  return path;
}

// ---------------------------------------------------------------- connections

export async function requestConnection(skillPostId: number) {
  // requester_id defaults to auth.uid(); approver_id is set by a trigger
  // from the post's author, so the client only sends the post id.
  const row = { skill_post_id: skillPostId } as
    Database["public"]["Tables"]["connections"]["Insert"];
  const { error } = await getSupabase().from("connections").insert(row);
  if (error) throw toError(error, "Failed to send connection request");
}

export async function fetchConnection(connectionId: number) {
  const { data, error } = await getSupabase()
    .from("connections")
    .select(CONNECTION_SELECT)
    .eq("id", connectionId)
    .maybeSingle();
  if (error) throw toError(error, "Failed to load connection");
  return data ? toConnection(data as unknown as ConnectionRow) : null;
}

export async function fetchPendingRequests(userId: string) {
  const { data, error } = await getSupabase()
    .from("connections")
    .select(CONNECTION_SELECT)
    .eq("approver_id", userId)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });
  if (error) throw toError(error, "Failed to load connection requests");
  return (data as unknown as ConnectionRow[]).map(toConnection);
}

export async function respondToRequest(
  connectionId: number,
  status: "ACCEPTED" | "REJECTED",
) {
  const { data, error } = await getSupabase()
    .from("connections")
    .update({ status })
    .eq("id", connectionId)
    .select("id");
  if (error) throw toError(error, "Failed to update request");
  if (data.length === 0) throw new Error("Request not found.");
}

export async function fetchActiveConnections() {
  // RLS limits this to connections the current user is part of.
  const { data, error } = await getSupabase()
    .from("connections")
    .select(CONNECTION_SELECT)
    .eq("status", "ACCEPTED")
    .order("accepted_at", { ascending: false });
  if (error) throw toError(error, "Failed to load conversations");
  return (data as unknown as ConnectionRow[]).map(toConnection);
}

// ---------------------------------------------------------------- messages

export async function fetchMessages(connectionIds: number[]) {
  const { data, error } = await getSupabase()
    .from("messages")
    .select(MESSAGE_SELECT)
    .in("connection_id", connectionIds)
    .order("created_at", { ascending: true });
  if (error) throw toError(error, "Failed to load messages");
  return data as unknown as Message[];
}

export async function sendMessage(connectionId: number, content: string) {
  const { data, error } = await getSupabase()
    .from("messages")
    .insert({ connection_id: connectionId, content })
    .select(MESSAGE_SELECT)
    .single();
  if (error) throw toError(error, "Failed to send message");
  return data as unknown as Message;
}

// ---------------------------------------------------------------- users

export async function fetchProfile(userId: string) {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select(AUTHOR)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw toError(error, "Failed to load profile");
  return data as Author | null;
}

export async function setMyLocation(lat: number, lon: number) {
  const { error } = await getSupabase().rpc("set_my_location", { lat, lon });
  if (error) throw toError(error, "Failed to update location");
}

export async function generateUsernames() {
  const { data, error } = await getSupabase().rpc("generate_usernames");
  if (error) throw toError(error, "Could not load username options");
  return data;
}

export async function claimUsername(username: string) {
  const { error } = await getSupabase().rpc("claim_username", {
    p_username: username,
  });
  if (error) throw toError(error, "Could not claim that username");
}

export async function fetchStats() {
  const { data, error } = await getSupabase().rpc("app_stats");
  if (error) throw toError(error, "Failed to load stats");
  return data as unknown as AppStats;
}
