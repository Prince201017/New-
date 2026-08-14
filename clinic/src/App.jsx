import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  X,
  Check,
} from "lucide-react";
import { supabase, supabaseConfigured } from "./lib/supabase";

const demoAppointments = [
  { id:"APT-00891", patient:"Priya Sharma", phone:"+91 98765 43210", date:"2026-08-13", time:"09:00", service:"General Check-up", doctor:"Dr. Rohan Mehta", status:"confirmed" },
  { id:"APT-00892", patient:"Amit Verma", phone:"+91 98765 56789", date:"2026-08-13", time:"10:30", service:"Teeth Cleaning", doctor:"Dr. Pooja Iyer", status:"confirmed" },
  { id:"APT-00893", patient:"Neha Reddy", phone:"+91 99887 77665", date:"2026-08-13", time:"12:00", service:"Root Canal", doctor:"Dr. Vivek Patel", status:"pending" },
  { id:"APT-00894", patient:"Rahul Mehta", phone:"+91 98765 23456", date:"2026-08-13", time:"15:00", service:"Orthodontic Consultation", doctor:"Dr. Ananya Sharma", status:"confirmed" },
  { id:"APT-00895", patient:"Sneha Kapoor", phone:"+91 97765 44321", date:"2026-08-13", time:"16:30", service:"Dental Implant Consultation", doctor:"Dr. Rohan Mehta", status:"confirmed" },
];

const demoRequests = [
  { id:"REQ-102", patient:"Vikram Singh", current:"13 Aug • 10:00 AM", requested:"15 Aug • 10:00 AM", status:"new" },
  { id:"REQ-103", patient:"Kavya Joshi", current:"13 Aug • 03:00 PM", requested:"14 Aug • 03:00 PM", status:"review" },
  { id:"REQ-104", patient:"Manish Yadav", current:"14 Aug • 11:30 AM", requested:"16 Aug • 11:30 AM", status:"new" },
];

