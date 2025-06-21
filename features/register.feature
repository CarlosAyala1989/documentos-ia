Feature: Registro de usuario

  Scenario: Registro exitoso
    Given que un visitante está en la página de registro
    When ingresa un nombre válido, correo no registrado y contraseña segura
    And hace clic en "Registrar"
    Then el sistema crea la cuenta y redirige al inicio de sesión

  Scenario: Registro con correo ya existente
    Given que un usuario está en la página de registro
    And el correo ya existe
    When intenta registrarse
    Then se muestra un mensaje de error y permanece en la misma página
