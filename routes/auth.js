const express = require('express');
const router = express.Router();
const { usuariosService } = require('../services/db');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
};

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, apellidos = '' } = req.body;
    
    // Validar datos
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }
    
    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    console.log('Iniciando registro para:', email);
    
    // Verificar si el email ya existe
    const emailExiste = await usuariosService.verificarEmailExiste(email);
    if (emailExiste) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    // Crear usuario en la base de datos
    const nuevoUsuario = await usuariosService.crearUsuario({
      email,
      password, // Contraseña en texto plano
      nombre: name,
      apellidos: apellidos
    });
    
    console.log('Usuario creado:', nuevoUsuario.id);
    
    return res.status(201).json({ 
      message: 'Usuario registrado correctamente', 
      user: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.correo_electronico,
        nombre: nuevoUsuario.nombre,
        apellidos: nuevoUsuario.apellidos
      }
    });
  } catch (error) {
    console.error('Error general en registro:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar datos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    
    console.log('Intento de login para:', email);
    
    // Verificar credenciales
    const usuario = await usuariosService.verificarCredenciales(email, password);
    
    if (!usuario) {
      console.log('Credenciales inválidas para:', email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    console.log('Login exitoso para:', usuario.correo_electronico);
    
    // Actualizar último inicio de sesión
    try {
      await usuariosService.actualizarUsuario(usuario.id, {
        ultimo_inicio_sesion_en: new Date().toISOString()
      });
    } catch (updateError) {
      console.error('Error al actualizar último inicio de sesión:', updateError);
    }
    
    // Crear objeto de usuario para la sesión
    const sessionUser = {
      id: usuario.id,
      email: usuario.correo_electronico,
      nombre: usuario.nombre || 'Usuario',
      apellidos: usuario.apellidos || '',
      esta_activo: usuario.esta_activo !== false
    };
    
    // Calcular nombre completo
    sessionUser.nombre_completo = `${sessionUser.nombre} ${sessionUser.apellidos}`.trim();
    
    // Guardar información del usuario en la sesión
    req.session.user = sessionUser;
    
    console.log('Sesión creada para:', sessionUser.email);
    
    return res.status(200).json({ 
      message: 'Inicio de sesión exitoso', 
      user: sessionUser 
    });
  } catch (error) {
    console.error('Error general en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cerrar sesión
router.post('/logout', async (req, res) => {
  try {
    console.log('Cerrando sesión para usuario:', req.session.user?.email);
    
    // Destruir sesión
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al destruir sesión:', err);
        return res.status(500).json({ error: 'Error al cerrar sesión' });
      }
      res.clearCookie('connect.sid');
      console.log('Sesión cerrada correctamente');
      return res.status(200).json({ message: 'Sesión cerrada correctamente' });
    });
  } catch (error) {
    console.error('Error general al cerrar sesión:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar si el usuario está autenticado
router.get('/user', async (req, res) => {
  try {
    if (req.session.user) {
      console.log('Usuario autenticado desde sesión:', req.session.user.email);
      return res.status(200).json({ 
        success: true,
        user: req.session.user 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      error: 'No autenticado' 
    });
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Verificar si el email existe en la base de datos
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }
    
    // Verificar si el email existe en la base de datos
    const emailExists = await usuariosService.verificarEmailExiste(email);
    
    if (!emailExists) {
      return res.status(404).json({ error: 'No existe una cuenta con este email' });
    }
    
    res.json({ message: 'Email verificado correctamente' });
    
  } catch (error) {
    console.error('Error al verificar email:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar contraseña
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email y nueva contraseña son requeridos' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    // Verificar que el email existe
    const emailExists = await usuariosService.verificarEmailExiste(email);
    
    if (!emailExists) {
      return res.status(404).json({ error: 'No existe una cuenta con este email' });
    }
    
    // Obtener el usuario por email
    const usuario = await usuariosService.obtenerUsuarioPorEmail(email);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Actualizar la contraseña
    await usuariosService.actualizarUsuario(usuario.id, {
      contrasena: newPassword // Guardamos en texto plano como en el sistema actual
    });
    
    res.json({ message: 'Contraseña actualizada correctamente' });
    
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para actualizar perfil de usuario
router.put('/update-profile', requireAuth, async (req, res) => {
  try {
    const { nombre, apellidos, correo_electronico, contrasena_actual, nueva_contrasena } = req.body;
    const usuarioId = req.session.user.id;
    
    // Validaciones básicas
    if (!nombre || !correo_electronico) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre y correo electrónico son requeridos' 
      });
    }
    
    // Si se quiere cambiar la contraseña, verificar la actual
    if (nueva_contrasena) {
      if (!contrasena_actual) {
        return res.status(400).json({ 
          success: false, 
          error: 'Contraseña actual requerida para cambiar contraseña' 
        });
      }
      
      // Verificar contraseña actual
      const usuarioActual = await usuariosService.obtenerUsuarioPorId(usuarioId);
      if (!usuarioActual || usuarioActual.contrasena !== contrasena_actual) {
        return res.status(400).json({ 
          success: false, 
          error: 'Contraseña actual incorrecta' 
        });
      }
    }
    
    // Preparar datos de actualización
    const datosActualizacion = {
      nombre,
      apellidos,
      correo_electronico
    };
    
    // Agregar nueva contraseña si se proporcionó
    if (nueva_contrasena) {
      datosActualizacion.contrasena = nueva_contrasena;
    }
    
    // Actualizar usuario
    const usuarioActualizado = await usuariosService.actualizarUsuario(usuarioId, datosActualizacion);
    
    // Actualizar sesión
    req.session.user = {
      ...req.session.user,
      nombre: usuarioActualizado.nombre,
      apellidos: usuarioActualizado.apellidos,
      correo_electronico: usuarioActualizado.correo_electronico
    };
    
    res.json({ 
      success: true, 
      message: 'Perfil actualizado correctamente',
      user: usuarioActualizado
    });
    
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router;