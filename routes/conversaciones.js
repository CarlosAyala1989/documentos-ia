const express = require('express');
const router = express.Router();
const { conversacionesService, mensajesService } = require('../services/db');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
};

// Obtener historial de conversaciones del usuario
router.get('/historial', requireAuth, async (req, res) => {
  try {
    const usuarioId = req.session.user.id;
    
    // Obtener conversaciones del usuario
    const conversaciones = await conversacionesService.obtenerConversacionesPorUsuario(usuarioId);
    
    // Obtener estadísticas
    const estadisticas = await conversacionesService.obtenerEstadisticasUsuario(usuarioId);
    
    console.log(`📊 Historial de conversaciones obtenido para usuario ${req.session.user.email}: ${conversaciones.length} conversaciones`);
    
    res.status(200).json({
      success: true,
      conversaciones,
      estadisticas,
      usuario: req.session.user
    });
    
  } catch (error) {
    console.error('❌ Error al obtener historial de conversaciones:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al obtener historial de conversaciones',
      detalle: error.message 
    });
  }
});

// Crear nueva conversación
router.post('/crear', requireAuth, async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    const usuarioId = req.session.user.id;
    
    if (!titulo) {
      return res.status(400).json({ 
        success: false,
        error: 'El título es requerido' 
      });
    }
    
    const conversacionData = {
      usuario_id: usuarioId,
      titulo: titulo,
      descripcion: descripcion || '',
      estado: 'activa'
    };
    
    const conversacion = await conversacionesService.crearConversacion(conversacionData);
    
    console.log(`📝 Nueva conversación creada: ${conversacion.id} - ${titulo}`);
    
    res.status(201).json({
      success: true,
      conversacion
    });
    
  } catch (error) {
    console.error('❌ Error al crear conversación:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al crear conversación',
      detalle: error.message 
    });
  }
});

// Obtener conversación específica con sus mensajes
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const conversacionId = parseInt(req.params.id);
    const usuarioId = req.session.user.id;
    
    // Verificar que la conversación pertenece al usuario
    const conversacion = await conversacionesService.obtenerConversacionPorId(conversacionId);
    
    if (!conversacion || conversacion.usuario_id !== usuarioId) {
      return res.status(404).json({ 
        success: false,
        error: 'Conversación no encontrada' 
      });
    }
    
    // Obtener mensajes de la conversación
    const mensajes = await mensajesService.obtenerMensajesPorConversacion(conversacionId);
    
    res.status(200).json({
      success: true,
      conversacion,
      mensajes
    });
    
  } catch (error) {
    console.error('❌ Error al obtener conversación:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al obtener conversación',
      detalle: error.message 
    });
  }
});

// Agregar mensaje a conversación
router.post('/mensaje', requireAuth, async (req, res) => {
  try {
    const { conversacion_id, contenido_mensaje, tipo_mensaje, proyecto_codigo_id, documento_generado_id } = req.body;
    const usuarioId = req.session.user.id;
    
    if (!conversacion_id || !contenido_mensaje) {
      return res.status(400).json({ 
        success: false,
        error: 'ID de conversación y contenido del mensaje son requeridos' 
      });
    }
    
    // Verificar que la conversación pertenece al usuario
    const conversacion = await conversacionesService.obtenerConversacionPorId(conversacion_id);
    
    if (!conversacion || conversacion.usuario_id !== usuarioId) {
      return res.status(404).json({ 
        success: false,
        error: 'Conversación no encontrada' 
      });
    }
    
    // Obtener el siguiente número de orden
    const siguienteOrden = await mensajesService.obtenerSiguienteOrden(conversacion_id);
    
    const mensajeData = {
      conversacion_id,
      usuario_id: usuarioId,
      proyecto_codigo_id: proyecto_codigo_id || null,
      documento_generado_id: documento_generado_id || null,
      tipo_mensaje: tipo_mensaje || 'consulta',
      contenido_mensaje,
      orden_en_conversacion: siguienteOrden
    };
    
    const mensaje = await mensajesService.crearMensaje(mensajeData);
    
    // Actualizar fecha de última actualización de la conversación
    await conversacionesService.actualizarConversacion(conversacion_id, {
      actualizado_en: new Date().toISOString()
    });
    
    console.log(`💬 Nuevo mensaje agregado a conversación ${conversacion_id}`);
    
    res.status(201).json({
      success: true,
      mensaje
    });
    
  } catch (error) {
    console.error('❌ Error al agregar mensaje:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al agregar mensaje',
      detalle: error.message 
    });
  }
});

// Archivar conversación
router.put('/:id/archivar', requireAuth, async (req, res) => {
  try {
    const conversacionId = parseInt(req.params.id);
    const usuarioId = req.session.user.id;
    
    // Verificar que la conversación pertenece al usuario
    const conversacion = await conversacionesService.obtenerConversacionPorId(conversacionId);
    
    if (!conversacion || conversacion.usuario_id !== usuarioId) {
      return res.status(404).json({ 
        success: false,
        error: 'Conversación no encontrada' 
      });
    }
    
    await conversacionesService.actualizarConversacion(conversacionId, {
      estado: 'archivada',
      actualizado_en: new Date().toISOString()
    });
    
    console.log(`📦 Conversación archivada: ${conversacionId}`);
    
    res.status(200).json({
      success: true,
      message: 'Conversación archivada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error al archivar conversación:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al archivar conversación',
      detalle: error.message 
    });
  }
});

module.exports = router;