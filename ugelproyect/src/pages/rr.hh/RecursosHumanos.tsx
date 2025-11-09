import React, { useState } from 'react';
import { Download, Briefcase, Eye, CalendarIcon } from 'lucide-react';
import { Button, DateRangePicker, Dialog, Group, Label, Popover } from 'react-aria-components';
import { cn } from '@/lib/utils';
import { RangeCalendar } from '@/components/ui/calendar-rac';
import { DateInput, dateInputStyle } from '@/components/ui/datefield-rac';

const API_URL = 'http://localhost:9000/ugel-talara/convocatorias';

interface Convocatoria {
  id: number;
  area: string;
  puesto: string;
  sueldo: string;
  requisitos: string;
  experiencia: string;
  licenciatura: string;
  habilidades: string;
  fechaInicio: string;
  fechaFin: string;
}

interface RecursosHumanosProps {
  convocatorias: Convocatoria[];
  selectedArea: string;
}

const RecursosHumanos: React.FC<RecursosHumanosProps> = ({ convocatorias, selectedArea }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    area: selectedArea,
    puesto: '',
    sueldo: '',
    requisitos: '',
    experiencia: '',
    licenciatura: 'Sí',
    habilidades: '',
    fechaInicio: '',
    fechaFin: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const downloadPDF = () => {
    const convToExport = convocatorias;
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Convocatorias UGEL Talara - ${selectedArea}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f9fafb; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #ec4899; padding-bottom: 20px; }
          h1 { color: #1e293b; margin: 0; font-size: 28px; }
          .subtitle { color: #ec4899; font-size: 16px; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          th { background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 12px; text-align: left; font-size: 11px; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
          tr:hover { background-color: #fdf4ff; }
          .header-info { text-align: center; margin-bottom: 20px; color: #64748b; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>UGEL TALARA</h1>
          <p class="subtitle">Sistema de Gestión de Convocatorias Laborales</p>
        </div>
        <div class="header-info">
          <p><strong>Área:</strong> ${selectedArea}</p>
          <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          <p><strong>Total de convocatorias:</strong> ${convToExport.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Área</th>
              <th>Puesto</th>
              <th>Sueldo</th>
              <th>Experiencia</th>
              <th>Licenciatura</th>
              <th>Requisitos</th>
              <th>Habilidades</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            ${convToExport.map((conv, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${conv.area}</td>
                <td>${conv.puesto}</td>
                <td>${conv.sueldo}</td>
                <td>${conv.experiencia}</td>
                <td>${conv.licenciatura}</td>
                <td>${conv.requisitos}</td>
                <td>${conv.habilidades}</td>
                <td>${new Date(conv.fechaInicio).toLocaleDateString('es-ES')} - ${new Date(conv.fechaFin).toLocaleDateString('es-ES')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UGEL_Talara_Convocatorias_${selectedArea}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateConvocatoria = () => {
    setIsCreateModalOpen(true);
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
    setFormData({
      area: selectedArea,
      puesto: '',
      sueldo: '',
      requisitos: '',
      experiencia: '',
      licenciatura: 'Sí',
      habilidades: '',
      fechaInicio: '',
      fechaFin: '',
    });
    setFormErrors([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (value: { start: string; end: string }) => {
    setFormData(prev => ({
      ...prev,
      fechaInicio: value.start,
      fechaFin: value.end,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    const requiredFields = ['puesto', 'sueldo', 'requisitos', 'experiencia', 'habilidades', 'fechaInicio', 'fechaFin'];
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        errors.push(field);
      }
    });

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    console.log('Nueva Convocatoria:', { ...formData, id: Date.now() });
    closeCreateModal();
  };

  return (
    <div>
      <div className="flex gap-3 mb-8">
        <button
          onClick={downloadPDF}
          className="group flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-xl hover:from-green-500 hover:to-green-400 transition-all shadow-lg shadow-green-500/50 hover:shadow-green-400/50 hover:scale-105"
        >
          <Download size={20} className="group-hover:translate-y-1 transition-transform" />
          Descargar
        </button>
        <button
          onClick={handleCreateConvocatoria}
          className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/50 hover:shadow-blue-400/50 hover:scale-105"
        >
          <Briefcase size={20} className="group-hover:scale-110 transition-transform" />
          Crear Convocatoria
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-600 to-purple-600">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">N°</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Área</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Puesto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Sueldo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Experiencia</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Licenciatura</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-purple-500">Fecha de Inicio - Fecha de Término</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {convocatorias.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
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
                    <td className="px-6 py-4 text-sm text-purple-500">
                      {new Date(conv.fechaInicio).toLocaleDateString('es-ES')} -{' '}
                      {new Date(conv.fechaFin).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleViewDetails(conv)}
                        className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all"
                      >
                        <Eye size={16} className="group-hover:scale-110 transition-transform" />
                        Ver
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full border border-slate-700/50">
            <h3 className="text-xl font-bold mb-4 text-white">Detalles de la Convocatoria</h3>
            <div className="space-y-4 text-slate-300">
              <p><strong>Área:</strong> {selectedConvocatoria.area}</p>
              <p><strong>Puesto:</strong> {selectedConvocatoria.puesto}</p>
              <p><strong>Sueldo:</strong> {selectedConvocatoria.sueldo}</p>
              <p><strong>Experiencia:</strong> {selectedConvocatoria.experiencia}</p>
              <p><strong>Licenciatura:</strong> {selectedConvocatoria.licenciatura}</p>
              <p><strong>Requisitos:</strong> {selectedConvocatoria.requisitos}</p>
              <p><strong>Habilidades:</strong> {selectedConvocatoria.habilidades}</p>
              <p>
                <strong className="text-purple-500">Fecha de Inicio - Fecha de Término:</strong>{' '}
                <span className="text-purple-500">
                  {new Date(selectedConvocatoria.fechaInicio).toLocaleDateString('es-ES')} -{' '}
                  {new Date(selectedConvocatoria.fechaFin).toLocaleDateString('es-ES')}
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gradient-to-r from-gray-600 to-gray-500 text-white px-6 py-2 rounded-lg hover:from-gray-500 hover:to-gray-400 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full border border-slate-700/50">
            <h3 className="text-xl font-bold mb-4 text-white">Crear Nueva Convocatoria</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Área</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Puesto</label>
                <input
                  type="text"
                  name="puesto"
                  value={formData.puesto}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                    formErrors.includes('puesto') ? 'border-red-500' : 'border-slate-600/50'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.includes('puesto') && (
                  <p className="text-red-500 text-xs mt-1">El puesto es obligatorio</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Sueldo</label>
                <input
                  type="text"
                  name="sueldo"
                  value={formData.sueldo}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                    formErrors.includes('sueldo') ? 'border-red-500' : 'border-slate-600/50'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.includes('sueldo') && (
                  <p className="text-red-500 text-xs mt-1">El sueldo es obligatorio</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Requisitos</label>
                <textarea
                  name="requisitos"
                  value={formData.requisitos}
                  onChange={handleInputChange}
                  className={`
                    w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border
                    ${formErrors.includes('requisitos') ? 'border-red-500' : 'border-slate-600/50'}
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  `}
                  rows={4}
                />
                {formErrors.includes('requisitos') && (
                  <p className="text-red-500 text-xs mt-1">Los requisitos son obligatorios</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Experiencia</label>
                <input
                  type="text"
                  name="experiencia"
                  value={formData.experiencia}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                    formErrors.includes('experiencia') ? 'border-red-500' : 'border-slate-600/50'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {formErrors.includes('experiencia') && (
                  <p className="text-red-500 text-xs mt-1">La experiencia es obligatoria</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Licenciatura</label>
                <select
                  name="licenciatura"
                  value={formData.licenciatura}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Habilidades</label>
                <textarea
                  name="habilidades"
                  value={formData.habilidades}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                    formErrors.includes('habilidades') ? 'border-red-500' : 'border-slate-600/50'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  rows={4}
                />
                {formErrors.includes('habilidades') && (
                  <p className="text-red-500 text-xs mt-1">Las habilidades son obligatorias</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-500 mb-1">Fecha de Inicio - Fecha de Término</label>
                <DateRangePicker
                  onChange={handleDateChange}
                  className={`*:not-first:mt-2 ${
                    formErrors.includes('fechaInicio') || formErrors.includes('fechaFin') ? 'border-red-500' : ''
                  }`}
                >
                  <Label className="text-sm font-medium text-purple-500 sr-only">Fecha de Inicio - Fecha de Término</Label>
                  <div className="flex">
                    <Group className={cn(dateInputStyle, 'pe-9')}>
                      <DateInput slot="start" unstyled />
                      <span aria-hidden="true" className="px-2 text-slate-400">
                        -
                      </span>
                      <DateInput slot="end" unstyled />
                    </Group>
                    <Button className="z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md text-slate-400 transition-[color,box-shadow] outline-none hover:text-slate-200 data-focus-visible:border-blue-500 data-focus-visible:ring-[3px] data-focus-visible:ring-blue-500/50">
                      <CalendarIcon size={16} />
                    </Button>
                  </div>
                  <Popover
                    className="z-50 rounded-md border bg-slate-800 text-slate-200 shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2"
                    offset={4}
                  >
                    <Dialog className="max-h-[inherit] overflow-auto p-2">
                      <RangeCalendar />
                    </Dialog>
                  </Popover>
                </DateRangePicker>
                {(formErrors.includes('fechaInicio') || formErrors.includes('fechaFin')) && (
                  <p className="text-red-500 text-xs mt-1">El rango de fechas es obligatorio</p>
                )}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="bg-gradient-to-r from-gray-600 to-gray-500 text-white px-6 py-2 rounded-lg hover:from-gray-500 hover:to-gray-400 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecursosHumanos;