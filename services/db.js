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





module.exports = {
  usuariosService,
  proyectosService,
  documentosService
};

