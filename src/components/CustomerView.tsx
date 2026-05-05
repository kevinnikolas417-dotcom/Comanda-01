/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, ChevronRight, X, Clock, CheckCircle2, CreditCard } from 'lucide-react';
import { Product, User, Subcomanda, OrderItem, TableStatus, Table } from '../types';
import { ProductCard } from './ProductCard';
import { cn } from '../lib/utils';
import { io, Socket } from 'socket.io-client';

interface CustomerViewProps {
  user: User;
}

export function CustomerView({ user }: CustomerViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentSubcomanda, setCurrentSubcomanda] = useState<Subcomanda | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const socket = useMemo(() => io(), []);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
    
    const updateLocalSub = (tables: Table[]) => {
      let foundSub: Subcomanda | null = null;
      tables.forEach(t => {
        const sub = t.activeSubcomandas.find(s => s.id === user.subcomandaId);
        if (sub) foundSub = sub;
      });
      setCurrentSubcomanda(foundSub);
    };

    fetch('/api/tables')
      .then(res => res.json())
      .then(updateLocalSub);

    socket.on('tables_updated', updateLocalSub);

    return () => {
      socket.off('tables_updated');
    };
  }, [user.subcomandaId, socket]);

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: Math.random().toString(), 
        productId: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        subcomandaId: user.subcomandaId!
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalBill = (currentSubcomanda?.total || 0) + cartTotal;

  const handleSendOrder = async () => {
    if (cart.length === 0 || !user.subcomandaId) return;
    
    const res = await fetch(`/api/subcomandas/${user.subcomandaId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart })
    });

    if (res.ok) {
      setCart([]);
      setIsCartOpen(false);
    }
  };

  const handleCheckout = async () => {
    if (!user.subcomandaId) return;
    setIsCheckingOut(true);
    await fetch(`/api/subcomandas/${user.subcomandaId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-zinc-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-800">Mesa {user.tableId.toString().padStart(2, '0')}</h2>
            <p className="text-xs text-zinc-400 font-medium">Subcomanda: <span className="text-orange-600 font-bold">{currentSubcomanda?.customerName}</span></p>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-3 bg-zinc-900 text-white rounded-2xl relative shadow-lg shadow-zinc-200 transition-transform active:scale-95"
          >
            <ShoppingBag size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="O que você deseja comer?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all placeholder:text-zinc-400"
          />
        </div>
      </header>

      {/* Categories */}
      <div className="overflow-x-auto no-scrollbar flex items-center gap-2 px-6 py-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
              selectedCategory === cat 
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                : "bg-white text-zinc-400 border border-zinc-100 hover:bg-zinc-50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <main className="flex-1 px-6 grid grid-cols-2 gap-4 pb-32">
        {filteredProducts.map(product => (
          <div key={product.id}>
            <ProductCard product={product} onAdd={addToCart} />
          </div>
        ))}
      </main>

      {/* Floating Bottom Bar */}
      <AnimatePresence>
        {(cart.length > 0 || (currentSubcomanda?.items.length || 0) > 0) && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 z-30"
          >
            <div className="bg-orange-600 text-white p-5 rounded-[2.5rem] shadow-2xl shadow-orange-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold">Total da Conta</p>
                <h3 className="text-2xl font-bold">R$ {totalBill.toFixed(2)}</h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="bg-white text-zinc-900 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-100 transition-colors"
              >
                Comanda
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[40px] z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900">Sua Comanda</h2>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 bg-zinc-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                {currentSubcomanda && currentSubcomanda.items.length > 0 && (
                  <div className="mb-8 space-y-4">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      <Clock size={14} />
                      Já pedidos
                    </div>
                    <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                      {currentSubcomanda.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span className="text-zinc-600">{item.quantity}x {item.name}</span>
                          <span className="font-semibold text-zinc-900">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-zinc-200 flex justify-between items-center">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1",
                          currentSubcomanda.status === 'open' ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                        )}>
                          <CheckCircle2 size={10} />
                          {currentSubcomanda.status === 'open' ? 'EM PREPARO / CONSUMO' : 'AGUARDANDO PAGAMENTO'}
                        </span>
                        <span className="font-bold text-zinc-900 text-sm">R$ {currentSubcomanda.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="space-y-4 mb-20">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      <ShoppingBag size={14} />
                      Novo Pedido
                    </div>
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-900">{item.name}</h4>
                          <p className="text-sm text-zinc-500">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-orange-600">{item.quantity}x</span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length === 0 && (!currentSubcomanda || currentSubcomanda.items.length === 0) && (
                  <div className="text-center py-20 text-zinc-400">
                    <ShoppingBag size={48} className="mx-auto mb-4 opacity-10" />
                    <p>Sua comanda está vazia.</p>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-6 bg-zinc-50 border-t border-zinc-100 space-y-3">
                {cart.length > 0 && (
                  <button 
                    onClick={handleSendOrder}
                    className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-zinc-100"
                  >
                    Confirmar Pedido (R$ {cartTotal.toFixed(2)})
                  </button>
                )}
                
                {currentSubcomanda && currentSubcomanda.items.length > 0 && (
                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut || currentSubcomanda.status === 'waiting_payment'}
                    className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-orange-100 disabled:opacity-50"
                  >
                    <CreditCard size={20} />
                    {currentSubcomanda.status === 'waiting_payment' ? 'Aguardando Garçom...' : `Fechar Minha Conta (R$ ${currentSubcomanda.total.toFixed(2)})`}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
