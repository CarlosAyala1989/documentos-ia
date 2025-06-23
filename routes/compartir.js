const express = require('express');
const router = express.Router();
const { contenidoCompartidoService, conversacionesService, mensajesService } = require('../services/db');

// Compartir una conversación completa
router.post('/conversacion/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, usar_uuid } = req.body;
    const usuarioId = req.session.user?.id;

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
router.post('/consulta/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, usar_uuid } = req.body;
    const usuarioId = req.session.user?.id;

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
router.get('/usuario/mis-compartidos', async (req, res) => {
  try {
    const usuarioId = req.session.user?.id; // Cambiado de usuario a user

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    const contenido = await contenidoCompartidoService.obtenerContenidoCompartidoPorUsuario(usuarioId);

    res.json({ success: true, contenido });

  } catch (error) {
    console.error('Error al obtener contenido compartido del usuario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dejar de compartir contenido
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.session.user?.id; // Cambiado de usuario a user

    if (!usuarioId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    await contenidoCompartidoService.dejarDeCompartir(id, usuarioId);

    res.json({ success: true, message: 'Contenido dejado de compartir exitosamente' });

  } catch (error) {
    console.error('Error al dejar de compartir:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;