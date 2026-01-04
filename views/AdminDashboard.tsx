
import React, { useState, useMemo, useRef } from 'react';
import { ICONS, PLATFORM_NAME, INITIAL_PATIENTS } from '../constants';
import { Card, Button, Badge, Input, Modal } from '../components/Shared';
import { Appointment, AppointmentStatus, Sede, Service, Company, Treatment, Professional, UserRole, Patient, Medication, ClinicalHistoryEntry } from '../types';

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
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string>('');
  
  // Patient / History State
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS || []);
  const [searchPatient, setSearchPatient] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const statusTranslations: Record<AppointmentStatus, string> = {
    [AppointmentStatus.PENDING]: 'Pendiente',
    [AppointmentStatus.CONFIRMED]: 'Confirmada',
    [AppointmentStatus.IN_PROGRESS]: 'En Curso',
    [AppointmentStatus.COMPLETED]: 'Completada',
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

    const medicationNames = formData.getAll('medName') as string[];
    const medicationInsts = formData.getAll('medInst') as string[];
    const medications: Medication[] = medicationNames.map((name, i) => ({
      name, instructions: medicationInsts[i]
    })).filter(m => m.name);

    const treatmentId = formData.get('treatmentId') as string;
    const sessionNumber = parseInt(formData.get('sessionNumber') as string);
    const selectedTreatment = treatments.find(t => t.id === treatmentId);

    const newEntry: ClinicalHistoryEntry = {
      id: Date.now().toString(),
      date: selectedAppointment.date,
      professionalId: selectedAppointment.professionalId,
      notes: formData.get('clinicalNotes') as string,
      medications,
      treatmentId: treatmentId || undefined,
      sessionNumber: sessionNumber || undefined,
      totalSessions: selectedTreatment?.sessions,
      nextSessionDate: formData.get('nextSession') as string
    };

    setPatients(prev => prev.map(p => p.phone === selectedAppointment.patientPhone ? {
      ...p,
      history: [newEntry, ...p.history]
    } : p));

    setIsCompletionModalOpen(false);
    setSelectedAppointment(null);
  };

  const renderSidebarItem = (id: typeof activeTab, label: string, icon: React.ReactNode) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all font-ubuntu-medium text-sm ${activeTab === id ? 'bg-white text-brand-navy shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
    >
      {icon} <span>{label}</span>
    </button>
  );

  const KanbanView = () => {
    const columns = Object.values(AppointmentStatus);
    return (
      <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-250px)] custom-scrollbar">
        {columns.map(status => {
          const filteredApps = appointments.filter(a => a.status === status);
          return (
            <div key={status} className="flex-shrink-0 w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${getStatusColor(status)}-500`}></div>
                  <h4 className="font-ubuntu-bold text-gray-700 text-sm uppercase tracking-widest">{statusTranslations[status]}</h4>
                </div>
                <Badge color="gray">{filteredApps.length}</Badge>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {filteredApps.map(app => (
                  <Card key={app.id} onClick={() => { setSelectedAppointment(app); setIsViewModalOpen(true); }} className="p-4 cursor-pointer hover:shadow-xl transition-all border border-transparent hover:border-brand-teal group">
                    <div className="text-xs font-ubuntu-bold text-brand-teal mb-1">{app.time}</div>
                    <div className="font-ubuntu-bold text-gray-900 group-hover:text-brand-teal transition-colors mb-2">{app.patientName}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{sedes.find(s => s.id === app.sedeId)?.name}</div>
                    <div className="mt-4 flex justify-end">
                       <button onClick={(e) => { e.stopPropagation(); setSelectedAppointment(app); setIsModalOpen(true); }} className="p-2 text-gray-300 hover:text-brand-teal"><ICONS.Edit className="w-4 h-4" /></button>
                    </div>
                  </Card>
                ))}
                {filteredApps.length === 0 && <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-3xl text-gray-300 text-xs font-bold uppercase">Sin citas</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const HistoryModule = () => {
    const filtered = patients.filter(p => p.name.toLowerCase().includes(searchPatient.toLowerCase()) || p.phone.includes(searchPatient));
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
        <div className="lg:col-span-4 space-y-6">
          <Input placeholder="Buscar paciente..." icon={<ICONS.Search />} value={searchPatient} onChange={e => setSearchPatient(e.target.value)} />
          <div className="space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-2">
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelectedPatient(p)} className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${selectedPatient?.id === p.id ? 'bg-brand-teal text-white border-brand-teal shadow-xl' : 'bg-white border-gray-100 hover:border-brand-teal/50'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-ubuntu-bold text-lg ${selectedPatient?.id === p.id ? 'bg-white/20' : 'bg-gray-100 text-gray-400'}`}>{p.name.charAt(0)}</div>
                <div className="flex-1 min-w-0"><div className="font-ubuntu-bold truncate">{p.name}</div><div className="text-[10px] opacity-60 uppercase">{p.phone}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-8">
          {selectedPatient ? (
            <Card className="p-8 space-y-8 border-none shadow-none bg-white/50">
              <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                <div>
                  <h3 className="text-2xl font-ubuntu-bold text-brand-navy">{selectedPatient.name}</h3>
                  <p className="text-sm text-gray-400 font-medium">{selectedPatient.phone}</p>
                </div>
                <Badge color="teal">Expediente Clínico</Badge>
              </div>
              <div className="relative pl-10 space-y-8 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {selectedPatient.history.length === 0 && <p className="text-gray-400 italic text-sm">No hay registros.</p>}
                {selectedPatient.history.map(entry => (
                  <div key={entry.id} className="relative group">
                    <div className="absolute -left-7 top-1 w-3 h-3 rounded-full bg-brand-teal border-2 border-white shadow-sm"></div>
                    <div className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-bold text-brand-teal uppercase bg-brand-teal/5 px-3 py-1 rounded-full">{entry.date}</span>
                        {entry.treatmentId && <Badge color="purple">Sesión {entry.sessionNumber} / {entry.totalSessions}</Badge>}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Diagnóstico / Evolución</label>
                          <p className="text-sm text-gray-700 leading-relaxed">{entry.notes}</p>
                        </div>
                        {entry.medications && entry.medications.length > 0 && (
                          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <label className="text-[9px] font-bold text-brand-navy uppercase mb-2 block">Receta Médica</label>
                            {entry.medications.map((m, i) => (
                              <div key={i} className="mb-2 last:mb-0"><span className="text-sm font-bold block">{m.name}</span><span className="text-xs text-gray-500">{m.instructions}</span></div>
                            ))}
                          </div>
                        )}
                        {entry.nextSessionDate && <div className="text-xs font-bold text-amber-600 bg-amber-50 p-3 rounded-xl flex items-center gap-2"><ICONS.Calendar className="w-4 h-4" /> Próxima cita: {entry.nextSessionDate}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-gray-300">
              <ICONS.Clipboard className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Selecciona un expediente</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProfessionalsModule = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-ubuntu-bold text-gray-800 uppercase tracking-widest">Personal Médico</h3>
        <Button size="sm" className="gap-2"><ICONS.Plus /> Agregar Médico</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map(p => (
          <Card key={p.id} className="p-6 hover:shadow-xl transition-all group">
            <div className="flex items-center gap-4 mb-6">
              <img src={p.avatar} alt={p.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
              <div>
                <h4 className="font-ubuntu-bold text-gray-900">{p.name}</h4>
                <p className="text-xs text-brand-teal font-bold uppercase">{p.specialty}</p>
              </div>
            </div>
            <div className="space-y-2">
               <div className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Sedes de atención</div>
               <div className="flex flex-wrap gap-2">
                 {p.sedeIds.map(sid => <Badge key={sid} color="gray">{sedes.find(s => s.id === sid)?.name || 'Sede'}</Badge>)}
               </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const TreatmentsModule = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-ubuntu-bold text-gray-800 uppercase tracking-widest">Protocolos Clínicos</h3>
        <Button size="sm" className="gap-2"><ICONS.Plus /> Nuevo Protocolo</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {treatments.map(t => (
          <Card key={t.id} className="p-8 flex flex-col justify-between hover:shadow-2xl transition-all">
            <div>
               <div className="flex justify-between items-center mb-4">
                  <Badge color="purple">{t.sessions} Sesiones</Badge>
                  <Button variant="ghost" size="sm" className="p-2"><ICONS.Edit /></Button>
               </div>
               <h4 className="text-xl font-ubuntu-bold text-gray-900 mb-2">{t.name}</h4>
               <p className="text-sm text-gray-500 line-clamp-3">{t.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const SedesModule = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-ubuntu-bold text-gray-800 uppercase tracking-widest">Nuestras Sedes</h3>
        <Button size="sm" className="gap-2"><ICONS.Plus /> Nueva Sede</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sedes.map(s => (
          <Card key={s.id} className="p-8 flex items-start gap-6 hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-brand-teal text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-brand-teal/20"><ICONS.MapPin className="w-8 h-8" /></div>
            <div className="flex-1">
              <h4 className="text-xl font-ubuntu-bold text-gray-900 mb-1">{s.name}</h4>
              <p className="text-sm text-gray-500 mb-4">{s.address}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-brand-teal bg-brand-teal/5 px-4 py-2 rounded-xl w-fit">
                <ICONS.Activity className="w-4 h-4" /> {s.phone}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const ServicesModule = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-ubuntu-bold text-gray-800 uppercase tracking-widest">Catálogo de Servicios</h3>
        <Button size="sm" className="gap-2"><ICONS.Plus /> Nuevo Servicio</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map(s => (
          <Card key={s.id} className="p-6 border-b-4 border-brand-teal">
            <Badge color="purple" className="mb-4">{s.category}</Badge>
            <h4 className="font-ubuntu-bold text-gray-900 text-lg mb-4">{s.name}</h4>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <ICONS.Calendar className="w-3 h-3" /> {s.duration} min de atención
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const SettingsModule = () => (
    <div className="max-w-4xl animate-fade-in space-y-8">
      <header>
        <h3 className="text-xl font-ubuntu-bold text-gray-800 uppercase tracking-widest">Perfil de la Clínica</h3>
        <p className="text-xs text-gray-400 mt-1">Personaliza la identidad visual de tu consultorio y del portal público.</p>
      </header>
      <Card className="p-10 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="space-y-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Logo Oficial</label>
              <div className="relative w-44 h-44 group">
                <div className="w-full h-full bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-teal">
                  {company.logo ? <img src={company.logo} className="w-full h-full object-cover" /> : <ICONS.Activity className="w-12 h-12 text-gray-200" />}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-brand-teal text-white p-3 rounded-2xl shadow-2xl hover:scale-110 transition-transform"><ICONS.Edit className="w-5 h-5" /></button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
              </div>
           </div>
           <div className="space-y-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Fondo del Portal</label>
              <div className="relative w-full h-44 group">
                <div className="w-full h-full bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-teal">
                  {company.backgroundImage ? <img src={company.backgroundImage} className="w-full h-full object-cover" /> : <ICONS.Image className="w-12 h-12 text-gray-200" />}
                </div>
                <button onClick={() => bgInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-brand-teal text-white p-3 rounded-2xl shadow-2xl hover:scale-110 transition-transform"><ICONS.Edit className="w-5 h-5" /></button>
                <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'backgroundImage')} />
              </div>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
          <Input label="Nombre de la Clínica" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} icon={<ICONS.Activity />} />
          <Input label="Eslogan del Centro" placeholder="Referencia en salud especializada" icon={<ICONS.Sparkles />} />
        </div>
        <div className="pt-8 flex justify-end">
          <Button size="lg" className="rounded-2xl px-10 shadow-xl" onClick={() => alert('Configuración guardada correctamente.')}>Guardar Cambios</Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex font-ubuntu">
      <aside className="w-72 brand-gradient p-8 flex flex-col gap-8 shadow-2xl shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/20 overflow-hidden shadow-xl">
             {company.logo ? <img src={company.logo} className="w-full h-full object-cover" /> : <ICONS.Activity className="w-6 h-6" />}
          </div>
          <div className="flex flex-col"><span className="text-xl font-ubuntu-bold text-white leading-none truncate max-w-[160px] tracking-tight">{company.name}</span><span className="text-[9px] text-brand-teal uppercase mt-1 tracking-widest font-bold">{userRole}</span></div>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {renderSidebarItem('overview', 'Dashboard', <ICONS.Activity />)}
          {renderSidebarItem('appointments', 'Agenda Global', <ICONS.Calendar />)}
          {renderSidebarItem('history', 'Expedientes', <ICONS.Clipboard />)}
          <div className="pt-6 pb-2 text-[10px] font-ubuntu-bold text-white/30 uppercase tracking-[0.2em] ml-4">Módulos Clínicos</div>
          {renderSidebarItem('professionals', 'Nuestro Staff', <ICONS.Users />)}
          {renderSidebarItem('treatments', 'Protocolos', <ICONS.BookOpen />)}
          {renderSidebarItem('sedes', 'Sedes', <ICONS.MapPin />)}
          {renderSidebarItem('services', 'Catálogo', <ICONS.Activity />)}
          {renderSidebarItem('settings', 'Perfil Clínica', <ICONS.Settings />)}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10">
          <Button variant="outline" fullWidth className="text-white border-white/20 mb-4 font-bold text-xs rounded-2xl py-4" onClick={onOpenPortal}>Portal de Reservas</Button>
          <Button variant="primary" fullWidth className="bg-white/10 border-none text-white font-bold text-xs rounded-2xl py-4" onClick={onLogout}>Cerrar Sesión</Button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-auto bg-[#f8fafc]">
        <header className="flex justify-between items-center mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl font-ubuntu-bold text-gray-900 tracking-tight capitalize">
              {activeTab === 'overview' && 'Panel de Control'}
              {activeTab === 'appointments' && 'Gestión de Citas'}
              {activeTab === 'history' && 'Historial Clínico'}
              {activeTab === 'professionals' && 'Médicos y Especialistas'}
              {activeTab === 'treatments' && 'Protocolos de Tratamiento'}
              {activeTab === 'sedes' && 'Gestión de Sedes'}
              {activeTab === 'services' && 'Servicios Médicos'}
              {activeTab === 'settings' && 'Personalización'}
            </h1>
            <p className="text-gray-400 text-[10px] uppercase font-bold mt-1 tracking-widest">{PLATFORM_NAME} Clinical ERP</p>
          </div>
          <div className="flex gap-4">
             {activeTab === 'appointments' && (
              <div className="bg-gray-100 p-1 rounded-2xl flex border border-gray-200">
                <button onClick={() => setViewMode('calendar')} className={`p-2 px-5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-brand-teal shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><ICONS.Calendar /> Calendario</button>
                <button onClick={() => setViewMode('kanban')} className={`p-2 px-5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white text-brand-teal shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><ICONS.Layout /> Kanban</button>
                <button onClick={() => setViewMode('list')} className={`p-2 px-5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-brand-teal shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><ICONS.List /> Lista</button>
              </div>
            )}
             {(activeTab === 'overview' || activeTab === 'appointments') && (
               <Button size="sm" className="gap-2 rounded-2xl px-6" onClick={() => { setSelectedAppointment(null); setPreselectedDate(''); setIsModalOpen(true); }}><ICONS.Plus /> Nueva Cita</Button>
             )}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
            <Card className="p-8 border-l-4 border-brand-teal shadow-lg hover:translate-y-[-4px] transition-all"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Citas Hoy</div><div className="text-4xl font-ubuntu-bold text-gray-900">{appointments.length}</div></Card>
            <Card className="p-8 border-l-4 border-brand-purple shadow-lg hover:translate-y-[-4px] transition-all"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pacientes</div><div className="text-4xl font-ubuntu-bold text-gray-900">{patients.length}</div></Card>
            <Card className="p-8 border-l-4 border-blue-500 shadow-lg hover:translate-y-[-4px] transition-all"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Confirmadas</div><div className="text-4xl font-ubuntu-bold text-gray-900">{appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length}</div></Card>
            <Card className="p-8 border-l-4 border-amber-500 shadow-lg hover:translate-y-[-4px] transition-all"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pendientes</div><div className="text-4xl font-ubuntu-bold text-gray-900">{appointments.filter(a => a.status === AppointmentStatus.PENDING).length}</div></Card>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="space-y-6 animate-fade-in">
             {viewMode === 'kanban' && <KanbanView />}
             {viewMode === 'calendar' && (
                <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-gray-100">
                  <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                    <h4 className="text-3xl font-ubuntu-bold text-gray-900 capitalize">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h4>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-3"><ICONS.ArrowLeft /></Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-[10px] uppercase font-bold px-6 rounded-xl">Hoy</Button>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-3 rotate-180"><ICONS.ArrowLeft /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 bg-gray-50/50 text-center py-5 border-b border-gray-50">
                    {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => <div key={d} className="text-[10px] font-ubuntu-bold text-gray-400 uppercase tracking-widest">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 auto-rows-[140px]">
                    {Array.from({ length: 42 }).map((_, idx) => {
                      const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), idx - startDay + 1);
                      const dateStr = date.toISOString().split('T')[0];
                      const dayApps = appointments.filter(a => a.date === dateStr);
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                      return (
                        <div key={idx} onClick={() => { setPreselectedDate(dateStr); setSelectedAppointment(null); setIsModalOpen(true); }} className={`p-3 border-r border-b border-gray-50 relative group hover:bg-brand-teal/[0.02] transition-colors cursor-pointer ${!isCurrentMonth ? 'bg-gray-50/20 opacity-20' : ''}`}>
                          <div className={`text-[11px] font-ubuntu-bold mb-2 w-7 h-7 flex items-center justify-center rounded-xl ${isToday ? 'bg-brand-teal text-white shadow-lg' : 'text-gray-900'}`}>{date.getDate()}</div>
                          <div className="space-y-1 overflow-y-auto max-h-[90px] custom-scrollbar">
                            {dayApps.map(app => (
                              <div key={app.id} onClick={(e) => { e.stopPropagation(); setSelectedAppointment(app); setIsViewModalOpen(true); }} className={`text-[9px] font-ubuntu-bold p-2 rounded-xl truncate border shadow-sm ${app.status === AppointmentStatus.COMPLETED ? 'bg-green-50 text-green-600 border-green-100' : 'bg-brand-teal/5 text-brand-teal border-brand-teal/10'}`}>{app.time} {app.patientName}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
             )}
             {viewMode === 'list' && (
              <Card className="p-0 border-none shadow-2xl rounded-[48px] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]"><tr className="border-b border-gray-100"><th className="px-10 py-6">Paciente</th><th className="px-10 py-6">Horario</th><th className="px-10 py-6">Estado</th><th className="px-10 py-6 text-right">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {appointments.map(app => (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-10 py-6 font-ubuntu-bold text-gray-900">{app.patientName}<div className="text-[10px] text-gray-400 font-medium">{app.patientPhone}</div></td>
                        <td className="px-10 py-6 font-ubuntu-medium text-gray-600">{app.date} • {app.time}</td>
                        <td className="px-10 py-6"><Badge color={getStatusColor(app.status)}>{statusTranslations[app.status]}</Badge></td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedAppointment(app); setIsViewModalOpen(true); }}><ICONS.Eye /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedAppointment(app); setIsModalOpen(true); }} className="text-brand-teal"><ICONS.Edit /></Button>
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

        {/* MODAL CITA */}
        <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedAppointment(null); }} title={selectedAppointment ? 'Editar Cita' : 'Nueva Cita'}>
          <form onSubmit={handleCreateOrEdit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4"><Input name="patientName" label="Nombre Paciente" defaultValue={selectedAppointment?.patientName} required /><Input name="patientPhone" label="WhatsApp" defaultValue={selectedAppointment?.patientPhone} required /></div>
            <div className="grid grid-cols-2 gap-4"><Input name="date" type="date" label="Fecha" defaultValue={selectedAppointment?.date || preselectedDate} required /><Input name="time" type="time" label="Hora" defaultValue={selectedAppointment?.time} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><label className="text-sm font-bold text-gray-700">Servicio Clínico</label><select name="serviceId" className="px-4 py-3.5 border rounded-2xl outline-none text-sm font-medium" defaultValue={selectedAppointment?.serviceId}>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div className="flex flex-col gap-2"><label className="text-sm font-bold text-gray-700">Estado Cita</label><select name="status" className="px-4 py-3.5 border rounded-2xl outline-none text-sm font-medium" defaultValue={selectedAppointment?.status || AppointmentStatus.PENDING}>{Object.values(AppointmentStatus).map(st => <option key={st} value={st}>{statusTranslations[st]}</option>)}</select></div>
            </div>
            <Button fullWidth size="lg" className="rounded-2xl py-5 shadow-2xl">Guardar en Agenda</Button>
          </form>
        </Modal>

        {/* MODAL CLINICO */}
        <Modal isOpen={isCompletionModalOpen} onClose={() => setIsCompletionModalOpen(false)} title="Finalizar Consulta Médica">
          <form onSubmit={handleFinishConsultation} className="space-y-8">
            <div className="bg-brand-teal/5 p-8 rounded-[40px] border border-brand-teal/10">
              <label className="text-sm font-bold text-brand-navy mb-3 block">Diagnóstico y Evolución Clínica</label>
              <textarea name="clinicalNotes" required className="w-full px-6 py-5 border border-gray-100 rounded-3xl min-h-[140px] outline-none text-sm font-medium shadow-inner" placeholder="Escriba los hallazgos y el progreso del paciente..."></textarea>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 block ml-1">Receta / Plan de Medicación</label>
              {[1, 2].map(i => (
                <div key={i} className="grid grid-cols-2 gap-4">
                  <Input name="medName" placeholder={`Medicamento ${i}`} />
                  <Input name="medInst" placeholder="Indicaciones de toma" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Vincular a Protocolo</label>
                <select name="treatmentId" className="px-5 py-4 border rounded-2xl bg-white outline-none text-sm font-medium">
                  <option value="">Ninguno (Consulta única)</option>
                  {treatments.map(t => <option key={t.id} value={t.id}>{t.name} ({t.sessions} ses.)</option>)}
                </select>
              </div>
              <Input name="sessionNumber" type="number" label="Nº de Sesión Actual" placeholder="Ej: 1" />
              <Input name="nextSession" type="date" label="Programar Seguimiento" />
            </div>
            <Button fullWidth size="lg" className="rounded-2xl py-5 shadow-2xl">Finalizar y Guardar Registro</Button>
          </form>
        </Modal>

        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalle de la Cita">
          {selectedAppointment && (
            <div className="space-y-8">
              <div className="flex items-center gap-6 p-8 bg-gray-50 rounded-[40px]">
                <div className="w-20 h-20 bg-brand-teal text-white rounded-3xl flex items-center justify-center font-bold text-3xl uppercase shadow-xl">{selectedAppointment.patientName.charAt(0)}</div>
                <div>
                  <h4 className="text-2xl font-ubuntu-bold text-gray-900">{selectedAppointment.patientName}</h4>
                  <Badge color={getStatusColor(selectedAppointment.status)}>{statusTranslations[selectedAppointment.status]}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 text-sm px-4">
                <div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">WhatsApp de Contacto</div><div className="font-ubuntu-bold text-gray-800 text-lg">{selectedAppointment.patientPhone}</div></div>
                <div><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Horario Reservado</div><div className="font-ubuntu-bold text-gray-800 text-lg">{selectedAppointment.date} • {selectedAppointment.time}</div></div>
                <div className="col-span-2"><div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sede / Servicio</div><div className="font-ubuntu-medium text-brand-teal">{sedes.find(s => s.id === selectedAppointment.sedeId)?.name} — {services.find(s => s.id === selectedAppointment.serviceId)?.name}</div></div>
              </div>
              <div className="pt-6 border-t flex justify-end gap-3">
                 <Button variant="outline" onClick={() => { setIsViewModalOpen(false); setSelectedAppointment(selectedAppointment); setIsModalOpen(true); }} className="gap-2 rounded-xl"><ICONS.Edit /> Editar</Button>
                 <Button onClick={() => setIsViewModalOpen(false)} className="rounded-xl">Cerrar</Button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};