const chartData = [12, 18, 15, 24, 19, 27, 22, 31, 28, 35, 29, 38];

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function formatTime(value) {
  if (!value) return "";
  const [h, m] = value.slice(0,5).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2,"0")}:${String(m).padStart(2,"0")} ${suffix}`;
}

function Status({ value }) {
  const label = value === "confirmed" ? "Confirmed" : value === "pending" ? "Pending" : value === "cancelled" ? "Cancelled" : value === "completed" ? "Completed" : value;
  return <span className={cx("status", `status-${value}`)}>{label}</span>;
}

function Sidebar({ page, setPage, open, setOpen, onSignOut }) {
  const items = [
    ["dashboard","Dashboard",Home],
    ["appointments","Appointments",CalendarDays],
    ["patients","Patients",Users],
    ["doctors","Doctors",Stethoscope],
    ["services","Services",Activity],
    ["reschedules","Reschedule Requests",RefreshCw],
    ["whatsapp","WhatsApp",MessageCircle],
  ];
  const settings = [
    ["clinic","Clinic Profile",ShieldCheck],
    ["users","User Management",UserRound],
    ["settings","Settings",Settings],
    ["audit","Audit Logs",FileText],
  ];

  return (
    <>
      {open && <button className="mobile-overlay" onClick={()=>setOpen(false)} aria-label="Close menu" />}
      <aside className={cx("sidebar", open && "sidebar-open")}>
        <div className="brand-row">
          <div className="brand-mark">✦</div>
          <div>
            <div className="brand-name">BrightSmile</div>
            <div className="brand-sub">DENTAL CLINIC</div>
          </div>
          <button className="icon-button mobile-close" onClick={()=>setOpen(false)}><X size={18}/></button>
        </div>

        <nav className="side-nav">
          <div className="nav-label">WORKSPACE</div>
          {items.map(([id,label,Icon]) => (
            <button key={id} className={cx("side-link", page===id && "active")} onClick={()=>{setPage(id);setOpen(false)}}>
              <Icon size={17}/><span>{label}</span>
              {id==="reschedules" && <span className="nav-badge">3</span>}
            </button>
          ))}
          <div className="nav-label settings-label">SETTINGS</div>
          {settings.map(([id,label,Icon]) => (
            <button key={id} className={cx("side-link", page===id && "active")} onClick={()=>{setPage(id);setOpen(false)}}>
              <Icon size={17}/><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="help-card">
          <div className="help-icon"><MessageCircle size={17}/></div>
          <strong>Need help?</strong>
          <p>Clinic support is available for your team.</p>
          <button>Contact Support</button>
        </div>

        <button className="logout-link" onClick={onSignOut}><LogOut size={16}/> Sign out</button>
      </aside>
    </>
  );
}

function Topbar({ onMenu, onNew }) {
  return (
    <header className="topbar">
      <div className="top-left">
        <button className="icon-button menu-button" onClick={onMenu}><Menu size={19}/></button>
        <div>
          <h1>Welcome back, Admin</h1>
          <p>Here’s what’s happening at your clinic today.</p>
        </div>
      </div>
      <div className="top-actions">
        <button className="primary-button" onClick={onNew}><Plus size={17}/> New Appointment</button>
        <button className="icon-button"><Search size={18}/></button>
        <button className="icon-button notification"><Bell size={18}/><i>3</i></button>
        <button className="whatsapp-button"><MessageCircle size={18}/></button>
        <div className="profile-chip">
          <div className="avatar">RM</div>
          <div className="profile-text"><strong>Dr. Rohan Mehta</strong><span>Super Admin</span></div>
          <ChevronDown size={15}/>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, label, value, note, tone="blue", up=true }) {
  return (
    <div className="stat-card">
      <div className={cx("stat-icon", `tone-${tone}`)}><Icon size={20}/></div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small className={up ? "positive" : "neutral"}>{up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} {note}</small>
      </div>
    </div>
  );
}

function Chart() {
  const points = useMemo(() => {
    const max = Math.max(...chartData);
    const min = 0;
    return chartData.map((v,i) => {
      const x = 4 + (i * 92 / (chartData.length-1));
      const y = 86 - ((v-min)/(max-min))*72;
      return `${x},${y}`;
    }).join(" ");
  }, []);
  return (
    <div className="chart-wrap">
      <div className="chart-grid">
        {[0,10,20,30,40].map(n => <div className="grid-line" key={n}><span>{n}</span></div>)}
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart" aria-label="Appointments trend">
        <polyline points={`4,86 ${points} 96,86`} fill="none" stroke="rgba(20,120,232,.12)" strokeWidth="8" strokeLinejoin="round"/>
        <polyline points={points} fill="none" stroke="#1478e8" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
        {chartData.map((v,i)=>{
          const x = 4 + (i * 92 / (chartData.length-1));
          const y = 86 - (v/40)*72;
          return <circle key={i} cx={x} cy={y} r="1.5" fill="#fff" stroke="#1478e8" strokeWidth=".8"/>;
        })}
      </svg>
      <div className="chart-labels">
        {["1 Aug","4 Aug","7 Aug","10 Aug","13 Aug","16 Aug","19 Aug","22 Aug","25 Aug","28 Aug","30 Aug","31 Aug"].map(x=><span key={x}>{x}</span>)}
      </div>
    </div>
  );
}

function TodayAppointments({ appointments }) {
  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Today’s Appointments</h2><p>Upcoming patient schedule</p></div><button className="text-button">View All</button></div>
      <div className="today-list">
        {appointments.slice(0,5).map(a => (
          <div className="today-item" key={a.id}>
            <time>{formatTime(a.time)}</time>
            <div className="today-person"><strong>{a.patient}</strong><span>{a.service}</span></div>
            <Status value={a.status}/>
          </div>
        ))}
      </div>
      <button className="outline-wide">View Full Schedule</button>
    </section>
  );
}

function RecentAppointments({ appointments, onReschedule }) {
  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Recent Appointments</h2><p>Latest activity from the booking system</p></div><button className="text-button">View All</button></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Patient</th><th>Date & Time</th><th>Service</th><th>Doctor</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {appointments.map(a => (
              <tr key={a.id}>
                <td><div className="patient-cell"><div className="small-avatar">{a.patient.split(" ").map(x=>x[0]).join("")}</div><div><strong>{a.patient}</strong><span>{a.phone}</span></div></div></td>
                <td><strong>{new Date(a.date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</strong><span className="subline">{formatTime(a.time)}</span></td>
                <td>{a.service}</td>
                <td>{a.doctor}</td>
                <td><Status value={a.status}/></td>
                <td><div className="row-actions"><button className="mini-wa" title="WhatsApp"><MessageCircle size={15}/></button><button className="mini-menu" onClick={()=>onReschedule(a)}><MoreVertical size={15}/></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="outline-wide">View All Appointments</button>
    </section>
  );
}

function ReschedulePanel({ requests, onApprove }) {
  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Reschedule Requests</h2><p>Patient changes awaiting review</p></div><button className="text-button">View All</button></div>
      <div className="request-list">
        {requests.map(r => (
          <div className="request-item" key={r.id}>
            <div className="request-icon"><RefreshCw size={16}/></div>
            <div className="request-copy"><strong>{r.patient}</strong><span>Requested {r.requested}</span><small>Current {r.current}</small></div>
            <Status value={r.status==="new" ? "pending" : "review"}/>
            <button className="approve-button" title="Approve" onClick={()=>onApprove(r)}><Check size={15}/></button>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhatsAppPanel() {
  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>WhatsApp Notifications</h2><p>Messaging health for this month</p></div><button className="text-button">View All</button></div>
      <div className="message-stats">
        <div><span>Messages Sent</span><strong>245</strong><small>This Month</small></div>
        <div><span>Delivered</span><strong>240</strong><small>97.96% Delivered</small></div>
        <div><span>Pending</span><strong>5</strong><small>2.04% Pending</small></div>
        <div><span>Failed</span><strong>0</strong><small>0% Failed</small></div>
      </div>
    </section>
  );
}

function QuickActions({ onNew }) {
  return (
    <section className="panel">
      <div className="panel-heading"><div><h2>Quick Actions</h2><p>Common clinic operations</p></div></div>
      <div className="quick-grid">
        <button onClick={onNew}><CalendarDays size={20}/><span>Add New Appointment</span></button>
        <button><UserRound size={20}/><span>Add New Patient</span></button>
        <button><MessageCircle size={20}/><span>Send WhatsApp</span></button>
        <button><CalendarDays size={20}/><span>Appointment Calendar</span></button>
      </div>
    </section>
  );
}

function Login({ onLogin }) {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    setLoading(true); setError("");
    if(!supabaseConfigured){
      onLogin({ email:"demo@brightsmile.local", role:"super_admin", demo:true });
      setLoading(false); return;
    }
    const {data,error} = await supabase.auth.signInWithPassword({email,password});
    if(error) setError(error.message);
    else onLogin(data.user);
    setLoading(false);
  }

  return <div className="login-page">
    <div className="login-card">
      <div className="login-brand"><div className="brand-mark">✦</div><div><strong>BrightSmile</strong><span>Dental Clinic</span></div></div>
      <div className="login-heading"><span>CLINIC OPERATIONS</span><h1>Sign in to your dashboard</h1><p>Manage appointments, patients, doctors and communications securely.</p></div>
      <form onSubmit={submit} className="login-form">
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@clinic.com" required /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required /></label>
        {error && <div className="login-error">{error}</div>}
        <button className="primary-button full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
      {!supabaseConfigured && <div className="demo-note">Demo mode is active. Add your Supabase environment variables to enable real authentication and database access.</div>}
    </div>
  </div>;
}

function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="modal">
      <div className="modal-header"><div><h2>{title}</h2><p>Clinic workflow action</p></div><button className="icon-button" onClick={onClose}><X size={18}/></button></div>
      {children}
    </div>
  </div>;
}

function AppointmentModal({ onClose, onSave }) {
  const [form,setForm]=useState({patient:"",phone:"",date:"",time:"",service:"General Check-up",doctor:"Dr. Rohan Mehta"});
  const set=(k,v)=>setForm(x=>({...x,[k]:v}));
  return <Modal title="Create Appointment" onClose={onClose}>
    <form className="modal-form" onSubmit={e=>{e.preventDefault();onSave({...form,id:`APT-${Date.now()}`,status:"confirmed"})}}>
      <div className="form-two"><label>Patient name<input value={form.patient} onChange={e=>set("patient",e.target.value)} required/></label><label>Phone<input value={form.phone} onChange={e=>set("phone",e.target.value)} required/></label></div>
      <div className="form-two"><label>Date<input type="date" value={form.date} onChange={e=>set("date",e.target.value)} required/></label><label>Time<input type="time" value={form.time} onChange={e=>set("time",e.target.value)} required/></label></div>
      <div className="form-two"><label>Service<select value={form.service} onChange={e=>set("service",e.target.value)}><option>General Check-up</option><option>Teeth Cleaning</option><option>Root Canal</option><option>Orthodontic Consultation</option><option>Dental Implant Consultation</option></select></label><label>Doctor<select value={form.doctor} onChange={e=>set("doctor",e.target.value)}><option>Dr. Rohan Mehta</option><option>Dr. Ananya Sharma</option><option>Dr. Vivek Patel</option><option>Dr. Pooja Iyer</option></select></label></div>
      <div className="modal-footer"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button className="primary-button"><Plus size={16}/> Create Appointment</button></div>
    </form>
  </Modal>;
}

function RescheduleModal({ appointment, onClose, onSave }) {
  const [date,setDate]=useState(appointment?.date||"");
  const [time,setTime]=useState(appointment?.time||"");
  const [reason,setReason]=useState("");
  return <Modal title="Request Reschedule" onClose={onClose}>
    <div className="current-appointment"><span>Current appointment</span><strong>{appointment?.patient}</strong><p>{appointment?.date} • {formatTime(appointment?.time)} • {appointment?.service}</p></div>
    <form className="modal-form" onSubmit={e=>{e.preventDefault();onSave({date,time,reason})}}>
      <div className="form-two"><label>New date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label>New time<input type="time" value={time} onChange={e=>setTime(e.target.value)} required/></label></div>
      <label>Reason<textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why is the appointment being moved?" required/></label>
      <div className="modal-footer"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button className="primary-button"><RefreshCw size={16}/> Submit Request</button></div>
    </form>
  </Modal>;
}

function PlaceholderPage({ title, icon: Icon }) {
  return <div className="placeholder-page"><div className="placeholder-icon"><Icon size={28}/></div><h2>{title}</h2><p>This workspace is connected to the same Supabase/RLS foundation. The dashboard shell is ready for this module.</p><button className="primary-button"><Plus size={16}/> Add {title}</button></div>;
}

function Dashboard({ user, onSignOut }) {
  const [page,setPage]=useState("dashboard");
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [appointments,setAppointments]=useState(demoAppointments);
  const [requests,setRequests]=useState(demoRequests);
  const [modal,setModal]=useState(null);
  const [toast,setToast]=useState("");

  useEffect(()=>{
    if(!supabaseConfigured || user?.demo) return;
    let active=true;
    (async()=>{
      const {data,error}=await supabase.from("appointments").select("id,patient_id,doctor_id,service_id,appointment_date,appointment_time,status").order("appointment_date",{ascending:false}).limit(20);
      if(!error && active && data?.length) {
        setAppointments(data.map(x=>({...x,id:x.id,patient:x.patient_id,phone:"",date:x.appointment_date,time:x.appointment_time,service:"Dental Service",doctor:"Assigned Doctor",status:x.status})));
      }
    })();
    return ()=>{active=false};
  },[user]);

  function notify(msg){setToast(msg);setTimeout(()=>setToast(""),2800)}
  function addAppointment(a){setAppointments(x=>[a,...x]);setModal(null);notify("Appointment created. Connect the Edge Function to send WhatsApp confirmation.")}
  function saveReschedule(change){
    setModal(null);
    notify(`Reschedule request submitted for ${change.date} at ${formatTime(change.time)}.`);
  }
  function approveRequest(r){setRequests(x=>x.filter(y=>y.id!==r.id));notify(`${r.patient}'s reschedule request was approved.`)}

  if(page!=="dashboard"){
    const map={appointments:[CalendarDays,"Appointments"],patients:[Users,"Patients"],doctors:[Stethoscope,"Doctors"],services:[Activity,"Services"],reschedules:[RefreshCw,"Reschedule Requests"],whatsapp:[MessageCircle,"WhatsApp"],clinic:[ShieldCheck,"Clinic Profile"],users:[UserRound,"User Management"],settings:[Settings,"Settings"],audit:[FileText,"Audit Logs"]};
    const [Icon,title]=map[page]||map.appointments;
    return <div className="app-shell"><Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} onSignOut={onSignOut}/><div className="main-area"><Topbar onMenu={()=>setSidebarOpen(true)} onNew={()=>setModal("appointment")}/><main className="content"><PlaceholderPage title={title} icon={Icon}/></main></div>{modal==="appointment"&&<AppointmentModal onClose={()=>setModal(null)} onSave={addAppointment}/>}</div>
  }

  return <div className="app-shell">
    <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} onSignOut={onSignOut}/>
    <div className="main-area">
      <Topbar onMenu={()=>setSidebarOpen(true)} onNew={()=>setModal("appointment")}/>
      <main className="content">
        <div className="demo-banner">{supabaseConfigured ? "Live Supabase connection configured." : "Demo data mode — configure Supabase to load live clinic data."}</div>
        <section className="stats-grid">
          <StatCard icon={CalendarDays} label="Total Appointments" value="156" note="12% from last month" />
          <StatCard icon={ShieldCheck} label="Confirmed" value="98" note="62.8% of total" tone="green" />
          <StatCard icon={Clock3} label="Pending" value="32" note="20.5% of total" tone="orange" up={false} />
          <StatCard icon={RefreshCw} label="Reschedule Requests" value="14" note="8% from last month" tone="purple" />
          <StatCard icon={Users} label="Total Patients" value="1,248" note="18% from last month" tone="blue" />
        </section>

        <section className="dashboard-grid top-grid">
          <div className="panel chart-panel">
            <div className="panel-heading">
              <div><h2>Appointments Overview</h2><p>Booking volume across the clinic</p></div>
              <div className="segmented"><button>This Week</button><button className="selected">This Month</button><button>This Year</button></div>
            </div>
            <Chart/>
          </div>
          <TodayAppointments appointments={appointments}/>
        </section>

        <section className="dashboard-grid lower-grid">
          <div className="stack">
            <RecentAppointments appointments={appointments} onReschedule={(a)=>setModal({type:"reschedule",appointment:a})}/>
            <WhatsAppPanel/>
          </div>
          <div className="stack">
            <ReschedulePanel requests={requests} onApprove={approveRequest}/>
            <QuickActions onNew={()=>setModal("appointment")}/>
          </div>
        </section>
      </main>
    </div>

    {modal==="appointment" && <AppointmentModal onClose={()=>setModal(null)} onSave={addAppointment}/>}
    {modal?.type==="reschedule" && <RescheduleModal appointment={modal.appointment} onClose={()=>setModal(null)} onSave={saveReschedule}/>}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </div>
}


