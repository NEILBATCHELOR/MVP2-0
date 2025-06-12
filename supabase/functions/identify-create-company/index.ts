import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const identifyApiKey = Deno.env.get("IDENTIFY_API_KEY") || "";
const identifyApiUrl = Deno.env.get("IDENTIFY_API_URL") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, registration_number, country, address } = await req.json();

    // Create company in Identify
    const response = await fetch(`${identifyApiUrl}/v1/companies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${identifyApiKey}`,
      },
      body: JSON.stringify({
        name,
        registration_number,
        country,
        address,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create company");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        companyId: data.id,
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