// import { ApiService } from './apiService'; // No longer needed

export class AIService {
  // Using localhost for development
  private static baseURL = 'http://localhost:9000/ugel-talara';

  // Obtener reportes de IA
  static async getReportesIA() {
    try {
      // 1) Intento directo a reportes IA (nuevo endpoint en documentos)
      const ts = Date.now();
      const response = await fetch(`${this.baseURL}/documentos/reportes-ia?ts=${ts}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        return await response.json();
      }

      // 2) Si falla, intentar con la ruta alternativa
      if (!response.ok) {
        // Intentar con la ruta alternativa sin /documentos
        const altResponse = await fetch(`${this.baseURL}/reportes-ia?ts=${ts}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });
        if (altResponse.ok) {
          return await altResponse.json();
        }
      }

      // 3) Si aún falla, retornar array vacío y usar fallback
      if (!response.ok && response.status !== 404) {
        console.warn('No se pudieron obtener reportes de IA, usando fallback');
      }

      // 4) Fallback: construir reportes (y anexos) desde verificaciones de QR, enriqueciendo con candidatos con CV
      try {
        const verif = await fetch(`${this.baseURL}/documentos/verificaciones-sesion-comite`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });
        if (verif.ok) {
          const data = await verif.json();
          const items = Array.isArray(data?.verificaciones) ? data.verificaciones : [];
          // Intentar enriquecer con candidatos que tienen anexos completos (para obtener IDUSUARIO)
          let enrichMap: Record<string, any> = {};
          try {
            const ts2 = Date.now();
            const enrichResp = await fetch(`${this.baseURL}/evaluaciones/candidates-with-cv?ts=${ts2}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json',
                'Cache-Control': 'no-store'
              },
              cache: 'no-store'
            });
            if (enrichResp.ok) {
              const enrichData = await enrichResp.json();
              (enrichData || []).forEach((c: any) => {
                const emailKey = (c.email || '').toLowerCase();
                const dniKey = (c.documento || '').toLowerCase();
                if (emailKey) enrichMap[`email:${emailKey}`] = c;
                if (dniKey) enrichMap[`dni:${dniKey}`] = c;
              });
            }
          } catch (_) {}

          const resultados = [] as any[];
          for (let i = 0; i < items.length; i++) {
            const v = items[i];
            const q = v.datosQR || {};
            const email = (q.email || '').toLowerCase();
            const dni = (q.dni || q.documento || '').toLowerCase();
            let anexosArr: any[] = [];
            let anexosCompletosArr: any[] = [];
            let postulanteId: number | null = null;

            const match = enrichMap[`email:${email}`] || enrichMap[`dni:${dni}`];
            if (match) {
              const m = match;
              postulanteId = m.id;
              // Intentar traer anexos completos del postulante
              if (postulanteId) {
                try {
                  const ts = Date.now();
                  // Primero intentar obtener anexos completos
                  const anexosCompletosResp = await fetch(`${this.baseURL}/anexos-completos/usuario/${postulanteId}?ts=${ts}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Accept': 'application/json',
                      'Cache-Control': 'no-store'
                    },
                    cache: 'no-store'
                  });
                  if (anexosCompletosResp.ok) {
                    const anexosData = await anexosCompletosResp.json();
                    anexosCompletosArr = Array.isArray(anexosData) ? anexosData : [];
                    anexosArr = anexosCompletosArr.map((a: any) => ({
                      id: a.IDANEXO,
                      nombre: `Anexo_${a.IDANEXO}.pdf`,
                      url: `${this.baseURL}/anexos-completos/${a.IDANEXO}/download`,
                      tipo: 'Anexo 01'
                    }));
                  }
                } catch (_) {}
              }
            }

            // Calificación heurística: +2 base, +1 por anexo completo hasta 8, total máx 10
            const base = 2;
            const anexosScore = Math.min(8, anexosCompletosArr.length + anexosArr.length);
            const calificacion = Math.min(10, base + anexosScore);

            // Resumen de anexos para mostrar en UI
            const anexosResumen = anexosCompletosArr.length > 0
              ? `Anexos completos (${anexosCompletosArr.length}): Documentos completos presentados`
              : anexosArr.length > 0
              ? `Anexos (${anexosArr.length}): ${anexosArr.slice(0, 5).map((a: any) => a.nombre || a.tipo || 'Documento').join(', ')}`
              : 'Sin anexos adjuntos';

            resultados.push({
              id: i + 1,
              nombre_completo: q.postulante || 'Sin nombre',
              email: q.email || 'Sin email',
              puesto_postulado: q.puesto || 'Sin puesto',
              calificacion,
              estado_evaluacion: 'pending',
              experiencia_relevante: anexosResumen,
              habilidades_clave: [],
              anexos: anexosArr,
              anexosCompletos: anexosCompletosArr.length > 0 ? anexosCompletosArr : null,
              cv_url: null,
              userId: postulanteId
            });
          }
          return resultados;
        }
      } catch (_) {}

      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error('Error obteniendo reportes de IA:', error);
      throw error;
    }
  }

  // Disparar generación de reportes IA en backend
  static async generarReportesIA() {
    try {
      const response = await fetch(`${this.baseURL}/reports/ia-generate?ts=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error generando reportes IA:', error);
      throw error;
    }
  }

  // Analizar anexos de un postulante específico (ChatGPT en backend)
  static async analizarAnexosPostulante(postulanteId: number, convocatoriaId: number) {
    try {
      const response = await fetch(`${this.baseURL}/documentos/anexos/analizar/${postulanteId}/${convocatoriaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analizando anexos del postulante con IA:', error);
      throw error;
    }
  }

  // Analizar anexos con IA (análisis completo con URLs, CV, reglas y bonos)
  static async analizarAnexos() {
    try {
      // Usar la ruta correcta: /reports/analyze-anexos-completo o /documentos/analyze-anexos-completo
      const response = await fetch(`${this.baseURL}/reports/analyze-anexos-completo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          incluirCV: true,
          incluirConvocatorias: true,
          incluirReglasBonos: true,
          usarURLs: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error en /reports/analyze-anexos-completo: ${response.status} - ${errorText}`);
        
        // Intentar con la ruta alternativa
        console.log('🔄 Intentando con ruta alternativa: /documentos/analyze-anexos-completo');
        const altResponse = await fetch(`${this.baseURL}/documentos/analyze-anexos-completo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            incluirCV: true,
            incluirConvocatorias: true,
            incluirReglasBonos: true,
            usarURLs: true
          })
        });

        if (altResponse.ok) {
          console.log('✅ Ruta alternativa funcionó correctamente');
          return await altResponse.json();
        }

        const altErrorText = await altResponse.text();
        console.error(`❌ Error en ruta alternativa: ${altResponse.status} - ${altErrorText}`);
        throw new Error(`HTTP error! status: ${response.status} (primera ruta) / ${altResponse.status} (ruta alternativa). Error: ${errorText.substring(0, 200)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analizando anexos con IA:', error);
      throw error;
    }
  }

  // Generar PDF de evaluaciones
  static async generarPDFEvaluaciones() {
    try {
      const response = await fetch(`${this.baseURL}/reports/generate-pdf-evaluaciones?ts=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/pdf'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluaciones_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generando PDF de evaluaciones:', error);
      throw error;
    }
  }

  // Generar Excel de evaluaciones
  static async generarExcelEvaluaciones() {
    try {
      const response = await fetch(`${this.baseURL}/evaluaciones/exportar-excel?ts=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generando Excel de evaluaciones:', error);
      throw error;
    }
  }

  // Probar conexión con backend
  static async testBackendConnection() {
    try {
      const response = await fetch(`${this.baseURL}/documentos/reportes-ia`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        return { success: true, message: 'Conexión con backend exitosa' };
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('Error probando conexión:', error);
      throw error;
    }
  }

  // Obtener anexos de un candidato específico
  static async getAnexosCandidato(candidateId: string) {
    try {
      const response = await fetch(`${this.baseURL}/candidates/${candidateId}/anexos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo anexos del candidato:', error);
      throw error;
    }
  }

  // Ver archivo específico
  static getFileURL(filename: string) {
    return `${this.baseURL}/files/view/${encodeURIComponent(filename)}`;
  }
}
