const supabase = require('../config/supabase');

// Servicio para la tabla usuarios
const usuariosService = {
  // Crear un nuevo usuario con contraseña en texto plano
  async crearUsuario(userData) {
    try {
      const { email, password, nombre, apellidos = '' } = userData;
      
      const { data, error } = await supabase
        .from('usuarios')
        .insert([
          { 
            // No incluimos 'id' porque es SERIAL (auto-incremental)
            correo_electronico: email,
            contrasena: password, // Contraseña en texto plano
            nombre,
            apellidos,
            esta_activo: true,
            correo_verificado_en: new Date().toISOString(),
            creado_en: new Date().toISOString(),
            actualizado_en: new Date().toISOString()
          }
        ])
        .select();
        
      if (error) {
        console.error('Error al crear usuario en BD:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en crearUsuario:', error);
      throw error;
    }
  },
  
  // Verificar credenciales de usuario
  async verificarCredenciales(email, password) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo_electronico', email)
        .eq('contrasena', password) // Comparación directa de texto plano
        .eq('esta_activo', true)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 es "no rows returned"
        console.error('Error al verificar credenciales:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en verificarCredenciales:', error);
      throw error;
    }
  },
  
  // Verificar si el email ya existe
  async verificarEmailExiste(email) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('correo_electronico', email)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error al verificar email:', error);
        throw error;
      }
      return !!data; // Retorna true si existe, false si no
    } catch (error) {
      console.error('Error en verificarEmailExiste:', error);
      throw error;
    }
  },
  // Obtener usuario por email
  async obtenerUsuarioPorEmail(email) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo_electronico', email)
        .eq('esta_activo', true)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error al obtener usuario por email:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en obtenerUsuarioPorEmail:', error);
      throw error;
    }
  },

  // Obtener usuario por ID
  async obtenerUsuarioPorId(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error al obtener usuario:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en obtenerUsuarioPorId:', error);
      throw error;
    }
  },
  
  // Actualizar usuario
  async actualizarUsuario(id, userData) {
    try {
      const updateData = {
        ...userData,
        actualizado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en actualizarUsuario:', error);
      throw error;
    }
  },

  // Actualizar último inicio de sesión
  async actualizarUltimoInicioSesion(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ 
          ultimo_inicio_sesion_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        })
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Error al actualizar último inicio de sesión:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en actualizarUltimoInicioSesion:', error);
      throw error;
    }
  },

  // Actualizar información adicional del usuario
  async actualizarInformacionAdicional(id, datos) {
    try {
      const updateData = {
        ...datos,
        actualizado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Error al actualizar información adicional:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en actualizarInformacionAdicional:', error);
      throw error;
    }
  }
};

