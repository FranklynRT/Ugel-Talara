import { useState, useEffect, ReactNode } from 'react'; // Added useEffect
import { FileText, Star, Check, X, Search, Eye, ChevronLeft, FileSpreadsheet, Archive, History, CheckSquare, Square } from 'lucide-react';
import ComiteLayout from '@/layouts/ComiteLayout';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';

// Using centralized API config  
import { API_BASE_URL } from '@/lib/api';

interface Candidate {
  id: number;
  name: string;
  position: string;
  experience: string;
  skills: string[];
  rating: number | string;
  status: "pending" | "approved" | "rejected";
  email: string;
  pdfUrl: string;
  curriculumDetails?: any;
  qrData?: any;
  curriculumName?: string;
  curriculumId?: number;
  score?: number; // 1-100
  aiScore?: number; // Nota calculada por IA (1-100)
  aiSummary?: string; // Resumen devuelto por IA
  // Datos adicionales del postulante
  dni?: string;
  telefono?: string;
  area?: string;
  expedienteSIGEA?: string;
  certificadoId?: string;
  convocatoriaId?: number;
  anexoId?: number;
  // Calificaciones por categoría
  notaColegioProfesional?: number;
  notaFormacionAcademica?: number;
  notaIdiomas?: number;
  notaOfimatica?: number;
  notaEspecializacion?: number;
  notaExperienciaLaboral?: number;
  notaReferenciasLaborales?: number;
  // Datos del anexo para mostrar información
  anexoData?: {
    colegioProfesional?: string;
    nColegiatura?: string;
    formacionAcademica?: any[];
    idiomas?: any[];
    ofimatica?: any[];
    especializacion?: any[];
    experienciaLaboral?: any[];
    referenciasLaborales?: any[];
  };
  // Fecha de archivado (para historial)
  fechaArchivado?: string;
}


