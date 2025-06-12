// Variables globales
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadedFiles = document.getElementById('uploadedFiles');
const filesList = document.getElementById('filesList');
const generateBtn = document.getElementById('generateBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultados = document.getElementById('resultados');

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
        const extensionesSoportadas = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'html', 'css', 'scss', 'vue', 'kt', 'swift', 'dart', 'sql', 'zip', 'rar', 'txt', 'md'];
        
        // Soportar ZIP y RAR
        if (extensionesSoportadas.includes(extension) || 
            file.type === 'application/zip' || 
            file.type === 'application/x-rar-compressed' ||
            file.type === 'application/vnd.rar') {
            // Verificar si el archivo ya está en la lista
            const existeArchivo = selectedFiles.some(existingFile => 
                existingFile.name === file.name && existingFile.size === file.size
            );
            
            if (!existeArchivo) {
                selectedFiles.push(file);
            }
        }
    });
    
    mostrarArchivosSeleccionados();
}

// Función para un solo archivo (compatibilidad hacia atrás)
function handleFile(file) {
    handleMultipleFiles([file]);
}

// Mostrar todos los archivos seleccionados
function mostrarArchivosSeleccionados() {
    if (selectedFiles.length === 0) {
        uploadedFiles.style.display = 'none';
        return;
    }
    
    filesList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
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
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarArchivo(${index})" title="Eliminar archivo">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        filesList.appendChild(fileItem);
    });
    
    uploadedFiles.style.display = 'block';
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

// Función para analizar archivo individual
async function analizarArchivoIndividual() {
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
}

// Analizar proyecto completo
async function analizarProyecto() {
    uploadedFiles.style.display = 'none';
    loadingSpinner.style.display = 'block';
    
    try {
        const formData = new FormData();
        
        // Agregar todos los archivos al FormData
        selectedFiles.forEach((file) => {
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
        uploadedFiles.style.display = 'block';
        alert('Error al analizar el proyecto: ' + error.message);
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
    
    loadingSpinner.style.display = 'block';
    
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
        loadingSpinner.style.display = 'none';
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
    
    loadingSpinner.style.display = 'block';
    
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
        loadingSpinner.style.display = 'none';
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
    
    loadingSpinner.style.display = 'block';
    
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
        loadingSpinner.style.display = 'none';
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