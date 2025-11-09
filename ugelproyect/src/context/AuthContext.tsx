import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (token: string, userData?: any) => void;
  logout: () => void;
  updateUserProfile: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // ✅ Verifica si hay token guardado
  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      const savedUser = localStorage.getItem("user");
      if (savedUser) setUser(JSON.parse(savedUser));
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // ✅ Validar token al iniciar la app
  useEffect(() => {
    checkAuth();
  }, []);

  // ✅ Escuchar cambios entre pestañas
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "token") checkAuth();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // ✅ Iniciar sesión
  const login = (token: string, userData?: any) => {
    localStorage.setItem("token", token);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData || null);
  };

  const updateUserProfile = (userData: any) => {
    setUser((prevUser: any) => {
      const newUser = { ...prevUser, ...userData };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  };

  // ✅ Cerrar sesión
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/"); // Redirect to login page
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};
