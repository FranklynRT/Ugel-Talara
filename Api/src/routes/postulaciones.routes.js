import express from 'express';
import { registrarPostulacion, obtenerPostulacionesUsuario, anularPostulacion } from '../controllers/postulaciones.js';
import { verifyToken } from '../authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, registrarPostulacion);
router.get('/usuario/:userId', verifyToken, obtenerPostulacionesUsuario);
router.patch('/:postulacionId/anular', verifyToken, anularPostulacion);

export default router;

