import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const identifyApiKey = Deno.env.get("IDENTIFY_API_KEY") || "";
const identifyApiUrl = Deno.env.get("IDENTIFY_API_URL") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { entityId, entityType, config } = await req.json();

    // Setup AML monitoring in Identify
    const response = await fetch(`${identifyApiUrl}/v1/monitoring`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${identifyApiKey}`,
      },
      body: JSON.stringify({
        entity_id: entityId,
        entity_type: entityType,
        frequency: config.frequency,
        notification_email: config.notification_email,
        notification_webhook: config.notification_webhook,
        monitoring_duration_months: config.monitoring_duration_months,
        alert_types: config.alert_types,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to setup monitoring");
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        monitoringId: data.id,
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