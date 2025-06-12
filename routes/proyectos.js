const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const pdfParse = require('pdf-parse');

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
};

// Ruta principal: Analizar código con IA
router.post('/analizar-codigo', requireAuth, async (req, res) => {
  try {
    const { codigo, nombreArchivo, lenguajeProgramacion } = req.body;
    
    // Validar datos de entrada
    if (!codigo || !nombreArchivo) {
      return res.status(400).json({ 
        error: 'El código y el nombre del archivo son requeridos' 
      });
    }
    
    console.log(`🔍 Usuario ${req.session.user.email} analizando: ${nombreArchivo}`);
    console.log(`📝 Longitud del código: ${codigo.length} caracteres`);
    
    // Analizar código con Gemini
    const resultado = await geminiService.analizarCodigo(
      codigo, 
      nombreArchivo, 
      lenguajeProgramacion || 'auto'
    );
    
    if (!resultado.success) {
      console.error('❌ Error en análisis de Gemini:', resultado.error);
      return res.status(500).json({ 
        error: 'Error al analizar el código con IA',
        detalle: resultado.error 
      });
    }
    
    console.log('✅ Análisis completado exitosamente');
    
    // Responder con el análisis
    res.status(200).json({
      success: true,
      analisis: resultado.analisis,
      lenguaje_detectado: resultado.lenguaje_detectado,
      estadisticas: resultado.estadisticas,
      archivo: nombreArchivo,
      api_key_usada: resultado.api_key_usada
    });
    
  } catch (error) {
    console.error('❌ Error general en análisis de código:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al analizar código',
      detalle: error.message 
    });
  }
});

// Configurar multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB límite
    }
});

// Nueva ruta para analizar proyecto completo
router.post('/analizar-proyecto', requireAuth, upload.array('archivos', 50), async (req, res) => {
    try {
        const archivos = req.files;
        
        if (!archivos || archivos.length === 0) {
            return res.status(400).json({ 
                error: 'No se recibieron archivos para analizar' 
            });
        }
        
        console.log(`🔍 Usuario ${req.session.user.email} analizando proyecto con ${archivos.length} archivos`);
        
        let todosLosArchivos = [];
        
        // Procesar cada archivo
        for (const archivo of archivos) {
            if (archivo.mimetype === 'application/zip' || archivo.originalname.endsWith('.zip')) {
                // Extraer archivos del ZIP
                const zip = new AdmZip(archivo.buffer);
                const zipEntries = zip.getEntries();
                
                zipEntries.forEach(entry => {
                    if (!entry.isDirectory && esArchivoValido(entry.entryName)) {
                        todosLosArchivos.push({
                            nombre: entry.entryName,
                            contenido: entry.getData().toString('utf8'),
                            extension: path.extname(entry.entryName)
                        });
                    }
                });
            } else if (esArchivoValido(archivo.originalname)) {
                // Archivo individual
                todosLosArchivos.push({
                    nombre: archivo.originalname,
                    contenido: archivo.buffer.toString('utf8'),
                    extension: path.extname(archivo.originalname)
                });
            }
        }
        
        if (todosLosArchivos.length === 0) {
            return res.status(400).json({ 
                error: 'No se encontraron archivos válidos para analizar' 
            });
        }
        
        // Crear análisis consolidado del proyecto
        const analisisProyecto = crearAnalisisProyecto(todosLosArchivos);
        
        // Generar documentación SRS con Gemini
        const resultadoSRS = await geminiService.generarDocumentacionSRS(analisisProyecto);
        
        if (!resultadoSRS.success) {
            console.error('❌ Error al generar SRS:', resultadoSRS.error);
            return res.status(500).json({ 
                error: 'Error al generar documentación SRS',
                detalle: resultadoSRS.error 
            });
        }
        
        // Calcular estadísticas del proyecto
        const estadisticasTotales = calcularEstadisticasProyecto(todosLosArchivos);
        const lenguajesDetectados = [...new Set(todosLosArchivos.map(archivo => 
            geminiService.detectarLenguaje(archivo.nombre, archivo.contenido)
        ))];
        
        console.log('✅ Documentación SRS generada exitosamente');
        
        // Responder con la documentación SRS
        res.status(200).json({
            success: true,
            documentacion_srs: resultadoSRS.contenido,
            archivos_procesados: todosLosArchivos.length,
            lenguajes_detectados: lenguajesDetectados,
            estadisticas_totales: estadisticasTotales,
            api_key_usada: resultadoSRS.api_key_usada
        });
        
    } catch (error) {
        console.error('❌ Error general en análisis de proyecto:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al analizar proyecto',
            detalle: error.message 
        });
    }
});

