const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini');
const { usuariosService, proyectosService, documentosService } = require('../services/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const pdfParse = require('pdf-parse');

// Configurar multer para manejar archivos (MOVER AQUÍ)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB límite
    }
});

// Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
};

const validarTiposArchivo = (req, res, next) => {
    if (req.files && req.files.length > 0) {
        const extensionesProhibidas = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
        const tiposProhibidos = [
            'application/zip',
            'application/x-rar-compressed',
            'application/vnd.rar',
            'application/x-7z-compressed',
            'application/x-tar',
            'application/gzip'
        ];
        
        for (const file of req.files) {
            const extension = file.originalname.split('.').pop().toLowerCase();
            
            if (extensionesProhibidas.includes(extension) || tiposProhibidos.includes(file.mimetype)) {
                return res.status(400).json({
                    error: 'Archivos comprimidos no permitidos',
                    detalle: `El archivo ${file.originalname} es un archivo comprimido. Por favor, extrae los archivos y súbelos individualmente.`
                });
            }
        }
    }
    next();
};

// Ruta principal: Analizar código con IA (MODIFICADA)
router.post('/analizar-codigo', requireAuth, async (req, res) => {
  try {
    const { codigo, nombreArchivo, lenguajeProgramacion, nombreProyecto, descripcionProyecto, conversacion_id } = req.body;
    const usuarioId = req.session.user.id;
    
    // Validar datos de entrada
    if (!codigo || !nombreArchivo) {
      return res.status(400).json({ 
        error: 'El código y el nombre del archivo son requeridos' 
      });
    }
    
    console.log(`🔍 Usuario ${req.session.user.email} analizando: ${nombreArchivo}`);
    
    // 1. Crear proyecto en la base de datos
    const proyectoData = {
      usuario_id: usuarioId,
      nombre_proyecto: nombreProyecto || nombreArchivo,
      descripcion: descripcionProyecto || `Análisis de código del archivo ${nombreArchivo}`,
      lenguaje_programacion: lenguajeProgramacion || 'auto',
      contenido_codigo: codigo,
      estado_procesamiento: 'procesando'
    };
    
    const proyectoCreado = await proyectosService.crearProyecto(proyectoData);
    console.log(`📊 Proyecto creado en BD con ID: ${proyectoCreado.id}`);
    
    try {
      // 2. Analizar código con Gemini
      const resultado = await geminiService.analizarCodigo(
        codigo, 
        nombreArchivo, 
        lenguajeProgramacion || 'auto'
      );
      
      if (!resultado.success) {
        // Actualizar estado a error
        await proyectosService.actualizarEstadoProcesamiento(proyectoCreado.id, 'error_analisis');
        console.error('❌ Error en análisis de Gemini:', resultado.error);
        return res.status(500).json({ 
          error: 'Error al analizar el código con IA',
          detalle: resultado.error 
        });
      }
      
      // 3. Actualizar proyecto con resultados
      await proyectosService.actualizarProyecto(proyectoCreado.id, {
        lenguaje_programacion: resultado.lenguaje_detectado || lenguajeProgramacion,
        estado_procesamiento: 'completado'
      });
      
      // 4. Crear documento generado
      const documentoData = {
        proyecto_codigo_id: proyectoCreado.id,
        usuario_id: usuarioId,
        tipo_documento: 'Análisis de Código',
        formato_salida: 'markdown',
        contenido_documento: resultado.analisis,
        parametros_generacion_json: JSON.stringify({
          archivo_original: nombreArchivo,
          lenguaje_detectado: resultado.lenguaje_detectado,
          estadisticas: resultado.estadisticas,
          api_key_usada: resultado.api_key_usada
        })
      };
      
      const documentoCreado = await documentosService.crearDocumento(documentoData);
      console.log(`📄 Documento creado en BD con ID: ${documentoCreado.id}`);
      
      // 5. Si hay una conversación activa, crear mensajes
      if (conversacion_id) {
        try {
          // Importar servicios de conversaciones
          const { conversacionesService, mensajesService } = require('../services/db');
          
          // Verificar que la conversación pertenece al usuario
          const conversacion = await conversacionesService.obtenerConversacionPorId(conversacion_id);
          
          if (conversacion && conversacion.usuario_id === usuarioId) {
            // Crear mensaje de consulta (lo que envió el usuario)
            const siguienteOrdenConsulta = await mensajesService.obtenerSiguienteOrden(conversacion_id);
            
            const mensajeConsulta = {
              conversacion_id: conversacion_id,
              usuario_id: usuarioId,
              proyecto_codigo_id: proyectoCreado.id,
              documento_generado_id: documentoCreado.id,
              tipo_mensaje: 'consulta',
              contenido_mensaje: `Análisis solicitado del archivo: ${nombreArchivo}\n\nCódigo analizado:\n\`\`\`${resultado.lenguaje_detectado || lenguajeProgramacion}\n${codigo.substring(0, 500)}${codigo.length > 500 ? '...' : ''}\n\`\`\``,
              orden_en_conversacion: siguienteOrdenConsulta
            };
            
            await mensajesService.crearMensaje(mensajeConsulta);
            
            // Crear mensaje de respuesta (el análisis de la IA)
            const siguienteOrdenRespuesta = await mensajesService.obtenerSiguienteOrden(conversacion_id);
            
            const mensajeRespuesta = {
              conversacion_id: conversacion_id,
              usuario_id: usuarioId,
              proyecto_codigo_id: proyectoCreado.id,
              documento_generado_id: documentoCreado.id,
              tipo_mensaje: 'consulta',
              contenido_mensaje: resultado.analisis,
              orden_en_conversacion: siguienteOrdenRespuesta
            };
            
            await mensajesService.crearMensaje(mensajeRespuesta);
            
            // Actualizar fecha de última actualización de la conversación
            await conversacionesService.actualizarConversacion(conversacion_id, {
              actualizado_en: new Date().toISOString()
            });
            
            console.log(`💬 Mensajes guardados en conversación ${conversacion_id}`);
          }
        } catch (conversacionError) {
          console.error('❌ Error al guardar mensajes en conversación:', conversacionError);
          // No fallar el análisis por errores de conversación
        }
      }
      
      // 6. Actualizar información del usuario (último análisis)
      await usuariosService.actualizarInformacionAdicional(usuarioId, {
        ultimo_inicio_sesion_en: new Date().toISOString()
      });
      
      console.log('✅ Análisis completado y guardado en BD exitosamente');
      
      // Responder con el análisis y IDs de BD
      res.status(200).json({
        success: true,
        proyecto_id: proyectoCreado.id,
        documento_id: documentoCreado.id,
        analisis: resultado.analisis,
        lenguaje_detectado: resultado.lenguaje_detectado,
        estadisticas: resultado.estadisticas,
        archivo: nombreArchivo,
        api_key_usada: resultado.api_key_usada
      });
      
    } catch (analysisError) {
      // Si falla el análisis, actualizar estado del proyecto
      await proyectosService.actualizarEstadoProcesamiento(proyectoCreado.id, 'error_analisis');
      throw analysisError;
    }
    
  } catch (error) {
    console.error('❌ Error general en análisis de código:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al analizar código',
      detalle: error.message 
    });
  }
});

