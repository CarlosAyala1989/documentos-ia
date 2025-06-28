// Variables globales
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadedFiles = document.getElementById('uploadedFiles');
const filesList = document.getElementById('filesList');
const generateBtn = document.getElementById('generateBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultados = document.getElementById('resultados');

// Variables globales para control de cancelación
let currentRequest = null;
let progressInterval = null;

// Variables globales para conversaciones
let conversacionesData = null;
let conversacionActual = null;
let conversacionActualId = null;

// Variables para el sistema de slides
let currentSlide = 0;
const totalSlides = 2;

// Array para almacenar múltiples archivos
let selectedFiles = [];
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        handleMultipleFiles(files);
    }
});

// Manejar selección de múltiples archivos
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleMultipleFiles(files);
    }
});

// Función para manejar múltiples archivos
function handleMultipleFiles(files) {
    // Agregar archivos a la lista existente
    files.forEach(file => {
        const extension = file.name.split('.').pop().toLowerCase();
        const extensionesSoportadas = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'html', 'css', 'scss', 'vue', 'kt', 'swift', 'dart', 'sql', 'txt', 'md'];
        
        // Verificar si es un archivo comprimido
        const extensionesComprimidas = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
        const esArchivoComprimido = extensionesComprimidas.includes(extension) || 
            file.type === 'application/zip' || 
            file.type === 'application/x-rar-compressed' ||
            file.type === 'application/vnd.rar' ||
            file.type === 'application/x-7z-compressed' ||
            file.type === 'application/x-tar' ||
            file.type === 'application/gzip';
        
        if (esArchivoComprimido) {
            // Mostrar mensaje de error al usuario
            mostrarMensajeError(`❌ No se permiten archivos comprimidos: ${file.name}\n\nPor favor, extrae los archivos y súbelos individualmente.`);
            return; // Saltar este archivo
        }
        
        if (extensionesSoportadas.includes(extension)) {
            // Verificar si el archivo ya está en la lista
            const existeArchivo = selectedFiles.some(existingFile => 
                existingFile.name === file.name && existingFile.size === file.size
            );
            
            if (!existeArchivo) {
                selectedFiles.push(file);
            }
        } else {
            // Mostrar mensaje para extensiones no soportadas
            mostrarMensajeError(`❌ Tipo de archivo no soportado: ${file.name}\n\nExtensiones permitidas: ${extensionesSoportadas.join(', ')}`);
        }
    });
    
    mostrarArchivosSeleccionados();
}

// Función para un solo archivo (compatibilidad hacia atrás)
function handleFile(file) {
    handleMultipleFiles([file]);
}

// Función para ajustar el espaciado de la sección "Cómo funciona"
function ajustarEspaciadoInstrucciones() {
    const instruccionesSection = document.querySelector('.py-5.bg-light');
    const cantidadArchivos = selectedFiles.length;
    
    // Remover todas las clases de archivos existentes
    instruccionesSection.classList.remove('files-1-3', 'files-4-6', 'files-7-10', 'files-many');
    
    // Agregar clase según la cantidad de archivos
    if (cantidadArchivos >= 1 && cantidadArchivos <= 3) {
        instruccionesSection.classList.add('files-1-3');
    } else if (cantidadArchivos >= 4 && cantidadArchivos <= 6) {
        instruccionesSection.classList.add('files-4-6');
    } else if (cantidadArchivos >= 7 && cantidadArchivos <= 10) {
        instruccionesSection.classList.add('files-7-10');
    } else if (cantidadArchivos > 10) {
        instruccionesSection.classList.add('files-many');
    }
}

// Mostrar todos los archivos seleccionados
function mostrarArchivosSeleccionados() {
    if (selectedFiles.length === 0) {
        uploadedFiles.style.display = 'none';
        ajustarEspaciadoInstrucciones();
        return;
    }
    
    // Actualizar contador
    document.getElementById('fileCounter').textContent = selectedFiles.length;
    
    filesList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const extension = file.name.split('.').pop().toLowerCase();
        const fileItem = document.createElement('div');
        fileItem.className = 'file-info mb-2';
        fileItem.style.cssText = 'background: #f8f9fa; border-radius: 10px; padding: 15px; border-left: 4px solid var(--accent-color); position: relative; z-index: 100;';
        fileItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-file-code me-2 text-primary"></i>
                    <strong>${file.name}</strong>
                    <small class="text-muted ms-2">(${(file.size / 1024).toFixed(1)} KB)</small>
                    <span class="badge bg-success ms-2">${extension.toUpperCase()}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarArchivo(${index})" title="Eliminar archivo">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        filesList.appendChild(fileItem);
    });
    
    uploadedFiles.style.display = 'block';
    uploadedFiles.style.position = 'relative';
    uploadedFiles.style.zIndex = '1000';
    
    ajustarEspaciadoInstrucciones();
}

// Mostrar pop-up de archivos
function mostrarPopupArchivos() {
    const overlay = document.getElementById('filesPopupOverlay');
    const popupFilesList = document.getElementById('popupFilesList');
    const popupCounter = document.getElementById('popupFileCounter');
    
    popupCounter.textContent = selectedFiles.length;
    popupFilesList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const extension = file.name.split('.').pop().toLowerCase();
        const fileItem = document.createElement('div');
        fileItem.className = 'popup-file-item';
        fileItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-file-code me-2 text-primary"></i>
                    <strong>${file.name}</strong>
                    <small class="text-muted ms-2">(${(file.size / 1024).toFixed(1)} KB)</small>
                    <span class="badge bg-success ms-2">${extension.toUpperCase()}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarArchivoPopup(${index})" title="Eliminar archivo">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        popupFilesList.appendChild(fileItem);
    });
    
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Cerrar pop-up de archivos
function cerrarPopupArchivos() {
    document.getElementById('filesPopupOverlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Eliminar archivo desde el pop-up
function eliminarArchivoPopup(index) {
    selectedFiles.splice(index, 1);
    mostrarArchivosSeleccionados(); // Actualizar la vista principal
    
    // Actualizar el pop-up inmediatamente
    const popupFilesList = document.getElementById('popupFilesList');
    const popupCounter = document.getElementById('popupFileCounter');
    
    // Actualizar contador
    popupCounter.textContent = selectedFiles.length;
    
    // Si no quedan archivos, cerrar el pop-up
    if (selectedFiles.length === 0) {
        cerrarPopupArchivos();
        return;
    }
    
    // Regenerar la lista en el pop-up
    popupFilesList.innerHTML = '';
    selectedFiles.forEach((file, newIndex) => {
        const extension = file.name.split('.').pop().toLowerCase();
        const fileItem = document.createElement('div');
        fileItem.className = 'popup-file-item';
        fileItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-file-code me-2 text-primary"></i>
                    <strong>${file.name}</strong>
                    <small class="text-muted ms-2">(${(file.size / 1024).toFixed(1)} KB)</small>
                    <span class="badge bg-success ms-2">${extension.toUpperCase()}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarArchivoPopup(${newIndex})" title="Eliminar archivo">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        popupFilesList.appendChild(fileItem);
    });
}

// Limpiar todos los archivos
function limpiarTodosArchivos() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los archivos?')) {
        selectedFiles = [];
        uploadedFile = null;
        mostrarArchivosSeleccionados();
        cerrarPopupArchivos();
        fileInput.value = '';
    }
}

// Eliminar archivo específico
function eliminarArchivo(index) {
    selectedFiles.splice(index, 1);
    mostrarArchivosSeleccionados();
}

// Limpiar todos los archivos
function limpiarArchivos() {
    selectedFiles = [];
    uploadedFile = null;
    mostrarArchivosSeleccionados();
    fileInput.value = '';
}

// Analizar archivo con IA (modificado para soportar múltiples archivos)
generateBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        alert('Por favor, sube al menos un archivo');
        return;
    }
    
    // Si hay múltiples archivos, usar análisis de proyecto
    if (selectedFiles.length > 1) {
        await analizarProyecto();
        return;
    }
    
    // Si hay un solo archivo, usar análisis individual
    const file = selectedFiles[0];
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        uploadedFile = {
            name: file.name,
            content: e.target.result,
            extension: file.name.split('.').pop().toLowerCase()
        };
        
        await analizarArchivoIndividual();
    };
    
    reader.readAsText(file);
});

// Función para mostrar overlay de carga
function mostrarOverlayCarga() {
    const overlay = document.getElementById('loadingOverlay');
    const progressBar = document.getElementById('progressBar');
    
    overlay.style.display = 'flex';
    
    // Simular progreso
    let progress = 0;
    progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressBar.style.width = progress + '%';
    }, 1000);
}

// Función para ocultar overlay de carga
function ocultarOverlayCarga() {
    const overlay = document.getElementById('loadingOverlay');
    const progressBar = document.getElementById('progressBar');
    
    overlay.style.display = 'none';
    progressBar.style.width = '0%';
    
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// Función para cancelar análisis
function cancelarAnalisis() {
    if (currentRequest) {
        currentRequest.abort();
        currentRequest = null;
    }
    
    ocultarOverlayCarga();
    
    // Restaurar estado inicial
    uploadedFiles.style.display = 'block';
    loadingSpinner.style.display = 'none';
    
    // Mostrar notificación
    mostrarNotificacion('Análisis cancelado', 'warning');
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 100px; right: 20px; z-index: 10000; min-width: 300px;';
    notification.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Función para analizar archivo individual
async function analizarArchivoIndividual() {
    mostrarOverlayCarga();
    
    try {
        console.log('🔍 Enviando archivo a la IA para análisis...');
        
        const controller = new AbortController();
        currentRequest = controller;
        
        // Preparar datos para el análisis
        const requestData = {
            codigo: uploadedFile.content,
            nombreArchivo: uploadedFile.name,
            lenguajeProgramacion: uploadedFile.extension
        };
        
        // Si hay una conversación activa, incluir su ID
        if (conversacionActualId) {
            requestData.conversacion_id = conversacionActualId;
        }
        
        const response = await fetch('/api/proyectos/analizar-codigo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al analizar el código');
        }
        
        console.log('✅ Análisis completado');
        
        // Completar progreso y ocultar overlay
        document.getElementById('progressBar').style.width = '100%';
        setTimeout(() => {
            ocultarOverlayCarga();
            mostrarAnalisis(data);
        }, 500);
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Análisis cancelado por el usuario');
            return;
        }
        
        console.error('❌ Error en análisis:', error);
        ocultarOverlayCarga();
        mostrarNotificacion('Error al analizar el código: ' + error.message, 'error');
    } finally {
        currentRequest = null;
    }
}

