<?php
session_name("loginUsuario");
session_start();
session_destroy();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Has salido</title>
    <link rel="stylesheet" href="css/salir.css">
</head>
<body>
<h1>Gracias por tu visita, <?php echo $_SESSION["usuario"]; ?></h1>
<p>Has cerrado la sesión correctamente.</p>
<a href="index.php">Volver al formulario de autenticación</a>
</body>
</html>
