/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';
import { TableStatus, Product, Table, Subcomanda, OrderItem } from './src/types';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // --- Mock Database ---
  let products: Product[] = [
    { id: '1', name: 'Hambúrguer Clássico', description: 'Pão brioche, carne 180g, queijo cheddar, alface e tomate.', price: 32, category: 'Hambúrgueres', available: true },
    { id: '2', name: 'Batata Frita Especial', description: 'Batata frita crocante com bacon e queijo derretido.', price: 24, category: 'Acompanhamentos', available: true },
    { id: '3', name: 'Suco de Laranja Natural', description: 'Suco fresco espremido na hora, 400ml.', price: 12, category: 'Bebidas', available: true },
    { id: '4', name: 'Pizza Margherita', description: 'Molho de tomate pelado, mozzarella fresca e manjericão.', price: 45, category: 'Pizzas', available: true },
    { id: '5', name: 'Pudim de Leite', description: 'Receita tradicional com muita calda de caramelo.', price: 15, category: 'Sobremesas', available: true },
  ];

  let tables: Table[] = Array.from({ length: 12 }, (_, i) => ({
    id: uuidv4(),
    number: i + 1,
    status: TableStatus.AVAILABLE,
    isActive: true,
    token: uuidv4(),
    activeSubcomandas: []
  }));

  // --- API Routes ---
  app.get('/api/products', (req, res) => res.json(products));
  
  app.get('/api/tables', (req, res) => res.json(tables));

  // Create Table
  app.post('/api/tables', (req, res) => {
    const { number } = req.body;
    const newTable: Table = {
      id: uuidv4(),
      number: number || tables.length + 1,
      status: TableStatus.AVAILABLE,
      isActive: true,
      token: uuidv4(),
      activeSubcomandas: []
    };
    tables.push(newTable);
    tables.sort((a, b) => a.number - b.number);
    io.emit('tables_updated', tables);
    res.status(201).json(newTable);
  });

  // Toggle Table Status (Active/Inactive)
  app.patch('/api/tables/:id', (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const tableIndex = tables.findIndex(t => t.id === id);
    if (tableIndex !== -1) {
      tables[tableIndex].isActive = isActive;
      io.emit('tables_updated', tables);
      res.json(tables[tableIndex]);
    } else {
      res.status(404).json({ error: 'Table not found' });
    }
  });

  // Open new subcomanda with Security Check
  app.post('/api/subcomandas', (req, res) => {
    const { tableId, customerName, token } = req.body;
    const tableIndex = tables.findIndex(t => t.id === tableId);
    
    if (tableIndex === -1) return res.status(404).json({ error: 'Table not found' });
    
    const table = tables[tableIndex];
    if (!table.isActive) return res.status(403).json({ error: 'Mesa desativada pelo administrador.' });
    if (token && table.token !== token) return res.status(401).json({ error: 'QR Code inválido ou expirado.' });

    const newSub: Subcomanda = {
      id: uuidv4(),
      tableId,
      customerName: customerName || `Cliente ${tables[tableIndex].activeSubcomandas.length + 1}`,
      status: 'open',
      total: 0,
      items: [],
      createdAt: new Date().toISOString()
    };

    tables[tableIndex].activeSubcomandas.push(newSub);
    tables[tableIndex].status = TableStatus.OCCUPIED;

    io.emit('tables_updated', tables);
    res.status(201).json(newSub);
  });

  // Add items to subcomanda
  app.post('/api/subcomandas/:id/items', (req, res) => {
    const { id } = req.params;
    const { items } = req.body; // Array of OrderItem
    
    let subFound: Subcomanda | null = null;
    tables.forEach(t => {
      const sub = t.activeSubcomandas.find(s => s.id === id);
      if (sub) subFound = sub;
    });

    if (!subFound) return res.status(404).json({ error: 'Subcomanda not found' });

    const itemsWithId = items.map((item: any) => ({
      ...item,
      id: uuidv4(),
      subcomandaId: id
    }));

    subFound.items.push(...itemsWithId);
    subFound.total = subFound.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    io.emit('tables_updated', tables);
    res.json(subFound);
  });

  // Transfer item between subcomandas
  app.patch('/api/items/:itemId/transfer', (req, res) => {
    const { itemId } = req.params;
    const { toSubcomandaId } = req.body;

    let itemToMove: OrderItem | null = null;
    let fromSub: Subcomanda | null = null;

    tables.forEach(t => {
      t.activeSubcomandas.forEach(s => {
        const idx = s.items.findIndex(i => i.id === itemId);
        if (idx !== -1) {
          itemToMove = s.items.splice(idx, 1)[0];
          fromSub = s;
        }
      });
    });

    if (!itemToMove) return res.status(404).json({ error: 'Item not found' });

    let destSub: Subcomanda | null = null;
    tables.forEach(t => {
      const sub = t.activeSubcomandas.find(s => s.id === toSubcomandaId);
      if (sub) destSub = sub;
    });

    if (!destSub) return res.status(404).json({ error: 'Destination subcomanda not found' });

    itemToMove.subcomandaId = toSubcomandaId;
    destSub.items.push(itemToMove);

    // Recalculate totals
    if (fromSub) (fromSub as any).total = (fromSub as any).items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0);
    destSub.total = destSub.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    io.emit('tables_updated', tables);
    res.json({ message: 'Item transferido com sucesso' });
  });

  app.post('/api/subcomandas/:id/checkout', (req, res) => {
    const { id } = req.params;
    tables.forEach(t => {
      const sub = t.activeSubcomandas.find(s => s.id === id);
      if (sub) {
        sub.status = 'waiting_payment';
        // If all subcomandas are waiting payment or paid, table reflects that
        const allWaiting = t.activeSubcomandas.every(s => s.status !== 'open');
        if (allWaiting) t.status = TableStatus.WAITING_PAYMENT;
      }
    });
    io.emit('tables_updated', tables);
    res.json({ message: 'Aguardando pagamento da subcomanda' });
  });

  app.post('/api/subcomandas/:id/release', (req, res) => {
    const { id } = req.params;
    let tableRef: Table | null = null;

    tables.forEach(t => {
      const idx = t.activeSubcomandas.findIndex(s => s.id === id);
      if (idx !== -1) {
        t.activeSubcomandas.splice(idx, 1);
        tableRef = t;
      }
    });

      if (tableRef) {
        if (tableRef.activeSubcomandas.length === 0) {
          tableRef.status = TableStatus.AVAILABLE;
        }
      }

    io.emit('tables_updated', tables);
    res.json({ message: 'Subcomanda finalizada e removida' });
  });

  // --- Vite / Static Assets ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- Real-time (Socket.io) ---
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.emit('initial_data', { products, tables });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