export default function CVEvaluator() {
  const { logout, user } = useAuth(); // Get logout and user from AuthContext
  const [candidates, setCandidates] = useState<Candidate[]>([]); // Initialized as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Candidate['status']>("all");
  const [viewingCV, setViewingCV] = useState<Candidate | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  const [showHistorial, setShowHistorial] = useState(false);
  
  // Tema oscuro/claro dinámico
  const [theme, setTheme] = useState<'dark' | 'light'>((document.documentElement.dataset.theme as 'dark' | 'light') || (localStorage.getItem('comite-theme') as 'dark' | 'light') || 'dark');
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

  // Persistencia local de puntajes (se mantiene tras recargar)
  const SCORES_KEY = 'comite-scores';
  const CATEGORY_SCORES_KEY = 'comite-category-scores';
  const ARCHIVED_KEY = 'comite-archived-candidates';
  
  const getSavedScores = (): Record<string, number> => {
    try { return JSON.parse(localStorage.getItem(SCORES_KEY) || '{}'); } catch { return {}; }
  };
  
  const getSavedCategoryScores = (): Record<string, {
    notaColegioProfesional?: number;
    notaFormacionAcademica?: number;
    notaIdiomas?: number;
    notaOfimatica?: number;
    notaEspecializacion?: number;
    notaExperienciaLaboral?: number;
    notaReferenciasLaborales?: number;
  }> => {
    try { return JSON.parse(localStorage.getItem(CATEGORY_SCORES_KEY) || '{}'); } catch { return {}; }
  };
  
  const getArchivedCandidates = (): Candidate[] => {
    try {
      const archived = localStorage.getItem(ARCHIVED_KEY);
      return archived ? JSON.parse(archived) : [];
    } catch {
      return [];
    }
  };
  
  const saveArchivedCandidates = (archived: Candidate[]) => {
    localStorage.setItem(ARCHIVED_KEY, JSON.stringify(archived));
  };
  
  const saveScores = (scores: Record<string, number>) => {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  };
  
  const saveCategoryScores = (scores: Record<string, any>) => {
    localStorage.setItem(CATEGORY_SCORES_KEY, JSON.stringify(scores));
  };
  
  const saveAllCurrentScores = () => {
    const map: Record<string, number> = {};
    candidates.forEach(c => {
      const s = typeof c.score === 'number' ? c.score : (typeof c.rating === 'number' ? c.rating : 0);
      if (s > 0) map[String(c.id)] = s;
    });
    saveScores(map);
    toast.success('Puntajes guardados exitosamente', {
      icon: '✅',
      duration: 3000,
    });
  };
  
  const saveCandidateScore = (id: number) => {
    const map = getSavedScores();
    const c = candidates.find(x => x.id === id);
    if (!c) return;
    const s = typeof c.score === 'number' ? c.score : (typeof c.rating === 'number' ? c.rating : 0);
    if (s > 0) {
      map[String(id)] = s;
      saveScores(map);
      toast.success(`Puntaje de ${c.name} guardado (${s}/100)`, {
        icon: '✅',
        duration: 3000,
      });
    }
  };
  
  const saveCategoryScore = (candidateId: number, category: string, score: number) => {
    const categoryScores = getSavedCategoryScores();
    const candidateKey = String(candidateId);
    if (!categoryScores[candidateKey]) {
      categoryScores[candidateKey] = {};
    }
    categoryScores[candidateKey][category as keyof typeof categoryScores[typeof candidateKey]] = score;
    saveCategoryScores(categoryScores);
    
    // Actualizar el estado local del candidato
    setCandidates(prevCandidates =>
      prevCandidates.map(c =>
        c.id === candidateId ? { ...c, [category]: score } : c
      )
    );
    
    // Si estamos viendo el CV, actualizar también
    if (viewingCV && viewingCV.id === candidateId) {
      setViewingCV({ ...viewingCV, [category]: score });
    }
  };

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
      'Accept': 'application/json'
    } as const;
  };

  const fetchApplicantsWithCVs = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Frontend: Obteniendo postulantes registrados desde Mesa de Partes...");
      
      // IMPORTANTE: Obtener las convocatorias asignadas al grupo del usuario actual
      let convocatoriasAsignadasAlGrupo: number[] = [];
      
      if (user?.convocatoriasAsignadas && Array.isArray(user.convocatoriasAsignadas)) {
        // Extraer los IDs de las convocatorias asignadas al grupo
        convocatoriasAsignadasAlGrupo = user.convocatoriasAsignadas
          .map((conv: any) => conv.IDCONVOCATORIA || conv.id || conv.convocatoriaId)
          .filter((id: any) => id !== null && id !== undefined)
          .map((id: any) => Number(id));
        
        console.log("✅ Convocatorias asignadas al grupo del usuario:", convocatoriasAsignadasAlGrupo);
        
        if (convocatoriasAsignadasAlGrupo.length === 0) {
          console.warn("⚠️ El usuario no tiene convocatorias asignadas a su grupo. No se mostrarán postulantes.");
          setCandidates([]);
          setLoading(false);
          return;
        }
      } else {
        // Si no hay convocatorias asignadas en el usuario, intentar obtenerlas desde la API
        try {
          const gruposResponse = await fetch(`${API_BASE_URL}/grupos-comite`, { headers });
          if (gruposResponse.ok) {
            const grupos = await gruposResponse.json();
            const gruposArray = Array.isArray(grupos) ? grupos : [];
            
            // Buscar el grupo del usuario actual
            const userId = user?.id || user?.IDUSUARIO;
            if (userId) {
              for (const grupo of gruposArray) {
                // Verificar si el usuario pertenece a este grupo
                try {
                  const grupoDetalleResponse = await fetch(`${API_BASE_URL}/grupos-comite/${grupo.id || grupo.IDGRUPO}`, { headers });
                  if (grupoDetalleResponse.ok) {
                    const grupoDetalle = await grupoDetalleResponse.json();
                    const usuariosGrupo = grupoDetalle.usuarios || [];
                    const usuarioEnGrupo = usuariosGrupo.find((u: any) => 
                      (u.IDUSUARIO || u.id) === userId
                    );
                    
                    if (usuarioEnGrupo) {
                      // Este es el grupo del usuario, obtener sus convocatorias
                      const convocatoriasGrupo = grupoDetalle.convocatorias || [];
                      convocatoriasAsignadasAlGrupo = convocatoriasGrupo
                        .map((conv: any) => conv.IDCONVOCATORIA || conv.id || conv.convocatoriaId)
                        .filter((id: any) => id !== null && id !== undefined)
                        .map((id: any) => Number(id));
                      
                      console.log(`✅ Usuario pertenece al grupo "${grupo.nombre || grupoDetalle.nombre}" con ${convocatoriasAsignadasAlGrupo.length} convocatoria(s) asignada(s)`);
                      break;
                    }
                  }
                } catch (err) {
                  console.warn(`Error al obtener detalles del grupo ${grupo.id}:`, err);
                }
              }
            }
          }
        } catch (error) {
          console.warn('Error al obtener grupos de comité:', error);
        }
        
        if (convocatoriasAsignadasAlGrupo.length === 0) {
          console.warn("⚠️ No se pudieron obtener las convocatorias asignadas al grupo del usuario.");
          setCandidates([]);
          setLoading(false);
          return;
        }
      }
      
      // Obtener postulantes registrados desde Mesa de Partes
      let apiData: any[] = [];
      try {
        const response = await fetch(`${API_BASE_URL}/documentos/postulantes-registrados`, { headers });
        if (response.ok) {
          const data = await response.json();
          const postulantesData = data?.postulantes || data || [];
          apiData = Array.isArray(postulantesData) ? postulantesData : [];
          console.log("✅ Postulantes registrados obtenidos (antes de filtrar):", apiData.length);
          
          // FILTRAR: Solo mostrar postulantes de las convocatorias asignadas al grupo
          apiData = apiData.filter((postulante: any) => {
            const postulanteConvocatoriaId = postulante.convocatoriaId 
              ? Number(postulante.convocatoriaId) 
              : null;
            
            // Si el postulante tiene convocatoriaId, verificar que esté en la lista de convocatorias asignadas
            if (postulanteConvocatoriaId) {
              const estaAsignada = convocatoriasAsignadasAlGrupo.includes(postulanteConvocatoriaId);
              if (!estaAsignada) {
                console.log(`⚠️ Postulante ${postulante.nombreCompleto} tiene convocatoria ${postulanteConvocatoriaId} que NO está asignada al grupo del usuario`);
              }
              return estaAsignada;
            }
            
            // Si no tiene convocatoriaId, intentar obtenerlo desde el anexo
            // Por ahora, excluirlo si no tiene convocatoriaId (para ser estricto)
            // O podríamos intentar obtenerlo desde el anexo más adelante
            return false;
          });
          
          console.log(`✅ Postulantes filtrados por convocatorias del grupo (${convocatoriasAsignadasAlGrupo.length} convocatoria(s)):`, apiData.length);
        }
      } catch (error) {
        console.error('Error al obtener postulantes registrados:', error);
      }

      // Si no hay datos, intentar desde verificaciones QR como fallback
      if (!apiData || apiData.length === 0) {
      try {
        const qrResponse = await fetch(`${API_BASE_URL}/documentos/verificaciones-sesion-comite`, { headers });
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          if (qrData.verificaciones && qrData.verificaciones.length > 0) {
            let qrDataArray = qrData.verificaciones.map((verificacion: any, index: number) => {
              const v = verificacion || {};
              const datosV = v.datosVerificados || {};
              const datosQR = v.datosQR || {};
              return {
                  id: v.id || index + 1,
                  nombreCompleto: datosV.nombreCompleto || datosQR.postulante || 'Sin nombre',
                  email: datosV.email || datosQR.email || '',
                  puesto: datosV.puesto || datosQR.puesto || 'Sin puesto',
                  area: datosV.area || datosQR.area || '',
                  dni: datosV.dni || datosQR.dni || '',
                  telefono: datosV.telefono || datosQR.telefono || '',
                  expedienteSIGEA: datosV.expedienteSIGEA || '',
                  certificadoId: datosQR.certificado || '',
                  curriculumId: datosQR.curriculumId || null,
                  convocatoriaId: datosQR.convocatoriaId || datosV.convocatoriaId || null,
                  estado: datosV.estado || 'Pendiente',
                  qrData: verificacion
                };
              });
            
            // FILTRAR: Solo mostrar verificaciones de las convocatorias asignadas al grupo
            if (convocatoriasAsignadasAlGrupo.length > 0) {
              qrDataArray = qrDataArray.filter((item: any) => {
                const itemConvocatoriaId = item.convocatoriaId ? Number(item.convocatoriaId) : null;
                if (itemConvocatoriaId) {
                  return convocatoriasAsignadasAlGrupo.includes(itemConvocatoriaId);
                }
                return false;
              });
            }
            
            apiData = qrDataArray;
            console.log(`✅ Verificaciones QR filtradas por convocatorias del grupo:`, apiData.length);
            }
          }
        } catch (qrError) {
          console.log("No hay verificaciones QR disponibles");
        }
      }

      // Enriquecer con datos de curriculum
      const formattedCandidates: Candidate[] = (await Promise.all(
        apiData.map(async (postulante: any) => {
          let pdfUrl: string | null = null;
          let curriculumName: string | undefined = undefined;
          let curriculumDetails: any = null;

          // Si tiene curriculumId, obtener el curriculum
          if (postulante.curriculumId) {
            try {
              // Intentar descargar el curriculum
              const curriculumResponse = await fetch(
                `${API_BASE_URL}/documentos/curriculum/${postulante.curriculumId}/download`,
                { headers }
              );
              if (curriculumResponse.ok) {
                const blob = await curriculumResponse.blob();
                pdfUrl = URL.createObjectURL(blob);
                curriculumName = `CV_${postulante.nombreCompleto || 'postulante'}.pdf`;
                curriculumDetails = { IDCURRICULUM: postulante.curriculumId };
                console.log(`✅ Curriculum ${postulante.curriculumId} descargado para ${postulante.nombreCompleto}`);
              }
            } catch (err) {
              console.warn(`⚠️ No se pudo descargar curriculum ${postulante.curriculumId}:`, err);
              // Si no se puede descargar, al menos establecer el nombre
              curriculumName = `CV_${postulante.nombreCompleto || 'postulante'}.pdf`;
              curriculumDetails = { IDCURRICULUM: postulante.curriculumId };
            }
          } else {
            // Si no tiene curriculumId en postulante, intentar buscar por DNI
            if (postulante.dni) {
              try {
                // Buscar usuario por DNI y obtener su curriculum
                const userResponse = await fetch(
                  `${API_BASE_URL}/users?documento=${postulante.dni}`,
                  { headers }
                );
                if (userResponse.ok) {
                  const users = await userResponse.json();
                  const userArray = Array.isArray(users) ? users : [];
                  if (userArray.length > 0) {
                    const userId = userArray[0].IDUSUARIO || userArray[0].id;
                    // Obtener curriculum del usuario
                    const curriculumInfoResponse = await fetch(
                      `${API_BASE_URL}/documentos/curriculum`,
                      { headers }
                    );
                    if (curriculumInfoResponse.ok) {
                      const curriculums = await curriculumInfoResponse.json();
                      const curriculumArray = Array.isArray(curriculums) ? curriculums : [];
                      const curriculum = curriculumArray.find((c: any) => 
                        c.IDUSUARIO === userId || c.id === userId
                      );
                      if (curriculum) {
                        curriculumName = curriculum.nombreArchivo || `CV_${postulante.nombreCompleto || 'postulante'}.pdf`;
                        curriculumDetails = curriculum;
                        // Intentar descargar
                        try {
                          const downloadResponse = await fetch(
                            `${API_BASE_URL}/documentos/curriculum/${curriculum.IDCURRICULUM || curriculum.id}/download`,
                            { headers }
                          );
                          if (downloadResponse.ok) {
                            const blob = await downloadResponse.blob();
                            pdfUrl = URL.createObjectURL(blob);
              }
            } catch (e) {
                          console.warn('No se pudo descargar el curriculum encontrado:', e);
                        }
                      }
            }
          }
        }
              } catch (err) {
                console.warn('No se pudo buscar curriculum por DNI:', err);
              }
            }
      }
      
          // Determinar estado según SIGEA y estado
          let status: "pending" | "approved" | "rejected" = "pending";
          if (postulante.expedienteSIGEA && postulante.expedienteSIGEA.trim() !== '') {
            status = "approved";
          } else if (postulante.estado) {
            const estado = postulante.estado.toString().toLowerCase();
            if (estado === 'registrado' || estado === 'aprobado') {
              status = "approved";
            } else if (estado === 'rechazado') {
              status = "rejected";
            }
          }

        return {
            id: postulante.id || parseInt(String(postulante.certificadoId || '0').replace(/\D/g, '')) || Date.now(),
            name: postulante.nombreCompleto || 'Sin nombre',
            position: postulante.puesto || 'Sin puesto',
            experience: postulante.experience || 'No especificada',
            skills: [],
            rating: status === 'approved' ? 'aprobado' : status === 'rejected' ? 'desaprobado' : 'pendiente',
            status: status,
            email: postulante.email || '',
            pdfUrl: pdfUrl,
            curriculumDetails: curriculumDetails || postulante.qrData,
            curriculumName: curriculumName,
            curriculumId: postulante.curriculumId ? (typeof postulante.curriculumId === 'number' ? postulante.curriculumId : parseInt(postulante.curriculumId)) : undefined,
            score: 0,
            // Datos adicionales
            dni: (postulante.dni && postulante.dni !== 'N/A') ? postulante.dni : '',
            telefono: (postulante.telefono && postulante.telefono !== 'N/A') ? postulante.telefono : '',
            area: (postulante.area && postulante.area !== 'N/A') ? postulante.area : '',
            expedienteSIGEA: (postulante.expedienteSIGEA && postulante.expedienteSIGEA !== 'N/A' && postulante.expedienteSIGEA.trim() !== '') ? postulante.expedienteSIGEA : '',
            certificadoId: (postulante.certificadoId && postulante.certificadoId !== 'N/A') ? postulante.certificadoId : '',
            convocatoriaId: postulante.convocatoriaId ? (typeof postulante.convocatoriaId === 'number' ? postulante.convocatoriaId : parseInt(postulante.convocatoriaId)) : undefined,
            anexoId: postulante.anexoId ? (typeof postulante.anexoId === 'number' ? postulante.anexoId : parseInt(postulante.anexoId)) : undefined,
        } as Candidate;
        })
      )).filter((c): c is Candidate => c !== null); // Filtrar nulls (postulantes excluidos)

      // Eliminar duplicados (mismo ID o mismo email) priorizando registros con estado no pending y con CV
      const pickScore = (c: Candidate) => (c.status !== 'pending' ? 2 : 0) + (c.pdfUrl ? 1 : 0);
      const uniqueMap = new Map<string | number, Candidate>();
      for (const c of formattedCandidates) {
        const key = (typeof c.id === 'number' && c.id) ? c.id : (c.email ? c.email.toLowerCase() : c.name.toLowerCase());
        const prev = uniqueMap.get(key);
        if (!prev || pickScore(c) > pickScore(prev)) {
          uniqueMap.set(key, c);
        }
      }
      const uniqueCandidates = Array.from(uniqueMap.values());
      // Aplicar puntajes guardados (persistencia)
      const saved = getSavedScores();
      const savedCategoryScores = getSavedCategoryScores();
      const merged = uniqueCandidates.map(c => {
        const candidateKey = String(c.id);
        const savedScore = saved[candidateKey];
        const categoryScores = savedCategoryScores[candidateKey] || {};
        
        const candidateWithScores: Candidate = {
          ...c,
          ...(typeof savedScore === 'number' && savedScore > 0 ? { score: savedScore, rating: savedScore } : {}),
          ...(categoryScores.notaColegioProfesional ? { notaColegioProfesional: categoryScores.notaColegioProfesional } : {}),
          ...(categoryScores.notaFormacionAcademica ? { notaFormacionAcademica: categoryScores.notaFormacionAcademica } : {}),
          ...(categoryScores.notaIdiomas ? { notaIdiomas: categoryScores.notaIdiomas } : {}),
          ...(categoryScores.notaOfimatica ? { notaOfimatica: categoryScores.notaOfimatica } : {}),
          ...(categoryScores.notaEspecializacion ? { notaEspecializacion: categoryScores.notaEspecializacion } : {}),
          ...(categoryScores.notaExperienciaLaboral ? { notaExperienciaLaboral: categoryScores.notaExperienciaLaboral } : {}),
          ...(categoryScores.notaReferenciasLaborales ? { notaReferenciasLaborales: categoryScores.notaReferenciasLaborales } : {}),
        };
        
        return candidateWithScores;
      });
      setCandidates(merged);

    } catch (error) {
      console.error("Error fetching candidates with CVs:", error);
      setError("Error al cargar los candidatos. Por favor, intenta nuevamente.");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchApplicantsWithCVs();
  }, [user]); // Re-fetch when user changes

  const rateCandidate = (id: number, score: number) => {
    const bounded = Math.max(1, Math.min(100, Math.round(score)));
    setCandidates(candidates.map(c => 
      c.id === id ? { ...c, score: bounded, rating: bounded } : c
    ));
  };

  const updateStatus = async (id: number, status: Candidate['status']) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      console.log(`Actualizando estado del candidato ${id} a ${status}`);
      
      // Determinar calificación basada en el estado
      let calificacion = 'pendiente';
      if (status === 'approved') {
        calificacion = 'aprobado';
      } else if (status === 'rejected') {
        calificacion = 'desaprobado';
      }

      const response = await fetch(`${API_BASE_URL}/evaluaciones/actualizar-estado?ts=${Date.now()}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Accept': 'application/json',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify({
          candidatoId: id,
          estado: status,
          calificacion
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Estado actualizado exitosamente:', result);

      // Actualizar el estado local inmediatamente
      setCandidates(prevCandidates => 
        prevCandidates.map(c => 
          c.id === id ? { ...c, status, rating: calificacion } : c
        )
      );

      // Mostrar confirmación
      const statusText = status === 'approved' ? 'Aprobado' : status === 'rejected' ? 'Rechazado' : 'Pendiente';
      console.log(`✅ Candidato ${statusText} exitosamente`);

    } catch (error) {
      console.error('Error actualizando estado:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        status: error instanceof Error && 'status' in error ? (error as any).status : 'N/A'
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al actualizar el estado del candidato: ${errorMessage}`, {
        icon: '❌',
        duration: 5000,
      });
    }
  };

  // === Exportar Excel Aprobados/Desaprobados (derivado por nota 1-100) ===
  const exportApprovedRejectedToExcel = () => {
    const deriveScore = (c: Candidate) => (typeof c.score === 'number' ? c.score : (typeof c.rating === 'number' ? c.rating : 0));
    const rowsBase = candidates.map(c => ({
      ID: c.id,
      Nombre: c.name,
      DNI: c.dni || 'N/A',
      Email: c.email || 'N/A',
      Teléfono: c.telefono || 'N/A',
      Área: c.area || 'N/A',
      Puesto: c.position,
      SIGEA: c.expedienteSIGEA || 'Sin asignar',
      Certificado: c.certificadoId || 'N/A',
      Curriculum: c.curriculumName || (c.curriculumId ? `ID: ${c.curriculumId}` : 'No disponible'),
      Puntaje: deriveScore(c),
    }));

    const aprobados = rowsBase.filter(r => r.Puntaje >= 60);
    const probables = rowsBase.filter(r => r.Puntaje >= 50 && r.Puntaje < 60);
    const desaprobados = rowsBase.filter(r => r.Puntaje < 50);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aprobados), 'Aprobados (≥60)');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(probables), 'Probables (50-59)');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(desaprobados), 'Desaprobados (<50)');

    const resumen = [
      { Indicador: 'Total', Valor: rowsBase.length },
      { Indicador: 'Aprobados (≥60)', Valor: aprobados.length },
      { Indicador: 'Probables (50-59)', Valor: probables.length },
      { Indicador: 'Desaprobados (<50)', Valor: desaprobados.length },
      { Indicador: 'Promedio Nota', Valor: rowsBase.length ? Math.round(rowsBase.reduce((s, r) => s + r.Puntaje, 0) / rowsBase.length) : 0 },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen');

    XLSX.writeFile(wb, `aprobados_desaprobados_${new Date().toISOString().slice(0,10)}.xlsx`);
  };



  

  const loadAnexoData = async (candidate: Candidate): Promise<Candidate> => {
    const headers = getAuthHeaders();
    if (!headers) return candidate;

    // Si ya tiene datos del anexo cargados, retornar
    if (candidate.anexoData) return candidate;

    // Intentar obtener datos del anexo
    try {
      let anexoId = candidate.anexoId;
      
      // Si no tiene anexoId, intentar buscar por DNI
      if (!anexoId && candidate.dni) {
        try {
          const userResponse = await fetch(
            `${API_BASE_URL}/users?documento=${candidate.dni}`,
            { headers }
          );
          if (userResponse.ok) {
            const users = await userResponse.json();
            const userArray = Array.isArray(users) ? users : [];
            if (userArray.length > 0) {
              const userId = userArray[0].IDUSUARIO || userArray[0].id;
              // Obtener anexos del usuario
              const anexosResponse = await fetch(
                `${API_BASE_URL}/documentos/anexos-completos/usuario/${userId}`,
                { headers }
              );
              if (anexosResponse.ok) {
                const anexos = await anexosResponse.json();
                const anexosArray = Array.isArray(anexos) ? anexos : [];
                if (anexosArray.length > 0) {
                  // Obtener el anexo más reciente
                  anexoId = anexosArray[0].IDANEXO || anexosArray[0].id || anexosArray[0].IDANEXO_COMPLETO;
                }
              }
            }
          }
        } catch (err) {
          console.warn('Error al buscar anexo por DNI:', err);
        }
      }

      // Si tenemos anexoId, obtener los datos completos
      if (anexoId) {
        try {
          // Intentar obtener por ID de anexo completo
          const anexoResponse = await fetch(
            `${API_BASE_URL}/documentos/anexos/${anexoId}/completo`,
            { headers }
          );
          if (anexoResponse.ok) {
            const anexoData = await anexoResponse.json();
            // El endpoint puede devolver el anexo directamente o en formData
            const anexo = anexoData.formData ? {
              ...anexoData,
              formacionAcademica: anexoData.formData.academicFormation || [],
              idiomas: anexoData.formData.languageSkills || [],
              ofimatica: anexoData.formData.officeSkills || [],
              especializacion: anexoData.formData.specializationStudies || [],
              experienciaLaboral: anexoData.formData.workExperience || [],
              referenciasLaborales: anexoData.formData.laborReferences || [],
              colegioProfesional: anexoData.formData.personalData?.colegioProfesional || '',
              nColegiatura: anexoData.formData.personalData?.nColegiatura || '',
            } : anexoData;
            
            return {
              ...candidate,
              anexoId: anexoId,
              anexoData: {
                colegioProfesional: anexo.colegioProfesional || '',
                nColegiatura: anexo.nColegiatura || '',
                formacionAcademica: Array.isArray(anexo.formacionAcademica) ? anexo.formacionAcademica : (typeof anexo.formacionAcademica === 'string' ? JSON.parse(anexo.formacionAcademica) : []),
                idiomas: Array.isArray(anexo.idiomas) ? anexo.idiomas : (typeof anexo.idiomas === 'string' ? JSON.parse(anexo.idiomas) : []),
                ofimatica: Array.isArray(anexo.ofimatica) ? anexo.ofimatica : (typeof anexo.ofimatica === 'string' ? JSON.parse(anexo.ofimatica) : []),
                especializacion: Array.isArray(anexo.especializacion) ? anexo.especializacion : (typeof anexo.especializacion === 'string' ? JSON.parse(anexo.especializacion) : []),
                experienciaLaboral: Array.isArray(anexo.experienciaLaboral) ? anexo.experienciaLaboral : (typeof anexo.experienciaLaboral === 'string' ? JSON.parse(anexo.experienciaLaboral) : []),
                referenciasLaborales: Array.isArray(anexo.referenciasLaborales) ? anexo.referenciasLaborales : (typeof anexo.referenciasLaborales === 'string' ? JSON.parse(anexo.referenciasLaborales) : []),
              }
            };
          }
        } catch (err) {
          console.warn('Error al obtener anexo completo por ID, intentando por usuario:', err);
          // Si falla, intentar obtener todos los anexos del usuario y encontrar el que corresponde
          try {
            let userId: number | null = null;
            if (candidate.dni) {
              const userResponse = await fetch(`${API_BASE_URL}/users?documento=${candidate.dni}`, { headers });
              if (userResponse.ok) {
                const users = await userResponse.json();
                const userArray = Array.isArray(users) ? users : [];
                if (userArray.length > 0) {
                  userId = userArray[0]?.IDUSUARIO || userArray[0]?.id || null;
                }
              }
            }
            if (userId) {
              const anexosResponse = await fetch(
                `${API_BASE_URL}/documentos/anexos-completos/usuario/${userId}`,
                { headers }
              );
              if (anexosResponse.ok) {
                const anexos = await anexosResponse.json();
                const anexosArray = Array.isArray(anexos) ? anexos : [];
                const anexo = anexosArray.find((a: any) => (a.IDANEXO === anexoId || a.id === anexoId)) || anexosArray[0];
                if (anexo) {
                  return {
                    ...candidate,
                    anexoId: anexoId,
                    anexoData: {
                      colegioProfesional: anexo.colegioProfesional || '',
                      nColegiatura: anexo.nColegiatura || '',
                      formacionAcademica: Array.isArray(anexo.formacionAcademica) ? anexo.formacionAcademica : (typeof anexo.formacionAcademica === 'string' ? JSON.parse(anexo.formacionAcademica) : []),
                      idiomas: Array.isArray(anexo.idiomas) ? anexo.idiomas : (typeof anexo.idiomas === 'string' ? JSON.parse(anexo.idiomas) : []),
                      ofimatica: Array.isArray(anexo.ofimatica) ? anexo.ofimatica : (typeof anexo.ofimatica === 'string' ? JSON.parse(anexo.ofimatica) : []),
                      especializacion: Array.isArray(anexo.especializacion) ? anexo.especializacion : (typeof anexo.especializacion === 'string' ? JSON.parse(anexo.especializacion) : []),
                      experienciaLaboral: Array.isArray(anexo.experienciaLaboral) ? anexo.experienciaLaboral : (typeof anexo.experienciaLaboral === 'string' ? JSON.parse(anexo.experienciaLaboral) : []),
                      referenciasLaborales: Array.isArray(anexo.referenciasLaborales) ? anexo.referenciasLaborales : (typeof anexo.referenciasLaborales === 'string' ? JSON.parse(anexo.referenciasLaborales) : []),
                    }
                  };
                }
              }
            }
          } catch (err2) {
            console.warn('Error al obtener anexo por usuario:', err2);
          }
        }
      }
    } catch (error) {
      console.warn('Error al cargar datos del anexo:', error);
    }

    return candidate;
  };

  const viewCV = async (candidate: Candidate) => {
    const headers = getAuthHeaders();
    if (!headers) {
      console.error('No hay headers de autenticación');
      return;
    }

    // Cargar datos del anexo primero
    const candidateWithAnexo = await loadAnexoData(candidate);

    // Si ya tiene una URL válida (blob URL o data URL), usarla directamente
    if (candidateWithAnexo.pdfUrl && (candidateWithAnexo.pdfUrl.startsWith('blob:') || candidateWithAnexo.pdfUrl.startsWith('data:'))) {
      setViewingCV(candidateWithAnexo);
      return;
    }

    // Intentar descargar por ID de curriculum
    if (candidateWithAnexo.curriculumId) {
      try {
        const resp = await fetch(
          `${API_BASE_URL}/documentos/curriculum/${candidateWithAnexo.curriculumId}/download`,
          { headers }
        );
        if (resp.ok) {
          const blob = await resp.blob();
          const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(pdfBlob);
          setViewingCV({ ...candidateWithAnexo, pdfUrl: url });
          return;
        } else {
          console.warn(`Error al descargar curriculum ${candidateWithAnexo.curriculumId}:`, resp.status, resp.statusText);
        }
      } catch (e) {
        console.error('Error descargando CV por ID:', e);
      }
    }

    // Si tiene pdfUrl pero no es blob/data, intentar descargarlo
    if (candidateWithAnexo.pdfUrl && candidateWithAnexo.pdfUrl.startsWith('http')) {
      try {
        const resp = await fetch(candidateWithAnexo.pdfUrl, { headers });
        if (resp.ok) {
          const blob = await resp.blob();
          const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(pdfBlob);
          setViewingCV({ ...candidateWithAnexo, pdfUrl: url });
          return;
        }
      } catch (e) {
        console.error('Error descargando CV por URL:', e);
      }
    }

    // Si no se pudo obtener el PDF, mostrar un mensaje o intentar buscar por DNI
    if (candidateWithAnexo.dni) {
      try {
        // Buscar usuario por DNI
        const userResponse = await fetch(
          `${API_BASE_URL}/users?documento=${candidateWithAnexo.dni}`,
          { headers }
        );
        if (userResponse.ok) {
          const users = await userResponse.json();
          const userArray = Array.isArray(users) ? users : [];
          if (userArray.length > 0) {
            const userId = userArray[0].IDUSUARIO || userArray[0].id;
            // Obtener curriculum del usuario
            const curriculumResponse = await fetch(
              `${API_BASE_URL}/documentos/curriculum`,
              { headers }
            );
            if (curriculumResponse.ok) {
              const curriculums = await curriculumResponse.json();
              const curriculumArray = Array.isArray(curriculums) ? curriculums : [];
              const curriculum = curriculumArray.find((c: any) => 
                c.IDUSUARIO === userId || c.id === userId
              );
              if (curriculum && (curriculum.IDCURRICULUM || curriculum.id)) {
                const curriculumId = curriculum.IDCURRICULUM || curriculum.id;
                const downloadResponse = await fetch(
                  `${API_BASE_URL}/documentos/curriculum/${curriculumId}/download`,
                  { headers }
                );
                if (downloadResponse.ok) {
                  const blob = await downloadResponse.blob();
                  const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
                  const url = window.URL.createObjectURL(pdfBlob);
                  setViewingCV({ ...candidateWithAnexo, pdfUrl: url, curriculumId });
                  return;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error buscando curriculum por DNI:', e);
      }
    }

    // Último recurso: mostrar sin PDF (el usuario verá un mensaje)
    setViewingCV(candidateWithAnexo);
  };

  const closeCV = () => {
    setViewingCV(null);
    // NO recargar datos automáticamente para evitar conflictos
    // Los estados se mantienen en el estado local
  };

  // Componente para renderizar cada categoría de calificación
  const renderCategoryScore = (
    categoryName: string,
    mainInfo: string | ReactNode,
    details: ReactNode,
    currentScore: number,
    onScoreChange: (score: number) => void,
    isDisabled: boolean = false,
    totalPorcentaje: number = 0
  ) => {
    const getScoreColor = (score: number) => {
      // Ajustar colores para rango 0-100 (porcentajes)
      if (score >= 80) return 'text-green-600 bg-green-50 border-green-300';
      if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-300';
      if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
      if (score > 0) return 'text-orange-600 bg-orange-50 border-orange-300';
      return 'text-slate-500 bg-slate-100 border-slate-300';
    };

    const estaCompleto = Math.abs(totalPorcentaje - 100) < 0.01;
    const estaDeshabilitado = isDisabled || (estaCompleto && currentScore === 0);

    // Calcular el máximo permitido considerando el total actual
    const otrosTotal = totalPorcentaje - currentScore;
    const maxPermitido = Math.min(100, 100 - otrosTotal);

    const handleScoreChange = (newValue: number) => {
      if (estaDeshabilitado) return;
      
      // Limitar el valor para que no exceda el total permitido
      const valorLimitado = Math.max(0, Math.min(maxPermitido, newValue));
      onScoreChange(valorLimitado);
    };

    return (
      <div className={`mb-5 p-4 rounded-xl border-2 shadow-sm transition-shadow ${
        estaDeshabilitado 
          ? 'bg-slate-50 border-slate-300 opacity-60' 
          : 'bg-white border-slate-200 hover:shadow-md'
      }`}>
        {/* Header con nombre y nota */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`text-base font-bold ${estaDeshabilitado ? 'text-slate-400' : 'text-slate-900'}`}>
                {categoryName}
              </h4>
              {estaDeshabilitado && (
                <span className="text-xs text-slate-400 bg-slate-200 px-2 py-1 rounded">
                  Bloqueado
                </span>
              )}
            </div>
            <div className={`text-sm font-medium mb-2 ${estaDeshabilitado ? 'text-slate-400' : 'text-slate-700'}`}>
              {mainInfo}
            </div>
          </div>
          <div className={`ml-4 flex flex-col items-center justify-center px-4 py-2 rounded-lg border-2 ${
            estaDeshabilitado ? 'bg-slate-100 border-slate-300 text-slate-400' : getScoreColor(currentScore)
          } min-w-[100px]`}>
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold">
                {currentScore.toFixed(2)}
              </div>
              <span className="text-xs font-semibold mt-1">%</span>
            </div>
          </div>
        </div>
        
        {/* Detalles adicionales */}
        {details && (
          <div className={`mb-3 p-3 rounded-lg border ${
            estaDeshabilitado ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-xs space-y-1 ${estaDeshabilitado ? 'text-slate-400' : 'text-slate-600'}`}>
              {details}
            </div>
          </div>
        )}
        
        {/* Mensaje de bloqueo */}
        {estaDeshabilitado && estaCompleto && currentScore === 0 && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-700 text-center">
              ⚠️ El total ya alcanzó 100%. Esta categoría está bloqueada.
            </p>
          </div>
        )}
        
        {/* Input numérico para porcentaje */}
        <div className="mt-3">
          <input
            type="number"
            min={0}
            max={maxPermitido}
            step={0.01}
            value={currentScore || 0}
            onChange={(e) => {
              const value = Math.max(0, Math.min(maxPermitido, Number(e.target.value) || 0));
              handleScoreChange(value);
            }}
            disabled={estaDeshabilitado}
            className={`w-full px-4 py-2 border-2 rounded-lg font-medium focus:outline-none ${
              estaDeshabilitado
                ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed'
                : 'border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }`}
            placeholder="0.00"
          />
          <div className={`flex justify-between text-xs mt-1 ${estaDeshabilitado ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>0%</span>
            <span className={`font-semibold ${estaDeshabilitado ? 'text-slate-400' : 'text-blue-600'}`}>
              {currentScore.toFixed(2)}% {!estaDeshabilitado && maxPermitido < 100 && `(máx: ${maxPermitido.toFixed(2)}%)`}
            </span>
            <span>{maxPermitido.toFixed(0)}%</span>
          </div>
        </div>
        
        {/* Slider alternativo */}
        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={maxPermitido}
            step={0.1}
            value={currentScore || 0}
            onChange={(e) => handleScoreChange(Number(e.target.value))}
            disabled={estaDeshabilitado}
            className={`w-full h-2 rounded-lg appearance-none ${
              estaDeshabilitado 
                ? 'bg-slate-200 cursor-not-allowed opacity-50' 
                : 'bg-slate-200 cursor-pointer accent-blue-600'
            }`}
            style={{
              background: estaDeshabilitado
                ? `linear-gradient(to right, #cbd5e1 0%, #cbd5e1 100%)`
                : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${currentScore}%, #e2e8f0 ${currentScore}%, #e2e8f0 100%)`
            }}
          />
        </div>
      </div>
    );
  };

  // Obtener IDs de postulantes archivados
  const archivedCandidates = getArchivedCandidates();
  const archivedIds = new Set(archivedCandidates.map(a => a.id));
  
  // Filtrar candidatos: excluir archivados si estamos en vista normal, incluir solo archivados si estamos en historial
  const activeCandidates = candidates.filter(c => !archivedIds.has(c.id));
  const historialCandidates = archivedCandidates;
  
  const candidatesToDisplay = showHistorial ? historialCandidates : activeCandidates;
  
  // Funciones para manejar selección
  const toggleCandidateSelection = (id: number) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const toggleSelectAll = () => {
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
    }
  };
  
  const archiveSelectedCandidates = () => {
    if (selectedCandidates.size === 0) {
      toast.error('Por favor selecciona al menos un postulante para archivar', {
        icon: '⚠️',
        duration: 3000,
      });
      return;
    }
    
    const toArchive = filteredCandidates.filter(c => selectedCandidates.has(c.id));
    const currentArchived = getArchivedCandidates();
    
    // Agregar fecha de archivado
    const now = new Date().toISOString();
    const newArchived = toArchive.map(c => ({
      ...c,
      fechaArchivado: now
    }));
    
    // Combinar con existentes (evitar duplicados)
    const updatedArchived = [
      ...currentArchived.filter(a => !selectedCandidates.has(a.id)),
      ...newArchived
    ];
    
    saveArchivedCandidates(updatedArchived);
    
    // Remover de la lista de candidatos activos (actualizar estado local)
    setCandidates(prev => prev.filter(c => !selectedCandidates.has(c.id)));
    setSelectedCandidates(new Set());
    
    toast.success(`${toArchive.length} postulante(s) archivado(s) exitosamente`, {
      icon: '✅',
      duration: 3000,
    });
  };
  
  const unarchiveCandidate = (id: number) => {
    const currentArchived = getArchivedCandidates();
    const candidateToUnarchive = currentArchived.find(a => a.id === id);
    
    if (!candidateToUnarchive) {
      toast.error('No se encontró el postulante en el historial', {
        icon: '⚠️',
        duration: 3000,
      });
      return;
    }
    
    // Remover del historial
    const updatedArchived = currentArchived.filter(a => a.id !== id);
    saveArchivedCandidates(updatedArchived);
    
    // Agregar de vuelta a la lista activa
    const { fechaArchivado, ...candidateWithoutArchiveDate } = candidateToUnarchive;
    setCandidates(prev => [...prev, candidateWithoutArchiveDate]);
    
    toast.success('Postulante desarchivado exitosamente', {
      icon: '✅',
      duration: 3000,
    });
  };
  
  const filteredCandidates = candidatesToDisplay.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Usar el estado real del candidato, no derivarlo desde el score
    // El estado se establece basado en expedienteSIGEA y estado en fetchApplicantsWithCVs
    const candidateStatus = c.status || 'pending';
    const matchesFilter = filterStatus === "all" || candidateStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Vista del CV
  if (viewingCV) {
    return (
      <ComiteLayout> {/* Wrap with ComiteLayout */}
        <div className="w-full px-4 py-8 relative z-10 h-screen flex flex-col"> {/* Adjusted for ComiteLayout */}
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/30 backdrop-blur-sm border-b border-cyan-500/30 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <button
                onClick={closeCV}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-all border border-cyan-500/30"
              >
                <ChevronLeft className="w-5 h-5" />
                Volver
              </button>
              
              <div className="flex-1 mx-8">
                <h2 className="text-2xl font-bold text-white">{viewingCV.name}</h2>
                <p className="text-cyan-300">{viewingCV.position}</p>
              </div>

              <div className="flex items-center gap-4">
                {/* Rating o Sin nota */}
                {(() => {
                  const currentScore = typeof viewingCV.score === 'number' ? viewingCV.score : (typeof viewingCV.rating === 'number' ? viewingCV.rating : 0);
                  if (currentScore === 0) {
                    return (
                      <div className="px-4 py-2 bg-slate-500/20 text-slate-300 rounded-lg font-medium border border-slate-500/30 flex items-center gap-2">
                        <span>Sin nota</span>
                      </div>
                    );
                  }
                  return (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                          onClick={() => rateCandidate(viewingCV.id, star * 20)}
                      className="transition-all hover:scale-125"
                    >
                      <Star
                        className={`w-6 h-6 ${
                              star <= Math.ceil(currentScore / 20)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-cyan-500/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                  );
                })()}

                {/* Botones de acción solo si está pendiente */}
                {viewingCV.status !== 'approved' && viewingCV.status !== 'rejected' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        updateStatus(viewingCV.id, "approved");
                        setViewingCV({...viewingCV, status: "approved", rating: "aprobado"});
                      }}
                      className="px-6 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg font-medium transition-all border border-green-500/30 flex items-center gap-2 hover:scale-105"
                    >
                      <Check className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => {
                        updateStatus(viewingCV.id, "rejected");
                        setViewingCV({...viewingCV, status: "rejected", rating: "desaprobado"});
                      }}
                      className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-medium transition-all border border-red-500/30 flex items-center gap-2 hover:scale-105"
                    >
                      <X className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenido Principal: Detalles de Calificación y PDF */}
          <div className="flex-1 overflow-hidden p-6">
            <div className="max-w-[1800px] mx-auto h-full flex gap-6">
              {/* Panel izquierdo: Detalles para Calificar */}
              <div className="w-[420px] flex-shrink-0 bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 border-slate-200 shadow-xl overflow-y-auto">
                <div className="p-6">
                  <div className="mb-6 pb-4 border-b-2 border-slate-300">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      📋 Detalles para Calificar
                    </h3>
                    <p className="text-sm text-slate-600">Evalúa cada aspecto del postulante (0-100% por categoría). La suma total debe ser 100%</p>
                  </div>
                  
                  {/* Calcular total ANTES de renderizar categorías para poder deshabilitarlas */}
                  {(() => {
                    // Calcular el total actual de todas las categorías
                    const notaColegio = Math.min(100, Math.max(0, Number(viewingCV.notaColegioProfesional) || 0));
                    const notaFormacion = Math.min(100, Math.max(0, Number(viewingCV.notaFormacionAcademica) || 0));
                    const notaIdiomas = Math.min(100, Math.max(0, Number(viewingCV.notaIdiomas) || 0));
                    const notaOfimatica = Math.min(100, Math.max(0, Number(viewingCV.notaOfimatica) || 0));
                    const notaEspecializacion = Math.min(100, Math.max(0, Number(viewingCV.notaEspecializacion) || 0));
                    const notaExperiencia = Math.min(100, Math.max(0, Number(viewingCV.notaExperienciaLaboral) || 0));
                    const notaReferencias = Math.min(100, Math.max(0, Number(viewingCV.notaReferenciasLaborales) || 0));
                    
                    const valoresPorcentajes: number[] = [];
                    if (viewingCV.anexoData?.colegioProfesional || viewingCV.notaColegioProfesional) {
                      valoresPorcentajes.push(notaColegio);
                    }
                    if (viewingCV.anexoData?.formacionAcademica?.length || viewingCV.notaFormacionAcademica) {
                      valoresPorcentajes.push(notaFormacion);
                    }
                    if (viewingCV.anexoData?.idiomas?.length || viewingCV.notaIdiomas) {
                      valoresPorcentajes.push(notaIdiomas);
                    }
                    if (viewingCV.anexoData?.ofimatica?.length || viewingCV.notaOfimatica) {
                      valoresPorcentajes.push(notaOfimatica);
                    }
                    if (viewingCV.anexoData?.especializacion?.length || viewingCV.notaEspecializacion) {
                      valoresPorcentajes.push(notaEspecializacion);
                    }
                    if (viewingCV.anexoData?.experienciaLaboral?.length || viewingCV.notaExperienciaLaboral) {
                      valoresPorcentajes.push(notaExperiencia);
                    }
                    if (viewingCV.anexoData?.referenciasLaborales?.length || viewingCV.notaReferenciasLaborales) {
                      valoresPorcentajes.push(notaReferencias);
                    }
                    
                    const totalPorcentaje = valoresPorcentajes.reduce((sum, val) => sum + val, 0);
                    
                    // Renderizar categorías con el total calculado
                    return (
                      <>
                        {renderCategoryScore(
                          'Colegio Profesional',
                          viewingCV.anexoData?.colegioProfesional || 'No especificado',
                          viewingCV.anexoData?.nColegiatura ? `N° Colegiatura: ${viewingCV.anexoData.nColegiatura}` : null,
                          notaColegio,
                          (score) => saveCategoryScore(viewingCV.id, 'notaColegioProfesional', score),
                          false,
                          totalPorcentaje
                        )}
                        
                        {renderCategoryScore(
                          'Formación Académica',
                          viewingCV.anexoData?.formacionAcademica?.length 
                            ? `${viewingCV.anexoData.formacionAcademica.length} ${viewingCV.anexoData.formacionAcademica.length === 1 ? 'estudio registrado' : 'estudios registrados'}` 
                            : 'No especificado',
                          viewingCV.anexoData?.formacionAcademica && viewingCV.anexoData.formacionAcademica.length > 0 ? (
                            <div className="space-y-2">
                              {viewingCV.anexoData.formacionAcademica.map((fa: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <div>
                                    <div className="font-medium text-slate-700">{fa.titulo || fa.nombreGrado || 'Sin título'}</div>
                                    <div className="text-slate-500">{fa.institucion || 'Sin institución'}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null,
                          notaFormacion,
                          (score) => saveCategoryScore(viewingCV.id, 'notaFormacionAcademica', score),
                          false,
                          totalPorcentaje
                        )}
                        
                        {renderCategoryScore(
                          'Idiomas y/o Dialecto',
                          viewingCV.anexoData?.idiomas?.length 
                            ? `${viewingCV.anexoData.idiomas.length} ${viewingCV.anexoData.idiomas.length === 1 ? 'idioma registrado' : 'idiomas registrados'}` 
                            : 'No especificado',
                          viewingCV.anexoData?.idiomas && viewingCV.anexoData.idiomas.length > 0 ? (
                            <div className="space-y-2">
                              {viewingCV.anexoData.idiomas.map((id: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <div>
                                    <div className="font-medium text-slate-700">{id.idioma || 'Sin idioma'}</div>
                                    <div className="text-slate-500">Nivel: {id.nivel || 'Sin nivel'}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null,
                          notaIdiomas,
                          (score) => saveCategoryScore(viewingCV.id, 'notaIdiomas', score),
                          false,
                          totalPorcentaje
                        )}
                        
                        {renderCategoryScore(
                          'Conocimientos de Ofimática',
                          viewingCV.anexoData?.ofimatica?.length 
                            ? `${viewingCV.anexoData.ofimatica.length} ${viewingCV.anexoData.ofimatica.length === 1 ? 'herramienta registrada' : 'herramientas registradas'}` 
                            : 'No especificado',
                          viewingCV.anexoData?.ofimatica && viewingCV.anexoData.ofimatica.length > 0 ? (
                            <div className="space-y-2">
                              {viewingCV.anexoData.ofimatica.map((of: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <div>
                                    <div className="font-medium text-slate-700">{of.herramienta || of.nombre || 'Sin herramienta'}</div>
                                    <div className="text-slate-500">Nivel: {of.nivel || 'Sin nivel'}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null,
                          notaOfimatica,
                          (score) => saveCategoryScore(viewingCV.id, 'notaOfimatica', score),
                          false,
                          totalPorcentaje
                        )}
                        
                        {renderCategoryScore(
                          'Estudios de Especialización',
                          viewingCV.anexoData?.especializacion?.length 
                            ? `${viewingCV.anexoData.especializacion.length} ${viewingCV.anexoData.especializacion.length === 1 ? 'especialización registrada' : 'especializaciones registradas'}` 
                            : 'No especificado',
                          viewingCV.anexoData?.especializacion && viewingCV.anexoData.especializacion.length > 0 ? (
                            <div className="space-y-2">
                              {viewingCV.anexoData.especializacion.map((esp: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <div>
                                    <div className="font-medium text-slate-700">{esp.titulo || esp.nombre || 'Sin título'}</div>
                                    <div className="text-slate-500">{esp.institucion || 'Sin institución'}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null,
                          notaEspecializacion,
                          (score) => saveCategoryScore(viewingCV.id, 'notaEspecializacion', score),
                          false,
                          totalPorcentaje
                        )}
                        
                        {renderCategoryScore(
                          'Experiencia Laboral',
                          viewingCV.anexoData?.experienciaLaboral?.length 
                            ? `${viewingCV.anexoData.experienciaLaboral.length} ${viewingCV.anexoData.experienciaLaboral.length === 1 ? 'experiencia registrada' : 'experiencias registradas'}` 
                            : 'No especificado',
                          viewingCV.anexoData?.experienciaLaboral && viewingCV.anexoData.experienciaLaboral.length > 0 ? (
                            <div className="space-y-2">
                              {viewingCV.anexoData.experienciaLaboral.map((exp: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <div>
                                    <div className="font-medium text-slate-700">{exp.puesto || exp.cargo || 'Sin puesto'}</div>
                                    <div className="text-slate-500">{exp.empresa || exp.entidad || 'Sin empresa'}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null,
                          notaExperiencia,
                          (score) => saveCategoryScore(viewingCV.id, 'notaExperienciaLaboral', score),
                          false,
                          totalPorcentaje
                        )}
                  
                        {/* Referencias Laborales - Solo mostrar si hay datos */}
                        {viewingCV.anexoData?.referenciasLaborales && viewingCV.anexoData.referenciasLaborales.length > 0 && (
                          renderCategoryScore(
                            'Referencias Laborales',
                            `${viewingCV.anexoData.referenciasLaborales.length} ${viewingCV.anexoData.referenciasLaborales.length === 1 ? 'referencia registrada' : 'referencias registradas'}`,
                            <div className="space-y-2">
                              {viewingCV.anexoData.referenciasLaborales.map((ref: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <div>
                                    <div className="font-medium text-slate-700">{ref.nombre || 'Sin nombre'}</div>
                                    <div className="text-slate-500">{ref.empresa || 'Sin empresa'}</div>
                                    <div className="text-slate-400">{ref.telefono || 'Sin teléfono'}</div>
                                  </div>
                                </div>
                              ))}
                            </div>,
                            notaReferencias,
                            (score) => saveCategoryScore(viewingCV.id, 'notaReferenciasLaborales', score),
                            false,
                            totalPorcentaje
                          )
                        )}
                      </>
                    );
                  })()}
                  
                  {/* Resumen de calificaciones con validación de porcentajes */}
                        {(() => {
                    // 1. Crear una lista vacía de valores (uno por casilla)
                    const valoresPorcentajes: number[] = [];
                    
                    // 2. Obtener todas las notas de porcentajes (0-100)
                    const notaColegio = Math.min(100, Math.max(0, Number(viewingCV.notaColegioProfesional) || 0));
                    const notaFormacion = Math.min(100, Math.max(0, Number(viewingCV.notaFormacionAcademica) || 0));
                    const notaIdiomas = Math.min(100, Math.max(0, Number(viewingCV.notaIdiomas) || 0));
                    const notaOfimatica = Math.min(100, Math.max(0, Number(viewingCV.notaOfimatica) || 0));
                    const notaEspecializacion = Math.min(100, Math.max(0, Number(viewingCV.notaEspecializacion) || 0));
                    const notaExperiencia = Math.min(100, Math.max(0, Number(viewingCV.notaExperienciaLaboral) || 0));
                    const notaReferencias = Math.min(100, Math.max(0, Number(viewingCV.notaReferenciasLaborales) || 0));
                    
                    // Determinar categorías disponibles (las que se muestran en pantalla)
                    const categoriasDisponibles: string[] = [];
                    if (viewingCV.anexoData?.colegioProfesional || viewingCV.notaColegioProfesional) {
                      categoriasDisponibles.push('colegio');
                      valoresPorcentajes.push(notaColegio);
                    }
                    if (viewingCV.anexoData?.formacionAcademica?.length || viewingCV.notaFormacionAcademica) {
                      categoriasDisponibles.push('formacion');
                      valoresPorcentajes.push(notaFormacion);
                    }
                    if (viewingCV.anexoData?.idiomas?.length || viewingCV.notaIdiomas) {
                      categoriasDisponibles.push('idiomas');
                      valoresPorcentajes.push(notaIdiomas);
                    }
                    if (viewingCV.anexoData?.ofimatica?.length || viewingCV.notaOfimatica) {
                      categoriasDisponibles.push('ofimatica');
                      valoresPorcentajes.push(notaOfimatica);
                    }
                    if (viewingCV.anexoData?.especializacion?.length || viewingCV.notaEspecializacion) {
                      categoriasDisponibles.push('especializacion');
                      valoresPorcentajes.push(notaEspecializacion);
                    }
                    if (viewingCV.anexoData?.experienciaLaboral?.length || viewingCV.notaExperienciaLaboral) {
                      categoriasDisponibles.push('experiencia');
                      valoresPorcentajes.push(notaExperiencia);
                    }
                    if (viewingCV.anexoData?.referenciasLaborales?.length || viewingCV.notaReferenciasLaborales) {
                      categoriasDisponibles.push('referencias');
                      valoresPorcentajes.push(notaReferencias);
                    }
                    
                    // 3. Sumar TODOS los valores de la lista
                    const totalPorcentaje = valoresPorcentajes.reduce((sum, val) => sum + val, 0);
                    
                    // 4. Mostrar el total y 5. Validar
                    const estaCorrecto = Math.abs(totalPorcentaje - 100) < 0.01; // Permitir pequeñas diferencias por redondeo
                    const faltaPorcentaje = totalPorcentaje < 100;
                    const sePaso = totalPorcentaje > 100;
                    
                    // Determinar colores y mensajes según validación
                    let borderColor = 'border-blue-200';
                    let bgColor = 'bg-gradient-to-br from-blue-50 to-indigo-50';
                    let textColor = 'text-blue-700';
                    let statusMessage = '';
                    let statusIcon = '';
                    
                    if (estaCorrecto) {
                      borderColor = 'border-green-300';
                      bgColor = 'bg-gradient-to-br from-green-50 to-emerald-50';
                      textColor = 'text-green-700';
                      statusMessage = '✅ Total correcto (100%)';
                      statusIcon = '✅';
                    } else if (faltaPorcentaje) {
                      borderColor = 'border-yellow-300';
                      bgColor = 'bg-gradient-to-br from-yellow-50 to-amber-50';
                      textColor = 'text-yellow-700';
                      statusMessage = `⚠️ Falta ${(100 - totalPorcentaje).toFixed(2)}%`;
                      statusIcon = '⚠️';
                    } else if (sePaso) {
                      borderColor = 'border-red-300';
                      bgColor = 'bg-gradient-to-br from-red-50 to-rose-50';
                      textColor = 'text-red-700';
                      statusMessage = `❌ Se pasó ${(totalPorcentaje - 100).toFixed(2)}%`;
                      statusIcon = '❌';
                    }
                    
                          return (
                      <div className={`mt-6 p-5 ${bgColor} rounded-xl border-2 ${borderColor} shadow-lg`}>
                        <div className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">Validación de Porcentajes</div>
                        
                        {/* Total y estado */}
                        <div className="flex items-baseline gap-3 mb-3">
                          <div className={`text-4xl font-bold ${textColor}`}>
                            {totalPorcentaje.toFixed(2)}
                            </div>
                          <div className="text-xl font-semibold text-slate-500">/ 100%</div>
                        </div>
                        
                        {/* Mensaje de estado */}
                        <div className={`mb-4 p-3 rounded-lg border-2 ${borderColor} bg-white`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{statusIcon}</span>
                            <span className={`font-semibold ${textColor}`}>
                              {statusMessage}
                            </span>
                          </div>
                        </div>
                        
                        {/* Detalles de cada categoría */}
                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="font-semibold mb-2 text-slate-700">Desglose por categoría:</div>
                          {viewingCV.anexoData?.colegioProfesional && (
                            <div className="flex justify-between">
                              <span>Colegio Profesional:</span>
                              <span className="font-medium">{notaColegio.toFixed(2)}%</span>
                          </div>
                          )}
                          {(viewingCV.anexoData?.formacionAcademica && viewingCV.anexoData.formacionAcademica.length > 0) && (
                            <div className="flex justify-between">
                              <span>Formación Académica:</span>
                              <span className="font-medium">{notaFormacion.toFixed(2)}%</span>
                    </div>
                          )}
                          {(viewingCV.anexoData?.idiomas && viewingCV.anexoData.idiomas.length > 0) && (
                            <div className="flex justify-between">
                              <span>Idiomas:</span>
                              <span className="font-medium">{notaIdiomas.toFixed(2)}%</span>
                  </div>
                          )}
                          {(viewingCV.anexoData?.ofimatica && viewingCV.anexoData.ofimatica.length > 0) && (
                            <div className="flex justify-between">
                              <span>Ofimática:</span>
                              <span className="font-medium">{notaOfimatica.toFixed(2)}%</span>
                            </div>
                          )}
                          {(viewingCV.anexoData?.especializacion && viewingCV.anexoData.especializacion.length > 0) && (
                            <div className="flex justify-between">
                              <span>Especialización:</span>
                              <span className="font-medium">{notaEspecializacion.toFixed(2)}%</span>
                            </div>
                          )}
                          {(viewingCV.anexoData?.experienciaLaboral && viewingCV.anexoData.experienciaLaboral.length > 0) && (
                            <div className="flex justify-between">
                              <span>Experiencia Laboral:</span>
                              <span className="font-medium">{notaExperiencia.toFixed(2)}%</span>
                            </div>
                          )}
                          {(viewingCV.anexoData?.referenciasLaborales && viewingCV.anexoData.referenciasLaborales.length > 0) && (
                            <div className="flex justify-between">
                              <span>Referencias Laborales:</span>
                              <span className="font-medium">{notaReferencias.toFixed(2)}%</span>
                            </div>
                          )}
                          <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between font-bold text-slate-700">
                            <span>Total:</span>
                            <span>{totalPorcentaje.toFixed(2)}%</span>
                          </div>
                        </div>
                        
                        {/* Calificación Final (solo si está correcto) */}
                        {estaCorrecto && (
                          <div className="mt-4 pt-4 border-t-2 border-green-300">
                            <div className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Calificación Final</div>
                            <div className="flex items-baseline gap-3">
                              <div className="text-3xl font-bold text-green-700">
                                {totalPorcentaje.toFixed(0)}
                              </div>
                              <div className="text-lg font-semibold text-slate-500">/ 100</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {/* Panel derecho: PDF Viewer */}
              <div className="flex-1 bg-gradient-to-br from-cyan-900/20 to-blue-900/10 backdrop-blur-sm rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden">
              {viewingCV.pdfUrl ? (
                <object data={viewingCV.pdfUrl} type="application/pdf" className="w-full h-full">
                  <div className="p-6 text-cyan-200 text-sm">
                    No se pudo mostrar el PDF embebido.
                    <a href={viewingCV.pdfUrl} target="_blank" rel="noreferrer" className="underline text-cyan-300 ml-1">Abrir en una pestaña nueva</a>.
                  </div>
                </object>
              ) : (
                  <div className="m-auto text-cyan-200 p-6">CV no disponible</div>
              )}
              </div>
            </div>
          </div>
        </div>
      </ComiteLayout>
    );
  }

  // Vista principal
  return (
    <ComiteLayout> {/* Wrap with ComiteLayout */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            duration: 3000,
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            duration: 4000,
          },
        }}
      />
      <div className="w-full px-4 py-8 relative z-10"> {/* Adjusted for ComiteLayout */}
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className={`text-5xl font-bold ${textPrimary} mb-4 tracking-tight`}>
            Sistema de Evaluación de CVs
          </h1>
          <p className={`${textSecondary} text-lg`}>Carga los CVs recibidos, revísalos y toma decisiones</p>
          <div className={`mt-4 inline-block px-6 py-2 ${isDark ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'} rounded-full`}>
            <p className={`${isDark ? 'text-blue-300' : 'text-blue-700'} text-sm`}>👤 Panel de Reclutador</p>
          </div>
        </div>

        {/* Tabs: Activos / Historial */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Botón de retroceder (solo visible en historial) */}
            {showHistorial && (
              <button
                onClick={() => setShowHistorial(false)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
                Volver a Postulantes Activos
              </button>
            )}
            
            {/* Título de la sección actual */}
            <div className="flex-1 text-center">
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
                {showHistorial ? (
                  <>
                    <History className={`w-6 h-6 inline mr-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    Historial de Postulantes Archivados
                  </>
                ) : (
                  <>
                    <Eye className={`w-6 h-6 inline mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    Postulantes Activos
                  </>
                )}
              </h2>
            </div>
            
            {/* Espaciador para mantener el título centrado cuando hay botón de retroceder */}
            {showHistorial && <div className="w-48"></div>}
          </div>
          
          <div className={`flex gap-4 border-b ${isDark ? 'border-blue-500/30' : 'border-blue-200'}`}>
            <button
              onClick={() => setShowHistorial(false)}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                !showHistorial
                  ? isDark ? "border-blue-400 text-blue-400" : "border-blue-600 text-blue-600"
                  : isDark ? "border-transparent text-gray-400 hover:text-gray-300" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Eye className="w-5 h-5 inline mr-2" />
              Postulantes Activos ({activeCandidates.length})
            </button>
            <button
              onClick={() => setShowHistorial(true)}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                showHistorial
                  ? isDark ? "border-purple-400 text-purple-400" : "border-purple-600 text-purple-600"
                  : isDark ? "border-transparent text-gray-400 hover:text-gray-300" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <History className="w-5 h-5 inline mr-2" />
              Historial ({historialCandidates.length})
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="max-w-6xl mx-auto mb-8 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-blue-400' : 'text-blue-500'} w-5 h-5`} />
              <input
                type="text"
                placeholder="Buscar por nombre o puesto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 ${isDark ? 'bg-slate-800 border border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-400' : 'bg-white border border-blue-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'} rounded-xl focus:outline-none transition-all`}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {["all", "approved", "rejected"].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as Candidate['status'] | "all")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  filterStatus === status
                    ? "bg-blue-600 text-white"
                    : isDark 
                      ? "bg-slate-700 text-gray-300 border border-slate-600 hover:bg-slate-600"
                      : "bg-white text-slate-700 border border-blue-200 hover:bg-blue-50"
                }`}
              >
                {status === "all" ? "Todos" : status === "approved" ? "Aprobado" : "Rechazado"}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-6xl mx-auto mb-8 flex gap-4 justify-between flex-wrap">
          <div className="flex gap-4">
            {!showHistorial && (
              <>
                {/* Seleccionar todos */}
                <button
                  onClick={toggleSelectAll}
                  className={`flex items-center gap-2 px-6 py-3 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-gray-300 border border-slate-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'} rounded-xl font-medium transition-all`}
                >
                  {selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0 ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </button>
                
                {/* Archivar seleccionados */}
                {selectedCandidates.size > 0 && (
                  <button
                    onClick={archiveSelectedCandidates}
                    className={`flex items-center gap-2 px-6 py-3 ${isDark ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30' : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'} rounded-xl font-medium transition-all`}
                  >
                    <Archive className="w-4 h-4" />
                    Archivar ({selectedCandidates.size})
                  </button>
                )}
              </>
            )}
            
            {/* Botón de retroceder adicional en la barra de acciones (solo en historial) */}
            {showHistorial && (
              <button
                onClick={() => setShowHistorial(false)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
                Volver a Activos
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            {!showHistorial && (
              <>
                <button
                  onClick={saveAllCurrentScores}
                  className={`flex items-center gap-2 px-6 py-3 ${isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'} rounded-xl font-medium transition-all`}
                >
                  💾 Guardar Puntajes
                </button>
                <button
                  onClick={exportApprovedRejectedToExcel}
                  className={`flex items-center gap-2 px-6 py-3 ${isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'} rounded-xl font-medium transition-all`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Excel Aprobados/Desaprobados
                </button>
              </>
            )}
          </div>
        </div>

        {/* Removed File Upload */}

        {/* Loading State */}
        {loading && (
          <div className="max-w-6xl mx-auto text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="text-cyan-300 mt-4">Cargando candidatos...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-6xl mx-auto text-center py-12">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6">
              <p className="text-red-300">{error}</p>
              <button
                onClick={fetchApplicantsWithCVs}
                className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 transition-all"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCandidates.length === 0 && (
          <div className="max-w-6xl mx-auto text-center py-12">
            <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-8">
              {showHistorial ? (
                <>
                  <Archive className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No hay postulantes archivados</h3>
                  <p className="text-purple-300 mb-4">
                    El historial de postulantes archivados aparecerá aquí cuando archives postulantes.
                  </p>
                  <button
                    onClick={() => setShowHistorial(false)}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Volver a Postulantes Activos
                  </button>
                </>
              ) : (
                <>
                  <FileText className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No hay candidatos disponibles</h3>
                  <p className="text-cyan-300 mb-4">
                    {candidatesToDisplay.length === 0 
                      ? "No se encontraron postulantes con currículum en la base de datos."
                      : "No hay candidatos que coincidan con los filtros aplicados."
                    }
                  </p>
                  <button
                    onClick={fetchApplicantsWithCVs}
                    className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/30 transition-all"
                  >
                    Actualizar
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Candidates Grid */}
        {!loading && !error && filteredCandidates.length > 0 && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-200'} rounded-2xl p-6 border transition-all shadow-sm hover:shadow-md ${
                selectedCandidates.has(candidate.id) 
                  ? isDark 
                    ? 'border-blue-400 border-2 ring-2 ring-blue-500/30' 
                    : 'border-blue-500 border-2 ring-2 ring-blue-200'
                  : ''
              } ${showHistorial ? 'opacity-90' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Checkbox para selección (solo en vista activos) */}
                  {!showHistorial && (
                    <button
                      onClick={() => toggleCandidateSelection(candidate.id)}
                      className={`mt-1 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
                    >
                      {selectedCandidates.has(candidate.id) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                </div>
              {(() => {
                const score = typeof candidate.score === 'number' ? candidate.score : (typeof candidate.rating === 'number' ? candidate.rating : 0);
                const status = score >= 60 ? 'apto' : (score < 50 ? 'desaprobado' : 'probable');
                const cls = score >= 60
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : (score < 50 ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30');
                return (
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
                    {score ? `${status.toUpperCase()} • ${score}/100` : '⏳ Evaluar'}
                  </div>
                );
              })()}
              </div>

              {/* Info */}
              <h3 className={`text-xl font-bold ${textPrimary} mb-1`}>{candidate.name}</h3>
              <p className={`${textSecondary} mb-1`}>{candidate.position}</p>
              
              {/* Datos adicionales del postulante */}
              <div className="space-y-1 mb-3">
                {candidate.dni && (
                  <p className={`${textSecondary} text-sm`}>
                    <span className="font-medium">DNI:</span> {candidate.dni}
                  </p>
                )}
                {candidate.email && (
                  <p className={`${textSecondary} text-sm`}>
                    <span className="font-medium">Email:</span> {candidate.email}
                  </p>
                )}
                {candidate.telefono && (
                  <p className={`${textSecondary} text-sm`}>
                    <span className="font-medium">Teléfono:</span> {candidate.telefono}
                  </p>
                )}
                {candidate.area && (
                  <p className={`${textSecondary} text-sm`}>
                    <span className="font-medium">Área:</span> {candidate.area}
                  </p>
                )}
              </div>
              
              {/* SIGEA */}
              {candidate.expedienteSIGEA && candidate.expedienteSIGEA.trim() !== '' && (
                <div className="mb-3">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 ${isDark ? 'text-indigo-300' : 'text-indigo-700'} border border-indigo-500/30 shadow-sm`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    SIGEA: {candidate.expedienteSIGEA}
                  </span>
                </div>
              )}
              
              {candidate.curriculumName && (
                <p className={`${textSecondary} text-sm mb-2`}>
                  <span className="font-medium">Currículum:</span> {candidate.curriculumName}
                </p>
              )}
              {candidate.certificadoId && (
                <p className={`${textSecondary} text-xs mb-2 font-mono`}>
                  Certificado: {candidate.certificadoId}
                </p>
              )}
              
              {/* CV Status */}
              <div className="mb-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  candidate.pdfUrl 
                    ? isDark 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : 'bg-green-50 text-green-700 border border-green-200'
                    : isDark
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  <FileText className="w-3 h-3" />
                  {candidate.pdfUrl ? 'CV Disponible' : 'CV Pendiente'}
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {candidate.skills.map((skill, idx) => (
                  <span key={idx} className={`px-3 py-1 ${isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'} rounded-full text-xs`}>
                    {skill}
                  </span>
                ))}
              </div>

              {/* Calificación 1-100 */}
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>Puntaje (1-100):</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={typeof candidate.score === 'number' ? candidate.score : (typeof candidate.rating === 'number' ? candidate.rating : 0)}
                    onChange={(e) => rateCandidate(candidate.id, Number(e.target.value || 0))}
                    className={`w-20 px-2 py-1 ${isDark ? 'bg-slate-700 border border-blue-500/30 text-white' : 'bg-white border border-blue-200 text-slate-900'} rounded`}
                  />
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={typeof candidate.score === 'number' ? candidate.score : (typeof candidate.rating === 'number' ? candidate.rating : 0)}
                    onChange={(e) => rateCandidate(candidate.id, Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => saveCandidateScore(candidate.id)}
                    className={`px-3 py-2 ${isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'} rounded-lg text-xs`}
                  >
                    Guardar calificación
                  </button>
                </div>
                {candidate.aiSummary && (
                  <div className={`mt-2 text-xs ${isDark ? 'text-gray-300 bg-slate-700 border border-blue-500/30' : 'text-slate-700 bg-white border border-blue-200'} rounded p-2`}>
                    {String(candidate.aiSummary).slice(0, 300)}{String(candidate.aiSummary).length > 300 ? '…' : ''}
                  </div>
                )}
              </div>

              {/* Actions hidden: evaluación ahora es numérica */}
              <div className="flex gap-2 mb-3"></div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => viewCV(candidate)}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow"
                >
                  <Eye className="w-4 h-4" />
                  {candidate.pdfUrl ? 'Ver CV' : 'Sin CV disponible'}
                </button>
                
                {/* Botón desarchivar (solo en historial) */}
                {showHistorial && (
                  <button
                    onClick={() => unarchiveCandidate(candidate.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow"
                    title="Desarchivar postulante"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Fecha de archivado (solo en historial) */}
              {showHistorial && candidate.fechaArchivado && (
                <div className="mt-2 text-xs text-slate-500 text-center">
                  Archivado el: {new Date(candidate.fechaArchivado).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
            ))}
          </div>
        )}

        {/* Stats - Statistics Cards (solo para activos) */}
        {!loading && !error && !showHistorial && (
          <div className="max-w-6xl mx-auto mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Postulantes Activos */}
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-6 border-2 border-blue-300 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {activeCandidates.length}
                </div>
                <div className="text-blue-700 font-semibold text-lg">Total Postulantes Activos</div>
              </div>
              
              {/* Aptos (>=60) */}
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-6 border-2 border-green-300 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {activeCandidates.filter(c => {
                    const score = typeof c.score === 'number' ? c.score : (typeof c.rating === 'number' ? c.rating : 0);
                    return score >= 60;
                  }).length}
                </div>
                <div className="text-green-700 font-semibold text-lg">Aptos (≥60)</div>
              </div>
              
              {/* Probables (50-59) */}
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="text-5xl font-bold text-yellow-600 mb-2">
                  {activeCandidates.filter(c => {
                    const score = typeof c.score === 'number' ? c.score : (typeof c.rating === 'number' ? c.rating : 0);
                    return score >= 50 && score < 60;
                  }).length}
                </div>
                <div className="text-yellow-700 font-semibold text-lg">Probables (50-59)</div>
              </div>
              
              {/* No Aptos (<50) */}
              <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-2xl p-6 border-2 border-red-300 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="text-5xl font-bold text-red-600 mb-2">
                  {activeCandidates.filter(c => {
                    const score = typeof c.score === 'number' ? c.score : (typeof c.rating === 'number' ? c.rating : 0);
                    return score < 50;
                  }).length}
                </div>
                <div className="text-red-700 font-semibold text-lg">No Aptos (&lt;50)</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats - Historial (solo para historial) */}
        {!loading && !error && showHistorial && (
          <div className="max-w-6xl mx-auto mt-12">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-6 border-2 border-purple-300 shadow-lg text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {historialCandidates.length}
              </div>
              <div className="text-purple-700 font-semibold text-lg">Total en Historial</div>
              <p className="text-purple-600 text-sm mt-2">Postulantes archivados anteriormente</p>
            </div>
          </div>
        )}
      </div>
    </ComiteLayout>
  );
}