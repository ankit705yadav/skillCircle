// Signs client-side ImageKit uploads. The private key never leaves the server.
import { corsHeaders, getUser, json } from "../_shared/http.ts";

const encoder = new TextEncoder();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const user = await getUser(req);
  if (!user) return json({ error: "You must be signed in" }, 401);

  const privateKey = Deno.env.get("IMAGEKIT_PRIVATE_KEY");
  if (!privateKey) return json({ error: "Image uploads are not configured" }, 500);

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 15 * 60;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(privateKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(token + expire),
  );
  const signature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return json({ token, expire, signature });
});
