# documentos-ia

# DocuGen AI - Analizador de Código con Inteligencia Artificial
## 📋 Descripción
DocuGen AI es una aplicación web que utiliza inteligencia artificial (Google Gemini) para analizar código fuente y generar documentación automática. La aplicación permite a los usuarios subir archivos de código, proyectos completos o documentos PDF personalizados para obtener análisis detallados y documentación SRS (Especificación de Requisitos de Software).

## ✨ Características Principales
- Análisis de Código Individual : Analiza archivos de código individuales con estadísticas detalladas
- Documentación SRS : Genera documentación completa de Especificación de Requisitos de Software
- Documento Personalizado : Completa documentos PDF personalizados basándose en el análisis del código
- Diagramas UML y Mermaid : Genera diagramas de arquitectura y flujo
- Múltiples Lenguajes : Soporte para diversos lenguajes de programación
- Sistema de Autenticación : Registro y login de usuarios
- Historial de Consultas : Guarda y gestiona el historial de análisis
- Exportación : Descarga resultados en formato TXT, PDF y Markdown
- Compartir Contenido : Funcionalidad para compartir análisis y conversaciones
## 🛠️ Tecnologías Utilizadas
### Backend
- Node.js con Express.js
- Google Gemini AI para análisis de código
- Supabase como base de datos PostgreSQL
- Multer para manejo de archivos
- PDF-Parse para procesamiento de PDFs
- Express-Session para manejo de sesiones
### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 5 para diseño responsivo
- Font Awesome para iconos
### Dependencias Principales
- @google/generative-ai : Integración con Gemini AI
- @supabase/supabase-js : Cliente de Supabase
- express : Framework web
- multer : Manejo de archivos
- pdf-parse : Procesamiento de PDFs
- dotenv : Variables de entorno
## 📦 Instalación Local
### Prerrequisitos
1. Node.js (versión 16 o superior)
   
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: node --version
2. npm (incluido con Node.js)
   
   - Verificar instalación: npm --version
3. Cuenta de Google AI Studio
   
   - Crear cuenta en: https://makersuite.google.com/
   - Obtener API Keys de Gemini
4. Cuenta de Supabase
   
   - Crear cuenta en: https://supabase.com/
   - Crear un nuevo proyecto
   - Obtener URL y API Key del proyecto
### Pasos de Instalación 1. Clonar o Descargar el Proyecto
```
# Si tienes git instalado
git clone <url-del-repositorio>
cd documentos-ia

# O descargar y extraer el ZIP del 
proyecto
``` 2. Instalar Dependencias
```
npm install
``` 3. Configurar Variables de Entorno
Crear un archivo .env en la raíz del proyecto con el siguiente contenido:

```
# Puerto del servidor (opcional, por 
defecto 3000)
PORT=3000

# Clave secreta para sesiones (cambiar 
por una clave segura)
SESSION_SECRET=tu-clave-secreta-muy-segu
ra-aqui

# Configuración de Supabase
SUPABASE_URL=https://tu-proyecto.
supabase.co
SUPABASE_KEY=tu-supabase-anon-key

# API Keys de Google Gemini (puedes 
usar hasta 4 keys para mayor 
disponibilidad)
API_KEY_1=tu-primera-api-key-de-gemini
API_KEY_2=tu-segunda-api-key-de-gemini
API_KEY_3=tu-tercera-api-key-de-gemini
API_KEY_4=tu-cuarta-api-key-de-gemini
``` 4. Configurar Base de Datos en Supabase
1. Acceder al Dashboard de Supabase
   
   - Ir a https://supabase.com/dashboard
   - Seleccionar tu proyecto
2. Ejecutar el Script de Base de Datos
   
   - Ir a la sección "SQL Editor"
   - Copiar y ejecutar el contenido del archivo BD.txt que está en la raíz del proyecto
   - Este script creará todas las tablas necesarias:
     - usuarios
     - proyectos_codigo
     - documentos_generados
     - conversaciones
     - mensajes_conversacion
     - contenido_compartido 5. Obtener API Keys de Google Gemini
1. Acceder a Google AI Studio
   
   - Ir a https://makersuite.google.com/
   - Iniciar sesión con tu cuenta de Google
2. Crear API Keys
   
   - Ir a "Get API Key"
   - Crear una nueva API Key
   - Copiar la clave generada
   - Repetir el proceso para crear múltiples keys (recomendado para mayor disponibilidad) 6. Iniciar la Aplicación
