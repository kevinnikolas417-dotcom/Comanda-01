/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, QrCode, ArrowRight, ChevronRight, X, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Table } from '../types';
import { cn } from '../lib/utils';

interface SplashPageProps {
  onLogin: (name: string, tableId: string, subcomandaId: string) => void;
}

export function SplashPage({ onLogin }: SplashPageProps) {
  const [name, setName] = useState('');
  const [tableId, setTableId] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'table' | 'subcomanda'>('table');
  const [tables, setTables] = useState<Table[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/tables')
      .then(res => res.json())
      .then(data => {
        setTables(data);
        
        const params = new URLSearchParams(window.location.search);
        const urlTableId = params.get('tableId');
        const urlToken = params.get('token');
        
        if (urlTableId) {
          const table = data.find((t: Table) => t.id === urlTableId);
          if (table) {
            if (!table.isActive) {
              setError("Esta mesa foi desativada pelo administrador.");
              return;
            }
            if (urlToken && table.token !== urlToken) {
              setError("QR Code inválido ou expirado. Por favor, solicite um novo.");
              return;
            }
            setTableId(urlTableId);
            setToken(urlToken || '');
            setStep('subcomanda'); // Auto-advance to name input if scanned
          }
        }
      });
  }, []);

  const handleCreateSubcomanda = async () => {
    if (!name.trim() || !tableId) return;
    setError(null);
    
    const res = await fetch('/api/subcomandas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId, customerName: name, token })
    });
    
    if (res.ok) {
      const sub = await res.json();
      onLogin(name, tableId, sub.id);
      navigate('/menu');
    } else {
      const err = await res.json();
      setError(err.error || "Ocorreu um erro ao abrir a comanda.");
    }
  };

  const handleJoinSubcomanda = (subId: string) => {
    onLogin(name, tableId, subId);
    navigate('/menu');
  };

  const selectedTable = tables.find(t => t.id === tableId);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-100 font-sans">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "w-full bg-white rounded-[2.5rem] border border-zinc-200 p-8 space-y-8 shadow-sm transition-all duration-500 relative overflow-hidden",
          step === 'table' ? "max-w-sm" : "max-w-md"
        )}
      >
        <div className="absolute top-6 right-6">
          <Link 
            to="/admin-login" 
            className="p-3 bg-zinc-50 rounded-2xl text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-all"
            title="Acesso Admin"
          >
            <ShieldCheck size={18} />
          </Link>
        </div>
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-orange-100 rounded-2xl text-orange-600 shadow-sm shadow-orange-50">
            <Utensils size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Restaurante Pro</h1>
            <p className="text-sm text-zinc-400 font-medium">
              {step === 'table' ? 'Escolha sua mesa para começar' : `Mesa ${selectedTable?.number} — Gerenciar Subcomandas`}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold text-center border border-red-100">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!tableId ? (
            <motion.div 
              key="instructions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 text-center space-y-6"
            >
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode size={40} className="text-orange-600 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">Escaneie para Começar</h2>
                <p className="text-zinc-500 mt-2 font-medium">Use a câmera do seu celular no QR Code físico que está na sua mesa.</p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  Acesso manual bloqueado
                </div>
                
                <Link 
                  to="/guia"
                  className="inline-flex items-center gap-2 text-orange-600 font-bold text-[10px] uppercase tracking-widest hover:bg-orange-50 px-4 py-2 rounded-xl transition-all"
                >
                  <BookOpen size={14} />
                  Guia: Como testar sem Scan?
                </Link>
              </div>
            </motion.div>
          ) : step === 'subcomanda' ? (
            <motion.div 
              key="sub-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Mesa Detectada</p>
                  <p className="text-xl font-black text-zinc-900">MESA {selectedTable?.number}</p>
                </div>
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                  <CheckCircle2 size={24} />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Seu Nome</label>
                  <input 
                    autoFocus
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Quem está pedindo?"
                    className="w-full h-16 bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-6 font-bold text-lg focus:border-orange-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 block mt-4">Participar de Comanda Ativa</label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedTable?.activeSubcomandas.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => handleJoinSubcomanda(sub.id)}
                        className="p-4 rounded-2xl border border-zinc-100 bg-white hover:border-orange-500 hover:bg-orange-50/50 text-left transition-all group flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-zinc-900 block">{sub.customerName}</span>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Acumulado: R$ {sub.total.toFixed(2)}</p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-300 group-hover:text-orange-500" />
                      </button>
                    ))}
                    
                    <button 
                      onClick={handleCreateSubcomanda}
                      disabled={!name.trim()}
                      className="w-full h-16 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center gap-3 text-zinc-400 hover:border-orange-300 hover:text-orange-600 hover:bg-white transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      Abrir Nova Comanda
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setTableId(''); setToken(''); setStep('table'); }}
                className="w-full text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:text-zinc-600 transition-colors flex items-center justify-center gap-2"
              >
                <QrCode size={14} />
                Trocar de Mesa / Novo Scan
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
