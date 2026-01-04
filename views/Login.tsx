
import React, { useState } from 'react';
import { Button, Input } from '../components/Shared';
import { ICONS, PLATFORM_NAME } from '../constants';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'dev123') {
      onLogin(UserRole.SUPER_ADMIN);
    } else if (password === 'admin123') {
      onLogin(UserRole.ADMIN);
    } else if (password === 'recep123') {
      onLogin(UserRole.RECEPCIONIST);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-10 bg-[#f0f4f8] font-ubuntu font-ubuntu-light">
      <div className="w-full max-w-[1000px] bg-white rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col lg:flex-row min-h-[600px] animate-fade-in">
        
        {/* Left Panel: Branding & Features */}
        <div className="lg:w-1/2 brand-gradient p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 border border-white/20 shadow-xl">
              <div className="flex items-end gap-1">
                <div className="w-1.5 h-4 bg-white rounded-full"></div>
                <div className="w-1.5 h-7 bg-white rounded-full"></div>
                <div className="w-1.5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
            
            <h1 className="text-5xl font-ubuntu-bold tracking-tighter mb-4">Bee</h1>
            <p className="text-white/70 text-lg max-w-xs font-ubuntu-regular leading-relaxed">
              Gestión inteligente y centralizada para tu consultorio médico.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition-all cursor-default">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <ICONS.MapPin />
              </div>
              <div>
                <div className="font-ubuntu-bold text-sm tracking-tight">Multi-Sede</div>
                <div className="text-white/50 text-[10px] uppercase font-ubuntu-medium tracking-widest mt-0.5">Gestión de datos centralizada</div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-3xl flex items-center gap-5 hover:bg-white/10 transition-all cursor-default">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <ICONS.CheckCircle />
              </div>
              <div>
                <div className="font-ubuntu-bold text-sm tracking-tight">Seguridad Avanzada</div>
                <div className="text-white/50 text-[10px] uppercase font-ubuntu-medium tracking-widest mt-0.5">Control de acceso por roles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="lg:w-1/2 p-12 lg:p-20 bg-white flex flex-col justify-center relative">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-4xl font-ubuntu-bold text-gray-900 mb-2">Bienvenido</h2>
            <p className="text-gray-400 font-ubuntu-regular text-sm mb-12">Accede a tu panel de control personalizado.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-ubuntu-bold text-gray-700 uppercase tracking-widest ml-1">Clave de Acceso</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM12 7l.41 1.59L14 9l-1.59.41L12 11l-.41-1.59L10 9l1.59-.41L12 7z"/></svg>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Contraseña" 
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                    className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-ubuntu-medium text-gray-700 placeholder:text-gray-200 shadow-sm"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs font-ubuntu-bold text-center animate-pulse">Clave incorrecta. Intente admin123 o recep123.</p>}

              <Button 
                fullWidth 
                size="lg" 
                className="rounded-2xl py-5 shadow-2xl shadow-brand-teal/20 font-ubuntu-bold flex items-center justify-center gap-3 group"
              >
                Ingresar al Dashboard
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </Button>
            </form>

            <div className="mt-16 pt-10 border-t border-gray-50 flex flex-col items-center gap-4">
              <button 
                onClick={() => setPassword('dev123')}
                className="text-gray-400 font-ubuntu-medium text-xs flex items-center gap-2 hover:text-brand-teal transition-colors group"
              >
                <ICONS.Users />
                <span className="group-hover:underline underline-offset-4">Soy Administrador</span>
              </button>
              <button 
                onClick={() => setPassword('recep123')}
                className="text-gray-300 font-ubuntu-regular text-[10px] hover:text-brand-teal transition-colors"
              >
                Acceso Recepción
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer credits */}
      <div className="mt-10 text-center space-y-1">
        <p className="text-[10px] text-gray-400 font-ubuntu-medium uppercase tracking-[0.2em]">
          © 2025 {PLATFORM_NAME}. Secure Connection via Cloud Bee API.
        </p>
        <p className="text-[10px] text-gray-300 font-ubuntu-regular">
          Desarrollado por <span className="text-brand-teal font-ubuntu-bold">GaorSystem Perú</span>
        </p>
      </div>
    </div>
  );
};
