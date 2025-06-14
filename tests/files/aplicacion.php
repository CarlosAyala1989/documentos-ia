<?php include("seguridad.php"); ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Aplicación segura</title>
    <link rel="stylesheet" href="css/aplicacion.css">
</head>
<body>
<h1>Bienvenido, <?php echo $_SESSION["usuario"]; ?></h1>
<p>Si estás aquí es que te has autenticado correctamente.</p>
<p>Estás en la zona segura de la aplicación.</p>
<a href="salir.php">Salir de la zona segura</a>
</body>
</html>