// Funciones auxiliares
function esArchivoValido(nombreArchivo) {
    const extensionesValidas = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.html', '.css', '.scss', '.vue', '.kt', '.swift', '.dart', '.sql', '.txt', '.md'];
    const extension = path.extname(nombreArchivo).toLowerCase();
    return extensionesValidas.includes(extension);
}

function crearAnalisisProyecto(archivos) {
    let analisisCompleto = `ANÁLISIS COMPLETO DEL PROYECTO\n`;
    analisisCompleto += `=====================================\n\n`;
    analisisCompleto += `Total de archivos analizados: ${archivos.length}\n\n`;
    
    archivos.forEach((archivo, index) => {
        analisisCompleto += `\n--- ARCHIVO ${index + 1}: ${archivo.nombre} ---\n`;
        analisisCompleto += `Extensión: ${archivo.extension}\n`;
        analisisCompleto += `Contenido:\n\`\`\`\n${archivo.contenido}\n\`\`\`\n\n`;
    });
    
    return analisisCompleto;
}

function calcularEstadisticasProyecto(archivos) {
    let totalLineas = 0;
    let totalCaracteres = 0;
    let totalPalabras = 0;
    
    archivos.forEach(archivo => {
        const lineas = archivo.contenido.split('\n');
        totalLineas += lineas.length;
        totalCaracteres += archivo.contenido.length;
        totalPalabras += archivo.contenido.split(/\s+/).filter(word => word.length > 0).length;
    });
    
    return {
        total_lineas: totalLineas,
        total_caracteres: totalCaracteres,
        total_palabras: totalPalabras,
        total_archivos: archivos.length
    };
}

module.exports = router;

