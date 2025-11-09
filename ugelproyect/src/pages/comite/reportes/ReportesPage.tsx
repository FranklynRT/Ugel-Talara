import { useState, useEffect } from 'react';
import ComiteLayout from '@/layouts/ComiteLayout';
import { useAuth } from '@/context/AuthContext';
import { FileText, Paperclip, Mail, Star, CheckCircle, XCircle, Download, Eye, Brain, TrendingUp, Briefcase, Wand2, Archive, ArchiveRestore } from 'lucide-react';
import { ReportePostulante } from '@/interfaces/ReportInterfaces';
import { AIService } from '@/services/aiService';
import toast, { Toaster } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ReportesPage = () => {
  const { user, logout } = useAuth();
  const [reportes, setReportes] = useState<ReportePostulante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportePostulante | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showAnexosModal, setShowAnexosModal] = useState(false);
  const [anexosDetails, setAnexosDetails] = useState<any[]>([]);
  const [convocatoriasAsignadas, setConvocatoriasAsignadas] = useState<number[]>([]);
  const [archivedReportIds, setArchivedReportIds] = useState<Set<number>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  
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

  // Cargar reportes archivados desde localStorage
  useEffect(() => {
    try {
      const savedArchived = localStorage.getItem('reportes-ia-archivados');
      if (savedArchived) {
        const archivedArray = JSON.parse(savedArchived);
        if (Array.isArray(archivedArray)) {
          setArchivedReportIds(new Set(archivedArray.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))));
        }
      }
    } catch (error) {
      console.error('Error cargando reportes archivados:', error);
    }
  }, []);

  // Guardar reportes archivados en localStorage
  const saveArchivedToStorage = (archivedIds: Set<number>) => {
    try {
      localStorage.setItem('reportes-ia-archivados', JSON.stringify(Array.from(archivedIds)));
    } catch (error) {
      console.error('Error guardando reportes archivados:', error);
    }
  };

  // Función para archivar/desarchivar un reporte
  const toggleArchiveReport = (reportId: number) => {
    setArchivedReportIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
        toast.success('✅ Reporte removido del historial', { icon: '📤', duration: 2000 });
      } else {
        newSet.add(reportId);
        toast.success('✅ Reporte agregado al historial', { icon: '📦', duration: 2000 });
      }
      saveArchivedToStorage(newSet);
      return newSet;
    });
  };


  // Inferir estado desde texto de IA
  const inferEstadoDesdeContenido = (texto: any): 'approved' | 'rejected' | 'pending' => {
    // Convertir a string de forma segura
    let textoStr = '';
    if (typeof texto === 'string') {
      textoStr = texto;
    } else if (texto !== null && texto !== undefined) {
      // Si es un objeto, intentar convertirlo a string
      if (typeof texto === 'object') {
        try {
          textoStr = JSON.stringify(texto);
        } catch {
          textoStr = String(texto);
        }
      } else {
        textoStr = String(texto);
      }
    }
    
    const t = textoStr.toLowerCase();
    if (!t || t.trim() === '') return 'pending';
    if (/(\baprob|recomendad|cumple\b|viable|favorable)/.test(t) && !/(no cumple|desaprob|rechaz)/.test(t)) return 'approved';
    if (/(\bno cumple\b|rechaz|desaprob|insuficien|inviable)/.test(t)) return 'rejected';
    return 'pending';
  };

  const fetchReportes = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Frontend: Obteniendo reportes de IA...");
      
      // Usar el servicio de IA
      const data = await AIService.getReportesIA();
      console.log("Frontend: Reportes de IA recibidos:", data);
      console.log("Frontend: Tipo de datos:", typeof data);
      console.log("Frontend: ¿Es array?:", Array.isArray(data));
      console.log("Frontend: Cantidad de reportes:", Array.isArray(data) ? data.length : 'N/A');
      
      // Verificar que data es un array
      if (!Array.isArray(data)) {
        console.error("❌ Error: Los datos recibidos no son un array:", data);
        throw new Error('Los datos recibidos no son válidos');
      }
      
      if (data.length === 0) {
        console.warn("⚠️ No se recibieron reportes del backend");
      }
      
      // Procesar y normalizar los datos con campos de automatización
      console.log(`🔄 Procesando ${data.length} reportes...`);
      const reportesProcesados: ReportePostulante[] = data.map((reporte: any, index: number) => {
        // Log del primer reporte para debugging
        if (index === 0) {
          console.log('📋 Primer reporte recibido (raw):', {
            id: reporte.id,
            IDREPORTE: reporte.IDREPORTE,
            userId: reporte.userId,
            convocatoriaId: reporte.convocatoriaId,
            nombre_completo: reporte.nombre_completo,
            tieneAnalisis: !!reporte.analisis,
            tieneContenido: !!reporte.contenido,
            tipoAnalisis: typeof reporte.analisis,
            tipoContenido: typeof reporte.contenido
          });
        }
        
        // Asegurar que el contenido sea una cadena
        // Manejar casos donde analisis puede ser un objeto JSON parseado o string
        let contenido = '';
        try {
          // Primero intentar con reporte.contenido
          if (reporte.contenido !== null && reporte.contenido !== undefined) {
            if (typeof reporte.contenido === 'string') {
              contenido = reporte.contenido;
            } else if (typeof reporte.contenido === 'object') {
              // Si es un objeto, intentar stringificarlo
              try {
                contenido = JSON.stringify(reporte.contenido);
              } catch {
                contenido = String(reporte.contenido);
              }
            } else {
              contenido = String(reporte.contenido);
            }
          } 
          // Si no hay contenido, intentar con reporte.analisis
          else if (reporte.analisis !== null && reporte.analisis !== undefined) {
            if (typeof reporte.analisis === 'string') {
              contenido = reporte.analisis;
            } else if (typeof reporte.analisis === 'object') {
              // Si es un objeto, intentar stringificarlo
              try {
                contenido = JSON.stringify(reporte.analisis);
              } catch {
                contenido = String(reporte.analisis);
              }
            } else {
              contenido = String(reporte.analisis);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error al procesar contenido del reporte:', error);
          contenido = '';
        }
        
        const estadoInferido = inferEstadoDesdeContenido(contenido);
        const estado = (reporte.estado_evaluacion as any) || estadoInferido;
        const score = typeof reporte.score === 'number' ? reporte.score : (typeof reporte.calificacion === 'number' ? reporte.calificacion * 10 : 0);
        
        // Procesar anexos - priorizar anexos completos si están disponibles
        let anexos: any[] = [];
        if (Array.isArray(reporte.anexosCompletos) && reporte.anexosCompletos.length > 0) {
          // Usar anexos completos
          anexos = reporte.anexosCompletos.map((anexo: any) => ({
            id: anexo.IDANEXO || anexo.id || 0,
            nombre: `Anexo_${anexo.IDANEXO || anexo.id}.pdf`,
            url: `/ugel-talara/documentos/anexos-completos/${anexo.IDANEXO || anexo.id}/download`,
            tipo: 'Anexo 01',
            fechaCreacion: anexo.fechaCreacion,
            formacionAcademica: anexo.formacionAcademica,
            experienciaLaboral: anexo.experienciaLaboral,
            referenciasLaborales: anexo.referenciasLaborales,
            idiomas: anexo.idiomas,
            ofimatica: anexo.ofimatica,
            colegioProfesional: anexo.colegioProfesional
          }));
        } else if (Array.isArray(reporte.anexos) && reporte.anexos.length > 0) {
          // Usar anexos básicos
          anexos = reporte.anexos.map((anexo: any) => ({
            id: anexo.id || 0,
            nombre: anexo.nombre || 'Sin nombre',
            url: anexo.url || '',
            tipo: anexo.tipo || 'Documento'
          }));
        }
        
        return {
          id: reporte.id || reporte.IDREPORTE || 0,
          nombre_completo: reporte.nombre_completo || 'Sin nombre',
          email: reporte.email || 'Sin email',
          puesto_postulado: reporte.puesto_postulado || 'Sin puesto',
          calificacion: typeof reporte.calificacion === 'number' ? reporte.calificacion : (score > 0 ? Number((score/10).toFixed(1)) : 0),
          estado_evaluacion: estado,
          experiencia_relevante: (() => {
            // Procesar experiencia_relevante para manejar Buffers serializados
            const exp = reporte.experiencia_relevante;
            if (!exp) return 'No disponible';
            if (typeof exp === 'string') return exp;
            if (typeof exp === 'object' && exp !== null) {
              // Si es un objeto Buffer serializado (viene del backend)
              if (exp.type === 'Buffer' && Array.isArray(exp.data)) {
                try {
                  // Convertir array de bytes a string UTF-8
                  const bytes = new Uint8Array(exp.data);
                  if (typeof TextDecoder !== 'undefined') {
                    const decoder = new TextDecoder('utf-8');
                    return decoder.decode(bytes);
                  }
                  let result = '';
                  for (let i = 0; i < bytes.length; i++) {
                    result += String.fromCharCode(bytes[i]);
                  }
                  return result;
                } catch {
                  return String(exp);
                }
              }
              return JSON.stringify(exp);
            }
            return String(exp);
          })(),
          habilidades_clave: (() => {
            // Procesar habilidades_clave para manejar Buffers serializados
            const habs = reporte.habilidades_clave;
            if (Array.isArray(habs)) {
              return habs.map(h => {
                if (typeof h === 'string') return h;
                if (h && typeof h === 'object' && h.type === 'Buffer' && Array.isArray(h.data)) {
                  try {
                    const bytes = new Uint8Array(h.data);
                    if (typeof TextDecoder !== 'undefined') {
                      const decoder = new TextDecoder('utf-8');
                      return decoder.decode(bytes);
                    }
                    let result = '';
                    for (let i = 0; i < bytes.length; i++) {
                      result += String.fromCharCode(bytes[i]);
                    }
                    return result;
                  } catch {
                    return String(h);
                  }
                }
                return String(h);
              }).filter(h => h && h.trim() !== '');
            }
            if (habs && typeof habs === 'object') {
              // Si es un objeto Buffer serializado
              if (habs.type === 'Buffer' && Array.isArray(habs.data)) {
              try {
                const bytes = new Uint8Array(habs.data);
                let bufferString = '';
                if (typeof TextDecoder !== 'undefined') {
                  const decoder = new TextDecoder('utf-8');
                  bufferString = decoder.decode(bytes);
                } else {
                  for (let i = 0; i < bytes.length; i++) {
                    bufferString += String.fromCharCode(bytes[i]);
                  }
                }
                const parsed = JSON.parse(bufferString);
                return Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                return [];
              }
              }
              return [JSON.stringify(habs)];
            }
            return [];
          })(),
          anexos: anexos,
          anexosCompletos: Array.isArray(reporte.anexosCompletos) ? reporte.anexosCompletos : (anexos.length > 0 ? anexos : null),
          cv_url: reporte.cv_url || null,
          contenido,
          // Campos de automatización
          score: score,
          razones: Array.isArray(reporte.razones) ? reporte.razones : [],
          motivo_rechazo: reporte.motivo_rechazo,
          convocatoria_usada: reporte.convocatoria_usada,
          totalAnexos: typeof reporte.totalAnexos === 'number' ? reporte.totalAnexos : anexos.length,
          area: reporte.area || reporte.convocatoria_usada?.area,
          numero_cas: reporte.numero_cas || reporte.convocatoria_usada?.numero_cas,
          userId: reporte.userId || reporte.IDUSUARIO || null,
          convocatoriaId: reporte.convocatoriaId || reporte.IDCONVOCATORIA || null,
          apto: reporte.apto !== undefined ? reporte.apto : (estado === 'approved'),
          declaraciones: reporte.declaraciones || null
        } as any;
      });
      
      // Si no hay reportes, intentar construirlos desde verificaciones y anexos
      if (reportesProcesados.length === 0) {
        try {
          const base = (AIService as any).baseURL || '';
          const token = localStorage.getItem('token') || '';
          const commonHeaders: any = {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'application/json'
          };

          const verifRes = await fetch(`${base}/documentos/verificaciones-sesion-comite?ts=${Date.now()}`, {
            headers: commonHeaders
          });
          let candidatos: any[] = [];
          if (verifRes.ok) {
            const vdata = await verifRes.json();
            const items = Array.isArray(vdata?.verificaciones) ? vdata.verificaciones : [];
            // Enriquecer con candidatos que tienen anexos completos (para mapear IDUSUARIO)
            let enrichMap: Record<string, any> = {};
            try {
              const enrich = await fetch(`${base}/evaluaciones/candidates-with-cv?ts=${Date.now()}`, { headers: commonHeaders });
              if (enrich.ok) {
                const list = await enrich.json();
                (list || []).forEach((c: any) => {
                  const emailKey = (c.email || '').toLowerCase();
                  const dniKey = (c.documento || '').toLowerCase();
                  if (emailKey) enrichMap[`email:${emailKey}`] = c;
                  if (dniKey) enrichMap[`dni:${dniKey}`] = c;
                });
              }
            } catch {}

            for (let i = 0; i < items.length; i++) {
              const v = items[i] || {};
              const q = v.datosQR || {};
              const email = (q.email || '').toLowerCase();
              const dni = (q.dni || q.documento || '').toLowerCase();
              let anexos: any[] = [];
              let anexosCompletos: any[] = [];
              let userId: number | null = null;
              const match = enrichMap[`email:${email}`] || enrichMap[`dni:${dni}`];
              if (match) {
                const m = match;
                userId = m.id;
                // Obtener anexos completos del usuario
                if (userId) {
                  try {
                    const anexosCompletosRes = await fetch(`${base}/anexos-completos/usuario/${userId}?ts=${Date.now()}`, { headers: commonHeaders, cache: 'no-store' as RequestCache });
                    if (anexosCompletosRes.ok) {
                      const anexosData = await anexosCompletosRes.json();
                      anexosCompletos = Array.isArray(anexosData) ? anexosData : [];
                      anexos = anexosCompletos.map((a: any) => ({
                        id: a.IDANEXO,
                        nombre: `Anexo_${a.IDANEXO}.pdf`,
                        url: `${base}/anexos-completos/${a.IDANEXO}/download`,
                        tipo: 'Anexo 01'
                      }));
                    }
                  } catch {}
                }
              }
              // Contenido detallado a partir de anexos completos
              const resumenAnexos = anexosCompletos.length > 0
                ? `Anexos completos (${anexosCompletos.length}): Total de documentos presentados`
                : anexos.length > 0
                ? `Anexos (${anexos.length}): ${anexos.slice(0,5).map(a=>a.nombre).join(', ')}${anexos.length>5?` y +${anexos.length-5} más`:''}`
                : 'Sin anexos';
              const contenido = `Detalle generado automáticamente\n- Postulante: ${q.postulante || 'Sin nombre'}\n- Puesto: ${q.puesto || 'Sin puesto'}\n- ${resumenAnexos}`;
              candidatos.push({
                id: i + 1,
                nombre_completo: q.postulante || 'Sin nombre',
                email: q.email || 'Sin email',
                puesto_postulado: q.puesto || 'Sin puesto',
                calificacion: Math.min(10, 2 + Math.min(8, anexosCompletos.length + anexos.length)),
                estado_evaluacion: 'pending',
                experiencia_relevante: resumenAnexos,
                habilidades_clave: [],
                contenido,
                anexos: anexos.length > 0 ? anexos : [],
                anexosCompletos: anexosCompletos.length > 0 ? anexosCompletos : null,
                cv_url: null,
                userId: userId
              });
            }
          }
          reportesProcesados.push(...candidatos);
          // Automatización: si hay candidatos con anexos completos, intentar generar reportes IA y volver a consultar
          if (candidatos.some(c => (c.anexosCompletos || c.anexos || []).length > 0)) {
            try {
              await AIService.generarReportesIA();
              const again = await AIService.getReportesIA();
              if (Array.isArray(again) && again.length > 0) {
                // Reemplazar por los reportes generados por IA
                const reprocesados: ReportePostulante[] = again.map((reporte: any) => ({
                  id: reporte.id || 0,
                  nombre_completo: reporte.nombre_completo || 'Sin nombre',
                  email: reporte.email || 'Sin email',
                  puesto_postulado: reporte.puesto_postulado || 'Sin puesto',
                  calificacion: typeof reporte.calificacion === 'number' ? reporte.calificacion : 0,
                  estado_evaluacion: reporte.estado_evaluacion || 'pending',
                  experiencia_relevante: reporte.experiencia_relevante || 'No disponible',
                  habilidades_clave: Array.isArray(reporte.habilidades_clave) ? reporte.habilidades_clave : [],
                  anexos: Array.isArray(reporte.anexos) ? reporte.anexos.map((anexo: any) => ({
                    id: anexo.id || 0,
                    nombre: anexo.nombre || 'Sin nombre',
                    url: anexo.url || '',
                    tipo: anexo.tipo || 'Documento'
                  })) : [],
                  cv_url: reporte.cv_url || null
                }));
                reportesProcesados.splice(0, reportesProcesados.length, ...reprocesados);
              }
            } catch {}
          }
        } catch {}
      }

      // Filtrar reportes por convocatorias asignadas al usuario/grupo
      let reportesFiltrados = reportesProcesados;
      if (convocatoriasAsignadas.length > 0) {
        reportesFiltrados = reportesProcesados.filter((reporte: ReportePostulante) => {
          const reporteConvocatoriaId = (reporte as any).convocatoriaId || (reporte as any).IDCONVOCATORIA;
          // Si el reporte no tiene convocatoriaId, intentar obtenerlo del convocatoria_usada
          const convocatoriaIdFromData = reporteConvocatoriaId || 
            ((reporte as any).convocatoria_usada?.IDCONVOCATORIA || (reporte as any).convocatoria_usada?.id);
          
          // Si el reporte tiene una convocatoria asignada, verificar que esté en la lista
          if (convocatoriaIdFromData) {
            return convocatoriasAsignadas.includes(Number(convocatoriaIdFromData));
          }
          
          // Si el reporte no tiene convocatoriaId, no mostrarlo (solo mostrar reportes con convocatoria asignada)
          return false;
        });
        
        console.log(`🔍 Filtrado por convocatorias: ${reportesProcesados.length} reportes totales → ${reportesFiltrados.length} reportes filtrados`);
        console.log(`📋 Convocatorias asignadas al usuario:`, convocatoriasAsignadas);
      }
      
      // Mostrar solo los reportes filtrados por convocatoria
      setReportes(reportesFiltrados);
      
      // Log adicional para debugging
      console.log(`📊 Reportes guardados en estado: ${reportesProcesados.length}`);
      if (reportesProcesados.length > 0) {
        console.log('📋 Ejemplo de reporte guardado:', {
          id: reportesProcesados[0].id,
          nombre: reportesProcesados[0].nombre_completo,
          email: reportesProcesados[0].email,
          tieneId: !!reportesProcesados[0].id && reportesProcesados[0].id > 0
        });
      }
      console.log(`✅ ${reportesProcesados.length} reportes cargados correctamente`);
      if (reportesProcesados.length > 0) {
        console.log('📋 Primer reporte procesado (final):', {
          id: reportesProcesados[0].id,
          nombre_completo: reportesProcesados[0].nombre_completo,
          estado_evaluacion: reportesProcesados[0].estado_evaluacion,
          score: reportesProcesados[0].score,
          tieneContenido: !!reportesProcesados[0].contenido
        });
      }
      
      if (reportesProcesados.length > 0) {
        toast.success(`📊 Reportes listos! ${reportesProcesados.length} reportes de IA disponibles`);
      } else {
        toast('ℹ️ No hay reportes disponibles aún');
      }
    } catch (err) {
      console.error("Error fetching reportes:", err);
      
      // Detectar si es un error HTML (página de error)
      if (err instanceof SyntaxError && err.message.includes('<!DOCTYPE')) {
        toast.error('⚠️ Error de conexión: El servidor no responde correctamente');
        setError("Error de conexión con el servidor. Verifica que la API esté funcionando.");
      } else if (err instanceof Error) {
        if (err.message.includes('Token inválido') || err.message.includes('401')) {
          setError("Sesión expirada. Por favor, inicia sesión nuevamente.");
        } else if (err.message.includes('fetch') || err.message.includes('Network')) {
          setError("Error de conexión. Verifica que el servidor esté funcionando.");
        } else {
          setError(`Error al cargar los reportes: ${err.message}`);
        }
      } else {
        setError("Error al cargar los reportes de IA. Inténtalo de nuevo más tarde.");
      }
      
      toast.error('❌ Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  // Botón: Calificar con IA (1-100) - Incluye análisis de CV, convocatorias, anexos, reglas y bonos
  const calificarIA_1a100 = async () => {
    try {
      setLoading(true);
      const base = (AIService as any).baseURL || '';
      const token = localStorage.getItem('token') || '';
      const headers: any = {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      // Llamar al endpoint que analiza todo: CV, anexos, convocatorias, reglas y bonos
      const resp = await fetch(`${base}/reports/analyze-anexos-completo?ts=${Date.now()}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          incluirCV: true,
          incluirConvocatorias: true,
          incluirReglasBonos: true,
          usarURLs: true // Usar URLs para acceder a los documentos
        })
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const result = await resp.json();
      await fetchReportes();
      toast.success(`✅ Calificación con IA completada: ${result.total || 0} postulantes analizados`);
    } catch (error) {
      console.error('Error en calificar IA 1-100:', error);
      // Fallback al método anterior
      try {
        await AIService.analizarAnexos();
        await fetchReportes();
        toast.success('✅ Calificación con IA completada (método básico)');
      } catch (fallbackError) {
        toast.error('❌ Error al calificar con IA');
      }
    } finally {
      setLoading(false);
    }
  };

  // Generar PDF del reporte de IA
  const exportReport = async (reportId: number) => {
    setExporting(true);
    try {
      const reporte = reportes.find(r => r.id === reportId) || selectedReport;
      if (!reporte) {
        throw new Error('Reporte no encontrado');
      }

      const base = (AIService as any).baseURL || '';
      const token = localStorage.getItem('token') || '';
      const headers: any = {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      // Llamar al endpoint del backend para generar PDF
      const pdfRes = await fetch(`${base}/documentos/reportes-ia/${reportId}/pdf`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reporte: {
            id: reporte.id,
            nombre_completo: reporte.nombre_completo,
            email: reporte.email,
            puesto_postulado: reporte.puesto_postulado,
            calificacion: reporte.calificacion,
            score: (reporte as any).score,
            estado_evaluacion: reporte.estado_evaluacion,
            experiencia_relevante: reporte.experiencia_relevante,
            habilidades_clave: reporte.habilidades_clave,
            contenido: reporte.contenido,
            convocatoria_usada: (reporte as any).convocatoria_usada,
            declaraciones: (reporte as any).declaraciones,
            evaluacionRequisitos: (reporte as any).evaluacionRequisitos,
            reglasAplicadas: (reporte as any).reglasAplicadas,
            bonosAplicados: (reporte as any).bonosAplicados,
            razones: (reporte as any).razones,
            apto: (reporte as any).apto
          }
        })
      });

      if (pdfRes.ok) {
        const blob = await pdfRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_IA_${reporte.nombre_completo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('✅ PDF generado exitosamente');
      } else {
        // Fallback: generar PDF básico en el frontend
        throw new Error('El servidor no pudo generar el PDF');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      // Fallback: crear PDF básico
      try {
        const reporte = reportes.find(r => r.id === reportId) || selectedReport;
        if (reporte) {
          const contenido = `
REPORTE DE EVALUACIÓN DE IA
============================

Candidato: ${reporte.nombre_completo}
Email: ${reporte.email}
Puesto: ${reporte.puesto_postulado}
Calificación: ${reporte.calificacion}/10
Score: ${(reporte as any).score || 'N/A'}/100
Estado: ${reporte.estado_evaluacion}
Apto: ${(reporte as any).apto ? 'SÍ' : 'NO'}

EXPERIENCIA RELEVANTE:
${reporte.experiencia_relevante}

HABILIDADES CLAVE:
${reporte.habilidades_clave.join(', ')}

ANÁLISIS DE IA:
${reporte.contenido || 'No disponible'}

${(reporte as any).evaluacionRequisitos ? `EVALUACIÓN DE REQUISITOS:\n${(reporte as any).evaluacionRequisitos}\n` : ''}
${(reporte as any).reglasAplicadas ? `REGLAS APLICADAS:\n${JSON.stringify((reporte as any).reglasAplicadas, null, 2)}\n` : ''}
${(reporte as any).bonosAplicados ? `BONOS APLICADOS:\n${JSON.stringify((reporte as any).bonosAplicados, null, 2)}\n` : ''}

Fecha de generación: ${new Date().toLocaleDateString()}
          `;
          const blob = new Blob([contenido], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `reporte_${reportId}_${new Date().toISOString().split('T')[0]}.txt`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast('⚠️ PDF generado en formato texto (fallback)', { icon: '⚠️' });
        }
      } catch (fallbackError) {
        toast.error('❌ Error al exportar el reporte');
      }
    } finally {
      setExporting(false);
    }
  };

  const viewReportDetails = async (report: ReportePostulante) => {
    // Cargar todos los anexos completos del postulante
    try {
      const base = (AIService as any).baseURL || '';
      const token = localStorage.getItem('token') || '';
      const headers: any = {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
        'Cache-Control': 'no-store'
      };

      // Resolver ID de usuario por email si no lo tenemos
      let postulanteId: number | null = report.userId || null;
      if (!postulanteId) {
        try {
          const enrich = await fetch(`${base}/evaluaciones/candidates-with-cv?ts=${Date.now()}`, { headers, cache: 'no-store' as RequestCache });
          if (enrich.ok) {
            const lista = await enrich.json();
            const byEmail: Record<string, any> = {};
            (lista || []).forEach((c: any) => {
              const key = (c.email || '').toLowerCase();
              if (key) byEmail[key] = c;
            });
            const emailKey = (report.email || '').toLowerCase();
            postulanteId = (byEmail[emailKey]?.id) || (byEmail[emailKey]?.IDUSUARIO) || null;
          }
        } catch {}
      }

      if (postulanteId) {
        // Obtener todos los anexos completos del postulante
        const ts = Date.now();
        const anexosRes = await fetch(`${base}/anexos-completos/usuario/${postulanteId}?ts=${ts}`, {
          headers,
          cache: 'no-store'
        });
        
        let anexosCompletos: any[] = [];
        if (anexosRes.ok) {
          const anexosData = await anexosRes.json();
          anexosCompletos = Array.isArray(anexosData) ? anexosData : [];
        }

        // Obtener anexos básicos también para compatibilidad
        const anexosResBasic = await fetch(`${base}/anexos/filtered?IDUSUARIO=${postulanteId}&ts=${ts}`, {
          headers,
          cache: 'no-store'
        });
        
        let anexos: any[] = [];
        if (anexosResBasic.ok) {
          const anexosData = await anexosResBasic.json();
          anexos = Array.isArray(anexosData) ? anexosData.map((a: any) => ({
            id: a.IDANEXO,
            nombre: a.nombreArchivo || 'Anexo.pdf',
            url: a.rutaArchivoPDF || a.nombreArchivo || '',
            tipo: a.tipoAnexo || 'Documento'
          })) : [];
        }

        // Filtrar anexos básicos para evitar duplicados con anexos completos
        // Si hay anexos completos, excluir anexos básicos que tengan el mismo ID
        const anexosCompletosIds = new Set(anexosCompletos.map((a: any) => a.IDANEXO || a.IDANEXO_COMPLETO).filter(Boolean));
        const anexosFiltrados = anexos.filter((a: any) => {
          // Excluir anexos básicos que ya están en anexos completos
          return !anexosCompletosIds.has(a.id || a.IDANEXO);
        });
        
        setSelectedReport({ 
          ...report, 
          // Si hay anexos completos, solo incluir anexos básicos que no estén duplicados
          anexos: anexosCompletos.length > 0 ? anexosFiltrados : (anexos.length > 0 ? anexos : report.anexos),
          anexosCompletos: anexosCompletos,
          userId: postulanteId
        } as any);
        return;
      }
    } catch (err) {
      console.error('Error cargando anexos completos:', err);
    }
    setSelectedReport(report);
  };

  // Ejecutar automatización IA por postulante desde el detalle
  // Incluye análisis de CV, revisión de convocatorias, anexos, reglas y bonos mediante URLs
  const evaluarReporteConIA = async (report: ReportePostulante) => {
    try {
      setLoading(true);
      const base = (AIService as any).baseURL || '';
      const token = localStorage.getItem('token') || '';
      const headers: any = {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      };

      // Resolver ID de usuario por email
      let postulanteId: number | null = null;
      let cvUrl: string | null = null;
      try {
        const enrich = await fetch(`${base}/evaluaciones/candidates-with-cv?ts=${Date.now()}`, { headers, cache: 'no-store' as RequestCache });
        if (enrich.ok) {
          const lista = await enrich.json();
          const byEmail: Record<string, any> = {};
          (lista || []).forEach((c: any) => {
            const key = (c.email || '').toLowerCase();
            if (key) byEmail[key] = c;
          });
          const emailKey = (report.email || '').toLowerCase();
          const match = byEmail[emailKey];
          postulanteId = match?.id || match?.IDUSUARIO || null;
          cvUrl = match?.cv_url || match?.curriculumUrl || null;
        }
      } catch {}

      if (!postulanteId) {
        toast.error('No se pudo resolver el ID del postulante por email');
        return;
      }

      // Obtener convocatoria ID desde el reporte o localStorage
      let convocatoriaId = Number((report as any).convocatoriaId || localStorage.getItem('currentConvocatoriaId') || '1');
      
      // Si no tenemos convocatoriaId, intentar obtenerlo desde verificaciones
      if (!convocatoriaId || convocatoriaId === 1) {
        try {
          const verifRes = await fetch(`${base}/documentos/verificaciones-sesion-comite?ts=${Date.now()}`, { headers });
          if (verifRes.ok) {
            const verifData = await verifRes.json();
            const verificaciones = Array.isArray(verifData?.verificaciones) ? verifData.verificaciones : [];
            const verif = verificaciones.find((v: any) => {
              const dq = v?.datosQR || {};
              const email = (dq.email || '').toLowerCase();
              return email === (report.email || '').toLowerCase();
            });
            if (verif?.datosQR?.convocatoriaId) {
              convocatoriaId = Number(verif.datosQR.convocatoriaId);
            }
          }
        } catch {}
      }

      // Obtener anexos completos con URLs
      let anexosCompletosUrls: string[] = [];
      try {
        const anexosRes = await fetch(`${base}/anexos-completos/usuario/${postulanteId}?ts=${Date.now()}`, {
          headers,
          cache: 'no-store'
        });
        if (anexosRes.ok) {
          const anexosData = await anexosRes.json();
          const anexosArray = Array.isArray(anexosData) ? anexosData : [];
          // Construir URLs completas para cada anexo
          anexosCompletosUrls = anexosArray.map((anexo: any) => {
            const anexoId = anexo.IDANEXO || anexo.id;
            return `${base}/anexos-completos/${anexoId}/download`;
          });
        }
      } catch (err) {
        console.error('Error obteniendo anexos completos:', err);
      }

      // Obtener información completa de la convocatoria (requisitos, reglas, bonos)
      let convocatoriaCompleta: any = null;
      try {
        const convRes = await fetch(`${base}/convocatorias/${convocatoriaId}?ts=${Date.now()}`, { headers });
        if (convRes.ok) {
          convocatoriaCompleta = await convRes.json();
        }
      } catch (err) {
        console.error('Error obteniendo convocatoria:', err);
      }

      // Preparar datos para análisis con URLs
      const datosAnalisis = {
        postulanteId,
        convocatoriaId,
        cvUrl: cvUrl ? (cvUrl.startsWith('http') ? cvUrl : `${base}${cvUrl}`) : null,
        anexosUrls: anexosCompletosUrls,
        convocatoria: convocatoriaCompleta,
        // Incluir email para referencia
        email: report.email
      };

      // Llamar al endpoint de análisis con todos los datos
      const url = `${base}/documentos/anexos/analizar/${postulanteId}/${convocatoriaId}?ts=${Date.now()}`;
      const resp = await fetch(url, { 
        method: 'POST', 
        headers,
        body: JSON.stringify({
          cvUrl: datosAnalisis.cvUrl,
          anexosUrls: datosAnalisis.anexosUrls,
          convocatoria: datosAnalisis.convocatoria,
          incluirCV: true, // Indicar que se debe analizar el CV
          incluirReglasBonos: true // Indicar que se deben revisar reglas y bonos
        })
      });
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data: any = await resp.json();
      const score = typeof data.score === 'number' ? data.score : 0;
      const estado = (data.estado_evaluacion as 'approved' | 'rejected' | 'pending') || (score >= 60 ? 'approved' : (score < 50 ? 'rejected' : 'pending'));
      const apto = Boolean(data.apto !== undefined ? data.apto : (score >= 60));
      const razones = Array.isArray(data.razones) ? data.razones : [];
      const estadoEs = apto ? 'APTO' : 'NO APTO';

      // Actualizar en memoria el reporte seleccionado con todos los datos de automatización
      setSelectedReport(prev => prev ? {
        ...prev,
        calificacion: Number((score / 10).toFixed(1)),
        estado_evaluacion: estado,
        contenido: prev.contenido || (data.analisis || ''),
        // Campos adicionales de automatización
        score: score,
        razones: razones,
        motivo_rechazo: data.motivo_rechazo,
        convocatoria_usada: data.convocatoria_usada || convocatoriaCompleta,
        totalAnexos: data.totalAnexos || anexosCompletosUrls.length,
        area: data.convocatoria_usada?.area || convocatoriaCompleta?.area,
        numero_cas: data.convocatoria_usada?.numero_cas || convocatoriaCompleta?.numero_cas,
        apto: apto,
        declaraciones: data.declaraciones,
        evaluacionRequisitos: data.analisis || data.evaluacionRequisitos,
        reglasAplicadas: data.reglasAplicadas,
        bonosAplicados: data.bonosAplicados
      } as any : prev);

      // Actualizar colección para que los contadores se reflejen inmediatamente
      setReportes(prev => (Array.isArray(prev) ? prev.map(r => {
        if (r.id === report.id || (r.email && r.email.toLowerCase() === report.email.toLowerCase())) {
          return {
            ...r,
            score,
            calificacion: Number((score / 10).toFixed(1)),
            estado_evaluacion: estado,
          } as any;
        }
        return r;
      }) : prev));

      toast.success(`Evaluado: ${score}/100 • ${estadoEs}${razones.length > 0 ? `\n- ${razones.slice(0, 3).join('\n- ')}${razones.length > 3 ? `\n... y ${razones.length - 3} más` : ''}` : ''}`);
    } catch (err) {
      console.error('Error evaluando reporte con IA:', err);
      toast.error('Error al evaluar con IA');
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar PDF de evaluaciones
  const downloadPDFEvaluaciones = async () => {
    setExporting(true);
    try {
      await AIService.generarPDFEvaluaciones();
    } catch (error) {
      console.error('Error al descargar PDF de evaluaciones:', error);
      alert('Error al descargar PDF de evaluaciones');
    } finally {
      setExporting(false);
    }
  };

  // Función para descargar Excel de evaluaciones con resumen y detalles
  const downloadExcelEvaluaciones = () => {
    try {
      setExporting(true);
      
      // Crear un nuevo libro de trabajo
      const workbook = XLSX.utils.book_new();

      // === CALCULAR ESTADÍSTICAS ===
      const totalReportes = reportes.length;
      const reportesActivos = reportes.filter(r => !archivedReportIds.has(r.id)).length;
      const reportesArchivados = reportes.filter(r => archivedReportIds.has(r.id)).length;
      
      const aprobados = reportes.filter(r => {
        const score100 = typeof r.score === 'number' ? r.score : (typeof r.calificacion === 'number' ? r.calificacion * 10 : 0);
        return score100 >= 60 || r.estado_evaluacion === 'approved';
      }).length;
      
      const rechazados = reportes.filter(r => {
        const score100 = typeof r.score === 'number' ? r.score : (typeof r.calificacion === 'number' ? r.calificacion * 10 : 0);
        return score100 < 50 || r.estado_evaluacion === 'rejected';
      }).length;
      
      const pendientes = reportes.filter(r => {
        const score100 = typeof r.score === 'number' ? r.score : (typeof r.calificacion === 'number' ? r.calificacion * 10 : 0);
        return (score100 >= 50 && score100 < 60) || r.estado_evaluacion === 'pending';
      }).length;

      const scores = reportes.map(r => {
        return typeof r.score === 'number' ? r.score : (typeof r.calificacion === 'number' ? r.calificacion * 10 : 0);
      }).filter(s => s > 0);
      
      const promedio = scores.length > 0 ? (scores.reduce((acc, s) => acc + s, 0) / scores.length).toFixed(2) : '0.00';
      const scoreMaximo = scores.length > 0 ? Math.max(...scores) : 0;
      const scoreMinimo = scores.length > 0 ? Math.min(...scores) : 0;

      const conCV = reportes.filter(r => r.cv_url).length;
      const conAnexos = reportes.filter(r => r.anexos && r.anexos.length > 0).length;

      // === HOJA 1: RESUMEN ===
      const resumenData = [
        ['📊 RESUMEN DE REPORTES DE IA - UGEL TALARA'],
        [''],
        ['Reporte generado el:', new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })],
        [''],
        ['ESTADÍSTICAS GENERALES'],
        [''],
        ['Indicador', 'Valor'],
        ['📋 Total de Reportes', totalReportes],
        ['✅ Reportes Activos', reportesActivos],
        ['📦 Reportes en Historial', reportesArchivados],
        [''],
        ['ESTADOS DE EVALUACIÓN'],
        [''],
        ['Estado', 'Cantidad', 'Porcentaje'],
        ['✅ Aprobados', aprobados, totalReportes > 0 ? `${((aprobados / totalReportes) * 100).toFixed(1)}%` : '0%'],
        ['❌ Rechazados', rechazados, totalReportes > 0 ? `${((rechazados / totalReportes) * 100).toFixed(1)}%` : '0%'],
        ['⏳ Pendientes', pendientes, totalReportes > 0 ? `${((pendientes / totalReportes) * 100).toFixed(1)}%` : '0%'],
        [''],
        ['CALIFICACIONES'],
        [''],
        ['Métrica', 'Valor'],
        ['⭐ Promedio de Calificación', `${promedio}/100`],
        ['📈 Calificación Máxima', `${scoreMaximo}/100`],
        ['📉 Calificación Mínima', `${scoreMinimo}/100`],
        [''],
        ['DOCUMENTOS'],
        [''],
        ['Tipo', 'Cantidad'],
        ['📄 Con CV', conCV],
        ['📎 Con Anexos', conAnexos],
        [''],
        ['NOTAS'],
        [''],
        ['• Los reportes son generados automáticamente por IA'],
        ['• Las calificaciones van de 0 a 100 puntos'],
        ['• Los reportes aprobados tienen calificación ≥ 60'],
        ['• Los reportes rechazados tienen calificación < 50'],
        ['• Los reportes pendientes tienen calificación entre 50 y 59']
      ];

      const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
      
      // Estilos para el resumen (ajustar anchos de columnas)
      resumenSheet['!cols'] = [
        { wch: 30 }, // Columna A
        { wch: 20 }  // Columna B
      ];

      // === HOJA 2: DETALLES DE REPORTES ===
      const detallesData = reportes.map((reporte, index) => {
        const score100 = typeof reporte.score === 'number' ? reporte.score : (typeof reporte.calificacion === 'number' ? reporte.calificacion * 10 : 0);
        const estado = score100 >= 60 ? 'Aprobado' : (score100 < 50 ? 'Rechazado' : 'Pendiente');
        const apto = (reporte as any).apto !== undefined ? (reporte as any).apto : (score100 >= 60);
        
        return {
          'N°': index + 1,
          'ID Reporte': reporte.id,
          'Nombre Completo': reporte.nombre_completo,
          'Email': reporte.email,
          'Puesto Postulado': reporte.puesto_postulado,
          'Área': (reporte as any).area || 'N/A',
          'N° CAS': (reporte as any).numero_cas || 'N/A',
          'Calificación': `${score100}/100`,
          'Calificación (Decimal)': reporte.calificacion || 0,
          'Estado': estado,
          'Apto': apto ? 'Sí' : 'No',
          'Estado Evaluación': reporte.estado_evaluacion === 'approved' ? 'Aprobado' : (reporte.estado_evaluacion === 'rejected' ? 'Rechazado' : 'Pendiente'),
          'En Historial': archivedReportIds.has(reporte.id) ? 'Sí' : 'No',
          'Habilidades Clave': Array.isArray(reporte.habilidades_clave) ? reporte.habilidades_clave.join(', ') : 'N/A',
          'N° Habilidades': Array.isArray(reporte.habilidades_clave) ? reporte.habilidades_clave.length : 0,
          'Experiencia Relevante': typeof reporte.experiencia_relevante === 'string' ? reporte.experiencia_relevante.substring(0, 200) : 'N/A',
          'Tiene CV': reporte.cv_url ? 'Sí' : 'No',
          'N° Anexos': reporte.anexos && Array.isArray(reporte.anexos) ? reporte.anexos.length : 0,
          'Convocatoria': (reporte as any).convocatoria_usada?.puesto || (reporte as any).convocatoria_usada?.area || 'N/A',
          'Declaraciones Completas': (reporte as any).declaraciones ? 'Sí' : 'No',
          'Tiene Reglas Aplicadas': (reporte as any).reglasAplicadas ? 'Sí' : 'No',
          'Tiene Bonos Aplicados': (reporte as any).bonosAplicados ? 'Sí' : 'No'
        };
      });

      // Crear hoja de detalles con título
      const detallesHeaders = Object.keys(detallesData[0] || {});
      const detallesArray = [
        ['📋 DETALLES DE REPORTES DE IA - UGEL TALARA'],
        [''],
        ['Reporte generado el:', new Date().toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })],
        ['Total de reportes:', totalReportes],
        [''],
        detallesHeaders, // Encabezados
        ...detallesData.map(row => detallesHeaders.map(key => row[key as keyof typeof row]))
      ];

      const detallesSheet = XLSX.utils.aoa_to_sheet(detallesArray);
      
      // Ajustar anchos de columnas para detalles
      detallesSheet['!cols'] = [
        { wch: 5 },   // N°
        { wch: 10 },  // ID Reporte
        { wch: 25 },  // Nombre Completo
        { wch: 30 },  // Email
        { wch: 25 },  // Puesto Postulado
        { wch: 20 },  // Área
        { wch: 12 },  // N° CAS
        { wch: 12 },  // Calificación
        { wch: 15 },  // Calificación (Decimal)
        { wch: 12 },  // Estado
        { wch: 8 },   // Apto
        { wch: 15 },  // Estado Evaluación
        { wch: 12 },  // En Historial
        { wch: 50 },  // Habilidades Clave
        { wch: 12 },  // N° Habilidades
        { wch: 50 },  // Experiencia Relevante
        { wch: 10 },  // Tiene CV
        { wch: 10 },  // N° Anexos
        { wch: 20 },  // Convocatoria
        { wch: 18 },  // Declaraciones Completas
        { wch: 18 },  // Tiene Reglas Aplicadas
        { wch: 18 }   // Tiene Bonos Aplicados
      ];

      // Agregar hojas al libro
      XLSX.utils.book_append_sheet(workbook, resumenSheet, '📊 Resumen');
      XLSX.utils.book_append_sheet(workbook, detallesSheet, '📋 Detalles');

      // Generar el archivo Excel
      const fileName = `Reportes_IA_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`✅ Excel generado exitosamente: ${fileName}`, { 
        icon: '📊', 
        duration: 3000 
      });
    } catch (error) {
      console.error('Error al descargar Excel de evaluaciones:', error);
      toast.error('❌ Error al generar el archivo Excel', { 
        icon: '❌', 
        duration: 3000 
      });
    } finally {
      setExporting(false);
    }
  };

  // Función para probar IA
  const testGeminiAI = async () => {
    try {
      setLoading(true);
      const result = await AIService.testBackendConnection();
      console.log('Resultado de prueba de IA:', result);
      alert(`✅ ${result.message}`);
      
      // Recargar los reportes después de la prueba exitosa
      await fetchReportes();
    } catch (error) {
      console.error('Error al probar IA:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`❌ Error al probar IA: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar logout cuando la sesión expire
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    logout();
  };

  // Función para visualizar CV
  const viewCV = (cvUrl: string) => {
    if (cvUrl) {
      // Si la URL ya es completa, usarla directamente, sino construirla
      const url = cvUrl.startsWith('http') ? cvUrl : AIService.getFileURL(cvUrl);
      window.open(url, '_blank');
    } else {
      alert('No hay CV disponible para este candidato');
    }
  };

  // Función para visualizar anexos con modal detallado
  const viewAnexos = async (reporte: ReportePostulante) => {
    try {
      if (!reporte || !reporte.anexos || reporte.anexos.length === 0) {
        alert('No hay anexos disponibles para este candidato');
        return;
      }
      
      // Mostrar modal con detalles de anexos
      setAnexosDetails(reporte.anexos);
      setShowAnexosModal(true);
    } catch (error) {
      console.error('Error al obtener anexos:', error);
      alert('Error al obtener los anexos del candidato');
    }
  };

  // Cargar convocatorias asignadas al usuario
  useEffect(() => {
    const cargarConvocatoriasAsignadas = async () => {
      try {
        // Primero intentar desde el usuario (viene del login)
        if (user?.convocatoriasAsignadas && Array.isArray(user.convocatoriasAsignadas) && user.convocatoriasAsignadas.length > 0) {
          const ids = user.convocatoriasAsignadas.map((c: any) => c.IDCONVOCATORIA || c.id || c.convocatoriaId).filter(Boolean);
          setConvocatoriasAsignadas(ids);
          console.log(`✅ Convocatorias asignadas desde user:`, ids);
          return;
        }
        
        // Si no viene en el usuario, intentar desde localStorage
        const savedConvocatorias = localStorage.getItem('userConvocatorias');
        if (savedConvocatorias) {
          try {
            const parsed = JSON.parse(savedConvocatorias);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const ids = parsed.map((c: any) => c.IDCONVOCATORIA || c.id || c.convocatoriaId).filter(Boolean);
              setConvocatoriasAsignadas(ids);
              console.log(`✅ Convocatorias asignadas desde localStorage:`, ids);
              return;
            }
          } catch (e) {
            console.error('Error parsing saved convocatorias:', e);
          }
        }
        
        // Si hay una convocatoria seleccionada en localStorage, usarla
        const selectedConvocatoriaId = localStorage.getItem('selectedConvocatoriaId');
        if (selectedConvocatoriaId) {
          setConvocatoriasAsignadas([Number(selectedConvocatoriaId)]);
          console.log(`✅ Convocatoria seleccionada desde localStorage:`, Number(selectedConvocatoriaId));
          return;
        }
        
        // Si no hay convocatorias, intentar obtenerlas desde el backend
        const base = (AIService as any).baseURL || '';
        const token = localStorage.getItem('token') || '';
        const headers: any = {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        };
        
        if (user?.id) {
          try {
            const response = await fetch(`${base}/users/${user.id}/convocatorias`, { headers });
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data) && data.length > 0) {
                const ids = data.map((c: any) => c.IDCONVOCATORIA || c.id || c.convocatoriaId).filter(Boolean);
                setConvocatoriasAsignadas(ids);
                console.log(`✅ Convocatorias asignadas desde API:`, ids);
              }
            }
          } catch (error) {
            console.error('Error fetching user convocatorias:', error);
          }
        }
      } catch (error) {
        console.error('Error cargando convocatorias asignadas:', error);
      }
    };
    
    cargarConvocatoriasAsignadas();
  }, [user]);
  
  useEffect(() => {
    // Solo cargar reportes si ya tenemos las convocatorias asignadas o si no hay convocatorias asignadas (para evitar cargar reportes de todas las convocatorias)
    if (convocatoriasAsignadas.length > 0 || !user) {
      fetchReportes();
    }
  }, [user, convocatoriasAsignadas]);

  if (loading) {
    return (
      <ComiteLayout>
        <div className="w-full px-4 py-8 text-center">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Brain className="w-16 h-16 text-blue-600 animate-pulse mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Cargando Reportes de ChatGPT</h2>
            <p className="text-slate-600 mb-4">Obteniendo análisis automáticos de postulantes...</p>
            <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </ComiteLayout>
    );
  }

  if (error) {
    return (
      <ComiteLayout>
        <div className="w-full px-4 py-8 text-center">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <XCircle className="w-16 h-16 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Error al Cargar Reportes</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-4">
              <button
                onClick={fetchReportes}
                className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all border border-blue-200"
              >
                Reintentar
              </button>
              {error?.includes('Sesión expirada') && (
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all border border-red-200"
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </ComiteLayout>
    );
  }

  // Vista de detalles del reporte
  if (selectedReport) {
    return (
      <ComiteLayout>
        <div className="w-full px-4 py-8">
          {/* Header con botón de regreso y acciones */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all border border-blue-200"
              >
                ← Volver
              </button>
              <h1 className="text-3xl font-bold text-slate-900">Reporte Detallado de IA</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => evaluarReporteConIA(selectedReport)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all border border-blue-200 disabled:opacity-50"
              >
                Evaluar con IA
              </button>
              <button
                onClick={() => exportReport(selectedReport.id)}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 rounded-lg transition-all border border-purple-500/30 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {exporting ? 'Exportando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>

          {/* Información del candidato */}
          <div className="bg-gradient-to-br from-gray-900/60 to-blue-900/20 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30 shadow-2xl mb-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {selectedReport.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">{selectedReport.nombre_completo}</h2>
                    <p className="text-cyan-300 text-lg mb-2">{selectedReport.puesto_postulado}</p>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{selectedReport.email}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" title="Origen del registro">
                      Registro por QR
                    </div>
                    {/* Campos extra (si existen) */}
                    {(selectedReport as any).area && (
                      <div className="text-blue-300 text-sm">Área: {(selectedReport as any).area}</div>
                    )}
                    {(selectedReport as any).numero_cas && (
                      <div className="text-blue-300 text-sm">N° CAS: {(selectedReport as any).numero_cas}</div>
                    )}
                  </div>
                </div>
              </div>
                <div className="text-right">
                {(() => {
                  const score100 = typeof selectedReport.score === 'number' ? selectedReport.score : Number((selectedReport.calificacion * 10).toFixed(0));
                  const apto = (selectedReport as any).apto !== undefined ? (selectedReport as any).apto : (score100 >= 60);
                  const estado = apto ? '✅ APTO' : '❌ NO APTO';
                  const cls = apto ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200';
                  return (
                    <div className="bg-white p-4 rounded-xl border border-yellow-200">
                      <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-600 mb-2">
                        <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                        <span>{score100}</span>
                        <span className="text-base">/100</span>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium text-center ${cls}`}>
                        {estado}
                      </div>
                    </div>
                  );
                })()}
                </div>
              </div>
            </div>

          {/* Evaluación de Requisitos y Declaraciones Juradas */}
          {((selectedReport as any).evaluacionRequisitos || (selectedReport as any).declaraciones || (selectedReport as any).convocatoria_usada) && (
            <div className="bg-white rounded-2xl p-8 border border-green-200 shadow-xl mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Evaluación de Requisitos y Declaraciones</h3>
                  <p className="text-slate-600">Verificación de cumplimiento de normas y requisitos</p>
                </div>
              </div>

              {/* Información de Convocatoria */}
              {(selectedReport as any).convocatoria_usada && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">Requisitos de la Convocatoria</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-slate-700">N° CAS:</span>
                      <span className="ml-2 text-slate-600">{(selectedReport as any).convocatoria_usada.numero_cas || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Área:</span>
                      <span className="ml-2 text-slate-600">{(selectedReport as any).convocatoria_usada.area || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Puesto:</span>
                      <span className="ml-2 text-slate-600">{(selectedReport as any).convocatoria_usada.puesto || 'N/A'}</span>
                    </div>
                    {(selectedReport as any).convocatoria_usada.licenciatura && (
                      <div>
                        <span className="font-semibold text-slate-700">Título Requerido:</span>
                        <span className="ml-2 text-slate-600">{(selectedReport as any).convocatoria_usada.licenciatura}</span>
                      </div>
                    )}
                    {(selectedReport as any).convocatoria_usada.experiencia && (
                      <div className="md:col-span-2">
                        <span className="font-semibold text-slate-700">Experiencia Requerida:</span>
                        <span className="ml-2 text-slate-600">{(selectedReport as any).convocatoria_usada.experiencia}</span>
                      </div>
                    )}
                    {(selectedReport as any).convocatoria_usada.requisitos && (
                      <div className="md:col-span-2">
                        <span className="font-semibold text-slate-700">Requisitos:</span>
                        <p className="mt-1 text-slate-600 whitespace-pre-wrap">{(selectedReport as any).convocatoria_usada.requisitos}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Declaraciones Juradas */}
              {(selectedReport as any).declaraciones && (
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 mb-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">Declaraciones Juradas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'infoVerdadera', label: 'Información Verdadera' },
                      { key: 'leyProteccionDatos', label: 'Ley de Protección de Datos' },
                      { key: 'datosConsignadosVerdaderos', label: 'Datos Consignados Verdaderos' },
                      { key: 'cumploRequisitosMinimos', label: 'Cumple Requisitos Mínimos' },
                      { key: 'plenosDerechosCiviles', label: 'Plenos Derechos Civiles' },
                      { key: 'noCondenaDolosa', label: 'No Condena Dolosa' },
                      { key: 'noInhabilitacion', label: 'No Inhabilitación' },
                      { key: 'noSentenciaCondenatoria', label: 'No Sentencia Condenatoria' },
                      { key: 'noAntecedentesPenales', label: 'No Antecedentes Penales' },
                      { key: 'noAntecedentesPoliciales', label: 'No Antecedentes Policiales' },
                      { key: 'noAntecedentesJudiciales', label: 'No Antecedentes Judiciales' },
                      { key: 'noParientesUGEL', label: 'No Parientes en UGEL' },
                    ].map(({ key, label }) => {
                      const valor = Boolean((selectedReport as any).declaraciones?.[key]);
                      return (
                        <div key={key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100">
                          {valor ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                          <span className={`text-sm font-medium ${valor ? 'text-green-700' : 'text-red-700'}`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Evaluación de Requisitos con IA */}
              {(selectedReport as any).evaluacionRequisitos && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Evaluación de Requisitos (IA)
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">
                    {(selectedReport as any).evaluacionRequisitos}
                  </div>
                </div>
              )}

              {/* Reglas Aplicadas */}
              {(selectedReport as any).reglasAplicadas && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Reglas Aplicadas
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    {typeof (selectedReport as any).reglasAplicadas === 'string' ? (
                      <p className="text-slate-700 whitespace-pre-wrap text-sm">{(selectedReport as any).reglasAplicadas}</p>
                    ) : (
                      <pre className="text-slate-700 text-sm overflow-auto">
                        {JSON.stringify((selectedReport as any).reglasAplicadas, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}

              {/* Bonos Aplicados */}
              {(selectedReport as any).bonosAplicados && (
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-green-600" />
                    Bonos Aplicados
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    {typeof (selectedReport as any).bonosAplicados === 'string' ? (
                      <p className="text-slate-700 whitespace-pre-wrap text-sm">{(selectedReport as any).bonosAplicados}</p>
                    ) : (
                      <div className="space-y-2">
                        {Array.isArray((selectedReport as any).bonosAplicados) ? (
                          (selectedReport as any).bonosAplicados.map((bono: any, idx: number) => (
                            <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="font-semibold text-green-800">{bono.tipo || bono.nombre || `Bono ${idx + 1}`}</p>
                              {bono.descripcion && <p className="text-sm text-green-700 mt-1">{bono.descripcion}</p>}
                              {bono.puntos && <p className="text-xs text-green-600 mt-1">Puntos: {bono.puntos}</p>}
                            </div>
                          ))
                        ) : (
                          <pre className="text-slate-700 text-sm overflow-auto">
                            {JSON.stringify((selectedReport as any).bonosAplicados, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Análisis de IA mejorado */}
          <div className="bg-white rounded-2xl p-8 border border-blue-200 shadow-xl mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Análisis de Inteligencia Artificial</h3>
                <p className="text-slate-600">Evaluación completa del perfil profesional</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Experiencia Relevante */}
              <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-cyan-400" />
                  Experiencia Relevante
                </h4>
                {selectedReport.contenido ? (
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600/30 whitespace-pre-wrap text-gray-300 leading-relaxed">
                    {selectedReport.contenido}
                  </div>
                ) : (
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600/30">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{(() => {
                      // Procesar experiencia_relevante para manejar Buffers serializados
                      const exp: any = selectedReport.experiencia_relevante;
                      if (!exp) return 'No disponible';
                      if (typeof exp === 'string') return exp;
                      if (typeof exp === 'object' && exp !== null && exp.type === 'Buffer' && Array.isArray(exp.data)) {
                        try {
                          // Convertir array de bytes a string UTF-8
                          const bytes = new Uint8Array(exp.data);
                          // Usar TextDecoder si está disponible (navegadores modernos)
                          if (typeof TextDecoder !== 'undefined') {
                            const decoder = new TextDecoder('utf-8');
                            return decoder.decode(bytes);
                          }
                          // Fallback: convertir manualmente
                          let result = '';
                          for (let i = 0; i < bytes.length; i++) {
                            result += String.fromCharCode(bytes[i]);
                          }
                          return result;
                        } catch {
                          return String(exp);
                        }
                      }
                      return String(exp);
                    })()}</p>
                  </div>
                )}
              </div>

              {/* Habilidades Clave */}
              {(() => {
                // Procesar habilidades_clave para manejar Buffers serializados
                let habilidades: string[] = [];
                try {
                  const habs: any = selectedReport.habilidades_clave;
                  if (Array.isArray(habs)) {
                    habilidades = habs.map((h: any) => {
                      if (typeof h === 'string') return h;
                      if (h && typeof h === 'object' && h.type === 'Buffer' && Array.isArray(h.data)) {
                        try {
                          const bytes = new Uint8Array(h.data);
                          if (typeof TextDecoder !== 'undefined') {
                            const decoder = new TextDecoder('utf-8');
                            return decoder.decode(bytes);
                          }
                          let result = '';
                          for (let i = 0; i < bytes.length; i++) {
                            result += String.fromCharCode(bytes[i]);
                          }
                          return result;
                        } catch {
                          return String(h);
                        }
                      }
                      return String(h);
                    }).filter((h: string) => h && h.trim() !== '');
                  } else if (habs && typeof habs === 'object' && habs.type === 'Buffer' && Array.isArray(habs.data)) {
                    try {
                      const bytes = new Uint8Array(habs.data);
                      let bufferString = '';
                      if (typeof TextDecoder !== 'undefined') {
                        const decoder = new TextDecoder('utf-8');
                        bufferString = decoder.decode(bytes);
                      } else {
                        for (let i = 0; i < bytes.length; i++) {
                          bufferString += String.fromCharCode(bytes[i]);
                        }
                      }
                      const parsed = JSON.parse(bufferString);
                      habilidades = Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                      habilidades = [];
                    }
                  } else if (Array.isArray(habs)) {
                    habilidades = habs;
                  }
                } catch (error) {
                  console.warn('Error procesando habilidades_clave:', error);
                  habilidades = Array.isArray(selectedReport.habilidades_clave) ? selectedReport.habilidades_clave : [];
                }
                
                return habilidades.length > 0 ? (
                  <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      Habilidades Clave Identificadas
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {habilidades.map((skill, idx) => (
                        <span key={idx} className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 rounded-full text-sm font-medium border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700/50">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      Habilidades Clave Identificadas
                    </h4>
                    <p className="text-gray-400 text-sm">No hay habilidades identificadas</p>
                  </div>
                );
              })()}
            </div>

            {/* Recomendaciones adicionales */}
            <div className="mt-6 bg-gradient-to-r from-green-600/90 to-emerald-600/90 p-8 rounded-2xl border-2 border-green-400 shadow-2xl backdrop-blur-sm">
              <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Recomendaciones del Sistema IA
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-white/10 backdrop-blur-sm p-6 rounded-xl border-2 border-white/20 hover:bg-white/20 transition-all">
                  <div className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
                    {selectedReport.calificacion >= 8 ? 'Excelente' : selectedReport.calificacion >= 6 ? 'Bueno' : 'Regular'}
                  </div>
                  <div className="text-white/90 text-base font-semibold">Calificación General</div>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm p-6 rounded-xl border-2 border-white/20 hover:bg-white/20 transition-all">
                  <div className="text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
                    {selectedReport.habilidades_clave.length}
                  </div>
                  <div className="text-white/90 text-base font-semibold">Habilidades Identificadas</div>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm p-6 rounded-xl border-2 border-white/20 hover:bg-white/20 transition-all">
                  <div className="text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
                    {selectedReport.estado_evaluacion === "approved" ? '100%' : selectedReport.estado_evaluacion === "rejected" ? '0%' : '50%'}
                  </div>
                  <div className="text-white/90 text-base font-semibold">Probabilidad de Éxito</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </ComiteLayout>
    );
  }

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
      <div className="w-full px-4 py-8">
        {/* Header con estadísticas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-4xl font-bold ${textPrimary}`}>
              Reportes de IA
            </h1>
            <div className="flex gap-3">
              <button
                onClick={calificarIA_1a100}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'} rounded-lg transition-all disabled:opacity-50`}
              >
                <Wand2 className="w-4 h-4" />
                {loading ? 'Calificando…' : 'Calificar con IA (1-100)'}
              </button>
              <button
                onClick={fetchReportes}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'} rounded-lg transition-all disabled:opacity-50`}
              >
                <Brain className="w-4 h-4" />
                {loading ? 'Cargando...' : 'Actualizar'}
              </button>
              
              {/* Botón PDF Evaluaciones eliminado por solicitud */}
              
              <button
                onClick={downloadExcelEvaluaciones}
                disabled={exporting}
                className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30' : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'} rounded-lg transition-all disabled:opacity-50`}
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Generando...' : 'Excel Evaluaciones'}
              </button>
              
              <button
                onClick={testGeminiAI}
                className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'} rounded-lg transition-all`}
              >
                <Brain className="w-4 h-4" />
                Probar ChatGPT
              </button>
              
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const data = await AIService.analizarAnexos();
                    console.log('Análisis con IA completado:', data);
                    const total = data?.total || data?.length || 0;
                    const errores = data?.errores || 0;
                    toast.success(`✅ Análisis completado: ${total} postulantes analizados${errores > 0 ? `, ${errores} errores` : ''}`);
                    await fetchReportes(); // Recargar los datos
                  } catch (error) {
                    console.error('Error en análisis con IA:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                    toast.error(`❌ Error al analizar candidatos con IA: ${errorMessage}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30' : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'} rounded-lg transition-all disabled:opacity-50`}
              >
                <Brain className="w-4 h-4" />
                {loading ? 'Analizando...' : 'Analizar con IA'}
              </button>
            </div>
          </div>
          <p className={`${textSecondary} text-lg`}>Reportes generados automáticamente por IA con análisis completo de postulantes</p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className={`${isDark ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <div className={`text-2xl font-bold ${textPrimary}`}>{reportes.length}</div>
                <div className={`${isDark ? 'text-blue-300' : 'text-blue-700'} text-sm font-medium`}>Reportes IA</div>
              </div>
            </div>
            <p className={`${textSecondary} text-xs`}>Análisis automáticos generados</p>
          </div>
          
          <div className={`${isDark ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <Archive className="w-8 h-8 text-purple-600" />
              <div>
                <div className={`text-2xl font-bold ${textPrimary}`}>{reportes.filter(r => archivedReportIds.has(r.id)).length}</div>
                <div className={`${isDark ? 'text-purple-300' : 'text-purple-700'} text-sm font-medium`}>En Historial</div>
              </div>
            </div>
            <p className={`${textSecondary} text-xs`}>Reportes archivados</p>
          </div>
          
          <div className={`${isDark ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-50 border border-green-200'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className={`text-2xl font-bold ${textPrimary}`}>
                  {(() => {
                    const aprobados = reportes.filter(r => {
                      const score100 = typeof r.score === 'number' ? r.score : (typeof r.calificacion === 'number' ? r.calificacion * 10 : 0);
                      return score100 >= 60 || r.estado_evaluacion === 'approved';
                    });
                    return aprobados.length;
                  })()}
                </div>
                <div className={`${isDark ? 'text-green-300' : 'text-green-700'} text-sm font-medium`}>Aprobados</div>
              </div>
            </div>
            <p className={`${textSecondary} text-xs`}>Candidatos recomendados</p>
          </div>
          
          <div className={`${isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <div className={`text-2xl font-bold ${textPrimary}`}>
                  {(() => {
                    const rechazados = reportes.filter(r => {
                      const score100 = typeof r.score === 'number' ? r.score : (typeof r.calificacion === 'number' ? r.calificacion * 10 : 0);
                      return score100 < 50 || r.estado_evaluacion === 'rejected';
                    });
                    return rechazados.length;
                  })()}
                </div>
                <div className={`${isDark ? 'text-red-300' : 'text-red-700'} text-sm font-medium`}>Rechazados</div>
              </div>
            </div>
            <p className={`${textSecondary} text-xs`}>No cumplen requisitos</p>
          </div>
          
          <div className={`${isDark ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'} rounded-2xl p-6 shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-8 h-8 text-yellow-600" />
              <div>
                <div className={`text-2xl font-bold ${textPrimary}`}>
                  {(() => {
                    if (reportes.length === 0) return '0.0';
                    const scores = reportes.map(r => {
                      return typeof r.score === 'number' ? r.score : (typeof r.calificacion === 'number' ? r.calificacion * 10 : 0);
                    }).filter(s => s > 0);
                    if (scores.length === 0) return '0.0';
                    const promedio = scores.reduce((acc, s) => acc + s, 0) / scores.length;
                    return promedio.toFixed(1);
                  })()}
                </div>
                <div className={`${isDark ? 'text-yellow-300' : 'text-yellow-700'} text-sm font-medium`}>Promedio IA</div>
              </div>
            </div>
            <p className={`${textSecondary} text-xs`}>Calificación promedio IA</p>
          </div>
        </div>

        {reportes.length === 0 && !loading && (
          <div className="text-center py-12">
            <Brain className={`w-16 h-16 ${isDark ? 'text-gray-500' : 'text-gray-400'} mx-auto mb-4`} />
            <p className={`${textSecondary} text-lg`}>No hay reportes de IA disponibles.</p>
            <p className={`${textSecondary} text-sm`}>Los reportes se generan automáticamente cuando los postulantes suben anexos.</p>
            <div className={`mt-4 p-4 ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'} rounded-lg max-w-md mx-auto`}>
              <p className={`${isDark ? 'text-blue-300' : 'text-blue-700'} text-sm`}>
                💡 <strong>Tip:</strong> Los reportes aparecen aquí automáticamente cuando los postulantes suben sus documentos y anexos.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={fetchReportes}
                className={`px-6 py-3 ${isDark ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/30' : 'bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 text-cyan-700 border border-cyan-200'} rounded-lg transition-all`}
              >
                <Brain className="w-4 h-4 inline mr-2" />
                Recargar Reportes
              </button>
            </div>
          </div>
        )}

        {/* Tabs para Activos y Archivados */}
        {reportes.length > 0 && (
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowArchived(false)}
                className={`px-4 py-2 rounded-lg transition-all font-medium ${
                  !showArchived
                    ? isDark
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                    : isDark
                    ? 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Activos ({reportes.filter(r => !archivedReportIds.has(r.id)).length})
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 ${
                  showArchived
                    ? isDark
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                    : isDark
                    ? 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <Archive className="w-4 h-4" />
                Historial ({reportes.filter(r => archivedReportIds.has(r.id)).length})
              </button>
            </div>
                {showArchived && archivedReportIds.size > 0 && (
              <button
                onClick={() => {
                  if (confirm('¿Remover todos los reportes del historial?')) {
                    setArchivedReportIds(new Set());
                    saveArchivedToStorage(new Set());
                    toast.success('✅ Todos los reportes removidos del historial', { icon: '📤', duration: 3000 });
                    setShowArchived(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 ${
                  isDark
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30'
                    : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                }`}
              >
                <ArchiveRestore className="w-4 h-4" />
                Limpiar Historial
              </button>
            )}
          </div>
        )}

        {/* Grid de reportes */}
        {reportes.length > 0 && (() => {
          const reportesFiltrados = reportes.filter(r => showArchived ? archivedReportIds.has(r.id) : !archivedReportIds.has(r.id));
          
          if (reportesFiltrados.length === 0) {
            return (
              <div className="text-center py-12">
                <Archive className={`w-16 h-16 ${isDark ? 'text-gray-500' : 'text-gray-400'} mx-auto mb-4`} />
                <p className={`${textSecondary} text-lg`}>
                  {showArchived ? 'No hay reportes en el historial' : 'No hay reportes activos'}
                </p>
                {showArchived && (
                  <button
                    onClick={() => setShowArchived(false)}
                    className={`mt-4 px-6 py-3 ${isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'} rounded-lg transition-all`}
                  >
                    Ver Reportes Activos
                  </button>
                )}
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {reportesFiltrados.map((reporte) => (
            <div key={reporte.id} className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-200'} ${showArchived ? 'opacity-90 border-purple-400/50' : archivedReportIds.has(reporte.id) ? 'border-purple-300/30' : ''} rounded-2xl p-6 border-2 shadow-sm hover:shadow-md transition-all duration-200 relative`}>
              {/* Badge de historial - Siempre visible si está archivado */}
              {archivedReportIds.has(reporte.id) && (
                <div className="absolute top-3 left-3 z-10">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg ${
                    isDark
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-2 border-purple-400'
                      : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white border-2 border-purple-300'
                  }`}>
                    <Archive className="w-3.5 h-3.5" />
                    Historial
                  </span>
                </div>
              )}
              
              {/* Header del reporte */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${textPrimary} mb-1 ${archivedReportIds.has(reporte.id) ? 'pl-28' : ''}`}>
                    {reporte.nombre_completo}
                  </h3>
                  <p className={`${textSecondary} text-sm mb-2`}>{reporte.puesto_postulado}</p>
                  <div className={`flex items-center gap-2 ${textSecondary} text-xs`}>
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{reporte.email}</span>
                  </div>
                </div>
                <div className="text-right">
                  {(() => {
                    const score100 = typeof reporte.score === 'number' ? reporte.score : Number((reporte.calificacion * 10).toFixed(0));
                    const estado = score100 >= 60 ? 'Aprobado' : (score100 < 50 ? 'No Apto' : 'Probable');
                    const chipCls = score100 >= 60 
                      ? (isDark ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-50 text-green-700 border border-green-200')
                      : (score100 < 50 
                        ? (isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200')
                        : (isDark ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'));
                    return (
                      <>
                        <div className={`flex items-center gap-2 text-lg font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'} mb-1`}>
                          <Star className={`w-4 h-4 fill-yellow-500 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                          <span>{score100}</span>
                          <span className={`text-xs ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>/100</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${chipCls}`}>
                          {estado}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Resumen de habilidades */}
              <div className="mb-4">
                <p className={`${textSecondary} text-xs font-medium mb-2`}>Habilidades Clave</p>
                <div className="flex flex-wrap gap-1">
                  {reporte.habilidades_clave.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className={`px-2 py-1 ${isDark ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'} rounded-full text-xs`}>
                      {skill}
                    </span>
                  ))}
                  {reporte.habilidades_clave.length > 3 && (
                    <span className={`px-2 py-1 ${isDark ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'} rounded-full text-xs`}>
                      +{reporte.habilidades_clave.length - 3} más
                    </span>
                  )}
                </div>
              </div>

              {/* Documentos disponibles */}
              <div className="mb-4">
                <p className={`${textSecondary} text-xs font-medium mb-2`}>Documentos</p>
                <div className="flex items-center gap-2 text-xs">
                  {reporte.cv_url && (
                    <span className={`flex items-center gap-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      <FileText className="w-3 h-3" />
                      CV
                    </span>
                  )}
                  {reporte.anexos && reporte.anexos.length > 0 && (
                    <span className={`flex items-center gap-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                      <Paperclip className="w-3 h-3" />
                      {reporte.anexos.length} anexos
                    </span>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <button
                  onClick={() => viewReportDetails(reporte)}
                  className={`flex-1 py-2 ${isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'} rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm`}
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalles
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleArchiveReport(reporte.id);
                  }}
                  className={`py-2.5 px-4 ${isDark 
                    ? archivedReportIds.has(reporte.id)
                      ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white border-2 border-green-400 shadow-lg'
                      : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white border-2 border-purple-400 shadow-lg'
                    : archivedReportIds.has(reporte.id)
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-2 border-green-400 shadow-md'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-2 border-purple-400 shadow-md'
                  } rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm hover:scale-105 active:scale-95`}
                  title={archivedReportIds.has(reporte.id) ? 'Quitar del historial' : 'Agregar al historial'}
                >
                  {archivedReportIds.has(reporte.id) ? (
                    <>
                      <ArchiveRestore className="w-4 h-4" />
                      <span>Quitar</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      <span>Archivar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
            </div>
          );
        })()}

        {/* Modal de Anexos Detallado */}
        {showAnexosModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-blue-900/95 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Documentos Anexos Verificados</h2>
                  <p className="text-cyan-300 text-sm">Detalles completos de los documentos del candidato</p>
                </div>
                <button
                  onClick={() => setShowAnexosModal(false)}
                  className="p-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-all border border-gray-500/30"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {anexosDetails.map((anexo, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 p-4 rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                          <Paperclip className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{anexo.nombre}</h3>
                          <p className="text-blue-300 text-sm">{anexo.tipo || 'Documento'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const url = anexo.url?.startsWith('http') ? anexo.url : AIService.getFileURL(anexo.url);
                          window.open(url, '_blank');
                        }}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded border border-blue-500/30 transition-all"
                        title="Ver Documento"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {anexo.descripcion && (
                      <div className="text-sm text-gray-300 mt-2">{anexo.descripcion}</div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-3">
                      {anexo.tamaño && (
                        <span>Tamaño: {(anexo.tamaño / 1024).toFixed(2)} KB</span>
                      )}
                      {anexo.fecha && (
                        <span>Fecha: {new Date(anexo.fecha).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {anexosDetails.length === 0 && (
                  <div className="text-center py-8">
                    <Paperclip className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No hay anexos disponibles</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAnexosModal(false)}
                  className="px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all border border-blue-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ComiteLayout>
  );
};

export default ReportesPage;
