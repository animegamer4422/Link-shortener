// main.ts - Deno Deploy backend with CORS + GitHub API commit
type Payload = {
  longUrl: string;
  customAlias?: string;
};

const GH_OWNER = "animegamer4422";
const GH_REPO = "Link-shortener";
const BRANCH = "testing";
const FILE_PATH = "urls.json";
const GH_PAT = Deno.env.get("GH_PAT");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Only POST allowed", { status: 405, headers: corsHeaders });
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  const { longUrl, customAlias } = body;
  if (!longUrl) {
    return new Response("Missing longUrl", { status: 400, headers: corsHeaders });
  }

  const alias = customAlias?.trim() || Math.random().toString(36).substring(2, 8);
  const headers = {
    Authorization: `Bearer ${GH_PAT}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Fetch existing urls.json
  const getUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await fetch(getUrl, { headers });

  if (!res.ok) {
    return new Response("Failed to fetch urls.json", { status: 500, headers: corsHeaders });
  }

  const json = await res.json();
  const content = atob(json.content);
  const sha = json.sha;
  const urls = JSON.parse(content);

  // Check if alias exists
  if (urls[alias]) {
    return new Response(JSON.stringify({ error: "Alias already exists." }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Add the new alias
  urls[alias] = longUrl;
  const newContent = btoa(JSON.stringify(urls, null, 2));

  // Commit to GitHub
  const updateRes = await fetch(getUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Add short link: ${alias}`,
      content: newContent,
      branch: BRANCH,
      sha,
    }),
  });

  if (!updateRes.ok) {
    const err = await updateRes.text();
    return new Response("GitHub update failed: " + err, {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      shortUrl: `https://${GH_OWNER}.github.io/${GH_REPO}/go/${alias}/`,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
