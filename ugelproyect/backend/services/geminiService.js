const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI("AIzaSyAkZPbvGH3O8r8Sr_oeuoSNOfTWcnn_7rQ");
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Analiza un documento y extrae información relevante
   */
  async analyzeDocument(documentPath, documentType = 'cv') {
    try {
      console.log(`🔍 Analizando documento: ${documentPath}`);
      
      // Leer el archivo
      const fileBuffer = fs.readFileSync(documentPath);
      const fileExtension = path.extname(documentPath).toLowerCase();
      
      let prompt = '';
      
      if (documentType === 'cv') {
        prompt = `
Analiza este currículum vitae y extrae la siguiente información en formato JSON:

{
  "nombre_completo": "Nombre completo del candidato",
  "email": "Correo electrónico",
  "telefono": "Número de teléfono",
  "experiencia_anos": "Años de experiencia total",
  "educacion": ["Títulos académicos obtenidos"],
  "experiencia_laboral": [
    {
      "empresa": "Nombre de la empresa",
      "puesto": "Puesto ocupado",
      "periodo": "Período de trabajo",
      "responsabilidades": ["Lista de responsabilidades"]
    }
  ],
  "habilidades_tecnicas": ["Lista de habilidades técnicas"],
  "certificaciones": ["Certificaciones obtenidas"],
  "idiomas": ["Idiomas y nivel"],
  "logros": ["Logros destacados"],
  "calificacion_general": "Calificación del 1 al 10",
  "fortalezas": ["Principales fortalezas"],
  "areas_mejora": ["Áreas de mejora"],
  "recomendacion": "Recomendación final (aprobado/rechazado/pendiente)"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
        `;
      } else {
        prompt = `
Analiza este documento anexo y extrae información relevante en formato JSON:

{
  "tipo_documento": "Tipo de documento",
  "informacion_relevante": "Información importante encontrada",
  "fecha_emision": "Fecha de emisión si está disponible",
  "institucion": "Institución emisora",
  "validez": "Si el documento es válido",
  "observaciones": "Observaciones adicionales"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
        `;
      }

      // Configurar el contenido según el tipo de archivo
      let content;
      if (fileExtension === '.pdf') {
        // Para PDFs, necesitamos convertirlos a texto primero
        content = {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: fileBuffer.toString('base64')
              }
            }
          ]
        };
      } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
        // Para imágenes
        content = {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: `image/${fileExtension.substring(1)}`,
                data: fileBuffer.toString('base64')
              }
            }
          ]
        };
      } else {
        // Para archivos de texto
        const textContent = fileBuffer.toString('utf-8');
        content = {
          parts: [
            { text: `${prompt}\n\nContenido del archivo:\n${textContent}` }
          ]
        };
      }

      const result = await this.model.generateContent(content);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Análisis completado por Gemini');
      
      // Intentar parsear el JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido en la respuesta');
        }
      } catch (parseError) {
        console.error('Error al parsear JSON:', parseError);
        return {
          error: 'Error al procesar la respuesta de Gemini',
          raw_response: text
        };
      }
      
    } catch (error) {
      console.error('❌ Error en análisis de documento:', error);
      throw new Error(`Error al analizar documento: ${error.message}`);
    }
  }

  /**
   * Genera un reporte completo del candidato
   */
  async generateCandidateReport(candidateData, documents = []) {
    try {
      console.log('📊 Generando reporte completo del candidato...');
      
      const prompt = `
Genera un reporte profesional completo del candidato basado en la siguiente información:

DATOS DEL CANDIDATO:
${JSON.stringify(candidateData, null, 2)}

DOCUMENTOS ANALIZADOS:
${JSON.stringify(documents, null, 2)}

Genera un reporte en formato JSON con la siguiente estructura:

{
  "resumen_ejecutivo": "Resumen de 2-3 párrafos del candidato",
  "calificacion_general": "Calificación del 1 al 10",
  "fortalezas_principales": ["Lista de fortalezas principales"],
  "areas_mejora": ["Áreas que necesita mejorar"],
  "experiencia_relevante": "Descripción detallada de la experiencia",
  "habilidades_clave": ["Habilidades más importantes"],
  "recomendaciones": "Recomendaciones específicas",
  "estado_evaluacion": "approved/rejected/pending",
  "probabilidad_exito": "Porcentaje de probabilidad de éxito",
  "siguientes_pasos": ["Pasos recomendados para el proceso"],
  "observaciones_finales": "Observaciones adicionales del evaluador IA"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Reporte generado por Gemini');
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido en la respuesta');
        }
      } catch (parseError) {
        console.error('Error al parsear JSON del reporte:', parseError);
        return {
          error: 'Error al procesar el reporte de Gemini',
          raw_response: text
        };
      }
      
    } catch (error) {
      console.error('❌ Error al generar reporte:', error);
      throw new Error(`Error al generar reporte: ${error.message}`);
    }
  }

  /**
   * Verifica la autenticidad de un documento
   */
  async verifyDocument(documentPath, documentType) {
    try {
      console.log(`🔍 Verificando autenticidad de: ${documentPath}`);
      
      const prompt = `
Analiza este documento para verificar su autenticidad y validez:

TIPO DE DOCUMENTO: ${documentType}

Verifica:
1. Consistencia en la información
2. Posibles inconsistencias o errores
3. Calidad del documento
4. Elementos que indiquen autenticidad

Responde en formato JSON:

{
  "es_autentico": true/false,
  "nivel_confianza": "alto/medio/bajo",
  "inconsistencias_encontradas": ["Lista de inconsistencias"],
  "elementos_validos": ["Elementos que confirman autenticidad"],
  "recomendaciones": "Recomendaciones para verificación adicional",
  "calificacion_veracidad": "Calificación del 1 al 10"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
      `;

      const fileBuffer = fs.readFileSync(documentPath);
      const fileExtension = path.extname(documentPath).toLowerCase();
      
      let content;
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension)) {
        content = {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: `image/${fileExtension.substring(1)}`,
                data: fileBuffer.toString('base64')
              }
            }
          ]
        };
      } else {
        const textContent = fileBuffer.toString('utf-8');
        content = {
          parts: [
            { text: `${prompt}\n\nContenido del archivo:\n${textContent}` }
          ]
        };
      }

      const result = await this.model.generateContent(content);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Verificación completada por Gemini');
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido en la respuesta');
        }
      } catch (parseError) {
        console.error('Error al parsear JSON de verificación:', parseError);
        return {
          error: 'Error al procesar la verificación de Gemini',
          raw_response: text
        };
      }
      
    } catch (error) {
      console.error('❌ Error en verificación de documento:', error);
      throw new Error(`Error al verificar documento: ${error.message}`);
    }
  }

  /**
   * Genera análisis comparativo entre candidatos
   */
  async generateComparativeAnalysis(candidates) {
    try {
      console.log('📊 Generando análisis comparativo...');
      
      const prompt = `
Analiza y compara los siguientes candidatos para generar un ranking y recomendaciones:

CANDIDATOS:
${JSON.stringify(candidates, null, 2)}

Genera un análisis comparativo en formato JSON:

{
  "ranking_candidatos": [
    {
      "candidato_id": "ID del candidato",
      "posicion": 1,
      "puntuacion": "Puntuación del 1 al 10",
      "razones_destacadas": ["Razones por las que destaca"],
      "fortalezas_unicas": ["Fortalezas que lo distinguen"]
    }
  ],
  "analisis_general": "Análisis general de todos los candidatos",
  "recomendacion_final": "Recomendación sobre quién seleccionar",
  "criterios_evaluacion": ["Criterios utilizados para la evaluación"],
  "observaciones": "Observaciones adicionales del análisis"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Análisis comparativo generado por Gemini');
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se encontró JSON válido en la respuesta');
        }
      } catch (parseError) {
        console.error('Error al parsear JSON del análisis comparativo:', parseError);
        return {
          error: 'Error al procesar el análisis comparativo de Gemini',
          raw_response: text
        };
      }
      
    } catch (error) {
      console.error('❌ Error en análisis comparativo:', error);
      throw new Error(`Error al generar análisis comparativo: ${error.message}`);
    }
  }
}

module.exports = GeminiService;
