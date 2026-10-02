// Text moderation via OpenAI's free moderation endpoint.
// Throws when moderation cannot be performed; callers must treat that as a
// rejection (fail closed).
export async function isTextFlagged(text: string): Promise<boolean> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Moderation API returned ${response.status}`);
  }

  const data = await response.json();
  const flagged = data?.results?.[0]?.flagged;
  if (typeof flagged !== "boolean") {
    throw new Error("Unexpected moderation API response");
  }
  return flagged;
}
