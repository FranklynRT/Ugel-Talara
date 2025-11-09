import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  TriangleAlert,
  CircleCheck,
  ChevronDown,
  CreditCard,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import TextType from "@/components/TextType"; // Asumo que TextType está correctamente tipado en su propio archivo
import { AnexosSection } from "@/pages/postulante/AnexosSection";
import { API_BASE_URL } from '@/lib/api'; // Import API_BASE_URL
// Importar imágenes del carrusel
import carousel1 from "@/imagenes/carousel-1.jpg";
import carousel2 from "@/imagenes/carousel-2.jpg";
import carousel3 from "@/imagenes/carousel-3.jpg";
import carousel4 from "@/imagenes/carousel-4.jpg";

// --- Interfaces para Tipado ---

interface CarouselImage {
  url: string;
  title: string;
  subtitle: string;
}

interface FormDataState {
  nombreCompleto: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  password: string;
  confirmPassword: string;
}

// Interfaz para la respuesta esperada de la API (ajustar si es necesario)
interface ApiResponse {
  error?: string;
  token?: string;
  user?: any;
  // ...otros campos de éxito si existen
}

const ModernRegister: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Registro básico, 2: Anexos, 3: Resumen
  const [currentAnexoSection, setCurrentAnexoSection] = useState<number>(0); // Índice de la sección actual de anexos
  const [sectionValidationError, setSectionValidationError] = useState<string>(""); // Mensaje de error de validación
  const [missingFieldsList, setMissingFieldsList] = useState<string[]>([]); // Lista completa de campos faltantes
  const [validationErrors, setValidationErrors] = useState<{ [fieldName: string]: boolean }>({}); // Errores por campo
  const [isSavingSection, setIsSavingSection] = useState<boolean>(false); // Estado de guardado
  const [hasAttemptedValidation, setHasAttemptedValidation] = useState<boolean>(false); // Si el usuario intentó avanzar
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormDataState>({
    nombreCompleto: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    correo: "",
    tipoDocumento: "",
    numeroDocumento: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [aceptaTerminos, setAceptaTerminos] = useState<boolean>(false);
  const [showTipoDocumentoDropdown, setShowTipoDocumentoDropdown] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const tiposDocumento = [
    { value: "dni", label: "DNI", digitos: 8 },
    { value: "pasaporte", label: "Pasaporte", digitos: 9 },
    { value: "carnet_extranjeria", label: "Carnet de Extranjería", digitos: 12 },
  ];

  const tipoDocumentoSeleccionado = tiposDocumento.find(
    (doc) => doc.value === formData.tipoDocumento
  );

  // Imágenes del carrusel - Las imágenes están en src/imagenes/
  const carouselImages: CarouselImage[] = [
    {
      url: carousel1,
      title: "Sistema de Gestión Educativa",
      subtitle: "Innovación que transforma realidades",
    },
    {
      url: carousel2,
      title: "UGEL Talara",
      subtitle: "Compromiso con la educación",
    },
    {
      url: carousel3,
      title: "Vela por el buen servicio de la calidad educativa.",
      subtitle: "Cambio y la Mejora de la Educación",
    },
    {
      url: carousel4,
      title: "Experiencia Laboral",
      subtitle: "Diseño que marca la diferencia",
    },
  ];

  // Carrusel automático
  useEffect(() => {
    const timer: NodeJS.Timeout = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  // Cargar token cuando se cambia al paso 2
  useEffect(() => {
    if (currentStep === 2) {
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
      }
    }
  }, [currentStep]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-documento')) {
        setShowTipoDocumentoDropdown(false);
      }
    };

    if (showTipoDocumentoDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTipoDocumentoDropdown]);

  const nextSlide = (): void =>
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  const prevSlide = (): void =>
    setCurrentSlide(
      (prev) => (prev - 1 + carouselImages.length) % carouselImages.length
    );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTipoDocumentoChange = (tipo: string): void => {
    setFormData({ ...formData, tipoDocumento: tipo, numeroDocumento: "" });
    setShowTipoDocumentoDropdown(false);
  };

  const handleSubmit = async (): Promise<void> => {
    setErrorMessage("");
    setSuccessMessage("");

    // Validar que todos los campos estén completos y mostrar cuáles faltan
    const camposFaltantes: string[] = [];
    
    if (!formData.nombreCompleto) camposFaltantes.push("Nombre completo");
    if (!formData.apellidoPaterno) camposFaltantes.push("Apellido paterno");
    if (!formData.apellidoMaterno) camposFaltantes.push("Apellido materno");
    if (!formData.correo) camposFaltantes.push("Correo electrónico");
    if (!formData.tipoDocumento) camposFaltantes.push("Tipo de documento");
    if (!formData.numeroDocumento) camposFaltantes.push("Número de documento");
    if (!formData.telefono) camposFaltantes.push("Teléfono");
    if (!formData.password) camposFaltantes.push("Contraseña");
    if (!formData.confirmPassword) camposFaltantes.push("Confirmar contraseña");
    
    if (camposFaltantes.length > 0) {
      setErrorMessage(`Por favor, completa los siguientes campos: ${camposFaltantes.join(", ")}`);
      return;
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      setErrorMessage("Ingresa un correo electrónico válido");
      return;
    }

    // Validar que se acepten los términos y condiciones
    if (!aceptaTerminos) {
      setErrorMessage("Debes aceptar los términos y condiciones para continuar");
      return;
    }
    
    // Validar formato del documento según el tipo seleccionado
    const tipoDoc = tiposDocumento.find((doc) => doc.value === formData.tipoDocumento);
    if (!tipoDoc) {
      setErrorMessage("Selecciona un tipo de documento válido");
      return;
    }

    const regex = new RegExp(`^\\d{${tipoDoc.digitos}}$`);
    if (!regex.test(formData.numeroDocumento)) {
      setErrorMessage(
        `El ${tipoDoc.label} debe tener exactamente ${tipoDoc.digitos} dígitos`
      );
      return;
    }

    // Validar formato de teléfono (9 dígitos para números peruanos)
    if (!/^\d{9}$/.test(formData.telefono)) {
      setErrorMessage("El teléfono debe tener 9 dígitos");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden");
      return;
    }

    try {
      // Usar API_BASE_URL importado en lugar de URL hardcodeada
      const res: Response = await fetch(
        `${API_BASE_URL}/register`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-API-Key": "UGEL_TALARA_REGISTRATION_KEY", // Token de seguridad para registro
            "ngrok-skip-browser-warning": "true"
          },
            body: JSON.stringify({
            nombreCompleto: formData.nombreCompleto,
            apellidoPaterno: formData.apellidoPaterno,
            apellidoMaterno: formData.apellidoMaterno,
            correo: formData.correo,
            tipoDocumento: formData.tipoDocumento,
            dni: formData.numeroDocumento, // Mantener 'dni' en el backend para compatibilidad
            contrasena: formData.password,
            telefono: formData.telefono,
            rol: 'postulante', // Siempre registrar como postulante
          }),
        }
      );

      const data: ApiResponse = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Error en el registro");
        return;
      }

      // Si el registro es exitoso y viene con token, guardarlo y continuar
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        // Cambiar a paso 2: Formularios de anexos
        setCurrentStep(2);
        setSuccessMessage("Registro exitoso. Ahora completa tus datos personales.");
      } else {
        // Si no hay token, intentar iniciar sesión automáticamente
        try {
          const loginRes = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({
              correo: formData.correo,
              contrasena: formData.password,
            }),
          });
          
          const loginData = await loginRes.json();
          if (loginRes.ok && loginData.token) {
            localStorage.setItem('token', loginData.token);
            if (loginData.user) {
              localStorage.setItem('user', JSON.stringify(loginData.user));
            }
            setCurrentStep(2);
            setSuccessMessage("Registro exitoso. Ahora completa tus datos personales.");
          } else {
            setSuccessMessage("Registro exitoso. Por favor inicia sesión.");
          }
        } catch (loginErr) {
          setSuccessMessage("Registro exitoso. Por favor inicia sesión.");
        }
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setErrorMessage(`Error al conectar con la API: ${err.message}`);
      } else {
        setErrorMessage("Error desconocido al conectar con la API");
      }
    }
  };

  // Definir las secciones de anexos
  const anexoSections = [
    { id: 'datos-personales', title: 'Datos Personales', step: 1 },
    { id: 'colegio-profesional', title: 'Colegio Profesional', step: 2 },
    { id: 'formacion-academica', title: 'Formación Académica', step: 3 },
    { id: 'idiomas', title: 'Idiomas y/o Dialecto', step: 4 },
    { id: 'ofimatica', title: 'Conocimientos de Ofimática', step: 5 },
    { id: 'especializacion', title: 'Estudios de Especialización', step: 6 },
    { id: 'experiencia', title: 'Experiencia Laboral', step: 7 },
    { id: 'declaraciones', title: 'Declaración Jurada', step: 8 },
  ];

  const totalAnexoSections = anexoSections.length;

  // Función para validar la sección actual
  const validateCurrentSection = (formData: any): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];
    
    switch (currentAnexoSection) {
      case 0: // Datos Personales
        const pd = formData?.personalData || {};
        if (!pd.tipoDocumento) missingFields.push("Tipo de Documento");
        if (pd.tipoDocumento === 'DNI' && !pd.dni?.trim()) missingFields.push("N° DNI");
        if (pd.tipoDocumento === 'CARNET DE EXTRANJERÍA' && !pd.carnetExtranjeria?.trim()) missingFields.push("N° Carnet de Extranjería");
        if (!pd.apellidoPaterno?.trim()) missingFields.push("Apellido Paterno");
        if (!pd.apellidoMaterno?.trim()) missingFields.push("Apellido Materno");
        if (!pd.nombres?.trim()) missingFields.push("Nombres");
        if (!pd.genero) missingFields.push("Género");
        if (!pd.fechaNacimiento?.trim()) missingFields.push("Fecha de Nacimiento");
        if (!pd.lugarNacimientoDepartamentoId) missingFields.push("Departamento (Lugar de Nacimiento)");
        if (!pd.lugarNacimientoProvinciaId) missingFields.push("Provincia (Lugar de Nacimiento)");
        if (!pd.lugarNacimientoDistritoId) missingFields.push("Distrito (Lugar de Nacimiento)");
        if (!pd.direccion?.trim()) missingFields.push("Dirección Completa");
        if (!pd.correoElectronico?.trim()) missingFields.push("Correo Electrónico");
        if (!pd.telefonoCelular1?.trim()) missingFields.push("Teléfono Celular 1");
        if (!pd.tiempoSectorPublico?.trim()) missingFields.push("Tiempo de Experiencia en el Sector Público");
        if (!pd.tiempoSectorPrivado?.trim()) missingFields.push("Tiempo de Experiencia en el Sector Privado");
        if (pd.conadis === 'SI' && !pd.nCarnetConadis?.trim()) missingFields.push("N° Carnet CONADIS");
        if (pd.conadis === 'SI' && !pd.codigoConadis?.trim()) missingFields.push("Código CONADIS");
        if (pd.fuerzasArmadas === 'SI' && !pd.nCarnetFuerzasArmadas?.trim()) missingFields.push("N° Carnet FFAA");
        if (pd.fuerzasArmadas === 'SI' && !pd.codigoFuerzasArmadas?.trim()) missingFields.push("Código FFAA");
        break;
        
      case 1: // Colegio Profesional
        if (formData?.personalData?.colegioProfesionalHabilitado === 'SI') {
          if (!formData?.personalData?.colegioProfesional?.trim()) missingFields.push("Nombre del Colegio Profesional");
          if (!formData?.personalData?.nColegiatura?.trim()) missingFields.push("N° de Colegiatura");
          if (!formData?.personalData?.fechaVencimientoColegiatura?.trim()) missingFields.push("Fecha de Vencimiento de Colegiatura");
        }
        break;
        
      case 2: // Formación Académica
        if (!formData?.academicFormation || formData.academicFormation.length === 0) {
          missingFields.push("Al menos un registro de Formación Académica");
        } else {
          formData.academicFormation.forEach((item: any, index: number) => {
            if (!item.nivelEducativo?.trim()) missingFields.push(`Formación ${index + 1}: Nivel Educativo`);
            if (item.nivelEducativo === 'OTROS (ESPECIFICAR)' && !item.otrosNivelEspecificar?.trim()) {
              missingFields.push(`Formación ${index + 1}: Especifique el nivel educativo`);
            }
            if (!item.gradoAcademico?.trim()) missingFields.push(`Formación ${index + 1}: Grado Académico`);
            if (!item.nombreCarrera?.trim()) missingFields.push(`Formación ${index + 1}: Nombre de la Carrera`);
            if (!item.institucion?.trim()) missingFields.push(`Formación ${index + 1}: Institución`);
          });
        }
        break;
        
      case 3: // Idiomas y/o Dialecto
        if (!formData?.languageSkills || formData.languageSkills.length === 0) {
          missingFields.push("Al menos un Idioma o Dialecto");
        } else {
          formData.languageSkills.forEach((item: any, index: number) => {
            if (!item.idiomaDialecto?.trim()) missingFields.push(`Idioma ${index + 1}: Idioma/Dialecto`);
            if (!item.nivel?.trim()) missingFields.push(`Idioma ${index + 1}: Nivel`);
          });
        }
        break;
        
      case 4: // Conocimientos de Ofimática
        if (!formData?.officeSkills || formData.officeSkills.length === 0) {
          missingFields.push("Al menos un Conocimiento de Ofimática");
        } else {
          formData.officeSkills.forEach((item: any, index: number) => {
            if (!item.materia?.trim()) missingFields.push(`Ofimática ${index + 1}: Materia`);
            if (!item.nivel?.trim()) missingFields.push(`Ofimática ${index + 1}: Nivel`);
          });
        }
        break;
        
      case 5: // Estudios de Especialización
        if (!formData?.specializationStudies || formData.specializationStudies.length === 0) {
          missingFields.push("Al menos un Estudio de Especialización");
        } else {
          formData.specializationStudies.forEach((item: any, index: number) => {
            if (!item.tipoEstudio?.trim()) missingFields.push(`Especialización ${index + 1}: Tipo de Estudio`);
            if (!item.nombreEstudio?.trim()) missingFields.push(`Especialización ${index + 1}: Nombre del Estudio`);
            if (!item.centroEstudio?.trim()) missingFields.push(`Especialización ${index + 1}: Centro de Estudio`);
          });
        }
        break;
        
      case 6: // Experiencia Laboral
        if (!formData?.workExperience || formData.workExperience.length === 0) {
          missingFields.push("Al menos una Experiencia Laboral");
        } else {
          formData.workExperience.forEach((item: any, index: number) => {
            if (!item.empresaInstitucion?.trim()) missingFields.push(`Experiencia ${index + 1}: Empresa/Institución`);
            if (!item.sectorGiroNegocio?.trim()) missingFields.push(`Experiencia ${index + 1}: Sector/Giro del Negocio`);
            if (!item.puestoCargo?.trim()) missingFields.push(`Experiencia ${index + 1}: Puesto/Cargo`);
            if (!item.periodoDesde?.trim()) missingFields.push(`Experiencia ${index + 1}: Periodo Desde`);
            if (!item.periodoHasta?.trim()) missingFields.push(`Experiencia ${index + 1}: Periodo Hasta`);
          });
        }
        break;
        
      case 7: // Declaración Jurada
        const decl = formData?.declarations || {};
        if (!decl.datosConsignadosVerdaderos) missingFields.push("Declaración: Datos consignados verdaderos");
        if (!decl.leyProteccionDatos) missingFields.push("Declaración: Ley de Protección de Datos");
        if (!decl.infoVerdadera) missingFields.push("Declaración: Información verdadera");
        if (!decl.plenosDerechosCiviles) missingFields.push("Declaración: Plenos derechos civiles");
        if (!decl.cumploRequisitosMinimos) missingFields.push("Declaración: Cumplo requisitos mínimos");
        if (!decl.noCondenaDolosa) missingFields.push("Declaración: No condena dolosa");
        if (!decl.noInhabilitacion) missingFields.push("Declaración: No inhabilitación");
        if (!decl.noSentenciaCondenatoria) missingFields.push("Declaración: No sentencia condenatoria");
        if (!decl.noAntecedentesPenales) missingFields.push("Declaración: No antecedentes penales");
        if (!decl.noAntecedentesPoliciales) missingFields.push("Declaración: No antecedentes policiales");
        if (!decl.noAntecedentesJudiciales) missingFields.push("Declaración: No antecedentes judiciales");
        if (decl.tieneParientesUGEL === 'NO' && !decl.noParientesUGEL) {
          missingFields.push("Declaración: Confirmación de no parientes en UGEL");
        }
        if (decl.tieneParientesUGEL === 'SI' && (!formData?.relativesInUGEL || formData.relativesInUGEL.length === 0)) {
          missingFields.push("Datos de parientes en UGEL (si marcó que tiene parientes)");
        }
        break;
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  // Función para guardar el anexo completo al finalizar el registro
  const saveAnexoCompleto = async (): Promise<void> => {
    try {
      setIsSavingSection(true);
      console.log('🔄 Iniciando guardado de anexo completo...');
      
      const formData = (window as any).__getAnexosFormData?.();
      
      if (!formData) {
        console.error('❌ No se pudieron obtener los datos del formulario');
        setErrorMessage('Error: No se pudieron obtener los datos del formulario. Por favor, recargue la página.');
        setIsSavingSection(false);
        return;
      }

      console.log('📋 Datos obtenidos del formulario:', {
        personalData: formData.personalData ? '✅' : '❌',
        academicFormation: formData.academicFormation?.length || 0,
        languageSkills: formData.languageSkills?.length || 0,
        officeSkills: formData.officeSkills?.length || 0,
        specializationStudies: formData.specializationStudies?.length || 0,
        workExperience: formData.workExperience?.length || 0,
        laborReferences: formData.laborReferences?.length || 0,
        relativesInUGEL: formData.relativesInUGEL?.length || 0,
      });

      const token = authToken || localStorage.getItem('token');
      if (!token) {
        console.error('❌ No hay token de autenticación');
        setErrorMessage('Error: No hay sesión activa. Por favor, inicie sesión nuevamente.');
        setIsSavingSection(false);
        return;
      }

      // Preparar los datos para enviar
      const dataToSend = JSON.parse(JSON.stringify(formData));
      
      // Asegurar que personalData existe
      if (!dataToSend.personalData) {
        dataToSend.personalData = {};
      }
      
      // Asegurar que codigo y nombrePuesto sean null si no están definidos (registro sin convocatoria)
      if (!dataToSend.personalData.codigo || (typeof dataToSend.personalData.codigo === 'string' && dataToSend.personalData.codigo.trim() === '')) {
        dataToSend.personalData.codigo = null;
      }
      if (!dataToSend.personalData.nombrePuesto || (typeof dataToSend.personalData.nombrePuesto === 'string' && dataToSend.personalData.nombrePuesto.trim() === '')) {
        dataToSend.personalData.nombrePuesto = null;
      }
      if (!dataToSend.personalData.numeroCas || (typeof dataToSend.personalData.numeroCas === 'string' && dataToSend.personalData.numeroCas.trim() === '')) {
        dataToSend.personalData.numeroCas = null;
      }
      
      // Asegurar que todos los arrays existan y sean arrays válidos
      // Esto garantiza que todos los datos se guarden automáticamente en el backend
      if (!Array.isArray(dataToSend.academicFormation)) {
        dataToSend.academicFormation = [];
      }
      if (!Array.isArray(dataToSend.languageSkills)) {
        dataToSend.languageSkills = [];
      }
      if (!Array.isArray(dataToSend.officeSkills)) {
        dataToSend.officeSkills = [];
      }
      if (!Array.isArray(dataToSend.specializationStudies)) {
        dataToSend.specializationStudies = [];
      }
      if (!Array.isArray(dataToSend.workExperience)) {
        dataToSend.workExperience = [];
      }
      if (!Array.isArray(dataToSend.laborReferences)) {
        dataToSend.laborReferences = [];
      }
      if (!Array.isArray(dataToSend.relativesInUGEL)) {
        dataToSend.relativesInUGEL = [];
      }
      
      // Asegurar que declarations existe
      if (!dataToSend.declarations) {
        dataToSend.declarations = {};
      }
      
      console.log('📋 Datos preparados para enviar (después de inicialización):', {
        personalData: dataToSend.personalData ? '✅' : '❌',
        academicFormation: Array.isArray(dataToSend.academicFormation) ? dataToSend.academicFormation.length : '❌',
        languageSkills: Array.isArray(dataToSend.languageSkills) ? dataToSend.languageSkills.length : '❌',
        officeSkills: Array.isArray(dataToSend.officeSkills) ? dataToSend.officeSkills.length : '❌',
        specializationStudies: Array.isArray(dataToSend.specializationStudies) ? dataToSend.specializationStudies.length : '❌',
        workExperience: Array.isArray(dataToSend.workExperience) ? dataToSend.workExperience.length : '❌',
        laborReferences: Array.isArray(dataToSend.laborReferences) ? dataToSend.laborReferences.length : '❌',
        relativesInUGEL: Array.isArray(dataToSend.relativesInUGEL) ? dataToSend.relativesInUGEL.length : '❌',
        declarations: dataToSend.declarations ? '✅' : '❌',
      });
      
      // Aplicar formato de fechas
      const formatDateForBackend = (dateString: string): string => {
        if (!dateString) return '';
        // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }
        // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
          const [day, month, year] = dateString.split('/');
          return `${year}-${month}-${day}`;
        }
        return dateString;
      };

      if (dataToSend.personalData?.fechaNacimiento) {
        dataToSend.personalData.fechaNacimiento = formatDateForBackend(dataToSend.personalData.fechaNacimiento);
      }
      if (dataToSend.personalData?.fechaVencimientoColegiatura) {
        dataToSend.personalData.fechaVencimientoColegiatura = formatDateForBackend(dataToSend.personalData.fechaVencimientoColegiatura);
      }
      if (dataToSend.personalData?.tiempoSectorPublico) {
        dataToSend.personalData.tiempoSectorPublico = formatDateForBackend(dataToSend.personalData.tiempoSectorPublico);
      }
      if (dataToSend.personalData?.tiempoSectorPrivado) {
        dataToSend.personalData.tiempoSectorPrivado = formatDateForBackend(dataToSend.personalData.tiempoSectorPrivado);
      }

      // Preparar FormData para upload
      const uploadFormData = new FormData();
      uploadFormData.append('formDataJson', JSON.stringify(dataToSend));
      
      console.log('📤 Enviando datos al servidor...');
      const response = await fetch(`${API_BASE_URL}/documentos/upload-anexo`, {
        method: 'POST',
        body: uploadFormData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Error desconocido al guardar', details: errorText };
        }
        console.error('❌ Error del servidor:', errorData);
        console.error('❌ Status:', response.status, response.statusText);
        console.error('❌ Response text completo:', errorText);
        console.error('❌ Error SQL:', errorData.sqlError);
        console.error('❌ Error SQL Code:', errorData.sqlCode);
        
        // Crear mensaje de error más detallado
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        if (errorData.details) {
          errorMessage = errorData.details;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.sqlError) {
          errorMessage += ` (SQL: ${errorData.sqlError})`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Anexo guardado exitosamente durante el registro:', result);
      
      // Mostrar información detallada de lo que se guardó
      if (result.savedData) {
        console.log('📊 Resumen de datos guardados:', result.savedData);
        const savedCounts = {
          personalData: result.savedData.personalData ? 1 : 0,
          academicFormation: result.savedData.academicFormation || 0,
          languageSkills: result.savedData.languageSkills || 0,
          officeSkills: result.savedData.officeSkills || 0,
          specializationStudies: result.savedData.specializationStudies || 0,
          workExperience: result.savedData.workExperience || 0,
          laborReferences: result.savedData.laborReferences || 0,
          relativesInUGEL: result.savedData.relativesInUGEL || 0,
          declarations: result.savedData.declarations ? 1 : 0,
        };
        const totalItems = Object.values(savedCounts).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
        console.log(`✅ Total de secciones guardadas: ${totalItems} items`);
      }
      
      // Limpiar borrador si existe
      try {
        await fetch(`${API_BASE_URL}/documentos/anexos/draft?convocatoriaId=`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
        });
        console.log('✅ Borrador eliminado después de guardar anexo');
      } catch (error) {
        console.warn('⚠️ No se pudo limpiar el borrador:', error);
      }

      setSuccessMessage('¡Anexo guardado exitosamente! Tus datos están seguros.');
      setIsSavingSection(false);
    } catch (error: any) {
      console.error('❌ Error al guardar anexo durante el registro:', error);
      setErrorMessage(error?.message || 'Error al guardar los datos. Por favor, intente nuevamente.');
      setIsSavingSection(false);
      // No bloquear el flujo, pero mostrar el error
    }
  };

  // Función para validar y guardar la sección actual antes de avanzar
  const validateAndSaveSection = async (): Promise<boolean> => {
    setSectionValidationError("");
    setIsSavingSection(true);

    try {
      // Obtener los datos del formulario desde el componente hijo
      const formData = (window as any).__getAnexosFormData?.();
      
      if (!formData) {
        setSectionValidationError("No se pudieron obtener los datos del formulario. Por favor, recargue la página.");
        setIsSavingSection(false);
        return false;
      }
      
      // Validar la sección actual
      const validation = validateCurrentSection(formData);
      
      // Marcar que el usuario intentó validar
      setHasAttemptedValidation(true);
      
      if (!validation.isValid) {
        // Guardar la lista completa de campos faltantes
        setMissingFieldsList(validation.missingFields);
        
        // Crear objeto de errores por campo para pasar a AnexosSection
        const errorsMap: { [fieldName: string]: boolean } = {};
        validation.missingFields.forEach(fieldName => {
          errorsMap[fieldName] = true;
        });
        setValidationErrors(errorsMap);
        
        // Formatear la lista de campos faltantes de manera más legible
        const totalFields = validation.missingFields.length;
        let fieldsList = "";
        
        if (totalFields === 1) {
          fieldsList = validation.missingFields[0];
        } else if (totalFields <= 5) {
          fieldsList = validation.missingFields.join(", ");
        } else {
          fieldsList = validation.missingFields.slice(0, 5).join(", ") + ` y ${totalFields - 5} campo(s) más`;
        }
        
        setSectionValidationError(
          `Debe completar ${totalFields} campo(s) antes de continuar: ${fieldsList}`
        );
        
        setIsSavingSection(false);
        return false;
      }
      
      // Limpiar la lista de campos faltantes y errores si la validación es exitosa
      setMissingFieldsList([]);
      setValidationErrors({});
      setSectionValidationError(""); // Limpiar también el mensaje de error
      setHasAttemptedValidation(false); // Resetear el flag de intento de validación
      
      // Esperar un momento para que se guarden los datos actuales
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsSavingSection(false);
      return true;
    } catch (error) {
      console.error('Error al validar sección:', error);
      setSectionValidationError("Error al validar los datos. Por favor, intente nuevamente.");
      setIsSavingSection(false);
      return false;
    }
  };

  // Si estamos en el paso 2 (Anexos), mostrar interfaz paso a paso con una sección a la vez
  if (currentStep === 2 && authToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Mensaje de validación - PRIMERO, ARRIBA DE TODO */}
          {sectionValidationError && hasAttemptedValidation && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 section-validation-error bg-white border-2 border-red-400 rounded-lg p-4 shadow-lg relative z-10 sticky top-4"
              id="validation-error-message"
            >
              <div className="flex items-start gap-3">
                <div className="bg-red-500 rounded-full p-2 flex-shrink-0">
                  <TriangleAlert className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-900 mb-2 text-lg">
                    ⚠️ Advertencia: Campos incompletos
                  </p>
                  <p className="text-sm text-red-800 leading-relaxed font-medium mb-2">
                    {sectionValidationError}
                  </p>
                  {missingFieldsList.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-xs text-red-700 font-semibold mb-1">
                        📋 Campos faltantes ({missingFieldsList.length}):
                      </p>
                      <div className="bg-white rounded p-2 max-h-32 overflow-y-auto border border-red-200">
                        <ul className="text-xs text-red-800 list-disc list-inside space-y-0.5">
                          {missingFieldsList.map((field, index) => (
                            <li key={index}>{field}</li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-xs text-red-700 mt-2 italic">
                        Complete los campos y vuelva a intentar avanzar.
                      </p>
                    </div>
                  )}
                </div>
                {/* Botón para cerrar el mensaje */}
                <button
                  onClick={() => {
                    setSectionValidationError("");
                    setHasAttemptedValidation(false);
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Cerrar advertencia"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Header con navegación */}
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setCurrentAnexoSection(0);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={18} />
                Volver
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-blue-900">
                  Paso 2: Completa tus datos personales
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Sección {currentAnexoSection + 1} de {totalAnexoSections}
                </p>
              </div>
              <div className="w-24"></div> {/* Spacer para centrar */}
            </div>

            {/* Barra de progreso mejorada */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {anexoSections[currentAnexoSection]?.title}
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {Math.round(((currentAnexoSection + 1) / totalAnexoSections) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${((currentAnexoSection + 1) / totalAnexoSections) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Indicadores de pasos */}
            <div className="relative flex items-center justify-between mt-6">
              {/* Línea de conexión */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0" style={{ margin: '0 20px' }}></div>
              <div
                className="absolute top-5 left-0 h-0.5 bg-green-500 -z-0 transition-all duration-500"
                style={{
                  width: `${(currentAnexoSection / (totalAnexoSections - 1)) * 100}%`,
                  margin: '0 20px'
                }}
              ></div>
              
              {anexoSections.map((section, index) => (
                <div
                  key={section.id}
                  className="flex-1 flex flex-col items-center relative z-10"
                >
                  <button
                    onClick={() => {
                      if (index <= currentAnexoSection) {
                        setCurrentAnexoSection(index);
                        setSectionValidationError("");
                        setMissingFieldsList([]);
                        setValidationErrors({});
                        setHasAttemptedValidation(false); // Resetear al cambiar de sección
                        // Scroll suave solo si es necesario, sin interrumpir al usuario
                        setTimeout(() => {
                          const formSection = document.querySelector('.anexos-form-container');
                          if (formSection) {
                            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }
                    }}
                    disabled={index > currentAnexoSection}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      index === currentAnexoSection
                        ? 'bg-blue-600 text-white shadow-lg scale-110 cursor-pointer'
                        : index < currentAnexoSection
                        ? 'bg-green-500 text-white shadow-md hover:scale-105 cursor-pointer'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {index < currentAnexoSection ? (
                      <CheckCircle size={18} className="text-white" />
                    ) : (
                      index + 1
                    )}
                  </button>
                  <span
                    className={`text-xs mt-2 text-center max-w-[80px] line-clamp-2 ${
                      index === currentAnexoSection
                        ? 'font-bold text-blue-600'
                        : index < currentAnexoSection
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {section.title}
                  </span>
                </div>
              ))}
            </div>
          </div>


          {/* Mensaje informativo */}
          <div className="mb-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CircleCheck className="text-blue-600 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-blue-900 mb-2 text-lg">
                  ⚠️ Complete todos los datos de esta sección antes de continuar
                </p>
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Importante:</strong> Todos los datos se guardan automáticamente en la base de datos mientras completa el formulario. 
                  Cada sección se guarda en su respectiva tabla en la base de datos.
                </p>
                <div className="bg-white rounded p-3 mt-2 border border-blue-200">
                  <p className="text-xs text-blue-900 font-semibold mb-1">📋 Campos obligatorios de esta sección:</p>
                  <p className="text-xs text-blue-700">
                    {currentAnexoSection === 0 && "DNI, Apellidos, Nombres, Fecha de Nacimiento, Dirección, Teléfono y Correo electrónico"}
                    {currentAnexoSection === 1 && "Estado de habilitación del Colegio Profesional"}
                    {currentAnexoSection === 2 && "Al menos un registro de Formación Académica (Nivel Educativo, Carrera, Institución)"}
                    {currentAnexoSection === 3 && "Al menos un Idioma o Dialecto con su nivel"}
                    {currentAnexoSection === 4 && "Al menos un Conocimiento de Ofimática con su nivel"}
                    {currentAnexoSection === 5 && "Al menos un Estudio de Especialización"}
                    {currentAnexoSection === 6 && "Al menos una Experiencia Laboral"}
                    {currentAnexoSection === 7 && "Todas las declaraciones juradas deben estar aceptadas"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenedor de la sección actual */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 min-h-[500px] anexos-form-container">
            <div className="p-8">
              <AnexosSection
                convocatoriaSeleccionada={null}
                navigate={(_section: string, options?: { state?: any }) => {
                  if (options?.state?.anexosCompletados) {
                    setCurrentStep(3);
                  }
                }}
                authToken={authToken}
                darkMode={false}
                textClasses="text-blue-950 font-semibold"
                textSecondaryClasses="text-blue-900 font-medium"
                currentSectionIndex={currentAnexoSection}
                showOnlyCurrentSection={true}
                showCompletedAnexos={false}
                onSectionSave={async () => {
                  // Guardar automáticamente cuando se completa una sección
                  await validateAndSaveSection();
                }}
                getFormData={() => {
                  // Exponer función para obtener datos del formulario
                  return (window as any).__getAnexosFormData?.();
                }}
                validationErrors={validationErrors}
              />
              {/* Exponer función para limpiar errores cuando el usuario completa campos */}
              {(() => {
                // Función para limpiar errores de validación específicos cuando el usuario completa campos
                (window as any).__clearValidationErrors = (fieldNames: string[]) => {
                  setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    fieldNames.forEach(fieldName => {
                      delete newErrors[fieldName];
                    });
                    
                    // Si no quedan errores, limpiar también el mensaje
                    if (Object.keys(newErrors).length === 0) {
                      setSectionValidationError("");
                      setMissingFieldsList([]);
                      setHasAttemptedValidation(false); // Resetear el flag cuando todos los campos están completos
                    } else if (hasAttemptedValidation) {
                      // Solo actualizar el mensaje si el usuario ya intentó avanzar
                      // Actualizar el mensaje de error con los campos que aún faltan
                      const totalFields = Object.keys(newErrors).length;
                      let fieldsList = "";
                      
                      if (totalFields === 1) {
                        fieldsList = Object.keys(newErrors)[0];
                      } else if (totalFields <= 5) {
                        fieldsList = Object.keys(newErrors).join(", ");
                      } else {
                        fieldsList = Object.keys(newErrors).slice(0, 5).join(", ") + ` y ${totalFields - 5} campo(s) más`;
                      }
                      
                      setSectionValidationError(
                        `Debe completar ${totalFields} campo(s) antes de continuar: ${fieldsList}`
                      );
                      setMissingFieldsList(Object.keys(newErrors));
                    }
                    
                    return newErrors;
                  });
                };
                
                // Función para limpiar el mensaje de error completo cuando todos los campos están completos
                (window as any).__clearValidationMessage = () => {
                  setSectionValidationError("");
                  setMissingFieldsList([]);
                  setValidationErrors({});
                  setHasAttemptedValidation(false); // Resetear el flag
                };
                
                return null;
              })()}
            </div>
          </div>

          {/* Botones de navegación mejorados */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        if (currentAnexoSection > 0) {
                          setCurrentAnexoSection(currentAnexoSection - 1);
                          setSectionValidationError("");
                          setMissingFieldsList([]);
                          setValidationErrors({});
                          setHasAttemptedValidation(false); // Resetear al retroceder
                          // Scroll suave solo al inicio de la sección, sin interrumpir
                          setTimeout(() => {
                            const formSection = document.querySelector('.anexos-form-container');
                            if (formSection) {
                              formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }
                      }}
                      disabled={currentAnexoSection === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  currentAnexoSection === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-md'
                }`}
              >
                <ChevronLeft size={20} />
                Anterior
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-500">Sección</p>
                <p className="text-lg font-bold text-blue-600">
                  {currentAnexoSection + 1} / {totalAnexoSections}
                </p>
              </div>

              <button
                onClick={async () => {
                  // Limpiar mensajes previos
                  setErrorMessage("");
                  setSuccessMessage("");
                  
                  // Guardar la sección actual antes de avanzar
                  const saved = await validateAndSaveSection();
                  
                  if (!saved) {
                    return; // No avanzar si hay error al guardar
                  }

                  // Si la validación fue exitosa, limpiar todo y avanzar
                  setSectionValidationError("");
                  setMissingFieldsList([]);
                  setValidationErrors({});
                  setHasAttemptedValidation(false);

                  if (currentAnexoSection < totalAnexoSections - 1) {
                    setCurrentAnexoSection(currentAnexoSection + 1);
                    // Scroll suave solo al inicio de la nueva sección, sin interrumpir
                    setTimeout(() => {
                      const formSection = document.querySelector('.anexos-form-container');
                      if (formSection) {
                        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  } else {
                    // Si estamos en la última sección, guardar el anexo completo y luego ir al resumen
                    try {
                      console.log('💾 Guardando anexo completo antes de finalizar...');
                      await saveAnexoCompleto();
                      // Esperar un momento para que se complete el guardado
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      console.log('✅ Guardado completado, avanzando al resumen...');
                      setCurrentStep(3);
                    } catch (error: any) {
                      console.error('❌ Error al guardar anexo:', error);
                      setErrorMessage(error?.message || 'Error al guardar los datos. Puedes completarlos desde tu panel.');
                      // Continuar al resumen aunque haya error, para no bloquear al usuario
                      await new Promise(resolve => setTimeout(resolve, 500));
                      setCurrentStep(3);
                    }
                  }
                }}
                disabled={isSavingSection}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold shadow-lg transition-all ${
                  isSavingSection
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {isSavingSection ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Guardando...
                  </>
                ) : currentAnexoSection < totalAnexoSections - 1 ? (
                  <>
                    Siguiente
                    <ChevronRight size={20} />
                  </>
                ) : (
                  <>
                    Finalizar Registro
                    <CheckCircle size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si estamos en el paso 3 (Resumen), mostrar resumen
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-blue-900 mb-2">
              ¡Registro Completado!
            </h2>
            <p className="text-gray-600">
              Todos tus datos han sido guardados exitosamente en la base de datos.
            </p>
            {errorMessage && (
              <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-700 text-sm font-semibold">
                  ⚠️ {errorMessage}
                </p>
                <p className="text-red-600 text-xs mt-2">
                  No te preocupes, puedes completar los anexos desde tu panel de postulante.
                </p>
              </div>
            )}
            {!errorMessage && successMessage && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                ✅ {successMessage}
              </p>
            )}
            {!errorMessage && !successMessage && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                ✅ Tus anexos han sido guardados y estarán disponibles en tu panel de postulante
              </p>
            )}
          </div>
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              Resumen de tu registro
            </h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Nombre:</strong> {formData.nombreCompleto} {formData.apellidoPaterno} {formData.apellidoMaterno}</p>
              <p><strong>Email:</strong> {formData.correo}</p>
              <p><strong>Documento:</strong> {formData.tipoDocumento} - {formData.numeroDocumento}</p>
              <p><strong>Teléfono:</strong> {formData.telefono}</p>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate('/postulante')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Ir a mi panel de postulante
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Paso 1: Registro básico
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-2 sm:p-3 md:p-4">
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-blue-200/50 max-h-[98vh] mx-auto">
        <div className="flex flex-col lg:flex-row h-auto lg:max-h-[98vh] min-h-[550px] lg:min-h-[600px]">
          {/* Carrusel - Oculto en móvil */}
          <div className="lg:w-1/2 relative overflow-hidden min-h-[250px] sm:min-h-[300px] lg:min-h-[600px] hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent z-10"></div>
            <div className="relative h-full w-full min-h-[600px]">
              {carouselImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
                    index === currentSlide
                      ? "opacity-100 scale-100 z-20"
                      : "opacity-0 scale-110 z-0"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      console.error(`Error loading image ${index}:`, image.url);
                      // Fallback a una imagen placeholder si falla
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.image-placeholder')) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'image-placeholder w-full h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center';
                        placeholder.innerHTML = `<div class="text-white text-center p-8"><h3 class="text-xl font-bold mb-2">${image.title}</h3><p class="text-sm opacity-90">${image.subtitle}</p></div>`;
                        parent.appendChild(placeholder);
                      }
                    }}
                    onLoad={() => {
                      console.log(`Image ${index} loaded successfully`);
                    }}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute bottom-2 left-2 right-2 text-white z-30">
                    <h2 className="text-base font-bold mb-0.5 drop-shadow-lg" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5)' }}>
                      {image.title}
                    </h2>
                    <p className="text-xs opacity-90 drop-shadow-md" style={{ textShadow: '2px 2px 6px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)' }}>
                      {image.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Flechas */}
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-sm text-blue-700 hover:bg-white/50 border border-blue-300/50 transition-colors z-40"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-sm text-blue-700 hover:bg-white/50 border border-blue-300/50 transition-colors z-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Formulario */}
          <div className="w-full lg:w-1/2 p-4 sm:p-5 lg:p-6 flex flex-col justify-start bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-y-auto lg:max-h-[98vh]">
            <div className="max-w-md mx-auto w-full text-center mb-4 sm:mb-5">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-2 drop-shadow-lg" style={{ textShadow: '3px 3px 6px rgba(37, 99, 235, 0.5), 0 0 12px rgba(37, 99, 235, 0.4), 0 0 20px rgba(37, 99, 235, 0.3)' }}>
                <TextType
                  text={["CONTRATACIÓN CAS", "INNOVATE", "UGEL TALARA"]}
                  typingSpeed={100}
                  pauseDuration={2000}
                />
              </h1>
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-600 mb-2">
                {currentStep === 1 ? 'Crear cuenta postulante' : 'Completa tus datos personales'}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mb-2">
                Sistema Virtual de Contratación Cas - UGEL TALARA
              </p>
              {currentStep === 1 && (
                <p className="text-xs text-blue-500 font-medium mt-2">
                  Paso 1 de 2: Registro básico
                </p>
              )}
            </div>

            {/* Mostrar formularios de anexos después del registro exitoso */}
            {currentStep === 2 && authToken && (
              <div className="w-full max-w-6xl mx-auto mt-8">
          <AnexosSection
            convocatoriaSeleccionada={null}
            navigate={(_section: string, options?: { state?: any }) => {
              if (options?.state?.anexosCompletados) {
                setCurrentStep(3); // Ir al resumen
              }
            }}
            authToken={authToken}
            darkMode={false}
            textClasses="text-blue-950 font-semibold"
            textSecondaryClasses="text-blue-900 font-medium"
            showCompletedAnexos={false}
          />
              </div>
            )}

            {/* Mostrar formulario de registro básico solo si estamos en paso 1 */}
            {currentStep === 1 && (
            <div className="space-y-3 max-w-md mx-auto w-full">
              {/* Alertas */}
              {errorMessage && (
                <div className="flex items-center p-2 rounded bg-red-100 border border-red-300 text-red-700">
                  <TriangleAlert size={16} className="mr-2 flex-shrink-0" />
                  <p className="text-xs leading-tight">{errorMessage}</p>
                </div>
              )}
              {successMessage && (
                <div className="flex items-center p-2 rounded bg-green-100 border border-green-300 text-green-700">
                  <CircleCheck size={16} className="mr-2 flex-shrink-0" />
                  <p className="text-xs leading-tight">{successMessage}</p>
                </div>
              )}

              {/* Nombre Completo */}
              <div className="relative group">
                <User
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                  size={16}
                />
                <input
                  type="text"
                  name="nombreCompleto"
                  placeholder="Nombre completo"
                  value={formData.nombreCompleto}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-2.5 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Apellido Paterno */}
              <div className="relative group">
                <User
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                  size={16}
                />
                <input
                  type="text"
                  name="apellidoPaterno"
                  placeholder="Apellido paterno"
                  value={formData.apellidoPaterno}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-2.5 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Apellido Materno */}
              <div className="relative group">
                <User
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                  size={16}
                />
                <input
                  type="text"
                  name="apellidoMaterno"
                  placeholder="Apellido materno"
                  value={formData.apellidoMaterno}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-2.5 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Correo Electrónico */}
              <div className="relative group">
                <Mail
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                  size={16}
                />
                <input
                  type="email"
                  name="correo"
                  placeholder="Correo electrónico"
                  value={formData.correo}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-2.5 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Documento de Identidad */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 ml-1">
                  Documento de Identidad
                </label>
                
                {/* Menú desplegable para tipo de documento */}
                <div className="relative mb-2 dropdown-documento">
                  <button
                    type="button"
                    onClick={() => setShowTipoDocumentoDropdown(!showTipoDocumentoDropdown)}
                    className="w-full pl-3 pr-3 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 text-sm flex items-center justify-between hover:border-blue-500 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard size={16} className="text-blue-500" />
                      {tipoDocumentoSeleccionado ? tipoDocumentoSeleccionado.label : "Elija..."}
                    </span>
                    <ChevronDown 
                      size={16} 
                      className={`text-blue-500 transition-transform ${showTipoDocumentoDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {showTipoDocumentoDropdown && (
                    <div className="absolute z-50 w-full mt-0.5 bg-white border border-blue-300 rounded shadow-xl overflow-hidden">
                      {tiposDocumento.map((tipo) => (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() => handleTipoDocumentoChange(tipo.value)}
                          className="w-full px-2.5 py-1.5 text-left text-gray-800 text-sm hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                        >
                          <CreditCard size={12} className="text-blue-500" />
                          {tipo.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo para número de documento */}
                <div className="relative group">
                  <User
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                    size={16}
                  />
                  <input
                    type="text"
                    name="numeroDocumento"
                    placeholder={
                      tipoDocumentoSeleccionado
                        ? `Número de ${tipoDocumentoSeleccionado.label} (${tipoDocumentoSeleccionado.digitos} dígitos)`
                        : "Selecciona un tipo de documento primero"
                    }
                    value={formData.numeroDocumento}
                    onChange={handleInputChange}
                    maxLength={tipoDocumentoSeleccionado?.digitos || 12}
                    pattern={tipoDocumentoSeleccionado ? `[0-9]{${tipoDocumentoSeleccionado.digitos}}` : undefined}
                    disabled={!tipoDocumentoSeleccionado}
                    className="w-full pl-9 pr-2.5 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="relative group">
                <Phone
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                  size={16}
                />
                <input
                  type="tel"
                  name="telefono"
                  placeholder="Teléfono (9 dígitos)"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  maxLength={9}
                  pattern="[0-9]{9}"
                  className="w-full pl-9 pr-2.5 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Contraseña */}
              <div className="relative group">
                <Lock
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                  size={16}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-9 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirmar contraseña */}
              <div className="relative group">
                <Lock
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:text-blue-700"
                  size={16}
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirmar contraseña"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-9 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>

              {/* Términos */}
              <div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="aceptaTerminos"
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-blue-300 bg-white text-blue-600 cursor-pointer focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="aceptaTerminos" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                    Acepto los{" "}
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      términos y condiciones
                    </a>{" "}
                    y la{" "}
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      política de privacidad
                    </a>
                  </label>
                </div>
                {!aceptaTerminos && (
                  <p className="text-xs text-red-600 mt-1.5 ml-6 flex items-center gap-1">
                    <span className="font-bold">*</span> Debes aceptar los términos y condiciones para continuar
                  </p>
                )}
              </div>

              {/* Botón */}
              <button
                onClick={handleSubmit}
                disabled={!aceptaTerminos}
                className={`w-full py-2.5 font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
                  aceptaTerminos
                    ? "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 cursor-pointer shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400"
                }`}
              >
                Siguiente
                {aceptaTerminos && (
                  <ChevronRight size={18} className="inline-block" />
                )}
              </button>

              {/* Link login */}
              <p className="text-gray-600 text-xs text-center pt-3">
                ¿Ya tienes cuenta?{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-800 underline">
                  Inicia sesión
                </Link>
              </p>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernRegister;