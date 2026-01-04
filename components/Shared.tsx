
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-ubuntu-bold transition-all duration-300 rounded-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 whitespace-nowrap";
  
  const variants = {
    primary: "bg-brand-teal text-white hover:bg-[#007175] shadow-lg shadow-brand-teal/20",
    secondary: "bg-brand-navy text-white hover:bg-opacity-90 shadow-lg shadow-brand-navy/20",
    outline: "border-2 border-brand-teal text-brand-teal hover:bg-brand-teal/5",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100"
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-white rounded-[1.5rem] shadow-sm border border-gray-100 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-xl hover:translate-y-[-4px]' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: React.ReactNode }> = ({ label, icon, className = '', ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] font-ubuntu-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>}
    <div className="relative group">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors">
          {icon}
        </div>
      )}
      <input 
        className={`w-full ${icon ? 'pl-12' : 'px-5'} py-4 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-brand-teal/10 focus:border-brand-teal focus:bg-white outline-none transition-all placeholder:text-gray-300 font-ubuntu-medium text-sm ${className}`}
        {...props} 
      />
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, color?: string, className?: string }> = ({ children, color = 'teal', className = '' }) => {
  const colors: Record<string, string> = {
    teal: "bg-brand-teal/10 text-brand-teal border border-brand-teal/20",
    navy: "bg-brand-navy/10 text-brand-navy border border-brand-navy/20",
    red: "bg-red-50 text-red-500 border border-red-100",
    amber: "bg-amber-50 text-amber-500 border border-amber-100",
    purple: "bg-brand-purple/10 text-brand-purple border border-brand-purple/20",
    gray: "bg-gray-100 text-gray-500 border border-gray-200",
    green: "bg-green-50 text-green-500 border border-green-100",
  };
  return (
    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-ubuntu-bold uppercase tracking-widest inline-flex items-center gap-1.5 ${colors[color] || colors.teal} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current`}></span>
      {children}
    </span>
  );
};

export const Modal: React.FC<{ 
  isOpen: boolean, 
  onClose: () => void, 
  title: string, 
  children: React.ReactNode,
  footer?: React.ReactNode
}> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10 font-ubuntu">
      <div className="absolute inset-0 bg-brand-navy/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[95vh] border border-white/20">
        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h2 className="text-2xl font-ubuntu-bold text-gray-900 tracking-tight uppercase">{title}</h2>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="px-10 py-6 bg-gray-50 flex justify-end gap-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
