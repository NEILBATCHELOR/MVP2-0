import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const identifyApiKey = Deno.env.get("IDENTIFY_API_KEY") || "";
const identifyApiUrl = Deno.env.get("IDENTIFY_API_URL") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { entityId, entityType, referrer } = await req.json();

    // Generate SDK token from Identify
    const response = await fetch(`${identifyApiUrl}/v1/sdk/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${identifyApiKey}`,
      },
      body: JSON.stringify({
        entity_id: entityId,
        entity_type: entityType,
        referrer,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to generate SDK token");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        token: data.token,
        expiresAt: data.expires_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});