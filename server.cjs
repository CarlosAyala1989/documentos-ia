const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno antes que cualquier otra cosa
dotenv.config();

console.log('🚀 Iniciando servidor DocuGen...');
console.log('📁 Variables de entorno cargadas');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware básico
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'docugen-fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    httpOnly: true
  }
}));

// Middleware para logging de sesiones
app.use((req, res, next) => {
  if (req.session.user) {
    console.log(`👤 Usuario autenticado: ${req.session.user.email}`);
  }
  next();
});

// Importar rutas
const authRoutes = require('./routes/auth');
const proyectosRoutes = require('./routes/proyectos');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/proyectos', proyectosRoutes);

// Ruta para la página de inicio de sesión
app.get('/login', (req, res) => {
  console.log('📄 Sirviendo página de login');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Middleware para proteger rutas
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    console.log(`✅ Acceso autorizado para: ${req.session.user.email}`);
    next();
  } else {
    console.log('❌ Acceso denegado - redirigiendo a login');
    res.redirect('/login');
  }
};

// Proteger la ruta principal
app.get('/', requireAuth, (req, res) => {
  console.log('📄 Sirviendo página principal');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'DocuGen API'
  });
});

// Manejo de errores 404
app.use((req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores generales
app.use((error, req, res, next) => {
  console.error('❌ Error en el servidor:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🌟 ================================');
  console.log(`🚀 Servidor DocuGen corriendo en http://localhost:${PORT}`);
  console.log('🔐 Página de login: http://localhost:${PORT}/login');
  console.log('🏠 Página principal: http://localhost:${PORT}');
  console.log('💾 Base de datos: Supabase');
  console.log('🌟 ================================');
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});
