import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminLoginPageProps {
  onLogin: (name: string) => void;
}

export function AdminLoginPage({ onLogin }: AdminLoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const adminUser = (import.meta as any).env.VITE_ADMIN_USER || 'admin';
    const adminPass = (import.meta as any).env.VITE_ADMIN_PASS || 'admin123';

    if (username === adminUser && password === adminPass) {
      onLogin('Administrador');
      navigate('/admin');
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-zinc-200 overflow-hidden"
      >
        <div className="bg-zinc-900 p-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full -mr-16 -mt-16 opacity-20 blur-2xl" />
          <ShieldCheck size={48} className="mx-auto mb-4 text-orange-500" />
          <h1 className="text-2xl font-black tracking-tight">Painel Operacional</h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium">Acesso Restrito a Funcionários</p>
        </div>

        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold text-center border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Usuário</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                  placeholder="Seu login"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-100"
          >
            Entrar no Sistema
            <ArrowRight size={18} />
          </button>

          <p className="text-center text-[10px] text-zinc-300 font-bold uppercase tracking-wider">
            Versão Enterprise 2.4.0
          </p>
        </form>
      </motion.div>
    </div>
  );
}
