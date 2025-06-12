// Variables globales
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadedFiles = document.getElementById('uploadedFiles');
const filesList = document.getElementById('filesList');
const generateBtn = document.getElementById('generateBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultados = document.getElementById('resultados');

let uploadedFile = null;

// Eventos de drag and drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]); // Solo tomar el primer archivo
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    // Verificar que sea un archivo de código
    const extension = file.name.split('.').pop().toLowerCase();
    const extensionesSoportadas = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'html', 'css', 'scss', 'vue', 'kt', 'swift', 'dart', 'sql'];
    
    if (!extensionesSoportadas.includes(extension)) {
        alert('Tipo de archivo no soportado. Por favor sube un archivo de código válido.');
        return;
    }
    
    // Leer el contenido del archivo
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedFile = {
            name: file.name,
            content: e.target.result,
            extension: extension
        };
        
        // Mostrar información del archivo
        filesList.innerHTML = `
            <div class="file-info">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-file-code me-2 text-primary"></i>
                        <strong>${file.name}</strong>
                        <small class="text-muted ms-2">(${(file.size / 1024).toFixed(1)} KB)</small>
                        <span class="badge bg-success ms-2">${extension.toUpperCase()}</span>
                    </div>
                    <i class="fas fa-check-circle text-success"></i>
                </div>
            </div>
        `;
        
        uploadedFiles.style.display = 'block';
    };
    
    reader.readAsText(file);
}

// Analizar archivo con IA
generateBtn.addEventListener('click', async () => {
    if (!uploadedFile) {
        alert('Por favor, sube un archivo primero');
        return;
    }
    
    // Ocultar sección de archivos y mostrar loading
    uploadedFiles.style.display = 'none';
    loadingSpinner.style.display = 'block';
    
    try {
        console.log('🔍 Enviando archivo a la IA para análisis...');
        
        const response = await fetch('/api/proyectos/analizar-codigo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                codigo: uploadedFile.content,
                nombreArchivo: uploadedFile.name,
                lenguajeProgramacion: uploadedFile.extension
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al analizar el código');
        }
        
        console.log('✅ Análisis completado');
        
        // Mostrar resultados
        mostrarAnalisis(data);
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert(`Error: ${error.message}`);
        
        // Volver a mostrar la sección de archivos
        loadingSpinner.style.display = 'none';
        uploadedFiles.style.display = 'block';
    }
});

// Mostrar el análisis de la IA
function mostrarAnalisis(data) {
    loadingSpinner.style.display = 'none';
    
    // Actualizar la sección de resultados
    resultados.innerHTML = `
        <div class="container">
            <h2 class="text-center mb-5 fw-bold">Análisis del Código</h2>
            
            <div class="result-section">
                <h4 class="fw-bold mb-3">
                    <i class="fas fa-robot text-primary me-2"></i>
                    Resumen del Archivo: ${data.archivo}
                </h4>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6 class="fw-bold">Información del Archivo:</h6>
                        <ul class="list-unstyled">
                            <li><strong>Archivo:</strong> ${data.archivo}</li>
                            <li><strong>Lenguaje:</strong> <span class="badge bg-primary">${data.lenguaje_detectado}</span></li>
                            <li><strong>Líneas totales:</strong> ${data.estadisticas.total_lineas}</li>
                            <li><strong>Líneas de código:</strong> ${data.estadisticas.lineas_codigo}</li>
                            <li><strong>Comentarios:</strong> ${data.estadisticas.lineas_comentarios}</li>
                            <li><strong>Caracteres:</strong> ${data.estadisticas.caracteres}</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold">Procesado con:</h6>
                        <p><i class="fas fa-brain text-success me-2"></i>Gemini AI (API Key ${data.api_key_usada})</p>
                        
                        <button class="btn btn-success btn-sm me-2" onclick="descargarAnalisis()">
                            <i class="fas fa-download me-1"></i>Descargar Análisis
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="analizarOtroArchivo()">
                            <i class="fas fa-upload me-1"></i>Analizar Otro
                        </button>
                    </div>
                </div>
                
                <h5 class="fw-bold mb-3">Análisis Detallado:</h5>
                <div class="analisis-contenido p-3 bg-light border rounded">
                    <pre style="white-space: pre-wrap; font-family: 'Segoe UI', sans-serif; margin: 0;">${data.analisis}</pre>
                </div>
            </div>
        </div>
    `;
    
    resultados.style.display = 'block';
    resultados.scrollIntoView({ behavior: 'smooth' });
    
    // Guardar datos para descarga
    window.currentAnalysis = data;
}

