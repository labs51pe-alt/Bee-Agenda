
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ICONS, PLATFORM_NAME, INITIAL_PATIENTS } from '../constants';
import { Card, Button, Badge, Input, Modal } from '../components/Shared';
import { Appointment, AppointmentStatus, Sede, Service, Company, Treatment, Professional, UserRole, Patient, Medication, ClinicalHistoryEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { summarizeConsultation } from '../services/geminiService';

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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isEditHistoryModalOpen, setIsEditHistoryModalOpen] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<ClinicalHistoryEntry | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string>('');
  
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS || []);
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Estados para el Plan de Tratamiento
  const [isCreatingNewPlan, setIsCreatingNewPlan] = useState(false);
  const [numSessions, setNumSessions] = useState<number>(1);
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [includeTodayAsFirst, setIncludeTodayAsFirst] = useState(true);

  // Gemini specific states
  const [isSummarizing, setIsSummarizing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Datos para gráficos
  const chartData = useMemo(() => {
    return services.map(s => ({
      name: s.name,
      total: appointments.filter(a => a.serviceId === s.id).length
    }));
  }, [appointments, services]);

  const statsTrend = [
    { name: 'Lun', citas: 12 },
    { name: 'Mar', citas: 18 },
    { name: 'Mie', citas: 15 },
    { name: 'Jue', citas: 22 },
    { name: 'Vie', citas: 30 },
    { name: 'Sab', citas: 10 },
  ];

  useEffect(() => {
    const extraSessions = includeTodayAsFirst ? numSessions - 1 : numSessions;
    setSessionDates(Array(Math.max(0, extraSessions)).fill(''));
  }, [numSessions, includeTodayAsFirst]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'backgroundImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCompany({ ...company, [target]: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleCreateOrEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const status = formData.get('status') as AppointmentStatus;
    
    const appData = {
      patientName: formData.get('patientName') as string,
      patientPhone: formData.get('patientPhone') as string,
      patientEmail: formData.get('patientEmail') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      serviceId: formData.get('serviceId') as string,
      sedeId: formData.get('sedeId') as string,
      status: status,
      notes: formData.get('notes') as string,
    };

    if (selectedAppointment) {
      setAppointments(prev => prev.map(a => a.id === selectedAppointment.id ? { ...a, ...appData } : a));
      if (status === AppointmentStatus.COMPLETED && selectedAppointment.status !== AppointmentStatus.COMPLETED) {
        setIsCompletionModalOpen(true);
      }
    } else {
      const newApp: Appointment = {
        id: Date.now().toString(),
        ...appData,
        professionalId: professionals[0]?.id || 'p1',
        bookingCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      };
      setAppointments(prev => [newApp, ...prev]);
    }
    setIsModalOpen(false);
    if (status !== AppointmentStatus.COMPLETED) setSelectedAppointment(null);
  };

  const handleFinishConsultation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!selectedAppointment) return;

    let patient = patients.find(p => p.phone === selectedAppointment.patientPhone);
    if (!patient) {
      patient = {
        id: Date.now().toString(),
        name: selectedAppointment.patientName,
        email: selectedAppointment.patientEmail,
        phone: selectedAppointment.patientPhone,
        history: []
      };
      setPatients(prev => [...prev, patient!]);
    }

    const rawRecipe = formData.get('recipeItems') as string;
    const medications: Medication[] = rawRecipe.split('\n').filter(line => line.trim()).map(line => ({
      name: line.trim(),
      instructions: 'Indicaciones Bee'
    }));

    let treatmentId = formData.get('treatmentId') as string;
    let sessionsTotal = isCreatingNewPlan ? numSessions : (treatments.find(t => t.id === treatmentId)?.sessions || 1);

    if (isCreatingNewPlan) {
      const newPlanName = formData.get('newPlanName') as string;
      const newPlanId = 'plan-' + Date.now();
      const newTreatment: Treatment = {
        id: newPlanId,
        name: newPlanName,
        sessions: sessionsTotal,
        price: 0,
        description: 'Plan Bee personalizado'
      };
      setTreatments(prev => [...prev, newTreatment]);
      treatmentId = newPlanId;

      const futureAppointments: Appointment[] = [];
      sessionDates.forEach((d, i) => {
        if (d) {
          const sessionNum = includeTodayAsFirst ? i + 2 : i + 1;
          futureAppointments.push({
            id: `session-${treatmentId}-${sessionNum}`,
            patientName: selectedAppointment.patientName,
            patientPhone: selectedAppointment.patientPhone,
            patientEmail: selectedAppointment.patientEmail,
            serviceId: selectedAppointment.serviceId,
            sedeId: selectedAppointment.sedeId,
            professionalId: selectedAppointment.professionalId,
            date: d,
            time: selectedAppointment.time,
            status: AppointmentStatus.PENDING,
            bookingCode: `SESIÓN-${sessionNum}`,
            treatmentId: treatmentId
          });
        }
      });
      setAppointments(prev => [...prev, ...futureAppointments]);
    }

    const newEntry: ClinicalHistoryEntry = {
      id: Date.now().toString(),
      date: selectedAppointment.date,
      professionalId: selectedAppointment.professionalId,
      notes: formData.get('clinicalNotes') as string,
      medications,
      treatmentId: treatmentId || undefined,
      sessionNumber: includeTodayAsFirst ? 1 : (parseInt(formData.get('sessionNumber') as string) || undefined),
      totalSessions: sessionsTotal,
      nextSessionDate: sessionDates[0] || undefined
    };

    setPatients(prev => prev.map(p => p.phone === selectedAppointment.patientPhone ? {
      ...p,
      history: [newEntry, ...p.history]
    } : p));

    setIsCompletionModalOpen(false);
    setIsCreatingNewPlan(false);
    setNumSessions(1);
    setSelectedAppointment(null);
  };

  const handleUpdateHistoryEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatient || !selectedHistoryEntry) return;
    
    const formData = new FormData(e.currentTarget);
    const rawRecipe = formData.get('recipeItems') as string;
    const medications: Medication[] = rawRecipe.split('\n').filter(line => line.trim()).map(line => ({
      name: line.trim(),
      instructions: 'Indicaciones Bee'
    }));

    const updatedEntry: ClinicalHistoryEntry = {
      ...selectedHistoryEntry,
      notes: formData.get('clinicalNotes') as string,
      medications,
      nextSessionDate: formData.get('nextSessionDate') as string || undefined,
      sessionNumber: parseInt(formData.get('sessionNumber') as string) || undefined,
      totalSessions: parseInt(formData.get('totalSessions') as string) || undefined,
    };

    setPatients(prev => prev.map(p => p.id === selectedPatient.id ? {
      ...p,
      history: p.history.map(h => h.id === selectedHistoryEntry.id ? updatedEntry : h)
    } : p));

    setSelectedPatient(prev => prev ? {
      ...prev,
      history: prev.history.map(h => h.id === selectedHistoryEntry.id ? updatedEntry : h)
    } : null);

    setIsEditHistoryModalOpen(false);
    setSelectedHistoryEntry(null);
  };

  const renderSidebarItem = (id: typeof activeTab, label: string, icon: React.ReactNode) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all font-ubuntu-medium text-sm border border-transparent ${activeTab === id ? 'bg-white text-brand-navy shadow-lg border-brand-teal/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
    >
      <div className={`${activeTab === id ? 'text-brand-teal' : ''}`}>{icon}</div>
      <span>{label}</span>
    </button>
  );

  const DashboardOverview = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayApps = appointments.filter(a => a.date === today);

    return (
      <div className="space-y-10 animate-fade-in">
        {/* KPI Cards Interactivas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8">
          <Card 
            onClick={() => { setActiveTab('appointments'); setViewMode('list'); }} 
            className="p-8 border-l-[6px] border-brand-teal bg-gradient-to-br from-white to-brand-teal/[0.02] transform hover:scale-105 transition-all cursor-pointer shadow-md hover:shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-teal/10 text-brand-teal rounded-2xl shadow-inner"><ICONS.Calendar /></div>
              <Badge color="teal" className="scale-90">Hoy</Badge>
            </div>
            <div className="text-3xl font-ubuntu-bold text-gray-900 mb-1">{todayApps.length}</div>
            <div className="text-[10px] font-ubuntu-bold text-gray-400 uppercase tracking-widest">Citas Programadas</div>
          </Card>

          <Card 
            onClick={() => setActiveTab('history')} 
            className="p-8 border-l-[6px] border-brand-purple bg-gradient-to-br from-white to-brand-purple/[0.02] transform hover:scale-105 transition-all cursor-pointer shadow-md hover:shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-2xl shadow-inner"><ICONS.Users /></div>
            </div>
            <div className="text-3xl font-ubuntu-bold text-gray-900 mb-1">{patients.length}</div>
            <div className="text-[10px] font-ubuntu-bold text-gray-400 uppercase tracking-widest">Base de Pacientes</div>
          </Card>

          <Card 
            onClick={() => { setActiveTab('appointments'); setViewMode('kanban'); }}
            className="p-8 border-l-[6px] border-green-500 bg-gradient-to-br from-white to-green-50 transform hover:scale-105 transition-all cursor-pointer shadow-md hover:shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-2xl shadow-inner"><ICONS.CheckCircle /></div>
            </div>
            <div className="text-3xl font-ubuntu-bold text-gray-900 mb-1">
              {appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length}
            </div>
            <div className="text-[10px] font-ubuntu-bold text-gray-400 uppercase tracking-widest">Atenciones Exitosas</div>
          </Card>

          <Card 
            onClick={() => { setActiveTab('appointments'); setViewMode('kanban'); }}
            className="p-8 border-l-[6px] border-amber-500 bg-gradient-to-br from-white to-amber-50 transform hover:scale-105 transition-all cursor-pointer shadow-md hover:shadow-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-inner"><ICONS.Activity /></div>
            </div>
            <div className="text-3xl font-ubuntu-bold text-gray-900 mb-1">
              {appointments.filter(a => a.status === AppointmentStatus.PENDING).length}
            </div>
            <div className="text-[10px] font-ubuntu-bold text-gray-400 uppercase tracking-widest">Pendientes de Acción</div>
          </Card>
        </div>

        {/* Gráficos Bee Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 p-10 bg-white shadow-lg border border-gray-50">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-xl font-ubuntu-bold text-gray-900 tracking-tight uppercase">Rendimiento Semanal</h3>
                <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">Flujo de pacientes Bee</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-teal"></div> <span className="text-[9px] font-black uppercase text-gray-400">Citas</span></div>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statsTrend}>
                  <defs>
                    <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#017E84" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#017E84" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '700'}}
                    cursor={{stroke: '#017E84', strokeWidth: 2}}
                  />
                  <Area type="monotone" dataKey="citas" stroke="#017E84" strokeWidth={4} fillOpacity={1} fill="url(#colorCitas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="lg:col-span-4 p-10 flex flex-col shadow-lg border border-gray-50">
            <h3 className="text-xl font-ubuntu-bold text-gray-900 tracking-tight uppercase mb-2">Demanda Bee</h3>
            <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-10">Servicios más solicitados</p>
            <div className="flex-1 min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{fill: '#1e293b', fontSize: 10, fontWeight: 700}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '1rem', border: 'none'}} />
                  <Bar dataKey="total" fill="#714B67" radius={[0, 12, 12, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-6 border-t border-gray-50 mt-auto">
              <Button fullWidth variant="outline" size="sm" className="rounded-2xl" onClick={() => setActiveTab('services')}>Explorar Catálogo</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const KanbanView = () => {
    const columns = Object.values(AppointmentStatus);
    return (
      <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-250px)] custom-scrollbar">
        {columns.map(status => {
          const filteredApps = appointments.filter(a => a.status === status);
          return (
            <div key={status} className="flex-shrink-0 w-85 flex flex-col gap-6">
              <div className={`flex items-center justify-between px-6 py-3.5 bg-white rounded-2xl border-t-4 border-${getStatusColor(status)}-500 shadow-sm`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-${getStatusColor(status)}-500 animate-pulse`}></div>
                  <h4 className="font-ubuntu-bold text-gray-800 text-xs uppercase tracking-[0.2em]">{statusTranslations[status]}</h4>
                </div>
                <Badge color="gray" className="font-black">{filteredApps.length}</Badge>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                {filteredApps.map(app => (
                  <Card key={app.id} onClick={() => { setSelectedAppointment(app); setIsViewModalOpen(true); }} className="p-6 border border-transparent hover:border-brand-teal/20 group relative overflow-hidden bg-white shadow-sm hover:shadow-xl">
                    <div className={`absolute top-0 left-0 w-1.5 h-full bg-${getStatusColor(app.status)}-500 opacity-20 group-hover:opacity-100 transition-all`}></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-[11px] font-ubuntu-bold text-brand-teal uppercase tracking-widest">{app.time} HS</div>
                      <Badge color={getStatusColor(app.status)} className="scale-75 origin-right">BEE</Badge>
                    </div>
                    <div className="font-ubuntu-bold text-gray-900 group-hover:text-brand-teal transition-colors mb-3 text-lg leading-tight tracking-tight">{app.patientName}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                       <ICONS.MapPin className="w-3.5 h-3.5" /> {sedes.find(s => s.id === app.sedeId)?.name}
                    </div>
                  </Card>
                ))}
                {filteredApps.length === 0 && <div className="text-center py-24 border-2 border-dashed border-gray-100 rounded-[3rem] text-gray-200 text-[10px] font-bold uppercase tracking-[0.3em] bg-gray-50/20">Módulo Vacío</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const HistoryModule = () => {
    const filtered = patients.filter(p => p.name.toLowerCase().includes(searchPatient.toLowerCase()) || p.phone.includes(searchPatient));
    
    const handleAISummarize = async (notes: string) => {
      setIsSummarizing(true);
      const summary = await summarizeConsultation(notes);
      alert(summary); 
      setIsSummarizing(false);
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fade-in">
        <div className="lg:col-span-4 space-y-6">
          <Input placeholder="Buscar paciente por nombre..." icon={<ICONS.Search />} value={searchPatient} onChange={e => setSearchPatient(e.target.value)} />
          <div className="space-y-4 overflow-y-auto max-h-[650px] custom-scrollbar pr-2">
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelectedPatient(p)} className={`p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer flex items-center gap-5 ${selectedPatient?.id === p.id ? 'bg-brand-teal text-white border-brand-teal shadow-2xl scale-[1.02]' : 'bg-white border-gray-50 hover:border-brand-teal/30 shadow-sm'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-ubuntu-bold text-xl shadow-inner ${selectedPatient?.id === p.id ? 'bg-white/20' : 'bg-gray-100 text-gray-300'}`}>{p.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                   <div className="font-ubuntu-bold text-lg truncate tracking-tight">{p.name}</div>
                   <div className="text-[10px] opacity-70 uppercase tracking-[0.2em] font-black mt-1">{p.phone}</div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center py-20 text-gray-300 text-[11px] uppercase font-black tracking-[0.4em] opacity-40">Sin resultados Bee</p>}
          </div>
        </div>
        <div className="lg:col-span-8">
          {selectedPatient ? (
            <Card className="p-12 space-y-12 border-none shadow-xl bg-white/60 backdrop-blur-xl rounded-[3rem]">
              <div className="flex justify-between items-start border-b border-gray-100 pb-10">
                <div>
                  <h3 className="text-4xl font-ubuntu-bold text-brand-navy tracking-tighter uppercase">{selectedPatient.name}</h3>
                  <div className="flex items-center gap-4 mt-4">
                     <p className="text-sm text-gray-400 font-black uppercase tracking-[0.2em]">{selectedPatient.phone}</p>
                     <div className="w-1.5 h-1.5 bg-brand-teal rounded-full"></div>
                     <p className="text-sm text-gray-400 font-black uppercase tracking-[0.2em]">{selectedPatient.email}</p>
                  </div>
                </div>
                <Badge color="teal" className="px-6 py-2.5 shadow-lg border-none text-[11px]">BEE RECORD ID: {selectedPatient.id.slice(-5)}</Badge>
              </div>
              <div className="relative pl-12 space-y-12 before:absolute before:left-4.5 before:top-2 before:bottom-2 before:w-1.5 before:bg-gray-100 before:rounded-full">
                {selectedPatient.history.length === 0 && <p className="text-gray-400 italic text-base py-6 text-center">Inicie el primer registro clínico para este paciente.</p>}
                {selectedPatient.history.map(entry => (
                  <div key={entry.id} className="relative group">
                    <div className="absolute -left-[45px] top-2 w-5 h-5 rounded-full bg-brand-teal border-4 border-white shadow-xl group-hover:scale-125 transition-all"></div>
                    <div 
                      onClick={() => { setSelectedHistoryEntry(entry); setIsEditHistoryModalOpen(true); }}
                      className="bg-white border border-gray-100 rounded-[2rem] p-10 shadow-md hover:shadow-2xl transition-all cursor-pointer hover:border-brand-teal/20"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-5">
                          <span className="text-[12px] font-ubuntu-bold text-brand-teal uppercase bg-brand-teal/5 px-5 py-2.5 rounded-2xl border border-brand-teal/10 shadow-sm">{entry.date}</span>
                          {entry.treatmentId && (
                             <Badge color="purple" className="py-2.5 px-5 border-none shadow-sm">
                                {entry.sessionNumber ? `SESIÓN ${entry.sessionNumber} / ${entry.totalSessions}` : 'BEE PLAN ACTIVO'}
                             </Badge>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-brand-teal hover:bg-brand-teal/10 gap-3 px-5 rounded-xl border border-brand-teal/10"
                          onClick={(e) => { e.stopPropagation(); handleAISummarize(entry.notes); }}
                          disabled={isSummarizing}
                        >
                          <ICONS.Sparkles className="w-4 h-4 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Bee AI Summary</span>
                        </Button>
                      </div>
                      <div className="space-y-8">
                        <div className="bg-gray-50/50 p-8 rounded-[1.5rem] border border-gray-100 shadow-inner">
                          <label className="text-[11px] font-ubuntu-bold text-gray-400 uppercase tracking-[0.3em] block mb-4">ANÁLISIS CLÍNICO</label>
                          <p className="text-base text-gray-700 leading-relaxed font-ubuntu-regular italic">"{entry.notes}"</p>
                        </div>
                        {entry.medications && entry.medications.length > 0 && (
                          <div className="bg-brand-navy/[0.03] p-8 rounded-[1.5rem] border-2 border-brand-navy/5 border-dashed">
                            <label className="text-[10px] font-ubuntu-bold text-brand-navy uppercase mb-5 block tracking-[0.4em]">FARMACOTERAPIA BEE</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {entry.medications.map((m, i) => (
                                <div key={i} className="text-[13px] font-ubuntu-medium text-gray-800 flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                  <div className="w-2.5 h-2.5 bg-brand-teal rounded-full shrink-0 shadow-lg shadow-brand-teal/30"></div> 
                                  <span>{m.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="h-[700px] flex flex-col items-center justify-center text-gray-300 border-4 border-dashed border-gray-100 rounded-[4rem] bg-gray-50/20">
              <div className="p-12 bg-white rounded-[3rem] shadow-2xl mb-10 transform -rotate-3 border border-gray-50"><ICONS.Clipboard className="w-24 h-24 text-brand-teal opacity-40" /></div>
              <p className="text-[13px] font-ubuntu-bold uppercase tracking-[0.5em] opacity-40">Seleccione expediente para visualizar</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProfessionalsModule = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fade-in">
      {professionals.map(p => (
        <Card key={p.id} className="p-10 flex flex-col items-center text-center shadow-lg border border-gray-50 hover:shadow-2xl transition-all">
          <div className="w-32 h-32 rounded-[2rem] overflow-hidden mb-8 border-4 border-white shadow-2xl transform hover:rotate-2 transition-transform">
             <img src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}`} className="w-full h-full object-cover" />
          </div>
          <h3 className="text-2xl font-ubuntu-bold text-gray-900 uppercase tracking-tighter mb-2 leading-none">{p.name}</h3>
          <Badge color="teal" className="mb-8 px-5 py-2">{p.specialty}</Badge>
          <div className="w-full pt-8 border-t border-gray-50 flex flex-wrap justify-center gap-3">
             {p.sedeIds.map(sid => (
               <Badge key={sid} color="gray" className="text-[9px] px-3 font-black">{sedes.find(s => s.id === sid)?.name}</Badge>
             ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const TreatmentsModule = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fade-in">
      {treatments.map(t => (
        <Card key={t.id} className="p-10 space-y-8 shadow-lg border border-gray-50 hover:border-brand-purple/20">
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 bg-brand-purple/10 text-brand-purple rounded-2xl flex items-center justify-center shadow-inner"><ICONS.BookOpen className="w-7 h-7" /></div>
            <Badge color="purple" className="scale-110 shadow-sm">BEE PLAN</Badge>
          </div>
          <div>
             <h3 className="text-2xl font-ubuntu-bold text-gray-900 uppercase tracking-tighter mb-4">{t.name}</h3>
             <p className="text-sm text-gray-500 font-ubuntu-regular leading-relaxed line-clamp-3">{t.description}</p>
          </div>
          <div className="pt-8 border-t border-gray-50 flex justify-between items-end">
             <div className="space-y-1">
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Estructura</span>
               <div className="font-ubuntu-bold text-brand-navy text-lg">{t.sessions} Sesiones</div>
             </div>
             <div className="text-right space-y-1">
               <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Valorización</span>
               <div className="font-ubuntu-bold text-brand-teal text-3xl tracking-tighter">S/ {t.price}</div>
             </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const SedesModule = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
      {sedes.map(s => (
        <Card key={s.id} className="p-12 space-y-8 shadow-xl border border-gray-50 hover:border-brand-teal/20 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 bg-brand-teal text-white rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0">
             <ICONS.MapPin className="w-12 h-12" />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-3xl font-ubuntu-bold text-gray-900 uppercase tracking-tighter leading-none">{s.name}</h3>
            <p className="text-base text-gray-400 font-ubuntu-medium leading-tight">{s.address}</p>
            <div className="pt-6 border-t border-gray-50 flex items-center gap-5">
               <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shadow-inner">
                  <ICONS.Activity className="w-6 h-6" />
               </div>
               <div className="font-ubuntu-bold text-xl text-gray-800 tracking-tight">{s.phone}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const ServicesModule = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in">
      {services.map(s => (
        <Card key={s.id} className="p-8 flex flex-col justify-between shadow-lg border-b-8 border-brand-teal hover:shadow-2xl transition-all">
          <div>
            <Badge color="teal" className="mb-6 px-4 font-black">{s.category}</Badge>
            <h3 className="text-xl font-ubuntu-bold text-gray-900 uppercase tracking-tight leading-tight">{s.name}</h3>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-50 flex justify-between items-center">
             <div className="flex items-center gap-3 text-gray-400">
                <div className="p-2 bg-gray-50 rounded-lg"><ICONS.Calendar className="w-4 h-4" /></div>
                <span className="text-[11px] font-black uppercase tracking-widest">{s.duration} MIN</span>
             </div>
             <Button variant="ghost" size="sm" className="text-brand-teal font-black uppercase tracking-widest text-[9px] hover:bg-brand-teal/5">MODIFICAR</Button>
          </div>
        </Card>
      ))}
    </div>
  );

  const SettingsModule = () => (
    <Card className="p-16 max-w-5xl mx-auto bg-white shadow-2xl rounded-[4rem] border-none overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="space-y-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <label className="text-[12px] font-ubuntu-bold text-gray-400 uppercase tracking-[0.4em] ml-2">LogoBee Identidad</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-56 h-56 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-brand-teal/50 hover:bg-white transition-all overflow-hidden shadow-inner group"
            >
              {company.logo ? (
                <img src={company.logo} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-5 text-gray-300 group-hover:text-brand-teal transition-colors">
                  <ICONS.Image className="w-12 h-12" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Cargar Archivo</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} hidden onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" />
          </div>

          <div className="space-y-6">
            <label className="text-[12px] font-ubuntu-bold text-gray-400 uppercase tracking-[0.4em] ml-2">Background de Reserva</label>
            <div 
              onClick={() => bgInputRef.current?.click()}
              className="w-full h-56 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-brand-teal/50 hover:bg-white transition-all overflow-hidden shadow-inner group"
            >
              {company.backgroundImage ? (
                <img src={company.backgroundImage} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-5 text-gray-300 group-hover:text-brand-teal transition-colors">
                  <ICONS.Image className="w-12 h-12" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Actualizar Fondo</span>
                </div>
              )}
            </div>
            <input type="file" ref={bgInputRef} hidden onChange={(e) => handleFileUpload(e, 'backgroundImage')} accept="image/*" />
          </div>
        </div>

        <div className="space-y-12 pt-16 border-t border-gray-100">
           <Input label="Razón Social / Nombre Comercial" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} className="py-5 text-lg font-ubuntu-bold" />
           <div className="grid grid-cols-2 gap-12">
              <div className="space-y-5">
                 <label className="text-[11px] font-ubuntu-bold text-gray-400 uppercase tracking-widest ml-2">Primary Clinical Color</label>
                 <div className="flex gap-6 items-center">
                    <input type="color" className="w-16 h-16 rounded-2xl cursor-pointer border-none bg-transparent shadow-xl" value={company.primaryColor} onChange={e => setCompany({...company, primaryColor: e.target.value})} />
                    <Input value={company.primaryColor} onChange={e => setCompany({...company, primaryColor: e.target.value})} className="font-mono text-sm tracking-widest bg-white" />
                 </div>
              </div>
              <div className="space-y-5">
                 <label className="text-[11px] font-ubuntu-bold text-gray-400 uppercase tracking-widest ml-2">Secondary Design Color</label>
                 <div className="flex gap-6 items-center">
                    <input type="color" className="w-16 h-16 rounded-2xl cursor-pointer border-none bg-transparent shadow-xl" value={company.secondaryColor} onChange={e => setCompany({...company, secondaryColor: e.target.value})} />
                    <Input value={company.secondaryColor} onChange={e => setCompany({...company, secondaryColor: e.target.value})} className="font-mono text-sm tracking-widest bg-white" />
                 </div>
              </div>
           </div>
        </div>
        
        <div className="pt-10">
           <Button fullWidth size="lg" className="py-7 rounded-[2rem] shadow-2xl tracking-[0.4em] text-[13px] uppercase font-black border-none">Sincronizar Bee Platform</Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-ubuntu">
      <aside className="w-72 brand-gradient p-10 flex flex-col gap-12 shadow-2xl shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
           <div className="absolute top-1/4 -right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="flex items-center gap-6 mb-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 text-white rounded-[1.5rem] flex items-center justify-center border border-white/20 overflow-hidden shadow-2xl backdrop-blur-xl">
             {company.logo ? <img src={company.logo} className="w-full h-full object-cover" /> : <ICONS.Activity className="w-8 h-8" />}
          </div>
          <div className="flex flex-col min-w-0">
             <span className="text-2xl font-ubuntu-bold text-white leading-none truncate tracking-tighter uppercase">{company.name.split(' ')[0]}</span>
             <span className="text-[10px] text-brand-teal uppercase mt-2.5 tracking-[0.3em] font-black opacity-90">{userRole}</span>
          </div>
        </div>
        <nav className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1 relative z-10">
          {renderSidebarItem('overview', 'Dashboard', <ICONS.Activity />)}
          {renderSidebarItem('appointments', 'AgendaBee', <ICONS.Calendar />)}
          {renderSidebarItem('history', 'Expedientes', <ICONS.Clipboard />)}
          <div className="pt-16 pb-6 text-[11px] font-ubuntu-bold text-white/30 uppercase tracking-[0.5em] ml-5">SISTEMA</div>
          {renderSidebarItem('professionals', 'Staff Médico', <ICONS.Users />)}
          {renderSidebarItem('treatments', 'Protocolos', <ICONS.BookOpen />)}
          {renderSidebarItem('sedes', 'Sedes Bee', <ICONS.MapPin />)}
          {renderSidebarItem('services', 'Catálogo', <ICONS.Activity />)}
          {renderSidebarItem('settings', 'Configuración', <ICONS.Settings />)}
        </nav>
        <div className="mt-auto pt-12 border-t border-white/10 space-y-6 relative z-10">
          <Button variant="outline" fullWidth className="text-white border-white/20 font-ubuntu-bold text-[12px] rounded-2xl py-5 tracking-[0.3em] uppercase bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all shadow-xl" onClick={onOpenPortal}>PORTAL PÚBLICO</Button>
          <Button variant="primary" fullWidth className="bg-white/5 border-none text-white font-ubuntu-bold text-[12px] rounded-2xl py-5 uppercase tracking-[0.3em] opacity-50 hover:opacity-100 transition-all" onClick={onLogout}>SALIR BEE</Button>
        </div>
      </aside>

      <main className="flex-1 p-16 lg:p-24 overflow-auto bg-[#f8fafc]">
        <header className="flex justify-between items-end mb-20 animate-fade-in">
          <div>
            <h1 className="text-5xl font-ubuntu-bold text-gray-900 tracking-tighter uppercase leading-none">
              {activeTab === 'overview' && 'Panel Maestro'}
              {activeTab === 'appointments' && 'Gestión Agenda'}
              {activeTab === 'history' && 'Historial Digital'}
              {activeTab === 'professionals' && 'Staff Especialista'}
              {activeTab === 'treatments' && 'Protocolos Beech'}
              {activeTab === 'sedes' && 'Sedes Bee'}
              {activeTab === 'services' && 'Servicios Clínicos'}
              {activeTab === 'settings' && 'Platform Setup'}
            </h1>
            <div className="flex items-center gap-4 mt-6">
               <div className="w-2.5 h-2.5 bg-brand-teal rounded-full animate-pulse shadow-[0_0_15px_rgba(1,126,132,0.8)]"></div>
               <p className="text-gray-400 text-[12px] uppercase font-ubuntu-bold tracking-[0.5em] leading-none">{PLATFORM_NAME} Cloud Engine</p>
            </div>
          </div>
          <div className="flex gap-6">
             {activeTab === 'appointments' && (
              <div className="bg-gray-100 p-2.5 rounded-[2rem] flex border border-gray-200 shadow-inner">
                <button onClick={() => setViewMode('calendar')} className={`p-3 px-10 rounded-2xl flex items-center gap-3 text-[12px] font-ubuntu-bold transition-all shadow-sm ${viewMode === 'calendar' ? 'bg-white text-brand-teal shadow-xl scale-105' : 'text-gray-400'}`}><ICONS.Calendar /> CALENDARIO</button>
                <button onClick={() => setViewMode('kanban')} className={`p-3 px-10 rounded-2xl flex items-center gap-3 text-[12px] font-ubuntu-bold transition-all shadow-sm ${viewMode === 'kanban' ? 'bg-white text-brand-teal shadow-xl scale-105' : 'text-gray-400'}`}><ICONS.Layout /> KANBAN</button>
                <button onClick={() => setViewMode('list')} className={`p-3 px-10 rounded-2xl flex items-center gap-3 text-[12px] font-ubuntu-bold transition-all shadow-sm ${viewMode === 'list' ? 'bg-white text-brand-teal shadow-xl scale-105' : 'text-gray-400'}`}><ICONS.List /> LISTA</button>
              </div>
            )}
             {(activeTab === 'overview' || activeTab === 'appointments') && (
               <Button size="lg" className="gap-4 rounded-[2rem] px-14 shadow-[0_25px_50px_-12px_rgba(1,126,132,0.5)] uppercase tracking-[0.3em] text-xs font-black py-6" onClick={() => { setSelectedAppointment(null); setPreselectedDate(''); setIsModalOpen(true); }}><ICONS.Plus /> NUEVA CITA BEE</Button>
             )}
          </div>
        </header>

        {activeTab === 'overview' && <DashboardOverview />}

        {activeTab === 'appointments' && (
          <div className="space-y-12 animate-fade-in">
             {viewMode === 'kanban' && <KanbanView />}
             {viewMode === 'calendar' && (
                <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.2)] overflow-hidden border border-gray-100">
                  <div className="p-16 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h4 className="text-4xl font-ubuntu-bold text-gray-900 capitalize tracking-tighter leading-none">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h4>
                    <div className="flex gap-5">
                      <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl hover:bg-brand-teal hover:text-white transition-all"><ICONS.ArrowLeft /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-[12px] uppercase font-black px-12 rounded-2xl bg-white shadow-sm border-gray-100 tracking-[0.3em]">ESTE MES</Button>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl rotate-180 hover:bg-brand-teal hover:text-white transition-all"><ICONS.ArrowLeft /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 bg-gray-100/40 text-center py-8 border-b border-gray-50 font-black">
                    {['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'].map(d => <div key={d} className="text-[12px] font-ubuntu-bold text-gray-400 tracking-[0.4em]">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 auto-rows-[200px]">
                    {Array.from({ length: 42 }).map((_, idx) => {
                      const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), idx - startDay + 1);
                      const dateStr = date.toISOString().split('T')[0];
                      const dayApps = appointments.filter(a => a.date === dateStr);
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                      return (
                        <div key={idx} onClick={() => { setPreselectedDate(dateStr); setSelectedAppointment(null); setIsModalOpen(true); }} className={`p-8 border-r border-b border-gray-50 relative group hover:bg-brand-teal/[0.05] transition-all cursor-pointer ${!isCurrentMonth ? 'bg-gray-50/10 opacity-10' : ''}`}>
                          <div className={`text-[14px] font-ubuntu-bold mb-6 w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${isToday ? 'bg-brand-teal text-white shadow-2xl scale-125' : 'text-gray-900 group-hover:bg-white group-hover:shadow-xl'}`}>{date.getDate()}</div>
                          <div className="space-y-3 overflow-y-auto max-h-[110px] custom-scrollbar">
                            {dayApps.map(app => (
                              <div key={app.id} onClick={(e) => { e.stopPropagation(); setSelectedAppointment(app); setIsViewModalOpen(true); }} className={`text-[10px] font-ubuntu-bold p-3 rounded-2xl truncate border shadow-sm transition-all hover:scale-105 hover:bg-white ${app.status === AppointmentStatus.COMPLETED ? 'bg-green-50 text-green-600 border-green-100' : 'bg-brand-teal/5 text-brand-teal border-brand-teal/10'}`}>{app.time} {app.patientName}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
             )}
             {viewMode === 'list' && (
              <Card className="p-0 border border-gray-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[4rem] overflow-hidden bg-white">
                <table className="w-full text-left">
                  <thead className="bg-gray-100/50 backdrop-blur-xl text-gray-400 text-[12px] font-ubuntu-bold uppercase tracking-[0.4em] font-black"><tr className="border-b border-gray-50"><th className="px-16 py-10">PACIENTE BEE</th><th className="px-16 py-10">CRONOGRAMA</th><th className="px-16 py-10">ESTADO CLÍNICO</th><th className="px-16 py-10 text-right">GESTIÓN</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {appointments.map(app => (
                      <tr key={app.id} className="hover:bg-gray-50/80 transition-all group">
                        <td className="px-16 py-10">
                           <div className="font-ubuntu-bold text-gray-900 text-xl leading-none tracking-tight">{app.patientName}</div>
                           <div className="text-[12px] text-gray-400 font-black tracking-[0.3em] uppercase mt-4 opacity-50">{app.patientPhone}</div>
                        </td>
                        <td className="px-16 py-10">
                           <div className="font-ubuntu-bold text-gray-700 text-base tracking-tight">{app.date}</div>
                           <div className="text-[13px] font-ubuntu-bold text-brand-teal mt-2 uppercase tracking-[0.2em]">{app.time} HS</div>
                        </td>
                        <td className="px-16 py-10"><Badge color={getStatusColor(app.status)} className="px-8 py-3 rounded-2xl shadow-sm border-none font-black">{statusTranslations[app.status]}</Badge></td>
                        <td className="px-16 py-10 text-right">
                          <div className="flex justify-end gap-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-10 group-hover:translate-x-0">
                            <Button variant="ghost" size="sm" className="p-5 rounded-[1.5rem] bg-gray-50 shadow-sm border border-gray-100 hover:bg-brand-navy hover:text-white transition-all" onClick={() => { setSelectedAppointment(app); setIsViewModalOpen(true); }}><ICONS.Eye className="w-6 h-6" /></Button>
                            <Button variant="ghost" size="sm" className="p-5 rounded-[1.5rem] bg-gray-50 shadow-sm border border-gray-100 text-brand-teal hover:bg-brand-teal hover:text-white transition-all" onClick={() => { setSelectedAppointment(app); setIsModalOpen(true); }}><ICONS.Edit className="w-6 h-6" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
             )}
          </div>
        )}

        {activeTab === 'history' && <HistoryModule />}
        {activeTab === 'professionals' && <ProfessionalsModule />}
        {activeTab === 'treatments' && <TreatmentsModule />}
        {activeTab === 'sedes' && <SedesModule />}
        {activeTab === 'services' && <ServicesModule />}
        {activeTab === 'settings' && <SettingsModule />}

        {/* MODAL CITA CON ESTADOS COLOREADOS */}
        <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedAppointment(null); }} title={selectedAppointment ? 'Modificar Registro' : 'Nueva CitaBee'}>
          <form onSubmit={handleCreateOrEdit} className="space-y-12 p-4">
            <div className="grid grid-cols-2 gap-10"><Input name="patientName" label="NOMBRE DEL PACIENTE" defaultValue={selectedAppointment?.patientName} required placeholder="Nombre completo" /><Input name="patientPhone" label="WHATSAPP DE CONTACTO" defaultValue={selectedAppointment?.patientPhone} required placeholder="+51 900 000 000" /></div>
            <div className="grid grid-cols-2 gap-10"><Input name="date" type="date" label="DÍA DE ATENCIÓN" defaultValue={selectedAppointment?.date || preselectedDate} required /><Input name="time" type="time" label="BLOQUE HORARIO" defaultValue={selectedAppointment?.time} required /></div>
            <div className="grid grid-cols-2 gap-10">
              <div className="flex flex-col gap-4">
                <label className="text-[11px] font-ubuntu-bold text-gray-500 uppercase tracking-[0.3em] ml-2">SERVICIO REQUERIDO</label>
                <select name="serviceId" className="px-8 py-5 border border-gray-100 rounded-[1.5rem] outline-none text-base font-ubuntu-bold bg-gray-100/50 shadow-inner focus:bg-white focus:ring-8 focus:ring-brand-teal/5 transition-all" defaultValue={selectedAppointment?.serviceId}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-4">
                <label className="text-[11px] font-ubuntu-bold text-gray-500 uppercase tracking-[0.3em] ml-2">ESTADO DE AGENDA</label>
                <div className="relative group">
                   <select 
                    name="status" 
                    className={`w-full px-8 py-5 border border-gray-100 rounded-[1.5rem] outline-none text-base font-ubuntu-bold shadow-inner focus:bg-white focus:ring-8 focus:ring-brand-teal/5 transition-all appearance-none bg-gray-100/50`}
                    defaultValue={selectedAppointment?.status || AppointmentStatus.PENDING}
                   >
                    {Object.values(AppointmentStatus).map(st => (
                      <option key={st} value={st} className={`font-bold py-3 text-${getStatusColor(st)}-600`}>
                         {statusTranslations[st]}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-brand-teal transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>
            <Button fullWidth size="lg" className="rounded-[2.5rem] py-8 shadow-2xl tracking-[0.5em] text-[13px] uppercase border-none mt-10 font-black">ACTUALIZAR AGENDA BEE</Button>
          </form>
        </Modal>

        {/* MODAL CLINICO BEE CARE */}
        <Modal isOpen={isCompletionModalOpen} onClose={() => { setIsCompletionModalOpen(false); setIsCreatingNewPlan(false); setNumSessions(1); }} title="Finalización de Atención Bee">
          <form onSubmit={handleFinishConsultation} className="space-y-14 p-4">
            <div className="bg-brand-teal/[0.04] p-10 rounded-[3rem] border border-brand-teal/10 shadow-inner">
              <label className="text-[14px] font-ubuntu-bold text-brand-navy mb-6 block uppercase tracking-[0.4em]">Diagnóstico y Evolución</label>
              <textarea name="clinicalNotes" required className="w-full px-10 py-8 border border-gray-100 rounded-[2rem] min-h-[200px] outline-none text-base font-ubuntu-regular shadow-inner placeholder:italic bg-white focus:ring-8 focus:ring-brand-teal/10 transition-all leading-relaxed" placeholder="Resumen clínico de la visita..."></textarea>
            </div>

            <div className="space-y-6">
              <label className="text-[14px] font-ubuntu-bold text-gray-400 uppercase tracking-[0.4em] ml-3">Prescripciones / RecetaBee</label>
              <textarea name="recipeItems" className="w-full px-10 py-8 border border-gray-100 rounded-[2rem] min-h-[160px] outline-none text-base font-ubuntu-regular bg-gray-50/50 shadow-inner focus:bg-white focus:ring-8 focus:ring-brand-teal/10 transition-all leading-relaxed" placeholder="Fármacos e indicaciones (uno por línea)..."></textarea>
            </div>

            <div className="bg-brand-purple/[0.04] p-12 rounded-[3.5rem] border border-brand-purple/10 space-y-12 shadow-inner">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-ubuntu-bold text-brand-purple uppercase tracking-[0.35em]">Planificación de Ciclos Bee</label>
                <div className="flex items-center gap-6 bg-white px-8 py-4 rounded-[1.5rem] border border-brand-purple/20 shadow-xl">
                   <input type="checkbox" id="checkNewPlan" checked={isCreatingNewPlan} onChange={e => setIsCreatingNewPlan(e.target.checked)} className="accent-brand-purple w-7 h-7 cursor-pointer" />
                   <label htmlFor="checkNewPlan" className="text-[12px] font-black text-brand-purple cursor-pointer uppercase tracking-[0.25em]">INICIAR PLAN BEE</label>
                </div>
              </div>

              {isCreatingNewPlan ? (
                <div className="space-y-12 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Input name="newPlanName" label="NOMBRE DEL PROTOCOLO" placeholder="Ej: Tratamiento Podológico Integral" required />
                    <Input name="sessionsCount" type="number" label="CANTIDAD DE ATENCIONES" value={numSessions} onChange={e => setNumSessions(Math.max(1, parseInt(e.target.value) || 1))} required />
                  </div>
                  
                  <div className="flex items-center gap-6 py-6 px-10 bg-white rounded-[2rem] border border-brand-purple/10 shadow-lg">
                    <input type="checkbox" id="checkToday" checked={includeTodayAsFirst} onChange={e => setIncludeTodayAsFirst(e.target.checked)} className="accent-brand-purple w-6 h-6" />
                    <label htmlFor="checkToday" className="text-[12px] font-ubuntu-bold text-gray-600 uppercase tracking-[0.3em] cursor-pointer">Registrar hoy como Sesión #1</label>
                  </div>

                  <div className="space-y-8 pt-12 border-t border-brand-purple/10">
                    <label className="text-[13px] font-ubuntu-bold text-brand-purple uppercase tracking-[0.4em] ml-4">Cronograma de Sesiones Futuras</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {sessionDates.map((date, idx) => (
                        <div key={idx} className="flex flex-col gap-4 bg-white p-8 rounded-[2rem] border border-gray-50 shadow-md transition-all hover:border-brand-purple/50 transform hover:-translate-y-2">
                          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">SESIÓN {includeTodayAsFirst ? idx + 2 : idx + 1}</label>
                          <input 
                            type="date" 
                            required
                            value={date}
                            onChange={(e) => {
                              const newDates = [...sessionDates];
                              newDates[idx] = e.target.value;
                              setSessionDates(newDates);
                            }}
                            className="px-6 py-5 border border-gray-100 rounded-2xl text-base font-ubuntu-bold outline-none focus:ring-12 focus:ring-brand-purple/5 bg-gray-100/30 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col gap-5">
                    <label className="text-[12px] font-ubuntu-bold text-gray-600 uppercase ml-4 tracking-[0.3em]">Asociar a Plan de Tratamiento</label>
                    <select name="treatmentId" className="px-8 py-6 border border-gray-100 rounded-[2rem] bg-white outline-none text-base font-ubuntu-bold shadow-xl transition-all focus:ring-12 focus:ring-brand-purple/5">
                      <option value="">Cita Única e Independiente</option>
                      {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <Input name="sessionNumber" type="number" label="Nº DE SESIÓN ACTUAL" placeholder="1" />
                </div>
              )}
            </div>

            <Button fullWidth size="lg" className="rounded-[2.5rem] py-8 shadow-2xl uppercase tracking-[0.5em] text-[14px] font-black bg-brand-navy border-none mt-6">CERRAR REGISTRO CLÍNICO BEE</Button>
          </form>
        </Modal>

        {/* MODAL EDITAR EXPEDIENTE */}
        <Modal 
          isOpen={isEditHistoryModalOpen} 
          onClose={() => { setIsEditHistoryModalOpen(false); setSelectedHistoryEntry(null); }} 
          title="BeeCare Entry Management"
        >
          {selectedHistoryEntry && (
            <form onSubmit={handleUpdateHistoryEntry} className="space-y-12 p-4">
              <div className="flex items-center justify-between px-3 bg-gray-100 p-8 rounded-[2rem] border border-gray-200 shadow-inner">
                <Badge color="teal" className="px-8 py-3.5 text-[12px] tracking-[0.4em] font-black">{selectedHistoryEntry.date}</Badge>
                {selectedHistoryEntry.treatmentId && <Badge color="purple" className="px-8 py-3.5 text-[12px] tracking-[0.4em] font-black">SESIÓN {selectedHistoryEntry.sessionNumber} / {selectedHistoryEntry.totalSessions}</Badge>}
              </div>

              <div className="bg-brand-teal/[0.02] p-10 rounded-[3rem] border border-brand-teal/10 shadow-inner">
                <label className="text-[14px] font-ubuntu-bold text-brand-navy mb-6 block uppercase tracking-[0.3em]">Notas de Evolución</label>
                <textarea 
                  name="clinicalNotes" 
                  defaultValue={selectedHistoryEntry.notes}
                  required 
                  className="w-full px-10 py-8 border border-gray-100 rounded-[2rem] min-h-[220px] outline-none text-base font-ubuntu-regular shadow-inner bg-white focus:ring-12 focus:ring-brand-teal/5 transition-all leading-relaxed" 
                />
              </div>

              <div className="space-y-6">
                <label className="text-[14px] font-ubuntu-bold text-gray-400 uppercase tracking-[0.4em] ml-2">Plan Terapéutico</label>
                <textarea 
                  name="recipeItems" 
                  defaultValue={selectedHistoryEntry.medications?.map(m => m.name).join('\n')}
                  className="w-full px-10 py-8 border border-gray-100 rounded-[2rem] min-h-[160px] outline-none text-base font-ubuntu-regular bg-gray-50/50 shadow-inner focus:bg-white focus:ring-12 focus:ring-brand-teal/5 transition-all leading-relaxed" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
                <Input 
                  name="nextSessionDate" 
                  type="date" 
                  label="PROXIMA CITA PROGRAMADA" 
                  defaultValue={selectedHistoryEntry.nextSessionDate} 
                  icon={<ICONS.Calendar />} 
                />
                <div className="grid grid-cols-2 gap-8">
                  <Input name="sessionNumber" type="number" label="ACTUAL #" defaultValue={selectedHistoryEntry.sessionNumber} />
                  <Input name="totalSessions" type="number" label="TOTAL #" defaultValue={selectedHistoryEntry.totalSessions} />
                </div>
              </div>

              <Button fullWidth size="lg" className="rounded-[2rem] py-8 shadow-2xl uppercase tracking-[0.4em] text-[14px] font-black bg-brand-teal border-none mt-10">
                ACTUALIZAR HISTORIAL BEE
              </Button>
            </form>
          )}
        </Modal>

        {/* MODAL RESUMEN AGENDA */}
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Bee Detail Overview">
          {selectedAppointment && (
            <div className="space-y-16 p-4">
              <div className="flex items-center gap-14 p-12 bg-gray-100/50 rounded-[3.5rem] border border-gray-200 shadow-inner relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-teal opacity-5 rounded-full blur-2xl"></div>
                <div className="w-32 h-32 bg-brand-teal text-white rounded-[2rem] flex items-center justify-center font-ubuntu-bold text-5xl shadow-2xl border-4 border-white transform rotate-6 scale-110">{selectedAppointment.patientName.charAt(0)}</div>
                <div className="space-y-6 relative z-10">
                  <h4 className="text-4xl font-ubuntu-bold text-gray-900 tracking-tighter uppercase leading-none">{selectedAppointment.patientName}</h4>
                  <Badge color={getStatusColor(selectedAppointment.status)} className="px-10 py-3 tracking-[0.4em] text-[12px] shadow-lg font-black border-none">{statusTranslations[selectedAppointment.status]}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-base px-8">
                <div className="space-y-4">
                   <div className="text-[14px] font-black text-gray-400 uppercase tracking-[0.4em]">WhatsApp Link</div>
                   <div className="font-ubuntu-bold text-gray-800 text-2xl border-b-4 border-gray-50 pb-5 tracking-tight">{selectedAppointment.patientPhone}</div>
                </div>
                <div className="space-y-4">
                   <div className="text-[14px] font-black text-gray-400 uppercase tracking-[0.4em]">Slot en Agenda</div>
                   <div className="font-ubuntu-bold text-gray-800 text-2xl border-b-4 border-gray-50 pb-5 tracking-tight">{selectedAppointment.date} • {selectedAppointment.time} HS</div>
                </div>
                <div className="col-span-full space-y-8 bg-brand-teal/[0.03] p-10 rounded-[2.5rem] border border-brand-teal/10 shadow-xl">
                   <div className="text-[14px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-5">
                      <div className="w-3 h-3 bg-brand-teal rounded-full animate-ping"></div> UBICACIÓN Y SERVICIO REQUERIDO
                   </div>
                   <div className="font-ubuntu-bold text-brand-navy uppercase tracking-[0.1em] flex items-center justify-between text-xl">
                      <span>{sedes.find(s => s.id === selectedAppointment.sedeId)?.name}</span>
                      <div className="px-6 py-2.5 bg-brand-teal/10 text-brand-teal rounded-2xl text-[11px] tracking-[0.3em] uppercase font-black shadow-inner border border-brand-teal/5">
                         {services.find(s => s.id === selectedAppointment.serviceId)?.name}
                      </div>
                   </div>
                </div>
              </div>
              <div className="pt-16 border-t border-gray-50 flex flex-col sm:flex-row justify-end gap-6 px-4">
                 <Button variant="outline" onClick={() => { setIsViewModalOpen(false); setSelectedAppointment(selectedAppointment); setIsModalOpen(true); }} className="gap-4 rounded-[2rem] text-[12px] uppercase tracking-[0.35em] py-6 px-14 border-4 font-black bg-white shadow-xl transform hover:-translate-y-1 transition-all"><ICONS.Edit className="w-6 h-6" /> REPROGRAMAR</Button>
                 <Button onClick={() => setIsViewModalOpen(false)} className="rounded-[2rem] text-[12px] uppercase tracking-[0.35em] py-6 px-16 border-none shadow-2xl font-black bg-brand-navy text-white transform hover:-translate-y-1 transition-all">SALIR BEE</Button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};