function PatientPortal({ user, onSignOut }) {
  const [appointments,setAppointments]=useState([]);
  const [services,setServices]=useState([]);
  const [doctors,setDoctors]=useState([]);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [form,setForm]=useState({service_id:"",doctor_id:"",date:"",time:"",notes:""});
  const [reschedule,setReschedule]=useState(null);
  const [resForm,setResForm]=useState({date:"",time:"",reason:""});

  useEffect(()=>{
    if(!supabaseConfigured || user?.demo) return;
    let active=true;
    (async()=>{
      const [a,s,d]=await Promise.all([
        supabase.from("appointments").select("id,appointment_date,appointment_time,status,notes,services(name),doctors(full_name)").eq("patient_id",user.id).order("appointment_date",{ascending:true}),
        supabase.from("services").select("id,name,duration_minutes").eq("is_active",true).order("name"),
        supabase.from("doctors").select("id,full_name,specialty").eq("is_active",true).order("full_name")
      ]);
      if(!active) return;
      if(a.data) setAppointments(a.data);
      if(s.data) setServices(s.data);
      if(d.data) setDoctors(d.data);
    })();
    return ()=>{active=false};
  },[user]);

  async function book(e){
    e.preventDefault(); setLoading(true); setMessage("");
    if(!supabaseConfigured || user?.demo){
      setMessage("Demo booking created locally. Connect Supabase to persist this appointment.");
      setLoading(false); return;
    }
    const {data,error}=await supabase.from("appointments").insert({
      patient_id:user.id,
      service_id:form.service_id,
      doctor_id:form.doctor_id || null,
      appointment_date:form.date,
      appointment_time:form.time,
      notes:form.notes || null,
      status:"pending",
      source:"website"
    }).select("id,appointment_date,appointment_time,status,notes,services(name),doctors(full_name)").single();
    if(error) setMessage(error.message);
    else {
      setAppointments(x=>[...x,data].sort((a,b)=>`${a.appointment_date}${a.appointment_time}`.localeCompare(`${b.appointment_date}${b.appointment_time}`)));
      setForm({service_id:"",doctor_id:"",date:"",time:"",notes:""});
      setMessage("Appointment request created. The clinic will confirm it and send WhatsApp confirmation.");
      try { await supabase.functions.invoke("appointment-notify",{body:{appointment_id:data.id,template_name:"appointment_request_received"}}); } catch {}
    }
    setLoading(false);
  }

  async function submitReschedule(e){
    e.preventDefault(); setLoading(true); setMessage("");
    if(!supabaseConfigured || user?.demo){
      setMessage("Demo reschedule request submitted.");
      setReschedule(null); setLoading(false); return;
    }
    const {error}=await supabase.functions.invoke("reschedule-appointment",{
      body:{appointment_id:reschedule.id,requested_date:resForm.date,requested_time:resForm.time,reason:resForm.reason}
    });
    if(error) setMessage(error.message);
    else {
      setMessage("Reschedule request submitted. The clinic will review the new slot.");
      setReschedule(null);
    }
    setLoading(false);
  }

  return <div className="patient-page">
    <header className="patient-header">
      <div className="brand-row">
        <div className="brand-mark">✦</div>
        <div><div className="brand-name">BrightSmile</div><div className="brand-sub">DENTAL CLINIC</div></div>
      </div>
      <div className="patient-actions"><span>{user.email}</span><button className="outline-button" onClick={onSignOut}><LogOut size={15}/> Sign out</button></div>
    </header>

    <main className="patient-content">
      <div className="patient-welcome"><div><span className="eyebrow-small">PATIENT PORTAL</span><h1>Your dental care, in one place.</h1><p>Book appointments, view confirmations and request a new time without calling the clinic.</p></div><div className="patient-shield"><ShieldCheck size={26}/><span>Securely connected</span></div></div>

      {message && <div className="patient-message">{message}</div>}

      <div className="patient-grid">
        <section className="patient-card">
          <div className="patient-card-heading"><div><h2>Book an Appointment</h2><p>Choose your preferred treatment and time.</p></div><CalendarDays size={20}/></div>
          <form className="patient-form" onSubmit={book}>
            <label>Service<select value={form.service_id} onChange={e=>setForm({...form,service_id:e.target.value})} required><option value="">Select treatment</option>{services.map(x=><option key={x.id} value={x.id}>{x.name} · {x.duration_minutes} min</option>)}</select></label>
            <label>Preferred doctor<select value={form.doctor_id} onChange={e=>setForm({...form,doctor_id:e.target.value})}><option value="">Any available doctor</option>{doctors.map(x=><option key={x.id} value={x.id}>{x.full_name} · {x.specialty}</option>)}</select></label>
            <div className="form-two"><label>Date<input type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></label><label>Time<input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} required/></label></div>
            <label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Tell us about your dental concern"/></label>
            <button className="primary-button full" disabled={loading}>{loading?"Submitting…":"Request Appointment"}</button>
          </form>
        </section>

        <section className="patient-card">
          <div className="patient-card-heading"><div><h2>My Appointments</h2><p>Your upcoming and previous clinic visits.</p></div><CalendarDays size={20}/></div>
          <div className="patient-appointments">
            {appointments.length===0 && <div className="empty-state">No appointments yet.</div>}
            {appointments.map(a=><article className="patient-appointment" key={a.id}>
              <div className="patient-date"><strong>{new Date(`${a.appointment_date}T00:00:00`).toLocaleDateString("en-IN",{day:"2-digit"})}</strong><span>{new Date(`${a.appointment_date}T00:00:00`).toLocaleDateString("en-IN",{month:"short"})}</span></div>
              <div className="patient-appt-copy"><strong>{a.services?.name||"Dental Appointment"}</strong><span>{formatTime(a.appointment_time)} · {a.doctors?.full_name||"Clinic team"}</span><small>{a.id}</small></div>
              <div className="patient-appt-actions"><Status value={a.status}/>{!["completed","cancelled"].includes(a.status)&&<button className="mini-menu" onClick={()=>{setReschedule(a);setResForm({date:a.appointment_date,time:a.appointment_time,reason:""})}} title="Reschedule"><RefreshCw size={15}/></button>}</div>
            </article>)}
          </div>
        </section>
      </div>
    </main>

    {reschedule && <Modal title="Request a New Appointment Time" onClose={()=>setReschedule(null)}>
      <div className="current-appointment"><span>Current booking</span><strong>{reschedule.services?.name||"Dental Appointment"}</strong><p>{reschedule.appointment_date} · {formatTime(reschedule.appointment_time)}</p></div>
      <form className="modal-form" onSubmit={submitReschedule}>
        <div className="form-two"><label>New date<input type="date" min={new Date().toISOString().slice(0,10)} value={resForm.date} onChange={e=>setResForm({...resForm,date:e.target.value})} required/></label><label>New time<input type="time" value={resForm.time} onChange={e=>setResForm({...resForm,time:e.target.value})} required/></label></div>
        <label>Reason<textarea value={resForm.reason} onChange={e=>setResForm({...resForm,reason:e.target.value})} required placeholder="Why do you need to reschedule?"/></label>
        <div className="modal-footer"><button type="button" className="outline-button" onClick={()=>setReschedule(null)}>Cancel</button><button className="primary-button"><RefreshCw size={16}/> Submit Request</button></div>
      </form>
    </Modal>}
  </div>
}

