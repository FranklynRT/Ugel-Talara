import React, { useState, useEffect } from 'react';
import { User, FileText, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';
import { GeminiService } from '@/services/geminiService';

interface Candidato {
  id: number;
  nombre_completo: string;
  email: string;
  puesto_postulado: string;
  area: string;
  calificacion: number;
  estado_evaluacion: string;
  habilidades_clave: string[];
  experiencia_relevante: string;
  cv_url: string;
  fecha_evaluacion: string;
}

interface CandidatosEvaluacionProps {
  onViewDetails?: (candidato: Candidato) => void;
  onDownloadCV?: (candidatoId: number) => void;
}

const CandidatosEvaluacion: React.FC<CandidatosEvaluacionProps> = ({ 
  onViewDetails, 
  onDownloadCV 
}) => {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidatos();
  }, []);

  const fetchCandidatos = async () => {
    try {
      setLoading(true);
      const data = await GeminiService.getCandidatosParaEvaluacion();
      setCandidatos(data);
    } catch (err) {
      console.error('Error al obtener candidatos:', err);
      setError('Error al cargar candidatos');
    } finally {
      setLoading(false);
    }
  };

  const updateEstadoEvaluacion = async (candidatoId: number, nuevoEstado: string) => {
    try {
      await GeminiService.updateEstadoEvaluacion({
        candidato_id: candidatoId,
        estado: nuevoEstado
      });
      
      // Actualizar el estado local
      setCandidatos(prev => prev.map(candidato => 
        candidato.id === candidatoId 
          ? { ...candidato, estado_evaluacion: nuevoEstado }
          : candidato
      ));
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al actualizar estado de evaluación');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'approved':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'rejected':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-500/30">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/40 to-red-800/30 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
        <div className="flex items-center gap-3 mb-3">
          <XCircle className="w-6 h-6 text-red-400" />
          <div className="text-red-300 font-medium">Error al cargar candidatos</div>
        </div>
        <p className="text-red-200 text-sm">{error}</p>
        <button
          onClick={fetchCandidatos}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all border border-red-500/30"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-500/30">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Candidatos para Evaluación</h3>
        <div className="text-sm text-gray-300">
          {candidatos.length} candidatos encontrados
        </div>
      </div>

      <div className="space-y-4">
        {candidatos.map((candidato) => (
          <div
            key={candidato.id}
            className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg p-4 border border-gray-600/30 hover:border-gray-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">{candidato.nombre_completo}</h4>
                  <p className="text-gray-300 text-sm">{candidato.email}</p>
                  <p className="text-blue-300 text-sm">{candidato.puesto_postulado} - {candidato.area}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{candidato.calificacion.toFixed(1)}</div>
                  <div className="text-xs text-gray-400">Calificación</div>
                </div>

                <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getEstadoColor(candidato.estado_evaluacion)}`}>
                  {getEstadoIcon(candidato.estado_evaluacion)}
                  <span className="text-sm font-medium">{getEstadoText(candidato.estado_evaluacion)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onViewDetails?.(candidato)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all border border-blue-500/30"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onDownloadCV?.(candidato.id)}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all border border-green-500/30"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {candidato.habilidades_clave.slice(0, 5).map((habilidad, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30"
                  >
                    {habilidad}
                  </span>
                ))}
                {candidato.habilidades_clave.length > 5 && (
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs border border-gray-500/30">
                    +{candidato.habilidades_clave.length - 5} más
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => updateEstadoEvaluacion(candidato.id, 'approved')}
                  className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-sm border border-green-500/30 transition-all"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => updateEstadoEvaluacion(candidato.id, 'rejected')}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm border border-red-500/30 transition-all"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {candidatos.length === 0 && (
        <div className="text-center py-8">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No hay candidatos</h3>
          <p className="text-gray-400">No se encontraron candidatos para evaluar</p>
        </div>
      )}
    </div>
  );
};

export default CandidatosEvaluacion;
