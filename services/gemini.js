const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        // Array de API keys disponibles
        this.apiKeys = [
            process.env.API_KEY_1,
            process.env.API_KEY_2,
            process.env.API_KEY_3,
            process.env.API_KEY_4
        ].filter(key => key); // Filtrar keys que no estén definidas
        
        this.currentKeyIndex = 0;
        this.ai = null;
        
        if (this.apiKeys.length > 0) {
            this.initializeAPI();
        } else {
            console.error('❌ No hay API keys de Google AI configuradas');
        }
    }
    
    initializeAPI() {
        if (this.apiKeys.length === 0) {
            throw new Error('No hay API keys de Google AI configuradas');
        }
        
        try {
            this.ai = new GoogleGenerativeAI(this.apiKeys[this.currentKeyIndex]);
            console.log(`✅ Gemini inicializado con API key ${this.currentKeyIndex + 1}`);
        } catch (error) {
            console.error('❌ Error al inicializar Gemini:', error);
            throw error;
        }
    }
    
    // Cambiar a la siguiente API key si hay problemas
    switchToNextKey() {
        if (this.currentKeyIndex < this.apiKeys.length - 1) {
            this.currentKeyIndex++;
            this.initializeAPI();
            return true;
        }
        return false;
    }
    
    // Analizar código fuente
    async analizarCodigo(contenidoCodigo, nombreArchivo, lenguajeProgramacion = 'auto') {
        if (!this.ai) {
            throw new Error('Gemini no está inicializado correctamente');
        }
        
        const prompt = this.construirPromptAnalisis(contenidoCodigo, nombreArchivo, lenguajeProgramacion);
        
        let intentos = 0;
        const maxIntentos = this.apiKeys.length;
        
        while (intentos < maxIntentos) {
            try {
                console.log(`🔍 Analizando código con Gemini (intento ${intentos + 1}/${maxIntentos})`);
                
                // Cambiar de 'gemini-pro' a 'gemini-1.5-flash'
                const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
                const response = await model.generateContent(prompt);
                
                const analisis = response.response.text();
                
                console.log('✅ Análisis completado exitosamente');
                return {
                    success: true,
                    analisis: analisis,
                    lenguaje_detectado: this.detectarLenguaje(nombreArchivo, contenidoCodigo),
                    estadisticas: this.calcularEstadisticas(contenidoCodigo),
                    api_key_usada: this.currentKeyIndex + 1
                };
                
            } catch (error) {
                console.error(`❌ Error con API key ${this.currentKeyIndex + 1}:`, error.message);
                
                if (error.message.includes('quota') || 
                    error.message.includes('limit') || 
                    error.message.includes('403') ||
                    error.message.includes('429') ||
                    error.status === 429) {
                    console.log('🔄 Cambiando a siguiente API key...');
                    if (!this.switchToNextKey()) {
                        console.error('❌ Se agotaron todas las API keys disponibles');
                        break;
                    }
                } else {
                    throw error;
                }
                
                intentos++;
            }
        }
        
        return {
            success: false,
            error: 'Se agotaron todas las API keys o hay un error en el servicio',
            analisis: null
        };
    }
    
    construirPromptAnalisis(codigo, nombreArchivo, lenguaje) {
        return `
Eres un experto desarrollador de software. Analiza el siguiente código fuente y proporciona un análisis detallado.

**Archivo:** ${nombreArchivo}
**Lenguaje detectado:** ${lenguaje}

**Código a analizar:**
\`\`\`${lenguaje}
${codigo}
\`\`\`

Por favor, proporciona un análisis completo que incluya:

1. **Resumen General:**
   - ¿Qué hace este código?
   - Propósito principal y funcionalidad

2. **Estructura y Componentes:**
   - Clases, funciones, módulos principales
   - Patrones de diseño utilizados
   - Arquitectura del código

3. **Análisis Funcional:**
   - Funciones/métodos principales y su propósito
   - Flujo de ejecución
   - Entradas y salidas

4. **Dependencias y Tecnologías:**
   - Librerías/frameworks utilizados
   - Dependencias externas
   - APIs o servicios consumidos

5. **Calidad del Código:**
   - Buenas prácticas aplicadas
   - Posibles mejoras
   - Nivel de complejidad

6. **Casos de Uso:**
   - Escenarios donde se usaría este código
   - Tipo de aplicación o sistema

Proporciona el análisis en español, de manera clara y estructurada.
`;
    }
    
    detectarLenguaje(nombreArchivo, contenido) {
        const extension = nombreArchivo.split('.').pop().toLowerCase();
        
        const lenguajes = {
            'js': 'JavaScript',
            'jsx': 'React (JavaScript)',
            'ts': 'TypeScript',
            'tsx': 'React (TypeScript)',
            'py': 'Python',
            'java': 'Java',
            'cpp': 'C++',
            'c': 'C',
            'cs': 'C#',
            'php': 'PHP',
            'rb': 'Ruby',
            'go': 'Go',
            'rs': 'Rust',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'vue': 'Vue.js',
            'kt': 'Kotlin',
            'swift': 'Swift',
            'dart': 'Dart',
            'sql': 'SQL'
        };
        
        return lenguajes[extension] || 'Desconocido';
    }
    
    calcularEstadisticas(codigo) {
        const lineas = codigo.split('\n');
        const lineasNoVacias = lineas.filter(linea => linea.trim().length > 0);
        const comentarios = lineas.filter(linea => {
            const lineaTrimmed = linea.trim();
            return lineaTrimmed.startsWith('//') || 
                   lineaTrimmed.startsWith('#') || 
                   lineaTrimmed.startsWith('/*') ||
                   lineaTrimmed.startsWith('*') ||
                   lineaTrimmed.startsWith('<!--');
        });
        
        return {
            total_lineas: lineas.length,
            lineas_codigo: lineasNoVacias.length,
            lineas_comentarios: comentarios.length,
            caracteres: codigo.length,
            palabras: codigo.split(/\s+/).filter(word => word.length > 0).length
        };
    }
    
    // Generar documentación SRS
    async generarDocumentacionSRS(analisisProyecto) {
        if (!this.ai) {
            throw new Error('Gemini no está inicializado correctamente');
        }
        
        const prompt = `
Como experto en ingeniería de software, genera un documento SRS (Software Requirements Specification) completo basado en el siguiente análisis de código:

${analisisProyecto}

El documento SRS debe incluir:

1. **Introducción**
   - Propósito del documento
   - Alcance del producto
   - Definiciones y acrónimos

2. **Descripción General**
   - Perspectiva del producto
   - Funciones del producto
   - Características de los usuarios
   - Restricciones

3. **Requisitos Específicos**
   - Requisitos funcionales (RF-001, RF-002, etc.)
   - Requisitos no funcionales (RNF-001, RNF-002, etc.)
   - Requisitos de interfaz

4. **Apéndices**
   - Glosario
   - Referencias

Genera el documento en formato markdown, bien estructurado y profesional.
        `;
        
        return await this.procesarConGemini(prompt);
    }
    
    // Método auxiliar para procesar prompts con Gemini
    async procesarConGemini(prompt) {
        if (!this.ai) {
            throw new Error('Gemini no está inicializado correctamente');
        }
        
        let intentos = 0;
        const maxIntentos = this.apiKeys.length;
        
        while (intentos < maxIntentos) {
            try {
                // Cambiar de 'gemini-pro' a 'gemini-1.5-flash'
                const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
                const response = await model.generateContent(prompt);
                
                return {
                    success: true,
                    contenido: response.response.text(),
                    api_key_usada: this.currentKeyIndex + 1
                };
                
            } catch (error) {
                console.error(`❌ Error con API key ${this.currentKeyIndex + 1}:`, error.message);
                
                if (error.message.includes('quota') || 
                    error.message.includes('limit') ||
                    error.message.includes('429') ||
                    error.status === 429) {
                    if (!this.switchToNextKey()) {
                        break;
                    }
                } else {
                    throw error;
                }
                
                intentos++;
            }
        }
        
        return {
            success: false,
            error: 'Error al procesar con Gemini',
            contenido: null
        };
    }

    // Nueva función: Analizar PDF personalizado y completarlo con código
    async completarDocumentoPersonalizado(contenidoPDF, analisisProyecto, tipoDocumento = 'SRS') {
        if (!this.ai) {
            throw new Error('Gemini no está inicializado correctamente');
        }

        const prompt = `
Como experto en ingeniería de software, tienes un documento ${tipoDocumento} personalizado que necesita ser completado basándose en el análisis de código de un proyecto.

**DOCUMENTO PERSONALIZADO EXISTENTE:**
${contenidoPDF}

**ANÁLISIS DEL PROYECTO:**
${analisisProyecto}

**INSTRUCCIONES:**
1. Analiza el documento personalizado existente para entender su estructura y formato
2. Identifica las secciones que están incompletas o que necesitan información adicional
3. Completa el documento usando la información del análisis del proyecto
4. Mantén el formato y estilo del documento original
5. Agrega información relevante basada en el código analizado
6. Si el documento requiere diagramas UML, proporciona el código PlantUML correspondiente

**FORMATO DE RESPUESTA:**
Devuelve el documento completado en el mismo formato que el original, pero con toda la información faltante agregada basándose en el análisis del código.

Si necesitas generar diagramas UML, incluye el código PlantUML en secciones claramente marcadas como:
\`\`\`plantuml
[código PlantUML aquí]
\`\`\`
        `;

        return await this.procesarConGemini(prompt);
    }

    // Nueva función: Generar diagramas PlantUML específicos
    async generarDiagramasUML(analisisProyecto, tipoDiagrama = 'clases') {
        if (!this.ai) {
            throw new Error('Gemini no está inicializado correctamente');
        }

        const prompt = `
Como experto en UML y arquitectura de software, genera código PlantUML para crear diagramas basados en el siguiente análisis de código:

**ANÁLISIS DEL PROYECTO:**
${analisisProyecto}

**TIPO DE DIAGRAMA SOLICITADO:** ${tipoDiagrama}

**INSTRUCCIONES:**
1. Analiza el código y identifica las clases, métodos, relaciones y dependencias
2. Genera código PlantUML apropiado para el tipo de diagrama solicitado
3. Incluye comentarios explicativos en el código PlantUML
4. Asegúrate de que el diagrama sea claro y profesional

**TIPOS DE DIAGRAMAS DISPONIBLES:**
- clases: Diagrama de clases mostrando estructura y relaciones
- secuencia: Diagrama de secuencia mostrando flujo de ejecución
- componentes: Diagrama de componentes mostrando arquitectura
- casos_uso: Diagrama de casos de uso
- actividad: Diagrama de actividad mostrando flujo de procesos

**FORMATO DE RESPUESTA:**
Devuelve únicamente el código PlantUML válido, sin explicaciones adicionales, en el siguiente formato:

\`\`\`plantuml
@startuml
[código PlantUML aquí]
@enduml
\`\`\`
        `;

        return await this.procesarConGemini(prompt);
    }

    // Nueva función: Análisis avanzado con múltiples APIs
    async analisisAvanzadoConMultiplesAPIs(contenidoPDF, analisisProyecto, tipoDocumento) {
        console.log('🔄 Iniciando análisis avanzado con múltiples APIs de Gemini...');
        
        try {
            // Primera API: Análisis del documento personalizado
            console.log('📋 Paso 1: Analizando estructura del documento personalizado...');
            const analisisDocumento = await this.analizarEstructuraDocumento(contenidoPDF, tipoDocumento);
            
            if (!analisisDocumento.success) {
                throw new Error('Error en análisis de documento: ' + analisisDocumento.error);
            }

            // Segunda API: Completar documento con información del proyecto
            console.log('✍️ Paso 2: Completando documento con información del proyecto...');
            const documentoCompletado = await this.completarDocumentoPersonalizado(
                contenidoPDF, 
                analisisProyecto, 
                tipoDocumento
            );
            
            if (!documentoCompletado.success) {
                throw new Error('Error al completar documento: ' + documentoCompletado.error);
            }

            // Tercera API: Generar diagramas UML si es necesario
            console.log('🎨 Paso 3: Generando diagramas UML...');
            const diagramasUML = await this.generarDiagramasUML(analisisProyecto, 'clases');
            
            if (!diagramasUML.success) {
                console.warn('⚠️ No se pudieron generar diagramas UML');
            }

            console.log('✅ Análisis avanzado completado exitosamente');
            
            return {
                success: true,
                documento_completado: documentoCompletado.contenido,
                diagramas_uml: diagramasUML.success ? diagramasUML.contenido : null,
                analisis_estructura: analisisDocumento.contenido,
                api_keys_usadas: [
                    analisisDocumento.api_key_usada,
                    documentoCompletado.api_key_usada,
                    diagramasUML.api_key_usada
                ].filter(Boolean)
            };
            
        } catch (error) {
            console.error('❌ Error en análisis avanzado:', error);
            return {
                success: false,
                error: error.message,
                documento_completado: null
            };
        }
    }

    // Función auxiliar: Analizar estructura del documento
    async analizarEstructuraDocumento(contenidoPDF, tipoDocumento) {
        const prompt = `
Analiza la estructura y formato del siguiente documento ${tipoDocumento}:

${contenidoPDF}

**INSTRUCCIONES:**
1. Identifica las secciones principales del documento
2. Detecta qué información falta o está incompleta
3. Determina el estilo y formato utilizado
4. Sugiere qué tipo de información del código sería relevante para cada sección

**FORMATO DE RESPUESTA:**
Devuelve un análisis estructurado que incluya:
- Secciones identificadas
- Información faltante
- Estilo del documento
- Recomendaciones para completar
        `;

        return await this.procesarConGemini(prompt);
    }
}

module.exports = new GeminiService();