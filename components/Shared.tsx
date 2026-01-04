
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
  const baseStyles = "inline-flex items-center justify-center font-ubuntu-medium transition-all duration-200 rounded-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] whitespace-nowrap border";
  
  const variants = {
    primary: "bg-brand-teal text-white hover:bg-[#007175] border-brand-teal shadow-sm",
    secondary: "bg-brand-navy text-white hover:bg-opacity-90 border-brand-navy shadow-sm",
    outline: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700 border-red-700 shadow-sm",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 border-transparent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
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
    className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-brand-teal/30' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: React.ReactNode }> = ({ label, icon, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5 w-full text-left">
    {label && <label className="text-[11px] font-ubuntu-bold text-gray-500 uppercase tracking-wider ml-0.5">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input 
        className={`w-full ${icon ? 'pl-10' : 'px-3'} py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-teal focus:border-brand-teal outline-none transition-all placeholder:text-gray-400 font-ubuntu-regular text-sm ${className}`}
        {...props} 
      />
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, color?: string, className?: string }> = ({ children, color = 'teal', className = '' }) => {
  const colors: Record<string, string> = {
    teal: "bg-teal-50 text-teal-700 border border-teal-200",
    navy: "bg-slate-50 text-slate-700 border border-slate-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    gray: "bg-gray-50 text-gray-600 border border-gray-200",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-ubuntu-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${colors[color] || colors.teal} ${className}`}>
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-ubuntu">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh] border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-base font-ubuntu-bold text-gray-900 tracking-tight uppercase">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