// Analizar proyecto completo
async function analizarProyecto() {
    uploadedFiles.style.display = 'none';
    mostrarOverlayCarga();
    
    try {
        const formData = new FormData();
        
        // Agregar todos los archivos al FormData
        selectedFiles.forEach((file) => {
            formData.append('archivos', file);
        });
        
        // Si hay una conversación activa, incluir su ID
        if (conversacionActualId) {
            formData.append('conversacion_id', conversacionActualId);
        }
        
        // Crear AbortController para poder cancelar
        const controller = new AbortController();
        currentRequest = controller;
        
        const response = await fetch('/api/proyectos/analizar-proyecto', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Completar progreso y mostrar resultados
            document.getElementById('progressBar').style.width = '100%';
            setTimeout(() => {
                ocultarOverlayCarga();
                mostrarDocumentacionSRS(data);
            }, 500);
        } else {
            throw new Error(data.error || 'Error al analizar el proyecto');
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Análisis cancelado por el usuario');
            return;
        }
        
        console.error('Error:', error);
        ocultarOverlayCarga();
        uploadedFiles.style.display = 'block';
        mostrarNotificacion('Error al analizar el proyecto: ' + error.message, 'danger');
    } finally {
        currentRequest = null;
    }
}

// Mostrar el análisis de la IA (con botón de descarga PDF)
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
                            <i class="fas fa-download me-1"></i>Descargar TXT
                        </button>
                        <button class="btn btn-danger btn-sm me-2" onclick="descargarAnalisisPDF()">
                            <i class="fas fa-file-pdf me-1"></i>Descargar PDF
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

// Mostrar documentación SRS generada (con botón de descarga PDF)
function mostrarDocumentacionSRS(data) {
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
                            <i class="fas fa-download me-1"></i>Descargar MD
                        </button>
                        <button class="btn btn-danger btn-sm me-2" onclick="descargarSRSPDF()">
                            <i class="fas fa-file-pdf me-1"></i>Descargar PDF
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

// Función para descargar el análisis en TXT
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

// Nueva función para descargar análisis en PDF
function descargarAnalisisPDF() {
    if (!window.currentAnalysis) {
        alert('No hay análisis disponible para descargar');
        return;
    }
    
    const data = window.currentAnalysis;
    
    // Crear contenido HTML para el PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Análisis de Código - ${data.archivo}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .info-section { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .analysis-section { margin: 20px 0; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
            pre { white-space: pre-wrap; background: #f8f8f8; padding: 15px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Análisis de Código</h1>
            <h2>${data.archivo}</h2>
        </div>
        
        <div class="info-section">
            <h3>Información del Archivo</h3>
            <p><strong>Nombre:</strong> ${data.archivo}</p>
            <p><strong>Lenguaje:</strong> ${data.lenguaje_detectado}</p>
            <p><strong>Líneas totales:</strong> ${data.estadisticas.total_lineas}</p>
            <p><strong>Líneas de código:</strong> ${data.estadisticas.lineas_codigo}</p>
            <p><strong>Comentarios:</strong> ${data.estadisticas.lineas_comentarios}</p>
            <p><strong>Caracteres:</strong> ${data.estadisticas.caracteres}</p>
        </div>
        
        <div class="analysis-section">
            <h3>Análisis Detallado</h3>
            <pre>${data.analisis}</pre>
        </div>
        
        <div class="footer">
            <p>Generado con Gemini AI el ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `;
    
    // Crear ventana para imprimir
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que se cargue y luego imprimir
    printWindow.onload = function() {
        printWindow.print();
    };
}

// Nueva función para descargar SRS en PDF
function descargarSRSPDF() {
    if (!window.currentSRS) {
        alert('No hay documentación SRS disponible para descargar');
        return;
    }
    
    const data = window.currentSRS;
    
    // Crear contenido HTML para el PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Documentación SRS</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .info-section { background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .srs-section { margin: 20px 0; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
            pre { white-space: pre-wrap; background: #f8f8f8; padding: 15px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Especificación de Requisitos de Software</h1>
            <h2>Documentación SRS</h2>
        </div>
        
        <div class="info-section">
            <h3>Información del Proyecto</h3>
            <p><strong>Archivos analizados:</strong> ${data.archivos_procesados}</p>
            <p><strong>Lenguajes detectados:</strong> ${data.lenguajes_detectados.join(', ')}</p>
            <p><strong>Total de líneas:</strong> ${data.estadisticas_totales.total_lineas}</p>
        </div>
        
        <div class="srs-section">
            <h3>Documento SRS</h3>
            <pre>${data.documentacion_srs}</pre>
        </div>
        
        <div class="footer">
            <p>Generado con Gemini AI el ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `;
    
    // Crear ventana para imprimir
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que se cargue y luego imprimir
    printWindow.onload = function() {
        printWindow.print();
    };
}

// Función para descargar SRS en Markdown
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

// Función para analizar otro archivo
function analizarOtroArchivo() {
    // Limpiar variables
    limpiarArchivos();
    window.currentAnalysis = null;
    
    // Ocultar resultados
    resultados.style.display = 'none';
    
    // Scroll a la zona de subida
    uploadZone.scrollIntoView({ behavior: 'smooth' });
}

// Función para analizar otro proyecto
function analizarOtroProyecto() {
    limpiarArchivos();
    window.currentSRS = null;
    resultados.style.display = 'none';
    uploadZone.scrollIntoView({ behavior: 'smooth' });
}

function obtenerBadgeTipoDocumento(tipoDocumento) {
    if (tipoDocumento.includes('Documento Personalizado')) {
        return '<span class="badge bg-warning text-dark me-2"><i class="fas fa-magic me-1"></i>Personalizado</span>';
    } else if (tipoDocumento.includes('SRS') || tipoDocumento.includes('Especificación')) {
        return '<span class="badge bg-primary me-2"><i class="fas fa-file-alt me-1"></i>SRS</span>';
    } else if (tipoDocumento.includes('Diagrama') || tipoDocumento.includes('UML')) {
        return '<span class="badge bg-info me-2"><i class="fas fa-project-diagram me-1"></i>Diagrama</span>';
    } else if (tipoDocumento.includes('Análisis')) {
        return '<span class="badge bg-success me-2"><i class="fas fa-chart-line me-1"></i>Análisis</span>';
    }
    return '<span class="badge bg-secondary me-2"><i class="fas fa-file me-1"></i>Documento</span>';
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
    initializeSlideSystem();
    checkAuth();
    setupLogout();
});

// Inicializar sistema de slides
function initializeSlideSystem() {
    const slideTabs = document.querySelectorAll('.slide-tab');
    const indicatorLine = document.querySelector('.indicator-line');
    
    // Event listeners para los tabs
    slideTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            switchToSlide(index);
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentSlide > 0) {
            switchToSlide(currentSlide - 1);
        } else if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) {
            switchToSlide(currentSlide + 1);
        }
    });
}

function switchToSlide(slideIndex) {
    if (slideIndex === currentSlide) return;
    
    const slides = document.querySelectorAll('.slide');
    const slideTabs = document.querySelectorAll('.slide-tab');
    const indicatorLine = document.querySelector('.indicator-line');
    
    // Remover clases activas
    slides[currentSlide].classList.remove('active');
    slideTabs[currentSlide].classList.remove('active');
    
    // Agregar clase prev al slide actual antes de cambiar
    if (slideIndex < currentSlide) {
        slides[currentSlide].classList.add('prev');
    }
    
    // Actualizar slide actual
    currentSlide = slideIndex;
    
    // Activar nuevo slide
    setTimeout(() => {
        slides.forEach(slide => slide.classList.remove('prev'));
        slides[currentSlide].classList.add('active');
        slideTabs[currentSlide].classList.add('active');
        
        // Actualizar indicador
        indicatorLine.className = `indicator-line slide-${currentSlide}`;
    }, 50);
    
    // Limpiar resultados al cambiar de slide
    document.getElementById('resultados').style.display = 'none';
    document.getElementById('resultadosDocumento').style.display = 'none';
}

// Función para mostrar notificación de cambio de modo
function showSlideNotification(slideName) {
    const notification = document.createElement('div');
    notification.className = 'slide-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        Cambiado a: ${slideName}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}


// Variables para documento personalizado
let selectedPDF = null;
let selectedCodeFiles = [];

// Referencias a elementos del DOM para documento personalizado
const pdfInput = document.getElementById('pdfInput');
const codeInput = document.getElementById('codeInput');
const pdfSelected = document.getElementById('pdfSelected');
const codeFilesSelected = document.getElementById('codeFilesSelected');
const codeFilesList = document.getElementById('codeFilesList');
const completarDocumentoBtn = document.getElementById('completarDocumentoBtn');
const generarDiagramasBtn = document.getElementById('generarDiagramasBtn');
const generarMermaidBtn = document.getElementById('generarMermaidBtn');
const resultadosDocumento = document.getElementById('resultadosDocumento');

// Eventos para documento personalizado
if (pdfInput) {
    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            selectedPDF = file;
            mostrarPDFSeleccionado();
            verificarArchivosCompletos();
        } else {
            alert('Por favor, selecciona un archivo PDF válido');
        }
    });
}

