# UNIVERSIDAD PRIVADA DE TACNA

# FACULTAD DE INGENIERÍA

Escuela Profesional de Ingeniería de Sistemas

Proyecto

“Generador de documentación impulsado por IA (GDI-IA)”

Curso:

Calidad y Pruebas de Software

Docente:

Mag. Patrick Cuadros Quiroga

Integrantes:

Akhtar Oviedo, Ahmed Hasan			(2022074261)

Ayala Ramos, Carlos Daniel 			(2022074266)

Salas Jiménez, Walter Emmanuel  		(2022073896)

Tacna – Perú

2025

Sistema Generador de documentación

impulsado por IA (GDI-IA)

Informe de Factibilidad

Versión 1.0

Índice General

Informe de Factibilidad

Descripción del Proyecto

Nombre del proyecto

Generador de Documentación Impulsado por IA (GDI-IA)

Duración del proyecto

# meses

Descripción

El proyecto será implementado en DevStar Solutions, una empresa tecnológica dedicada al desarrollo de software personalizado. Se ha detectado que los equipos invierten una cantidad significativa de tiempo en la creación de documentación técnica, lo que impacta directamente en la productividad general de los proyectos.

El sistema GDI-IA tiene como objetivo automatizar la generación de documentación de software mediante el uso de inteligencia artificial, ofreciendo una plataforma accesible para todos los roles dentro del área informática. Los usuarios podrán describir su proyecto mediante formularios y seleccionar plantillas específicas según el tipo de documento requerido. La IA procesará esta información para generar documentación estructurada y profesional, incluyendo imágenes UML, sin necesidad de conocimientos avanzados.

Este proyecto busca no sólo optimizar los tiempos de documentación, sino también estandarizar los entregables técnicos, facilitar el entendimiento entre equipos y mejorar la calidad general de los proyectos desarrollados.

Objetivos

Objetivo general

Desarrollar una plataforma web inteligente que permita a los usuarios generar documentación técnica de software de manera automatizada, mediante el uso de inteligencia artificial y plantillas personalizadas.

Objetivos Específicos

Diseñar formularios interactivos que permitan a los usuarios describir sus proyectos fácilmente.

Incorporar plantillas prediseñadas para distintos tipos de documentación (arquitectura, diseño, despliegue, API, etc.).

Integrar modelos de IA que comprendan el contexto del proyecto y generen contenido coherente y útil.

Conectar el sistema con APIs para la generación de diagramas UML.

Almacenar la documentación generada en formato PDF y permitir su descarga desde un servidor FTP.

Riesgos

Posible imprecisión inicial en los resultados de la IA al interpretar descripciones poco claras.

Sobrecarga en el servidor de almacenamiento FTP si la demanda crece considerablemente.

Dificultad de adaptación por parte de usuarios que prefieren documentación manual.

Dependencia de terceros (APIs) para la generación de diagramas.

Falta de internet en el usuario durante la generación del documento podría afectar la funcionalidad.

Análisis de la Situación actual

Planteamiento del problema

En la actualidad, los equipos de desarrollo de DevStar Solutions enfrentan dificultades en la elaboración eficiente de documentación técnica. Muchos desarrolladores y técnicos no están habituados a estructurar la información de manera formal, lo que genera inconsistencias, pérdida de tiempo y retrabajo. Esta situación ha evidenciado la necesidad de una solución que asista en este proceso, haciéndolo más accesible, rápido y uniforme, sin requerir conocimientos técnicos avanzados en documentación.

Consideraciones de hardware y software

Hardware:

Servidor con mínimo 8 GB de RAM, 100 GB de almacenamiento SSD.

Acceso estable a Internet.

Equipos cliente con navegador actualizado y conexión de red funcional.

Alojado en una máquina virtual en Linux

Software:

Lenguaje backend: PHP

Frontend: HTML, CSS, JavaScript

Generación de PDFs: Librerías como TCPDF o DomPDF

Generación de diagramas: Integración con APIs como PlantUML o Mermaid

Almacenamiento: Servidor FTP + Base de datos MySQL

Estudio de Factibilidad

El estudio de factibilidad tiene como finalidad determinar la viabilidad de implementar el Sistema Generador de documentación impulsado por IA (GDI-IA). Para ello, se han evaluado aspectos técnicos, económicos, operativos, legales, sociales y ambientales, a fin de garantizar el éxito del proyecto.

Actividades realizadas:

Análisis de tecnologías disponibles.

Diseño de flujos de interacción para usuarios sin experiencia avanzada.

Revisión de herramientas de IA generativa.

Validación con personal técnico de DevStar Solutions.

La evaluación determinó que la herramienta es viable, tanto técnica como económicamente, con un alto potencial de impacto positivo en la eficiencia interna.

Factibilidad Técnica:

El proyecto cuenta con el soporte de tecnologías maduras y ampliamente utilizadas. Las herramientas de IA, junto con las APIs de generación de diagramas y los motores de generación de texto como ChatGPT, permiten cubrir los requerimientos funcionales. Además, el personal de DevStar Solutions dispone de los conocimientos técnicos necesarios para el desarrollo y despliegue del sistema en su infraestructura.

