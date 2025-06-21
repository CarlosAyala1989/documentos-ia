Feature: Análisis IA con Gemini

  Scenario: Análisis exitoso
    Given que he subido un archivo
    When el sistema inicia análisis
    Then el backend envía a Gemini y muestra "Analizando código..."