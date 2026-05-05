/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Package, Settings, Users, LogOut, CheckCircle2, XCircle, Clock, X, QrCode, Printer, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { Table, Subcomanda, OrderItem, Product, TableStatus } from '../types';
import { cn } from '../lib/utils';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

export function AdminView() {
  const location = useLocation();
  const { logout } = useAuth();
  
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Mapa de Mesas', icon: Receipt, path: '/admin/orders' },
    { label: 'Gestão de Mesas', icon: QrCode, path: '/admin/tables' },
    { label: 'Cardápio / CMS', icon: Package, path: '/admin/products' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-100 font-sans text-zinc-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col fixed inset-y-0">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-800">OrderFlow</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-colors",
                location.pathname === item.path ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:bg-zinc-50"
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-red-500 hover:bg-red-50 transition-colors mt-4"
          >
            <LogOut size={18} />
            <span>Sair do Painel</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="bg-zinc-900 text-white p-4 rounded-xl">
            <p className="text-xs opacity-60 mb-1">Caixa Aberto</p>
            <p className="font-mono font-bold text-lg">R$ 4.280,50</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize">
              {navItems.find(n => n.path === location.pathname)?.label || 'Visão Geral'}
            </h2>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Serviço Ativo</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-zinc-400 font-medium">5 de Maio, 2026</p>
              <p className="text-sm font-semibold">13:59:37</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-200 border border-zinc-300"></div>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/tables" element={<TableSettings />} />
            <Route path="/products" element={<ProductManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [transferItem, setTransferItem] = useState<{ itemId: string, currentSubId: string } | null>(null);
  
  const socket = useMemo(() => io(), []);

  useEffect(() => {
    fetch('/api/tables').then(res => res.json()).then(setTables);
    socket.on('tables_updated', (updatedTables) => {
      setTables(updatedTables);
      // Sync selected table if open
      if (selectedTable) {
        const found = updatedTables.find((t: any) => t.id === selectedTable.id);
        if (found) setSelectedTable(found);
        else setSelectedTable(null);
      }
    });
    return () => { socket.off('tables_updated'); };
  }, [socket, selectedTable]);

  const stats = [
    { label: 'Mesas Ocupadas', value: tables.filter(t => t.status !== TableStatus.AVAILABLE).length, color: 'bg-orange-500' },
    { label: 'Livre', value: tables.filter(t => t.status === TableStatus.AVAILABLE).length, color: 'bg-green-500' },
    { label: 'Aguardando Pagamento', value: tables.filter(t => t.status === TableStatus.WAITING_PAYMENT).length, color: 'bg-blue-500' },
  ];

  const handleReleaseSub = async (subId: string) => {
    await fetch(`/api/subcomandas/${subId}/release`, { method: 'POST' });
  };

  const handleTransfer = async (toSubcomandaId: string) => {
    if (!transferItem) return;
    await fetch(`/api/items/${transferItem.itemId}/transfer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toSubcomandaId })
    });
    setTransferItem(null);
  };

  return (
    <div className="grid grid-cols-12 auto-rows-min gap-4">
      {/* Table Occupancy */}
      <section className="col-span-8 bg-white rounded-3xl border border-zinc-200 p-6 flex flex-col shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Mapa de Ocupação</h3>
          <div className="flex gap-4 text-xs font-medium">
            {stats.map(s => (
              <span key={s.label} className="flex items-center gap-1.5">
                <i className={cn("w-2 h-2 rounded-full", s.color)}></i> 
                {s.label.split(' ')[0]} ({s.value})
              </span>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {tables.map(table => (
            <button 
              key={table.id}
              onClick={() => table.status !== TableStatus.AVAILABLE && setSelectedTable(table)}
              className={cn(
                "rounded-2xl flex flex-col items-center justify-center gap-2 p-4 transition-all h-32 border-2",
                table.status === TableStatus.AVAILABLE 
                  ? "border-zinc-100 bg-zinc-50/50 cursor-default" 
                  : table.status === TableStatus.WAITING_PAYMENT
                    ? "border-blue-500 bg-blue-50/50 hover:bg-blue-100/50 shadow-lg shadow-blue-50"
                    : "border-orange-500 bg-orange-50/50 hover:bg-orange-100/50 shadow-lg shadow-orange-50"
              )}
            >
              <span className={cn(
                "text-xs font-bold uppercase",
                table.status === TableStatus.AVAILABLE ? "text-zinc-400" : "text-zinc-900"
              )}>MESA {table.number.toString().padStart(2, '0')}</span>
              
              {table.status !== TableStatus.AVAILABLE ? (
                <div className="text-center">
                  <span className="text-2xl font-bold text-zinc-900">{table.activeSubcomandas.length}</span>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Subcomandas</p>
                </div>
              ) : (
                <span className="text-2xl font-bold text-zinc-200">LIVRE</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Selected Table Detail Modal */}
      <AnimatePresence>
        {selectedTable && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTable(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-screen w-[480px] bg-white z-50 shadow-2xl p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-bold tracking-tight">Mesa {selectedTable.number}</h3>
                  <p className="text-sm text-zinc-400 font-medium">Gerenciando {selectedTable.activeSubcomandas.length} subcomandas ativas</p>
                </div>
                <button onClick={() => setSelectedTable(null)} className="p-3 bg-zinc-100 rounded-full hover:bg-zinc-200">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {selectedTable.activeSubcomandas.map(sub => (
                  <div key={sub.id} className={cn(
                    "p-6 rounded-[2rem] border transition-all",
                    sub.status === 'open' ? "border-zinc-100 bg-white" : "border-blue-200 bg-blue-50/30"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold">{sub.customerName}</h4>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                          sub.status === 'open' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {sub.status === 'open' ? 'Em Consumo' : 'Finalizando'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Total</p>
                        <p className="text-xl font-bold text-zinc-900">R$ {sub.total.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {sub.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm group">
                          <span className="text-zinc-600 font-medium">{item.quantity}x {item.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-zinc-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                            <button 
                              onClick={() => setTransferItem({ itemId: item.id, currentSubId: sub.id })}
                              className="opacity-0 group-hover:opacity-100 p-1.5 bg-zinc-100 rounded-lg text-zinc-400 hover:text-orange-600 transition-all"
                              title="Transferir item"
                            >
                              <Users size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleReleaseSub(sub.id)}
                        className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                      >
                        {sub.status === 'open' ? 'Fechar e Receber' : 'Confirmar Pagamento'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Transfer Item Modal */}
      <AnimatePresence>
        {transferItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[60]" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-3xl p-6 z-[70] shadow-2xl">
              <h4 className="text-lg font-bold mb-4">Transferir para qual comanda?</h4>
              <div className="space-y-2">
                {selectedTable?.activeSubcomandas.filter(s => s.id !== transferItem.currentSubId).map(sub => (
                  <button 
                    key={sub.id}
                    onClick={() => handleTransfer(sub.id)}
                    className="w-full p-4 rounded-xl border border-zinc-100 hover:bg-orange-50 hover:border-orange-200 text-left font-bold transition-all"
                  >
                    {sub.customerName}
                  </button>
                ))}
                {selectedTable?.activeSubcomandas.length === 1 && (
                  <p className="text-zinc-400 text-sm text-center py-4 italic">Nenhuma outra subcomanda disponível nesta mesa.</p>
                )}
              </div>
              <button onClick={() => setTransferItem(null)} className="w-full mt-4 py-2 text-zinc-400 text-xs font-bold uppercase tracking-widest">Cancelar</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Financial Performance */}
      <section className="col-span-4 bg-orange-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-orange-200">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-70">Tickets Ativos</h3>
        <div>
          <span className="text-4xl font-bold">
            R$ {tables.reduce((acc, t) => acc + t.activeSubcomandas.reduce((a, s) => a + s.total, 0), 0).toFixed(2)}
          </span>
          <p className="text-[10px] mt-1 font-medium opacity-80 uppercase tracking-wider">Total em mesas abertas</p>
        </div>
      </section>

      {/* Inventory Alert */}
      <section className="col-span-4 bg-white rounded-3xl border border-zinc-200 p-6 flex flex-col shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/admin/products" className="p-4 bg-zinc-50 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-100 transition-colors">
            <Package size={20} className="text-zinc-400" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Produtos</span>
          </Link>
          <Link to="/admin/orders" className="p-4 bg-zinc-50 rounded-2xl flex flex-col items-center gap-2 hover:bg-zinc-100 transition-colors">
            <Receipt size={20} className="text-zinc-400" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Fila</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function OrdersList() {
  const [tables, setTables] = useState<Table[]>([]);
  const socket = useMemo(() => io(), []);

  useEffect(() => {
    fetch('/api/tables').then(res => res.json()).then(setTables);
    socket.on('tables_updated', setTables);
    return () => { socket.off('tables_updated'); };
  }, [socket]);

  // Flatten all items from open subcomandas
  const kitchenItems = tables.flatMap(t => 
    t.activeSubcomandas
      .filter(s => s.status === 'open')
      .flatMap(s => s.items.map(i => ({ ...i, tableNumber: t.number, customerName: s.customerName, subId: s.id })))
  );

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Fila da Cozinha</h2>
        <p className="text-zinc-500">Itens pendentes por mesa e subcomanda.</p>
      </header>

      <div className="space-y-4">
        {kitchenItems.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] border border-zinc-100 text-center text-zinc-400">
            <Clock className="mx-auto mb-4 opacity-10" size={64} />
            <p>Nenhum item pendente na cozinha.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {kitchenItems.map((item, idx) => (
              <div key={item.id + idx} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm flex items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center flex-col shrink-0 shadow-lg shadow-zinc-200">
                    <span className="text-[10px] font-bold uppercase opacity-50">Mesa</span>
                    <span className="text-xl font-bold">{item.tableNumber}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-900">{item.quantity}x {item.name}</h4>
                    <p className="text-sm font-medium text-zinc-400">Cliente: <span className="text-orange-600">{item.customerName}</span></p>
                  </div>
                </div>
                
                <button className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors">
                  <CheckCircle2 size={24} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TableSettings() {
  const [tables, setTables] = useState<Table[]>([]);
  const socket = useMemo(() => io(), []);

  useEffect(() => {
    fetch('/api/tables').then(res => res.json()).then(setTables);
    socket.on('tables_updated', setTables);
    return () => { socket.off('tables_updated'); };
  }, [socket]);

  const toggleStatus = async (id: string, current: boolean) => {
    await fetch(`/api/tables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current })
    });
  };

  const addTable = async () => {
    await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: tables.length + 1 })
    });
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const margin = 15;
    let x = margin;
    let y = margin;
    const cardWidth = 85;
    const cardHeight = 95;
    const qrSize = 50;

    // Filter active tables and sort by number
    const activeTables = [...tables]
      .filter(t => t.isActive)
      .sort((a, b) => a.number - b.number);

    for (let i = 0; i < activeTables.length; i++) {
      const table = activeTables[i];
      
      if (i > 0 && i % 4 === 0) {
        doc.addPage();
        x = margin;
        y = margin;
      }

      const qrUrl = `${window.location.origin}/?tableId=${table.id}&token=${table.token}`;
      
      // Draw Card Border
      doc.setDrawColor(230);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardWidth, cardHeight, 5, 5, 'S');
      
      // Header Background
      doc.setFillColor(24, 24, 27); // Zinc-900
      doc.roundedRect(x, y, cardWidth, 20, 5, 5, 'F');
      doc.rect(x, y + 15, cardWidth, 5, 'F'); // Square bottom corners for header

      // Table Number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255);
      doc.text(`MESA ${table.number.toString().padStart(2, '0')}`, x + cardWidth/2, y + 14, { align: 'center' });
      
      // Generate QR Code Image using a hidden canvas
      const canvas = document.createElement('canvas');
      const qrCanvas = document.getElementById(`qr-canvas-${table.id}`) as HTMLCanvasElement;
      
      if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', x + (cardWidth - qrSize)/2, y + 28, qrSize, qrSize);
      }

      // Instructions
      doc.setTextColor(115, 115, 115); // Zinc-400
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Aponte a câmera para pedir', x + cardWidth/2, y + 84, { align: 'center' });
      
      doc.setTextColor(249, 115, 22); // Orange-500
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDERFLOW - CARDÁPIO DIGITAL', x + cardWidth/2, y + 90, { align: 'center' });

      // Spacing for next card
      x += cardWidth + 10;
      if (x > 150) {
        x = margin;
        y += cardHeight + 10;
      }
    }

    doc.save('cartoes-mesas-restpro.pdf');
  };

  const downloadSingleQR = (tableId: string, number: number) => {
    const canvas = document.getElementById(`qr-canvas-${tableId}`) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qrcode-mesa-${number}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Gestão de Mesas</h2>
          <p className="text-gray-500">Controle o acesso físico e gere QR Codes para impressão.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-6 py-3 border border-zinc-200 rounded-xl font-bold hover:bg-zinc-50 transition-colors"
          >
            <Printer size={18} />
            Imprimir Lote
          </button>
          <button 
            onClick={addTable}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
          >
            <Plus size={18} />
            Nova Mesa
          </button>
        </div>
      </header>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
          <QrCode size={24} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Segurança "Zero Seleção" Ativa</h4>
          <p className="text-sm text-blue-700/80 leading-relaxed mt-1">
            O aplicativo do cliente está configurado para <strong>bloquear a escolha manual de mesas</strong>. 
            O acesso só é liberado através dos QR Codes abaixo, que contêm um token de segurança único (UUID). 
            Se você desativar uma mesa, todos os QR Codes dela param de funcionar instantaneamente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {tables.map(table => (
          <div key={table.id} className={cn(
            "bg-white rounded-[2.5rem] border p-8 flex flex-col items-center gap-6 relative overflow-hidden",
            !table.isActive ? "border-red-100 opacity-60" : "border-zinc-100"
          )}>
            {!table.isActive && (
              <div className="absolute top-4 right-4 bg-red-100 text-red-600 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest">
                Mesa Inativa
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-4xl font-black text-zinc-900">MESA {table.number}</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Status: {table.status}</p>
            </div>

            <div className="p-4 bg-zinc-50 rounded-3xl border border-zinc-100 relative group">
              <div className="hidden">
                 <QRCodeCanvas 
                  id={`qr-canvas-${table.id}`}
                  value={`${window.location.origin}/?tableId=${table.id}&token=${table.token}`}
                  size={512}
                  level="H"
                  includeMargin
                />
              </div>
              <QRCodeSVG 
                value={`${window.location.origin}/?tableId=${table.id}&token=${table.token}`}
                size={160}
                level="H"
                includeMargin
                imageSettings={{
                  src: "/favicon.ico",
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>

            <div className="w-full flex gap-2">
              <button 
                onClick={() => downloadSingleQR(table.id, table.number)}
                className="p-3 rounded-2xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all flex items-center justify-center"
                title="Download PNG"
              >
                <Printer size={16} />
              </button>
              <button 
                onClick={() => toggleStatus(table.id, table.isActive)}
                className={cn(
                  "flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all",
                  table.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
                )}
              >
                {table.isActive ? 'Desativar Mesa' : 'Ativar Mesa'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <header>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Inventário</h2>
          <p className="text-gray-500">Gerencie seu cardápio digital.</p>
        </header>
        <button className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-gray-200 hover:bg-gray-800 transition-colors">
          Adicionar Produto
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
              <th className="px-8 py-6">Produto</th>
              <th className="px-8 py-6">Categoria</th>
              <th className="px-8 py-6">Preço</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-semibold text-gray-600">
                    {p.category}
                  </span>
                </td>
                <td className="px-8 py-5 font-bold text-gray-900">
                  R$ {p.price.toFixed(2)}
                </td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold",
                    p.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {p.available ? 'EM ESTOQUE' : 'INDISPONÍVEL'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="text-gray-400 hover:text-gray-900 transition-colors p-2">
                    <Settings size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