// Nueva ruta: Completar documento personalizado con IA
router.post('/completar-documento-personalizado', requireAuth, upload.fields([
    { name: 'documento_pdf', maxCount: 1 },
    { name: 'archivos_codigo', maxCount: 50 }
]), async (req, res) => {
    try {
        const documentoPDF = req.files['documento_pdf'] ? req.files['documento_pdf'][0] : null;
        const archivosCodigo = req.files['archivos_codigo'] || [];
        const { tipo_documento } = req.body;
        
        if (!documentoPDF) {
            return res.status(400).json({ 
                error: 'Se requiere un documento PDF personalizado' 
            });
        }
        
        if (archivosCodigo.length === 0) {
            return res.status(400).json({ 
                error: 'Se requieren archivos de código para el análisis' 
            });
        }
        
        console.log(`📄 Usuario ${req.session.user.email} completando documento personalizado: ${documentoPDF.originalname}`);
        
        // Extraer texto del PDF
        console.log('📖 Extrayendo texto del PDF...');
        const pdfData = await pdfParse(documentoPDF.buffer);
        const contenidoPDF = pdfData.text;
        
        if (!contenidoPDF || contenidoPDF.trim().length === 0) {
            return res.status(400).json({ 
                error: 'No se pudo extraer texto del PDF. Asegúrate de que no sea una imagen escaneada.' 
            });
        }
        
        // Procesar archivos de código
        console.log('💻 Procesando archivos de código...');
        let todosLosArchivos = [];
        
        for (const archivo of archivosCodigo) {
            if (archivo.mimetype === 'application/zip' || archivo.originalname.endsWith('.zip')) {
                // Extraer archivos del ZIP
                const zip = new AdmZip(archivo.buffer);
                const zipEntries = zip.getEntries();
                
                zipEntries.forEach(entry => {
                    if (!entry.isDirectory && esArchivoValido(entry.entryName)) {
                        todosLosArchivos.push({
                            nombre: entry.entryName,
                            contenido: entry.getData().toString('utf8'),
                            extension: path.extname(entry.entryName)
                        });
                    }
                });
            } else if (esArchivoValido(archivo.originalname)) {
                todosLosArchivos.push({
                    nombre: archivo.originalname,
                    contenido: archivo.buffer.toString('utf8'),
                    extension: path.extname(archivo.originalname)
                });
            }
        }
        
        if (todosLosArchivos.length === 0) {
            return res.status(400).json({ 
                error: 'No se encontraron archivos de código válidos' 
            });
        }
        
        // Crear análisis del proyecto
        const analisisProyecto = crearAnalisisProyecto(todosLosArchivos);
        
        // Completar documento con análisis avanzado usando múltiples APIs
        console.log('🤖 Iniciando análisis avanzado con múltiples APIs de Gemini...');
        const resultado = await geminiService.analisisAvanzadoConMultiplesAPIs(
            contenidoPDF,
            analisisProyecto,
            tipo_documento || 'SRS'
        );
        
        if (!resultado.success) {
            console.error('❌ Error en análisis avanzado:', resultado.error);
            return res.status(500).json({ 
                error: 'Error al completar el documento personalizado',
                detalle: resultado.error 
            });
        }
        
        console.log('✅ Documento personalizado completado exitosamente');
        
        // Responder con el documento completado
        res.status(200).json({
            success: true,
            documento_original: contenidoPDF.substring(0, 1000) + '...', // Muestra solo los primeros 1000 caracteres
            documento_completado: resultado.documento_completado,
            diagramas_uml: resultado.diagramas_uml,
            analisis_estructura: resultado.analisis_estructura,
            archivos_procesados: todosLosArchivos.length,
            tipo_documento: tipo_documento || 'SRS',
            api_keys_usadas: resultado.api_keys_usadas
        });
        
    } catch (error) {
        console.error('❌ Error general al completar documento personalizado:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al completar documento',
            detalle: error.message 
        });
    }
});

// Nueva ruta: Generar solo diagramas UML
router.post('/generar-diagramas-uml', requireAuth, upload.array('archivos', 50), async (req, res) => {
    try {
        const archivos = req.files;
        const { tipo_diagrama } = req.body;
        
        if (!archivos || archivos.length === 0) {
            return res.status(400).json({ 
                error: 'Se requieren archivos de código para generar diagramas' 
            });
        }
        
        console.log(`🎨 Usuario ${req.session.user.email} generando diagramas UML: ${tipo_diagrama}`);
        
        // Procesar archivos (similar al código existente)
        let todosLosArchivos = [];
        
        for (const archivo of archivos) {
            if (archivo.mimetype === 'application/zip' || archivo.originalname.endsWith('.zip')) {
                const zip = new AdmZip(archivo.buffer);
                const zipEntries = zip.getEntries();
                
                zipEntries.forEach(entry => {
                    if (!entry.isDirectory && esArchivoValido(entry.entryName)) {
                        todosLosArchivos.push({
                            nombre: entry.entryName,
                            contenido: entry.getData().toString('utf8'),
                            extension: path.extname(entry.entryName)
                        });
                    }
                });
            } else if (esArchivoValido(archivo.originalname)) {
                todosLosArchivos.push({
                    nombre: archivo.originalname,
                    contenido: archivo.buffer.toString('utf8'),
                    extension: path.extname(archivo.originalname)
                });
            }
        }
        
        if (todosLosArchivos.length === 0) {
            return res.status(400).json({ 
                error: 'No se encontraron archivos válidos para analizar' 
            });
        }
        
        // Crear análisis del proyecto
        const analisisProyecto = crearAnalisisProyecto(todosLosArchivos);
        
        // Generar diagramas UML con validación múltiple
        const resultado = await geminiService.generarPlantUMLValidado(
            analisisProyecto,
            tipo_diagrama || 'clases'
        );
        
        if (!resultado.success) {
            console.error('❌ Error al generar diagramas UML:', resultado.error);
            return res.status(500).json({ 
                error: 'Error al generar diagramas UML',
                detalle: resultado.error 
            });
        }

        // Generar URLs de imágenes
        const imagenes = await geminiService.generarImagenPlantUML(resultado.codigo_plantuml);
        
        console.log('✅ Diagramas UML generados exitosamente');
        
        res.status(200).json({
            success: true,
            codigo_plantuml: resultado.codigo_plantuml,
            imagenes_urls: imagenes.success ? imagenes.urls : null,
            validado: resultado.validado,
            optimizado: resultado.optimizado,
            tipo_diagrama: tipo_diagrama || 'clases',
            archivos_procesados: todosLosArchivos.length,
            api_keys_usadas: resultado.api_keys_usadas
        });
        
    } catch (error) {
        console.error('❌ Error general al generar diagramas UML:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al generar diagramas',
            detalle: error.message 
        });
    }
});

