import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface RequestBody {
  checkId?: string;
  investorId?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Set CORS headers for the actual response
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    // Get the Onfido API token
    const ONFIDO_API_TOKEN = Deno.env.get("ONFIDO_API_TOKEN");
    if (!ONFIDO_API_TOKEN) {
      throw new Error("ONFIDO_API_TOKEN is not set in environment variables");
    }

    // Get Supabase credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not set in environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    let checkId: string | null = null;
    let investorId: string | null = null;
    
    // Check request method and parse parameters accordingly
    if (req.method === "POST") {
      const body = await req.json() as RequestBody;
      checkId = body.checkId || null;
      investorId = body.investorId || null;
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      checkId = url.searchParams.get("checkId");
      investorId = url.searchParams.get("investorId");
    }

    // Validate required fields - need at least one identifier
    if (!checkId && !investorId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required field: either checkId or investorId must be provided" 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // If we have an investorId but no checkId, look up the checkId from the database
    if (investorId && !checkId) {
      const { data: investor, error: investorError } = await supabase
        .from("investors")
        .select("onfido_check_id")
        .eq("id", investorId)
        .single();
      
      if (investorError || !investor || !investor.onfido_check_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: investorError?.message || "Investor not found or no check ID associated" 
          }),
          { status: 404, headers: corsHeaders }
        );
      }
      
      checkId = investor.onfido_check_id;
    }

    // Make API request to Onfido to get check status
    const response = await fetch(`https://api.onfido.com/v3/checks/${checkId}`, {
      method: "GET",
      headers: {
        Authorization: `Token token=${ONFIDO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
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

    // Map Onfido status to application status
    let kycStatus = "pending";
    let kycDetails = "";
    
    switch (onfidoResponse.status) {
      case "complete":
        kycStatus = onfidoResponse.result === "clear" ? "approved" : "failed";
        break;
      case "in_progress":
        kycStatus = "in_progress";
        break;
      case "awaiting_applicant":
        kycStatus = "awaiting_input";
        break;
      case "withdrawn":
        kycStatus = "cancelled";
        break;
      default:
        kycStatus = "pending";
    }
    
    // Add details if available
    if (onfidoResponse.result_uri) {
      kycDetails = onfidoResponse.result_uri;
    }
    
    if (onfidoResponse.reports) {
      kycDetails = JSON.stringify({
        uri: onfidoResponse.result_uri,
        reports: onfidoResponse.reports.map((report: any) => ({
          name: report.name,
          status: report.status,
          result: report.result,
        })),
      });
    }

    // If we have an investorId, update the investor record with the latest status
    if (investorId) {
      try {
        await supabase
          .from("investors")
          .update({
            kyc_status: kycStatus,
            kyc_details: kycDetails,
            updated_at: new Date().toISOString(),
          })
          .eq("id", investorId);
      } catch (dbError) {
        // Log the error but don't fail the request
        console.error("Error updating investor KYC status:", dbError);
      }
    }

    // Return success response with the check status
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          checkId: checkId,
          status: kycStatus,
          details: kycDetails,
          rawResponse: onfidoResponse,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error getting Onfido check status:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to get Onfido check status: ${error.message}`,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}); 