// Nueva ruta para analizar proyecto completo (MODIFICADA)
router.post('/analizar-proyecto', requireAuth, upload.array('archivos', 50), validarTiposArchivo, async (req, res) => {
    try {
        const archivos = req.files;
        const { nombreProyecto, descripcionProyecto, conversacion_id } = req.body;
        const usuarioId = req.session.user.id;

        if (!archivos || archivos.length === 0) {
            return res.status(400).json({ 
                error: 'No se recibieron archivos para analizar' 
            });
        }

        console.log(`🔍 Usuario ${req.session.user.email} analizando proyecto con ${archivos.length} archivos`);

        // 1. Procesar archivos
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

        // 2. Detectar lenguajes principales
        const lenguajesDetectados = [...new Set(todosLosArchivos.map(archivo => 
            geminiService.detectarLenguaje(archivo.nombre, archivo.contenido)
        ))];

        // 3. Crear proyecto en la base de datos
        const analisisProyecto = crearAnalisisProyecto(todosLosArchivos);

        const proyectoData = {
            usuario_id: usuarioId,
            nombre_proyecto: nombreProyecto || `Proyecto ${new Date().toISOString().split('T')[0]}`,
            descripcion: descripcionProyecto || `Análisis de proyecto con ${todosLosArchivos.length} archivos`,
            lenguaje_programacion: lenguajesDetectados[0] || 'mixto',
            contenido_codigo: analisisProyecto,
            estado_procesamiento: 'procesando'
        };

        const proyectoCreado = await proyectosService.crearProyecto(proyectoData);
        console.log(`📊 Proyecto creado en BD con ID: ${proyectoCreado.id}`);

        try {
            // 4. Generar documentación SRS con Gemini
            const resultadoSRS = await geminiService.generarDocumentacionSRS(analisisProyecto);

            if (!resultadoSRS.success) {
                await proyectosService.actualizarEstadoProcesamiento(proyectoCreado.id, 'error_analisis');
                console.error('❌ Error al generar SRS:', resultadoSRS.error);
                return res.status(500).json({ 
                    error: 'Error al generar documentación SRS',
                    detalle: resultadoSRS.error 
                });
            }

            const documentacionSRS = resultadoSRS.contenido;

            // 5. Calcular estadísticas del proyecto
            const estadisticasTotales = calcularEstadisticasProyecto(todosLosArchivos);

            // 6. Actualizar proyecto con resultados
            await proyectosService.actualizarProyecto(proyectoCreado.id, {
                lenguaje_programacion: lenguajesDetectados.join(', '),
                estado_procesamiento: 'completado'
            });

            // 7. Crear documento SRS generado
            const documentoData = {
                proyecto_codigo_id: proyectoCreado.id,
                usuario_id: usuarioId,
                tipo_documento: 'SRS (Software Requirements Specification)',
                formato_salida: 'markdown',
                contenido_documento: documentacionSRS,
                parametros_generacion_json: JSON.stringify({
                    archivos_procesados: todosLosArchivos.length,
                    lenguajes_detectados: lenguajesDetectados,
                    estadisticas_totales: estadisticasTotales,
                    api_key_usada: resultadoSRS.api_key_usada
                })
            };

            const documentoCreado = await documentosService.crearDocumento(documentoData);
            console.log(`📄 Documento SRS creado en BD con ID: ${documentoCreado.id}`);

            // 8. Guardar mensajes en conversación (si aplica)
            if (conversacion_id) {
                try {
                    const { conversacionesService, mensajesService } = require('../services/db');

                    const conversacion = await conversacionesService.obtenerConversacionPorId(conversacion_id);

                    if (conversacion && conversacion.usuario_id === usuarioId) {
                        // Mensaje de consulta
                        const siguienteOrdenConsulta = await mensajesService.obtenerSiguienteOrden(conversacion_id);
                        const mensajeConsulta = {
                            conversacion_id,
                            usuario_id: usuarioId,
                            proyecto_codigo_id: proyectoCreado.id,
                            documento_generado_id: documentoCreado.id,
                            tipo_mensaje: 'consulta',
                            contenido_mensaje: `Análisis de proyecto solicitado: ${nombreProyecto || 'Proyecto sin nombre'}\n\nArchivos analizados: ${todosLosArchivos.length}\nLenguajes detectados: ${lenguajesDetectados.join(', ')}`,
                            orden_en_conversacion: siguienteOrdenConsulta
                        };
                        await mensajesService.crearMensaje(mensajeConsulta);

                        // Mensaje de respuesta IA
                        const siguienteOrdenRespuesta = await mensajesService.obtenerSiguienteOrden(conversacion_id);
                        const mensajeRespuesta = {
                            conversacion_id,
                            usuario_id: usuarioId,
                            proyecto_codigo_id: proyectoCreado.id,
                            documento_generado_id: documentoCreado.id,
                            tipo_mensaje: 'consulta',
                            contenido_mensaje: documentacionSRS,
                            orden_en_conversacion: siguienteOrdenRespuesta
                        };
                        await mensajesService.crearMensaje(mensajeRespuesta);

                        // Actualizar conversación
                        await conversacionesService.actualizarConversacion(conversacion_id, {
                            actualizado_en: new Date().toISOString()
                        });

                        console.log(`💬 Mensajes de proyecto guardados en conversación ${conversacion_id}`);
                    }
                } catch (conversacionError) {
                    console.error('❌ Error al guardar mensajes de proyecto en conversación:', conversacionError);
                }
            }

            // 9. Actualizar información adicional del usuario
            await usuariosService.actualizarInformacionAdicional(usuarioId, {
                ultimo_inicio_sesion_en: new Date().toISOString()
            });

            console.log('✅ Documentación SRS generada y guardada en BD exitosamente');

            // 10. Respuesta final
            res.status(200).json({
                success: true,
                proyecto_id: proyectoCreado.id,
                documento_id: documentoCreado.id,
                documentacion_srs: documentacionSRS,
                archivos_procesados: todosLosArchivos.length,
                lenguajes_detectados: lenguajesDetectados,
                estadisticas_totales: estadisticasTotales,
                api_key_usada: resultadoSRS.api_key_usada
            });

        } catch (analysisError) {
            await proyectosService.actualizarEstadoProcesamiento(proyectoCreado.id, 'error_analisis');
            throw analysisError;
        }

    } catch (error) {
        console.error('❌ Error general en análisis de proyecto:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al analizar proyecto',
            detalle: error.message 
        });
    }
});

