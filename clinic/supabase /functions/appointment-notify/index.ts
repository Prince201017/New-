import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!secretKey) {
    return Response.json({ error: "Server secret is not configured." }, { status: 500, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, secretKey);
  const body = await req.json();

  const { appointment_id, template_name = "appointment_confirmation" } = body;

  if (!appointment_id) {
    return Response.json({ error: "appointment_id is required" }, { status: 400, headers: corsHeaders });
  }

  const { data: appointment, error } = await admin
    .from("appointments")
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      profiles!appointments_patient_id_fkey(full_name, phone),
      services(name),
      doctors(full_name)
    `)
    .eq("id", appointment_id)
    .single();

  if (error || !appointment) {
    return Response.json({ error: error?.message || "Appointment not found" }, { status: 404, headers: corsHeaders });
  }

  const phone = appointment.profiles?.phone;

  if (!phone) {
    return Response.json({ error: "Patient has no phone number." }, { status: 422, headers: corsHeaders });
  }

  /*
    WhatsApp provider integration belongs here.

    Recommended production flow:
      1. Validate the appointment server-side.
      2. Build an approved WhatsApp template payload.
      3. POST to your WhatsApp Business API provider.
      4. Store provider message ID + status in whatsapp_messages.

    Required secrets should be stored in Supabase Edge Function Secrets,
    never in VITE_* variables or browser code.
  */

  const { data: message, error: insertError } = await admin
    .from("whatsapp_messages")
    .insert({
      appointment_id,
      patient_id: appointment.profiles ? undefined : null,
      direction: "outbound",
      template_name,
      recipient_phone: phone,
      status: "queued",
      payload: {
        patient_name: appointment.profiles?.full_name,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        service: appointment.services?.name,
        doctor: appointment.doctors?.full_name,
      },
    })
    .select()
    .single();

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500, headers: corsHeaders });
  }

  return Response.json({
    ok: true,
    message_id: message.id,
    provider: "pending_configuration",
    note: "Connect your WhatsApp Business provider in this Edge Function and update message status from provider webhooks.",
  }, { headers: corsHeaders });
});