// Servicio para la tabla proyectos_codigo
const proyectosService = {
  // Crear un nuevo proyecto
  async crearProyecto(proyectoData) {
    try {
      const dataWithTimestamps = {
        // No incluimos 'id' porque es SERIAL (auto-incremental)
        ...proyectoData,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('proyectos_codigo')
        .insert([dataWithTimestamps])
        .select();
        
      if (error) {
        console.error('Error al crear proyecto:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en crearProyecto:', error);
      throw error;
    }
  },
  
  // Obtener proyectos de un usuario
  async obtenerProyectosPorUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('proyectos_codigo')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('creado_en', { ascending: false });
        
      if (error) {
        console.error('Error al obtener proyectos:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error en obtenerProyectosPorUsuario:', error);
      throw error;
    }
  },
  
  // Obtener un proyecto específico
  async obtenerProyectoPorId(id) {
    try {
      const { data, error } = await supabase
        .from('proyectos_codigo')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error al obtener proyecto por ID:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en obtenerProyectoPorId:', error);
      throw error;
    }
  },
  
  // Actualizar estado de procesamiento
  async actualizarEstadoProcesamiento(id, estado) {
    try {
      const { data, error } = await supabase
        .from('proyectos_codigo')
        .update({ 
          estado_procesamiento: estado, 
          ultimo_analisis_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        })
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Error al actualizar estado:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en actualizarEstadoProcesamiento:', error);
      throw error;
    }
  },
  
  // Actualizar proyecto con información completa
  async actualizarProyecto(id, proyectoData) {
    try {
      const updateData = {
        ...proyectoData,
        actualizado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('proyectos_codigo')
        .update(updateData)
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Error al actualizar proyecto:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en actualizarProyecto:', error);
      throw error;
    }
  },

  // Obtener proyectos con información del usuario
  async obtenerProyectosConUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('proyectos_codigo')
        .select(`
          *,
          usuarios!fk_proyecto_usuario(
            id,
            correo_electronico,
            nombre,
            apellidos,
            nombre_completo
          )
        `)
        .eq('usuario_id', usuarioId)
        .order('creado_en', { ascending: false });
        
      if (error) {
        console.error('Error al obtener proyectos con usuario:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error en obtenerProyectosConUsuario:', error);
      throw error;
    }
  }
};

// Servicio para la tabla documentos_generados
const documentosService = {
  // Crear un nuevo documento generado
  async crearDocumento(documentoData) {
    try {
      const dataWithTimestamps = {
        // No incluimos 'id' porque es SERIAL (auto-incremental)
        ...documentoData,
        generado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('documentos_generados')
        .insert([dataWithTimestamps])
        .select();
        
      if (error) {
        console.error('Error al crear documento:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en crearDocumento:', error);
      throw error;
    }
  },
  
  // Obtener documentos de un proyecto
  async obtenerDocumentosPorProyecto(proyectoId) {
    try {
      const { data, error } = await supabase
        .from('documentos_generados')
        .select('*')
        .eq('proyecto_codigo_id', proyectoId)
        .order('generado_en', { ascending: false });
        
      if (error) {
        console.error('Error al obtener documentos:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error en obtenerDocumentosPorProyecto:', error);
      throw error;
    }
  },
  
  // Obtener un documento específico
  async obtenerDocumentoPorId(id) {
    try {
      const { data, error } = await supabase
        .from('documentos_generados')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error al obtener documento por ID:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en obtenerDocumentoPorId:', error);
      throw error;
    }
  },

  // Actualizar documento
  async actualizarDocumento(id, documentoData) {
    try {
      const updateData = {
        ...documentoData,
        actualizado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('documentos_generados')
        .update(updateData)
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Error al actualizar documento:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en actualizarDocumento:', error);
      throw error;
    }
  },
  async obtenerDocumentosPorUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('documentos_generados')
        .select(`
          *,
          proyectos_codigo!fk_documento_proyecto(
            id,
            nombre_proyecto,
            descripcion,
            estado_procesamiento
          )
        `)
        .eq('usuario_id', usuarioId)
        .order('generado_en', { ascending: false });
        
      if (error) {
        console.error('Error al obtener documentos por usuario:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error en obtenerDocumentosPorUsuario:', error);
      throw error;
    }
  }
};


const conversacionesService = {
  // Crear una nueva conversación
  async crearConversacion(conversacionData) {
    try {
      const dataWithTimestamps = {
        ...conversacionData,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('conversaciones')
        .insert([dataWithTimestamps])
        .select();
        
      if (error) {
        console.error('Error al crear conversación en BD:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en crearConversacion:', error);
      throw error;
    }
  },
  
  // Obtener conversaciones por usuario
  async obtenerConversacionesPorUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('conversaciones')
        .select(`
          *,
          mensajes_count:mensajes_conversacion(count)
        `)
        .eq('usuario_id', usuarioId)
        .order('actualizado_en', { ascending: false });
        
      if (error) {
        console.error('Error al obtener conversaciones:', error);
        throw error;
      }
      
      // Procesar datos para agregar conteo de mensajes
      return data.map(conversacion => ({
        ...conversacion,
        total_mensajes: conversacion.mensajes_count?.[0]?.count || 0
      }));
    } catch (error) {
      console.error('Error en obtenerConversacionesPorUsuario:', error);
      throw error;
    }
  },
  
  // Obtener conversación por ID
  async obtenerConversacionPorId(id) {
    try {
      const { data, error } = await supabase
        .from('conversaciones')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error al obtener conversación:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en obtenerConversacionPorId:', error);
      throw error;
    }
  },
  
  // Actualizar conversación
  async actualizarConversacion(id, updateData) {
    try {
      const dataWithTimestamp = {
        ...updateData,
        actualizado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('conversaciones')
        .update(dataWithTimestamp)
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Error al actualizar conversación:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en actualizarConversacion:', error);
      throw error;
    }
  },
  
  // Obtener estadísticas de conversaciones del usuario
  async obtenerEstadisticasUsuario(usuarioId) {
    try {
      // Total de conversaciones
      const { count: totalConversaciones } = await supabase
        .from('conversaciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId);
      
      // Conversaciones activas
      const { count: conversacionesActivas } = await supabase
        .from('conversaciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .eq('estado', 'activa');
      
      // Conversaciones de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const { count: conversacionesHoy } = await supabase
        .from('conversaciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .gte('creado_en', hoy + 'T00:00:00.000Z')
        .lt('creado_en', hoy + 'T23:59:59.999Z');
      
      // Total de mensajes
      const { count: totalMensajes } = await supabase
        .from('mensajes_conversacion')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId);
      
      return {
        total_conversaciones: totalConversaciones || 0,
        conversaciones_activas: conversacionesActivas || 0,
        conversaciones_hoy: conversacionesHoy || 0,
        total_mensajes: totalMensajes || 0
      };
    } catch (error) {
      console.error('Error en obtenerEstadisticasUsuario:', error);
      throw error;
    }
  }
};

const mensajesService = {
  // Crear un nuevo mensaje
  async crearMensaje(mensajeData) {
    try {
      const dataWithTimestamp = {
        ...mensajeData,
        creado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('mensajes_conversacion')
        .insert([dataWithTimestamp])
        .select();
        
      if (error) {
        console.error('Error al crear mensaje en BD:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en crearMensaje:', error);
      throw error;
    }
  },
  
  // Obtener mensajes por conversación
  async obtenerMensajesPorConversacion(conversacionId) {
    try {
      const { data, error } = await supabase
        .from('mensajes_conversacion')
        .select('*')
        .eq('conversacion_id', conversacionId)
        .order('orden_en_conversacion', { ascending: true });
        
      if (error) {
        console.error('Error al obtener mensajes:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en obtenerMensajesPorConversacion:', error);
      throw error;
    }
  },
  
  async obtenerMensajePorId(id) {
    try {
      const { data, error } = await supabase
        .from('mensajes_conversacion')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error al obtener mensaje por ID:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en obtenerMensajePorId:', error);
      throw error;
    }
  },

  // Obtener siguiente número de orden para una conversación
  async obtenerSiguienteOrden(conversacionId) {
    try {
      const { data, error } = await supabase
        .from('mensajes_conversacion')
        .select('orden_en_conversacion')
        .eq('conversacion_id', conversacionId)
        .order('orden_en_conversacion', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error al obtener siguiente orden:', error);
        throw error;
      }
      
      return data.length > 0 ? data[0].orden_en_conversacion + 1 : 1;
    } catch (error) {
      console.error('Error en obtenerSiguienteOrden:', error);
      throw error;
    }
  }
};

const contenidoCompartidoService = {
  async editarContenidoCompartido(id, usuarioId, titulo, descripcion, tipoSlug = 'mantener', nuevoSlug = null) {
    try {
      // Verificar que el contenido pertenece al usuario
      const contenidoExistente = await this.pool.query(
        'SELECT * FROM contenido_compartido WHERE id = ? AND usuario_id = ?',
        [id, usuarioId]
      );
      
      if (contenidoExistente.length === 0) {
        throw new Error('Contenido no encontrado o no tienes permisos para editarlo');
      }
      
      let slugFinal = contenidoExistente[0].slug; // Mantener el slug actual por defecto
      
      // Generar nuevo slug según el tipo seleccionado
      if (tipoSlug === 'uuid') {
        slugFinal = this.generarUUID();
      } else if (tipoSlug === 'nombre' && nuevoSlug) {
        // Verificar que el slug personalizado no esté en uso
        const slugExistente = await this.pool.query(
          'SELECT id FROM contenido_compartido WHERE slug = ? AND id != ?',
          [nuevoSlug, id]
        );
        
        if (slugExistente.length > 0) {
          throw new Error('El nombre único ya está en uso. Por favor, elige otro.');
        }
        
        slugFinal = nuevoSlug;
      }
      
      // Actualizar el contenido
      await this.pool.query(
        'UPDATE contenido_compartido SET titulo = ?, descripcion = ?, slug = ? WHERE id = ? AND usuario_id = ?',
        [titulo, descripcion, slugFinal, id, usuarioId]
      );
      
      // Retornar el contenido actualizado
      const contenidoActualizado = await this.pool.query(
        'SELECT * FROM contenido_compartido WHERE id = ? AND usuario_id = ?',
        [id, usuarioId]
      );
      
      return contenidoActualizado[0];
      
    } catch (error) {
      console.error('Error en editarContenidoCompartido:', error);
      throw error;
    }
  },
  // Compartir una conversación completa
  async compartirConversacion(usuarioId, conversacionId, titulo, descripcion, usarUUID = false) {
    try {
      let slug;
      
      if (usarUUID) {
        // Generar UUID único
        slug = generarUUID();
      } else {
        // Usar título personalizado con verificación global
        if (await verificarSlugExiste(titulo.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'))) {
          throw new Error('Este nombre ya está siendo usado por otro usuario. Por favor, elige un nombre diferente.');
        }
        slug = await this.generarSlugUnico(titulo);
      }
      
      async function verificarSlugExiste(slug) {
        try {
          const { data, error } = await supabase
            .from('contenido_compartido')
            .select('id')
            .eq('slug', slug)
            .single();
            
          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          return !!data; // Retorna true si existe, false si no
        } catch (error) {
          console.error('Error en verificarSlugExiste:', error);
          throw error;
        }
      }

      const { data, error } = await supabase
        .from('contenido_compartido')
        .insert([{
          usuario_id: usuarioId,
          tipo_contenido: 'conversacion',
          conversacion_id: conversacionId,
          slug: slug,
          titulo: titulo,
          descripcion: descripcion,
          compartido_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        }])
        .select();
        
      if (error) {
        console.error('Error al compartir conversación:', error);
        throw error;
      }
      
      // Marcar conversación como compartida
      await supabase
        .from('conversaciones')
        .update({ es_compartida: true })
        .eq('id', conversacionId);
        
      return data[0];
    } catch (error) {
      console.error('Error en compartirConversacion:', error);
      throw error;
    }
  },

  // Compartir una consulta individual
  async compartirConsulta(usuarioId, mensajeId, titulo, descripcion, usarUUID = false) {
    try {
      let slug;
      
      if (usarUUID) {
        // Generar UUID único
        slug = generarUUID();
      } else {
        // Usar título personalizado con verificación global
        if (await verificarSlugExiste(titulo.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'))) {
          throw new Error('Este nombre ya está siendo usado por otro usuario. Por favor, elige un nombre diferente.');
        }
        slug = await this.generarSlugUnico(titulo);
      }
      
      const { data, error } = await supabase
        .from('contenido_compartido')
        .insert([{
          usuario_id: usuarioId,
          tipo_contenido: 'consulta',
          mensaje_id: mensajeId,
          slug: slug,
          titulo: titulo,
          descripcion: descripcion,
          compartido_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString()
        }])
        .select();
        
      if (error) {
        console.error('Error al compartir consulta:', error);
        throw error;
      }
      
      // Marcar mensaje como compartido
      await supabase
        .from('mensajes_conversacion')
        .update({ es_compartido: true })
        .eq('id', mensajeId);
        
      return data[0];
    } catch (error) {
      console.error('Error en compartirConsulta:', error);
      throw error;
    }
  },

  // Obtener contenido compartido por slug
  async obtenerContenidoCompartido(slug) {
    try {
      const { data, error } = await supabase
        .from('contenido_compartido')
        .select(`
          *,
          usuario:usuarios(nombre, apellidos),
          conversacion:conversaciones(*),
          mensaje:mensajes_conversacion(*)
        `)
        .eq('slug', slug)
        .eq('es_publico', true)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error al obtener contenido compartido:', error);
        throw error;
      }
      
      // Incrementar contador de vistas
      if (data) {
        await supabase
          .from('contenido_compartido')
          .update({ vistas: data.vistas + 1 })
          .eq('id', data.id);
      }
      
      return data;
    } catch (error) {
      console.error('Error en obtenerContenidoCompartido:', error);
      throw error;
    }
  },

  // Obtener mensajes de conversación compartida
  async obtenerMensajesConversacionCompartida(conversacionId) {
    try {
      const { data, error } = await supabase
        .from('mensajes_conversacion')
        .select('*')
        .eq('conversacion_id', conversacionId)
        .order('orden_en_conversacion', { ascending: true });
        
      if (error) {
        console.error('Error al obtener mensajes de conversación compartida:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en obtenerMensajesConversacionCompartida:', error);
      throw error;
    }
  },

  // Generar slug único
  async generarSlugUnico(titulo) {
    const baseSlug = titulo
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    let slug = baseSlug;
    let contador = 1;
    
    while (true) {
      const { data } = await supabase
        .from('contenido_compartido')
        .select('id')
        .eq('slug', slug)
        .single();
        
      if (!data) break;
      
      slug = `${baseSlug}-${contador}`;
      contador++;
    }
    
    return slug;
  },

  // Obtener contenido compartido por usuario
  async obtenerContenidoCompartidoPorUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('contenido_compartido')
        .select(`
          *,
          conversacion:conversaciones(titulo),
          mensaje:mensajes_conversacion(contenido_mensaje)
        `)
        .eq('usuario_id', usuarioId)
        .order('compartido_en', { ascending: false });
        
      if (error) {
        console.error('Error al obtener contenido compartido por usuario:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en obtenerContenidoCompartidoPorUsuario:', error);
      throw error;
    }
  },

  // Dejar de compartir contenido
  async dejarDeCompartir(id, usuarioId) {
    try {
      const { data, error } = await supabase
        .from('contenido_compartido')
        .delete()
        .eq('id', id)
        .eq('usuario_id', usuarioId)
        .select();
        
      if (error) {
        console.error('Error al dejar de compartir:', error);
        throw error;
      }
      return data[0];
    } catch (error) {
      console.error('Error en dejarDeCompartir:', error);
      throw error;
    }
  }
};

function generarUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}



module.exports = {
  usuariosService,
  proyectosService,
  documentosService,
  conversacionesService,
  mensajesService,
  contenidoCompartidoService
};