import PDFDocument from "pdfkit";
import fs from "fs";

export async function generarPDF(resultado) {
  const fileName = `reporte_${Date.now()}.pdf`;
  const path = `./reports/${fileName}`;
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(path));

  doc.fontSize(18).text("Reporte de Evaluación de Postulante", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(resultado, { align: "left" });

  doc.end();
  return path;
}

/**
 * Generar reporte PDF de evaluaciones CAS
 */
export async function generarReporteEvaluacionesCAS(evaluaciones) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Encabezado del documento
    doc.fontSize(20)
       .fillColor('#1a365d')
       .text('REPORTE DE EVALUACIONES CAS', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#666')
       .text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, { align: 'center' });
    
    doc.moveDown(1);

    // Información general
    if (evaluaciones.length > 0) {
      const convocatoria = evaluaciones[0];
      doc.fontSize(14)
         .fillColor('#2d3748')
         .text('INFORMACIÓN DE LA CONVOCATORIA', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#000')
         .text(`Área: ${convocatoria.convocatoria_area || 'N/A'}`);
      doc.text(`Puesto: ${convocatoria.convocatoria_puesto || 'N/A'}`);
      doc.text(`Total de evaluaciones: ${evaluaciones.length}`);
      
      doc.moveDown(1);
    }

    // Tabla de evaluaciones
    doc.fontSize(14)
       .fillColor('#2d3748')
       .text('RESULTADOS DE EVALUACIÓN', { underline: true });
    
    doc.moveDown(0.5);

    // Encabezados de tabla
    const tableTop = doc.y;
    const itemHeight = 20;
    const pageHeight = doc.page.height - 100;
    
    // Dibujar encabezados
    doc.fontSize(8)
       .fillColor('#4a5568')
       .text('Postulante', 50, tableTop, { width: 120 })
       .text('DNI', 180, tableTop, { width: 80 })
       .text('Fase 1', 270, tableTop, { width: 50 })
       .text('Fase 2', 330, tableTop, { width: 50 })
       .text('Fase 3', 390, tableTop, { width: 50 })
       .text('Total', 450, tableTop, { width: 50 })
       .text('Estado', 510, tableTop, { width: 60 });

    // Dibujar línea separadora
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, tableTop + 15)
       .lineTo(570, tableTop + 15)
       .stroke();

    let currentY = tableTop + 20;
    let pageNumber = 1;

    evaluaciones.forEach((evaluacion, index) => {
      // Verificar si necesitamos nueva página
      if (currentY > pageHeight) {
        doc.addPage();
        currentY = 50;
        pageNumber++;
        
        // Repetir encabezados en nueva página
        doc.fontSize(8)
           .fillColor('#4a5568')
           .text('Postulante', 50, currentY, { width: 120 })
           .text('DNI', 180, currentY, { width: 80 })
           .text('Fase 1', 270, currentY, { width: 50 })
           .text('Fase 2', 330, currentY, { width: 50 })
           .text('Fase 3', 390, currentY, { width: 50 })
           .text('Total', 450, currentY, { width: 50 })
           .text('Estado', 510, currentY, { width: 60 });
        
        currentY += 20;
        
        // Línea separadora
        doc.strokeColor('#e2e8f0')
           .lineWidth(1)
           .moveTo(50, currentY - 5)
           .lineTo(570, currentY - 5)
           .stroke();
      }

      // Datos de la evaluación
      const nombre = evaluacion.postulante_nombre || 'N/A';
      const dni = evaluacion.postulante_dni || 'N/A';
      const fase1 = evaluacion.fase1_cumple ? 'CUMPLE' : 'NO CUMPLE';
      const fase2 = evaluacion.fase2_cumple ? 'CUMPLE' : 'NO CUMPLE';
      const fase3 = evaluacion.fase3_cumple ? 'CUMPLE' : 'NO CUMPLE';
      const total = evaluacion.puntuacion_total || 0;
      const estado = evaluacion.estado_final || 'N/A';

      // Color según estado
      const estadoColor = estado === 'APROBADO' ? '#38a169' : '#e53e3e';

      doc.fontSize(8)
         .fillColor('#000')
         .text(nombre.substring(0, 15), 50, currentY, { width: 120 })
         .text(dni, 180, currentY, { width: 80 })
         .text(fase1, 270, currentY, { width: 50 })
         .text(fase2, 330, currentY, { width: 50 })
         .text(fase3, 390, currentY, { width: 50 })
         .text(total.toString(), 450, currentY, { width: 50 })
         .fillColor(estadoColor)
         .text(estado, 510, currentY, { width: 60 });

      currentY += itemHeight;
    });

    // Estadísticas finales
    doc.addPage();
    doc.fontSize(16)
       .fillColor('#2d3748')
       .text('ESTADÍSTICAS GENERALES', { align: 'center' });
    
    doc.moveDown(1);

    const aprobados = evaluaciones.filter(e => e.estado_final === 'APROBADO').length;
    const rechazados = evaluaciones.filter(e => e.estado_final === 'RECHAZADO').length;
    const cumpleFase1 = evaluaciones.filter(e => e.fase1_cumple).length;
    const cumpleFase2 = evaluaciones.filter(e => e.fase2_cumple).length;
    const cumpleFase3 = evaluaciones.filter(e => e.fase3_cumple).length;
    const puntuacionPromedio = evaluaciones.reduce((sum, e) => sum + (e.puntuacion_total || 0), 0) / evaluaciones.length;

    doc.fontSize(12)
       .fillColor('#000')
       .text(`Total de evaluaciones: ${evaluaciones.length}`)
       .text(`Aprobados: ${aprobados} (${((aprobados/evaluaciones.length)*100).toFixed(1)}%)`)
       .text(`Rechazados: ${rechazados} (${((rechazados/evaluaciones.length)*100).toFixed(1)}%)`)
       .moveDown(0.5)
       .text(`Cumplen Fase 1 (Académica): ${cumpleFase1} (${((cumpleFase1/evaluaciones.length)*100).toFixed(1)}%)`)
       .text(`Cumplen Fase 2 (Experiencia General): ${cumpleFase2} (${((cumpleFase2/evaluaciones.length)*100).toFixed(1)}%)`)
       .text(`Cumplen Fase 3 (Experiencia Específica): ${cumpleFase3} (${((cumpleFase3/evaluaciones.length)*100).toFixed(1)}%)`)
       .moveDown(0.5)
       .text(`Puntuación promedio: ${puntuacionPromedio.toFixed(2)} puntos`);

    // Pie de página
    doc.fontSize(8)
       .fillColor('#666')
       .text(`Página ${pageNumber}`, { align: 'center' });

    doc.end();
  });
}

