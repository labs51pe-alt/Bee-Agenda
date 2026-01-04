
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f4f7fa] font-ubuntu">
      <div className="w-full max-w-[950px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[580px] animate-fade-in border border-gray-200">
        
        {/* Left Panel: Branding */}
        <div className="lg:w-1/2 brand-gradient p-16 text-white flex flex-col justify-between relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
             <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center mb-12 border border-white/20 shadow-2xl">
              <div className="flex items-end gap-1.5">
                <div className="w-1.5 h-4 bg-white rounded-sm"></div>
                <div className="w-1.5 h-7 bg-white rounded-sm"></div>
                <div className="w-1.5 h-5 bg-white rounded-sm"></div>
              </div>
            </div>
            
            <h1 className="text-4xl font-black tracking-tighter mb-5 uppercase leading-none">Bee Engine</h1>
            <p className="text-white/60 text-lg max-w-xs font-ubuntu-medium leading-relaxed">
              Plataforma de gestión clínica de alto rendimiento.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-lg flex items-center gap-5 hover:bg-white/10 transition-all cursor-default">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <ICONS.CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="font-ubuntu-bold text-sm tracking-tight uppercase">Seguridad Bee</div>
                <div className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em] mt-1">Encriptación 256-bit</div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-lg flex items-center gap-5 hover:bg-white/10 transition-all cursor-default">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                <ICONS.Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="font-ubuntu-bold text-sm tracking-tight uppercase">Bee Analytics</div>
                <div className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em] mt-1">Métricas en Tiempo Real</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="lg:w-1/2 p-16 lg:p-24 bg-white flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tighter leading-none">Acceso</h2>
            <p className="text-gray-400 font-black text-[11px] mb-12 uppercase tracking-[0.4em] opacity-80">Bee Clinical ERP</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Clave Maestra</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Escriba su clave de acceso" 
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-lg focus:ring-4 focus:ring-brand-teal/5 focus:border-brand-teal outline-none transition-all font-ubuntu-bold text-gray-800 placeholder:text-gray-200 tracking-widest text-sm"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-[11px] font-black text-center animate-pulse uppercase tracking-[0.2em]">Acceso denegado Beech</p>}

              <Button 
                fullWidth 
                size="lg" 
                className="rounded-xl py-5 shadow-2xl font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 group border-none"
              >
                ENTRAR BEE
                <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </Button>
            </form>

            <div className="mt-16 pt-10 border-t border-gray-50 flex flex-col items-center gap-5">
              <button 
                onClick={() => setPassword('admin123')}
                className="text-gray-300 font-black text-[10px] flex items-center gap-3 hover:text-brand-teal transition-all uppercase tracking-[0.3em]"
              >
                <ICONS.Users className="w-4 h-4" /> Admin Access
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.4em]">
          © 2025 BEE ERP · BY <span className="text-brand-teal">GAORSYSTEM</span>
        </p>
      </div>
    </div>
  );
};
