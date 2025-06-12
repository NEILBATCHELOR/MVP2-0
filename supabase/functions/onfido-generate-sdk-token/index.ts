import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface RequestBody {
  applicantId: string;
  investorId?: string;
  referrer?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Set CORS headers for the actual response
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    // Get the Onfido API token
    const ONFIDO_API_TOKEN = Deno.env.get("ONFIDO_API_TOKEN");
    if (!ONFIDO_API_TOKEN) {
      throw new Error("ONFIDO_API_TOKEN is not set in environment variables");
    }

    // Parse request body
    const { applicantId, investorId, referrer } = await req.json() as RequestBody;

    // Validate required fields
    if (!applicantId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: applicantId" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create payload for Onfido SDK token
    const payload = {
      applicant_id: applicantId,
      referrer: referrer || "*", // Default to wildcard if not provided
    };

    // Make API request to Onfido to generate SDK token
    const response = await fetch("https://api.onfido.com/v3/sdk_token", {
      method: "POST",
      headers: {
        Authorization: `Token token=${ONFIDO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const onfidoResponse = await response.json();

    // Check for errors
    if (!response.ok) {
      console.error("Onfido API error:", onfidoResponse);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Onfido API error: ${onfidoResponse.error?.message || "Unknown error"}` 
        }),
        { status: response.status, headers: corsHeaders }
      );
    }

    // If investorId is provided, optionally update the investor record
    if (investorId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Update the investor record with token generation timestamp
          await supabase
            .from("investors")
            .update({ 
              kyc_sdk_token_generated_at: new Date().toISOString(),
            })
            .eq("id", investorId);
        }
      } catch (dbError) {
        // Log the error but don't fail the request
        console.error("Error updating investor record:", dbError);
      }
    }

    // Return success response with the SDK token
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token: onfidoResponse.token,
          expiration: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // Token expires in 90 minutes
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error generating Onfido SDK token:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to generate Onfido SDK token: ${error.message}`,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