export default function App(){
  const [user,setUser]=useState(null);
  const [role,setRole]=useState(null);
  useEffect(()=>{
    if(!supabaseConfigured) return;
    supabase.auth.getUser().then(async({data})=>{
      setUser(data.user||null);
      if(data.user){
        const {data:profile}=await supabase.from("profiles").select("role").eq("id",data.user.id).single();
        setRole(profile?.role||"patient");
      }
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange(async(_event,session)=>{
      setUser(session?.user||null);
      if(session?.user){
        const {data:profile}=await supabase.from("profiles").select("role").eq("id",session.user.id).single();
        setRole(profile?.role||"patient");
      } else setRole(null);
    });
    return ()=>subscription.unsubscribe();
  },[]);
  async function handleLogin(nextUser){
    setUser(nextUser);
    if(nextUser?.demo) { setRole("super_admin"); return; }
    const {data:profile}=await supabase.from("profiles").select("role").eq("id",nextUser.id).single();
    setRole(profile?.role||"patient");
  }
  async function signOut(){ if(supabaseConfigured) await supabase.auth.signOut(); setUser(null); setRole(null); }
  if(!user) return <Login onLogin={handleLogin}/>;
  if(role==="patient") return <PatientPortal user={user} onSignOut={signOut}/>;
  return <Dashboard user={user} onSignOut={signOut}/>;
}
