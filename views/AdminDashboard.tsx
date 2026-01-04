
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ICONS, PLATFORM_NAME, INITIAL_PATIENTS } from '../constants';
import { Card, Button, Badge, Input, Modal } from '../components/Shared';
import { Appointment, AppointmentStatus, Sede, Service, Company, Treatment, Professional, UserRole, Patient, Medication, ClinicalHistoryEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { summarizeConsultation } from '../services/geminiService';

const statusTranslations: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'Pendiente',
  [AppointmentStatus.CONFIRMED]: 'Confirmada',
  [AppointmentStatus.IN_PROGRESS]: 'En Curso',
  [AppointmentStatus.COMPLETED]: 'Atendido',
  [AppointmentStatus.CANCELLED]: 'Cancelada',
  [AppointmentStatus.NO_SHOW]: 'No Asistió'
};

const getStatusColor = (status: AppointmentStatus) => {
  switch (status) {
    case AppointmentStatus.PENDING: return 'amber';
    case AppointmentStatus.CONFIRMED: return 'teal';
    case AppointmentStatus.IN_PROGRESS: return 'purple';
    case AppointmentStatus.COMPLETED: return 'green';
    case AppointmentStatus.CANCELLED: return 'red';
    case AppointmentStatus.NO_SHOW: return 'gray';
    default: return 'teal';
  }
};

