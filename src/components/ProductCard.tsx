/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Info, Utensils } from 'lucide-react';
import { Product } from '../types';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl border border-zinc-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="h-28 bg-zinc-100 relative">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <Utensils size={32} />
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-bold text-zinc-900 border border-zinc-200 shadow-sm">
          R$ {product.price.toFixed(2)}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-bold text-zinc-900 text-sm line-clamp-1">{product.name}</h3>
          <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
        </div>
        
        <button 
          onClick={() => onAdd(product)}
          className="w-full bg-orange-600 text-white py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>
    </motion.div>
  );
}
