
import React, { useState, useEffect } from 'react';
import { BookingPortal } from './views/BookingPortal';
import { AdminDashboard } from './views/AdminDashboard';
import { Login } from './views/Login';
import { Appointment, Sede, Service, Company, Treatment, Professional, AppointmentStatus, UserRole } from './types';
import { INITIAL_SEDES, INITIAL_SERVICES, INITIAL_COMPANY, INITIAL_TREATMENTS, INITIAL_PROFESSIONALS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'login' | 'admin' | 'booking'>('login');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.ADMIN);
  const [company, setCompany] = useState<Company>(INITIAL_COMPANY);
  const [sedes, setSedes] = useState<Sede[]>(INITIAL_SEDES);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [treatments, setTreatments] = useState<Treatment[]>(INITIAL_TREATMENTS);
  const [professionals, setProfessionals] = useState<Professional[]>(INITIAL_PROFESSIONALS);
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'demo-1',
      patientName: 'Roberto Gomez',
      patientEmail: 'roberto@email.com',
      patientPhone: '987654321',
      serviceId: 's1',
      sedeId: 'sd1',
      professionalId: 'p1',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      status: AppointmentStatus.CONFIRMED,
      bookingCode: 'RGB100'
    },
    {
      id: 'demo-2',
      patientName: 'Ana Maria Beltran',
      patientEmail: 'ana@email.com',
      patientPhone: '955443322',
      serviceId: 's2',
      sedeId: 'sd2',
      professionalId: 'p2',
      date: new Date().toISOString().split('T')[0],
      time: '11:30',
      status: AppointmentStatus.PENDING,
      bookingCode: 'AMB200'
    }
  ]);

  const [notification, setNotification] = useState<{show: boolean, msg: string}>({show: false, msg: ''});

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Audio error or blocked'));
    } catch (e) {
      console.log('Audio playback prevented');
    }
  };

  const handleLogin = (role: UserRole) => {
    setCurrentUserRole(role);
    setView('admin');
  };

  const handleLogout = () => {
    setView('login');
  };

  const handleNewAppointment = (newApp: Appointment) => {
    setAppointments(prev => [newApp, ...prev]);
    playNotificationSound();
    setNotification({show: true, msg: `Nueva reservaBee: ${newApp.patientName.split(' ')[0]}`});
    setTimeout(() => setNotification({show: false, msg: ''}), 6000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FDFDFD]">
      {/* Alerta Visual Bee Técnica */}
      {notification.show && (
        <div className="fixed top-10 right-10 z-[1000] animate-fade-in pointer-events-auto">
          <div className="bg-brand-navy text-white px-8 py-5 rounded-xl shadow-2xl border border-white/10 flex items-center gap-5 backdrop-blur-2xl ring-4 ring-brand-teal/5">
            <div className="w-12 h-12 bg-brand-teal rounded-lg flex items-center justify-center animate-bounce shadow-xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-brand-teal uppercase tracking-[0.3em] mb-1">Update Agenda</span>
               <span className="text-sm font-ubuntu-bold tracking-tight">{notification.msg}</span>
            </div>
            <button onClick={() => setNotification({show: false, msg: ''})} className="ml-4 p-2 hover:bg-white/10 rounded transition-all">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <main>
        {view === 'login' && (
          <Login onLogin={handleLogin} />
        )}

        {view === 'booking' && (
          <div className="relative">
            <button 
              onClick={() => setView('admin')}
              className="fixed top-8 left-8 z-[100] bg-white shadow-xl px-8 py-4 rounded-lg text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 border border-gray-100 hover:bg-brand-teal hover:text-white transition-all transform active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              SISTEMA BEE
            </button>
            <BookingPortal 
              company={company} 
              sedes={sedes} 
              services={services} 
              onSuccess={handleNewAppointment} 
            />
          </div>
        )}

        {view === 'admin' && (
          <AdminDashboard 
            userRole={currentUserRole}
            company={company}
            appointments={appointments} 
            sedes={sedes}
            services={services}
            treatments={treatments}
            professionals={professionals}
            setCompany={setCompany}
            setAppointments={setAppointments} 
            setSedes={setSedes}
            setServices={setServices}
            setTreatments={setTreatments}
            setProfessionals={setProfessionals}
            onLogout={handleLogout}
            onOpenPortal={() => setView('booking')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
