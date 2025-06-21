Feature: Inicio de sesión

  Scenario: Inicio exitoso
    Given que soy un usuario registrado
    When ingreso credenciales correctas en login.html
    Then accedo al panel principal y soy redirigido a index.html
