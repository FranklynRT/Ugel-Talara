import React, { useState, useEffect } from 'react';
import { Download, Briefcase, Eye, Edit, Trash2, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import UgelLogo from '@/imagenes/icons.png';

interface Convocatoria {
  id: number;
  area: string;
  puesto: string;
  sueldo: string;
  requisitos: string;
  experiencia: string;
  licenciatura: string;
  habilidades: string;
  fechaPublicacion: string;
  fechaFinalizacion: string;
  estado: string;
}

const API_URL = 'http://localhost:9000/ugel-talara/convocatorias';

const UPDI: React.FC = () => {
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formData, setFormData] = useState({
    area: 'UPDI',
    puesto: '',
    sueldo: '',
    requisitos: '',
    experiencia: '',
    licenciatura: 'No',
    habilidades: '',
    fechaPublicacion: '',
    fechaFinalizacion: '',
    estado: 'activo',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const fetchConvocatorias = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/convocatorias?area=${encodeURIComponent('UPDI')}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Convocatoria[] = await response.json();
      setConvocatorias(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch convocatorias');
      setConvocatorias([]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConvocatorias();
  }, []);

  const downloadPDF = async () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4');

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 297, 50, 'F');
      
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 50, 297, 3, 'F');

      doc.setFillColor(255, 255, 255);
      doc.circle(28, 22, 16, 'F');
      // @ts-ignore
      doc.addImage(UgelLogo, 'JPEG', 14, 8, 28, 28);
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text('REPORTE DE CONVOCATORIAS', 148, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text('UGEL Talara', 148, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      
      const infoY = 42;
      const boxWidth = 85;
      
      doc.setFillColor(255, 255, 255, 0.15);
      doc.roundedRect(12, infoY - 6, boxWidth, 9, 2, 2, 'F');
      doc.text(`📋 Área: ${'UPDI'}`, 16, infoY);
      
      doc.roundedRect(106, infoY - 6, boxWidth, 9, 2, 2, 'F');
      doc.text(`📅 Fecha: ${new Date().toLocaleDateString('es-ES')}`, 110, infoY);
      
      doc.roundedRect(200, infoY - 6, boxWidth, 9, 2, 2, 'F');
      doc.text(`📊 Total: ${convocatorias.length} Convocatorias`, 204, infoY);

      console.log("Convocatorias filtradas for PDF:", convocatorias.length);

      const tableStartY = infoY + 15;
      const cellPadding = 3;
      const fontSize = 8;
      const headerHeight = 10;
      const rowHeight = 10;

      doc.setFontSize(fontSize);

      const colWidths: { [key: string]: number } = {
        'N°': 8,
        'Área': 25,
        'Puesto': 30,
        'Tiempo': 30,
        'Sueldo': 18,
        'Experiencia': 18,
        'Licenciatura': 18,
        'Estado': 15,
        'Requisitos': 30,
        'Habilidades': 30,
      };

      const headers = Object.keys(colWidths);
      let currentX = 14;
      let currentY = tableStartY;

      doc.setFillColor(236, 72, 153);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");

      headers.forEach(header => {
        const width = colWidths[header];
        doc.rect(currentX, currentY, width, headerHeight, 'F');
        doc.setDrawColor(180, 180, 180);
        doc.rect(currentX, currentY, width, headerHeight, 'S');
        doc.text(header, currentX + width / 2, currentY + headerHeight / 2 + fontSize / 2 - 0.5, { align: 'center' });
        currentX += width;
      });

      currentY += headerHeight;
      doc.setFont("helvetica", "normal");

      convocatorias.forEach((conv, index) => {
        currentX = 14;
        const isAlternateRow = index % 2 !== 0;
        doc.setFillColor(isAlternateRow ? 240 : 255, isAlternateRow ? 240 : 255, isAlternateRow ? 240 : 255);
        doc.setTextColor(0, 0, 0);

        const formattedFechaPublicacion = new Date(conv.fechaPublicacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedFechaFinalizacion = new Date(conv.fechaFinalizacion).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const rowData = [
          String(index + 1),
          conv.area,
          conv.puesto,
          `${formattedFechaPublicacion} - ${formattedFechaFinalizacion}`,
          conv.sueldo,
          conv.experiencia,
          conv.licenciatura,
          (conv.estado === 'activo' ? 'Activo' : 'Deshabilitado'),
          conv.requisitos,
          conv.habilidades,
        ];

        console.log("Row Data for PDF:", rowData);

        headers.forEach((header, colIndex) => {
          const width = colWidths[header];
          doc.rect(currentX, currentY, width, rowHeight, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(currentX, currentY, width, rowHeight, 'S');

          let cellText = String(rowData[colIndex]);
          const textLines = doc.splitTextToSize(cellText, width - cellPadding * 2);
          doc.text(textLines[0] || '', currentX + cellPadding, currentY + rowHeight / 2 + fontSize / 2 - 0.5);
          currentX += width;
        });
        currentY += rowHeight;
      });

      doc.save(`UGEL_Talar-Convocatorias_${'UPDI'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setError('Error al generar el PDF');
    }
  };

  const handleCreateConvocatoria = () => {
    setIsCreateModalOpen(true);
  };

  const handleViewDetails = (convocatoria: Convocatoria) => {
    setSelectedConvocatoria(convocatoria);
    setIsModalOpen(true);
  };

  const handleEditConvocatoria = (conv: Convocatoria) => {
    setSelectedConvocatoria(conv);
    setFormData({
      area: conv.area,
      puesto: conv.puesto,
      sueldo: conv.sueldo,
      requisitos: conv.requisitos,
      experiencia: conv.experiencia,
      licenciatura: conv.licenciatura,
      habilidades: conv.habilidades,
      fechaPublicacion: conv.fechaPublicacion,
      fechaFinalizacion: conv.fechaFinalizacion,
      estado: conv.estado,
    });
    setShowEditForm(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedConvocatoria(null);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setShowEditForm(false);
    setSelectedConvocatoria(null);
    setFormData({
      area: 'UPDI',
      puesto: '',
      sueldo: '',
      requisitos: '',
      experiencia: '',
      licenciatura: 'No',
      habilidades: '',
      fechaPublicacion: '',
      fechaFinalizacion: '',
      estado: 'activo',
    });
    setFormErrors([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, type: 'create' | 'edit') => {
    e.preventDefault();
    setSubmissionError(null);
    const errors: string[] = [];

    const requiredFields = ['puesto', 'sueldo', 'requisitos', 'experiencia', 'licenciatura', 'habilidades', 'fechaPublicacion', 'fechaFinalizacion', 'estado'];

    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        errors.push(field);
      }
    });

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors([]);

    const payload = {
      ...formData,
      area: 'UPDI', // Hardcode area for this specific component
      fechaPublicacion: formData.fechaPublicacion ? new Date(formData.fechaPublicacion).toISOString() : '',
      fechaFinalizacion: formData.fechaFinalizacion ? new Date(formData.fechaFinalizacion).toISOString() : '',
      ...(type === 'edit' && { id: selectedConvocatoria!.id }),
    };

    try {
      const url = type === 'create' ? `${API_URL}/convocatorias` : `${API_URL}/convocatorias/${selectedConvocatoria!.id}`;
      const method = type === 'create' ? 'POST' : 'PUT';
      console.log(`Sending ${method} request to ${url} with payload:`, payload);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `El servidor respondió con un error ${response.status}. Verifique los datos.` }));
        console.error("Backend Error Details:", JSON.stringify(errorData, null, 2));
        throw new Error(errorData.message || `Error en la operación (Estado: ${response.status})`);
      }

      fetchConvocatorias();
      closeCreateModal();
    } catch (err: any) {
      setSubmissionError(err.message);
      console.error('Error submitting form:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedConvocatoria) return;
    try {
      const response = await fetch(`${API_URL}/convocatorias/${selectedConvocatoria.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      await fetchConvocatorias();
      setShowDelete(false);
      setSelectedConvocatoria(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting convocatoria:', err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] relative p-8">
      {error && <div className="mb-4 text-red-500">Error: {error}</div>}
      {submissionError && <div className="mb-4 text-red-500">Error de envío: {submissionError}</div>}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Administración de UPDI</h1>
        <p className="text-lg text-slate-400">Gestión de Convocatorias</p>
      </div>

      <div className="flex gap-3 mb-8">
        <button
          onClick={downloadPDF}
          className="group flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-xl hover:from-green-500 hover:to-green-400 transition-all shadow-lg shadow-green-500/50 hover:shadow-green-400/50 hover:scale-105"
        >
          <Download size={20} className="group-hover:translate-y-1 transition-transform" />
          Descargar PDF
        </button>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/50 hover:shadow-blue-400/50 hover:scale-105"
        >
          <Briefcase size={20} className="group-hover:scale-110 transition-transform" />
          Nueva Convocatoria
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 animate-fade-in">
        <h3 className="text-xl font-bold p-6 text-white bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-b border-slate-700/50">
          Convocatorias de UPDI
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-600 to-purple-600">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">N°</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Área</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Puesto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Tiempo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Sueldo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Experiencia</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Licenciatura</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Estado</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 rounded-full animate-pulse bg-pink-500"></div>
                      <div className="w-5 h-5 rounded-full animate-pulse bg-purple-500" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-5 h-5 rounded-full animate-pulse bg-blue-500" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </td>
                </tr>
              ) : convocatorias.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <Briefcase size={48} className="mx-auto text-slate-600 mb-4" />
                    No hay convocatorias disponibles para esta área
                  </td>
                </tr>
              ) : (
                convocatorias.map((conv, index) => (
                  <tr
                    key={conv.id}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="border-b border-slate-700/50 hover:bg-pink-500/5 transition-all duration-300 animate-slide-in"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-300">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{conv.area}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-pink-400">{conv.puesto}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{`${new Date(conv.fechaPublicacion).toLocaleDateString('es-ES')} - ${new Date(conv.fechaFinalizacion).toLocaleDateString('es-ES')}`}</td>
                    <td className="px-6 py-4 text-sm text-green-400 font-semibold">{conv.sueldo}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{conv.experiencia}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          conv.licenciatura === 'Sí'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                        }`}
                      >
                        {conv.licenciatura}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          conv.estado === 'activo' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {conv.estado === 'activo' ? 'Activo' : 'Deshabilitado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => handleViewDetails(conv)}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all text-sm font-semibold shadow-lg hover:scale-105"
                      >
                        <Eye size={16} className="group-hover:scale-110 transition-transform" />
                        Ver
                      </button>
                      <button
                        onClick={() => handleEditConvocatoria(conv)}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-400 transition-all text-sm font-semibold shadow-lg hover:scale-105"
                      >
                        <Edit size={16} className="group-hover:scale-110 transition-transform" />
                        Editar
                      </button>
                      <button
                        onClick={() => { setSelectedConvocatoria(conv); setShowDelete(true); }}
                        className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-red-400 transition-all text-sm font-semibold shadow-lg hover:scale-105"
                      >
                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
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

      {isModalOpen && selectedConvocatoria && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-700/50 animate-slide-up">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Detalles de la Convocatoria</h3>
              <button
                onClick={closeModal}
                className="hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
            <div className="p-8 space-y-6 text-slate-300">
              <p><strong>Área:</strong> {selectedConvocatoria.area}</p>
              <p><strong>Puesto:</strong> {selectedConvocatoria.puesto}</p>
              <p><strong>Sueldo:</strong> {selectedConvocatoria.sueldo}</p>
              <p><strong>Experiencia:</strong> {selectedConvocatoria.experiencia}</p>
              <p><strong>Licenciatura:</strong> {selectedConvocatoria.licenciatura}</p>
              <p><strong>Requisitos:</strong> {selectedConvocatoria.requisitos}</p>
              <p><strong>Habilidades:</strong> {selectedConvocatoria.habilidades}</p>
              <p>
                <strong className="text-purple-500">Fecha de Publicación:</strong>{' '}
                <span className="text-purple-500">
                  {new Date(selectedConvocatoria.fechaPublicacion).toLocaleDateString('es-ES')}
                </span>
              </p>
              <p>
                <strong className="text-purple-500">Fecha de Finalización:</strong>{' '}
                <span className="text-purple-500">
                  {new Date(selectedConvocatoria.fechaFinalizacion).toLocaleDateString('es-ES')}
                </span>
              </p>
              <p>
                <strong className="text-purple-500">Estado:</strong>{' '}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedConvocatoria.estado === 'activo' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                  {selectedConvocatoria.estado === 'activo' ? 'Activo' : 'Deshabilitado'}
                </span>
              </p>
            </div>
            <div className="mt-6 p-6 bg-slate-800/50 border-t border-slate-700/50 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-pink-500 hover:to-purple-500 transition-all font-semibold shadow-lg hover:scale-105"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {(isCreateModalOpen || showEditForm) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-700/50 animate-slide-up">
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">{isCreateModalOpen ? 'Publicar Nueva Convocatoria' : 'Editar Convocatoria'}</h3>
              <button
                onClick={closeCreateModal}
                className="hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
            <form onSubmit={(e) => handleSubmit(e, isCreateModalOpen ? 'create' : 'edit')} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Área</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  readOnly
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Puesto</label>
                <input
                  type="text"
                  name="puesto"
                  value={formData.puesto}
                  onChange={handleInputChange}
                  placeholder="Ej: Analista de Sistemas"
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${formErrors.includes('puesto') ? 'border-red-500' : 'border-slate-600'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all`}
                />
                {formErrors.includes('puesto') && <p className="text-red-500 text-xs mt-1">El puesto es obligatorio</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Sueldo</label>
                <input
                  type="text"
                  name="sueldo"
                  value={formData.sueldo}
                  onChange={handleInputChange}
                  placeholder="Ej: S/ 3,500"
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${formErrors.includes('sueldo') ? 'border-red-500' : 'border-slate-600'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all`}
                />
                {formErrors.includes('sueldo') && <p className="text-red-500 text-xs mt-1">El sueldo es obligatorio</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Años de Experiencia</label>
                <input
                  type="text"
                  name="experiencia"
                  value={formData.experiencia}
                  onChange={handleInputChange}
                  placeholder="Ej: 3 años"
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${formErrors.includes('experiencia') ? 'border-red-500' : 'border-slate-600'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all`}
                />
                {formErrors.includes('experiencia') && <p className="text-red-500 text-xs mt-1">La experiencia es obligatoria</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Licenciatura Requerida</label>
                <select
                  name="licenciatura"
                  value={formData.licenciatura}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all"
                >
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Fecha Publicación</label>
                <input
                  type="date"
                  name="fechaPublicacion"
                  value={formData.fechaPublicacion}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${formErrors.includes('fechaPublicacion') ? 'border-red-500' : 'border-slate-600'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all`}
                />
                {formErrors.includes('fechaPublicacion') && <p className="text-red-500 text-xs mt-1">La fecha de publicación es obligatoria</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Fecha Finalización</label>
                <input
                  type="date"
                  name="fechaFinalizacion"
                  value={formData.fechaFinalizacion}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${formErrors.includes('fechaFinalizacion') ? 'border-red-500' : 'border-slate-600'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all`}
                />
                {formErrors.includes('fechaFinalizacion') && <p className="text-red-500 text-xs mt-1">La fecha de finalización es obligatoria</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white transition-all"
                >
                  <option value="activo">Activo</option>
                  <option value="desactivado">Deshabilitado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Requisitos Académicos</label>
                <textarea
                  name="requisitos"
                  value={formData.requisitos}
                  onChange={handleInputChange}
                  placeholder="Ej: Título profesional en..."
                  rows={3}
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${formErrors.includes('requisitos') ? 'border-red-500' : 'border-slate-600'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all`}
                />
                {formErrors.includes('requisitos') && <p className="text-red-500 text-xs mt-1">Los requisitos son obligatorios</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Habilidades y Conocimientos Técnicos</label>
                <textarea
                  name="habilidades"
                  value={formData.habilidades}
                  onChange={handleInputChange}
                  placeholder="Ej: Manejo de Office, SQL, idiomas, etc."
                  rows={3}
                  className={`w-full px-4 py-3 bg-slate-800/50 border ${formErrors.includes('habilidades') ? 'border-red-500' : 'border-slate-600'} rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-slate-500 transition-all`}
                />
                {formErrors.includes('habilidades') && <p className="text-red-500 text-xs mt-1">Las habilidades son obligatorias</p>}
              </div>
              {submissionError && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">{submissionError}</div>}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-xl hover:from-green-500 hover:to-green-400 transition-all font-semibold shadow-lg hover:scale-105"
                >
                  {isCreateModalOpen ? 'Publicar Convocatoria' : 'Actualizar Convocatoria'}
                </button>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-6 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelete && selectedConvocatoria && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/50 animate-slide-up">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white">Eliminar Convocatoria</h3>
              <p className="text-sm text-slate-400 mt-2">¿Estás seguro que deseas eliminar la convocatoria para el puesto de <span className="font-semibold text-pink-400">{selectedConvocatoria.puesto}</span> en el área de <span className="font-semibold text-purple-400">{selectedConvocatoria.area}</span>? Esta acción no se puede deshacer.</p>
            </div>
            <div className="p-6 flex justify-end gap-4">
              <button
                onClick={() => setShowDelete(false)}
                className="px-6 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 text-white"
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

export default UPDI;