Factibilidad Económica

En este apartado, analizo la viabilidad económica del proyecto GDI-IA (Generador de Documentación impulsado por IA), considerando los costos que representa su desarrollo e implementación frente a los beneficios que aportará a la empresa DevStar Solutions. Esta evaluación incluye recursos disponibles, posibles inversiones necesarias y una proyección financiera clara de la inversión total.

Definir los siguientes costos:

Costos Generales

Costos operativos durante el desarrollo

Costos del ambiente

Costos de personal

Costos totales del desarrollo del sistema

Factibilidad Operativa

El sistema GDI-IA se diseñó con el objetivo de ser una herramienta altamente funcional y de bajo mantenimiento para el cliente. Se implementará en la empresa DevStar Solutions, la cual cuenta con personal técnico con experiencia en desarrollo de software, lo que facilitará la adopción del sistema.

Disminución del tiempo invertido en documentación.

Reducción de errores por omisión o ambigüedad.

Mejora de la comunicación entre desarrolladores y áreas de gestión.

Incremento de la productividad y eficiencia general del equipo técnico.

Equipo de desarrollo de DevStar Solutions.

Área de calidad de software.

Líderes de proyectos y gerencia técnica.

Clientes internos que requieren documentación clara y precisa.

Factibilidad Legal

Se ha revisado el cumplimiento del proyecto con respecto a las normas legales locales e internacionales:

La documentación generada no compromete datos personales, ya que se basa en entradas provistas voluntariamente por el usuario.

La plataforma cumple con regulaciones básicas de protección de datos (GDPR/LPDP), al almacenar únicamente la información necesaria y permitir su eliminación bajo requerimiento.

Las tecnologías y bibliotecas utilizadas serán de licencia libre o con licencias comerciales permitidas dentro del marco de uso interno de la empresa.

Factibilidad Social

Desde el punto de vista social y organizacional, la herramienta GDI-IA aporta valor positivo a los procesos internos de documentación en proyectos de desarrollo de software.

Aceptación interna: Se prevé una buena recepción por parte del equipo técnico, ya que se alinea con su necesidad de agilizar procesos.

Capacitación mínima: El personal no necesita experiencia avanzada en documentación para usar la herramienta.

Impacto en la cultura de trabajo: Refuerza una cultura más ordenada, comunicativa y basada en buenas prácticas de documentación.

Factibilidad Ambiental

El entorno técnico donde se implementará el sistema debe cumplir ciertos requerimientos mínimos para garantizar su operatividad, almacenamiento seguro de la documentación generada y disponibilidad para los usuarios. A continuación, se analiza el entorno necesario y el costo asociado a su implementación.

Dominio web: Necesario para alojar la plataforma GDI-IA y permitir el acceso por parte de los usuarios.

Servidor FTP: Donde se almacenarán los documentos generados, disponibles para su descarga.

Base de datos: Para almacenar proyectos, formularios, plantillas, interacciones y resultados.

Capacidad de almacenamiento: Al menos 100 GB disponibles, escalables según el uso.

Análisis Financiero

Para asegurar la viabilidad financiera del sistema GDI-IA dentro de la empresa DevStar Solutions, he elaborado un análisis detallado de ingresos esperados y egresos proyectados, con el objetivo de identificar la rentabilidad del proyecto desde su implementación y en el tiempo.

El análisis financiero determina la viabilidad económica del proyecto a través de tres indicadores principales: Relación Beneficio/Costo (B/C), Valor Actual Neto (VAN) y Tasa Interna de Retorno (TIR).

Supuestos financieros básicos

Horizonte de evaluación: 12 meses

Inversión inicial del proyecto: S/. 1,297.00

Tasa de descuento (COK): 6.5% anual (equivalente a 0.526% mensual)

Ingresos mensuales estimados: S/. 11,800.00

Egresos mensuales estimados: S/. 9,600.00

Por otro lado, los ingresos proyectados están directamente relacionados con los beneficios que obtendremos mediante el uso del sistema. Entre estos beneficios se encuentran:

Reducción de hasta un 60% del tiempo invertido por el personal en la redacción de documentos internos y externos.

Disminución del margen de error humano en los informes generados.

Capacidad de generar múltiples formatos (PDF, Word, Markdown, etc.) con mínima intervención.

Mejora de la productividad del equipo técnico y administrativo.

Justificación de la Inversión

Beneficios del Proyecto

La implementación del sistema Generador de Documentación Impulsado por IA (GDI-IA) en DevStar Solutions generará beneficios significativos tanto tangibles como intangibles, que contribuyen al fortalecimiento organizacional, optimización de procesos y consolidación competitiva de la empresa en el mercado.

Beneficios Tangibles

Reducción de tiempo en la generación de documentación técnica: Gracias al uso de inteligencia artificial, se automatiza la redacción y estructuración de documentos, disminuyendo la necesidad de intervención manual.

Optimización del uso del recurso humano: La automatización reduce la dependencia de personal técnico para tareas repetitivas, permitiendo su redistribución a actividades de mayor valor agregado.

Reducción de errores en documentación: La IA disminuye considerablemente los errores humanos, lo que evita retrabajos y mejora la calidad de entrega.

