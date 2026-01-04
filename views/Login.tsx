
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
      <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[550px] animate-fade-in border border-gray-100">
        
        {/* Left Panel: Branding */}
        <div className="lg:w-1/2 brand-gradient p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-10 border border-white/20 shadow-xl">
              <div className="flex items-end gap-1">
                <div className="w-1 h-3 bg-white rounded-full"></div>
                <div className="w-1 h-6 bg-white rounded-full"></div>
                <div className="w-1 h-4 bg-white rounded-full"></div>
              </div>
            </div>
            
            <h1 className="text-4xl font-ubuntu-bold tracking-tighter mb-4 uppercase">Bee Clinical</h1>
            <p className="text-white/60 text-base max-w-xs font-ubuntu-regular leading-relaxed">
              Gestión inteligente y centralizada para tu consultorio especializado.
            </p>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-all cursor-default">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <ICONS.MapPin />
              </div>
              <div>
                <div className="font-ubuntu-bold text-xs tracking-tight uppercase">Multi-Sede</div>
                <div className="text-white/40 text-[9px] uppercase font-ubuntu-medium tracking-[0.2em] mt-0.5">Control global Bee</div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-all cursor-default">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <ICONS.CheckCircle />
              </div>
              <div>
                <div className="font-ubuntu-bold text-xs tracking-tight uppercase">Seguridad HIPAA</div>
                <div className="text-white/40 text-[9px] uppercase font-ubuntu-medium tracking-[0.2em] mt-0.5">Encriptación nivel bancario</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="lg:w-1/2 p-12 lg:p-16 bg-white flex flex-col justify-center relative">
          <div className="max-w-xs mx-auto w-full">
            <h2 className="text-3xl font-ubuntu-bold text-gray-900 mb-2 uppercase tracking-tight">Bienvenido</h2>
            <p className="text-gray-400 font-ubuntu-regular text-xs mb-10 uppercase tracking-widest font-bold">Acceso Sistema Bee</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-ubuntu-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Clave de Acceso</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM12 7l.41 1.59L14 9l-1.59.41L12 11l-.41-1.59L10 9l1.59-.41L12 7z"/></svg>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Escriba su clave" 
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                    className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-teal/10 focus:border-brand-teal outline-none transition-all font-ubuntu-medium text-gray-700 placeholder:text-gray-200 shadow-sm"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-[10px] font-ubuntu-bold text-center animate-pulse uppercase tracking-widest">Credenciales inválidas</p>}

              <Button 
                fullWidth 
                size="lg" 
                className="rounded-xl py-4 shadow-xl font-ubuntu-bold flex items-center justify-center gap-3 group border-none"
              >
                Entrar al Sistema
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </Button>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col items-center gap-3">
              <button 
                onClick={() => setPassword('dev123')}
                className="text-gray-400 font-ubuntu-medium text-[10px] flex items-center gap-2 hover:text-brand-teal transition-colors uppercase tracking-widest"
              >
                <ICONS.Users className="w-3.5 h-3.5" /> Administrador
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center space-y-1">
        <p className="text-[9px] text-gray-400 font-ubuntu-medium uppercase tracking-[0.25em]">
          © 2025 Bee ERP. Desarrollado por <span className="text-brand-teal font-ubuntu-bold">GaorSystem</span>
        </p>
      </div>
    </div>
  );
};
