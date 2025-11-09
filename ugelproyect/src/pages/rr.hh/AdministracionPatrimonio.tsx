import React, { useState, useEffect } from 'react';
import { Download, Briefcase, Eye, X, LoaderCircle, CheckCircle, Globe } from 'lucide-react';

interface Convocatoria {
  id: number;
  area: string;
  puesto: string;
  sueldo: string;
  requisitos: string;
  experiencia: string;
  licenciatura: string;
  expPublicaMin?: string;
  expPublicaMax?: string;
  habilidades: string;
  fechaPublicacion: string;
  fechaFinalizacion: string;
  estado: string;
  numero_cas?: string;
}

const AdministracionPatrimonio: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formData, setFormData] = useState({
    area: 'Administración - Patrimonio',
    puesto: '',
    sueldo: '',
    requisitos: '',
    licenciatura: 'Sí',
    expPublicaMin: '',
    expPublicaMax: '',
    habilidades: '',
    fechaPublicacion: '',
    fechaFinalizacion: '',
    numero_cas: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const API_URL = 'http://localhost:9000/ugel-talara/convocatorias';

  const loadScript = (src: string) => {
    return new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        return resolve();
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  const fetchConvocatorias = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}?area=${encodeURIComponent('Administración - Patrimonio')}`);
      if (!response.ok) {
        throw new Error('No se pudo conectar con el servidor para obtener los datos.');
      }
      const data = await response.json();
      // Mapear datos del backend al formato del frontend
      const mappedData: Convocatoria[] = data.map((item: any) => ({
        id: item.IDCONVOCATORIA || item.id,
        area: item.area,
        puesto: item.puesto,
        sueldo: item.sueldo || '',
        requisitos: item.requisitosAcademicos || item.requisitos || '',
        experiencia: '',
        licenciatura: item.tituloProfesional || item.licenciatura || 'No',
        habilidades: item.habilidadesTecnicas || item.habilidades || '',
        fechaPublicacion: item.fechaInicio || item.fechaPublicacion || '',
        fechaFinalizacion: item.fechaFin || item.fechaFinalizacion || '',
        estado: item.estado || 'Activo',
      }));
      const filteredData = mappedData.filter((c: Convocatoria) => c.area === 'Administración - Patrimonio');
      setConvocatorias(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Un error inesperado ocurrió');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConvocatorias();
  }, []);

  const downloadPDF = async () => {
    setIsDownloading(true);
    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js');
        
        // @ts-ignore
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text('Reporte de Convocatorias - UGEL Talara', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Área: ${'Administración - Patrimonio'}`, 14, 30);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, 14, 36);
        
        const tableColumn = ["N°", "Puesto", "Sueldo", "Experiencia", "Licenciatura", "Periodo", "Estado"];
        const tableRows = convocatorias.map((conv, index) => [
            index + 1,
            conv.puesto,
            `S/ ${parseFloat(conv.sueldo).toFixed(2)}`,
            conv.experiencia,
            conv.licenciatura,
            `${new Date(conv.fechaPublicacion).toLocaleDateString('es-ES')} - ${new Date(conv.fechaFinalizacion).toLocaleDateString('es-ES')}`,
            conv.estado,
        ]);
        
        // @ts-ignore
        doc.autoTable(tableColumn, tableRows, { 
            startY: 50,
            headStyles: { fillColor: [148, 49, 149] }
        });
        
        doc.save(`Reporte_Convocatorias_${'Administración - Patrimonio'}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        setError("No se pudo generar el PDF. Revise la conexión a internet.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, type: 'create' | 'edit') => {
    e.preventDefault();
    setSubmissionError(null);
    setFormErrors([]);
    
    // Validar campos requeridos del backend
    if (!formData.puesto || !formData.numero_cas || !formData.fechaPublicacion || !formData.fechaFinalizacion) {
      setSubmissionError('Por favor, completa todos los campos requeridos: puesto, número CAS, fecha inicio y fecha fin.');
      return;
    }

    // Validar fechas
    const fechaInicio = new Date(formData.fechaPublicacion);
    const fechaFin = new Date(formData.fechaFinalizacion);
    
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      setSubmissionError('Las fechas proporcionadas no son válidas.');
      return;
    }
    
    if (fechaFin < fechaInicio) {
      setSubmissionError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    // Mapear datos del frontend al formato del backend
    const payload: any = {
      area: 'Administración - Patrimonio',
      puesto: formData.puesto.trim(),
      sueldo: formData.sueldo ? formData.sueldo.trim() : null,
      tituloProfesional: formData.licenciatura === 'Sí' || formData.licenciatura === 'Si' ? 'Sí' : 'No',
      expPublicaMin: formData.expPublicaMin ? formData.expPublicaMin.trim() : null,
      expPublicaMax: formData.expPublicaMax ? formData.expPublicaMax.trim() : null,
      fechaInicio: new Date(formData.fechaPublicacion).toISOString().split('T')[0],
      fechaFin: new Date(formData.fechaFinalizacion).toISOString().split('T')[0],
      estado: 'No Publicada', // Estado por defecto al crear
      numeroCAS: formData.numero_cas.trim(),
      requisitosAcademicos: formData.requisitos ? formData.requisitos.trim() : null,
      habilidadesTecnicas: formData.habilidades ? formData.habilidades.trim() : null
    };
    
    try {
        const url = type === 'create' ? `${API_URL}` : `${API_URL}/${selectedConvocatoria!.id}`;
        const method = type === 'create' ? 'POST' : 'PUT';
        console.log(`Sending ${method} request to ${url} with payload:`, payload);
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
              error: `El servidor respondió con un error ${response.status}. Verifique los datos.` 
            }));
            console.error("Backend Error Details:", errorData);
            throw new Error(errorData.error || errorData.message || 'Error al procesar la solicitud.');
        }

        await fetchConvocatorias();
        closeCreateModal();
        setSuccessMessage('¡Convocatoria guardada correctamente!');
        setTimeout(() => setSuccessMessage(null), 4000);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Un error inesperado ocurrió.';
        console.error('Error al enviar el formulario:', err);
        setSubmissionError(`Error del Servidor: ${errorMessage}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedConvocatoria) return;
    try {
      const response = await fetch(`${API_URL}/${selectedConvocatoria.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      await fetchConvocatorias();
      setShowDelete(false);
      setSelectedConvocatoria(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Un error inesperado ocurrió.');
    }
  };

  // Toggle publicación - Cambiar entre Publicada y No Publicada
  const togglePublicacion = async (id: number, estadoActual: string) => {
    try {
      // Determinar el nuevo estado
      const nuevoEstado = (estadoActual === 'Publicada' || estadoActual === 'publicada') 
        ? 'No Publicada' 
        : 'Publicada';

      const response = await fetch(`${API_URL}/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.error || errorData.message || 'Error al cambiar estado de publicación');
      }

      await fetchConvocatorias();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado de publicación.');
      console.error('Error in togglePublicacion:', err);
    }
  };

  const handleCreateConvocatoria = () => {
    setIsCreateModalOpen(true);
    setFormData({ 
      area: 'Administración - Patrimonio', 
      puesto: '', 
      sueldo: '', 
      requisitos: '', 
      licenciatura: 'Sí', 
      expPublicaMin: '', 
      expPublicaMax: '', 
      habilidades: '', 
      fechaPublicacion: '', 
      fechaFinalizacion: '', 
      numero_cas: ''
    });
    setFormErrors([]);
    setSubmissionError(null);
    setSelectedConvocatoria(null);
  };

  const handleEditConvocatoria = (convocatoria: Convocatoria) => {
    setSelectedConvocatoria(convocatoria);
    setFormData({
      area: convocatoria.area,
      puesto: convocatoria.puesto,
      sueldo: convocatoria.sueldo,
      requisitos: convocatoria.requisitos,
      licenciatura: convocatoria.licenciatura,
      expPublicaMin: convocatoria.expPublicaMin || '',
      expPublicaMax: convocatoria.expPublicaMax || '',
      habilidades: convocatoria.habilidades,
      fechaPublicacion: convocatoria.fechaPublicacion,
      fechaFinalizacion: convocatoria.fechaFinalizacion,
      numero_cas: convocatoria.numero_cas || '',
    });
    setShowEditForm(true);
  };

  const handleViewDetails = (convocatoria: Convocatoria) => {
    setSelectedConvocatoria(convocatoria);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedConvocatoria(null);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setShowEditForm(false);
    setFormData({ 
      area: 'Administración - Patrimonio', 
      puesto: '', 
      sueldo: '', 
      requisitos: '', 
      licenciatura: 'Sí', 
      expPublicaMin: '', 
      expPublicaMax: '', 
      habilidades: '', 
      fechaPublicacion: '', 
      fechaFinalizacion: '', 
      numero_cas: ''
    });
    setFormErrors([]);
    setSubmissionError(null);
    setSelectedConvocatoria(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="group flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-3 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:-translate-y-1 disabled:bg-red-400 disabled:cursor-not-allowed"
        >
          <Download className="transition-transform group-hover:rotate-12" size={20} />
          {isDownloading ? 'Generando PDF...' : 'Descargar PDF'}
        </button>
        <button
          onClick={handleCreateConvocatoria}
          className="group flex items-center justify-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-1"
        >
          <Briefcase className="transition-transform group-hover:scale-110" size={20} />
          Crear Convocatoria
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg mb-8 animate-fade-in" role="alert">
            <CheckCircle size={24} />
            <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-white uppercase bg-gradient-to-r from-pink-600 to-purple-600">
              <tr>
                <th scope="col" className="px-6 py-4">N°</th>
                <th scope="col" className="px-6 py-4">Área</th>
                <th scope="col" className="px-6 py-4">Puesto</th>
                <th scope="col" className="px-6 py-4">Sueldo</th>
                <th scope="col" className="px-6 py-4">Experiencia</th>
                <th scope="col" className="px-6 py-4">Licenciatura</th>
                <th scope="col" className="px-6 py-4">Periodo</th>
                <th scope="col" className="px-6 py-4">Estado</th>
                <th scope="col" className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-4">
                        <LoaderCircle className="animate-spin text-purple-400" size={32} />
                        <span className="text-lg">Cargando convocatorias...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                 <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-red-400">
                     <Briefcase className="mx-auto text-red-500/70 mb-4" size={48} />
                    <p className="text-lg font-semibold">Error al cargar datos</p>
                    <p className="text-sm">{error}</p>
                  </td>
                </tr>
              ) : convocatorias.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-500">
                    <Briefcase className="mx-auto text-slate-600 mb-4" size={48} />
                    <p className="text-lg font-semibold">No hay convocatorias disponibles</p>
                    <p className="text-sm">Intente crear una nueva para el área de {'Administración - Patrimonio'}</p>
                  </td>
                </tr>
              ) : (
                convocatorias.map((conv, index) => (
                  <tr
                    key={conv.id}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors duration-300 animate-slide-in"
                  >
                    <td className="px-6 py-4 font-medium text-slate-400">{index + 1}</td>
                    <td className="px-6 py-4">{conv.area}</td>
                    <td className="px-6 py-4 font-semibold text-pink-400">{conv.puesto}</td>
                    <td className="px-6 py-4 font-semibold text-green-400">{`S/ ${parseFloat(conv.sueldo).toFixed(2)}`}</td>
                    <td className="px-6 py-4">{conv.experiencia}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          conv.licenciatura === 'Sí'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-slate-700 text-slate-400 border border-slate-600'
                        }`}
                      >
                        {conv.licenciatura}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-purple-400">
                      {new Date(conv.fechaPublicacion).toLocaleDateString('es-ES')} -{' '}
                      {new Date(conv.fechaFinalizacion).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          conv.estado === 'Publicada' || conv.estado === 'publicada' || conv.estado === 'Activo' || conv.estado === 'activo'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                        }`}
                      >
                        {conv.estado === 'Publicada' || conv.estado === 'publicada' ? 'Publicada' : 
                         conv.estado === 'No Publicada' || conv.estado === 'no publicada' ? 'No Publicada' :
                         conv.estado === 'Activo' || conv.estado === 'activo' ? 'Activo' : 
                         conv.estado === 'Inactivo' || conv.estado === 'inactivo' ? 'Inactivo' : 
                         conv.estado || 'No Publicada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => handleViewDetails(conv)}
                        className="group flex items-center justify-center gap-2 bg-blue-600/50 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all"
                        title="Ver detalles"
                      >
                        <Eye className="transition-transform group-hover:scale-110" size={16} />
                        Ver
                      </button>
                      <button
                        onClick={() => handleEditConvocatoria(conv)}
                        className="group flex items-center justify-center gap-2 bg-yellow-600/50 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-all"
                        title="Editar convocatoria"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => togglePublicacion(conv.id, conv.estado)}
                        className={`group flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                          conv.estado === 'Publicada' || conv.estado === 'publicada'
                            ? 'bg-orange-600/50 text-white hover:bg-orange-600'
                            : 'bg-green-600/50 text-white hover:bg-green-600'
                        }`}
                        title={conv.estado === 'Publicada' || conv.estado === 'publicada' ? 'Desactivar publicación' : 'Publicar convocatoria'}
                      >
                        {conv.estado === 'Publicada' || conv.estado === 'publicada' ? (
                          <><Globe className="transition-transform group-hover:scale-110" size={16} /> Desactivar</>
                        ) : (
                          <><Globe className="transition-transform group-hover:scale-110" size={16} /> Publicar</>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedConvocatoria(conv);
                          setShowDelete(true);
                        }}
                        className="group flex items-center justify-center gap-2 bg-red-600/50 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
                        title="Eliminar convocatoria"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    {/* Details Modal */}
      {isModalOpen && selectedConvocatoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="w-full max-w-2xl border rounded-2xl shadow-2xl bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-purple-500/10 animate-slide-in-modal">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white">Detalles de la Convocatoria</h3>
                <button onClick={closeModal} className="p-2 -mt-2 -mr-2 transition-colors rounded-full text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
             </div>
            <div className="p-6 space-y-4 overflow-y-auto text-slate-300 max-h-[70vh]">
              <p><strong>Área:</strong> {selectedConvocatoria.area}</p>
              <p><strong>Puesto:</strong> {selectedConvocatoria.puesto}</p>
              <p><strong>Sueldo:</strong> {`S/ ${parseFloat(selectedConvocatoria.sueldo).toFixed(2)}`}</p>
              <p><strong>Experiencia:</strong> {selectedConvocatoria.experiencia}</p>
              <p><strong>Licenciatura:</strong> {selectedConvocatoria.licenciatura}</p>
              <div className="p-4 rounded-lg prose prose-sm prose-invert max-w-none bg-slate-800/50">
                  <p><strong>Requisitos:</strong> {selectedConvocatoria.requisitos}</p>
                  <p><strong>Habilidades:</strong> {selectedConvocatoria.habilidades}</p>
              </div>
              <p>
                <strong className="text-purple-400">Periodo de Contrato:</strong>{' '}
                <span className="font-semibold text-purple-400">
                  {new Date(selectedConvocatoria.fechaPublicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} -{' '}
                  {new Date(selectedConvocatoria.fechaFinalizacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </p>
              <p>
                <strong className="text-purple-400">Estado:</strong>{' '}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedConvocatoria.estado === 'Activo'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {selectedConvocatoria.estado}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || showEditForm) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="w-full max-w-2xl border rounded-2xl shadow-2xl bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-blue-500/10 animate-slide-in-modal">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white">{isCreateModalOpen ? 'Crear Nueva Convocatoria' : 'Editar Convocatoria'}</h3>
                 <button onClick={closeCreateModal} className="p-2 -mt-2 -mr-2 transition-colors rounded-full text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>
            <form onSubmit={(e) => handleSubmit(e, isCreateModalOpen ? 'create' : 'edit')} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-300">Área</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  readOnly
                  className="w-full px-4 py-2 transition-colors border rounded-lg cursor-not-allowed bg-slate-800 text-slate-400 border-slate-700"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-300">Puesto</label>
                  <input
                    type="text"
                    name="puesto"
                    value={formData.puesto}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.includes('puesto') ? 'border-red-500' : 'border-slate-700'}`}
                  />
                  {formErrors.includes('puesto') && <p className="mt-1 text-xs text-red-400">El puesto es obligatorio</p>}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-300">Sueldo</label>
                  <input
                    type="number"
                    name="sueldo"
                    placeholder="Ej: 1500.00"
                    step="0.01"
                    value={formData.sueldo}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.includes('sueldo') ? 'border-red-500' : 'border-slate-700'}`}
                  />
                  {formErrors.includes('sueldo') && <p className="mt-1 text-xs text-red-400">El sueldo es obligatorio</p>}
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-300">Requisitos</label>
                <textarea
                  name="requisitos"
                  value={formData.requisitos}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.includes('requisitos') ? 'border-red-500' : 'border-slate-700'}`}
                  rows={3}
                />
                {formErrors.includes('requisitos') && <p className="mt-1 text-xs text-red-400">Los requisitos son obligatorios</p>}
              </div>
               <div>
                <label className="block mb-2 text-sm font-semibold text-slate-300">Habilidades</label>
                <textarea
                  name="habilidades"
                  value={formData.habilidades}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.includes('habilidades') ? 'border-red-500' : 'border-slate-700'}`}
                  rows={3}
                />
                {formErrors.includes('habilidades') && <p className="mt-1 text-xs text-red-400">Las habilidades son obligatorias</p>}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-purple-400">Años de experiencias públicas (mínimo)</label>
                    <input
                      type="text"
                      name="expPublicaMin"
                      value={formData.expPublicaMin}
                      onChange={handleInputChange}
                      placeholder="Ej: 1 año, 1.5 años"
                      className="w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-purple-400">Años de experiencias públicas (máximo)</label>
                    <input
                      type="text"
                      name="expPublicaMax"
                      value={formData.expPublicaMax}
                      onChange={handleInputChange}
                      placeholder="Ej: 5 años, 2.5 años"
                      className="w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-purple-400">Título profesional o académico</label>
                    <select
                      name="licenciatura"
                      value={formData.licenciatura}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-purple-400">Número CAS</label>
                    <input
                      type="text"
                      name="numero_cas"
                      value={formData.numero_cas}
                      onChange={handleInputChange}
                      placeholder="Ej: CAS N° 001-2025-UGEL-T"
                      className={`w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.includes('numero_cas') ? 'border-red-500' : 'border-slate-700'}`}
                    />
                    {formErrors.includes('numero_cas') && <p className="mt-1 text-xs text-red-400">El número CAS es obligatorio</p>}
                  </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="block mb-2 text-sm font-semibold text-purple-400">Fecha de Publicación</label>
                    <input
                    type="date"
                    name="fechaPublicacion"
                    value={formData.fechaPublicacion}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.includes('fechaPublicacion') ? 'border-red-500' : 'border-slate-700'}`}
                    />
                    {formErrors.includes('fechaPublicacion') && <p className="mt-1 text-xs text-red-400">La fecha de publicación es obligatoria</p>}
                </div>
                <div>
                    <label className="block mb-2 text-sm font-semibold text-purple-400">Fecha de Finalización</label>
                    <input
                    type="date"
                    name="fechaFinalizacion"
                    value={formData.fechaFinalizacion}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 transition-colors border rounded-lg bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.includes('fechaFinalizacion') ? 'border-red-500' : 'border-slate-700'}`}
                    />
                    {formErrors.includes('fechaFinalizacion') && <p className="mt-1 text-xs text-red-400">La fecha de finalización es obligatoria</p>}
                </div>
              </div>
              {submissionError && (
                <div className="p-3 my-2 text-sm rounded-lg bg-red-900/50 border border-red-500/50 text-red-300">
                    <p><strong>Error de envío:</strong> {submissionError}</p>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-6 py-2 transition-all rounded-lg bg-slate-700 text-white hover:bg-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 transition-all rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isCreateModalOpen ? 'Guardar Convocatoria' : 'Actualizar Convocatoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    {/* Delete Confirmation Modal */}
      {showDelete && selectedConvocatoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="w-full max-w-md border rounded-2xl shadow-2xl bg-slate-900/80 backdrop-blur-xl border-slate-700/50 animate-slide-in-modal">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white">Eliminar Convocatoria</h3>
              <p className="mt-2 text-sm text-slate-400">¿Estás seguro que deseas eliminar la convocatoria de <span className="font-semibold text-pink-400">{selectedConvocatoria.puesto}</span>? Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex justify-end gap-4 p-6">
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="px-6 py-2 transition-all rounded-lg bg-slate-700 text-white hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 transition-all rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministracionPatrimonio;