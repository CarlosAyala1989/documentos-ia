const express = require('express');
const router = express.Router();
const { usuariosService } = require('../services/db');

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
      return res.status(200).json({ user: req.session.user });
    }
    
    return res.status(401).json({ error: 'No autenticado' });
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;