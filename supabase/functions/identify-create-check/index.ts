import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const identifyApiKey = Deno.env.get("IDENTIFY_API_KEY") || "";
const identifyApiUrl = Deno.env.get("IDENTIFY_API_URL") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      company_id,
      individual_id,
      report_types,
      document_ids,
      reference,
      webhook_url,
    } = await req.json();

    // Create check in Identify
    const response = await fetch(`${identifyApiUrl}/v1/checks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${identifyApiKey}`,
      },
      body: JSON.stringify({
        company_id,
        individual_id,
        report_types,
        document_ids,
        reference,
        webhook_url,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create check");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        checkId: data.id,
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