import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
  const key = publishableKeys.default || Deno.env.get("SUPABASE_ANON_KEY");

  if (!key) return Response.json({ error: "Supabase key unavailable" }, { status: 500, headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return Response.json({ error: "Authorization required" }, { status: 401, headers: corsHeaders });

  const userClient = createClient(url, key, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const body = await req.json();
  const { appointment_id, requested_date, requested_time, reason } = body;

  if (!appointment_id || !requested_date || !requested_time) {
    return Response.json({ error: "appointment_id, requested_date and requested_time are required" }, { status: 400, headers: corsHeaders });
  }

  const { data: appointment, error: appointmentError } = await userClient
    .from("appointments")
    .select("id, patient_id, appointment_date, appointment_time, status")
    .eq("id", appointment_id)
    .single();

  if (appointmentError || !appointment) {
    return Response.json({ error: "Appointment not found or inaccessible" }, { status: 404, headers: corsHeaders });
  }

  if (appointment.patient_id !== user.id) {
    return Response.json({ error: "You can only reschedule your own appointment." }, { status: 403, headers: corsHeaders });
  }

  if (appointment.status === "cancelled" || appointment.status === "completed") {
    return Response.json({ error: "This appointment cannot be rescheduled." }, { status: 409, headers: corsHeaders });
  }

  const { data, error } = await userClient
    .from("reschedule_requests")
    .insert({
      appointment_id,
      requested_by: user.id,
      current_date: appointment.appointment_date,
      current_time: appointment.appointment_time,
      requested_date,
      requested_time,
      reason: reason || null,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });

  return Response.json({ ok: true, request: data }, { headers: corsHeaders });
});
