/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  WAITING_PAYMENT = 'waiting_payment',
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  subcomandaId: string;
}

export interface Subcomanda {
  id: string;
  tableId: string;
  customerName: string;
  status: 'open' | 'waiting_payment' | 'paid';
  total: number;
  items: OrderItem[];
  createdAt: string;
}

export interface Table {
  id: string;
  number: number;
  status: TableStatus;
  isActive: boolean;
  token: string; // UUID para segurança no QR Code
  activeSubcomandas: Subcomanda[];
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'customer';
  tableId?: string;
  subcomandaId?: string;
}