// Función para descargar el análisis
function descargarAnalisis() {
    if (!window.currentAnalysis) {
        alert('No hay análisis disponible para descargar');
        return;
    }
    
    const data = window.currentAnalysis;
    const contenido = `ANÁLISIS DE CÓDIGO - ${data.archivo}
===============================================

INFORMACIÓN DEL ARCHIVO:
- Nombre: ${data.archivo}
- Lenguaje: ${data.lenguaje_detectado}
- Líneas totales: ${data.estadisticas.total_lineas}
- Líneas de código: ${data.estadisticas.lineas_codigo}
- Comentarios: ${data.estadisticas.lineas_comentarios}
- Caracteres: ${data.estadisticas.caracteres}

ANÁLISIS DETALLADO:
${data.analisis}

===============================================
Generado con Gemini AI el ${new Date().toLocaleString()}
`;
    
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-${data.archivo.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Función para analizar otro archivo
function analizarOtroArchivo() {
    // Limpiar variables
    uploadedFile = null;
    window.currentAnalysis = null;
    
    // Ocultar resultados
    resultados.style.display = 'none';
    
    // Limpiar y mostrar zona de subida
    filesList.innerHTML = '';
    uploadedFiles.style.display = 'none';
    fileInput.value = '';
    
    // Scroll a la zona de subida
    uploadZone.scrollIntoView({ behavior: 'smooth' });
}

// Verificar autenticación al cargar
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/user');
        
        if (!response.ok) {
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        console.log('Usuario autenticado:', data.user.email);
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '/login';
    }
}

// Manejar cierre de sesión
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            }
        });
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogout();
});

// Agregar al final del archivo main.js

let selectedFiles = [];

// Manejar selección de múltiples archivos
document.getElementById('fileInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    selectedFiles = files;
    mostrarArchivosSeleccionados(files);
});

// Mostrar archivos seleccionados
function mostrarArchivosSeleccionados(files) {
    const filesList = document.getElementById('filesList');
    const selectedFilesDiv = document.getElementById('selectedFiles');
    
    filesList.innerHTML = '';
    
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        fileItem.innerHTML = `
            <div>
                <i class="fas fa-file-code me-2"></i>
                <strong>${file.name}</strong>
                <small class="text-muted ms-2">(${(file.size / 1024).toFixed(1)} KB)</small>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarArchivo(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        filesList.appendChild(fileItem);
    });
    
    selectedFilesDiv.style.display = files.length > 0 ? 'block' : 'none';
}

// Eliminar archivo específico
function eliminarArchivo(index) {
    selectedFiles.splice(index, 1);
    mostrarArchivosSeleccionados(selectedFiles);
}

// Limpiar todos los archivos
function limpiarArchivos() {
    selectedFiles = [];
    document.getElementById('selectedFiles').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

// Analizar proyecto completo
async function analizarProyecto() {
    if (selectedFiles.length === 0) {
        alert('Por favor selecciona al menos un archivo');
        return;
    }
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultados = document.getElementById('resultados');
    
    loadingSpinner.style.display = 'block';
    resultados.style.display = 'none';
    
    try {
        const formData = new FormData();
        
        // Agregar todos los archivos al FormData
        selectedFiles.forEach((file, index) => {
            formData.append('archivos', file);
        });
        
        const response = await fetch('/api/proyectos/analizar-proyecto', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarDocumentacionSRS(data);
        } else {
            throw new Error(data.error || 'Error al analizar el proyecto');
        }
        
    } catch (error) {
        console.error('Error:', error);
        loadingSpinner.style.display = 'none';
        alert('Error al analizar el proyecto: ' + error.message);
    }
}

// Mostrar documentación SRS generada
function mostrarDocumentacionSRS(data) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultados = document.getElementById('resultados');
    
    loadingSpinner.style.display = 'none';
    
    resultados.innerHTML = `
        <div class="container">
            <h2 class="text-center mb-5 fw-bold">Documentación SRS Generada</h2>
            
            <div class="result-section">
                <h4 class="fw-bold mb-3">
                    <i class="fas fa-file-alt text-primary me-2"></i>
                    Especificación de Requisitos de Software
                </h4>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6 class="fw-bold">Información del Proyecto:</h6>
                        <ul class="list-unstyled">
                            <li><strong>Archivos analizados:</strong> ${data.archivos_procesados}</li>
                            <li><strong>Lenguajes detectados:</strong> ${data.lenguajes_detectados.join(', ')}</li>
                            <li><strong>Total de líneas:</strong> ${data.estadisticas_totales.total_lineas}</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold">Acciones:</h6>
                        <button class="btn btn-success btn-sm me-2" onclick="descargarSRS()">
                            <i class="fas fa-download me-1"></i>Descargar SRS
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="analizarOtroProyecto()">
                            <i class="fas fa-upload me-1"></i>Analizar Otro Proyecto
                        </button>
                    </div>
                </div>
                
                <h5 class="fw-bold mb-3">Documento SRS:</h5>
                <div class="srs-contenido p-3 bg-light border rounded">
                    <div style="white-space: pre-wrap; font-family: 'Segoe UI', sans-serif; margin: 0;">${data.documentacion_srs}</div>
                </div>
            </div>
        </div>
    `;
    
    resultados.style.display = 'block';
    resultados.scrollIntoView({ behavior: 'smooth' });
    
    // Guardar datos para descarga
    window.currentSRS = data;
}

// Funciones auxiliares
function descargarSRS() {
    if (!window.currentSRS) {
        alert('No hay documentación SRS disponible para descargar');
        return;
    }
    
    const data = window.currentSRS;
    const contenido = data.documentacion_srs;
    
    const blob = new Blob([contenido], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `SRS-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function analizarOtroProyecto() {
    limpiarArchivos();
    document.getElementById('resultados').style.display = 'none';
    document.getElementById('uploadSection').scrollIntoView({ behavior: 'smooth' });
}