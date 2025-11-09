import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CheckCircle, XCircle, Clock, Brain, Download } from 'lucide-react';
import { ApiService } from '@/services/apiService';
import { GeminiService } from '@/services/geminiService';

interface EvaluacionesStatsProps {
  onDownloadPDF?: () => void;
  onDownloadExcel?: () => void;
}

const EvaluacionesStats: React.FC<EvaluacionesStatsProps> = ({ 
  onDownloadPDF, 
  onDownloadExcel 
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await GeminiService.getEstadisticasEvaluaciones();
      setStats(data);
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      setError('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-500/30">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900/40 to-red-800/30 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
        <div className="flex items-center gap-3 mb-3">
          <XCircle className="w-6 h-6 text-red-400" />
          <div className="text-red-300 font-medium">Error al cargar estadísticas</div>
        </div>
        <p className="text-red-200 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total de Evaluaciones */}
      <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/30 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="w-8 h-8 text-blue-400" />
          <div>
            <div className="text-2xl font-bold text-white">{stats?.total_evaluaciones || 0}</div>
            <div className="text-blue-300 text-sm">Total Evaluaciones</div>
          </div>
        </div>
        <div className="text-xs text-blue-200">
          Análisis completados por Gemini AI
        </div>
      </div>

      {/* Evaluaciones Aprobadas */}
      <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/30 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="w-8 h-8 text-green-400" />
          <div>
            <div className="text-2xl font-bold text-white">{stats?.evaluaciones_aprobadas || 0}</div>
            <div className="text-green-300 text-sm">Aprobadas</div>
          </div>
        </div>
        <div className="text-xs text-green-200">
          {stats?.total_evaluaciones > 0 
            ? `${Math.round((stats.evaluaciones_aprobadas / stats.total_evaluaciones) * 100)}% del total`
            : '0% del total'
          }
        </div>
      </div>

      {/* Evaluaciones Rechazadas */}
      <div className="bg-gradient-to-br from-red-900/40 to-pink-900/30 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
        <div className="flex items-center gap-3 mb-3">
          <XCircle className="w-8 h-8 text-red-400" />
          <div>
            <div className="text-2xl font-bold text-white">{stats?.evaluaciones_rechazadas || 0}</div>
            <div className="text-red-300 text-sm">Rechazadas</div>
          </div>
        </div>
        <div className="text-xs text-red-200">
          {stats?.total_evaluaciones > 0 
            ? `${Math.round((stats.evaluaciones_rechazadas / stats.total_evaluaciones) * 100)}% del total`
            : '0% del total'
          }
        </div>
      </div>

      {/* Evaluaciones Pendientes */}
      <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/30 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="w-8 h-8 text-yellow-400" />
          <div>
            <div className="text-2xl font-bold text-white">{stats?.evaluaciones_pendientes || 0}</div>
            <div className="text-yellow-300 text-sm">Pendientes</div>
          </div>
        </div>
        <div className="text-xs text-yellow-200">
          En proceso de análisis
        </div>
      </div>

      {/* Botones de Descarga */}
      <div className="col-span-full bg-gradient-to-br from-purple-900/40 to-violet-900/30 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Exportar Evaluaciones</h3>
            <p className="text-purple-200 text-sm">Descarga reportes detallados en PDF o Excel</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-300 rounded-lg transition-all border border-red-500/30"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={onDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-300 rounded-lg transition-all border border-green-500/30"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluacionesStats;
