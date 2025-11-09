import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analizarConvocatoriaYAnexos(datos) {
  const prompt = `
Analiza la siguiente información:
- Convocatoria: ${JSON.stringify(datos.convocatoria)}
- Documentos y anexos del postulante: ${JSON.stringify(datos.anexos)}

Compara los requisitos exigidos con los documentos presentados.

Genera un reporte estructurado así:
1️⃣ Requisitos cumplidos (detalla cuáles y evidencia).
2️⃣ Requisitos faltantes (detalla cuáles).
3️⃣ Observaciones del análisis.
4️⃣ Bonificaciones aplicables (según discapacidad, licenciado o deportista).
5️⃣ Nivel de cumplimiento general (Aprobado, Parcial o Rechazado).
6️⃣ Recomendación final para el comité.

Sé claro, objetivo y legal conforme a las normas establecidas.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message.content;
}

// Nueva función para analizar todos los anexos de un postulante
// Ahora soporta análisis de CV mediante URLs y análisis de reglas y bonos
export async function analizarTodosLosAnexos(datosCompletos) {
  const { convocatoria, anexos, curriculum, postulante, incluirCV, incluirReglasBonos, reglasAplicadas, bonosAplicados } = datosCompletos;
  
  // Preparar información detallada de los anexos con todos los datos disponibles
  console.log(`📋 Preparando ${anexos.length} anexos para el prompt de IA...`);
  
  const anexosDetallados = anexos.map((anexo, idx) => {
    // Asegurar que todos los campos sean arrays válidos
    const formacionAcademica = Array.isArray(anexo.formacionAcademica) ? anexo.formacionAcademica : (anexo.formacionAcademica ? [anexo.formacionAcademica] : []);
    const especializacion = Array.isArray(anexo.especializacion) ? anexo.especializacion : (anexo.especializacion ? [anexo.especializacion] : []);
    const experienciaLaboral = Array.isArray(anexo.experienciaLaboral) ? anexo.experienciaLaboral : (anexo.experienciaLaboral ? [anexo.experienciaLaboral] : []);
    const referenciasLaborales = Array.isArray(anexo.referenciasLaborales) ? anexo.referenciasLaborales : (anexo.referenciasLaborales ? [anexo.referenciasLaborales] : []);
    const idiomas = Array.isArray(anexo.idiomas) ? anexo.idiomas : (anexo.idiomas ? [anexo.idiomas] : []);
    const ofimatica = Array.isArray(anexo.ofimatica) ? anexo.ofimatica : (anexo.ofimatica ? [anexo.ofimatica] : []);
    
    // Log para debugging
    console.log(`   Anexo ${idx + 1} (ID: ${anexo.IDANEXO}):`);
    console.log(`     - Formación Académica: ${formacionAcademica.length} registros`);
    console.log(`     - Experiencia Laboral: ${experienciaLaboral.length} registros`);
    console.log(`     - Idiomas: ${idiomas.length} registros`);
    console.log(`     - Colegio Profesional: ${anexo.colegioProfesional || 'N/A'}`);
    
    const anexoDetallado = {
      tipo: anexo.tipoAnexo || 'Anexo 01',
      nombre: anexo.nombreArchivo || `Anexo_${anexo.IDANEXO}`,
      postulante: anexo.nombrePostulante || `${postulante.nombreCompleto || 'N/A'}`,
      dni: anexo.dniPostulante || postulante.documento || 'N/A',
      IDANEXO: anexo.IDANEXO,
      // Datos académicos
      formacionAcademica: formacionAcademica,
      especializacion: especializacion,
      // Experiencia
      experienciaLaboral: experienciaLaboral,
      referenciasLaborales: referenciasLaborales,
      // Habilidades
      idiomas: idiomas,
      ofimatica: ofimatica,
      // Colegio Profesional
      colegioProfesional: anexo.colegioProfesional || null,
      colegioProfesionalHabilitado: anexo.colegioProfesionalHabilitado || 'NO',
      nColegiatura: anexo.nColegiatura || null,
      // Declaraciones
      declaraciones: anexo.declaraciones || {}
    };
    
    return anexoDetallado;
  });
  
  // Log de resumen
  const totalFormacion = anexosDetallados.reduce((sum, a) => sum + a.formacionAcademica.length, 0);
  const totalExperiencia = anexosDetallados.reduce((sum, a) => sum + a.experienciaLaboral.length, 0);
  console.log(`✅ Resumen: ${totalFormacion} títulos, ${totalExperiencia} experiencias laborales`);

  const prompt = `
Analiza COMPLETAMENTE la postulación del siguiente candidato:

📋 INFORMACIÓN DE LA CONVOCATORIA (Verifica todos los requisitos):
- Área: ${convocatoria.area || 'No especificado'}
- Puesto: ${convocatoria.puesto || 'No especificado'}
- Sueldo: ${convocatoria.sueldo || 'No especificado'}
- Requisitos: ${convocatoria.requisitos || 'No especificado'}
- Experiencia requerida: ${convocatoria.experiencia || 'No especificado'}
- Años de experiencia pública (mínimo): ${convocatoria.expPublicaMin || 'No especificado'}
- Años de experiencia pública (máximo): ${convocatoria.expPublicaMax || 'No especificado'}
- Título profesional o académico requerido: ${convocatoria.licenciatura || 'No especificado'}
- Habilidades requeridas: ${convocatoria.habilidades || 'No especificado'}
- Número CAS: ${convocatoria.numero_cas || 'No especificado'}

👤 INFORMACIÓN DEL POSTULANTE:
- ID: ${postulante.id}
- Total de anexos presentados: ${postulante.totalAnexos}

📄 ANEXOS PRESENTADOS (DETALLE COMPLETO):
${anexosDetallados.map((anexo, index) => {
  let detalles = `
${index + 1}. ${anexo.tipo} - ${anexo.nombre} (ID: ${anexo.IDANEXO})
   - Postulante: ${anexo.postulante}
   - DNI: ${anexo.dni}`;

  // Formación Académica
  if (anexo.formacionAcademica && anexo.formacionAcademica.length > 0) {
    detalles += `\n   - Formación Académica (${anexo.formacionAcademica.length} registro(s)):`;
    anexo.formacionAcademica.forEach((fa, i) => {
      // Asegurar que fa sea un objeto válido
      if (fa && typeof fa === 'object') {
        detalles += `\n     ${i + 1}. ${fa.nombreInstitucion || fa.institucion || 'N/A'} - ${fa.tipoGrado || fa.grado || 'N/A'} ${fa.nombreGrado || fa.titulo || fa.carrera || ''} (${fa.fechaInicio || fa.fechaInicioGrado || 'N/A'} - ${fa.fechaFin || fa.fechaFinGrado || 'Actual'})`;
        if (fa.situacion) detalles += ` [${fa.situacion}]`;
      } else {
        detalles += `\n     ${i + 1}. ${JSON.stringify(fa)}`;
      }
    });
  } else {
    // Si no hay formación académica, indicarlo explícitamente
    detalles += `\n   - Formación Académica: NO REGISTRADA (array vacío o null)`;
  }

  // Especialización
  if (anexo.especializacion && anexo.especializacion.length > 0) {
    detalles += `\n   - Especializaciones (${anexo.especializacion.length} registro(s)):`;
    anexo.especializacion.forEach((esp, i) => {
      detalles += `\n     ${i + 1}. ${esp.nombreEspecializacion || 'N/A'} - ${esp.institucion || 'N/A'} (${esp.fechaInicio || 'N/A'} - ${esp.fechaFin || 'N/A'})`;
    });
  }

  // Experiencia Laboral
  if (anexo.experienciaLaboral && anexo.experienciaLaboral.length > 0) {
    detalles += `\n   - Experiencia Laboral (${anexo.experienciaLaboral.length} registro(s)):`;
    anexo.experienciaLaboral.forEach((exp, i) => {
      // Asegurar que exp sea un objeto válido
      if (exp && typeof exp === 'object') {
        const fechaInicio = exp.fechaInicio || exp.fechaInicioTrabajo || 'N/A';
        const fechaFin = exp.fechaFin || exp.fechaFinTrabajo || exp.hasta || 'Actual';
        const añosExp = exp.añosExperiencia || exp.annosExperiencia || exp.años || 'N/A';
        const empresa = exp.empresaEntidad || exp.empresa || exp.entidad || 'N/A';
        const cargo = exp.cargoPostulante || exp.cargo || exp.puesto || 'N/A';
        detalles += `\n     ${i + 1}. ${empresa} - ${cargo} (${fechaInicio} - ${fechaFin}, ${añosExp} año(s))`;
        if (exp.sectorPublico === 'SÍ' || exp.sectorPublico === true || exp.sector === 'Público') {
          detalles += ` [SECTOR PÚBLICO]`;
        }
        if (exp.funciones) detalles += `\n        Funciones: ${exp.funciones}`;
      } else {
        detalles += `\n     ${i + 1}. ${JSON.stringify(exp)}`;
      }
    });
  } else {
    // Si no hay experiencia laboral, indicarlo explícitamente
    detalles += `\n   - Experiencia Laboral: NO REGISTRADA (array vacío o null)`;
  }

  // Referencias Laborales
  if (anexo.referenciasLaborales && anexo.referenciasLaborales.length > 0) {
    detalles += `\n   - Referencias Laborales (${anexo.referenciasLaborales.length} registro(s)):`;
    anexo.referenciasLaborales.forEach((ref, i) => {
      detalles += `\n     ${i + 1}. ${ref.empresaEntidad || 'N/A'} - ${ref.cargoPostulante || 'N/A'} (Contacto: ${ref.telefonos || 'N/A'})`;
    });
  }

  // Idiomas
  if (anexo.idiomas && anexo.idiomas.length > 0) {
    detalles += `\n   - Idiomas (${anexo.idiomas.length} registro(s)):`;
    anexo.idiomas.forEach((idioma, i) => {
      detalles += `\n     ${i + 1}. ${idioma.idioma || 'N/A'} - ${idioma.nivel || 'N/A'}`;
    });
  }

  // Ofimática
  if (anexo.ofimatica && anexo.ofimatica.length > 0) {
    detalles += `\n   - Conocimientos de Ofimática (${anexo.ofimatica.length} registro(s)):`;
    anexo.ofimatica.forEach((ofi, i) => {
      detalles += `\n     ${i + 1}. ${ofi.programa || 'N/A'} - ${ofi.nivel || 'N/A'}`;
    });
  }

  // Colegio Profesional
  if (anexo.colegioProfesional) {
    detalles += `\n   - Colegio Profesional: ${anexo.colegioProfesional}`;
    if (anexo.colegioProfesionalHabilitado === 'SÍ') {
      detalles += ` (Habilitado) - N° Colegiatura: ${anexo.nColegiatura || 'N/A'}`;
    } else {
      detalles += ` (No habilitado)`;
    }
  }

  // Declaraciones Juradas
  if (anexo.declaraciones && Object.keys(anexo.declaraciones).length > 0) {
    detalles += `\n   - Declaraciones Juradas:`;
    const decl = anexo.declaraciones;
    if (decl.infoVerdadera) detalles += `\n     ✓ Información Verdadera`;
    if (decl.leyProteccionDatos) detalles += `\n     ✓ Ley de Protección de Datos`;
    if (decl.cumploRequisitosMinimos) detalles += `\n     ✓ Cumple Requisitos Mínimos`;
    if (decl.plenosDerechosCiviles) detalles += `\n     ✓ Plenos Derechos Civiles`;
    if (decl.noCondenaDolosa) detalles += `\n     ✓ No Condena Dolosa`;
    if (decl.noInhabilitacion) detalles += `\n     ✓ No Inhabilitación`;
    
    // Verificar declaraciones faltantes
    const faltantes = [];
    if (!decl.infoVerdadera) faltantes.push('Información Verdadera');
    if (!decl.leyProteccionDatos) faltantes.push('Ley de Protección de Datos');
    if (!decl.cumploRequisitosMinimos) faltantes.push('Cumple Requisitos Mínimos');
    if (faltantes.length > 0) {
      detalles += `\n     ⚠ Declaraciones faltantes: ${faltantes.join(', ')}`;
    }
  }

  return detalles;
}).join('\n\n')}

📚 CURRÍCULUM VITAE:
${curriculum ? (
  curriculum.desdeURL 
    ? `- Archivo: ${curriculum.nombreArchivo} (Descargado desde URL: ${curriculum.url || 'N/A'})\n- Tamaño: ${curriculum.pdfFile ? (curriculum.pdfFile.length / 1024).toFixed(2) + ' KB' : 'N/A'}\n- NOTA: El CV ha sido descargado y está disponible para análisis`
    : `- Archivo: ${curriculum.nombreArchivo} (${curriculum.tipoArchivo})`
) : 'No disponible'}
${incluirCV && curriculum ? '\n- ANÁLISIS DE CV: Incluir análisis detallado del currículum vitae en la evaluación' : ''}

Realiza un análisis EXHAUSTIVO y genera un reporte DETALLADO y ESTRUCTURADO con el siguiente formato:

${incluirReglasBonos && reglasAplicadas ? (
  `═══════════════════════════════════════════════════════════════
0️⃣ REGLAS Y CRITERIOS APLICADOS
═══════════════════════════════════════════════════════════════

REGLAS DE EVALUACIÓN:
${reglasAplicadas.requisitosMinimos ? `- Requisitos Mínimos: ${reglasAplicadas.requisitosMinimos}\n` : ''}${reglasAplicadas.experienciaRequerida ? `- Experiencia Requerida: ${reglasAplicadas.experienciaRequerida}\n` : ''}${reglasAplicadas.tituloRequerido ? `- Título Requerido: ${reglasAplicadas.tituloRequerido}\n` : ''}${reglasAplicadas.habilidadesRequeridas ? `- Habilidades Requeridas: ${reglasAplicadas.habilidadesRequeridas}\n` : ''}${reglasAplicadas.experienciaPublicaMin ? `- Experiencia Pública Mínima: ${reglasAplicadas.experienciaPublicaMin} años\n` : ''}${reglasAplicadas.experienciaPublicaMax ? `- Experiencia Pública Máxima: ${reglasAplicadas.experienciaPublicaMax} años\n` : ''}

Estas son las reglas que se aplicarán para evaluar el cumplimiento de requisitos.

`
) : ''
}
═══════════════════════════════════════════════════════════════
1️⃣ EVALUACIÓN DE REQUISITOS DE LA CONVOCATORIA
═══════════════════════════════════════════════════════════════

REQUISITOS CUMPLIDOS:
- Lista específica de cada requisito que SÍ cumple el postulante
- Evidencia documental que respalda cada requisito cumplido
- Detalles de los documentos/anexos que validan el cumplimiento
${incluirReglasBonos && reglasAplicadas ? '- Comparar con las REGLAS APLICADAS listadas arriba' : ''}

REQUISITOS FALTANTES O INCOMPLETOS:
- Lista específica de requisitos NO cumplidos o incompletos
- Razón por la cual no se cumple cada requisito
- Documentos faltantes o información incompleta
${incluirReglasBonos && reglasAplicadas ? '- Verificar contra las REGLAS APLICADAS para identificar qué falta' : ''}

DOCUMENTOS ADICIONALES PRESENTADOS:
- Documentos que no son requeridos pero que fortalecen la postulación
- Certificaciones, cursos, especializaciones adicionales

═══════════════════════════════════════════════════════════════
2️⃣ ANÁLISIS DETALLADO DE EXPERIENCIA LABORAL
═══════════════════════════════════════════════════════════════

EXPERIENCIA PRESENTADA:
- Resumen de toda la experiencia laboral del postulante
- Años totales de experiencia (pública y privada)
- Años específicos de experiencia en el SECTOR PÚBLICO (si aplica)
- Cargos desempeñados más relevantes

COMPARACIÓN CON REQUISITOS:
- Experiencia requerida: ${convocatoria.expPublicaMin || 'No especificado'} - ${convocatoria.expPublicaMax || 'No especificado'} años
- Experiencia presentada: [calcular años totales de los anexos]
- Cumplimiento: [SÍ CUMPLE / NO CUMPLE / PARCIAL]
- Diferencia: [años de más o años faltantes]

VERIFICACIÓN ESPECÍFICA:
- Si se requiere experiencia pública, verificar que el postulante la tenga
- Comparar años de experiencia pública presentada vs requerida
- Evaluar relevancia de la experiencia con el puesto

FORTALEZAS Y DEBILIDADES:
- Fortalezas en la experiencia del postulante
- Debilidades o áreas de mejora identificadas

═══════════════════════════════════════════════════════════════
3️⃣ EVALUACIÓN ACADÉMICA Y FORMACIÓN
═══════════════════════════════════════════════════════════════

TÍTULO PROFESIONAL REQUERIDO:
- Título requerido: "${convocatoria.licenciatura || 'No especificado'}"
- Título presentado: [verificar en formación académica]
- Cumplimiento: [CUMPLE EXACTAMENTE / CUMPLE PARCIALMENTE / NO CUMPLE]
- Justificación: [por qué cumple o no cumple]

FORMACIÓN ACADÉMICA:
- Títulos universitarios presentados
- Nivel académico más alto alcanzado
- Instituciones donde estudió
- Años de estudio

ESPECIALIZACIONES Y ESTUDIOS ADICIONALES:
- Especializaciones, maestrías, doctorados
- Cursos y diplomados relevantes
- Certificaciones profesionales
- Evaluación de cómo fortalecen la postulación

COLEGIO PROFESIONAL:
- Colegio al que pertenece (si aplica)
- Estado de habilitación: [Habilitado / No habilitado]
- Número de colegiatura (si aplica)

═══════════════════════════════════════════════════════════════
4️⃣ EVALUACIÓN DE HABILIDADES Y COMPETENCIAS
═══════════════════════════════════════════════════════════════

IDIOMAS:
- Idiomas dominados y nivel de cada uno
- Relevancia para el puesto
- Certificaciones de idiomas (si aplica)

CONOCIMIENTOS DE OFIMÁTICA:
- Programas conocidos y nivel de dominio
- Relevancia para el puesto

HABILIDADES REQUERIDAS:
- Habilidades requeridas en la convocatoria: ${convocatoria.habilidades || 'No especificado'}
- Habilidades presentadas por el postulante
- Coincidencia y brechas

═══════════════════════════════════════════════════════════════
5️⃣ VERIFICACIÓN DE DECLARACIONES JURADAS
═══════════════════════════════════════════════════════════════

DECLARACIONES MARCADAS:
- Lista de declaraciones juradas que SÍ están marcadas
- Estado: COMPLETO / INCOMPLETO

DECLARACIONES FALTANTES (CRÍTICO):
- Lista de declaraciones juradas que NO están marcadas
- Impacto en la evaluación: [CRÍTICO / IMPORTANTE / MENOR]
- Acción requerida: [DESCALIFICATORIO / REQUIERE CORRECCIÓN]

ANÁLISIS DE COMPLETITUD:
- Porcentaje de declaraciones completadas
- Evaluación de riesgo legal

═══════════════════════════════════════════════════════════════
6️⃣ BONIFICACIONES APLICABLES
═══════════════════════════════════════════════════════════════

${incluirReglasBonos && bonosAplicados && Array.isArray(bonosAplicados) && bonosAplicados.length > 0 ? (
  `BONIFICACIONES IDENTIFICADAS (${bonosAplicados.length}):\n` +
  bonosAplicados.map((bono, idx) => 
    `${idx + 1}. ${bono.tipo || 'Bono'}: ${bono.descripcion || 'N/A'} - Puntos: ${bono.puntos || 0}`
  ).join('\n') +
  `\n\nTOTAL DE PUNTOS POR BONOS: ${bonosAplicados.reduce((sum, b) => sum + (b.puntos || 0), 0)} puntos`
) : `BONIFICACIONES IDENTIFICADAS:
- Discapacidad: [SÍ / NO] - [Detalles si aplica]
- Licenciatura: [SÍ / NO] - [Detalles si aplica]
- Deportista destacado: [SÍ / NO] - [Detalles si aplica]
- Otras bonificaciones: [Listar si aplica]

PUNTOS ADICIONALES:
- Cálculo de puntos por bonificaciones (si aplica)`}

═══════════════════════════════════════════════════════════════
7️⃣ OBSERVACIONES Y CALIDAD DOCUMENTAL
═══════════════════════════════════════════════════════════════

CALIDAD DE LA DOCUMENTACIÓN:
- Completitud de los documentos
- Claridad y legibilidad
- Organización de la información
- Consistencia entre documentos

ASPECTOS DESTACABLES:
- Fortalezas del postulante
- Aspectos positivos de la documentación
- Experiencia relevante destacada

ASPECTOS PREOCUPANTES:
- Inconsistencias encontradas
- Información faltante
- Documentos incompletos
- Riesgos identificados

═══════════════════════════════════════════════════════════════
8️⃣ RECOMENDACIÓN FINAL Y EVALUACIÓN
═══════════════════════════════════════════════════════════════

NIVEL DE CUMPLIMIENTO:
[APROBADO / PARCIAL / RECHAZADO]

SCORE PROPUESTO (0-100):
[Calcular score basado en: requisitos cumplidos (40%), experiencia (25%), formación (20%), habilidades (10%), declaraciones (5%)]

JUSTIFICACIÓN DE LA DECISIÓN:
- Resumen ejecutivo de por qué se aprueba, rechaza o deja pendiente
- Razones principales del veredicto
- Factores determinantes

VEREDICTO FINAL:
- APTO: [SÍ / NO]
- Razón principal: [Explicar brevemente]
- Condiciones: [Si es parcial, qué falta]

RECOMENDACIONES PARA EL COMITÉ:
- Acción recomendada: [APROBAR / RECHAZAR / SOLICITAR ADICIONALES]
- Puntos a revisar manualmente
- Documentos a verificar

SUGERENCIAS PARA EL POSTULANTE (si aplica):
- Qué puede mejorar
- Documentos que debería agregar
- Áreas de desarrollo

═══════════════════════════════════════════════════════════════

IMPORTANTE: Sé extremadamente objetivo, detallado y preciso. Cada evaluación debe estar basada en evidencia concreta de los documentos presentados. Si falta información, indícalo claramente. Si hay dudas, señálalas. El reporte debe ser útil para que el comité tome una decisión informada.
`;

  try {
    console.log('🤖 Iniciando análisis con OpenAI para postulante:', postulante.id);
    console.log('📊 Datos enviados:', {
      convocatoria: convocatoria.puesto,
      anexosCount: anexos.length,
      tieneCurriculum: !!curriculum,
      totalAnexos: postulante.totalAnexos
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // Menor temperatura para mayor consistencia
      max_tokens: 4000, // Aumentar tokens para reportes más detallados
    });

    const respuesta = completion.choices[0].message.content;
    console.log('✅ Análisis de OpenAI completado. Longitud del reporte:', respuesta?.length || 0, 'caracteres');
    
    return respuesta;
  } catch (error) {
    console.error('❌ Error en análisis de OpenAI:', error);
    // Retornar análisis básico si falla OpenAI
    return `Error al generar análisis automático: ${error.message}. 
    
RESUMEN MANUAL:
- Postulante: ${postulante.nombreCompleto || 'N/A'}
- Total de anexos: ${anexos.length}
- Convocatoria: ${convocatoria.puesto || 'N/A'}
- Requisitos: ${convocatoria.requisitos || 'No especificado'}

NOTA: Se requiere revisión manual debido a error en el análisis automático.`;
  }
}