import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const identifyApiKey = Deno.env.get("IDENTIFY_API_KEY") || "";
const identifyApiUrl = Deno.env.get("IDENTIFY_API_URL") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const checkId = req.url.split("/").pop();

    // Get check status from Identify
    const response = await fetch(`${identifyApiUrl}/v1/checks/${checkId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${identifyApiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get check status");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        report: {
          id: data.id,
          type: data.report_type,
          status: data.status,
          result: data.result,
          created_at: data.created_at,
          completed_at: data.completed_at,
          details: data.details,
        },
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