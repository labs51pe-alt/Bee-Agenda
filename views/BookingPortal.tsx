
import React, { useState } from 'react';
import { ICONS, COUNTRY_CODES, CLINIC_WHATSAPP, PLATFORM_NAME } from '../constants';
import { Button, Card, Input, Badge } from '../components/Shared';
import { Appointment, AppointmentStatus, Sede, Service, Company } from '../types';

interface BookingPortalProps {
  company: Company;
  sedes: Sede[];
  services: Service[];
  onSuccess: (appointment: Appointment) => void;
}

export const BookingPortal: React.FC<BookingPortalProps> = ({ company, sedes, services, onSuccess }) => {
  const [step, setStep] = useState(0); 
  const [selectedSede, setSelectedSede] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>(services[0]?.id || 's1');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+51',
    phone: '',
    reason: '',
  });

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '15:00', '15:30', '16:00', '16:30'];

  const handleBooking = () => {
    const bookingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    onSuccess({
      id: Date.now().toString(),
      patientName: formData.name,
      patientEmail: formData.email,
      patientPhone: `${formData.countryCode} ${formData.phone}`,
      serviceId: selectedService,
      sedeId: selectedSede as string,
      professionalId: 'p-auto', 
      date: selectedDate,
      time: selectedTime,
      status: AppointmentStatus.CONFIRMED,
      notes: formData.reason,
      bookingCode
    });
    setStep(4);
  };

  const redirectToWhatsApp = (phone: string = CLINIC_WHATSAPP) => {
    const message = encodeURIComponent(`Hola, necesito ayuda con mi reserva en ${company.name}.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const LeftBrandPanel = () => (
    <div className="brand-gradient w-full lg:w-[45%] p-12 text-white flex flex-col justify-between relative overflow-hidden min-h-[400px]">
      <div className="absolute inset-0 z-0">
        <img 
          src={company.backgroundImage || "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200"} 
          alt="Clinic Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-transparent"></div>
      </div>
      
      <div className="relative z-10">
        <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-10 border border-white/30 shadow-lg overflow-hidden">
          {company.logo ? (
            <img src={company.logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
             <div className="flex items-end gap-1">
                <div className="w-1.5 h-4 bg-white rounded-full"></div>
                <div className="w-1.5 h-6 bg-white rounded-full"></div>
                <div className="w-1.5 h-3 bg-white rounded-full"></div>
             </div>
          )}
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-4 leading-none">{company.name}</h1>
        <p className="text-xl text-white/80 leading-relaxed font-medium">
          Agenda tu atención personalizada en solo unos clics.
        </p>
      </div>

      <div className="relative z-10 space-y-4">
        <Button 
          variant="primary" 
          className="bg-[#25D366] hover:bg-[#128C7E] border-none shadow-xl gap-3 w-full py-5 rounded-2xl text-lg"
          onClick={() => redirectToWhatsApp()}
        >
          <ICONS.HelpCircle /> Soporte WhatsApp
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-10 font-ubuntu">
      <Card className="flex flex-col lg:flex-row w-full max-w-6xl min-h-[750px] animate-fade-in shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative">
        <LeftBrandPanel />
        
        <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center bg-white relative overflow-hidden">
          {step === 0 && (
            <div className="text-center space-y-8 animate-fade-in relative z-10">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">Gestiona tu Salud</h2>
                <p className="text-gray-500 text-xl max-w-md mx-auto">Selecciona tu sede preferida para empezar.</p>
              </div>
              <Button size="lg" className="rounded-2xl px-12 py-6 text-xl" onClick={() => setStep(1)}>
                Empezar Reserva
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 animate-fade-in relative z-10">
              <div className="space-y-3">
                <Badge color="teal">Ubicación</Badge>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Selecciona Sede</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {sedes.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => { setSelectedSede(s.id); setStep(2); }}
                    className="p-6 text-left border border-gray-100 rounded-3xl transition-all hover:border-brand-teal hover:shadow-xl flex items-center justify-between group bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-brand-teal/5 text-brand-teal rounded-2xl group-hover:bg-brand-teal group-hover:text-white transition-all">
                        <ICONS.MapPin />
                      </div>
                      <div>
                        <span className="font-black text-gray-800 text-xl block">{s.name}</span>
                        <span className="text-sm text-gray-400 font-bold">{s.address}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-brand-teal group-hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fade-in relative z-10">
              <button onClick={() => setStep(1)} className="text-brand-teal font-black flex items-center gap-2 hover:translate-x-[-4px] transition-transform uppercase text-xs tracking-widest">
                <ICONS.ArrowLeft /> Volver
              </button>
              <div className="space-y-2">
                <Badge color="teal">Servicio</Badge>
                <h2 className="text-3xl font-black text-gray-900">¿Qué tipo de consulta buscas?</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {services.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => { setSelectedService(s.id); setStep(3); }}
                    className="p-6 flex items-center justify-between border border-gray-100 rounded-3xl transition-all hover:border-brand-teal hover:shadow-xl group bg-white"
                  >
                    <div className="text-left">
                      <div className="font-black text-gray-900 text-xl group-hover:text-brand-teal transition-colors">{s.name}</div>
                      <div className="text-xs text-gray-400 font-black uppercase tracking-wider">{s.duration} min</div>
                    </div>
                    <ICONS.CheckCircle />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fade-in relative z-10">
              <button onClick={() => setStep(2)} className="text-brand-teal font-black flex items-center gap-2 hover:translate-x-[-4px] transition-transform uppercase text-xs tracking-widest">
                <ICONS.ArrowLeft /> Volver
              </button>
              <div className="space-y-2">
                <Badge color="teal">Finalizar</Badge>
                <h2 className="text-3xl font-black text-gray-900">Datos del Paciente</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Nombre" placeholder="Nombre completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} icon={<ICONS.Users />} />
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-black text-gray-700 ml-1">WhatsApp</label>
                    <div className="flex gap-2">
                      <select className="px-3 py-3.5 border border-gray-200 rounded-2xl bg-gray-50 text-sm font-black outline-none" value={formData.countryCode} onChange={e => setFormData({...formData, countryCode: e.target.value})}>
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                      </select>
                      <input type="tel" placeholder="900 000 000" className="flex-1 px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input type="date" label="Fecha" onChange={(e) => setSelectedDate(e.target.value)} icon={<ICONS.Calendar />} />
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-black text-gray-700 ml-1">Hora</label>
                    <select className="px-4 py-3.5 border border-gray-200 rounded-2xl outline-none font-black bg-white" onChange={(e) => setSelectedTime(e.target.value)}>
                      <option value="">Selecciona...</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <Button fullWidth size="lg" disabled={!selectedDate || !selectedTime || !formData.name || !formData.phone} onClick={handleBooking} className="gap-2 rounded-2xl py-5 shadow-2xl">
                  Confirmar Cita <ICONS.CheckCircle />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-8 animate-fade-in relative z-10">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">¡Confirmado!</h2>
                <p className="text-gray-500 text-lg max-w-sm mx-auto">Tu reserva en {company.name} ha sido registrada con éxito.</p>
              </div>
              
              <div className="py-10 border-t border-b border-gray-50">
                 <Button onClick={() => redirectToWhatsApp(sedes.find(s => s.id === (selectedSede as string))?.phone)} className="bg-[#25D366] hover:bg-[#128C7E] text-xl py-6 rounded-3xl gap-3 min-w-[320px] shadow-xl">
                  WhatsApp Directo <ICONS.Activity />
                </Button>
              </div>

              <button onClick={() => window.location.reload()} className="text-gray-400 font-bold hover:text-brand-teal transition-colors text-sm uppercase tracking-widest">Nueva reserva</button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