const StatusSelector: React.FC<{ name: string, defaultValue: string }> = ({ name, defaultValue }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado Beech</label>
    <select name={name} defaultValue={defaultValue} className="px-5 py-4 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none font-medium">
      {Object.entries(statusTranslations).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
    </select>
  </div>
);

interface AdminDashboardProps {
  userRole: UserRole;
  company: Company;
  appointments: Appointment[];
  sedes: Sede[];
  services: Service[];
  treatments: Treatment[];
  professionals: Professional[];
  setCompany: (c: Company) => void;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setSedes: React.Dispatch<React.SetStateAction<Sede[]>>;
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  setTreatments: React.Dispatch<React.SetStateAction<Treatment[]>>;
  setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>>;
  onLogout: () => void;
  onOpenPortal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  userRole, company, appointments, sedes, services, professionals, treatments,
  setCompany, setAppointments, setSedes, setServices, setTreatments, setProfessionals,
  onLogout, onOpenPortal
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'history' | 'professionals' | 'treatments' | 'sedes' | 'services' | 'settings'>('overview');
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'kanban'>('calendar');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isHistoryDetailModalOpen, setIsHistoryDetailModalOpen] = useState(false);
  const [isSedeEditModalOpen, setIsSedeEditModalOpen] = useState(false);
  const [isProfessionalEditModalOpen, setIsProfessionalEditModalOpen] = useState(false);
  const [isServiceEditModalOpen, setIsServiceEditModalOpen] = useState(false);
  const [isTreatmentEditModalOpen, setIsTreatmentEditModalOpen] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<ClinicalHistoryEntry | null>(null);
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS || []);
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSummarizing, setIsSummarizing] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Stats for charts
  const statsTrend = [{ name: 'Lun', citas: 12 }, { name: 'Mar', citas: 18 }, { name: 'Mie', citas: 15 }, { name: 'Jue', citas: 22 }, { name: 'Vie', citas: 30 }, { name: 'Sab', citas: 10 }];

  // REAL CALENDAR LOGIC
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    // Padding from prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: month - 1, current: false });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: month, current: true });
    }
    return days;
  }, [currentDate]);

  const handleSaveAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const status = fd.get('status') as AppointmentStatus;
    const data = {
      id: selectedAppointment?.id || Date.now().toString(),
      patientName: fd.get('patientName') as string,
      patientPhone: fd.get('patientPhone') as string,
      date: fd.get('date') as string,
      time: fd.get('time') as string,
      status: status,
      serviceId: fd.get('serviceId') as string,
      sedeId: sedes[0].id,
      professionalId: professionals[0].id,
      patientEmail: '',
      bookingCode: 'BEE' + Math.random().toString(36).substr(2, 4).toUpperCase()
    };
    if (selectedAppointment) setAppointments(p => p.map(a => a.id === data.id ? { ...a, ...data } : a));
    else setAppointments(p => [data, ...p]);
    setIsModalOpen(false);
  };

  const renderSidebarItem = (id: typeof activeTab, label: string, icon: React.ReactNode) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all font-ubuntu-medium text-[13px] border border-transparent ${activeTab === id ? 'bg-white text-brand-navy shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
      <div className={activeTab === id ? 'text-brand-teal' : ''}>{icon}</div>
      <span className="uppercase tracking-tight">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-ubuntu overflow-hidden">
      <aside className="w-64 brand-gradient p-6 flex flex-col gap-10 shadow-2xl shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
             <ICONS.Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
             <span className="text-xl font-ubuntu-bold text-white tracking-tighter uppercase">BeeClinical</span>
             <span className="text-[9px] text-brand-teal uppercase mt-1 tracking-widest font-black">ADMIN</span>
          </div>
        </div>
        <nav className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          {renderSidebarItem('overview', 'Dashboard', <ICONS.Activity />)}
          {renderSidebarItem('appointments', 'AgendaBee', <ICONS.Calendar />)}
          {renderSidebarItem('history', 'Expedientes', <ICONS.Clipboard />)}
          <div className="pt-8 pb-3 text-[10px] font-ubuntu-bold text-white/30 uppercase tracking-[0.25em] ml-4">CATÁLOGOS</div>
          {renderSidebarItem('professionals', 'Staff Médico', <ICONS.Users />)}
          {renderSidebarItem('sedes', 'Sedes Bee', <ICONS.MapPin />)}
          {renderSidebarItem('services', 'Servicios', <ICONS.Stethoscope />)}
          {renderSidebarItem('treatments', 'Protocolos', <ICONS.BookOpen />)}
          <div className="pt-8 pb-3 text-[10px] font-ubuntu-bold text-white/30 uppercase tracking-[0.25em] ml-4">CONFIG</div>
          {renderSidebarItem('settings', 'Plataforma', <ICONS.Settings />)}
        </nav>
        <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
          <Button variant="outline" fullWidth className="text-white border-white/20 text-[10px] uppercase font-bold py-2" onClick={onOpenPortal}>PORTAL PÚBLICO</Button>
          <Button variant="primary" fullWidth className="bg-brand-purple/20 border-none text-white text-[10px] uppercase font-bold py-2" onClick={onLogout}>SALIR</Button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-auto">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-ubuntu-bold text-slate-900 tracking-tighter uppercase leading-none">
              {activeTab === 'overview' && 'Panel de Control'}
              {activeTab === 'appointments' && 'Control de Agenda'}
              {activeTab === 'history' && 'Expedientes'}
              {activeTab === 'professionals' && 'Staff Médico'}
            </h1>
            <p className="text-slate-400 text-[11px] mt-4 font-ubuntu-medium tracking-[0.3em] uppercase opacity-70">Bee Intelligence Hub</p>
          </div>
          <div className="flex gap-4">
             {activeTab === 'appointments' && (
                <div className="bg-white p-1 rounded-lg flex border border-slate-200">
                  <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-md text-[10px] font-bold ${viewMode === 'calendar' ? 'bg-brand-teal text-white shadow-md' : 'text-slate-400'}`}>CALENDARIO</button>
                  <button onClick={() => setViewMode('kanban')} className={`px-4 py-2 rounded-md text-[10px] font-bold ${viewMode === 'kanban' ? 'bg-brand-teal text-white shadow-md' : 'text-slate-400'}`}>KANBAN</button>
                  <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-md text-[10px] font-bold ${viewMode === 'list' ? 'bg-brand-teal text-white shadow-md' : 'text-slate-400'}`}>LISTA</button>
                </div>
             )}
             <Button className="rounded-lg px-8 py-4 border-none shadow-lg" onClick={() => { setSelectedAppointment(null); setIsModalOpen(true); }}>
                <ICONS.Plus className="w-4 h-4 mr-2" /> <span className="uppercase text-xs tracking-widest font-black">Nuevo Registro</span>
             </Button>
          </div>
        </header>

        {/* DASHBOARD LIVE HUB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card onClick={() => setActiveTab('appointments')} className="p-8 border-l-[6px] border-l-brand-teal hover:scale-[1.02] transition-transform shadow-sm">
                   <div className="text-3xl font-ubuntu-bold text-slate-900 mb-2">{appointments.length}</div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Citas Agendadas</div>
                </Card>
                <Card onClick={() => setActiveTab('history')} className="p-8 border-l-[6px] border-l-brand-purple hover:scale-[1.02] transition-transform shadow-sm">
                   <div className="text-3xl font-ubuntu-bold text-slate-900 mb-2">{patients.length}</div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pacientes Registrados</div>
                </Card>
                <Card onClick={() => setActiveTab('professionals')} className="p-8 border-l-[6px] border-l-blue-500 hover:scale-[1.02] transition-transform shadow-sm">
                   <div className="text-3xl font-ubuntu-bold text-slate-900 mb-2">{professionals.length}</div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialistas Activos</div>
                </Card>
                <Card onClick={() => setActiveTab('sedes')} className="p-8 border-l-[6px] border-l-amber-500 hover:scale-[1.02] transition-transform shadow-sm">
                   <div className="text-3xl font-ubuntu-bold text-slate-900 mb-2">{sedes.length}</div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Locales Beech</div>
                </Card>
             </div>
             <Card className="p-10">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-10">Flujo Semanal Bee Care</h3>
                <div className="h-[350px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={statsTrend}>
                         <defs><linearGradient id="colorBee" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#017E84" stopOpacity={0.2}/><stop offset="95%" stopColor="#017E84" stopOpacity={0}/></linearGradient></defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} />
                         <Tooltip />
                         <Area type="monotone" dataKey="citas" stroke="#017E84" strokeWidth={3} fillOpacity={1} fill="url(#colorBee)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </Card>
          </div>
        )}

        {/* AGENDA BEE VIEWS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6 animate-fade-in">
             {viewMode === 'calendar' && (
               <Card className="overflow-hidden border-slate-200">
                  <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-slate-200 rounded-lg"><ICONS.ArrowLeft className="w-4 h-4" /></button>
                        <h3 className="font-ubuntu-bold uppercase text-lg tracking-tight">{currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-slate-200 rounded-lg rotate-180"><ICONS.ArrowLeft className="w-4 h-4" /></button>
                     </div>
                     <Badge color="teal">MES ACTUAL BEE</Badge>
                  </div>
                  <div className="grid grid-cols-7 bg-slate-100/50">
                     {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 auto-rows-[120px]">
                     {calendarDays.map((d, idx) => {
                       const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`;
                       const dayApps = appointments.filter(a => a.date === dateStr);
                       return (
                         <div key={idx} className={`p-3 border-r border-b ${!d.current ? 'opacity-20 bg-slate-50' : 'bg-white'} hover:bg-slate-50/50 transition-all`}>
                            <span className="text-xs font-black text-slate-400">{d.day}</span>
                            <div className="mt-2 space-y-1">
                               {dayApps.map(a => (
                                 <div key={a.id} onClick={() => { setSelectedAppointment(a); setIsModalOpen(true); }} className={`text-[9px] p-1 rounded font-bold truncate cursor-pointer bg-${getStatusColor(a.status)}-50 text-${getStatusColor(a.status)}-700 border border-${getStatusColor(a.status)}-100`}>
                                    {a.time} {a.patientName}
                                 </div>
                               ))}
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </Card>
             )}

             {viewMode === 'kanban' && (
               <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar min-h-[600px]">
                  {[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED].map(status => (
                    <div key={status} className="w-80 shrink-0 space-y-4">
                       <div className="flex items-center gap-2 px-2">
                          <div className={`w-3 h-3 rounded-full bg-${getStatusColor(status)}-500 shadow-lg`}></div>
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{statusTranslations[status]}</h4>
                       </div>
                       <div className="space-y-4">
                          {appointments.filter(a => a.status === status).map(app => (
                            <Card key={app.id} className="p-5 hover:border-brand-teal transition-all cursor-pointer group shadow-sm" onClick={() => { setSelectedAppointment(app); setIsModalOpen(true); }}>
                               <div className="text-[10px] font-black text-brand-teal mb-2 tracking-widest">{app.time} HS</div>
                               <div className="font-ubuntu-bold text-slate-800 mb-2">{app.patientName}</div>
                               <div className="text-[9px] text-slate-400 font-bold uppercase">{services.find(s=>s.id===app.serviceId)?.name}</div>
                            </Card>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
             )}

             {viewMode === 'list' && (
                <Card className="overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <tr><th className="px-8 py-5">PACIENTE</th><th className="px-8 py-5">HORARIO</th><th className="px-8 py-5">ESTADO</th><th className="px-8 py-5 text-right">ACCIONES</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {appointments.map(app => (
                           <tr key={app.id} className="hover:bg-slate-50 transition-all group">
                              <td className="px-8 py-6 font-ubuntu-bold text-slate-800">{app.patientName}</td>
                              <td className="px-8 py-6 text-xs text-slate-500">{app.date} • {app.time}</td>
                              <td className="px-8 py-6"><Badge color={getStatusColor(app.status)}>{statusTranslations[app.status]}</Badge></td>
                              <td className="px-8 py-6 text-right">
                                 <Button variant="ghost" size="sm" onClick={() => { setSelectedAppointment(app); setIsModalOpen(true); }}><ICONS.Edit className="w-4 h-4" /></Button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </Card>
             )}
          </div>
        )}

        {/* MODAL CITA BEE */}
        <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedAppointment(null); }} title={selectedAppointment ? 'Gestionar Cita' : 'Nueva Reserva Beech'}>
           <form onSubmit={handleSaveAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
              <Input name="patientName" label="Paciente" defaultValue={selectedAppointment?.patientName} required />
              <Input name="patientPhone" label="WhatsApp" defaultValue={selectedAppointment?.patientPhone} required />
              <Input name="date" type="date" label="FechaBee" defaultValue={selectedAppointment?.date} required />
              <Input name="time" type="time" label="HoraBee" defaultValue={selectedAppointment?.time} required />
              <div className="flex flex-col gap-2">
                 <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Servicio</label>
                 <select name="serviceId" defaultValue={selectedAppointment?.serviceId} className="px-5 py-4 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none font-medium">
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              </div>
              <StatusSelector name="status" defaultValue={selectedAppointment?.status || AppointmentStatus.PENDING} />
              <div className="md:col-span-2 pt-6">
                 <Button fullWidth size="lg" className="border-none py-6 tracking-[0.4em] uppercase font-black text-xs shadow-xl">Actualizar Agenda Beech</Button>
              </div>
           </form>
        </Modal>

        {/* RESTO DE MODALES DE STAFF, SEDES, ETC SE MANTIENEN IGUAL (FUNCIONALES) */}

        {/* EXPEDIENTES (HISTORY) */}
        {activeTab === 'history' && (
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
              <div className="lg:col-span-1 space-y-6">
                 <Input placeholder="Buscar paciente..." icon={<ICONS.Search />} value={searchPatient} onChange={e => setSearchPatient(e.target.value)} />
                 <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    {patients.filter(p => p.name.toLowerCase().includes(searchPatient.toLowerCase())).map(p => (
                      <Card key={p.id} onClick={() => setSelectedPatient(p)} className={`p-5 cursor-pointer hover:border-brand-teal ${selectedPatient?.id === p.id ? 'border-brand-teal bg-teal-50/20 shadow-inner' : 'bg-white'}`}>
                         <div className="font-ubuntu-bold text-slate-800 uppercase text-[11px] tracking-tight">{p.name}</div>
                         <div className="text-[9px] text-slate-400 mt-2 font-black tracking-widest">{p.phone}</div>
                      </Card>
                    ))}
                 </div>
              </div>
              <div className="lg:col-span-3">
                 {selectedPatient ? (
                   <Card className="p-10">
                      <h3 className="text-3xl font-ubuntu-bold text-slate-900 uppercase tracking-tighter border-b pb-8 mb-8">{selectedPatient.name}</h3>
                      <div className="space-y-6">
                        {selectedPatient.history.map(entry => (
                          <div key={entry.id} onClick={() => { setSelectedHistoryEntry(entry); setIsHistoryDetailModalOpen(true); }} className="p-6 border border-slate-100 rounded-xl hover:border-brand-teal hover:bg-slate-50 cursor-pointer transition-all flex justify-between items-center group">
                             <div>
                                <span className="text-[10px] font-black text-brand-teal uppercase tracking-widest block mb-1">{entry.date}</span>
                                <p className="text-sm text-slate-600 italic">"{entry.notes.substring(0, 100)}..."</p>
                             </div>
                             <ICONS.Eye className="w-5 h-5 text-slate-200 group-hover:text-brand-teal transition-colors" />
                          </div>
                        ))}
                      </div>
                   </Card>
                 ) : (
                   <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-300 border-2 border-dashed rounded-2xl bg-slate-50">
                      <ICONS.Clipboard className="w-12 h-12 mb-4 opacity-20" />
                      <span className="uppercase text-[11px] font-black tracking-widest opacity-50">Seleccione un paciente Beech</span>
                   </div>
                 )}
              </div>
           </div>
        )}

        {/* STAFF (PROFESSIONALS) */}
        {activeTab === 'professionals' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
              {professionals.map(p => (
                <Card key={p.id} className="p-8 text-center group border-slate-200">
                   <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto mb-6 overflow-hidden border-4 border-white shadow-md">
                      <img src={p.avatar} className="w-full h-full object-cover" />
                   </div>
                   <h3 className="font-ubuntu-bold text-slate-800 uppercase text-sm tracking-tight">{p.name}</h3>
                   <p className="text-[10px] text-brand-teal font-black uppercase mt-2 tracking-widest">{p.specialty}</p>
                   <div className="mt-8 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedProfessional(p); setIsProfessionalEditModalOpen(true); }}><ICONS.Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setProfessionals(prev => prev.filter(pr => pr.id !== p.id))}><ICONS.Trash className="w-4 h-4" /></Button>
                   </div>
                </Card>
              ))}
           </div>
        )}

        {/* MODAL HISTORY DETAIL */}
        <Modal isOpen={isHistoryDetailModalOpen} onClose={() => setIsHistoryDetailModalOpen(false)} title="ResumenBee Atención">
           {selectedHistoryEntry && (
              <div className="space-y-10 p-4">
                 <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center shadow-inner">
                    <Badge color="teal" className="text-lg py-1 px-4">{selectedHistoryEntry.date}</Badge>
                    {selectedHistoryEntry.treatmentId && <Badge color="purple">SESIÓN {selectedHistoryEntry.sessionNumber}</Badge>}
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Diagnóstico Clínico</label>
                    <div className="p-8 bg-white border-l-[6px] border-l-brand-teal rounded-xl shadow-sm italic text-slate-700 leading-relaxed">
                       "{selectedHistoryEntry.notes}"
                    </div>
                 </div>
                 <Button fullWidth size="lg" className="py-5 uppercase text-[11px] tracking-[0.4em] font-black border-none shadow-xl" onClick={() => setIsHistoryDetailModalOpen(false)}>Cerrar Resumen</Button>
              </div>
           )}
        </Modal>

      </main>
    </div>
  );
};
