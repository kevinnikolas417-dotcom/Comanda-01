import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ShieldCheck, QrCode, Utensils, ArrowLeft, ExternalLink, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PublicGuide() {
  const testTables = [
    { id: 't1', number: 1, token: 'token-mesa-1' },
    { id: 't2', number: 2, token: 'token-mesa-2' }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-2xl">
            <BookOpen size={18} />
            <span className="font-bold text-xs uppercase tracking-widest">Guia de Testes</span>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-xl shadow-zinc-100 overflow-hidden"
        >
          <div className="bg-zinc-900 p-10 text-white">
            <h1 className="text-3xl font-black tracking-tight mb-2">OrderFlow Enterprise</h1>
            <p className="text-zinc-400 font-medium italic">Ambiente de Demonstração e Validação</p>
          </div>

          <div className="p-10 space-y-10">
            {/* Seção Admin */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-900">
                <div className="p-2 bg-zinc-100 rounded-lg"><ShieldCheck size={20} /></div>
                <h3 className="font-bold text-lg uppercase tracking-tight">Acesso Administrativo</h3>
              </div>
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Usuário:</span>
                  <code className="bg-zinc-200 px-2 py-1 rounded font-bold">admin</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Senha:</span>
                  <code className="bg-zinc-200 px-2 py-1 rounded font-bold">admin123</code>
                </div>
                <Link 
                  to="/admin-login" 
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all"
                >
                  Ir para Login Admin
                  <ExternalLink size={14} />
                </Link>
              </div>
            </section>

            {/* Seção Cliente */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-900">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><QrCode size={20} /></div>
                <h3 className="font-bold text-lg uppercase tracking-tight">Simulação de Cliente</h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                No mundo real, o cliente escaneia o QR Code físico. Para testar agora, clique nos links abaixo para "sentar" em uma mesa virtualmente:
              </p>
              <div className="grid gap-3">
                {testTables.map(t => (
                  <a 
                    key={t.id}
                    href={`/#/?tableId=${t.id}&token=${t.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-between items-center p-5 rounded-3xl border border-zinc-100 bg-zinc-50 hover:border-orange-500 hover:bg-white transition-all group"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 block">Sentar na Mesa {t.number}</span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Acesso via Link Direto</span>
                    </div>
                    <Utensils size={18} className="text-zinc-300 group-hover:text-orange-500" />
                  </a>
                ))}
              </div>
            </section>

            {/* Info Extra */}
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
              <Info className="text-blue-600 shrink-0" size={20} />
              <div className="text-xs text-blue-700 font-medium leading-relaxed">
                <strong>Sem Conta Google:</strong> Este sistema utiliza autenticação interna baseada nne funções (RBAC). 
                Você pode testar todos os fluxos de ponta a ponta sem qualquer login externo.
              </div>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest py-4">
          Gerado em Ambiente Controlado • AI Studio Build
        </p>
      </div>
    </div>
  );
}
