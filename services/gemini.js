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

    // Función para limpiar el código PlantUML eliminando marcadores
    limpiarCodigoPlantUML(codigoRaw) {
        if (!codigoRaw || typeof codigoRaw !== 'string') {
            return codigoRaw;
        }
        
        let lineas = codigoRaw.split('\n');
        
        // Eliminar primera línea si contiene ```plantuml
        if (lineas.length > 0 && lineas[0].trim().includes('```plantuml')) {
            lineas.shift();
        }
        
        // Eliminar última línea si contiene ```
        if (lineas.length > 0 && lineas[lineas.length - 1].trim() === '```') {
            lineas.pop();
        }
        
        let codigoCompleto = lineas.join('\n').trim();
        
        // Encontrar las posiciones de @startuml y @enduml
        const inicioIndex = codigoCompleto.indexOf('@startuml');
        const finIndex = codigoCompleto.indexOf('@enduml');
        
        // Si no se encuentran las etiquetas, devolver el código original
        if (inicioIndex === -1 || finIndex === -1 || finIndex <= inicioIndex) {
            // Si no hay etiquetas válidas, crear un código PlantUML básico
            return '@startuml\n' + codigoCompleto + '\n@enduml';
        }
        
        // Extraer solo el contenido entre @startuml y @enduml (incluyendo las etiquetas)
        const codigoLimpio = codigoCompleto.substring(inicioIndex, finIndex + '@enduml'.length);
        
        return codigoLimpio.trim();
    }

    async validarPlantUML(codigoPlantUML, tipoDiagrama) {
        const prompt = `
Como experto en PlantUML, valida y corrige el siguiente código PlantUML para un diagrama de ${tipoDiagrama}:

${codigoPlantUML}

**INSTRUCCIONES:**
1. Verifica que la sintaxis PlantUML sea correcta
2. Asegúrate de que tenga @startuml y @enduml
3. Corrige cualquier error de sintaxis
4. Verifica que las relaciones estén bien definidas
5. Asegúrate de que el código sea válido y funcional

**FORMATO DE RESPUESTA:**
Devuelve únicamente el código PlantUML corregido, sin explicaciones adicionales:

\`\`\`plantuml
@startuml
[código PlantUML corregido aquí]
@enduml
\`\`\`
        `;

        return await this.procesarConGemini(prompt);
    }

    async optimizarPlantUML(codigoPlantUML, tipoDiagrama) {
        const prompt = `
Como experto en PlantUML, optimiza el siguiente código para crear un diagrama de ${tipoDiagrama} simple y claro:

${codigoPlantUML}

**INSTRUCCIONES:**
1. Mantén el código PlantUML simple y básico
2. NO agregues colores, estilos ni elementos visuales especiales
3. Enfócate únicamente en la estructura y relaciones del código
4. Optimiza solo la organización y claridad de las relaciones
5. Usa la sintaxis PlantUML estándar sin decoraciones
6. Mantén toda la funcionalidad original

**FORMATO DE RESPUESTA:**
Devuelve únicamente el código PlantUML optimizado y sin que agregues cosas como !include, solamente el codigo:

\`\`\`plantuml
@startuml
[código PlantUML optimizado aquí]
@enduml
\`\`\`
        `;

        return await this.procesarConGemini(prompt);
    }

    async generarPlantUMLValidado(analisisProyecto, tipoDiagrama = 'clases') {
        console.log('🔄 Iniciando generación de PlantUML con validación múltiple...');
        
        try {
            // Primera API: Generación inicial del código PlantUML
            console.log('🎨 Paso 1: Generando código PlantUML inicial...');
            const generacionInicial = await this.generarDiagramasUML(analisisProyecto, tipoDiagrama);
            
            if (!generacionInicial.success) {
                throw new Error('Error en generación inicial: ' + generacionInicial.error);
            }

            // Limpiar código inicial
            const codigoInicialLimpio = this.limpiarCodigoPlantUML(generacionInicial.contenido);

            // Segunda API: Validación y corrección del código PlantUML
            console.log('✅ Paso 2: Validando y corrigiendo código PlantUML...');
            const validacion = await this.validarPlantUML(codigoInicialLimpio, tipoDiagrama);
            
            if (!validacion.success) {
                console.warn('⚠️ Error en validación, usando código original');
            }

            // Limpiar código validado
            const codigoValidadoLimpio = validacion.success ? 
                this.limpiarCodigoPlantUML(validacion.contenido) : codigoInicialLimpio;

            // Tercera API: Optimización del código PlantUML
            console.log('🚀 Paso 3: Optimizando código PlantUML...');
            const optimizacion = await this.optimizarPlantUML(codigoValidadoLimpio, tipoDiagrama);
            
            // Limpiar código final
            const codigoFinalLimpio = optimizacion.success ? 
                this.limpiarCodigoPlantUML(optimizacion.contenido) : codigoValidadoLimpio;

            console.log('✅ Generación de PlantUML completada exitosamente');
            
            return {
                success: true,
                codigo_plantuml: codigoFinalLimpio,
                validado: validacion.success,
                optimizado: optimizacion.success,
                api_keys_usadas: [
                    generacionInicial.api_key_usada,
                    validacion.api_key_usada,
                    optimizacion.api_key_usada
                ].filter(Boolean)
            };
            
        } catch (error) {
            console.error('❌ Error en generación validada:', error);
            return {
                success: false,
                error: error.message,
                codigo_plantuml: null
            };
        }
    }

    async generarImagenPlantUML(codigoPlantUML) {
        try {
            // Limpiar el código antes de generar la imagen
            const codigoLimpio = this.limpiarCodigoPlantUML(codigoPlantUML);
            
            // Codificar el código PlantUML para URL
            const codigoCodificado = this.encodePlantUML(codigoLimpio);
            
            // URLs para diferentes formatos con el prefijo correcto
            const baseUrl = 'https://www.plantuml.com/plantuml';
            
            return {
                success: true,
                urls: {
                    png: `${baseUrl}/png/~1${codigoCodificado}`,
                    svg: `${baseUrl}/svg/~1${codigoCodificado}`,
                    pdf: `${baseUrl}/pdf/~1${codigoCodificado}`
                },
                codigo_original: codigoLimpio
            };
            
        } catch (error) {
            console.error('❌ Error al generar imagen PlantUML:', error);
            return {
                success: false,
                error: error.message,
                urls: null
            };
        }
    }

    // Función auxiliar: Codificar PlantUML para URL
    encodePlantUML(plantumlCode) {
        // Usar encodeURIComponent para una codificación simple y confiable
        return encodeURIComponent(plantumlCode)
            .replace(/%20/g, " ")
            .replace(/%3C/g, "<")
            .replace(/%3E/g, ">")
            .replace(/%23/g, "#")
            .replace(/%40/g, "@");
    }

    async generarDiagramasMermaid(analisisProyecto, tipoDiagrama = 'classDiagram') {
        if (!this.ai) {
            throw new Error('Gemini no está inicializado correctamente');
        }
    
        const prompt = `
    Como experto en Mermaid y arquitectura de software, genera código Mermaid para crear diagramas basados en el siguiente análisis de código:
    
    **ANÁLISIS DEL PROYECTO:**
    ${analisisProyecto}
    
    **TIPO DE DIAGRAMA SOLICITADO:** ${tipoDiagrama}
    
    **INSTRUCCIONES:**
    1. Analiza el código y identifica las clases, métodos, relaciones y dependencias
    2. Genera código Mermaid apropiado para el tipo de diagrama solicitado
    3. Incluye comentarios explicativos en el código Mermaid
    4. Asegúrate de que el diagrama sea claro y profesional
    5. Usa la sintaxis Mermaid estándar y moderna
    
    **TIPOS DE DIAGRAMAS DISPONIBLES:**
    - classDiagram: Diagrama de clases mostrando estructura y relaciones
    - sequenceDiagram: Diagrama de secuencia mostrando flujo de ejecución
    - flowchart: Diagrama de flujo mostrando procesos
    - gitgraph: Diagrama de git para control de versiones
    - erDiagram: Diagrama entidad-relación para bases de datos
    - stateDiagram: Diagrama de estados
    
    **FORMATO DE RESPUESTA:**
    Devuelve únicamente el código Mermaid válido, sin explicaciones adicionales, en el siguiente formato:
    
    \`\`\`mermaid
    ${tipoDiagrama}
    [código Mermaid aquí]
    \`\`\`
        `;
    
        return await this.procesarConGemini(prompt);
    }
    
    // Función para limpiar el código Mermaid eliminando marcadores
    limpiarCodigoMermaid(codigoRaw) {
        if (!codigoRaw || typeof codigoRaw !== 'string') {
            return codigoRaw;
        }
        
        let lineas = codigoRaw.split('\n');
        
        // Eliminar primera línea si contiene ```mermaid
        if (lineas.length > 0 && lineas[0].trim().includes('```mermaid')) {
            lineas.shift();
        }
        
        // Eliminar última línea si contiene ```
        if (lineas.length > 0 && lineas[lineas.length - 1].trim() === '```') {
            lineas.pop();
        }
        
        let codigoCompleto = lineas.join('\n').trim();
        
        // Verificar que tenga un tipo de diagrama válido al inicio
        const tiposDiagrama = ['classDiagram', 'sequenceDiagram', 'flowchart', 'gitgraph', 'erDiagram', 'stateDiagram'];
        const tieneTipo = tiposDiagrama.some(tipo => codigoCompleto.includes(tipo));
        
        if (!tieneTipo) {
            // Si no tiene tipo, agregar classDiagram por defecto
            return 'classDiagram\n' + codigoCompleto;
        }
        
        return codigoCompleto.trim();
    }
    
    // Validar código Mermaid
    async validarMermaid(codigoMermaid, tipoDiagrama) {
        const prompt = `
    Como experto en Mermaid, valida y corrige el siguiente código Mermaid para un diagrama de ${tipoDiagrama}:
    
    ${codigoMermaid}
    
    **INSTRUCCIONES:**
    1. Verifica que la sintaxis Mermaid sea correcta
    2. Asegúrate de que tenga el tipo de diagrama correcto
    3. Corrige cualquier error de sintaxis
    4. Verifica que las relaciones estén bien definidas
    5. Asegúrate de que el código sea válido y funcional
    
    **FORMATO DE RESPUESTA:**
    Devuelve únicamente el código Mermaid corregido, sin explicaciones adicionales:
    
    \`\`\`mermaid
    [código Mermaid corregido aquí]
    \`\`\`
        `;
    
        return await this.procesarConGemini(prompt);
    }
    
    // Optimizar código Mermaid
    async optimizarMermaid(codigoMermaid, tipoDiagrama) {
        const prompt = `
    Como experto en Mermaid, optimiza el siguiente código para crear un diagrama de ${tipoDiagrama} simple y claro:
    
    ${codigoMermaid}
    
    **INSTRUCCIONES:**
    1. Mantén el código Mermaid simple y básico
    2. NO agregues colores, estilos ni elementos visuales especiales
    3. Enfócate únicamente en la estructura y relaciones del código
    4. Optimiza solo la organización y claridad de las relaciones
    5. Usa la sintaxis Mermaid estándar sin decoraciones
    6. Mantén toda la funcionalidad original
    
    **FORMATO DE RESPUESTA:**
    Devuelve únicamente el código Mermaid optimizado:
    
    \`\`\`mermaid
    [código Mermaid optimizado aquí]
    \`\`\`
        `;
    
        return await this.procesarConGemini(prompt);
    }
    
    // Generar Mermaid con validación múltiple
    async generarMermaidValidado(analisisProyecto, tipoDiagrama = 'classDiagram') {
        console.log('🔄 Iniciando generación de Mermaid con validación múltiple...');
        
        try {
            // Primera API: Generación inicial del código Mermaid
            console.log('🎨 Paso 1: Generando código Mermaid inicial...');
            const generacionInicial = await this.generarDiagramasMermaid(analisisProyecto, tipoDiagrama);
            
            if (!generacionInicial.success) {
                throw new Error('Error en generación inicial: ' + generacionInicial.error);
            }
    
            // Limpiar código inicial
            const codigoInicialLimpio = this.limpiarCodigoMermaid(generacionInicial.contenido);
    
            // Segunda API: Validación y corrección del código Mermaid
            console.log('✅ Paso 2: Validando y corrigiendo código Mermaid...');
            const validacion = await this.validarMermaid(codigoInicialLimpio, tipoDiagrama);
            
            if (!validacion.success) {
                console.warn('⚠️ Error en validación, usando código original');
            }
    
            // Limpiar código validado
            const codigoValidadoLimpio = validacion.success ? 
                this.limpiarCodigoMermaid(validacion.contenido) : codigoInicialLimpio;
    
            // Tercera API: Optimización del código Mermaid
            console.log('🚀 Paso 3: Optimizando código Mermaid...');
            const optimizacion = await this.optimizarMermaid(codigoValidadoLimpio, tipoDiagrama);
            
            // Limpiar código final
            const codigoFinalLimpio = optimizacion.success ? 
                this.limpiarCodigoMermaid(optimizacion.contenido) : codigoValidadoLimpio;
    
            console.log('✅ Generación de Mermaid completada exitosamente');
            
            return {
                success: true,
                codigo_mermaid: codigoFinalLimpio,
                validado: validacion.success,
                optimizado: optimizacion.success,
                api_keys_usadas: [
                    generacionInicial.api_key_usada,
                    validacion.api_key_usada,
                    optimizacion.api_key_usada
                ].filter(Boolean)
            };
            
        } catch (error) {
            console.error('❌ Error en generación validada:', error);
            return {
                success: false,
                error: error.message,
                codigo_mermaid: null
            };
        }
    }
    
    // Generar imagen Mermaid usando Mermaid.ink
    // Función principal que intenta múltiples servicios
    async generarImagenMermaid(codigoMermaid) {
        try {
            // Limpiar el código antes de generar la imagen
            const codigoLimpio = this.limpiarCodigoMermaid(codigoMermaid);
            
            // Intentar con Mermaid.ink usando encodeURIComponent
            const codigoCodificado = encodeURIComponent(codigoLimpio);
            
            // URLs para Mermaid.ink
            const baseUrlMermaid = 'https://mermaid.ink';
            
            const urlsMermaid = {
                png: `${baseUrlMermaid}/img/${codigoCodificado}`,
                svg: `${baseUrlMermaid}/svg/${codigoCodificado}`,
                pdf: `${baseUrlMermaid}/pdf/${codigoCodificado}`
            };
            
            // Intentar con Kroki como respaldo
            const baseUrlKroki = 'https://kroki.io';
            const codigoCodificadoKroki = Buffer.from(codigoLimpio).toString('base64');
            
            const urlsKroki = {
                png: `${baseUrlKroki}/mermaid/png/${codigoCodificadoKroki}`,
                svg: `${baseUrlKroki}/mermaid/svg/${codigoCodificadoKroki}`,
                pdf: `${baseUrlKroki}/mermaid/pdf/${codigoCodificadoKroki}`
            };
            
            return {
                success: true,
                urls: {
                    mermaid_ink: urlsMermaid,
                    kroki: urlsKroki,
                    // URLs principales (usando Mermaid.ink por defecto)
                    png: urlsMermaid.png,
                    svg: urlsMermaid.svg,
                    pdf: urlsMermaid.pdf
                },
                codigo_original: codigoLimpio,
                servicios_disponibles: ['mermaid.ink', 'kroki']
            };
            
        } catch (error) {
            console.error('❌ Error al generar imagen Mermaid:', error);
            return {
                success: false,
                error: error.message,
                urls: null
            };
        }
    }
    
    // Función auxiliar para Mermaid.ink (opcional, para compatibilidad futura)
    async generarImagenMermaidInk(codigoMermaid) {
        try {
            const codigoLimpio = this.limpiarCodigoMermaid(codigoMermaid);
            const codigoCodificado = encodeURIComponent(codigoLimpio);
            const baseUrl = 'https://mermaid.ink';
            
            return {
                success: true,
                urls: {
                    png: `${baseUrl}/img/${codigoCodificado}`,
                    svg: `${baseUrl}/svg/${codigoCodificado}`,
                    pdf: `${baseUrl}/pdf/${codigoCodificado}`
                },
                codigo_original: codigoLimpio
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                urls: null
            };
        }
    }
    
    // Función auxiliar para Kroki (opcional, para compatibilidad futura)
    async generarImagenMermaidKroki(codigoMermaid) {
        try {
            const codigoLimpio = this.limpiarCodigoMermaid(codigoMermaid);
            const codigoCodificado = Buffer.from(codigoLimpio).toString('base64');
            const baseUrl = 'https://kroki.io';
            
            return {
                success: true,
                urls: {
                    png: `${baseUrl}/mermaid/png/${codigoCodificado}`,
                    svg: `${baseUrl}/mermaid/svg/${codigoCodificado}`,
                    pdf: `${baseUrl}/mermaid/pdf/${codigoCodificado}`
                },
                codigo_original: codigoLimpio
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                urls: null
            };
        }
    }
}

module.exports = new GeminiService();
