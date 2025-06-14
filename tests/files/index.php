<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Autenticación PHP</title>
    <link rel="stylesheet" href="css/index.css">
</head>
<body>
<h1>Autenticación PHP</h1>
<form action="control.php" method="POST">
    <table align="center" width="300" cellspacing="2" cellpadding="2" border="0">
        <tr>
            <td colspan="2" align="center"
                <?php if (isset($_GET["errorusuario"]) && $_GET["errorusuario"] == "si") { ?>
                    bgcolor="orange"><span style="color:white"><b>Datos incorrectos</b></span>
                <?php } else { ?>
                    bgcolor="#cccccc">Introduce tu clave de acceso
                <?php } ?>
            </td>
        </tr>
        <tr>
            <td align="right">Usuario:</td>
            <td><input type="text" name="usuario" size="15" maxlength="50" required></td>
        </tr>
        <tr>
            <td align="right">Contraseña:</td>
            <td><input type="password" name="contrasena" size="15" maxlength="50" required></td>
        </tr>
        <tr>
            <td colspan="2" align="center"><input type="submit" value="Entrar"></td>
        </tr>
    </table>
</form>
</body>
</html>
