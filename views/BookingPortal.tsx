
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
    <div className="brand-gradient w-full lg:w-[45%] p-10 text-white flex flex-col justify-between relative overflow-hidden min-h-[400px]">
      <div className="absolute inset-0 z-0">
        <img 
          src={company.backgroundImage || "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200"} 
          alt="Clinic Background" 
          className="w-full h-full object-cover opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-transparent opacity-80"></div>
      </div>
      
      <div className="relative z-10">
        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center mb-8 border border-white/30 shadow-lg overflow-hidden">
          {company.logo ? (
            <img src={company.logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
             <div className="flex items-end gap-1">
                <div className="w-1 h-3 bg-white rounded-full"></div>
                <div className="w-1 h-5 bg-white rounded-full"></div>
                <div className="w-1 h-2 bg-white rounded-full"></div>
             </div>
          )}
        </div>
        <h1 className="text-3xl font-black tracking-tighter mb-4 leading-none uppercase">{company.name}</h1>
        <p className="text-base text-white/80 leading-relaxed font-medium max-w-xs">
          Gestione su atención especializada de forma rápida y segura.
        </p>
      </div>

      <div className="relative z-10">
        <Button 
          variant="primary" 
          className="bg-[#25D366] hover:bg-[#128C7E] border-none shadow-xl gap-3 w-full py-4 rounded-lg text-sm font-black uppercase tracking-widest"
          onClick={() => redirectToWhatsApp()}
        >
          Soporte WhatsApp
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-10 font-ubuntu">
      <Card className="flex flex-col lg:flex-row w-full max-w-5xl min-h-[700px] animate-fade-in shadow-2xl relative rounded-xl overflow-hidden">
        <LeftBrandPanel />
        
        <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center bg-white relative">
          {step === 0 && (
            <div className="text-center space-y-10 animate-fade-in">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-tight uppercase">Portal de Citas</h2>
                <p className="text-gray-400 text-lg max-w-md mx-auto font-medium">Inicie su proceso de reservaBee seleccionando una de nuestras sedes.</p>
              </div>
              <Button size="lg" className="rounded-xl px-12 py-5 text-base tracking-[0.2em] uppercase font-black" onClick={() => setStep(1)}>
                AGENDAR BEE
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-10 animate-fade-in">
              <div className="space-y-3">
                <Badge color="teal" className="tracking-[0.3em] font-black">LOCALIZACIÓN</Badge>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Seleccione su Sede</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {sedes.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => { setSelectedSede(s.id); setStep(2); }}
                    className="p-6 text-left border border-gray-100 rounded-xl transition-all hover:border-brand-teal hover:bg-gray-50 flex items-center justify-between group bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-brand-teal/5 text-brand-teal rounded-lg group-hover:bg-brand-teal group-hover:text-white transition-all shadow-inner">
                        <ICONS.MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="font-ubuntu-bold text-gray-800 text-lg block uppercase tracking-tight">{s.name}</span>
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">{s.address}</span>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200 group-hover:text-brand-teal transition-all transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-fade-in">
              <button onClick={() => setStep(1)} className="text-brand-teal font-black flex items-center gap-3 hover:translate-x-[-4px] transition-transform uppercase text-[11px] tracking-[0.3em]">
                <ICONS.ArrowLeft className="w-4 h-4" /> VOLVER
              </button>
              <div className="space-y-3">
                <Badge color="teal" className="tracking-[0.3em] font-black">ESPECIALIDAD</Badge>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Tipo de Servicio</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {services.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => { setSelectedService(s.id); setStep(3); }}
                    className="p-6 flex items-center justify-between border border-gray-100 rounded-xl transition-all hover:border-brand-teal hover:bg-gray-50 group bg-white shadow-sm"
                  >
                    <div className="text-left">
                      <div className="font-ubuntu-bold text-gray-900 text-lg group-hover:text-brand-teal transition-colors uppercase tracking-tight">{s.name}</div>
                      <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em] mt-1">{s.duration} min de atención dedicada</div>
                    </div>
                    <ICONS.CheckCircle className="text-gray-100 group-hover:text-brand-teal transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-fade-in">
              <button onClick={() => setStep(2)} className="text-brand-teal font-black flex items-center gap-3 hover:translate-x-[-4px] transition-transform uppercase text-[11px] tracking-[0.3em]">
                <ICONS.ArrowLeft className="w-4 h-4" /> VOLVER
              </button>
              <div className="space-y-3">
                <Badge color="teal" className="tracking-[0.3em] font-black">DATOS BEE</Badge>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Confirmación Final</h2>
              </div>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Nombre y Apellidos" placeholder="Juan Pérez" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} icon={<ICONS.Users className="w-4 h-4" />} />
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp de Contacto</label>
                    <div className="flex gap-3">
                      <select className="px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[11px] font-black outline-none focus:border-brand-teal transition-all" value={formData.countryCode} onChange={e => setFormData({...formData, countryCode: e.target.value})}>
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                      </select>
                      <input type="tel" placeholder="900 000 000" className="flex-1 px-5 py-2.5 border border-gray-200 rounded-lg focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none font-medium text-sm transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input type="date" label="Día de la Cita" onChange={(e) => setSelectedDate(e.target.value)} icon={<ICONS.Calendar className="w-4 h-4" />} />
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HoraBee Disponible</label>
                    <select className="px-5 py-3 border border-gray-200 rounded-lg outline-none font-ubuntu-bold bg-white text-sm focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal transition-all" onChange={(e) => setSelectedTime(e.target.value)}>
                      <option value="">Selecciona hora...</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <Button fullWidth size="lg" disabled={!selectedDate || !selectedTime || !formData.name || !formData.phone} onClick={handleBooking} className="rounded-xl py-6 shadow-2xl tracking-[0.4em] uppercase font-black text-[12px] border-none">
                  CONFIRMAR BEE CITA
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-10 animate-fade-in py-10">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-lg border border-green-100">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">¡ConfirmadoBee!</h2>
                <p className="text-gray-400 text-lg max-w-sm mx-auto font-ubuntu-medium">Su atención en {company.name} ha sido agendada con éxito.</p>
              </div>
              
              <div className="py-12 border-t border-b border-gray-50 mt-10">
                 <Button onClick={() => redirectToWhatsApp(sedes.find(s => s.id === (selectedSede as string))?.phone)} className="bg-[#25D366] hover:bg-[#128C7E] py-6 px-16 rounded-xl gap-4 shadow-xl border-none tracking-[0.3em] font-black text-[12px] uppercase">
                  SOPORTE WHATSAPP
                </Button>
              </div>

              <button onClick={() => window.location.reload()} className="text-gray-300 font-black hover:text-brand-teal transition-colors text-[10px] uppercase tracking-[0.5em] mt-10">Nueva reserva</button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