Reducción de costos operativos a mediano y largo plazo: Menor inversión en horas de trabajo y procesos manuales redundantes.

Incremento en la productividad del equipo de desarrollo y documentación.

Beneficios Intangibles

Mejora en la eficiencia de los procesos internos: El sistema aporta velocidad, precisión y consistencia en la elaboración de documentación técnica.

Disponibilidad de información actualizada en tiempo real, lo que favorece la toma de decisiones estratégicas.

Incremento en la satisfacción del cliente interno y externo, al contar con documentación clara, profesional y de acceso oportuno.

Mejor planeación y control de recursos en proyectos gracias a la estandarización de entregables.

Fortalecimiento de la imagen corporativa al adoptar tecnología de vanguardia.

Generación de ventaja competitiva sostenible en el sector tecnológico.

Criterios de Inversión

Los siguientes indicadores financieros permiten evaluar la factibilidad del proyecto en términos económicos, tomando en cuenta la inversión inicial, los flujos de caja proyectados y los beneficios netos esperados.

Relación Beneficio/Costo (B/C)

Este indicador mide el valor de los beneficios obtenidos por cada unidad monetaria invertida. Para el sistema GDI-IA, se obtuvo una relación B/C = 13.81, lo que indica que por cada sol invertido se generan 13.81 soles en beneficios, lo cual supera ampliamente el umbral mínimo de viabilidad (B/C > 1).

Fórmula:

B/C = Valor Actual de los Beneficios / Valor Actual de los Costos

Valor Actual Neto (VAN)

El VAN representa el valor presente de los beneficios netos del proyecto, descontados a una tasa correspondiente al costo de oportunidad del capital. Para este caso, el VAN obtenido es S/.16,568.85, lo cual indica que los ingresos generados superan ampliamente los costos y que la inversión genera valor para la empresa.

Fórmula:

Donde:

FCₜ = Flujo de Caja en el periodo t

r = Tasa de descuento (Costo de Oportunidad de Capital)

t = Número del periodo

Tasa Interna de Retorno (TIR)

La TIR del proyecto fue estimada en 1.53 mensual, es decir, representa la rentabilidad efectiva del capital invertido. Dado que esta tasa supera al costo de oportunidad de capital (COK), el cual es el rendimiento que se habría obtenido de haberse destinado los recursos a otra alternativa de inversión, el proyecto resulta financieramente atractivo.

Fórmula:

La TIR es la tasa que hace que el VAN sea igual a 0.

Conclusiones

Luego de desarrollar el presente estudio de factibilidad para el proyecto GDI-IA, puedo concluir que su implementación dentro de la empresa DevStar Solutions representa una solución técnica, económica, operativa, legal, social y ambientalmente viable. El análisis detallado de cada aspecto evaluado me ha permitido tener una visión clara de los beneficios que traerá este sistema para la organización.

En primer lugar, desde el punto de vista técnico, se cuenta con la infraestructura y los recursos tecnológicos necesarios para llevar a cabo el desarrollo e implementación del sistema sin necesidad de una inversión excesiva en nuevos equipos o plataformas. El software será desarrollado con tecnologías modernas y compatibles con el entorno actual de la empresa.

En cuanto a la factibilidad económica, he comprobado que la inversión inicial requerida es razonable en comparación con los ahorros mensuales que el sistema generará, gracias a la automatización de tareas repetitivas y la mejora en la productividad del personal. Se estima una recuperación de la inversión en un período de tiempo aceptable, lo cual refuerza la viabilidad financiera del proyecto.

La factibilidad operativa también es positiva, ya que el sistema ha sido pensado para integrarse de forma natural al flujo de trabajo de los usuarios, facilitando la generación de documentos mediante un entorno intuitivo y con el respaldo de inteligencia artificial. Además, el personal está dispuesto a capacitarse y utilizar esta herramienta para mejorar sus labores diarias.

Legalmente, no se identifican conflictos con normativas locales ni internacionales, y el proyecto respeta la privacidad y protección de datos, cumpliendo con los principios básicos del manejo responsable de la información.

Desde un enfoque social, el proyecto contribuirá al desarrollo de competencias digitales dentro de la empresa, promoviendo la innovación tecnológica y generando un impacto positivo en la cultura organizacional.

Finalmente, el impacto ambiental del sistema es mínimo, al promover la digitalización de documentos y reducir el consumo de papel, tinta y otros recursos físicos.

Por todo lo anterior, concluyo que el sistema GDI-IA no solo es factible, sino también una herramienta estratégica para optimizar los procesos internos de DevStar Solutions y avanzar hacia una gestión más eficiente e innovadora.

| CONTROL DE VERSIONES | CONTROL DE VERSIONES | CONTROL DE VERSIONES | CONTROL DE VERSIONES | CONTROL DE VERSIONES | CONTROL DE VERSIONES |
| --- | --- | --- | --- | --- | --- |
| Versión | Hecha por | Revisada por | Aprobada por | Fecha | Motivo |
| 1.0 | AHAO, CDAR, WESJ | PCQ | - | 24/04/2025 | Versión 1.0 |