if (codeInput) {
    codeInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        selectedCodeFiles = files;
        mostrarArchivosCodigoSeleccionados();
        verificarArchivosCompletos();
    });
}

if (completarDocumentoBtn) {
    completarDocumentoBtn.addEventListener('click', completarDocumentoPersonalizado);
}

if (generarDiagramasBtn) {
    generarDiagramasBtn.addEventListener('click', generarSoloDiagramas);
}

if (generarMermaidBtn) {
    generarMermaidBtn.addEventListener('click', generarSoloMermaid);
}

// Funciones para documento personalizado
function mostrarPDFSeleccionado() {
    if (!selectedPDF) {
        pdfSelected.style.display = 'none';
        return;
    }
    
    pdfSelected.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <i class="fas fa-file-pdf text-danger me-2"></i>
                <strong>${selectedPDF.name}</strong>
                <small class="text-muted ms-2">(${(selectedPDF.size / 1024).toFixed(1)} KB)</small>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarPDF()" title="Eliminar PDF">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    pdfSelected.style.display = 'block';
}

function mostrarArchivosCodigoSeleccionados() {
    if (selectedCodeFiles.length === 0) {
        codeFilesSelected.style.display = 'none';
        return;
    }
    
    codeFilesList.innerHTML = '';
    
    selectedCodeFiles.forEach((file, index) => {
        const extension = file.name.split('.').pop().toLowerCase();
        const fileItem = document.createElement('div');
        fileItem.className = 'file-info mb-2';
        fileItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-file-code me-2 text-primary"></i>
                    <strong>${file.name}</strong>
                    <small class="text-muted ms-2">(${(file.size / 1024).toFixed(1)} KB)</small>
                    <span class="badge bg-success ms-2">${extension.toUpperCase()}</span>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarArchivoCodigo(${index})" title="Eliminar archivo">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        codeFilesList.appendChild(fileItem);
    });
    
    codeFilesSelected.style.display = 'block';
}

function eliminarPDF() {
    selectedPDF = null;
    pdfInput.value = '';
    mostrarPDFSeleccionado();
    verificarArchivosCompletos();
}

function eliminarArchivoCodigo(index) {
    selectedCodeFiles.splice(index, 1);
    mostrarArchivosCodigoSeleccionados();
    verificarArchivosCompletos();
}

function verificarArchivosCompletos() {
    const pdfListo = selectedPDF !== null;
    const codigoListo = selectedCodeFiles.length > 0;
    
    if (completarDocumentoBtn) {
        completarDocumentoBtn.disabled = !(pdfListo && codigoListo);
    }
    
    if (generarDiagramasBtn) {
        generarDiagramasBtn.disabled = !codigoListo;
    }
    
    if (generarMermaidBtn) {
        generarMermaidBtn.disabled = !codigoListo;
    }
}

