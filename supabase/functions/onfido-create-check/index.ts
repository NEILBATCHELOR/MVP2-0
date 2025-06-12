import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface RequestBody {
  applicantId: string;
  investorId?: string;
  checkType?: string;
  reportNames?: string[];
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
    const { 
      applicantId, 
      investorId, 
      checkType = "standard", 
      reportNames = ["document", "facial_similarity_photo", "watchlist_standard"] 
    } = await req.json() as RequestBody;

    // Validate required fields
    if (!applicantId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: applicantId" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create payload for Onfido check
    const payload = {
      applicant_id: applicantId,
      report_names: reportNames,
      consider: checkType === "express" ? "accept" : null,
      asynchronous: true,
      redirect_uri: null,
    };

    // Remove null properties
    Object.keys(payload).forEach(key => 
      payload[key] === null && delete payload[key]
    );

    // Make API request to Onfido to create a check
    const response = await fetch("https://api.onfido.com/v3/checks", {
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

    // If investorId is provided, update the investor record
    if (investorId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Update the investor record with the check ID and set KYC status to pending
          await supabase
            .from("investors")
            .update({ 
              onfido_check_id: onfidoResponse.id,
              kyc_status: "pending",
              updated_at: new Date().toISOString(),
            })
            .eq("id", investorId);
        }
      } catch (dbError) {
        // Log the error but don't fail the request
        console.error("Error updating investor record:", dbError);
      }
    }

    // Return success response with the check ID
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          checkId: onfidoResponse.id,
          status: onfidoResponse.status,
          result: onfidoResponse.result,
          createdAt: onfidoResponse.created_at,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creating Onfido check:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to create Onfido check: ${error.message}`,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
