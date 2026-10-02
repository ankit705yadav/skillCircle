// Creates a skill post after moderating its text. Clients have no INSERT
// privilege on skill_posts, so this function is the only way to create one.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, getUser, json } from "../_shared/http.ts";
import { isTextFlagged } from "../_shared/moderation.ts";

const POST_SELECT =
  "id, title, description, type, posterImageUrl:poster_image_url, archived, createdAt:created_at, author:profiles!author_id(id, username)";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const user = await getUser(req);
  if (!user) return json({ error: "You must be signed in" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const type = body.type;
  const posterImageUrl =
    typeof body.posterImageUrl === "string" && body.posterImageUrl
      ? body.posterImageUrl
      : null;

  if (type !== "OFFER" && type !== "ASK") {
    return json({ error: "Type must be OFFER or ASK" }, 400);
  }
  if (!title || title.length > 200) {
    return json({ error: "Title must be 1-200 characters" }, 400);
  }
  if (!description || description.length > 5000) {
    return json({ error: "Description must be 1-5000 characters" }, 400);
  }
  const imageKitEndpoint = Deno.env.get("IMAGEKIT_URL_ENDPOINT");
  if (
    posterImageUrl &&
    imageKitEndpoint &&
    !posterImageUrl.startsWith(imageKitEndpoint)
  ) {
    return json({ error: "Poster image must be uploaded through the app" }, 400);
  }

  try {
    if (await isTextFlagged(`${title}\n\n${description}`)) {
      return json(
        { error: "Post contains inappropriate content and was rejected." },
        422,
      );
    }
  } catch (error) {
    console.error("Moderation failed:", error);
    return json(
      { error: "Content moderation is unavailable right now. Please try again later." },
      503,
    );
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await admin
    .from("skill_posts")
    .insert({
      author_id: user.id,
      type,
      title,
      description,
      poster_image_url: posterImageUrl,
    })
    .select(POST_SELECT)
    .single();

  if (error) {
    console.error("Insert failed:", error);
    return json({ error: "Could not create the post" }, 500);
  }
  return json(data, 201);
});