module.exports = router;

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

// Nueva ruta: Completar documento personalizado con IA (MODIFICADA)
router.post('/completar-documento-personalizado', requireAuth, upload.fields([
    { name: 'documento_pdf', maxCount: 1 },
    { name: 'archivos_codigo', maxCount: 50 }
]), async (req, res) => {
    try {
        const documentoPDF = req.files['documento_pdf'] ? req.files['documento_pdf'][0] : null;
        const archivosCodigo = req.files['archivos_codigo'] || [];
        const { tipo_documento, nombreProyecto, descripcionProyecto, conversacion_id } = req.body;
        const usuarioId = req.session.user.id;
        
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
        
        // Detectar lenguajes principales
        const lenguajesDetectados = [...new Set(todosLosArchivos.map(archivo => 
            geminiService.detectarLenguaje(archivo.nombre, archivo.contenido)
        ))];
        
        // Crear análisis del proyecto
        const analisisProyecto = crearAnalisisProyecto(todosLosArchivos);
        
        // 1. Crear proyecto en la base de datos
        const proyectoData = {
            usuario_id: usuarioId,
            nombre_proyecto: nombreProyecto || `Documento Personalizado - ${documentoPDF.originalname}`,
            descripcion: descripcionProyecto || `Completar documento personalizado ${tipo_documento || 'SRS'} con ${todosLosArchivos.length} archivos de código`,
            lenguaje_programacion: lenguajesDetectados[0] || 'mixto',
            contenido_codigo: analisisProyecto,
            estado_procesamiento: 'procesando'
        };
        
        const proyectoCreado = await proyectosService.crearProyecto(proyectoData);
        console.log(`📊 Proyecto creado en BD con ID: ${proyectoCreado.id}`);
        
        try {
            // 2. Completar documento con análisis avanzado usando múltiples APIs
            console.log('🤖 Iniciando análisis avanzado con múltiples APIs de Gemini...');
            const resultado = await geminiService.analisisAvanzadoConMultiplesAPIs(
                contenidoPDF,
                analisisProyecto,
                tipo_documento || 'SRS'
            );
            
            if (!resultado.success) {
                // Actualizar estado a error
                await proyectosService.actualizarEstadoProcesamiento(proyectoCreado.id, 'error_analisis');
                console.error('❌ Error en análisis avanzado:', resultado.error);
                return res.status(500).json({ 
                    error: 'Error al completar el documento personalizado',
                    detalle: resultado.error 
                });
            }
            
            // 3. Actualizar proyecto con resultados
            await proyectosService.actualizarProyecto(proyectoCreado.id, {
                lenguaje_programacion: lenguajesDetectados[0] || 'mixto',
                estado_procesamiento: 'completado',
                ultimo_analisis_en: new Date().toISOString()
            });
            
            // 4. Crear documento generado principal (documento completado)
            const documentoCompletadoData = {
                proyecto_codigo_id: proyectoCreado.id,
                usuario_id: usuarioId,
                tipo_documento: `Documento Personalizado - ${tipo_documento || 'SRS'}`,
                formato_salida: 'markdown',
                contenido_documento: resultado.documento_completado,
                parametros_generacion_json: JSON.stringify({
                    documento_original: documentoPDF.originalname,
                    tipo_documento: tipo_documento || 'SRS',
                    archivos_procesados: todosLosArchivos.length,
                    lenguajes_detectados: lenguajesDetectados,
                    api_keys_usadas: resultado.api_keys_usadas,
                    tiene_diagramas_uml: !!resultado.diagramas_uml,
                    analisis_estructura: !!resultado.analisis_estructura
                })
            };
            
            const documentoCompletado = await documentosService.crearDocumento(documentoCompletadoData);
            console.log(`📄 Documento completado creado en BD con ID: ${documentoCompletado.id}`);
            
            // 5. Crear documento adicional para diagramas UML (si existen)
            let documentoDiagramas = null;
            if (resultado.diagramas_uml) {
                const documentoDiagramasData = {
                    proyecto_codigo_id: proyectoCreado.id,
                    usuario_id: usuarioId,
                    tipo_documento: 'Diagramas UML',
                    formato_salida: 'texto_plano',
                    contenido_documento: resultado.diagramas_uml,
                    parametros_generacion_json: JSON.stringify({
                        generado_con_documento_personalizado: true,
                        documento_principal_id: documentoCompletado.id,
                        tipo_diagrama: 'clases'
                    })
                };
                
                documentoDiagramas = await documentosService.crearDocumento(documentoDiagramasData);
                console.log(`🎨 Documento de diagramas UML creado en BD con ID: ${documentoDiagramas.id}`);
            }
            
            // 6. Crear documento adicional para análisis de estructura (si existe)
            let documentoAnalisisEstructura = null;
            if (resultado.analisis_estructura) {
                const documentoAnalisisData = {
                    proyecto_codigo_id: proyectoCreado.id,
                    usuario_id: usuarioId,
                    tipo_documento: 'Análisis de Estructura',
                    formato_salida: 'markdown',
                    contenido_documento: resultado.analisis_estructura,
                    parametros_generacion_json: JSON.stringify({
                        generado_con_documento_personalizado: true,
                        documento_principal_id: documentoCompletado.id,
                        documento_original: documentoPDF.originalname
                    })
                };
                
                documentoAnalisisEstructura = await documentosService.crearDocumento(documentoAnalisisData);
                console.log(`📋 Documento de análisis de estructura creado en BD con ID: ${documentoAnalisisEstructura.id}`);
            }
            
            // 7. Actualizar información del usuario (último análisis)
            await usuariosService.actualizarInformacionAdicional(usuarioId, {
                ultimo_inicio_sesion_en: new Date().toISOString()
            });
            
            if (conversacion_id) {
                try {
                    const { conversacionesService, mensajesService } = require('../services/db');
    
                    const conversacion = await conversacionesService.obtenerConversacionPorId(conversacion_id);
    
                    if (conversacion && conversacion.usuario_id === usuarioId) {
                        // Mensaje de consulta
                        const siguienteOrdenConsulta = await mensajesService.obtenerSiguienteOrden(conversacion_id);
                        const mensajeConsulta = {
                            conversacion_id,
                            usuario_id: usuarioId,
                            proyecto_codigo_id: proyectoCreado.id,
                            documento_generado_id: documentoCompletado.id,
                            tipo_mensaje: 'consulta',
                            contenido_mensaje: `Documento personalizado completado: ${documentoPDF.originalname}\n\nTipo: ${tipo_documento || 'SRS'}\nArchivos procesados: ${todosLosArchivos.length}\nLenguajes detectados: ${lenguajesDetectados.join(', ')}`,
                            orden_en_conversacion: siguienteOrdenConsulta
                        };
                        await mensajesService.crearMensaje(mensajeConsulta);
    
                        // Mensaje de respuesta IA
                        const siguienteOrdenRespuesta = await mensajesService.obtenerSiguienteOrden(conversacion_id);
                        const mensajeRespuesta = {
                            conversacion_id,
                            usuario_id: usuarioId,
                            proyecto_codigo_id: proyectoCreado.id,
                            documento_generado_id: documentoCompletado.id,
                            tipo_mensaje: 'respuesta',
                            contenido_mensaje: resultado.documento_completado,
                            orden_en_conversacion: siguienteOrdenRespuesta
                        };
                        await mensajesService.crearMensaje(mensajeRespuesta);
    
                        // Actualizar conversación
                        await conversacionesService.actualizarConversacion(conversacion_id, {
                            actualizado_en: new Date().toISOString()
                        });
    
                        console.log(`💬 Mensajes de documento personalizado guardados en conversación ${conversacion_id}`);
                    }
                } catch (conversacionError) {
                    console.error('❌ Error al guardar mensajes de documento personalizado en conversación:', conversacionError);
                }
            }

            console.log('✅ Documento personalizado completado y guardado en BD exitosamente');
            
            // Responder con el documento completado y IDs de BD
            res.status(200).json({
                success: true,
                proyecto_id: proyectoCreado.id,
                documento_completado_id: documentoCompletado.id,
                documento_diagramas_id: documentoDiagramas?.id || null,
                documento_analisis_estructura_id: documentoAnalisisEstructura?.id || null,
                documento_original: contenidoPDF.substring(0, 1000) + '...', // Muestra solo los primeros 1000 caracteres
                documento_completado: resultado.documento_completado,
                diagramas_uml: resultado.diagramas_uml,
                analisis_estructura: resultado.analisis_estructura,
                archivos_procesados: todosLosArchivos.length,
                tipo_documento: tipo_documento || 'SRS',
                api_keys_usadas: resultado.api_keys_usadas
            });
            
        } catch (analysisError) {
            // Si falla el análisis, actualizar estado del proyecto
            await proyectosService.actualizarEstadoProcesamiento(proyectoCreado.id, 'error_analisis');
            throw analysisError;
        }
        
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

// Nueva ruta: Obtener historial de proyectos y documentos del usuario
router.get('/historial', requireAuth, async (req, res) => {
    try {
        const usuarioId = req.session.user.id;
        
        // Obtener proyectos del usuario
        const proyectos = await proyectosService.obtenerProyectosPorUsuario(usuarioId);
        
        // Obtener TODOS los documentos del usuario directamente (NUEVA CONSULTA)
        const todosLosDocumentos = await documentosService.obtenerDocumentosPorUsuario(usuarioId);
        
        // Obtener información actualizada del usuario
        const usuario = await usuariosService.obtenerUsuarioPorId(usuarioId);
        
        console.log(`📊 Historial obtenido para usuario ${req.session.user.email}: ${proyectos.length} proyectos, ${todosLosDocumentos.length} documentos`);
        
        res.status(200).json({
            success: true,
            usuario: {
                id: usuario.id,
                correo_electronico: usuario.correo_electronico,
                nombre_completo: usuario.nombre_completo,
                ultimo_inicio_sesion_en: usuario.ultimo_inicio_sesion_en,
                creado_en: usuario.creado_en
            },
            proyectos: proyectos,
            documentos: todosLosDocumentos, // Usar la nueva consulta
            estadisticas: {
                total_proyectos: proyectos.length,
                total_documentos: todosLosDocumentos.length,
                proyectos_completados: proyectos.filter(p => p.estado_procesamiento === 'completado').length,
                proyectos_en_proceso: proyectos.filter(p => p.estado_procesamiento === 'procesando').length,
                proyectos_con_error: proyectos.filter(p => p.estado_procesamiento && p.estado_procesamiento.includes('error')).length
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener historial:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al obtener historial',
            detalle: error.message 
        });
    }
});

// Nueva ruta: Obtener proyecto específico con sus documentos
router.get('/proyecto/:id', requireAuth, async (req, res) => {
    try {
        const proyectoId = req.params.id;
        const usuarioId = req.session.user.id;
        
        // Obtener proyecto
        const proyecto = await proyectosService.obtenerProyectoPorId(proyectoId);
        
        if (!proyecto) {
            return res.status(404).json({ 
                error: 'Proyecto no encontrado' 
            });
        }
        
        // Verificar que el proyecto pertenece al usuario
        if (proyecto.usuario_id !== usuarioId) {
            return res.status(403).json({ 
                error: 'No tienes permisos para acceder a este proyecto' 
            });
        }
        
        // Obtener documentos del proyecto
        const documentos = await documentosService.obtenerDocumentosPorProyecto(proyectoId);
        
        res.status(200).json({
            success: true,
            proyecto: proyecto,
            documentos: documentos
        });
        
    } catch (error) {
        console.error('❌ Error al obtener proyecto:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al obtener proyecto',
            detalle: error.message 
        });
    }
});

module.exports = router;