// Nueva ruta: Generar solo diagramas Mermaid
router.post('/generar-diagramas-mermaid', requireAuth, upload.array('archivos', 50), async (req, res) => {
    try {
        const archivos = req.files;
        const { tipo_diagrama } = req.body;
        
        if (!archivos || archivos.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren archivos de código para generar diagramas'
            });
        }
        
        console.log(`🎨 Usuario ${req.session.user.email} generando diagramas Mermaid: ${tipo_diagrama}`);
        
        // Procesar archivos y obtener análisis
        const todosLosArchivos = [];
        
        for (const archivo of archivos) {
            if (archivo.mimetype === 'application/zip' || archivo.mimetype === 'application/x-rar-compressed') {
                const archivosExtraidos = await extraerArchivosComprimidos(archivo.buffer, archivo.originalname);
                todosLosArchivos.push(...archivosExtraidos);
            } else {
                const contenido = archivo.buffer.toString('utf-8');
                todosLosArchivos.push({
                    nombre: archivo.originalname,
                    contenido: contenido,
                    tamaño: archivo.size
                });
            }
        }
        
        // Analizar todos los archivos
        let analisisCompleto = '';
        for (const archivo of todosLosArchivos) {
            const resultado = await geminiService.analizarCodigo(
                archivo.contenido,
                archivo.nombre
            );
            
            if (resultado.success) {
                analisisCompleto += `\n\n=== ANÁLISIS DE ${archivo.nombre} ===\n${resultado.analisis}`;
            }
        }
        
        // Generar diagramas Mermaid con validación múltiple
        const resultado = await geminiService.generarMermaidValidado(
            analisisCompleto,
            tipo_diagrama || 'classDiagram'
        );
        
        if (!resultado.success) {
            console.error('❌ Error al generar diagramas Mermaid:', resultado.error);
            return res.status(500).json({
                success: false,
                error: 'Error al generar diagramas Mermaid',
                details: resultado.error
            });
        }
        
        // Generar URLs de imágenes
        const imagenes = await geminiService.generarImagenMermaid(resultado.codigo_mermaid);
        
        console.log('✅ Diagramas Mermaid generados exitosamente');
        
        res.status(200).json({
            success: true,
            codigo_mermaid: resultado.codigo_mermaid,
            imagenes_urls: imagenes.success ? imagenes.urls : null,
            validado: resultado.validado,
            optimizado: resultado.optimizado,
            tipo_diagrama: tipo_diagrama || 'classDiagram',
            archivos_procesados: todosLosArchivos.length,
            api_keys_usadas: resultado.api_keys_usadas
        });
        
    } catch (error) {
        console.error('❌ Error general al generar diagramas Mermaid:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al generar diagramas',
            details: error.message
        });
    }
});