// Completar documento personalizado
async function completarDocumentoPersonalizado() {
    if (!selectedPDF || selectedCodeFiles.length === 0) {
        alert('Por favor, selecciona un PDF y archivos de código');
        return;
    }
    
    mostrarOverlayCarga();
    
    try {
        const formData = new FormData();
        
        // Agregar PDF
        formData.append('documento_pdf', selectedPDF);
        
        // Agregar archivos de código
        selectedCodeFiles.forEach((file) => {
            formData.append('archivos_codigo', file);
        });
        
        // Agregar tipo de documento
        const tipoDocumento = document.getElementById('tipoDocumento').value;
        formData.append('tipo_documento', tipoDocumento);
        
        // Si hay una conversación activa, incluir su ID
        if (conversacionActualId) {
            formData.append('conversacion_id', conversacionActualId);
        }
        
        const response = await fetch('/api/proyectos/completar-documento-personalizado', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarDocumentoCompletado(data);
        } else {
            throw new Error(data.error || 'Error al completar el documento');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al completar el documento: ' + error.message);
    } finally {
        ocultarOverlayCarga();
    }
}

// Generar solo diagramas UML
async function generarSoloDiagramas() {
    if (selectedCodeFiles.length === 0) {
        alert('Por favor, selecciona archivos de código');
        return;
    }
    
    const tipoDiagrama = prompt('¿Qué tipo de diagrama deseas generar?\n\nOpciones:\n- clases\n- secuencia\n- componentes\n- casos_uso\n- actividad', 'clases');
    
    if (!tipoDiagrama) return;
    
    mostrarOverlayCarga();
    
    try {
        const formData = new FormData();
        
        selectedCodeFiles.forEach((file) => {
            formData.append('archivos', file);
        });
        
        formData.append('tipo_diagrama', tipoDiagrama);
        
        const response = await fetch('/api/proyectos/generar-diagramas-uml', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarDiagramasUML(data);
        } else {
            throw new Error(data.error || 'Error al generar diagramas');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar diagramas: ' + error.message);
    } finally {
        ocultarOverlayCarga();
    }
}

// Generar solo diagramas Mermaid
async function generarSoloMermaid() {
    if (selectedCodeFiles.length === 0) {
        alert('Por favor, selecciona archivos de código');
        return;
    }
    
    const tipoDiagrama = prompt('¿Qué tipo de diagrama Mermaid deseas generar?\n\nOpciones:\n- classDiagram\n- sequenceDiagram\n- flowchart\n- gitgraph\n- erDiagram\n- stateDiagram', 'classDiagram');
    
    if (!tipoDiagrama) return;
    
    mostrarOverlayCarga();
    
    try {
        const formData = new FormData();
        
        selectedCodeFiles.forEach((file) => {
            formData.append('archivos', file);
        });
        
        formData.append('tipo_diagrama', tipoDiagrama);
        
        const response = await fetch('/api/proyectos/generar-diagramas-mermaid', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarDiagramasMermaid(data);
        } else {
            throw new Error(data.error || 'Error al generar diagramas Mermaid');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar diagramas Mermaid: ' + error.message);
    } finally {
        ocultarOverlayCarga();
    }
}

// Mostrar documento completado
function mostrarDocumentoCompletado(data) {
    resultadosDocumento.innerHTML = `
        <div class="container">
            <h2 class="text-center mb-5 fw-bold">📄 Documento Personalizado Completado</h2>
            
            <div class="result-section">
                <h4 class="fw-bold mb-3">
                    <i class="fas fa-magic text-success me-2"></i>
                    ${data.tipo_documento} Completado con IA
                </h4>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6 class="fw-bold">Información del Proceso:</h6>
                        <ul class="list-unstyled">
                            <li><strong>Tipo de documento:</strong> ${data.tipo_documento}</li>
                            <li><strong>Archivos procesados:</strong> ${data.archivos_procesados}</li>
                            <li><strong>APIs utilizadas:</strong> ${data.api_keys_usadas.length}</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold">Acciones:</h6>
                        <button class="btn btn-success btn-sm me-2" onclick="descargarDocumentoCompletado()">
                            <i class="fas fa-download me-1"></i>Descargar Documento
                        </button>
                        ${data.diagramas_uml ? `
                        <button class="btn btn-info btn-sm me-2" onclick="descargarDiagramasUML()">
                            <i class="fas fa-project-diagram me-1"></i>Descargar PlantUML
                        </button>
                        ` : ''}
                        <button class="btn btn-outline-primary btn-sm" onclick="limpiarDocumentoPersonalizado()">
                            <i class="fas fa-refresh me-1"></i>Nuevo Documento
                        </button>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-12">
                        <h5 class="fw-bold mb-3">Documento Completado:</h5>
                        <div class="documento-contenido p-3 bg-light border rounded">
                            <pre style="white-space: pre-wrap; font-family: 'Segoe UI', sans-serif; margin: 0;">${data.documento_completado}</pre>
                        </div>
                    </div>
                </div>
                
                ${data.diagramas_uml ? `
                <div class="row mt-4">
                    <div class="col-12">
                        <h5 class="fw-bold mb-3">Código PlantUML Generado:</h5>
                        <div class="plantuml-contenido p-3 bg-dark text-light border rounded">
                            <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; margin: 0;">${data.diagramas_uml}</pre>
                        </div>
                        <small class="text-muted mt-2 d-block">
                            💡 Copia este código y pégalo en <a href="https://www.plantuml.com/plantuml/uml" target="_blank">PlantUML Online</a> para generar el diagrama visual.
                        </small>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    resultadosDocumento.style.display = 'block';
    resultadosDocumento.scrollIntoView({ behavior: 'smooth' });
    
    // Guardar datos para descarga
    window.currentDocumentoCompletado = data;
}

// Mostrar solo diagramas UML
function mostrarDiagramasUML(data) {
    resultadosDocumento.innerHTML = `
        <div class="container">
            <h2 class="text-center mb-5 fw-bold">🎨 Diagramas UML Generados</h2>
            
            <div class="result-section">
                <h4 class="fw-bold mb-3">
                    <i class="fas fa-project-diagram text-info me-2"></i>
                    Diagrama de ${data.tipo_diagrama.charAt(0).toUpperCase() + data.tipo_diagrama.slice(1)}
                </h4>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6 class="fw-bold">Información:</h6>
                        <ul class="list-unstyled">
                            <li><strong>Tipo:</strong> ${data.tipo_diagrama}</li>
                            <li><strong>Archivos procesados:</strong> ${data.archivos_procesados}</li>
                            <li><strong>APIs utilizadas:</strong> ${data.api_keys_usadas ? data.api_keys_usadas.length : 1}</li>
                            ${data.validado ? '<li><span class="badge bg-success">✅ Validado</span></li>' : ''}
                            ${data.optimizado ? '<li><span class="badge bg-info">🚀 Optimizado</span></li>' : ''}
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold">Acciones:</h6>
                        <button class="btn btn-info btn-sm me-2" onclick="descargarSoloDiagramas()">
                            <i class="fas fa-download me-1"></i>Descargar PlantUML
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="limpiarDocumentoPersonalizado()">
                            <i class="fas fa-refresh me-1"></i>Generar Otro
                        </button>
                    </div>
                </div>
                
                ${data.imagenes_urls ? `
                <div class="row mb-4">
                    <div class="col-12">
                        <h5 class="fw-bold mb-3">🖼️ Vista Previa del Diagrama:</h5>
                        <div class="text-center p-3 bg-light border rounded">
                            <img src="${data.imagenes_urls.png}" alt="Diagrama UML" class="img-fluid" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <div class="mt-3 text-center">
                            <h6 class="fw-bold">Descargar en diferentes formatos:</h6>
                            <a href="${data.imagenes_urls.png}" target="_blank" class="btn btn-success btn-sm me-2">
                                <i class="fas fa-image me-1"></i>PNG
                            </a>
                            <a href="${data.imagenes_urls.svg}" target="_blank" class="btn btn-primary btn-sm me-2">
                                <i class="fas fa-vector-square me-1"></i>SVG
                            </a>
                            <a href="${data.imagenes_urls.pdf}" target="_blank" class="btn btn-danger btn-sm">
                                <i class="fas fa-file-pdf me-1"></i>PDF
                            </a>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="row">
                    <div class="col-12">
                        <h5 class="fw-bold mb-3">📝 Código PlantUML:</h5>
                        <div class="plantuml-contenido p-3 bg-dark text-light border rounded">
                            <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; margin: 0;">${data.codigo_plantuml}</pre>
                        </div>
                        ${!data.imagenes_urls ? `
                        <div class="mt-3 p-3 bg-info bg-opacity-10 border border-info rounded">
                            <h6 class="fw-bold text-info">💡 Cómo usar este código:</h6>
                            <ol class="mb-0">
                                <li>Copia el código PlantUML de arriba</li>
                                <li>Ve a <a href="https://www.plantuml.com/plantuml/uml" target="_blank" class="text-info">PlantUML Online</a></li>
                                <li>Pega el código y haz clic en "Submit"</li>
                                <li>Descarga tu diagrama en PNG, SVG o PDF</li>
                            </ol>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultadosDocumento.style.display = 'block';
    resultadosDocumento.scrollIntoView({ behavior: 'smooth' });
    
    // Guardar datos para descarga
    window.currentDiagramasUML = data;
}

// Mostrar diagramas Mermaid
function mostrarDiagramasMermaid(data) {
    resultadosDocumento.innerHTML = `
        <div class="container">
            <h2 class="text-center mb-5 fw-bold">🧜‍♀️ Diagramas Mermaid Generados</h2>
            
            <div class="result-section">
                <h4 class="fw-bold mb-3">
                    <i class="fas fa-sitemap text-success me-2"></i>
                    Diagrama de ${data.tipo_diagrama.charAt(0).toUpperCase() + data.tipo_diagrama.slice(1)}
                </h4>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6 class="fw-bold">Información del Diagrama:</h6>
                        <ul class="list-unstyled">
                            <li><strong>Tipo:</strong> ${data.tipo_diagrama}</li>
                            <li><strong>Archivos procesados:</strong> ${data.archivos_procesados}</li>
                            <li><strong>Validado:</strong> <span class="badge ${data.validado ? 'bg-success' : 'bg-warning'}">${data.validado ? 'Sí' : 'No'}</span></li>
                            <li><strong>Optimizado:</strong> <span class="badge ${data.optimizado ? 'bg-success' : 'bg-warning'}">${data.optimizado ? 'Sí' : 'No'}</span></li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6 class="fw-bold">Acciones:</h6>
                        <button class="btn btn-info btn-sm me-2" onclick="descargarSoloMermaid()">
                            <i class="fas fa-download me-1"></i>Descargar Mermaid
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="limpiarDocumentoPersonalizado()">
                            <i class="fas fa-refresh me-1"></i>Generar Otro
                        </button>
                    </div>
                </div>
                
                ${data.imagenes_urls ? `
                <div class="mb-4">
                    <h5 class="fw-bold mb-3">🖼️ Vista Previa del Diagrama:</h5>
                    <div class="text-center mb-3">
                        <img src="${data.imagenes_urls.png}" alt="Diagrama Mermaid" class="img-fluid" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div class="text-center">
                        <a href="${data.imagenes_urls.png}" target="_blank" class="btn btn-success btn-sm me-2">
                            <i class="fas fa-image me-1"></i>Ver PNG
                        </a>
                        <a href="${data.imagenes_urls.svg}" target="_blank" class="btn btn-primary btn-sm me-2">
                            <i class="fas fa-vector-square me-1"></i>Ver SVG
                        </a>
                        <a href="${data.imagenes_urls.pdf}" target="_blank" class="btn btn-danger btn-sm">
                            <i class="fas fa-file-pdf me-1"></i>Ver PDF
                        </a>
                    </div>
                </div>
                ` : ''}
                
                <div class="mb-4">
                    <h5 class="fw-bold mb-3">📝 Código Mermaid:</h5>
                    <div class="mermaid-contenido p-3 bg-dark text-light border rounded">
                        <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; margin: 0;">${data.codigo_mermaid}</pre>
                    </div>
                    ${!data.imagenes_urls ? `
                    <div class="alert alert-info mt-3">
                        <h6>💡 Para visualizar el diagrama:</h6>
                        <ol>
                            <li>Copia el código Mermaid de arriba</li>
                            <li>Ve a <a href="https://mermaid.live" target="_blank" class="text-info">Mermaid Live Editor</a></li>
                            <li>Pega el código en el editor</li>
                            <li>Descarga tu diagrama en PNG, SVG o PDF</li>
                        </ol>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    resultadosDocumento.style.display = 'block';
    resultadosDocumento.scrollIntoView({ behavior: 'smooth' });
    
    // Guardar datos para descarga
    window.currentDiagramasMermaid = data;
}

// Funciones de descarga
function descargarDocumentoCompletado() {
    if (!window.currentDocumentoCompletado) {
        alert('No hay documento completado disponible para descargar');
        return;
    }
    
    const data = window.currentDocumentoCompletado;
    const contenido = data.documento_completado;
    
    const blob = new Blob([contenido], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.tipo_documento}-Completado-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function descargarDiagramasUML() {
    if (!window.currentDocumentoCompletado || !window.currentDocumentoCompletado.diagramas_uml) {
        alert('No hay diagramas UML disponibles para descargar');
        return;
    }
    
    const contenido = window.currentDocumentoCompletado.diagramas_uml;
    
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diagramas-UML-${new Date().toISOString().split('T')[0]}.puml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function descargarSoloDiagramas() {
    if (!window.currentDiagramasUML) {
        alert('No hay diagramas disponibles para descargar');
        return;
    }
    
    const data = window.currentDiagramasUML;
    const contenido = data.codigo_plantuml;
    
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diagrama-${data.tipo_diagrama}-${new Date().toISOString().split('T')[0]}.puml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Descargar solo diagramas Mermaid
function descargarSoloMermaid() {
    if (!window.currentDiagramasMermaid) {
        alert('No hay diagramas Mermaid disponibles para descargar');
        return;
    }
    
    const data = window.currentDiagramasMermaid;
    const contenido = data.codigo_mermaid;
    
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diagrama-Mermaid-${data.tipo_diagrama}-${new Date().toISOString().split('T')[0]}.mmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function limpiarDocumentoPersonalizado() {
    selectedPDF = null;
    selectedCodeFiles = [];
    
    if (pdfInput) pdfInput.value = '';
    if (codeInput) codeInput.value = '';
    
    mostrarPDFSeleccionado();
    mostrarArchivosCodigoSeleccionados();
    verificarArchivosCompletos();
    
    resultadosDocumento.style.display = 'none';
    
    window.currentDocumentoCompletado = null;
    window.currentDiagramasUML = null;
    window.currentDiagramasMermaid = null;
}

// Funciones para el pop-up informativo
function mostrarInfoPopup() {
    const overlay = document.getElementById('infoPopupOverlay');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevenir scroll del fondo
}

function cerrarInfoPopup() {
    const overlay = document.getElementById('infoPopupOverlay');
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaurar scroll
}

// Cerrar pop-up con tecla Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        cerrarInfoPopup();
    }
}
)

// ==========================================
// FUNCIONALIDAD DE HISTORIAL DE CONSULTAS
// ==========================================

// Variables globales para historial
let historialData = null;
let documentoActual = null;

// Inicializar funcionalidad de historial cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Cargar información del usuario en el dropdown
    cargarInfoUsuario();
    
    // Event listeners
    document.getElementById('historialBtn').addEventListener('click', mostrarHistorial);
    document.getElementById('actualizarHistorial').addEventListener('click', cargarHistorial);
    
    // Mover el event listener del logout al nuevo botón
    const oldLogoutBtn = document.getElementById('logoutBtn');
    if (oldLogoutBtn) {
        oldLogoutBtn.addEventListener('click', logout);
    }

    // Event listeners para el modal de edición
    const radioButtons = document.querySelectorAll('input[name="tipoSlug"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            toggleCampoNombreUnico();
            actualizarPreviewUrl();
        });
    });

    document.getElementById('perfilBtn').addEventListener('click', mostrarPerfil);
    document.getElementById('guardarPerfil').addEventListener('click', guardarCambiosPerfil);

     // Event listeners para conversaciones
    document.getElementById('conversacionesBtn').addEventListener('click', mostrarConversaciones);
    document.getElementById('actualizarConversaciones').addEventListener('click', cargarConversaciones);
    document.getElementById('nuevaConversacionBtn').addEventListener('click', crearNuevaConversacion);
    document.getElementById('enviarConsulta').addEventListener('click', enviarNuevaConsulta);
    document.getElementById('continuarConversacion').addEventListener('click', continuarConversacionEnPrincipal);
    document.getElementById('nuevoSlug').addEventListener('input', function() {
        actualizarPreviewUrl();
    });
});

// Cargar información del usuario para mostrar en el dropdown
async function cargarInfoUsuario() {
    try {
        const response = await fetch('/api/proyectos/historial');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.usuario) {
                const usuario = data.usuario;
                document.getElementById('userNameDisplay').textContent = 
                    usuario.nombre_completo || 'Usuario';
                document.getElementById('userEmailDisplay').textContent = 
                    usuario.correo_electronico || 'usuario@email.com';
            }
        }
    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}

async function mostrarConversaciones() {
    const modal = new bootstrap.Modal(document.getElementById('conversacionesModal'));
    modal.show();
    
    // Cargar datos de conversaciones
    await cargarConversaciones();
}

// Cargar conversaciones desde el servidor
async function cargarConversaciones() {
    const loadingElement = document.getElementById('loadingConversaciones');
    loadingElement.style.display = 'block';
    
    try {
        const response = await fetch('/api/conversaciones/historial');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            conversacionesData = data;
            mostrarEstadisticasConversaciones(data.estadisticas);
            mostrarListaConversaciones(data.conversaciones);
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error al cargar conversaciones:', error);
        mostrarError('Error al cargar las conversaciones: ' + error.message);
    } finally {
        loadingElement.style.display = 'none';
    }
}

// Mostrar estadísticas de conversaciones
function mostrarEstadisticasConversaciones(estadisticas) {
    document.getElementById('totalConversaciones').textContent = estadisticas.total_conversaciones || 0;
    document.getElementById('totalMensajes').textContent = estadisticas.total_mensajes || 0;
    document.getElementById('conversacionesHoy').textContent = estadisticas.conversaciones_hoy || 0;
    document.getElementById('conversacionesActivas').textContent = estadisticas.conversaciones_activas || 0;
}

// Mostrar lista de conversaciones
function mostrarListaConversaciones(conversaciones) {
    const container = document.getElementById('conversacionesList');
    container.innerHTML = '';
    
    if (!conversaciones || conversaciones.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    No tienes conversaciones aún. ¡Crea tu primera conversación!
                </div>
            </div>
        `;
        return;
    }
    
    conversaciones.forEach(conversacion => {
        const estadoBadge = obtenerBadgeEstadoConversacion(conversacion.estado);
        const fechaCreacion = new Date(conversacion.creado_en).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const fechaActualizacion = new Date(conversacion.actualizado_en).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-3';

        card.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-comment-dots text-success me-2"></i>
                        ${conversacion.titulo}
                    </h6>
                    ${estadoBadge}
                </div>
                <div class="card-body">
                    <p class="card-text text-muted small">
                        ${conversacion.descripcion || 'Sin descripción'}
                    </p>
                    <div class="mb-2">
                        <small class="text-muted">
                            <i class="fas fa-comments me-1"></i>
                            ${conversacion.total_mensajes || 0} mensajes
                        </small>
                    </div>
                    <div class="mb-2">
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>
                            Creada: ${fechaCreacion}
                        </small>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            Actualizada: ${fechaActualizacion}
                        </small>
                    </div>
                    ${conversacion.es_compartida ? `
                        <div class="mb-2">
                            <span class="badge bg-info">
                                <i class="fas fa-share-alt me-1"></i>Compartida
                            </span>
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer bg-transparent">
                    <div class="btn-group w-100 mb-2" role="group">
                        <button class="btn btn-outline-info btn-sm" onclick="verConversacion(${conversacion.id})">
                            <i class="fas fa-eye me-1"></i>Ver
                        </button>
                        <button class="btn btn-outline-success btn-sm" onclick="continuarConversacion(${conversacion.id})">
                            <i class="fas fa-play me-1"></i>Continuar
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="archivarConversacion(${conversacion.id})">
                            <i class="fas fa-archive me-1"></i>Archivar
                        </button>
                    </div>
                    <div class="d-grid">
                        <button class="btn btn-outline-primary btn-sm" onclick="compartirConversacion(${conversacion.id})">
                            <i class="fas fa-share-alt me-1"></i>Compartir
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function mostrarMensajeError(mensaje) {
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Error de archivo:</strong><br>
        ${mensaje.replace(/\n/g, '<br>')}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Agregar al body
    document.body.appendChild(alertDiv);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}


// Obtener badge de estado de conversación
function obtenerBadgeEstadoConversacion(estado) {
    const badges = {
        'activa': '<span class="badge bg-success">Activa</span>',
        'archivada': '<span class="badge bg-warning">Archivada</span>',
        'eliminada': '<span class="badge bg-danger">Eliminada</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
}

// Crear nueva conversación
async function crearNuevaConversacion() {
    try {
        const titulo = prompt('Ingresa un título para la nueva conversación:');
        if (!titulo) return;
        
        const descripcion = prompt('Ingresa una descripción (opcional):') || '';
        
        const response = await fetch('/api/conversaciones/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: titulo,
                descripcion: descripcion
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Conversación creada exitosamente', 'success');
            await cargarConversaciones(); // Recargar lista
            
            // Preguntar si quiere continuar en la página principal
            if (confirm('¿Quieres continuar esta conversación en la página principal?')) {
                conversacionActualId = data.conversacion.id;
                // Cerrar modal de conversaciones
                const modal = bootstrap.Modal.getInstance(document.getElementById('conversacionesModal'));
                modal.hide();
                
                // Mostrar indicador de conversación activa
                mostrarIndicadorConversacionActiva(data.conversacion);
            }
        } else {
            throw new Error(data.error || 'Error al crear conversación');
        }
        
    } catch (error) {
        console.error('Error al crear conversación:', error);
        mostrarError('Error al crear la conversación: ' + error.message);
    }
}

// Ver conversación completa
async function verConversacion(conversacionId) {
    try {
        const response = await fetch(`/api/conversaciones/${conversacionId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            conversacionActual = data.conversacion;
            mostrarModalConversacion(data.conversacion, data.mensajes);
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error al cargar conversación:', error);
        mostrarError('Error al cargar la conversación: ' + error.message);
    }
}

// Mostrar modal de conversación individual
function mostrarModalConversacion(conversacion, mensajes) {
    document.getElementById('conversacionTitulo').textContent = conversacion.titulo;
    
    const mensajesContainer = document.getElementById('mensajesConversacion');
    mensajesContainer.innerHTML = '';
    
    if (!mensajes || mensajes.length === 0) {
        mensajesContainer.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle me-2"></i>
                Esta conversación no tiene mensajes aún.
            </div>
        `;
    } else {
        mensajes.forEach((mensaje, index) => {
            const fechaMensaje = new Date(mensaje.creado_en).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const tipoIcon = mensaje.tipo_mensaje === 'consulta' ? 'fa-user' : 'fa-robot';
            const tipoColor = mensaje.tipo_mensaje === 'consulta' ? 'primary' : 'success';
            
            const mensajeDiv = document.createElement('div');
            mensajeDiv.className = `mb-3 p-3 border rounded bg-light`;
            mensajeDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="mb-0 text-${tipoColor}">
                        <i class="fas ${tipoIcon} me-2"></i>
                        ${mensaje.tipo_mensaje === 'consulta' ? 'Consulta' : 'Respuesta'} #${index + 1}
                        ${mensaje.es_compartido ? '<span class="badge bg-info ms-2"><i class="fas fa-share-alt"></i></span>' : ''}
                    </h6>
                    <div class="d-flex align-items-center">
                        <small class="text-muted me-2">${fechaMensaje}</small>
                        <button class="btn btn-outline-primary btn-sm" onclick="compartirConsulta(${mensaje.id})" title="Compartir esta consulta">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
                <div style="white-space: pre-wrap;">${mensaje.contenido_mensaje}</div>
            `;
            mensajesContainer.appendChild(mensajeDiv);
        });
    }
    
    // Limpiar textarea
    document.getElementById('nuevaConsulta').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('conversacionModal'));
    modal.show();
}

// Enviar nueva consulta a la conversación
async function enviarNuevaConsulta() {
    if (!conversacionActual) {
        mostrarError('No hay conversación seleccionada');
        return;
    }
    
    const consulta = document.getElementById('nuevaConsulta').value.trim();
    if (!consulta) {
        mostrarError('Por favor escribe una consulta');
        return;
    }
    
    try {
        const response = await fetch('/api/conversaciones/mensaje', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversacion_id: conversacionActual.id,
                contenido_mensaje: consulta,
                tipo_mensaje: 'consulta'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Consulta enviada exitosamente', 'success');
            // Recargar la conversación
            await verConversacion(conversacionActual.id);
        } else {
            throw new Error(data.error || 'Error al enviar consulta');
        }
        
    } catch (error) {
        console.error('Error al enviar consulta:', error);
        mostrarError('Error al enviar la consulta: ' + error.message);
    }
}

// Continuar conversación en página principal
function continuarConversacion(conversacionId) {
    conversacionActualId = conversacionId;
    
    // Cerrar modal de conversaciones
    const modal = bootstrap.Modal.getInstance(document.getElementById('conversacionesModal'));
    modal.hide();
    
    // Buscar la conversación en los datos
    const conversacion = conversacionesData.conversaciones.find(c => c.id === conversacionId);
    if (conversacion) {
        mostrarIndicadorConversacionActiva(conversacion);
    }
    
    mostrarNotificacion('Conversación activada. Tus próximas consultas se agregarán a esta conversación.', 'info');
}

// Continuar conversación desde modal individual
function continuarConversacionEnPrincipal() {
    if (conversacionActual) {
        continuarConversacion(conversacionActual.id);
        
        // Cerrar modal de conversación individual
        const modal = bootstrap.Modal.getInstance(document.getElementById('conversacionModal'));
        modal.hide();
    }
}

// Mostrar indicador de conversación activa
function mostrarIndicadorConversacionActiva(conversacion) {
    // Crear o actualizar indicador en la interfaz
    let indicador = document.getElementById('conversacionActivaIndicador');
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'conversacionActivaIndicador';
        indicador.className = 'alert alert-info alert-dismissible fade show position-fixed';
        indicador.style.cssText = 'top: 100px; right: 20px; z-index: 1050; max-width: 350px;';
        document.body.appendChild(indicador);
    }
    
    indicador.innerHTML = `
        <i class="fas fa-comment-dots me-2"></i>
        <strong>Conversación activa:</strong> ${conversacion.titulo}
        <button type="button" class="btn-close" onclick="desactivarConversacion()"></button>
    `;
}

// Desactivar conversación actual
function desactivarConversacion() {
    conversacionActualId = null;
    const indicador = document.getElementById('conversacionActivaIndicador');
    if (indicador) {
        indicador.remove();
    }
    mostrarNotificacion('Conversación desactivada', 'info');
}

// Archivar conversación
async function archivarConversacion(conversacionId) {
    if (!confirm('¿Estás seguro de que quieres archivar esta conversación?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/conversaciones/${conversacionId}/archivar`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Conversación archivada exitosamente', 'success');
            await cargarConversaciones(); // Recargar lista
        } else {
            throw new Error(data.error || 'Error al archivar conversación');
        }
        
    } catch (error) {
        console.error('Error al archivar conversación:', error);
        mostrarError('Error al archivar la conversación: ' + error.message);
    }
}

// Mostrar modal de historial
async function mostrarHistorial() {
    const modal = new bootstrap.Modal(document.getElementById('historialModal'));
    modal.show();
    
    // Cargar datos del historial
    await cargarHistorial();
}

// Cargar historial desde el servidor
async function cargarHistorial() {
    const loadingElement = document.getElementById('loadingHistorial');
    loadingElement.style.display = 'block';
    
    try {
        const response = await fetch('/api/proyectos/historial');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            historialData = data;
            mostrarEstadisticas(data.estadisticas);
            mostrarProyectos(data.proyectos);
            mostrarDocumentos(data.documentos);
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error al cargar historial:', error);
        mostrarError('Error al cargar el historial: ' + error.message);
    } finally {
        loadingElement.style.display = 'none';
    }
}

// Mostrar estadísticas del usuario
function mostrarEstadisticas(estadisticas) {
    document.getElementById('totalProyectos').textContent = estadisticas.total_proyectos || 0;
    document.getElementById('totalDocumentos').textContent = estadisticas.total_documentos || 0;
    document.getElementById('proyectosCompletados').textContent = estadisticas.proyectos_completados || 0;
    document.getElementById('proyectosProceso').textContent = estadisticas.proyectos_en_proceso || 0;
}

// Mostrar lista de proyectos
function mostrarProyectos(proyectos) {
    const container = document.getElementById('proyectosList');
    container.innerHTML = '';
    
    if (!proyectos || proyectos.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    No tienes proyectos de código aún. ¡Sube tu primer proyecto!
                </div>
            </div>
        `;
        return;
    }
    
    proyectos.forEach(proyecto => {
        const estadoBadge = obtenerBadgeEstado(proyecto.estado_procesamiento);
        const tipoBadge = obtenerBadgeTipoProyecto(proyecto.nombre_proyecto, proyecto.descripcion); // NUEVO
        const fechaCreacion = new Date(proyecto.creado_en).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const proyectoCard = `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 shadow-sm">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            <i class="fas fa-code me-2"></i>
                            ${proyecto.nombre_proyecto}
                        </h6>
                        <div>
                            ${tipoBadge}
                            ${estadoBadge}
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="card-text text-muted small">
                            ${proyecto.descripcion || 'Sin descripción'}
                        </p>
                        <div class="mb-2">
                            <small class="text-muted">
                                <i class="fas fa-code me-1"></i>
                                ${proyecto.lenguaje_programacion || 'No especificado'}
                            </small>
                        </div>
                        <div class="mb-2">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>
                                ${fechaCreacion}
                            </small>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-outline-primary" onclick="verProyecto(${proyecto.id})">
                            <i class="fas fa-eye me-1"></i>Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += proyectoCard;
    });
}

function toggleCampoNombreUnico() {
    const nombreUnicoRadio = document.getElementById('nombreUnico');
    const campoNombreUnico = document.getElementById('campoNombreUnico');
    const previewDiv = document.getElementById('previewNuevaUrl');
    
    if (nombreUnicoRadio.checked) {
        campoNombreUnico.style.display = 'block';
        previewDiv.style.display = 'block';
    } else {
        campoNombreUnico.style.display = 'none';
        if (document.getElementById('mantenerSlug').checked) {
            previewDiv.style.display = 'none';
        } else {
            previewDiv.style.display = 'block';
        }
    }
}

function actualizarPreviewUrl() {
    const tipoSlug = document.querySelector('input[name="tipoSlug"]:checked').value;
    const previewDiv = document.getElementById('previewNuevaUrl');
    const previewInput = document.getElementById('nuevaUrlPreview');
    const baseUrl = window.location.origin + '/compartido/';
    
    if (tipoSlug === 'mantener') {
        previewDiv.style.display = 'none';
    } else if (tipoSlug === 'nombre') {
        const nuevoSlug = document.getElementById('nuevoSlug').value.trim();
        if (nuevoSlug) {
            previewInput.value = baseUrl + nuevoSlug;
            previewDiv.style.display = 'block';
        } else {
            previewDiv.style.display = 'none';
        }
    } else if (tipoSlug === 'uuid') {
        previewInput.value = baseUrl + '[UUID-generado-automáticamente]';
        previewDiv.style.display = 'block';
    }
}



// NUEVO: Determinar el tipo de proyecto basado en su nombre y descripción
function obtenerBadgeTipoProyecto(nombre, descripcion) {
    if (nombre.includes('Documento Personalizado') || descripcion.includes('Documento Personalizado')) {
        return '<span class="badge bg-warning text-dark">Personalizado</span>';
    } else if (nombre.includes('SRS') || descripcion.includes('SRS')) {
        return '<span class="badge bg-info">SRS</span>';
    } else if (nombre.includes('Diagrama') || descripcion.includes('Diagrama')) {
        return '<span class="badge bg-primary">Diagrama</span>';
    }
    return '<span class="badge bg-secondary">Otro</span>';
}

// Mostrar lista de documentos
function mostrarDocumentos(documentos) {
    const container = document.getElementById('documentosList');
    container.innerHTML = '';
    
    if (!documentos || documentos.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i>
                    No tienes documentos generados aún.
                </div>
            </div>
        `;
        return;
    }
    
    documentos.forEach(documento => {
        const fechaGeneracion = new Date(documento.generado_en).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const tipoIcon = obtenerIconoTipoDocumento(documento.tipo_documento);
        const formatoBadge = obtenerBadgeFormato(documento.formato_salida);
        const tipoBadge = obtenerBadgeTipoDocumento(documento.tipo_documento); // NUEVO
        
        const documentoCard = `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 shadow-sm">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            ${tipoIcon}
                            ${documento.tipo_documento}
                        </h6>
                        <div>
                            ${tipoBadge}
                            ${formatoBadge}
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="card-text text-muted small">
                            <strong>Proyecto:</strong> ${documento.proyectos_codigo?.nombre_proyecto || documento.nombre_proyecto || 'Sin nombre'}
                        </p>
                        <div class="mb-2">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>
                                ${fechaGeneracion}
                            </small>
                        </div>
                        <div class="mb-2">
                            <small class="text-muted">
                                <i class="fas fa-tag me-1"></i>
                                Versión ${documento.version || '1.0'}
                            </small>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="verDocumento(${documento.id})">
                            <i class="fas fa-eye me-1"></i>Ver Contenido
                        </button>
                        ${documento.url_documento ? `
                            <button class="btn btn-sm btn-outline-success" onclick="descargarDocumentoUrl('${documento.url_documento}')">
                                <i class="fas fa-download me-1"></i>Descargar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += documentoCard;
    });
}

// Funciones auxiliares para badges e iconos
function obtenerBadgeEstado(estado) {
    const badges = {
        'completado': '<span class="badge bg-success">Completado</span>',
        'procesando': '<span class="badge bg-warning">Procesando</span>',
        'pendiente': '<span class="badge bg-secondary">Pendiente</span>',
        'error_subida': '<span class="badge bg-danger">Error Subida</span>',
        'error_analisis': '<span class="badge bg-danger">Error Análisis</span>',
        'subiendo': '<span class="badge bg-info">Subiendo</span>'
    };
    return badges[estado] || '<span class="badge bg-secondary">Desconocido</span>';
}

function obtenerBadgeFormato(formato) {
    const badges = {
        'texto_plano': '<span class="badge bg-secondary">Texto</span>',
        'markdown': '<span class="badge bg-info">Markdown</span>',
        'pdf_url': '<span class="badge bg-danger">PDF</span>',
        'json': '<span class="badge bg-warning">JSON</span>'
    };
    return badges[formato] || '<span class="badge bg-secondary">Otro</span>';
}

function obtenerIconoTipoDocumento(tipoDocumento) {
    if (tipoDocumento.includes('Documento Personalizado')) {
        return '<i class="fas fa-magic text-warning me-2"></i>';
    } else if (tipoDocumento.includes('SRS')) {
        return '<i class="fas fa-file-alt text-primary me-2"></i>';
    } else if (tipoDocumento.includes('Diagrama') || tipoDocumento.includes('UML')) {
        return '<i class="fas fa-project-diagram text-info me-2"></i>';
    } else if (tipoDocumento.includes('Análisis')) {
        return '<i class="fas fa-chart-line text-success me-2"></i>';
    }
    return '<i class="fas fa-file text-secondary me-2"></i>';
}

// Ver detalles de un proyecto específico
async function verProyecto(proyectoId) {
    try {
        const response = await fetch(`/api/proyectos/proyecto/${proyectoId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Mostrar detalles del proyecto en un modal o expandir la tarjeta
            alert(`Proyecto: ${data.proyecto.nombre_proyecto}\nEstado: ${data.proyecto.estado_procesamiento}\nDocumentos: ${data.documentos.length}`);
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error al cargar proyecto:', error);
        mostrarError('Error al cargar el proyecto: ' + error.message);
    }
}

// Ver contenido completo de un documento
async function verDocumento(documentoId) {
    if (!historialData || !historialData.documentos) {
        mostrarError('No se han cargado los datos del historial');
        return;
    }
    
    const documento = historialData.documentos.find(doc => doc.id === documentoId);
    
    if (!documento) {
        mostrarError('Documento no encontrado');
        return;
    }
    
    documentoActual = documento;
    
    // Configurar el modal
    document.getElementById('documentoTitulo').textContent = documento.tipo_documento;
    
    const contenidoElement = document.getElementById('documentoContenido');
    
    if (documento.contenido_documento) {
        // Si el contenido es markdown, convertirlo a HTML básico
        let contenidoHTML = documento.contenido_documento;
        
        if (documento.formato_salida === 'markdown') {
            contenidoHTML = convertirMarkdownBasico(contenidoHTML);
        }
        
        contenidoElement.innerHTML = `<pre style="white-space: pre-wrap; font-family: 'Segoe UI', sans-serif;">${contenidoHTML}</pre>`;
    } else if (documento.url_documento) {
        contenidoElement.innerHTML = `
            <div class="text-center">
                <i class="fas fa-external-link-alt fa-3x text-muted mb-3"></i>
                <p>Este documento está disponible como enlace externo.</p>
                <a href="${documento.url_documento}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt me-2"></i>Abrir Documento
                </a>
            </div>
        `;
    } else {
        contenidoElement.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>No hay contenido disponible para este documento.</p>
            </div>
        `;
    }
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('documentoModal'));
    modal.show();
}

// Descargar documento desde URL
function descargarDocumentoUrl(url) {
    window.open(url, '_blank');
}

// Convertir markdown básico a HTML
function convertirMarkdownBasico(markdown) {
    return markdown
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\n/g, '<br>');
}

// Función de logout (mover aquí desde el código existente)
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/login';
            } else {
                alert('Error al cerrar sesión');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cerrar sesión');
        });
    }
}

// Función para mostrar errores
function mostrarError(mensaje) {
    // Crear un toast o alert para mostrar errores
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Mostrar modal de perfil
async function mostrarPerfil() {
    const modal = new bootstrap.Modal(document.getElementById('perfilModal'));
    modal.show();
    
    // Cargar datos del perfil
    await cargarDatosPerfil();
}

// Cargar datos del perfil desde el servidor
async function cargarDatosPerfil() {
    try {
        const response = await fetch('/api/auth/user');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.user) {
            perfilData = data.user;
            mostrarDatosPerfil(data.user);
            
            // Cargar estadísticas del historial si están disponibles
            if (historialData && historialData.estadisticas) {
                mostrarEstadisticasPerfil(historialData.estadisticas);
            } else {
                // Cargar estadísticas por separado
                await cargarEstadisticasPerfil();
            }
        } else {
            throw new Error(data.error || 'Error al cargar datos del usuario');
        }
        
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        mostrarNotificacion('Error al cargar el perfil: ' + error.message, 'danger');
    }
}

// Mostrar datos del perfil en el modal
function mostrarDatosPerfil(usuario) {
    // Información básica
    document.getElementById('perfilNombreCompleto').textContent = 
        usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim() || 'Usuario';
    document.getElementById('perfilEmail').textContent = 
        usuario.correo_electronico || 'usuario@email.com';
    
    // Fecha de registro
    const fechaRegistro = usuario.creado_en ? 
        new Date(usuario.creado_en).toLocaleDateString('es-ES') : '-';
    document.getElementById('perfilFechaRegistro').textContent = fechaRegistro;
    
    // Campos del formulario
    document.getElementById('perfilNombre').value = usuario.nombre || '';
    document.getElementById('perfilApellidos').value = usuario.apellidos || '';
    document.getElementById('perfilCorreo').value = usuario.correo_electronico || '';
    
    // Limpiar campos de contraseña
    document.getElementById('perfilContrasenaActual').value = '';
    document.getElementById('perfilNuevaContrasena').value = '';
    document.getElementById('perfilConfirmarContrasena').value = '';
}

// Cargar estadísticas para el perfil
async function cargarEstadisticasPerfil() {
    try {
        const response = await fetch('/api/proyectos/historial');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.estadisticas) {
                mostrarEstadisticasPerfil(data.estadisticas);
            }
        }
    } catch (error) {
        console.error('Error al cargar estadísticas del perfil:', error);
    }
}

// Mostrar estadísticas en el perfil
function mostrarEstadisticasPerfil(estadisticas) {
    document.getElementById('perfilTotalProyectos').textContent = 
        estadisticas.total_proyectos || 0;
    document.getElementById('perfilTotalDocumentos').textContent = 
        estadisticas.total_documentos || 0;
    
    // Último acceso
    const ultimoAcceso = perfilData && perfilData.ultimo_inicio_sesion_en ? 
        new Date(perfilData.ultimo_inicio_sesion_en).toLocaleDateString('es-ES') : '-';
    document.getElementById('perfilUltimoAcceso').textContent = ultimoAcceso;
    
    // Tiempo activo (calculado desde la fecha de registro)
    let tiempoActivo = '-';
    if (perfilData && perfilData.creado_en) {
        const fechaRegistro = new Date(perfilData.creado_en);
        const ahora = new Date();
        const diasActivo = Math.floor((ahora - fechaRegistro) / (1000 * 60 * 60 * 24));
        tiempoActivo = `${diasActivo} días`;
    }
    document.getElementById('perfilTiempoActivo').textContent = tiempoActivo;
}

// Guardar cambios del perfil
async function guardarCambiosPerfil() {
    try {
        // Obtener datos del formulario
        const nombre = document.getElementById('perfilNombre').value.trim();
        const apellidos = document.getElementById('perfilApellidos').value.trim();
        const correo = document.getElementById('perfilCorreo').value.trim();
        const contrasenaActual = document.getElementById('perfilContrasenaActual').value;
        const nuevaContrasena = document.getElementById('perfilNuevaContrasena').value;
        const confirmarContrasena = document.getElementById('perfilConfirmarContrasena').value;
        
        // Validaciones
        if (!nombre) {
            mostrarNotificacion('El nombre es requerido', 'warning');
            return;
        }
        
        if (!correo) {
            mostrarNotificacion('El correo electrónico es requerido', 'warning');
            return;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            mostrarNotificacion('Por favor ingresa un correo electrónico válido', 'warning');
            return;
        }
        
        // Validar contraseñas si se quiere cambiar
        if (nuevaContrasena || confirmarContrasena) {
            if (!contrasenaActual) {
                mostrarNotificacion('Debes ingresar tu contraseña actual para cambiarla', 'warning');
                return;
            }
            
            if (nuevaContrasena !== confirmarContrasena) {
                mostrarNotificacion('Las nuevas contraseñas no coinciden', 'warning');
                return;
            }
            
            if (nuevaContrasena.length < 6) {
                mostrarNotificacion('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
                return;
            }
        }
        
        // Preparar datos para enviar
        const datosActualizacion = {
            nombre,
            apellidos,
            correo_electronico: correo
        };
        
        // Agregar contraseñas si se van a cambiar
        if (nuevaContrasena) {
            datosActualizacion.contrasena_actual = contrasenaActual;
            datosActualizacion.nueva_contrasena = nuevaContrasena;
        }
        
        // Enviar actualización al servidor
        const response = await fetch('/api/auth/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosActualizacion)
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Perfil actualizado correctamente', 'success');
            
            // Actualizar información en el dropdown
            await cargarInfoUsuario();
            
            // Recargar datos del perfil
            await cargarDatosPerfil();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('perfilModal'));
            modal.hide();
        } else {
            throw new Error(data.error || 'Error al actualizar el perfil');
        }
        
    } catch (error) {
        console.error('Error al guardar perfil:', error);
        mostrarNotificacion('Error al guardar los cambios: ' + error.message, 'danger');
    }
}

async function compartirConversacion(conversacionId) {
    mostrarModalOpcionesCompartir('conversacion', conversacionId);
    
    try {
        const response = await fetch(`/api/compartir/conversacion/${conversacionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: titulo || undefined,
                descripcion: descripcion || undefined
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const urlCompleta = window.location.origin + data.url_publica;
            
            // Mostrar modal con la URL para compartir
            mostrarModalCompartir(urlCompleta, data.contenido);
            
            mostrarNotificacion('Conversación compartida exitosamente', 'success');
        } else {
            throw new Error(data.error || 'Error al compartir conversación');
        }
        
    } catch (error) {
        console.error('Error al compartir conversación:', error);
        mostrarError('Error al compartir la conversación: ' + error.message);
    }
}

async function compartirConsulta(mensajeId) {
    mostrarModalOpcionesCompartir('consulta', mensajeId);
    
    try {
        const response = await fetch(`/api/compartir/consulta/${mensajeId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: titulo,
                descripcion: descripcion || undefined
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const urlCompleta = window.location.origin + data.url_publica;
            
            // Mostrar modal con la URL para compartir
            mostrarModalCompartir(urlCompleta, data.contenido);
            
            mostrarNotificacion('Consulta compartida exitosamente', 'success');
        } else {
            throw new Error(data.error || 'Error al compartir consulta');
        }
        
    } catch (error) {
        console.error('Error al compartir consulta:', error);
        mostrarError('Error al compartir la consulta: ' + error.message);
    }
}

function mostrarModalCompartir(url, contenido) {
    const modalHtml = `
        <div class="modal fade" id="modalCompartir" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-share-alt me-2"></i>Contenido Compartido
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i>
                            ¡Tu contenido ha sido compartido exitosamente!
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label fw-bold">URL Pública:</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="urlCompartida" value="${url}" readonly>
                                <button class="btn btn-outline-secondary" type="button" onclick="copiarUrl()">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i>
                                Cualquier persona con este enlace podrá ver tu contenido compartido.
                            </small>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <a href="${url}" target="_blank" class="btn btn-primary">
                                <i class="fas fa-external-link-alt me-2"></i>Ver contenido compartido
                            </a>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalCompartir');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalCompartir'));
    modal.show();
}

function copiarUrl() {
    const input = document.getElementById('urlCompartida');
    input.select();
    document.execCommand('copy');
    mostrarNotificacion('URL copiada al portapapeles', 'success');
}

function mostrarModalOpcionesCompartir(tipo, id) {
    const modalHtml = `
        <div class="modal fade" id="modalOpcionesCompartir" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-share-alt me-2"></i>Opciones para Compartir
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-4">
                            <h6 class="mb-3">¿Cómo quieres generar la URL?</h6>
                            
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="radio" name="tipoUrl" id="urlPersonalizada" value="personalizada" checked>
                                <label class="form-check-label" for="urlPersonalizada">
                                    <strong>Nombre personalizado</strong>
                                    <br><small class="text-muted">Ejemplo: mi-conversacion-importante</small>
                                </label>
                            </div>
                            
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="radio" name="tipoUrl" id="urlUUID" value="uuid">
                                <label class="form-check-label" for="urlUUID">
                                    <strong>Identificador único (UUID)</strong>
                                    <br><small class="text-muted">Ejemplo: 685224fb-8c90-8009-b389-da6aa017a98f</small>
                                </label>
                            </div>
                        </div>
                        
                        <div id="camposPersonalizados">
                            <div class="mb-3">
                                <label for="tituloCompartir" class="form-label">Título:</label>
                                <input type="text" class="form-control" id="tituloCompartir" placeholder="Título para compartir">
                            </div>
                            
                            <div class="mb-3">
                                <label for="descripcionCompartir" class="form-label">Descripción (opcional):</label>
                                <textarea class="form-control" id="descripcionCompartir" rows="3" placeholder="Descripción para compartir"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="procesarCompartir('${tipo}', ${id})">Compartir</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalOpcionesCompartir');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar/ocultar campos según selección
    document.querySelectorAll('input[name="tipoUrl"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const camposPersonalizados = document.getElementById('camposPersonalizados');
            if (this.value === 'uuid') {
                camposPersonalizados.style.display = 'none';
            } else {
                camposPersonalizados.style.display = 'block';
            }
        });
    });
    
    const modal = new bootstrap.Modal(document.getElementById('modalOpcionesCompartir'));
    modal.show();
}

async function procesarCompartir(tipo, id) {
    const tipoUrl = document.querySelector('input[name="tipoUrl"]:checked').value;
    const usarUUID = tipoUrl === 'uuid';
    
    let titulo = '';
    let descripcion = '';
    
    if (!usarUUID) {
        titulo = document.getElementById('tituloCompartir').value.trim();
        descripcion = document.getElementById('descripcionCompartir').value.trim();
        
        if (!titulo) {
            mostrarError('Por favor, ingresa un título');
            return;
        }
    } else {
        titulo = `Contenido compartido - ${new Date().toLocaleDateString()}`;
        descripcion = 'Contenido compartido con identificador único';
    }
    
    try {
        const endpoint = tipo === 'conversacion' ? 
            `/api/compartir/conversacion/${id}` : 
            `/api/compartir/consulta/${id}`;
            
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titulo: titulo,
                descripcion: descripcion,
                usar_uuid: usarUUID
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Cerrar modal de opciones
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalOpcionesCompartir'));
            modal.hide();
            
            const urlCompleta = window.location.origin + data.url_publica;
            
            // Mostrar modal con la URL para compartir
            mostrarModalCompartir(urlCompleta, data.contenido);
            
            mostrarNotificacion(`${tipo === 'conversacion' ? 'Conversación' : 'Consulta'} compartida exitosamente`, 'success');
        } else {
            throw new Error(data.error || `Error al compartir ${tipo}`);
        }
        
    } catch (error) {
        console.error(`Error al compartir ${tipo}:`, error);
        mostrarError(`Error al compartir la ${tipo}: ` + error.message);
    }
}

document.getElementById('linksCompartidosBtn').addEventListener('click', function() {
    mostrarLinksCompartidos();
});

document.getElementById('actualizarLinksCompartidos').addEventListener('click', function() {
    cargarLinksCompartidos();
});

async function mostrarLinksCompartidos() {
    const modal = new bootstrap.Modal(document.getElementById('linksCompartidosModal'));
    modal.show();
    await cargarLinksCompartidos();
}

async function cargarLinksCompartidos() {
    const loadingElement = document.getElementById('loadingLinksCompartidos');
    const listElement = document.getElementById('linksCompartidosList');
    const noLinksElement = document.getElementById('noLinksMessage');
    
    try {
        loadingElement.style.display = 'block';
        listElement.innerHTML = '';
        noLinksElement.style.display = 'none';
        
        const response = await fetch('/api/compartir/usuario/mis-compartidos');
        const data = await response.json();
        
        if (data.success && data.contenido && data.contenido.length > 0) {
            mostrarListaLinksCompartidos(data.contenido);
        } else {
            noLinksElement.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error al cargar links compartidos:', error);
        mostrarError('Error al cargar los links compartidos');
    } finally {
        loadingElement.style.display = 'none';
    }
}

function mostrarListaLinksCompartidos(links) {
    const listElement = document.getElementById('linksCompartidosList');
    
    const html = links.map(link => {
        const urlCompleta = window.location.origin + '/compartido/' + link.slug;
        return `
            <div class="col-12 mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h6 class="card-title mb-1">${link.titulo}</h6>
                                <p class="card-text text-muted small mb-2">${link.descripcion || 'Sin descripción'}</p>
                                <div class="d-flex align-items-center text-muted small">
                                    <span class="me-3">
                                        <i class="fas fa-eye me-1"></i>${link.vistas} vistas
                                    </span>
                                    <span class="me-3">
                                        <i class="fas fa-calendar me-1"></i>${new Date(link.compartido_en).toLocaleDateString('es-ES')}
                                    </span>
                                    <span class="badge bg-${link.tipo_contenido === 'conversacion' ? 'primary' : 'info'}">
                                        ${link.tipo_contenido === 'conversacion' ? 'Conversación' : 'Consulta'}
                                    </span>
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <div class="btn-group-vertical" role="group">
                                    <a href="${urlCompleta}" target="_blank" class="btn btn-outline-primary btn-sm">
                                        <i class="fas fa-external-link-alt me-1"></i>Ver
                                    </a>
                                    <!-- ELIMINADO: Botón de editar -->
                                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarLinkCompartido(${link.id}, '${link.titulo}')">
                                        <i class="fas fa-trash me-1"></i>Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    listElement.innerHTML = html;
}

async function eliminarLinkCompartido(id, titulo) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el link "${titulo}"?\n\nEsta acción no se puede deshacer y el contenido dejará de ser accesible públicamente.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/compartir/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion('Link eliminado exitosamente', 'success');
            await cargarLinksCompartidos();
        } else {
            throw new Error(data.error || 'Error al eliminar el link');
        }
        
    } catch (error) {
        console.error('Error al eliminar link:', error);
        mostrarError('Error al eliminar el link: ' + error.message);
    }
}

function copiarUrlLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        mostrarNotificacion('URL copiada al portapapeles', 'success');
    }).catch(() => {
        mostrarError('Error al copiar la URL');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Configurar event listeners para los radio buttons del modal de edición
    document.querySelectorAll('input[name="tipoSlug"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const campoNombreUnico = document.getElementById('campoNombreUnico');
            const previewNuevaUrl = document.getElementById('previewNuevaUrl');
            const nuevaUrlPreview = document.getElementById('nuevaUrlPreview');
            const baseUrl = window.location.origin + '/compartido/';
            
            if (this.value === 'nombre') {
                campoNombreUnico.style.display = 'block';
                previewNuevaUrl.style.display = 'none';
            } else if (this.value === 'uuid') {
                campoNombreUnico.style.display = 'none';
                previewNuevaUrl.style.display = 'block';
                nuevaUrlPreview.value = baseUrl + 'nuevo-uuid-generado';
            } else {
                campoNombreUnico.style.display = 'none';
                previewNuevaUrl.style.display = 'none';
            }
        });
    });
    
    // Event listener para el campo de nombre único personalizado
    const nuevoSlugInput = document.getElementById('nuevoSlug');
    if (nuevoSlugInput) {
        nuevoSlugInput.addEventListener('input', function() {
            const previewNuevaUrl = document.getElementById('previewNuevaUrl');
            const nuevaUrlPreview = document.getElementById('nuevaUrlPreview');
            const baseUrl = window.location.origin + '/compartido/';
            
            if (this.value.trim()) {
                previewNuevaUrl.style.display = 'block';
                nuevaUrlPreview.value = baseUrl + this.value.trim();
            } else {
                previewNuevaUrl.style.display = 'none';
            }
        });
    }
});