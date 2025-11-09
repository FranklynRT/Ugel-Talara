import { useState, useEffect } from 'react';
import { TrendingUp, Users, FileText, Paperclip, Briefcase, BarChart3, Activity } from 'lucide-react'; // Removed unused lucide-react icons
import ComiteLayout from '@/layouts/ComiteLayout'; // Import ComiteLayout
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api'; // Import centralized API URL
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

// Usar URL centralizada de la API
const API_ROOT = API_BASE_URL;

interface StatsData {
  totalPostulantes: number;
  totalCVs: number;
  totalAnexos: number;
  totalConvocatoriasActivas: number;
  totalRegistradosApp?: number;
  registradosAppHoy?: number;
}

interface MonthlyData {
  mes: string;
  postulantes: number;
  cvs: number;
  aprobados: number;
}



interface ConvocatoriasChartData {
  puesto: string;
  postulantes: number;
}


const CVEvaluationDashboard = () => {
  const { user, logout } = useAuth(); // Get user and logout from AuthContext
  const [statsData, setStatsData] = useState<StatsData>({
    totalPostulantes: 0,
    totalCVs: 0,
    totalAnexos: 0,
    totalConvocatoriasActivas: 0,
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]); // Initialized as empty array
  const [convocatoriasChartData, setConvocatoriasChartData] = useState<ConvocatoriasChartData[]>([]); // Initialized as empty array
  const [convocatoriasAsignadas, setConvocatoriasAsignadas] = useState<any[]>([]);
  const [selectedConvocatoriaId, setSelectedConvocatoriaId] = useState<number | null>(null);
  const [postulantesEscaneados, setPostulantesEscaneados] = useState<any[]>([]);
  const [gruposComite, setGruposComite] = useState<any[]>([]); // Grupos de comité con sus convocatorias
  // Tema claro/oscuro sincronizado con ComiteLayout
  const [theme, setTheme] = useState<'dark' | 'light'>((document.documentElement.dataset.theme as 'dark' | 'light') || (localStorage.getItem('comite-theme') as 'dark' | 'light') || 'light');
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-slate-600';

  useEffect(() => {
    const sync = () => setTheme((document.documentElement.dataset.theme as 'dark' | 'light') || (localStorage.getItem('comite-theme') as 'dark' | 'light') || 'dark');
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', sync);
    return () => { observer.disconnect(); window.removeEventListener('storage', sync); };
  }, []);

  // Sincronizar tema en montaje (sin forzar)
  useEffect(() => {
    try {
      const currentTheme = (document.documentElement.dataset.theme as 'dark' | 'light') || (localStorage.getItem('comite-theme') as 'dark' | 'light') || 'dark';
      setTheme(currentTheme);
    } catch {}
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token is missing.");
        logout();
        return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'ngrok-skip-browser-warning': 'true',
    } as const;
  };

  const fetchJson = async (url: string, headers: Record<string, string>) => {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type');
    const text = await res.text();
    try {
      return ct && ct.includes('application/json') ? JSON.parse(text) : JSON.parse(text);
    } catch (e) {
      throw new Error(`Respuesta no JSON (${res.status}): ${text.slice(0,120)}`);
    }
  };

  const fetchStatsCardsData = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      console.log("Frontend: Fetching stats data...");
      
      // 1) Total de postulantes registrados desde Mesa de Partes (tabla postulantes_registrados)
      let totalPostulantesRegistrados = 0;
      try {
        const postulantesResp = await fetchJson(`${API_ROOT}/documentos/postulantes-registrados`, headers);
        const postulantesData = postulantesResp?.postulantes || postulantesResp || [];
        totalPostulantesRegistrados = Array.isArray(postulantesData) ? postulantesData.length : 0;
        console.log("✅ Postulantes registrados:", totalPostulantesRegistrados);
      } catch (error) {
        console.warn('⚠️ Error al obtener postulantes registrados:', error);
        totalPostulantesRegistrados = 0;
      }
      
      // 2) Total de CVs (curriculum) - Contar desde la tabla directamente
      let totalCVs = 0;
      try {
        // Intentar obtener desde un endpoint de estadísticas si existe
        const docsData = await fetchJson(`${API_ROOT}/documentos/estadisticas`, headers);
        totalCVs = Number(docsData?.curriculums?.total || docsData?.totalCVs || 0);
        console.log("✅ CVs desde estadísticas:", totalCVs);
      } catch (error) {
        console.warn('⚠️ No hay endpoint de estadísticas de documentos, usando conteo alternativo');
        // Si no hay endpoint, intentar contar desde postulantes registrados (cada uno tiene un curriculumId)
        try {
          const postulantesResp = await fetchJson(`${API_ROOT}/documentos/postulantes-registrados`, headers);
          const postulantesData = postulantesResp?.postulantes || postulantesResp || [];
          // Contar cuántos tienen curriculumId
          totalCVs = postulantesData.filter((p: any) => p.curriculumId).length;
          console.log("✅ CVs contados desde postulantes:", totalCVs);
        } catch (e) {
          totalCVs = 0;
        }
      }
      
      // 3) Total de Anexos (anexos_completos) - Contar desde la tabla directamente
      let totalAnexos = 0;
      try {
        // Intentar obtener desde un endpoint de estadísticas si existe
        const docsData = await fetchJson(`${API_ROOT}/documentos/estadisticas`, headers);
        totalAnexos = Number(docsData?.anexos?.total || docsData?.totalAnexos || 0);
        console.log("✅ Anexos desde estadísticas:", totalAnexos);
      } catch (error) {
        console.warn('⚠️ No hay endpoint de estadísticas de documentos, usando conteo alternativo');
        // Si no hay endpoint, intentar contar desde postulantes registrados (cada uno tiene un anexoId)
        try {
          const postulantesResp = await fetchJson(`${API_ROOT}/documentos/postulantes-registrados`, headers);
          const postulantesData = postulantesResp?.postulantes || postulantesResp || [];
          // Contar cuántos tienen anexoId
          totalAnexos = postulantesData.filter((p: any) => p.anexoId).length;
          console.log("✅ Anexos contados desde postulantes:", totalAnexos);
        } catch (e) {
          totalAnexos = 0;
        }
      }
      
      // 4) Convocatorias activas - Contar todas excepto "No Publicada"
      let convocatoriasActivas = 0;
      try {
        // Obtener todas las convocatorias con diferentes estados
        const estados = ['Activo', 'Publicada', 'Inactivo', 'Activado', 'Publicado'];
        const todasConvocatorias = new Map();
        
        // Obtener convocatorias por cada estado
        for (const estado of estados) {
          try {
            const convs = await fetchJson(`${API_ROOT}/convocatorias?estado=${estado}`, headers);
            const convsArray = Array.isArray(convs) ? convs : [];
            
            convsArray.forEach((c: any) => {
              const id = c.IDCONVOCATORIA || c.id;
              if (id && !todasConvocatorias.has(id)) {
                todasConvocatorias.set(id, c);
              }
            });
          } catch (err) {
            // Continuar con el siguiente estado si hay error
            console.warn(`⚠️ No se pudieron obtener convocatorias con estado ${estado}:`, err);
          }
        }
        
        // También obtener convocatorias de grupos (que pueden estar como "Inactivo")
        try {
          const grupos = await fetchJson(`${API_ROOT}/grupos-comite`, headers);
          const gruposArray = Array.isArray(grupos) ? grupos : [];
          
          for (const grupo of gruposArray) {
            try {
              const convsGrupo = await fetchJson(`${API_ROOT}/grupos-comite/${grupo.id}/convocatorias`, headers);
              const convsGrupoArray = Array.isArray(convsGrupo) ? convsGrupo : [convsGrupo].filter(Boolean);
              
              convsGrupoArray.forEach((c: any) => {
                const id = c.IDCONVOCATORIA || c.id;
                if (id) {
                  todasConvocatorias.set(id, c);
                }
              });
            } catch (err) {
              console.warn(`⚠️ Error al obtener convocatorias del grupo ${grupo.id}:`, err);
            }
          }
        } catch (err) {
          console.warn('⚠️ Error al obtener convocatorias de grupos:', err);
        }
        
        // Contar todas las convocatorias excepto las que están "No Publicada"
        convocatoriasActivas = Array.from(todasConvocatorias.values()).filter((c: any) => {
          const estado = (c.estado || '').toString().toLowerCase();
          // Excluir solo las que están "No Publicada" (desactivadas permanentemente)
          return estado !== 'no publicada';
        }).length;
        
        console.log("✅ Convocatorias activas encontradas:", convocatoriasActivas, "de", todasConvocatorias.size, "total");
      } catch (error) {
        console.error('⚠️ Error al obtener convocatorias activas:', error);
        // Si todo falla, intentar una consulta simple
        try {
          const convs = await fetchJson(`${API_ROOT}/convocatorias`, headers);
          const convsArray = Array.isArray(convs) ? convs : [];
          convocatoriasActivas = convsArray.filter((c: any) => {
            const estado = (c.estado || '').toString().toLowerCase();
            return estado !== 'no publicada';
          }).length;
        } catch (err2) {
          console.error('⚠️ Error al obtener convocatorias como fallback:', err2);
          convocatoriasActivas = 0;
        }
      }
      
      // Combinar los datos
      const combinedData = {
        totalPostulantes: totalPostulantesRegistrados,
        totalCVs: totalCVs,
        totalAnexos: totalAnexos,
        totalConvocatoriasActivas: convocatoriasActivas,
        totalRegistradosApp: totalPostulantesRegistrados,
        registradosAppHoy: 0, // Se puede calcular si es necesario
      };
      
      console.log("📊 Estadísticas finales:", combinedData);
      setStatsData(combinedData);
      toast.success('📊 Estadísticas cargadas correctamente');
    } catch (error) {
      console.error("❌ Error fetching stats cards data:", error);
      toast.error('⚠️ No se pudieron cargar las estadísticas');
      
      // Mantener valores en 0 si hay error
      setStatsData({
        totalPostulantes: 0,
        totalCVs: 0,
        totalAnexos: 0,
        totalConvocatoriasActivas: 0,
        totalRegistradosApp: 0,
        registradosAppHoy: 0
      });
    }
  };

  const fetchMonthlyData = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      console.log("Frontend: Generando datos mensuales desde postulantes registrados...");
      
      // Obtener postulantes registrados
      const response = await fetchJson(`${API_ROOT}/documentos/postulantes-registrados`, headers);
      const postulantesData = response?.postulantes || response || [];
      const postulantesArray = Array.isArray(postulantesData) ? postulantesData : [];
      
      // Agrupar por mes
      const mesesMap = new Map<string, { mes: string; postulantes: number; cvs: number; aprobados: number }>();
      
      // Nombres de meses en español
      const mesesNombres = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      
      postulantesArray.forEach((p: any) => {
        const fechaRegistro = p.fechaRegistro || p.fechaActualizacion || new Date().toISOString();
        const fecha = new Date(fechaRegistro);
        const mes = fecha.getMonth(); // 0-11
        const año = fecha.getFullYear();
        const mesKey = `${año}-${String(mes + 1).padStart(2, '0')}`;
        const mesNombre = `${mesesNombres[mes]} ${año}`;
        
        if (!mesesMap.has(mesKey)) {
          mesesMap.set(mesKey, {
            mes: mesNombre,
            postulantes: 0,
            cvs: 0,
            aprobados: 0
          });
        }
        
        const mesData = mesesMap.get(mesKey)!;
        mesData.postulantes += 1;
        
        // Si tiene curriculumId, cuenta como CV
        if (p.curriculumId && p.curriculumId !== 'N/A' && p.curriculumId !== '') {
          mesData.cvs += 1;
        }
        
        // Si el estado es "Registrado" o tiene SIGEA, cuenta como aprobado
        const estado = (p.estado || '').toString().toLowerCase();
        if (estado === 'registrado' || (p.expedienteSIGEA && p.expedienteSIGEA.trim() !== '')) {
          mesData.aprobados += 1;
        }
      });
      
      // Convertir a array y ordenar por fecha
      const monthlyDataArray = Array.from(mesesMap.values())
        .sort((a, b) => {
          // Extraer año y mes para ordenar
          const aParts = a.mes.split(' ');
          const bParts = b.mes.split(' ');
          const aMes = mesesNombres.indexOf(aParts[0]);
          const bMes = mesesNombres.indexOf(bParts[0]);
          const aAño = parseInt(aParts[1]);
          const bAño = parseInt(bParts[1]);
          
          if (aAño !== bAño) return aAño - bAño;
          return aMes - bMes;
        });
      
      // Si no hay datos, generar últimos 6 meses vacíos
      if (monthlyDataArray.length === 0) {
        const hoy = new Date();
        for (let i = 5; i >= 0; i--) {
          const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
          const mes = fecha.getMonth();
          const año = fecha.getFullYear();
          monthlyDataArray.push({
            mes: `${mesesNombres[mes]} ${año}`,
            postulantes: 0,
            cvs: 0,
            aprobados: 0
          });
        }
      }
      
      console.log("✅ Datos mensuales generados:", monthlyDataArray.length, "meses");
      setMonthlyData(monthlyDataArray);
    } catch (error) {
      console.error("Error generando datos mensuales:", error);
      setMonthlyData([]);
    }
  };

  // Estado por categoría eliminado (no se usa en esta vista)

  // (Eliminado gráfico de Evaluación por Categoría)

  const fetchConvocatoriasChartData = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      console.log("Frontend: Generando datos de convocatorias desde postulantes registrados...");
      
      // Obtener postulantes registrados
      const response = await fetchJson(`${API_ROOT}/documentos/postulantes-registrados`, headers);
      const postulantesData = response?.postulantes || response || [];
      const postulantesArray = Array.isArray(postulantesData) ? postulantesData : [];
      
      // Agrupar por puesto/convocatoria
      const puestosMap = new Map<string, number>();
      
      postulantesArray.forEach((p: any) => {
        const puesto = p.puesto || 'Sin puesto';
        const puestoKey = puesto.trim();
        
        if (puestoKey && puestoKey !== 'N/A') {
          puestosMap.set(puestoKey, (puestosMap.get(puestoKey) || 0) + 1);
        }
      });
      
      // Convertir a array y ordenar por cantidad de postulantes (descendente)
      const chartDataArray = Array.from(puestosMap.entries())
        .map(([puesto, postulantes]) => ({
          puesto: puesto,
          postulantes: postulantes
        }))
        .sort((a, b) => b.postulantes - a.postulantes)
        .slice(0, 10); // Limitar a los 10 primeros
      
      console.log("✅ Datos de convocatorias generados:", chartDataArray.length, "puestos");
      setConvocatoriasChartData(chartDataArray);
    } catch (error) {
      console.error("Error generando datos de convocatorias:", error);
      setConvocatoriasChartData([]);
    }
  };

  // Cargar grupos de comité para mapear convocatorias a grupos
  const fetchGruposComite = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const grupos = await fetchJson(`${API_ROOT}/grupos-comite`, headers);
      const gruposArray = Array.isArray(grupos) ? grupos : [];
      
      // Obtener detalles completos de cada grupo (con sus convocatorias)
      const gruposCompletos = await Promise.all(
        gruposArray.map(async (grupo: any) => {
          try {
            const grupoCompleto = await fetchJson(`${API_ROOT}/grupos-comite/${grupo.id}`, headers);
            return grupoCompleto;
          } catch (error) {
            console.error(`Error al obtener detalles del grupo ${grupo.id}:`, error);
            return grupo;
          }
        })
      );
      
      setGruposComite(gruposCompletos);
      console.log('✅ Grupos de comité cargados:', gruposCompletos.length);
    } catch (error) {
      console.error('Error al cargar grupos de comité:', error);
      setGruposComite([]);
    }
  };

  // Función para encontrar el grupo de una convocatoria
  const encontrarGrupoDeConvocatoria = (convocatoriaId: number | null): any => {
    if (!convocatoriaId) return null;
    
    for (const grupo of gruposComite) {
      if (grupo.convocatorias && Array.isArray(grupo.convocatorias)) {
        const convocatoriaEncontrada = grupo.convocatorias.find(
          (c: any) => c.IDCONVOCATORIA === convocatoriaId || Number(c.IDCONVOCATORIA) === Number(convocatoriaId)
        );
        if (convocatoriaEncontrada) {
          return grupo;
        }
      }
    }
    return null;
  };

  // Guardar convocatoria seleccionada en el backend
  const guardarConvocatoriaSeleccionada = async (convocatoriaId: number | null) => {
    if (!convocatoriaId || !user?.id) return;
    
    const headers = getAuthHeaders();
    if (!headers) return;
    
    try {
      // Guardar en localStorage para acceso rápido
      localStorage.setItem('selectedConvocatoriaId', String(convocatoriaId));
      const convocatoria = convocatoriasAsignadas.find((c: any) => c.IDCONVOCATORIA === convocatoriaId);
      if (convocatoria) {
        localStorage.setItem('selectedConvocatoria', JSON.stringify(convocatoria));
      }
      
      // Guardar en el backend (usando el endpoint de usuarios si existe, o crear uno nuevo)
      // Por ahora solo guardamos en localStorage, pero podemos agregar un endpoint si es necesario
      console.log('✅ Convocatoria seleccionada guardada:', convocatoriaId);
    } catch (error) {
      console.error('Error al guardar convocatoria seleccionada:', error);
    }
  };

  // Cargar convocatorias asignadas al usuario del comité
  useEffect(() => {
    // Cargar grupos de comité primero
    fetchGruposComite();
    
    // Primero intentar obtener desde el usuario (viene del login)
    if (user?.convocatoriasAsignadas && Array.isArray(user.convocatoriasAsignadas) && user.convocatoriasAsignadas.length > 0) {
      setConvocatoriasAsignadas(user.convocatoriasAsignadas);
      // Si tiene una sola convocatoria, seleccionarla automáticamente
      if (user.convocatoriasAsignadas.length === 1) {
        const conv = user.convocatoriasAsignadas[0];
        setSelectedConvocatoriaId(conv.IDCONVOCATORIA);
        guardarConvocatoriaSeleccionada(conv.IDCONVOCATORIA);
      } else {
        // Si hay múltiples, usar la que está en localStorage si existe
        const savedId = localStorage.getItem('selectedConvocatoriaId');
        if (savedId) {
          const savedConv = user.convocatoriasAsignadas.find((c: any) => String(c.IDCONVOCATORIA) === savedId);
          if (savedConv) {
            setSelectedConvocatoriaId(Number(savedId));
            guardarConvocatoriaSeleccionada(Number(savedId));
          }
        }
      }
    } else {
      // Si no viene en el usuario, intentar desde localStorage
      const savedConvocatorias = localStorage.getItem('userConvocatorias');
      if (savedConvocatorias) {
        try {
          const parsed = JSON.parse(savedConvocatorias);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConvocatoriasAsignadas(parsed);
            if (parsed.length === 1) {
              setSelectedConvocatoriaId(parsed[0].IDCONVOCATORIA);
              guardarConvocatoriaSeleccionada(parsed[0].IDCONVOCATORIA);
            } else {
              const savedId = localStorage.getItem('selectedConvocatoriaId');
              if (savedId) {
                const savedConv = parsed.find((c: any) => String(c.IDCONVOCATORIA) === savedId);
                if (savedConv) {
                  setSelectedConvocatoriaId(Number(savedId));
                  guardarConvocatoriaSeleccionada(Number(savedId));
                }
              }
            }
          }
        } catch (e) {
          console.error('Error parsing saved convocatorias:', e);
        }
      } else {
        // Si no hay convocatorias guardadas, intentar obtenerlas desde el backend
        const fetchUserConvocatorias = async () => {
          const headers = getAuthHeaders();
          if (!headers || !user?.id) return;
          try {
            const data = await fetchJson(`${API_ROOT}/users/${user.id}/convocatorias`, headers);
            if (Array.isArray(data) && data.length > 0) {
              setConvocatoriasAsignadas(data);
              if (data.length === 1) {
                setSelectedConvocatoriaId(data[0].IDCONVOCATORIA);
                guardarConvocatoriaSeleccionada(data[0].IDCONVOCATORIA);
              }
            }
          } catch (error) {
            console.error('Error fetching user convocatorias:', error);
          }
        };
        fetchUserConvocatorias();
      }
    }
  }, [user]);

  // Cargar postulantes registrados desde Mesa de Partes (tramite)
  const fetchPostulantesEscaneados = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      // Obtener postulantes registrados desde la tabla postulantes_registrados
      const response = await fetchJson(`${API_ROOT}/documentos/postulantes-registrados`, headers);
      
      // El backend devuelve { success: true, postulantes: [...] }
      const postulantesData = response?.postulantes || response || [];
      const postulantesArray = Array.isArray(postulantesData) ? postulantesData : [];
      
      // Mapear postulantes registrados a formato esperado
      const postulantesMap = postulantesArray.map((p: any) => {
        // Obtener información de la convocatoria si existe
        const convocatoriaId = p.convocatoriaId ? Number(p.convocatoriaId) : null;
        
        // Determinar el estado: si tiene SIGEA asignado, está "Registrado"
        // Si viene un estado del backend, usarlo; si no, determinar según SIGEA
        let estadoFinal = p.estado || 'Pendiente';
        if (p.expedienteSIGEA && p.expedienteSIGEA.trim() !== '') {
          // Si tiene SIGEA, está registrado
          estadoFinal = 'Registrado';
        } else if (!p.estado || p.estado === 'Pendiente') {
          // Si no tiene estado o es Pendiente y no tiene SIGEA, mantener Pendiente
          estadoFinal = 'Pendiente';
        }
        
        return {
          id: p.id || null,
          nombreCompleto: p.nombreCompleto || 'N/A',
          email: p.email || 'N/A',
          dni: p.dni || 'N/A',
          telefono: p.telefono || 'N/A',
          puesto: p.puesto || 'N/A',
          area: p.area || 'N/A',
          numeroCAS: p.numeroCAS || 'N/A',
          convocatoriaId: convocatoriaId,
          certificado: p.certificadoId || 'N/A',
          fechaRegistro: p.fechaRegistro || p.fechaActualizacion || new Date().toISOString(),
          estado: estadoFinal,
          expedienteSIGEA: p.expedienteSIGEA || '',
          // Información adicional
          apellidoPaterno: p.apellidoPaterno || '',
          apellidoMaterno: p.apellidoMaterno || '',
        };
      });
      
      // Filtrar por convocatoria seleccionada si hay una
      let postulantesFiltrados = postulantesMap;
      if (selectedConvocatoriaId) {
        postulantesFiltrados = postulantesMap.filter((p: any) => {
          const convId = p.convocatoriaId;
          return convId && (Number(convId) === Number(selectedConvocatoriaId) || String(convId) === String(selectedConvocatoriaId));
        });
      }
      
      // Ordenar por fecha de registro (más recientes primero)
      postulantesFiltrados.sort((a: any, b: any) => {
        const dateA = new Date(a.fechaRegistro).getTime();
        const dateB = new Date(b.fechaRegistro).getTime();
        return dateB - dateA;
      });
      
      setPostulantesEscaneados(postulantesFiltrados);
      console.log('✅ Postulantes registrados desde Mesa de Partes cargados:', postulantesFiltrados.length);
    } catch (error) {
      console.error('Error fetching postulantes registrados:', error);
      setPostulantesEscaneados([]);
      toast.error('⚠️ No se pudieron cargar los postulantes registrados');
    }
  };

  useEffect(() => {
    fetchStatsCardsData();
    fetchMonthlyData();
    fetchConvocatoriasChartData();
    fetchGruposComite(); // Cargar grupos de comité
    fetchPostulantesEscaneados(); // Cargar postulantes registrados desde Mesa de Partes
  }, [user, selectedConvocatoriaId]); // Recargar cuando cambie la convocatoria seleccionada
  
  // Recargar gráficos cuando cambien los postulantes (para actualizar datos en tiempo real)
  useEffect(() => {
    if (postulantesEscaneados.length > 0) {
      fetchMonthlyData();
      fetchConvocatoriasChartData();
    }
  }, [postulantesEscaneados.length]); // Recargar cuando cambie el número de postulantes

  return (
    <ComiteLayout>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#ffffff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <div className="w-full px-4 py-8"> {/* Adjusted width to w-full */}
        {/* Header con animación */}
        <div className="flex justify-between items-center mb-8">
          <div className="magic-bento-container flex-1">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent animate-gradient">
              Evaluación de CVs
            </h1>
            {/* Selector de Convocatorias (solo si hay múltiples) */}
            {convocatoriasAsignadas.length > 1 && (
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>
                  Seleccionar Convocatoria:
                </label>
                <select
                  value={selectedConvocatoriaId || ''}
                  onChange={(e) => {
                    const convId = e.target.value ? Number(e.target.value) : null;
                    setSelectedConvocatoriaId(convId);
                    guardarConvocatoriaSeleccionada(convId);
                  }}
                  className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500`}
                >
                  <option value="">Seleccione una convocatoria</option>
                  {convocatoriasAsignadas.map((conv: any) => (
                    <option key={conv.IDCONVOCATORIA} value={conv.IDCONVOCATORIA}>
                      {conv.puesto} - {conv.area} (CAS: {conv.numeroCAS})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Mostrar convocatoria actual si hay una seleccionada */}
            {selectedConvocatoriaId && convocatoriasAsignadas.length > 0 && (
              <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-blue-50 border border-blue-200'}`}>
                {(() => {
                  const selectedConv = convocatoriasAsignadas.find((c: any) => c.IDCONVOCATORIA === selectedConvocatoriaId);
                  if (!selectedConv) return null;
                  return (
                    <>
                      <p className={`text-sm font-semibold ${textPrimary}`}>
                        Convocatoria Actual: <span className="text-cyan-400">{selectedConv.puesto}</span>
                      </p>
                      <p className={`text-xs ${textSecondary} mt-1`}>
                        {selectedConv.area} • CAS: {selectedConv.numeroCAS}
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
            <div className="magic-bento-text relative group cursor-pointer overflow-hidden"
                 onMouseEnter={(e) => {
                   const particles = e.currentTarget.querySelectorAll('.magic-particle');
                   particles.forEach((particle, i) => {
                     setTimeout(() => {
                       particle.classList.add('animate-pulse');
                       particle.classList.add('animate-bounce');
                     }, i * 100);
                   });
                 }}
                 onMouseLeave={(e) => {
                   const particles = e.currentTarget.querySelectorAll('.magic-particle');
                   particles.forEach((particle) => {
                     particle.classList.remove('animate-pulse');
                     particle.classList.remove('animate-bounce');
                   });
                 }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-cyan-500/20 to-transparent blur-xl animate-pulse"></div>
              </div>
              
              <div className="relative flex items-center gap-2 px-4 py-2">
                {Array.from({ length: 12 }, (_, i) => (
                  <div
                    key={i}
                    className="magic-particle absolute w-1 h-1 bg-purple-500 rounded-full opacity-60 transition-all duration-300"
                    style={{
                      left: `${10 + (i * 7)}%`,
                      top: `${20 + Math.sin(i) * 20}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
                
                <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent font-medium group-hover:scale-105 transition-transform duration-300">
                  Panel de Control Avanzado
                </span>
              </div>
            </div>
          </div>
          
          {/* Botón de Debug */}
          <button
            onClick={async () => {
              console.log("🔍 Iniciando debug de datos...");
              try {
                const headers = getAuthHeaders();
                if (!headers) {
                  console.error("❌ No hay headers de autenticación");
                  return;
                }
                
                console.log("🔍 Probando endpoint de stats...");
                const statsData = await fetchJson(`${API_ROOT}/reports/stats`, headers);
                console.log("📊 Stats Data:", statsData);
                
                console.log("🔍 Probando endpoint de documentos...");
                const docsData = await fetchJson(`${API_ROOT}/documentos/estadisticas`, headers);
                console.log("📄 Docs Data:", docsData);
                
                console.log("🔍 Probando endpoints de gráficos...");
                const monthlyData = await fetchJson(`${API_ROOT}/reports/chart-data-monthly`, headers);
                console.log("📊 Monthly Chart Data:", monthlyData);
                
                const statusData = await fetchJson(`${API_ROOT}/reports/chart-data-status`, headers);
                console.log("📊 Status Chart Data:", statusData);
                
                alert(`✅ Debug completado. Revisa la consola para ver todos los datos.`);
              } catch (error) {
                console.error("❌ Error en debug:", error);
                alert(`❌ Error en debug: ${error instanceof Error ? error.message : 'Error desconocido'}`);
              }
            }}
            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-all border border-yellow-500/30 text-sm"
          >
            🔍 Debug Datos
          </button>
        </div>

        {/* Postulantes registrados desde Mesa de Partes */}
        <div className={`bg-gradient-to-br ${isDark ? 'from-gray-900/60 to-slate-900/20 border-slate-500/30 hover:border-slate-400/50 hover:shadow-slate-500/10' : 'from-white to-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-blue-200/40'} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 hover:shadow-2xl mb-8`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-xl font-bold ${textPrimary}`}>Postulantes Registrados (Mesa de Partes)</h3>
              <span className={`text-xs ${textSecondary}`}>
                {selectedConvocatoriaId 
                  ? `Filtrados por convocatoria seleccionada (${postulantesEscaneados.length} registros)`
                  : `Todos los postulantes registrados desde Mesa de Partes (${postulantesEscaneados.length} registros)`
                }
              </span>
            </div>
            <button
              onClick={fetchPostulantesEscaneados}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${isDark ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30' : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200'}`}
            >
              🔄 Actualizar
            </button>
          </div>
          {postulantesEscaneados.length === 0 ? (
            <div className={`${textSecondary} text-sm text-center py-8`}>
              {selectedConvocatoriaId 
                ? 'No hay postulantes registrados para esta convocatoria.'
                : 'No hay postulantes registrados aún. Los datos aparecerán cuando se registren postulantes desde Mesa de Partes.'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b-2 ${isDark ? 'border-slate-700 bg-slate-800/50 text-gray-200' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 text-slate-700'}`}>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Nombre Completo</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">DNI</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Email</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Teléfono</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Puesto</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Área</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">SIGEA</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Convocatoria</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Grupo Comité</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Certificado</th>
                    <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {postulantesEscaneados.map((p, index) => {
                    // Obtener información de la convocatoria
                    const convocatoriaInfo = p.convocatoriaId 
                      ? convocatoriasAsignadas.find((c: any) => c.IDCONVOCATORIA === p.convocatoriaId)
                      : null;
                    const convocatoriaTexto = convocatoriaInfo 
                      ? `${convocatoriaInfo.puesto || 'N/A'} - ${convocatoriaInfo.area || 'N/A'}`
                      : p.convocatoriaId 
                        ? `ID: ${p.convocatoriaId}`
                        : 'Sin asignar';
                    
                    // Encontrar el grupo de comité al que pertenece esta convocatoria
                    const grupoComite = encontrarGrupoDeConvocatoria(p.convocatoriaId);
                    const grupoNombre = grupoComite?.nombre || 'Sin grupo asignado';
                    
                    return (
                      <tr key={p.id || index} className={`border-t transition-all duration-200 ${isDark ? 'border-slate-700/50 hover:bg-slate-800/40 hover:shadow-lg' : 'border-blue-100 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-cyan-50/40 hover:shadow-md'}`}>
                        <td className={`py-3 px-4 ${textPrimary} font-semibold`}>
                          <div className="flex flex-col">
                            <span>{p.nombreCompleto || '—'}</span>
                            {(p.apellidoPaterno || p.apellidoMaterno) && (
                              <span className={`text-xs ${textSecondary} mt-0.5 font-normal`}>
                                {p.apellidoPaterno || ''} {p.apellidoMaterno || ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`py-3 px-4 ${textSecondary} font-mono text-sm`}>{p.dni || '—'}</td>
                        <td className={`py-3 px-4 ${textSecondary} text-sm`}>{p.email || '—'}</td>
                        <td className={`py-3 px-4 ${textSecondary} font-mono text-sm`}>{p.telefono || '—'}</td>
                        <td className={`py-3 px-4 ${textSecondary} font-medium`}>{p.puesto || '—'}</td>
                        <td className={`py-3 px-4 ${textSecondary}`}>{p.area || '—'}</td>
                        <td className={`py-3 px-4 ${textSecondary}`}>
                          {p.expedienteSIGEA && p.expedienteSIGEA.trim() !== '' ? (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono inline-flex items-center gap-1.5 ${isDark ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200 shadow-sm'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                              {p.expedienteSIGEA}
                            </span>
                          ) : (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 ${isDark ? 'bg-gray-800/40 text-gray-400 border border-gray-700/50' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                              <span className="text-[10px]">⏳</span>
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td className={`py-3 px-4 ${textSecondary}`}>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center ${isDark ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 shadow-sm' : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200 shadow-sm'}`}>
                            📋 {convocatoriaTexto}
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${textSecondary}`}>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 ${isDark ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10' : 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200 shadow-sm'}`} title={`Grupo de comité: ${grupoNombre}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            {grupoNombre}
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${textSecondary}`}>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium inline-flex items-center ${isDark ? 'bg-slate-700/50 text-slate-300 border border-slate-600' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
                            🔖 {p.certificado || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border ${
                            p.estado === 'Registrado' || p.estado === 'registrado'
                              ? (isDark ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 shadow-sm shadow-green-500/10' : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 shadow-sm')
                              : p.estado === 'Rechazado' || p.estado === 'rechazado'
                              ? (isDark ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-300 border-red-500/30 shadow-sm shadow-red-500/10' : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200 shadow-sm')
                              : (isDark ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30 shadow-sm shadow-yellow-500/10' : 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200 shadow-sm')
                          }`}>
                            {p.estado === 'Registrado' || p.estado === 'registrado' ? '✓' : p.estado === 'Rechazado' || p.estado === 'rechazado' ? '✗' : '⏳'} {p.estado || 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* Stats Cards con animación */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`bg-gradient-to-br ${isDark ? 'from-cyan-900/40 to-blue-900/30 border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-cyan-500/20' : 'from-white to-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-blue-200/40'} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 hover:shadow-2xl hover:scale-105 group`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-all group-hover:scale-110">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-sm flex items-center gap-1 font-medium text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                +12%
              </span>
            </div>
            <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-cyan-700'} transition-colors`}>{statsData.totalRegistradosApp ?? statsData.totalPostulantes}</div>
            <div className={`text-xs ${isDark ? 'text-cyan-300' : 'text-cyan-700'} mb-1`}>Postulantes Registrados</div>
            <div className={`text-xs ${textSecondary}`}>
              {statsData.registradosAppHoy ? `${statsData.registradosAppHoy} registrados hoy` : 'Registrados desde la app'}
            </div>
          </div>

          <div className={`bg-gradient-to-br ${isDark ? 'from-purple-900/40 to-pink-900/30 border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/20' : 'from-white to-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-blue-200/40'} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 hover:shadow-2xl hover:scale-105 group`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all group-hover:scale-110">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm flex items-center gap-1 font-medium text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                +8%
              </span>
            </div>
            <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white group-hover:text-purple-300' : 'text-slate-900 group-hover:text-purple-700'} transition-colors`}>{statsData.totalCVs}</div>
            <div className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-700'} mb-1`}>CVs Enviados</div>
            <div className={`text-xs ${textSecondary}`}>Documentos recibidos</div>
          </div>

          <div className={`bg-gradient-to-br ${isDark ? 'from-blue-900/40 to-indigo-900/30 border-blue-500/30 hover:border-blue-400/50 hover:shadow-blue-500/20' : 'from-white to-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-blue-200/40'} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 hover:shadow-2xl hover:scale-105 group`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-all group-hover:scale-110">
                <Paperclip className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm flex items-center gap-1 font-medium text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                +15%
              </span>
            </div>
            <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'} transition-colors`}>{statsData.totalAnexos}</div>
            <div className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'} mb-1`}>Anexos Enviados</div>
            <div className={`text-xs ${textSecondary}`}>Documentos adicionales</div>
          </div>

          <div className={`bg-gradient-to-br ${isDark ? 'from-emerald-900/40 to-teal-900/30 border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/20' : 'from-white to-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-blue-200/40'} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 hover:shadow-2xl hover:scale-105 group`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all group-hover:scale-110">
                <Briefcase className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-sm flex items-center gap-1 font-medium text-emerald-400">
                <Activity className="w-3 h-3" />
                Activas
              </span>
            </div>
            <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white group-hover:text-emerald-300' : 'text-slate-900 group-hover:text-emerald-700'} transition-colors`}>{statsData.totalConvocatoriasActivas}</div>
            <div className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mb-1`}>Convocatorias</div>
            <div className={`text-xs ${textSecondary}`}>Ofertas laborales</div>
          </div>
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de líneas - Tendencia mensual */}
          <div className={`bg-gradient-to-br ${isDark ? 'from-gray-900/60 to-cyan-900/20 border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-cyan-500/20' : 'from-white to-blue-50 border-blue-200 hover:border-blue-300 hover:shadow-blue-200/40'} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 hover:shadow-2xl`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className={`text-xl font-bold ${textPrimary}`}>Tendencia de Postulantes</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div>No hay datos disponibles</div>
                    <div className="text-sm">Los datos aparecerán cuando haya información en la base de datos</div>
                  </div>
                </div>
              ) : (
                <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorPostulantes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
                <XAxis dataKey="mes" stroke={isDark ? '#94a3b8' : '#334155'} />
                <YAxis stroke={isDark ? '#94a3b8' : '#334155'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    color: isDark ? '#ffffff' : '#0f172a'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="postulantes" stroke="#06b6d4" fillOpacity={1} fill="url(#colorPostulantes)" name="Postulantes" />
              </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Gráfico de barras horizontales - Postulantes por puesto (movido a la derecha) */}
          <div className={`bg-gradient-to-br ${isDark ? 'from-gray-900/60 to-emerald-900/20' : 'from-emerald-50 to-white'} backdrop-blur-xl rounded-2xl p-6 border ${isDark ? 'border-emerald-500/30 hover:border-emerald-400/50' : 'border-emerald-200'} transition-all duration-500 hover:shadow-2xl ${isDark ? 'hover:shadow-emerald-500/20' : 'hover:shadow-emerald-200/40'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Briefcase className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Postulantes por Puesto</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {convocatoriasChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💼</div>
                    <div>No hay datos disponibles</div>
                    <div className="text-sm">Los datos aparecerán cuando haya convocatorias activas en la base de datos</div>
                  </div>
                </div>
              ) : (
                <BarChart data={convocatoriasChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.4} />
                <XAxis type="number" stroke={isDark ? '#94a3b8' : '#334155'} />
                <YAxis dataKey="puesto" type="category" stroke={isDark ? '#94a3b8' : '#334155'} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    color: isDark ? '#ffffff' : '#0f172a'
                  }}
                />
                <Bar dataKey="postulantes" fill="#10b981" radius={[0, 8, 8, 0]} animationBegin={0} animationDuration={800} />
              </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ComiteLayout>
  );
};

export default CVEvaluationDashboard;