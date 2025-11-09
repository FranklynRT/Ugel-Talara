import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Upload, File, X, Eye, FileText, Sparkles, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { API_BASE_URL } from '@/lib/api'; // Importar URL base de la API desde configuración centralizada

// Configurar worker para PDF.js usando el archivo local en public
// Esto evita problemas de CORS con CDN externos
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Type definitions
interface FileObject {
  file: File;
  name: string;
  size: number;
  type: string;
  preview: string | null;
  id: string;
}

// New Notification Component Interface
interface NotificationProps {
  message: string;
  type: 'success' | 'error' | null;
  onClose: () => void;
}

// Reusable Notification Component
const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  if (!message || !type) return null;

  const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
  const textColor = 'text-white';

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between gap-4 max-w-md w-full",
        bgColor,
        textColor
      )}
    >
      <p className="font-medium">{message}</p>
      <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
        &times;
      </button>
    </div>
  );
};

interface CurriculumSectionProps {
  textClasses?: string;
  textSecondaryClasses?: string;
  darkMode: boolean;
  authToken?: string | null; // Make authToken prop optional
  onUploadSuccess: () => void; // Callback for successful upload
}

function CurriculumSection({ darkMode, textClasses, textSecondaryClasses, authToken: propAuthToken, onUploadSuccess }: CurriculumSectionProps) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Estados para el visor de PDF (por archivo)
  const [pdfStates, setPdfStates] = useState<Record<string, {
    numPages: number;
    pageNumber: number;
    scale: number;
    error: string | null;
  }>>({});

  const currentAuthToken = propAuthToken || localStorage.getItem('token');
  const location = useLocation();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Effect para mostrar mensaje cuando viene del cierre de sesión
  useEffect(() => {
    const state = location.state as any;
    if (state?.autoLogout) {
      setNotification({ 
        message: 'La sesión se cerrará automáticamente en unos segundos por seguridad. Tu postulación ha sido enviada.', 
        type: 'success' 
      });
    }
  }, [location.state]);

  const handleFileUpload = (uploadedFiles: FileObject[]) => {
    setFiles(uploadedFiles);
    console.log(uploadedFiles);
  };

  const processFiles = (uploadedFiles: FileList) => {
    const validTypes = ['application/pdf']; // Solo PDF
    const newFiles = Array.from(uploadedFiles).filter((file: File) => {
      if (!validTypes.includes(file.type)) {
        setNotification({ message: `${file.name}: Solo se permiten archivos PDF.`, type: 'error' });
        return false;
      }
      if (file.size > 500 * 1024 * 1024) { // Increased to 500MB
        setNotification({ message: `${file.name}: Archivo demasiado grande. Máximo 500MB.`, type: 'error' });
        return false;
      }
      return true;
    });

    const filesWithPreview = newFiles.map((file: File) => {
      const reader = new FileReader();
      const fileObj: FileObject = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: null,
        id: Math.random().toString(36).substr(2, 9)
      };

      reader.onloadend = () => {
        fileObj.preview = reader.result as string;
        setFiles(prev => [...prev]);
      };
      reader.readAsDataURL(file);

      return fileObj;
    });

    handleFileUpload([...files, ...filesWithPreview]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter(f => f.id !== id);
    handleFileUpload(updatedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Funciones para el visor de PDF (manejando estados individuales)
  const onDocumentLoadSuccess = (fileId: string, numPages: number) => {
    setPdfStates(prev => ({
      ...prev,
      [fileId]: {
        numPages,
        pageNumber: 1,
        scale: 1.0,
        error: null
      }
    }));
  };

  const onDocumentLoadError = (fileId: string, error: Error) => {
    setPdfStates(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        error: 'Error al cargar el PDF. Intenta con otro archivo.'
      }
    }));
    console.error('Error loading PDF:', error);
  };

  const getPdfState = (fileId: string) => {
    return pdfStates[fileId] || { numPages: 0, pageNumber: 1, scale: 1.0, error: null };
  };

  const updatePdfState = (fileId: string, updates: Partial<typeof pdfStates[string]>) => {
    setPdfStates(prev => ({
      ...prev,
      [fileId]: { ...getPdfState(fileId), ...updates }
    }));
  };

  const goToPrevPage = (fileId: string) => {
    const state = getPdfState(fileId);
    updatePdfState(fileId, { pageNumber: Math.max(1, state.pageNumber - 1) });
  };

  const goToNextPage = (fileId: string) => {
    const state = getPdfState(fileId);
    updatePdfState(fileId, { pageNumber: Math.min(state.numPages, state.pageNumber + 1) });
  };

  const zoomIn = (fileId: string) => {
    const state = getPdfState(fileId);
    updatePdfState(fileId, { scale: Math.min(state.scale + 0.25, 3.0) });
  };

  const zoomOut = (fileId: string) => {
    const state = getPdfState(fileId);
    updatePdfState(fileId, { scale: Math.max(state.scale - 0.25, 0.5) });
  };


  const handleUploadCurriculum = async () => {
    if (files.length === 0) {
      setNotification({ message: 'Por favor, selecciona al menos un archivo PDF para subir.', type: 'error' });
      return;
    }

    setIsUploading(true);
    setNotification({ 
      message: files.length > 1 
        ? `Subiendo ${files.length} archivos PDF...` 
        : 'Subiendo currículum...', 
      type: 'success' 
    });

    const uploadFormData = new FormData();
    
    // Agregar convocatoriaId al FormData
    const convocatoriaId = localStorage.getItem('currentConvocatoriaId');
    if (convocatoriaId) {
      uploadFormData.append('convocatoriaId', convocatoriaId);
      console.log('Adding convocatoriaId to FormData:', convocatoriaId);
    }
    
    files.forEach((fileObj) => {
      console.log('Adding file to FormData:', {
        name: fileObj.name,
        size: fileObj.size,
        type: fileObj.type
      });
      uploadFormData.append(`curriculumFile`, fileObj.file, fileObj.name);
    });

    try {
      const headers: HeadersInit = {
        'ngrok-skip-browser-warning': 'true'
      };
      if (currentAuthToken) {
        headers['Authorization'] = `Bearer ${currentAuthToken}`;
        console.log('Using auth token for request');
      } else {
        console.warn('No auth token available');
      }

      console.log('Sending request to:', `${API_BASE_URL}/documentos/upload-curriculum`);
      console.log('Request headers:', headers);
      console.log('FormData files count:', files.length);

      const response = await fetch(`${API_BASE_URL}/documentos/upload-curriculum`, {
        method: 'POST',
        body: uploadFormData,
        headers: headers,
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        let errorData: any = null;
        try {
          errorData = contentType.includes('application/json') ? await response.json() : await response.text();
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorData = { message: 'Error desconocido al subir el currículum.' };
        }
        
        console.error('Server response error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        // Handle specific error cases
        if (response.status === 413) {
          throw new Error('El archivo es demasiado grande. Por favor, reduce el tamaño del archivo.');
        }
        
        if (response.status === 408) {
          throw new Error('La conexión se agotó. Por favor, intenta con un archivo más pequeño.');
        }
        
        if (response.status === 500) {
          const serverMsg = typeof errorData === 'string' ? errorData : (errorData?.message || 'Error interno del servidor');
          throw new Error(`Error del servidor: ${serverMsg}`);
        }
        
        if (response.status === 400) {
          const msg = typeof errorData === 'string' ? errorData : (errorData?.message || 'Datos inválidos');
          throw new Error(`Error de validación: ${msg}`);
        }
        
        const fallbackMsg = typeof errorData === 'string' ? errorData : (errorData?.message || response.statusText);
        throw new Error(`Error al subir el currículum: ${fallbackMsg}`);
      }

      const result = await response.json();
      console.log('✅ Currículum subido exitosamente:', result);
      setFiles([]); // Clear files after successful upload

      // Marcar la convocatoria aplicada para bloquear reingreso en la misma convocatoria
      const currentConvId = localStorage.getItem('currentConvocatoriaId');
      if (currentConvId) {
        localStorage.setItem('appliedConvId', currentConvId);
      }

      // Mostrar mensaje de éxito y redirigir a la sección de certificados
      setNotification({ 
        message: '✅ Currículum subido exitosamente! Redirigiendo a certificados...', 
        type: 'success' 
      });

      // Esperar un momento para que el usuario vea el mensaje antes de redirigir
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Llamar al callback de éxito que redirige a la sección de certificados
      // El certificado se generará automáticamente en el frontend cuando se abra la sección
      onUploadSuccess();
    } catch (error: any) {
      console.error('Error al subir el currículum:', error);
      setNotification({ message: `Error al subir el currículum: ${error.message}`, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-7xl mx-auto p-6", darkMode ? "bg-neutral-950" : "bg-slate-100")}>
      {/* Floating particles animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-15px) translateX(5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .float-animation { animation: float 6s ease-in-out infinite; }
        .pulse-animation { animation: pulse 3s ease-in-out infinite; }
        .slide-in { animation: slideIn 0.5s ease-out forwards; }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
        /* Estilos personalizados para react-pdf */
        .react-pdf__Page {
          display: flex !important;
          justify-content: center;
          align-items: flex-start;
          margin: 0 auto;
        }
        .react-pdf__Page__canvas {
          display: block !important;
          max-width: 100% !important;
          height: auto !important;
        }
        .react-pdf__Page__textContent {
          max-width: 100% !important;
        }
        .react-pdf__Page__annotations {
          max-width: 100% !important;
        }
        /* Estilos personalizados para el scrollbar */
        div::-webkit-scrollbar {
          width: 12px;
        }
        div::-webkit-scrollbar-track {
          background: ${darkMode ? '#1f2937' : '#f1f5f9'};
        }
        div::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#4f46e5' : '#3b82f6'};
          border-radius: 6px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#6366f1' : '#2563eb'};
        }
      `}</style>

      <div className="text-center mb-8 slide-in">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 relative inline-block">
          Sube tu Curriculum
          <Sparkles className={cn("inline-block w-8 h-8 absolute -top-2 -right-10 float-animation", darkMode ? "text-yellow-400" : "text-yellow-500")} />
        </h1>
        <p className={cn("text-lg", textSecondaryClasses)}>
          Arrastra tus archivos o haz clic para seleccionar
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-[1400px] mx-auto">
        {/* Upload Area */}
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative w-full min-h-96 border-2 border-dashed rounded-xl transition-all duration-500 cursor-pointer overflow-hidden",
              isDragging
                ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-2xl shadow-blue-200"
                : darkMode
                  ? "border-neutral-700 bg-neutral-900 hover:border-blue-400 hover:bg-neutral-800 hover:shadow-xl"
                  : "border-neutral-300 bg-white hover:border-blue-400 hover:bg-slate-50 hover:shadow-xl"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Animated background elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className={cn("absolute top-10 left-10 w-20 h-20 rounded-full opacity-20 pulse-animation", darkMode ? "bg-blue-300" : "bg-blue-200")}></div>
              <div className={cn("absolute bottom-10 right-10 w-32 h-32 rounded-full opacity-20 pulse-animation", darkMode ? "bg-indigo-300" : "bg-indigo-200")} style={{animationDelay: '1s'}}></div>
              <div className={cn("absolute top-1/2 left-1/4 w-16 h-16 rounded-full opacity-20 pulse-animation", darkMode ? "bg-purple-300" : "bg-purple-200")} style={{animationDelay: '2s'}}></div>
            </div>

            {/* Shimmer effect when dragging */}
            {isDragging && (
              <div className="absolute inset-0 shimmer pointer-events-none"></div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <div className={cn("mb-6 p-6 rounded-full transition-all duration-500", isDragging ? 'bg-blue-100 scale-125 rotate-12' : (darkMode ? "bg-neutral-800 hover:scale-110" : "bg-slate-100 hover:scale-110"))}>
                <Upload className={cn("w-12 h-12 transition-all duration-500", isDragging ? 'text-blue-600 animate-bounce' : (darkMode ? "text-blue-400" : "text-slate-400"))} />
              </div>

              <h3 className={cn("text-xl font-semibold mb-2 transition-all duration-300", darkMode ? "text-white" : "text-slate-700")}>
                {isDragging ? '¡Suelta los archivos aquí!' : 'Arrastra y suelta tus archivos PDF'}
              </h3>
              <p className={cn("mb-4", textSecondaryClasses)}>o</p>
              <button className="px-16 py-4 text-lg min-w-[300px] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 relative group">
                <span className="relative z-30 text-white font-bold drop-shadow-lg">Seleccionar Archivos PDF</span>
              </button>

              <div className={cn("mt-6 text-sm text-center", textSecondaryClasses)}>
                <p>Formato aceptado: PDF únicamente</p>
                <p>Tamaño máximo: 500MB por archivo</p>
                <p className={cn("mt-2 font-medium", darkMode ? "text-blue-400" : "text-blue-600")}>Puedes subir múltiples archivos PDF</p>
              </div>
            </div>

            {/* Animated Grid Background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="w-full h-full" style={{ // Adjusted for dark mode
                backgroundImage: darkMode ? 'radial-gradient(circle, #6366f1 1px, transparent 1px)' : 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}></div>
            </div>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className={cn("rounded-xl border p-4 shadow-lg slide-in hover:shadow-xl transition-shadow duration-300", darkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-slate-200")}>
              <h3 className={cn("font-semibold mb-3 flex items-center gap-2", textClasses)}>
                <File className={cn("w-5 h-5 animate-pulse", darkMode ? "text-blue-400" : "text-blue-600")} />
                Archivos subidos ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((fileObj, index) => (
                  <div
                    key={fileObj.id}
                    className={cn("flex items-center gap-3 p-3 rounded-lg transition-all duration-300 group transform hover:scale-[1.02] hover:shadow-md slide-in", darkMode ? "bg-neutral-800 hover:bg-gradient-to-r hover:from-blue-900/50 hover:to-indigo-900/50" : "bg-slate-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50")}
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className={cn("p-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-300", darkMode ? "bg-neutral-700" : "bg-white")}>
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium truncate text-sm", textClasses)}>
                        {fileObj.name}
                      </p>
                      <p className={cn("text-xs", textSecondaryClasses)}>
                        {formatFileSize(fileObj.size)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileObj.id);
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 hover:rotate-90"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className={cn("rounded-xl border shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300", darkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-slate-200")}>
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 relative overflow-hidden">
            <div className={cn("absolute inset-0 shimmer opacity-50", darkMode ? "" : "")}></div>
            <h3 className="font-semibold text-white flex items-center gap-2 relative z-10">
              <Eye className="w-5 h-5 animate-pulse" />
              Vista Previa
            </h3>
          </div>

          <div className="p-6">
            {files.length === 0 ? (
              <div className={cn("flex flex-col items-center justify-center h-96", textSecondaryClasses)}>
                <FileText className={cn("w-20 h-20 mb-4 opacity-20 float-animation", darkMode ? "text-slate-300" : "text-slate-400")} />
                <p className="text-center">
                  Sube un archivo para ver la vista previa
                </p>
              </div>
            ) : (
              <div className="space-y-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' as const, scrollbarWidth: 'auto' as const, scrollbarColor: darkMode ? '#4f46e5 #1f2937' : '#cbd5e1 #f1f5f9' }}>
                {files.map((fileObj, index) => (
                  <div key={fileObj.id} className={cn("border rounded-lg overflow-hidden hover:border-blue-300 transition-all duration-300 hover:shadow-lg slide-in", darkMode ? "border-neutral-700" : "border-slate-200")}
                       style={{animationDelay: `${index * 0.15}s`}}>
                    <div className={cn("p-3 border-b flex items-center justify-between", darkMode ? "bg-neutral-800 border-neutral-700" : "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200")}>
                      <p className={cn("font-medium text-sm truncate flex-1", textClasses)}>
                        {fileObj.name}
                      </p>
                      {fileObj.type === 'application/pdf' && (() => {
                        const state = getPdfState(fileObj.id);
                        return (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => zoomOut(fileObj.id)}
                              disabled={state.scale <= 0.5}
                              className={cn("px-2 py-1 rounded text-sm transition-colors", 
                                state.scale <= 0.5 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-100",
                                darkMode && "hover:bg-blue-900"
                              )}
                              title="Alejar"
                            >
                              <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className={cn("text-xs px-2 font-medium", textClasses)}>{Math.round(state.scale * 100)}%</span>
                            <button
                              onClick={() => zoomIn(fileObj.id)}
                              disabled={state.scale >= 3.0}
                              className={cn("px-2 py-1 rounded text-sm transition-colors",
                                state.scale >= 3.0 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-100",
                                darkMode && "hover:bg-blue-900"
                              )}
                              title="Acercar"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                    <div className={cn("p-4", darkMode ? "bg-neutral-800" : "bg-slate-50")}>
                      {fileObj.preview && (() => {
                          const state = getPdfState(fileObj.id);
                          return (
                            <>
                              <Document
                                file={fileObj.file}
                                onLoadSuccess={({ numPages }) => onDocumentLoadSuccess(fileObj.id, numPages)}
                                onLoadError={(error) => onDocumentLoadError(fileObj.id, error)}
                                loading={
                                  <div className={cn("flex flex-col items-center justify-center h-96", textSecondaryClasses)}>
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p>Cargando PDF...</p>
                                  </div>
                                }
                                error={
                                  <div className={cn("flex flex-col items-center justify-center h-96", textSecondaryClasses)}>
                                    <FileText className={cn("w-16 h-16 mb-2", darkMode ? "text-red-400" : "text-red-600")} />
                                    <p className="text-red-500">{state.error || 'Error al cargar el PDF'}</p>
                                    <p className="text-sm mt-2">Intenta con otro archivo PDF</p>
                                  </div>
                                }
                              >
                                <div className="space-y-2">
                                  <div className="relative border rounded overflow-hidden">
                                    <div className="flex justify-center items-center p-4 w-full">
                                      <Page 
                                        pageNumber={state.pageNumber} 
                                        scale={state.scale}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        className={cn("shadow-lg", darkMode ? "bg-white" : "")}
                                        width={900}
                                        loading={
                                          <div className={cn("flex flex-col items-center justify-center h-96", textSecondaryClasses)}>
                                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p>Cargando página...</p>
                                          </div>
                                        }
                                      />
                                    </div>
                                  </div>
                                  {state.numPages > 0 && (
                                    <div className={cn("p-2 flex items-center justify-between border-t", darkMode ? "bg-neutral-900 border-neutral-700" : "bg-white border-slate-200")}>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => goToPrevPage(fileObj.id)}
                                          disabled={state.pageNumber <= 1}
                                          className={cn("p-2 rounded transition-colors", state.pageNumber <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-100")}
                                        >
                                          <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className={cn("text-sm", textClasses)}>
                                          Página {state.pageNumber} de {state.numPages}
                                        </span>
                                        <button
                                          onClick={() => goToNextPage(fileObj.id)}
                                          disabled={state.pageNumber >= state.numPages}
                                          className={cn("p-2 rounded transition-colors", state.pageNumber >= state.numPages ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-100")}
                                        >
                                          <ChevronRight className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          min="1"
                                          max={state.numPages}
                                          value={state.pageNumber}
                                          onChange={(e) => {
                                            const page = Math.max(1, Math.min(state.numPages, parseInt(e.target.value) || 1));
                                            updatePdfState(fileObj.id, { pageNumber: page });
                                          }}
                                          className={cn("w-16 px-2 py-1 rounded border text-sm text-center", darkMode ? "bg-neutral-800 border-neutral-700 text-white" : "bg-white border-slate-300")}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </Document>
                            </>
                          );
                        })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handleUploadCurriculum}
            disabled={isUploading}
            className={cn(
              "w-full px-6 py-3 text-white rounded-lg font-medium transition-all duration-300 transform relative overflow-hidden group",
              isUploading
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:scale-105 hover:-translate-y-1"
            )}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isUploading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isUploading ? 'Subiendo...' : 'Subir Currículum'}
            </span>
            {!isUploading && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
        </div>
      )}

      {/* Notification Component */}
      {notification && (
        <Notification
          message={notification?.message || ''}
          type={notification?.type || 'success'}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default CurriculumSection;