```
# Modo desarrollo
npm run dev

# O modo producción
npm start
``` 7. Acceder a la Aplicación
- Aplicación principal : http://localhost:3000
- Página de login : http://localhost:3000/login
- Health check : http://localhost:3000/health
## 🚀 Uso de la Aplicación
### Primer Uso
1. Registrarse
   
   - Ir a http://localhost:3000/login
   - Hacer clic en "Registrarse"
   - Completar el formulario con email, contraseña y nombre
   - Iniciar sesión con las credenciales creadas
2. Analizar Código
   
   - Análisis Individual : Subir un archivo de código para análisis detallado
   - Documentación SRS : Subir múltiples archivos o un proyecto completo
   - Documento Personalizado : Subir un PDF personalizado junto con código para completarlo
### Funcionalidades Disponibles
- Análisis de Código : Obtén análisis detallado de estructura, funcionalidad y calidad
- Generación de Diagramas : Crea diagramas UML y Mermaid automáticamente
- Exportación : Descarga resultados en múltiples formatos
- Historial : Accede a análisis anteriores
- Compartir : Comparte análisis con otros usuarios
## 🔧 Configuración Avanzada
### Variables de Entorno Opcionales
```
# Configuración de archivos
MAX_FILE_SIZE=50mb

# Configuración de sesiones
SESSION_MAX_AGE=86400000

# Configuración de logging
LOG_LEVEL=info
```
### Estructura del Proyecto
```
documentos-ia/
├── config/
│   └── supabase.js          # 
Configuración de Supabase
├── public/
│   ├── css/
│   │   └── styles.css       # Estilos 
CSS
│   ├── js/
│   │   ├── main.js          # 
JavaScript principal
│   │   ├── auth.js          # 
Funciones de autenticación
│   │   └── compartido.js    # 
Funciones de compartir
│   ├── index.html           # Página 
principal
│   ├── login.html           # Página 
de login
│   └── compartido.html      # Página 
de contenido compartido
├── routes/
│   ├── auth.js              # Rutas de 
autenticación
│   ├── proyectos.js         # Rutas de 
análisis de código
│   ├── conversaciones.js    # Rutas de 
conversaciones
│   └── compartir.js         # Rutas de 
compartir contenido
├── services/
│   ├── db.js                # 
Servicios de base de datos
│   └── gemini.js            # 
Servicios de Gemini AI
├── .env                     # 
Variables de entorno (crear)
├── .gitignore              # Archivos 
ignorados por Git
├── BD.txt                  # Script de 
base de datos
├── package.json            # 
Dependencias del proyecto
├── server.cjs              # Servidor 
principal
└── README.md               # Este 
archivo
```
## 🐛 Solución de Problemas
### Errores Comunes
1. Error de conexión a Supabase
   
   - Verificar que SUPABASE_URL y SUPABASE_KEY estén correctos
   - Verificar que el proyecto de Supabase esté activo
2. Error de API Key de Gemini
   
   - Verificar que las API Keys estén correctas
   - Verificar que las API Keys tengan cuota disponible
3. Error al subir archivos
   
   - Verificar que el archivo no exceda 50MB
   - Verificar que el formato de archivo sea compatible
4. Error de sesión
   
   - Verificar que SESSION_SECRET esté configurado
   - Limpiar cookies del navegador
### Logs del Sistema
La aplicación genera logs detallados en la consola que ayudan a identificar problemas:

```
# Iniciar con logs detallados
DEBUG=* npm start
```
## 📝 Scripts Disponibles
```
# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm start

# Ejecutar tests (si están configurados)
npm test

# Ejecutar tests de UI con Playwright
npm run test:ui
```
## 🤝 Contribución
Para contribuir al proyecto:

1. Fork el repositorio
2. Crear una rama para tu feature ( git checkout -b feature/nueva-funcionalidad )
3. Commit tus cambios ( git commit -am 'Agregar nueva funcionalidad' )
4. Push a la rama ( git push origin feature/nueva-funcionalidad )
5. Crear un Pull Request
## 📄 Licencia
Este proyecto está bajo la Licencia ISC.

## 🆘 Soporte
Si encuentras problemas o tienes preguntas:

1. Revisa la sección de solución de problemas
2. Verifica que todas las variables de entorno estén configuradas correctamente
3. Consulta los logs del servidor para más detalles sobre errores
¡Disfruta analizando tu código con DocuGen AI! 🚀
