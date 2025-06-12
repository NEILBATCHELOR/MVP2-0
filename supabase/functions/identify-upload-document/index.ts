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
      entityId,
      entityType,
      type,
      side,
      issuing_country,
      file_data,
      file_name,
    } = await req.json();

    // Convert base64 to blob
    const binaryData = Uint8Array.from(atob(file_data.split(",")[1]), (c) =>
      c.charCodeAt(0)
    );
    const blob = new Blob([binaryData], { type: "application/octet-stream" });

    // Create form data
    const formData = new FormData();
    formData.append("file", blob, file_name);
    formData.append("type", type);
    if (side) formData.append("side", side);
    if (issuing_country) formData.append("issuing_country", issuing_country);

    // Upload document to Identify
    const response = await fetch(
      `${identifyApiUrl}/v1/${entityType}s/${entityId}/documents`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${identifyApiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload document");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        documentId: data.id,
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