/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerView } from './components/CustomerView';
import { AdminView } from './components/AdminView';
import { SplashPage } from './components/SplashPage';
import { AdminLoginPage } from './components/AdminLoginPage';
import { PublicGuide } from './components/PublicGuide';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, login, adminLogin } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-x-hidden">
        <Routes>
          {/* Public Splash */}
          <Route path="/" element={<SplashPage onLogin={login} />} />
          <Route path="/guia" element={<PublicGuide />} />

          {/* Customer Route */}
          <Route 
            path="/menu" 
            element={user && user.role === 'customer' ? <CustomerView user={user} /> : <Navigate to="/" replace />} 
          />

          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLoginPage onLogin={adminLogin} />} />
          <Route 
            path="/admin/*" 
            element={user && user.role === 'admin' ? <AdminView /> : <Navigate to="/admin-login" replace />} 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

