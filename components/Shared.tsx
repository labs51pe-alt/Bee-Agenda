
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
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 rounded-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";
  
  const variants = {
    primary: "bg-brand-teal text-white hover:bg-[#005a5d] shadow-lg shadow-brand-teal/20",
    secondary: "bg-brand-navy text-white hover:bg-opacity-90",
    outline: "border-2 border-brand-teal text-brand-teal hover:bg-brand-teal/5",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
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

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-4xl shadow-2xl overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: React.ReactNode }> = ({ label, icon, className = '', ...props }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-sm font-ubuntu-bold text-gray-700 ml-1">{label}</label>}
    <div className="relative group">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors">
          {icon}
        </div>
      )}
      <input 
        className={`w-full ${icon ? 'pl-12' : 'px-4'} py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all placeholder:text-gray-300 ${className}`}
        {...props} 
      />
    </div>
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, color?: string }> = ({ children, color = 'teal' }) => {
  const colors: Record<string, string> = {
    teal: "bg-[#017E841a] text-[#017E84]",
    navy: "bg-[#0d0d4b1a] text-[#0d0d4b]",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-[#714B671a] text-[#714B67]",
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-ubuntu-bold uppercase tracking-wider ${colors[color] || colors.teal}`}>
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
      <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-2xl font-ubuntu-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="px-10 py-6 bg-gray-50 flex justify-end gap-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
