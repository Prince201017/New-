# BrightSmile Dental Clinic — Dashboard + Supabase foundation

This project is a responsive clinic operations dashboard matching the public BrightSmile white/light-blue medical design.

Included:
- Supabase email/password authentication
- Responsive admin dashboard
- Appointment overview and KPI cards
- Appointment table
- Patient reschedule workflow UI
- WhatsApp communication dashboard UI
- Patient/doctor/service/settings navigation shell
- PostgreSQL schema for profiles, doctors, services, appointments, reschedule requests, events, WhatsApp messages, clinic settings and audit logs
- RLS policies
- Supabase Edge Function foundation for WhatsApp notification delivery
- Supabase Edge Function for authenticated patient reschedule requests
- Demo mode when Supabase variables are absent

## 1. Install

```bash
npm install
cp .env.example .env
```

Add:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Do not put a Supabase secret/service-role key in the Vite environment.

## 2. Database

Run `supabase/migrations/001_brightsmile_clinic.sql` against the intended Supabase project.

After applying it, create your first staff account in Supabase Auth. The trigger creates its profile. Then promote that profile to `super_admin` using the SQL editor:

```sql
update public.profiles
set role = 'super_admin'
where id = 'AUTH_USER_UUID';
```

Only do this for a trusted clinic administrator.

## 3. Run

```bash
npm run dev
```

## 4. WhatsApp

The Edge Function intentionally stops at the secure server-side boundary until a WhatsApp Business provider is selected.

Set provider secrets only in Supabase Edge Function Secrets. Never expose provider credentials in the browser.

Typical secrets are provider-specific, for example:

```text
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
```

The exact payload/template endpoint depends on the provider and approved WhatsApp Business templates.

Deploy:

```bash
supabase functions deploy appointment-notify
supabase functions deploy reschedule-appointment
```

## 5. Production security model

Patient:
- Read own profile
- Create/read own appointments
- Create/read own reschedule requests

Doctor:
- Read assigned/clinic appointment data according to the role policies you extend
- Work with clinical workflow

Receptionist:
- Manage appointment and patient operations

Admin:
- Manage clinic configuration and operational data

Super admin:
- Full clinic administration

RLS is the authorization boundary. Frontend route hiding is not considered security.

## 6. Recommended next production work

1. Replace demo dashboard mapping with relational joins for patient, doctor and service names.
2. Add a patient-facing authenticated booking page.
3. Add doctor availability and conflict prevention.
4. Add atomic appointment/reschedule approval transactions.
5. Connect the selected WhatsApp Business provider.
6. Add WhatsApp webhook delivery/read/failure updates.
7. Add notification templates and consent/opt-out handling.
8. Add audit logging for every admin action.
9. Add calendar/day/week views.
10. Add automated appointment reminders.
11. Add rate limiting and abuse protection around booking endpoints.
12. Add backups and recovery testing.

