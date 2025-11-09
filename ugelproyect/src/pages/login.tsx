import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Mail,
  Lock,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoaderThree } from "@/components/ui/loader";
import { motion } from "framer-motion";
import TextType from "@/components/TextType";
import { useAuth } from "@/context/AuthContext";
import { useUserBlockStatus } from "@/hooks/useUserBlockStatus";
import UserBlockedModal from "@/components/UserBlockedModal";
// Importar imágenes del carrusel
import carousel1 from "@/imagenes/carousel-1.jpg";
import carousel2 from "@/imagenes/carousel-2.jpg";
import carousel3 from "@/imagenes/carousel-3.jpg";
import carousel4 from "@/imagenes/carousel-4.jpg";

const API_URL = "http://localhost:9000/ugel-talara";

const ModernLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [preBlocked, setPreBlocked] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const navigate = useNavigate();
  const { login } = useAuth(); // Destructure login from useAuth
  const { isBlocked, convocatoriaId, blockTimestamp } = useUserBlockStatus();
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  // Imágenes del carrusel - Las imágenes están en src/imagenes/
  const carouselImages = [
    {
      url: carousel1,
      title: "Sistema de Gestión Educativa",
      subtitle: "Innovación que transforma realidades",
    },
    {
      url: carousel2,
      title: "UGEL Talara",
      subtitle: "Compromiso con la educación",
    },
    {
      url: carousel3,
      title: "Vela por el buen servicio de la calidad educativa.",
      subtitle: "Cambio y la Mejora de la Educación",
    },
    {
      url: carousel4,
      title: "Experiencia Laboral",
      subtitle: "Diseño que marca la diferencia",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Verificar si el usuario está bloqueado (SOLO PARA POSTULANTES)
  useEffect(() => {
    const checkUserRole = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setShowBlockedModal(false);
          return;
        }
        
        // Decodificar el token para obtener el rol
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userRole = payload?.rol || payload?.role || '';
        
        // Solo mostrar el modal si es postulante y está bloqueado
        if (userRole.toLowerCase() === 'postulante' && isBlocked) {
          setShowBlockedModal(true);
        } else {
          setShowBlockedModal(false);
        }
      } catch (error) {
        // Si no hay token o es inválido, no mostrar el modal
        setShowBlockedModal(false);
      }
    };
    
    if (isBlocked) {
      checkUserRole();
    } else {
      setShowBlockedModal(false);
    }
  }, [isBlocked]);


  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev - 1 + carouselImages.length) % carouselImages.length
    );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errorMessage) setErrorMessage("");
  };

  // Pre-chequeo: si es postulante y ya postuló a la convocatoria activa, bloquear antes del login
  useEffect(() => {
    const checkPreLoginBlock = async () => {
      try {
        setPreBlocked(false);
        if (!formData.email) return;

        // 1) Consultar rol por email
        const roleRes = await fetch(`${API_URL}/users/check-role`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ email: formData.email })
        });
        const roleData = await roleRes.json().catch(() => ({} as any));
        const role = (roleData?.rol || roleData?.role || '').toLowerCase();
        if (role !== 'postulante') return; // Solo aplica a postulantes

        // 2) Ver convocatoria activa o publicada
        const convRes = await fetch(`${API_URL}/convocatorias/`, {
          headers: { 
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const convData = await convRes.json().catch(() => []);
        
        // Normalizar y buscar convocatorias activas o publicadas
        const convArray = Array.isArray(convData) ? convData : (convData ? [convData] : []);
        const activeConv = convArray.find((c: any) => {
          // Intentar obtener el estado de múltiples campos posibles
          const estadoRaw = c.estado || c.ESTADO || c.estadoConvocatoria || c.status || c.ESTADO_CONVOCATORIA || "";
          // Normalizar el estado: convertir a string, quitar espacios, convertir a minúsculas
          const estado = String(estadoRaw).trim().toLowerCase();
          // Aceptar múltiples variaciones de estados válidos
          const estadosValidos = [
            "activo", "activa", "active",
            "publicada", "publicado", "published", "public",
            "publica", "en curso", "vigente",
            "disponible", "abierta", "abierto", "open"
          ];
          return estadosValidos.some(estadoValido => estado.includes(estadoValido));
        });
        if (!activeConv) return;

        const convocatoriaId = activeConv?.id || activeConv?.IDCONVOCATORIA || activeConv?.IDCONVOCATORIA_COMPLETO;
        const appliedConvId = localStorage.getItem('appliedConvId');
        if (appliedConvId && convocatoriaId && String(convocatoriaId) === String(appliedConvId)) {
          setPreBlocked(true);
          setErrorMessage('Ya postulaste a la convocatoria vigente. Podrás acceder cuando se publique una nueva convocatoria activa.');
        }
      } catch {
        // Silenciar errores de prechequeo
      }
    };

    // Debounce sencillo para evitar spam al tipear
    const t = setTimeout(checkPreLoginBlock, 400);
    return () => clearTimeout(t);
  }, [formData.email]);
  
  const handleSubmit = async () => {
    setErrorMessage("");
    setLoginSuccess(false);

    // Validar que se ingresen correo y contraseña, indicando cuál falta
    const camposFaltantes: string[] = [];
    
    if (!formData.email || formData.email.trim().length === 0) {
      camposFaltantes.push("Correo electrónico");
    }
    if (!formData.password || formData.password.trim().length === 0) {
      camposFaltantes.push("Contraseña");
    }
    
    if (camposFaltantes.length > 0) {
      setErrorMessage(`Por favor, completa el siguiente campo: ${camposFaltantes.join(", ")}`);
      return;
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage("El campo 'Correo electrónico' no tiene un formato válido. Ejemplo: usuario@correo.com");
      return;
    }

    // Validar longitud mínima de contraseña
    if (formData.password.length < 4) {
      setErrorMessage("El campo 'Contraseña' debe tener al menos 4 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          correo: formData.email.trim(),
          contrasena: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        // Mensajes de error específicos según el tipo de error
        if (data.message) {
          if (data.message.includes('correo') || data.message.includes('Correo') || data.message.includes('formato') || data.message.includes('válido')) {
            setErrorMessage(`El campo 'Correo electrónico' es incorrecto. Verifica que esté bien escrito.`);
          } else if (data.message.includes('desactivada') || data.message.includes('desactivado') || data.message.includes('Desactivada')) {
            setErrorMessage(data.message);
          } else if (data.message.includes('Credenciales incorrectas') || data.message.includes('Credenciales')) {
            setErrorMessage(`Las credenciales ingresadas son incorrectas. Verifica tu correo electrónico y contraseña.`);
          } else if (data.message.includes('contraseña') || data.message.includes('Contraseña')) {
            setErrorMessage(`La contraseña ingresada es incorrecta. Verifica tu contraseña.`);
          } else {
            setErrorMessage(data.message);
          }
        } else {
          setErrorMessage("Error al iniciar sesión. Verifica que el campo 'Correo electrónico' y el campo 'Contraseña' sean correctos.");
        }
        return;
      }

      const token = data.token;
      const userLogged = data.user; // Get the complete user object from the backend

      if (!token || !userLogged || !userLogged.rol) {
        setLoading(false);
        setErrorMessage("La respuesta del servidor no es válida o faltan datos del usuario.");
        return;
      }

      // Bloqueo de acceso para postulantes si no existen convocatorias activas o publicadas
      if (userLogged.rol === "postulante") {
        try {
          const convRes = await fetch(`${API_URL}/convocatorias/`, {
            headers: { 
              'ngrok-skip-browser-warning': 'true'
            }
          });
          const convData = await convRes.json().catch(() => []);
          
          // Normalizar y buscar convocatorias activas o publicadas
          const convArray = Array.isArray(convData) ? convData : (convData ? [convData] : []);
          
          // Log para debugging (solo en desarrollo)
          if (process.env.NODE_ENV === 'development' && convArray.length > 0) {
            console.log('📋 Convocatorias recibidas:', convArray.length);
            console.log('📋 Ejemplo de convocatoria:', convArray[0]);
            console.log('📋 Estados encontrados:', convArray.map((c: any) => ({
              id: c.id || c.IDCONVOCATORIA,
              estado: c.estado || c.ESTADO || c.estadoConvocatoria,
              todosLosCampos: Object.keys(c)
            })));
          }
          
          const activeConv = convArray.find((c: any) => {
            // Intentar obtener el estado de múltiples campos posibles
            const estadoRaw = c.estado || c.ESTADO || c.estadoConvocatoria || c.status || c.ESTADO_CONVOCATORIA || "";
            // Normalizar el estado: convertir a string, quitar espacios, convertir a minúsculas
            const estado = String(estadoRaw).trim().toLowerCase();
            // Aceptar múltiples variaciones de estados válidos
            const estadosValidos = [
              "activo", "activa", "active",
              "publicada", "publicado", "published", "public",
              "publica", "en curso", "vigente",
              "disponible", "abierta", "abierto", "open"
            ];
            const esValido = estadosValidos.some(estadoValido => estado.includes(estadoValido));
            
            // Log para debugging
            if (process.env.NODE_ENV === 'development' && esValido) {
              console.log('✅ Convocatoria activa encontrada:', {
                id: c.id || c.IDCONVOCATORIA,
                estado: estadoRaw,
                estadoNormalizado: estado
              });
            }
            
            return esValido;
          });
          
          if (!activeConv) {
            setLoading(false);
            // Mostrar información de debug en desarrollo
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ No se encontró ninguna convocatoria activa/publicada');
              console.warn('📋 Total de convocatorias:', convArray.length);
              if (convArray.length > 0) {
                console.warn('📋 Primera convocatoria (ejemplo):', JSON.stringify(convArray[0], null, 2));
              }
            }
            setErrorMessage("No hay convocatorias activas en este momento. Intente más tarde.");
            return;
          }

          // Guardar la convocatoria activa actual para controles posteriores
          const convocatoriaId = activeConv?.id || activeConv?.IDCONVOCATORIA || activeConv?.IDCONVOCATORIA_COMPLETO;
          if (convocatoriaId != null) {
            localStorage.setItem('currentConvocatoriaId', String(convocatoriaId));
          }

          // Si ya postuló a la convocatoria activa actual, bloquear acceso
          const appliedConvId = localStorage.getItem('appliedConvId');
          if (appliedConvId && String(convocatoriaId) === String(appliedConvId)) {
            setLoading(false);
            setErrorMessage("Ya postulaste a la convocatoria vigente. Podrás acceder cuando se publique una nueva convocatoria activa.");
            return;
          }

          // Bloqueo por base de datos: si el usuario ya subió algún currículum (independiente del navegador)
          try {
            const hasCvRes = await fetch(`${API_URL}/postulantes/has-curriculum`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
              }
            });
            const hasCvData = await hasCvRes.json().catch(() => ({ hasCurriculum: false }));
            if (hasCvData?.hasCurriculum) {
              setLoading(false);
              setErrorMessage("Ya registraste tu currículum. El acceso estará habilitado cuando se publique una nueva convocatoria activa.");
              return;
            }
          } catch (_) {}
        } catch (e: any) {
          setLoading(false);
          setErrorMessage("No se pudo verificar el estado de las convocatorias.");
          return;
        }
      }

      // Verificación para usuarios de comité: deben tener grupo y convocatorias asignadas
      if (userLogged.rol === "comite") {
        // Si el usuario no está asignado a ningún grupo, denegar acceso
        if (!userLogged.grupoId) {
          setLoading(false);
          setErrorMessage("Acceso denegado: No estás asignado a ningún grupo de comité. Contacta al administrador.");
          return;
        }

        // Si el usuario está en un grupo pero no tiene convocatorias asignadas, denegar acceso
        if (!userLogged.convocatoriasAsignadas || !Array.isArray(userLogged.convocatoriasAsignadas) || userLogged.convocatoriasAsignadas.length === 0) {
          setLoading(false);
          setErrorMessage("Acceso denegado: Tu grupo aún no tiene convocatorias asignadas. Contacta al administrador.");
          return;
        }
      }

      setLoading(false);
      setSuccessMessage(data.message || "Inicio de sesión exitoso");
      setLoginSuccess(true);

      login(token, userLogged); // Use the login function from AuthContext

      setTimeout(() => {
        switch (userLogged.rol) {
          case "administrador":
            navigate("/admin");
            break;
          case "comite":
            // Guardar información del grupo y las convocatorias
            localStorage.setItem('grupoId', String(userLogged.grupoId));
            if (userLogged.grupoNombre) {
              localStorage.setItem('grupoNombre', userLogged.grupoNombre);
            }
            
            // Si tiene una sola convocatoria, guardarla en localStorage
            if (userLogged.convocatoriasAsignadas.length === 1) {
              localStorage.setItem('selectedConvocatoriaId', String(userLogged.convocatoriasAsignadas[0].IDCONVOCATORIA));
              localStorage.setItem('selectedConvocatoria', JSON.stringify(userLogged.convocatoriasAsignadas[0]));
            } else {
              // Si tiene múltiples convocatorias, guardar todas
              localStorage.setItem('userConvocatorias', JSON.stringify(userLogged.convocatoriasAsignadas));
            }
            
            // Redirigir a la interfaz del comité
            navigate("/comite");
            break;
          case "postulante":
            navigate("/postulante");
            break;
          case "recursos humanos":
            navigate("/recursosHumanos");
            break;
          case "tramite":
          case "mesa de partes":
          case "mesadepartes":
            navigate("/tramite");
            break;
          default:
            navigate("/");
        }
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      console.error("Error de conexión:", err);
      setErrorMessage("Error al conectar con la API.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4"
    >
        <div className="max-w-6xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-blue-200/50">
        <div className="flex flex-col lg:flex-row min-h-[700px] lg:min-h-[700px]">
          {/* Login */}
          <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
            <div className="max-w-md mx-auto w-full">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-blue-600 mb-2 drop-shadow-lg" style={{ textShadow: '3px 3px 6px rgba(37, 99, 235, 0.5), 0 0 12px rgba(37, 99, 235, 0.4), 0 0 20px rgba(37, 99, 235, 0.3)' }}>
                  <TextType
                    text={["CONTRATACIÓN CAS", "INNOVATE", "UGEL TALARA"]}
                    typingSpeed={100}
                    pauseDuration={2000}
                    showCursor
                    cursorCharacter="|"
                  />
                </h1>
                <h2 className="text-2xl font-semibold text-blue-600 mb-3">
                  Inicia sesión
                </h2>
                <p className="text-gray-600 text-sm">
                  Bienvenido al Sistema Virtual de Contratación Cas - UGEL
                  TALARA
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-center text-red-700 animate-pulse">
                  {errorMessage}
                </div>
              )}

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!loading && !loginSuccess && !preBlocked) {
                    handleSubmit();
                  }
                }}
                className="space-y-6"
              >
                {/* Email */}
                <div className="relative group">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                    size={20}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading && !loginSuccess && !preBlocked) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-blue-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative group">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !loading && !loginSuccess && !preBlocked) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    className="w-full pl-12 pr-12 py-4 bg-white border border-blue-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Enlace Olvidaste Contraseña */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate("/recuperar")}
                    className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Botón Iniciar Sesión */}
                <button
                  type="submit"
                  disabled={loading || loginSuccess || preBlocked}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 focus:ring-2 focus:ring-blue-500 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-xl border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Cargando..." : "Iniciar Sesión"}
                </button>
              </form>
            </div>
          </div>

          {/* Carrusel */}
          <div className="lg:w-1/2 relative overflow-hidden min-h-[700px]">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent z-10"></div>
            <div className="relative h-full w-full min-h-[700px]">
              {carouselImages.map((image, index) => {
                const hasFailed = failedImages.has(index);
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                      index === currentSlide
                        ? "opacity-100 scale-100 z-20"
                        : "opacity-0 scale-110 z-0"
                    }`}
                  >
                    {hasFailed ? (
                      // Mostrar placeholder si la imagen falló
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center">
                        <div className="text-white text-center p-8">
                          <h3 className="text-2xl font-bold mb-2">{image.title}</h3>
                          <p className="text-lg opacity-90">{image.subtitle}</p>
                        </div>
                      </div>
                    ) : (
                      // Intentar cargar la imagen
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Solo registrar el error una vez y silenciosamente
                          if (!failedImages.has(index)) {
                            // Solo mostrar warning en desarrollo
                            if (process.env.NODE_ENV === 'development') {
                              console.warn(`⚠️ No se pudo cargar la imagen ${index + 1}. Usando placeholder.`);
                            }
                            setFailedImages(prev => new Set(prev).add(index));
                          }
                          // Ocultar la imagen que falló
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                        onLoad={() => {
                          // Solo log en desarrollo
                          if (process.env.NODE_ENV === 'development') {
                            console.log(`✅ Imagen ${index + 1} cargada correctamente`);
                          }
                        }}
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    )}
                    <div className="absolute bottom-8 left-8 right-8 text-white z-20">
                      <h2 className="text-3xl font-bold mb-2 drop-shadow-lg" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5)' }}>
                        {image.title}
                      </h2>
                      <p className="text-lg opacity-90 drop-shadow-md" style={{ textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)' }}>
                        {image.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/30 backdrop-blur-sm text-blue-700 hover:bg-white/50 border border-blue-300/50"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/30 backdrop-blur-sm text-blue-700 hover:bg-white/50 border border-blue-300/50"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 border-2 ${
                    index === currentSlide
                      ? "bg-white border-white scale-125"
                      : "bg-transparent border-white/50 hover:border-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
              <LoaderThree />
              <p className="text-white text-lg font-semibold animate-pulse">
                Verificando credenciales...
              </p>
            </div>
          </div>
        )}

        {loginSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-blue-900/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center space-y-4 p-10 bg-white rounded-2xl border border-blue-500/50 shadow-2xl"
            >
              <CheckCircle className="text-green-500" size={64} />
              <p className="text-blue-800 text-xl font-semibold">
                {successMessage}
              </p>
              <p className="text-gray-600">Redirigiendo...</p>
            </motion.div>
          </motion.div>
        )}

        {/* Modal de usuario bloqueado */}
        <UserBlockedModal
          isOpen={showBlockedModal}
          convocatoriaId={convocatoriaId}
          blockTimestamp={blockTimestamp}
          onClose={() => setShowBlockedModal(false)}
        />
      </div>
    </motion.div>
  );
};

export default ModernLogin;