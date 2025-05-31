const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
};

// Ruta principal: Analizar código con IA
router.post('/analizar-codigo', requireAuth, async (req, res) => {
  try {
    const { codigo, nombreArchivo, lenguajeProgramacion } = req.body;
    
    // Validar datos de entrada
    if (!codigo || !nombreArchivo) {
      return res.status(400).json({ 
        error: 'El código y el nombre del archivo son requeridos' 
      });
    }
    
    console.log(`🔍 Usuario ${req.session.user.email} analizando: ${nombreArchivo}`);
    console.log(`📝 Longitud del código: ${codigo.length} caracteres`);
    
    // Analizar código con Gemini
    const resultado = await geminiService.analizarCodigo(
      codigo, 
      nombreArchivo, 
      lenguajeProgramacion || 'auto'
    );
    
    if (!resultado.success) {
      console.error('❌ Error en análisis de Gemini:', resultado.error);
      return res.status(500).json({ 
        error: 'Error al analizar el código con IA',
        detalle: resultado.error 
      });
    }
    
    console.log('✅ Análisis completado exitosamente');
    
    // Responder con el análisis
    res.status(200).json({
      success: true,
      analisis: resultado.analisis,
      lenguaje_detectado: resultado.lenguaje_detectado,
      estadisticas: resultado.estadisticas,
      archivo: nombreArchivo,
      api_key_usada: resultado.api_key_usada
    });
    
  } catch (error) {
    console.error('❌ Error general en análisis de código:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al analizar código',
      detalle: error.message 
    });
  }
});

module.exports = router;