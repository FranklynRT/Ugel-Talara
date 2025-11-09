import React, { useState } from 'react';
import ComiteLayout from '@/layouts/ComiteLayout';
import { Brain, Users, FileText, TrendingUp, Download, Eye } from 'lucide-react';
import EvaluacionesStats from '@/components/ui/EvaluacionesStats';
import CandidatosEvaluacion from '@/components/ui/CandidatosEvaluacion';
import { GeminiService } from '@/services/geminiService';
import { ApiService } from '@/services/apiService';

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

const EvaluacionesPage: React.FC = () => {
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null);
  const [loading, setLoading] = useState(false);

  const handleViewDetails = (candidato: Candidato) => {
    setSelectedCandidato(candidato);
  };

  const handleDownloadCV = async (candidatoId: number) => {
    try {
      setLoading(true);
      // Aquí implementarías la descarga del CV
      console.log('Descargando CV del candidato:', candidatoId);
      // const blob = await ApiService.downloadDocument(candidatoId);
      // ApiService.downloadBlob(blob, `cv_candidato_${candidatoId}.pdf`);
    } catch (error) {
      console.error('Error al descargar CV:', error);
      alert('Error al descargar CV');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      await GeminiService.downloadPDFEvaluaciones();
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar PDF de evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setLoading(true);
      await GeminiService.downloadExcelEvaluaciones();
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      alert('Error al descargar Excel de evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComiteLayout>
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent animate-gradient">
              Evaluaciones con Gemini AI
            </h1>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-300 rounded-lg transition-all border border-red-500/30 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Generando...' : 'PDF Evaluaciones'}
              </button>
              
              <button
                onClick={handleDownloadExcel}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-300 rounded-lg transition-all border border-green-500/30 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Generando...' : 'Excel Evaluaciones'}
              </button>
            </div>
          </div>
          <p className="text-cyan-300 text-lg">
            Sistema de evaluación automática con análisis inteligente de candidatos
          </p>
        </div>

        {/* Estadísticas */}
        <EvaluacionesStats 
          onDownloadPDF={handleDownloadPDF}
          onDownloadExcel={handleDownloadExcel}
        />

        {/* Candidatos para Evaluación */}
        <CandidatosEvaluacion 
          onViewDetails={handleViewDetails}
          onDownloadCV={handleDownloadCV}
        />

        {/* Modal de Detalles del Candidato */}
        {selectedCandidato && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl p-6 border border-gray-500/30 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Detalles del Candidato</h2>
                <button
                  onClick={() => setSelectedCandidato(null)}
                  className="p-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-all border border-gray-500/30"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/30 backdrop-blur-xl rounded-xl p-4 border border-blue-500/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Información Personal
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-blue-300 font-medium">Nombre:</span>
                      <span className="text-white ml-2">{selectedCandidato.nombre_completo}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 font-medium">Email:</span>
                      <span className="text-white ml-2">{selectedCandidato.email}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 font-medium">Puesto:</span>
                      <span className="text-white ml-2">{selectedCandidato.puesto_postulado}</span>
                    </div>
                    <div>
                      <span className="text-blue-300 font-medium">Área:</span>
                      <span className="text-white ml-2">{selectedCandidato.area}</span>
                    </div>
                  </div>
                </div>

                {/* Evaluación */}
                <div className="bg-gradient-to-br from-purple-900/40 to-violet-900/30 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Evaluación IA
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-purple-300 font-medium">Calificación:</span>
                      <span className="text-white ml-2 text-xl font-bold">{selectedCandidato.calificacion.toFixed(1)}/10</span>
                    </div>
                    <div>
                      <span className="text-purple-300 font-medium">Estado:</span>
                      <span className="text-white ml-2">{selectedCandidato.estado_evaluacion}</span>
                    </div>
                    <div>
                      <span className="text-purple-300 font-medium">Fecha:</span>
                      <span className="text-white ml-2">{new Date(selectedCandidato.fecha_evaluacion).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Habilidades Clave */}
                <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/30 backdrop-blur-xl rounded-xl p-4 border border-green-500/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Habilidades Clave
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidato.habilidades_clave.map((habilidad, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30"
                      >
                        {habilidad}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experiencia Relevante */}
                <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/30 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-400" />
                    Experiencia Relevante
                  </h3>
                  <p className="text-white text-sm leading-relaxed">
                    {selectedCandidato.experiencia_relevante}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleDownloadCV(selectedCandidato.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 rounded-lg transition-all border border-blue-500/30"
                >
                  <Download className="w-4 h-4" />
                  Descargar CV
                </button>
                
                <button
                  onClick={() => setSelectedCandidato(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 text-gray-300 rounded-lg transition-all border border-gray-500/30"
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

export default EvaluacionesPage;