/**
 * Generar reporte detallado de un postulante específico
 */
export async function generarReporteDetalladoPostulante(evaluacionCompleta) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Encabezado
    doc.fontSize(20)
       .fillColor('#1a365d')
       .text('REPORTE DETALLADO DE EVALUACIÓN CAS', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#666')
       .text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, { align: 'center' });
    
    doc.moveDown(1);

    // Información del postulante
    doc.fontSize(14)
       .fillColor('#2d3748')
       .text('INFORMACIÓN DEL POSTULANTE', { underline: true });
    
    doc.moveDown(0.3);
    doc.fontSize(10)
       .fillColor('#000')
       .text(`Nombre: ${evaluacionCompleta.postulante_nombre || 'N/A'}`)
       .text(`DNI: ${evaluacionCompleta.postulante_dni || 'N/A'}`)
       .text(`Convocatoria: ${evaluacionCompleta.convocatoria_area} - ${evaluacionCompleta.convocatoria_puesto}`)
       .text(`Fecha de evaluación: ${new Date(evaluacionCompleta.fecha_evaluacion).toLocaleDateString('es-PE')}`);

    doc.moveDown(1);

    // Resultados por fase
    doc.fontSize(14)
       .fillColor('#2d3748')
       .text('EVALUACIÓN POR FASES', { underline: true });
    
    doc.moveDown(0.5);

    // Fase 1
    doc.fontSize(12)
       .fillColor('#000')
       .text('FASE 1 - REQUISITOS ACADÉMICOS', { underline: true });
    
    doc.fontSize(10)
       .text(`Cumple perfil mínimo: ${evaluacionCompleta.fase1_cumple ? 'SÍ' : 'NO'}`)
       .text(`Puntuación: ${evaluacionCompleta.fase1_puntuacion}/20`);

    doc.moveDown(0.5);

    // Fase 2
    doc.fontSize(12)
       .text('FASE 2 - EXPERIENCIA GENERAL', { underline: true });
    
    doc.fontSize(10)
       .text(`Cumple experiencia mínima: ${evaluacionCompleta.fase2_cumple ? 'SÍ' : 'NO'}`)
       .text(`Puntuación: ${evaluacionCompleta.fase2_puntuacion}/20`);

    doc.moveDown(0.5);

    // Fase 3
    doc.fontSize(12)
       .text('FASE 3 - EXPERIENCIA ESPECÍFICA', { underline: true });
    
    doc.fontSize(10)
       .text(`Cumple experiencia específica: ${evaluacionCompleta.fase3_cumple ? 'SÍ' : 'NO'}`)
       .text(`Puntuación: ${evaluacionCompleta.fase3_puntuacion}/30`);

    doc.moveDown(1);

    // Resumen final
    doc.fontSize(14)
       .fillColor('#2d3748')
       .text('RESUMEN FINAL', { underline: true });
    
    doc.moveDown(0.3);
    doc.fontSize(12)
       .fillColor('#000')
       .text(`Puntuación total: ${evaluacionCompleta.puntuacion_total} puntos`)
       .text(`Estado: ${evaluacionCompleta.estado_final}`);

    // Reporte detallado de IA
    if (evaluacionCompleta.reporte_detallado) {
      doc.addPage();
      doc.fontSize(14)
         .fillColor('#2d3748')
         .text('REPORTE DETALLADO DE IA', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor('#000')
         .text(evaluacionCompleta.reporte_detallado, {
           align: 'left',
           width: 500
         });
    }

    doc.end();
  });
}

