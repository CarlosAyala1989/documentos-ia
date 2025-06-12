const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini');

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

// Agregar al final del archivo, antes de module.exports

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

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