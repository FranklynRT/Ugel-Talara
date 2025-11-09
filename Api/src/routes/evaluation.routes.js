import express from 'express';
// import EvaluationController from '../controllers/evaluationController.js';
import { verifyToken as authMiddleware } from '../authMiddleware.js';

const router = express.Router();

/**
 * Rutas para Evaluación Automática CAS
 * Rutas comentadas temporalmente - archivo evaluationController.js está vacío
 */

// router.post('/evaluar/:convocatoriaId/:postulanteId', 
//   authMiddleware, 
//   EvaluationController.evaluarPostulante
// );

// router.post('/evaluar-convocatoria/:convocatoriaId', 
//   authMiddleware, 
//   EvaluationController.evaluarConvocatoriaCompleta
// );

// router.get('/reporte/:convocatoriaId/:postulanteId', 
//   authMiddleware, 
//   EvaluationController.obtenerReporteEvaluacion
// );

// router.get('/reporte-pdf/:convocatoriaId', 
//   authMiddleware, 
//   EvaluationController.generarReportePDF
// );

// router.get('/estadisticas/:convocatoriaId', 
//   authMiddleware, 
//   EvaluationController.obtenerEstadisticasEvaluaciones
// );

export default router;