/**
 * Generar PDF de reporte de IA
 */
export async function generarPDFReporteIA(reporteData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Encabezado
    doc.fontSize(20)
       .fillColor('#1a365d')
       .text('REPORTE DE EVALUACIÓN DE IA', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#666')
       .text(`Generado el: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`, { align: 'center' });
    
    doc.moveDown(1);

    // Información del candidato
    doc.fontSize(14)
       .fillColor('#2d3748')
       .text('INFORMACIÓN DEL CANDIDATO', { underline: true });
    
    doc.moveDown(0.3);
    doc.fontSize(10)
       .fillColor('#000')
       .text(`Nombre: ${reporteData.nombre_completo || 'N/A'}`)
       .text(`Email: ${reporteData.email || 'N/A'}`)
       .text(`Puesto: ${reporteData.puesto_postulado || 'N/A'}`)
       .text(`Score: ${reporteData.score || 0}/100`)
       .text(`Calificación: ${reporteData.calificacion || 0}/10`)
       .text(`Estado: ${reporteData.estado_evaluacion === 'approved' ? 'APROBADO' : reporteData.estado_evaluacion === 'rejected' ? 'RECHAZADO' : 'PENDIENTE'}`)
       .text(`Apto: ${reporteData.apto ? 'SÍ' : 'NO'}`);

    // Información de convocatoria
    if (reporteData.convocatoria_usada) {
      doc.moveDown(0.5);
      doc.fontSize(12)
         .fillColor('#2d3748')
         .text('INFORMACIÓN DE LA CONVOCATORIA', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#000')
         .text(`N° CAS: ${reporteData.convocatoria_usada.numero_cas || 'N/A'}`)
         .text(`Área: ${reporteData.convocatoria_usada.area || 'N/A'}`)
         .text(`Puesto: ${reporteData.convocatoria_usada.puesto || 'N/A'}`);
    }

    doc.moveDown(1);

    // Análisis de IA
    doc.fontSize(14)
       .fillColor('#2d3748')
       .text('ANÁLISIS DE INTELIGENCIA ARTIFICIAL', { underline: true });
    
    doc.moveDown(0.3);
    doc.fontSize(10)
       .fillColor('#000')
       .text(reporteData.contenido || reporteData.evaluacionRequisitos || 'No disponible', {
         align: 'left',
         width: 500
       });

    // Habilidades clave
    if (reporteData.habilidades_clave && Array.isArray(reporteData.habilidades_clave) && reporteData.habilidades_clave.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(12)
         .fillColor('#2d3748')
         .text('HABILIDADES CLAVE', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#000')
         .text(reporteData.habilidades_clave.join(', '));
    }

    // Experiencia relevante
    if (reporteData.experiencia_relevante) {
      doc.moveDown(0.5);
      doc.fontSize(12)
         .fillColor('#2d3748')
         .text('EXPERIENCIA RELEVANTE', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#000')
         .text(reporteData.experiencia_relevante, {
           align: 'left',
           width: 500
         });
    }

    // Declaraciones juradas
    if (reporteData.declaraciones) {
      doc.moveDown(0.5);
      doc.fontSize(12)
         .fillColor('#2d3748')
         .text('DECLARACIONES JURADAS', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#000');
      
      const decl = reporteData.declaraciones;
      if (decl.infoVerdadera) doc.text('✓ Información Verdadera');
      if (decl.leyProteccionDatos) doc.text('✓ Ley de Protección de Datos');
      if (decl.cumploRequisitosMinimos) doc.text('✓ Cumple Requisitos Mínimos');
      if (decl.plenosDerechosCiviles) doc.text('✓ Plenos Derechos Civiles');
      if (decl.noCondenaDolosa) doc.text('✓ No Condena Dolosa');
      if (decl.noInhabilitacion) doc.text('✓ No Inhabilitación');
    }

    // Reglas aplicadas
    if (reporteData.reglasAplicadas) {
      doc.moveDown(0.5);
      doc.fontSize(12)
         .fillColor('#2d3748')
         .text('REGLAS APLICADAS', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#000');
      
      const reglas = reporteData.reglasAplicadas;
      if (reglas.requisitosMinimos) doc.text(`Requisitos Mínimos: ${reglas.requisitosMinimos}`);
      if (reglas.experienciaRequerida) doc.text(`Experiencia Requerida: ${reglas.experienciaRequerida}`);
      if (reglas.tituloRequerido) doc.text(`Título Requerido: ${reglas.tituloRequerido}`);
    }

    // Bonos aplicados
    if (reporteData.bonosAplicados && Array.isArray(reporteData.bonosAplicados) && reporteData.bonosAplicados.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(12)
         .fillColor('#2d3748')
         .text('BONOS APLICADOS', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#000');
      
      reporteData.bonosAplicados.forEach((bono, idx) => {
        doc.text(`${idx + 1}. ${bono.tipo || 'Bono'}: ${bono.descripcion || 'N/A'} - Puntos: ${bono.puntos || 0}`);
      });
    }

    // Razones
    if (reporteData.razones && Array.isArray(reporteData.razones) && reporteData.razones.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(12)
         .fillColor('#2d3748')
         .text('RAZONES', { underline: true });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor('#000');
      
      reporteData.razones.forEach((razon, idx) => {
        doc.text(`${idx + 1}. ${razon}`);
      });
    }

    doc.end();
  });
}

export default {
  generarPDF,
  generarReporteEvaluacionesCAS,
  generarReporteDetalladoPostulante,
  generarPDFReporteIA
};