/// <reference path="../deno.d.ts" />

// @ts-nocheck
/**
 * Supabase Edge Function for creating Onfido applicants
 * 
 * This file runs in the Deno runtime and uses Deno-specific imports.
 * TypeScript checking is disabled for this file as it uses Deno-specific features.
 */

// @deno-types="https://deno.land/std@0.177.0/http/server.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// @deno-types="https://esm.sh/@supabase/supabase-js@2.7.1"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Declare Deno namespace to avoid TypeScript errors
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  country?: string;
  address?: {
    flat_number?: string;
    building_number?: string;
    building_name?: string;
    street: string;
    sub_street?: string;
    town: string;
    state?: string;
    postcode: string;
    country: string;
    line1?: string;
    line2?: string;
    line3?: string;
  };
  idNumbers?: Array<{
    type: string;
    value: string;
    state_code?: string;
  }>;
  investorId: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const ONFIDO_API_TOKEN = Deno.env.get("ONFIDO_API_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ONFIDO_API_TOKEN) {
      throw new Error("ONFIDO_API_TOKEN is not set");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Parse request body
    const { firstName, lastName, email, dateOfBirth, country, address, idNumbers, investorId } = await req.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !investorId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Build Onfido applicant data
    const applicantData = {
      first_name: firstName,
      last_name: lastName,
      email,
    };

    // Add optional fields if provided
    if (dateOfBirth) {
      applicantData.dob = dateOfBirth;
    }

    if (country) {
      applicantData.country = country;
    }

    if (address) {
      applicantData.address = address;
    }

    if (idNumbers && idNumbers.length > 0) {
      applicantData.id_numbers = idNumbers;
    }

    // Create applicant in Onfido
    const onfidoResponse = await fetch("https://api.onfido.com/v3/applicants", {
      method: "POST",
      headers: {
        "Authorization": `Token token=${ONFIDO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(applicantData),
    });

    if (!onfidoResponse.ok) {
      const errorData = await onfidoResponse.json();
      console.error("Onfido API error:", errorData);
      throw new Error(`Onfido API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const onfidoData = await onfidoResponse.json();
    const applicantId = onfidoData.id;

    // Update investor record with Onfido applicant ID
    const { error: updateError } = await supabaseAdmin
      .from("investors")
      .update({
        onfido_applicant_id: applicantId,
        updated_at: new Date().toISOString(),
      })
      .eq("investor_id", investorId);

    if (updateError) {
      console.error("Error updating investor record:", updateError);
      throw new Error(`Error updating investor record: ${updateError.message}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        applicantId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in onfido-create-applicant edge function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred while creating the Onfido applicant",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
