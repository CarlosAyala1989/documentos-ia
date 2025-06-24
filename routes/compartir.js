const express = require('express');
const router = express.Router();
const { contenidoCompartidoService, conversacionesService, mensajesService } = require('../services/db');

// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Usuario no autenticado' });
  }
};

// Compartir una conversación completa
router.post('/conversacion/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, usar_uuid } = req.body;
    const usuarioId = req.session.user.id; // Ya no necesitas el ?. porque requireAuth garantiza que existe

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    // Verificar que la conversación pertenece al usuario
    const conversacion = await conversacionesService.obtenerConversacionPorId(id);
    if (!conversacion || conversacion.usuario_id !== usuarioId) {
      return res.status(403).json({ success: false, error: 'No tienes permisos para compartir esta conversación' });
    }

    const contenidoCompartido = await contenidoCompartidoService.compartirConversacion(
      usuarioId, 
      id, 
      titulo || conversacion.titulo, 
      descripcion || conversacion.descripcion,
      usar_uuid || false
    );

    res.json({ 
      success: true, 
      contenido: contenidoCompartido,
      url_publica: `/compartido/${contenidoCompartido.slug}`
    });

  } catch (error) {
    console.error('Error al compartir conversación:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compartir una consulta individual
router.post('/consulta/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, usar_uuid } = req.body;
    const usuarioId = req.session.user.id;

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    // Verificar que el mensaje pertenece al usuario
    const mensaje = await mensajesService.obtenerMensajePorId(id);
    if (!mensaje || mensaje.usuario_id !== usuarioId) {
      return res.status(403).json({ success: false, error: 'No tienes permisos para compartir esta consulta' });
    }

    const contenidoCompartido = await contenidoCompartidoService.compartirConsulta(
      usuarioId, 
      id, 
      titulo, 
      descripcion,
      usar_uuid || false
    );

    res.json({ 
      success: true, 
      contenido: contenidoCompartido,
      url_publica: `/compartido/${contenidoCompartido.slug}`
    });

  } catch (error) {
    console.error('Error al compartir consulta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ver contenido compartido públicamente
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const contenido = await contenidoCompartidoService.obtenerContenidoCompartido(slug);
    
    if (!contenido) {
      return res.status(404).json({ success: false, error: 'Contenido no encontrado' });
    }

    let datos = { contenido };

    if (contenido.tipo_contenido === 'conversacion') {
      const mensajes = await contenidoCompartidoService.obtenerMensajesConversacionCompartida(contenido.conversacion_id);
      datos.mensajes = mensajes;
    }

    res.json({ success: true, ...datos });

  } catch (error) {
    console.error('Error al obtener contenido compartido:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener contenido compartido del usuario
router.get('/usuario/mis-compartidos', requireAuth, async (req, res) => {
  try {
    const usuarioId = req.session.user.id; // Simplificado

    const contenido = await contenidoCompartidoService.obtenerContenidoCompartidoPorUsuario(usuarioId);

    res.json({ success: true, contenido });

  } catch (error) {
    console.error('Error al obtener contenido compartido del usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dejar de compartir contenido
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.session.user.id;

    await contenidoCompartidoService.dejarDeCompartir(id, usuarioId);

    res.json({ success: true, message: 'Contenido dejado de compartir exitosamente' });

  } catch (error) {
    console.error('Error al dejar de compartir:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/editar/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, tipoSlug, nuevoSlug } = req.body;
    const usuarioId = req.session.user.id;

    if (!titulo || titulo.trim() === '') {
      return res.status(400).json({ success: false, error: 'El título es requerido' });
    }

    // Validar slug personalizado si se proporciona
    if (tipoSlug === 'nombre' && (!nuevoSlug || !/^[a-zA-Z0-9-]+$/.test(nuevoSlug))) {
      return res.status(400).json({ success: false, error: 'El nombre único debe contener solo letras, números y guiones' });
    }

    const contenidoActualizado = await contenidoCompartidoService.editarContenidoCompartido(
      id, 
      usuarioId, 
      titulo.trim(), 
      descripcion?.trim(),
      tipoSlug,
      nuevoSlug
    );

    const response = { 
      success: true, 
      contenido: contenidoActualizado,
      message: 'Contenido actualizado exitosamente'
    };
    
    // Incluir el nuevo slug en la respuesta si se generó uno
    if (contenidoActualizado.slug) {
      response.nuevoSlug = contenidoActualizado.slug;
    }

    res.json(response);

  } catch (error) {
    console.error('Error al editar contenido compartido:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;