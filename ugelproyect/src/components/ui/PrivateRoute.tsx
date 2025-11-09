import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUserBlockStatus } from "@/hooks/useUserBlockStatus";

export const PrivateRoute: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const { isBlocked } = useUserBlockStatus();

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsValidToken(false);
        setLoading(false);
        return;
      }

      try {
        // Decodificar payload del token JWT
        const payload = JSON.parse(atob(token.split(".")[1]));
        const exp = payload.exp * 1000; // convertir a milisegundos

        // Verificar expiración
        if (Date.now() >= exp) {
          console.warn("⚠️ Token expirado");
          localStorage.removeItem("token");
          setIsValidToken(false);
        } else {
          setIsValidToken(true);
        }
      } catch (error) {
        console.error("❌ Token inválido o corrupto:", error);
        localStorage.removeItem("token");
        setIsValidToken(false);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  // Mientras se valida el token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Verificando sesión...
      </div>
    );
  }

  // Si no hay token válido → ir al login
  if (!isValidToken) return <Navigate to="/" replace />;

  // Si el usuario está bloqueado SOLO SI ES POSTULANTE → ir al login
  if (isBlocked) {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload?.rol || payload?.role || '';
        
        // Solo bloquear si es postulante
        if (userRole.toLowerCase() === 'postulante') {
          console.log("🚫 Usuario postulante bloqueado, redirigiendo al login");
          return <Navigate to="/" replace />;
        }
        // Si no es postulante, permitir acceso (continuar con el flujo normal)
        console.log("✅ Usuario no es postulante, permitiendo acceso");
      }
    } catch (error) {
      console.error("Error verificando rol:", error);
      // En caso de error, permitir acceso
    }
  }

  // Si el token es válido y no está bloqueado → continuar con la ruta
  return <Outlet />;
};
