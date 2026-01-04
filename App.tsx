
import React, { useState } from 'react';
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
      date: '2025-05-20',
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
      date: '2025-05-20',
      time: '11:30',
      status: AppointmentStatus.PENDING,
      bookingCode: 'AMB200'
    }
  ]);

  const handleLogin = (role: UserRole) => {
    setCurrentUserRole(role);
    setView('admin');
  };

  const handleLogout = () => {
    setView('login');
  };

  const handleNewAppointment = (newApp: Appointment) => {
    setAppointments(prev => [newApp, ...prev]);
  };

  return (
    <div className="min-h-screen">
      <main>
        {view === 'login' && (
          <Login onLogin={handleLogin} />
        )}

        {view === 'booking' && (
          <div className="relative">
            <button 
              onClick={() => setView('admin')}
              className="fixed top-4 left-4 z-[100] bg-white shadow-xl px-4 py-2 rounded-xl text-[10px] font-ubuntu-bold uppercase tracking-widest flex items-center gap-2 border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              ← Volver al Sistema Bee
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
