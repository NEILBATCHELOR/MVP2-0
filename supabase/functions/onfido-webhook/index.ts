import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get webhook payload
    const payload = await req.json();

    // In a real implementation, you would verify the webhook signature
    // and extract the relevant information from the payload

    // For this demo, we'll assume the payload contains:
    // - resource_type: 'check'
    // - action: 'check.completed'
    // - object: { id: 'check_id', status: 'complete', result: 'clear' }

    const { resource_type, action, object } = payload;

    if (
      resource_type !== "check" ||
      action !== "check.completed" ||
      !object?.id
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the investor with this check ID
    const { data: investors, error: fetchError } = await supabase
      .from("investors")
      .select("investor_id, verification_details")
      .filter("verification_details->check_id", "eq", object.id);

    if (fetchError) throw fetchError;
    if (!investors || investors.length === 0) {
      return new Response(
        JSON.stringify({ error: "No investor found with this check ID" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const investor = investors[0];

    // Determine KYC status based on check result
    let kycStatus = "pending";
    if (object.status === "complete") {
      kycStatus = object.result === "clear" ? "approved" : "failed";
    }

    // Calculate expiry date (1 year from now) if approved
    const expiryDate =
      kycStatus === "approved"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    // Update verification details
    const verificationDetails = {
      ...investor.verification_details,
      status: object.status,
      result: object.result,
      completed_at: new Date().toISOString(),
    };

    // Update the investor record
    const { error } = await supabase
      .from("investors")
      .update({
        kyc_status: kycStatus,
        kyc_expiry_date: expiryDate,
        verification_details: verificationDetails,
        updated_at: new Date().toISOString(),
      })
      .eq("investor_id", investor.investor_id);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
        investorId: investor.investor_id,
        kycStatus,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
