import React, { useState, useEffect } from 'react';

// --- Helper Components for Icons (replaces lucide-react) ---
const DownloadIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const BriefcaseIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
const EyeIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const LoaderCircleIcon = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
const XIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const CheckCircleIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const GlobeIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);
const GlobeOffIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 2c1 1 2 4 2 6s-1 5-2 6M16 2c-1 1-2 4-2 6s1 5 2 6M12 22c-1 1-2-4-2-6s1-5 2-6M12 8c1 1 2 4 2 6s-1 5-2 6"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M20 8c-2-2-6-3-10-3s-8 1-10 3"/><path d="M4 16c2 2 6 3 10 3s8-1 10-3"/></svg>
);


// Interface for the Convocatoria object, matching the expected API structure
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
  estado?: string;
}

const AdministracionInformatica: React.FC = () => {
  // State to hold the list of job postings fetched from the API
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  // State to manage loading status during API calls
  const [isLoading, setIsLoading] = useState(true);
  // State to store any errors from API calls
  const [error, setError] = useState<string | null>(null);

  // States for managing modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  // State for the "Create New" form data
  const [formData, setFormData] = useState({
    area: 'Administración - Informática',
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
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const API_URL = 'http://localhost:9000/ugel-talara/convocatorias';

  // useEffect to fetch data from the API when the component mounts or selectedArea changes
  useEffect(() => {
    let ignore = false;

    const fetchConvocatorias = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}?area=${encodeURIComponent('Administración - Informática')}`);
        if (!response.ok) {
          throw new Error('No se pudo conectar con el servidor para obtener los datos.');
        }
        const data = await response.json();
        if (!ignore) {
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
            estado: item.estado || 'No Publicada',
          }));
          
          const filteredData = mappedData.filter((c: Convocatoria) => c.area === 'Administración - Informática');
          setConvocatorias(filteredData);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Un error inesperado ocurrió');
          console.error(err);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchConvocatorias();

    return () => {
      ignore = true;
    };
  }, []);
  
  // Sync formData's area with the selectedArea prop to ensure it's always up-to-date
  useEffect(() => {
    setFormData(prev => ({ ...prev, area: 'Administración - Informática' }));
  }, []);

  // Dynamically loads a script from a CDN
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

  // Function to generate and download a PDF report
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
        doc.text(`Área: ${'Administración - Informática'}`, 14, 30);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, 14, 36);
        
        const tableColumn = ["N°", "Puesto", "Sueldo", "Experiencia", "Licenciatura", "Periodo"];
        const tableRows = convocatorias.map((conv, index) => [
            index + 1,
            conv.puesto,
            `S/ ${parseFloat(conv.sueldo).toFixed(2)}`,
            conv.experiencia,
            conv.licenciatura,
            `${new Date(conv.fechaPublicacion).toLocaleDateString('es-ES')} - ${new Date(conv.fechaFinalizacion).toLocaleDateString('es-ES')}`
        ]);
        
        // @ts-ignore
        doc.autoTable(tableColumn, tableRows, { 
            startY: 50,
            headStyles: { fillColor: [148, 49, 149] }
        });
        
        doc.save(`Reporte_Convocatorias_${'Administración - Informática'}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        setError("No se pudo generar el PDF. Revise la conexión a internet.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleCreateConvocatoria = () => {
    console.log("Opening create modal. Initial formData:", formData); // Log initial formData
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
      area: 'Administración - Informática',
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
    setFormErrors([]);
    setSubmissionError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    console.log(`Input changed: ${name}: ${value}`, { ...formData, [name]: value }); // Log changes
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

      // Recargar convocatorias después de cambiar el estado
      const res = await fetch(`${API_URL}?area=${encodeURIComponent('Administración - Informática')}`);
      if (res.ok) {
        const data = await res.json();
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
          estado: item.estado || 'No Publicada',
        }));
        const filteredData = mappedData.filter((c: Convocatoria) => c.area === 'Administración - Informática');
        setConvocatorias(filteredData);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado de publicación.');
      console.error('Error in togglePublicacion:', err);
    }
  };

  // Handle form submission to create a new convocatoria via API
  const handleSubmit = async (e: React.FormEvent) => {
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
    const payload = {
      area: 'Administración - Informática',
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
    
    console.log("Enviando payload a la API:", payload);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
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
            throw new Error(errorData.error || errorData.message || 'Error al crear la convocatoria.');
        }

        // Recargar convocatorias desde el servidor
        const fetchConvocatorias = async () => {
          try {
            const res = await fetch(`${API_URL}?area=${encodeURIComponent('Administración - Informática')}`);
            if (res.ok) {
              const data = await res.json();
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
                estado: item.estado || 'No Publicada',
              }));
              const filteredData = mappedData.filter((c: Convocatoria) => c.area === 'Administración - Informática');
              setConvocatorias(filteredData);
            }
          } catch (err) {
            console.error('Error al recargar convocatorias:', err);
          }
        };
        
        await fetchConvocatorias();
        closeCreateModal();
        setSuccessMessage('¡Convocatoria creada correctamente!');
        setTimeout(() => setSuccessMessage(null), 4000);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Un error inesperado ocurrió.';
        console.error('Error al enviar el formulario:', err);
        setSubmissionError(`Error del Servidor: ${errorMessage}`);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="group flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-3 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:-translate-y-1 disabled:bg-red-400 disabled:cursor-not-allowed"
        >
          <DownloadIcon size={20} className="transition-transform group-hover:rotate-12" />
          {isDownloading ? 'Generando PDF...' : 'Descargar PDF'}
        </button>
        <button
          onClick={handleCreateConvocatoria}
          className="group flex items-center justify-center gap-2 bg-blue-500 text-white px-5 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-1"
        >
          <BriefcaseIcon size={20} className="transition-transform group-hover:scale-110" />
          Crear Convocatoria
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg mb-8 animate-fade-in" role="alert">
            <CheckCircleIcon size={24} />
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
                        <LoaderCircleIcon size={32} className="animate-spin text-purple-400" />
                        <span className="text-lg">Cargando convocatorias...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                 <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-red-400">
                     <BriefcaseIcon size={48} className="mx-auto text-red-500/70 mb-4" />
                    <p className="text-lg font-semibold">Error al cargar datos</p>
                    <p className="text-sm">{error}</p>
                  </td>
                </tr>
              ) : convocatorias.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-500">
                    <BriefcaseIcon size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-lg font-semibold">No hay convocatorias disponibles</p>
                    <p className="text-sm">Intente crear una nueva para el área de {formData.area}</p>
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
                        <EyeIcon size={16} className="transition-transform group-hover:scale-110" />
                        Ver
                      </button>
                      <button
                        onClick={() => togglePublicacion(conv.id, conv.estado || 'No Publicada')}
                        className={`group flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                          conv.estado === 'Publicada' || conv.estado === 'publicada'
                            ? 'bg-orange-600/50 text-white hover:bg-orange-600'
                            : 'bg-green-600/50 text-white hover:bg-green-600'
                        }`}
                        title={conv.estado === 'Publicada' || conv.estado === 'publicada' ? 'Desactivar publicación' : 'Publicar convocatoria'}
                      >
                        {conv.estado === 'Publicada' || conv.estado === 'publicada' ? (
                          <><GlobeOffIcon size={16} className="transition-transform group-hover:scale-110" /> Desactivar</>
                        ) : (
                          <><GlobeIcon size={16} className="transition-transform group-hover:scale-110" /> Publicar</>
                        )}
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl w-full max-w-2xl border border-slate-700/50 shadow-2xl shadow-purple-500/10 animate-slide-in-modal">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Detalles de la Convocatoria</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors rounded-full p-2 -mr-2 -mt-2">
                    <XIcon size={24} />
                </button>
             </div>
            <div className="p-6 space-y-4 text-slate-300 max-h-[70vh] overflow-y-auto">
              <p><strong>Área:</strong> {selectedConvocatoria.area}</p>
              <p><strong>Puesto:</strong> {selectedConvocatoria.puesto}</p>
              <p><strong>Sueldo:</strong> {`S/ ${parseFloat(selectedConvocatoria.sueldo).toFixed(2)}`}</p>
              <p><strong>Experiencia:</strong> {selectedConvocatoria.experiencia}</p>
              <p><strong>Licenciatura:</strong> {selectedConvocatoria.licenciatura}</p>
              <div className="prose prose-invert prose-sm max-w-none bg-slate-800/50 p-4 rounded-lg">
                  <p><strong>Requisitos:</strong> {selectedConvocatoria.requisitos}</p>
                  <p><strong>Habilidades:</strong> {selectedConvocatoria.habilidades}</p>
              </div>
              <p>
                <strong className="text-purple-400">Periodo de Contrato:</strong>{' '}
                <span className="text-purple-400 font-semibold">
                  {new Date(selectedConvocatoria.fechaPublicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} -{' '}
                  {new Date(selectedConvocatoria.fechaFinalizacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl w-full max-w-2xl border border-slate-700/50 shadow-2xl shadow-blue-500/10 animate-slide-in-modal">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Crear Nueva Convocatoria</h3>
                 <button onClick={closeCreateModal} className="text-slate-400 hover:text-white transition-colors rounded-full p-2 -mr-2 -mt-2">
                    <XIcon size={24} />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Área</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Puesto</label>
                  <input
                    type="text"
                    name="puesto"
                    value={formData.puesto}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                      formErrors.includes('puesto') ? 'border-red-500' : 'border-slate-700'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  />
                  {formErrors.includes('puesto') && <p className="text-red-400 text-xs mt-1">El puesto es obligatorio</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Sueldo</label>
                  <input
                    type="number"
                    name="sueldo"
                    placeholder="Ej: 1500.00"
                    step="0.01"
                    value={formData.sueldo}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                      formErrors.includes('sueldo') ? 'border-red-500' : 'border-slate-700'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  />
                  {formErrors.includes('sueldo') && <p className="text-red-400 text-xs mt-1">El sueldo es obligatorio</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Requisitos</label>
                <textarea
                  name="requisitos"
                  value={formData.requisitos}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                    formErrors.includes('requisitos') ? 'border-red-500' : 'border-slate-700'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  rows={3}
                />
                {formErrors.includes('requisitos') && <p className="text-red-400 text-xs mt-1">Los requisitos son obligatorios</p>}
              </div>
               <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Habilidades</label>
                <textarea
                  name="habilidades"
                  value={formData.habilidades}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                    formErrors.includes('habilidades') ? 'border-red-500' : 'border-slate-700'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  rows={3}
                />
                {formErrors.includes('habilidades') && <p className="text-red-400 text-xs mt-1">Las habilidades son obligatorias</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-purple-400 mb-2">Años de experiencias públicas (mínimo)</label>
                    <input
                      type="text"
                      name="expPublicaMin"
                      value={formData.expPublicaMin}
                      onChange={handleInputChange}
                      placeholder="Ej: 1 año, 1.5 años"
                      className="w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-400 mb-2">Años de experiencias públicas (máximo)</label>
                    <input
                      type="text"
                      name="expPublicaMax"
                      value={formData.expPublicaMax}
                      onChange={handleInputChange}
                      placeholder="Ej: 5 años, 2.5 años"
                      className="w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-400 mb-2">Título profesional o académico</label>
                    <select
                      name="licenciatura"
                      value={formData.licenciatura}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-400 mb-2">Número CAS</label>
                    <input
                      type="text"
                      name="numero_cas"
                      value={formData.numero_cas}
                      onChange={handleInputChange}
                      placeholder="Ej: CAS N° 001-2025-UGEL-T"
                      className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                        formErrors.includes('numero_cas') ? 'border-red-500' : 'border-slate-700'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    />
                    {formErrors.includes('numero_cas') && <p className="text-red-400 text-xs mt-1">El número CAS es obligatorio</p>}
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-purple-400 mb-2">Fecha Inicio</label>
                    <input
                    type="date"
                    name="fechaPublicacion"
                    value={formData.fechaPublicacion}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                        formErrors.includes('fechaPublicacion') ? 'border-red-500' : 'border-slate-700'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    />
                    {formErrors.includes('fechaPublicacion') && <p className="text-red-400 text-xs mt-1">La fecha de inicio es obligatoria</p>}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-purple-400 mb-2">Fecha Fin</label>
                    <input
                    type="date"
                    name="fechaFinalizacion"
                    value={formData.fechaFinalizacion}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 border ${
                        formErrors.includes('fechaFinalizacion') ? 'border-red-500' : 'border-slate-700'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    />
                    {formErrors.includes('fechaFinalizacion') && <p className="text-red-400 text-xs mt-1">La fecha de término es obligatoria</p>}
                </div>
              </div>

              {submissionError && (
                <div className="p-3 my-2 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg text-sm">
                    <p><strong>Error de envío:</strong> {submissionError}</p>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
                >
                  Guardar Convocatoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministracionInformatica;