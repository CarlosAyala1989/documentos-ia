Feature: Visualización del análisis

  Scenario: Ver análisis
    Given que el análisis ha finalizado
    When el frontend recibe el texto
    Then se muestra en el panel de resultados correctamente