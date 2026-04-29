import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/AdminLogin';
import Marketplace from './pages/Marketplace';
import api from './api/axios';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Intentar obtener el dashboard para ver si la sesión está activa
        const response = await api.get('/user/dashboard');
        if (response.data && response.data.usuario) {
          setUser(response.data.usuario);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn("Auth check failed (likely not logged in or CORS issue):", err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout user={user}>
        <Routes>
          {/* Ruta Pública: Landing */}
          <Route path="/" element={<Home />} />
          
          {/* Ruta de Auth */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login initialTab="login" />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Login initialTab="register" />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Rutas Protegidas */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/marketplace" 
            element={user ? <Marketplace /> : <Navigate to="/login" />} 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;