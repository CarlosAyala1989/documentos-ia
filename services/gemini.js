const { GoogleGenAI } = require('@google/genai');

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
            this.ai = new GoogleGenAI({ 
                apiKey: this.apiKeys[this.currentKeyIndex] 
            });
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
                
                const response = await this.ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: prompt,
                });
                
                const analisis = response.text;
                
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
                const response = await this.ai.models.generateContent({
                    model: "gemini-2.0-flash",
                    contents: prompt,
                });
                
                return {
                    success: true,
                    contenido: response.text,
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
}

module.exports = new GeminiService();