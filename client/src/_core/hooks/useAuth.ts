import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState({ id: 1, name: 'Demo User' }); // Usuario demo
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulación de verificación de autenticación
    // Aquí irá tu lógica real de auth
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    // Aquí tu lógica de logout
  };

  return { user, loading, logout };
}