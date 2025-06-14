<?php
include("seguridad.php");
include("conexion.php");

// session_start(); // Eliminada para evitar doble inicio de sesión
if (!isset($_SESSION['autenticado']) || $_SESSION['autenticado'] != "SI" || $_SESSION['usuario'] != "admin1") {
    header("Location: index.php");
    exit();
}

$link = conectarse();

// Procesar agregar usuario
if (isset($_POST['agregar'])) {
    $nuevo_nombre = mysqli_real_escape_string($link, $_POST['nuevo_nombre']);
    $nuevo_apellido = mysqli_real_escape_string($link, $_POST['nuevo_apellido']);
    $nuevo_usuario = mysqli_real_escape_string($link, $_POST['nuevo_usuario']);
    $nuevo_email = mysqli_real_escape_string($link, $_POST['nuevo_email']);
    $nueva_contrasena = mysqli_real_escape_string($link, $_POST['nueva_contrasena']);
    $confirmar_contrasena = mysqli_real_escape_string($link, $_POST['confirmar_contrasena']);
    if ($nueva_contrasena === $confirmar_contrasena) {
        $sql = "INSERT INTO usuario (nombre, apellido, usuario, email, contrasena) VALUES ('$nuevo_nombre', '$nuevo_apellido', '$nuevo_usuario', '$nuevo_email', '$nueva_contrasena')";
        mysqli_query($link, $sql);
    } else {
        echo '<script>alert("Las contraseñas no coinciden.");</script>';
    }
}

// Procesar eliminar usuario
if (isset($_POST['eliminar'])) {
    $usuario_eliminar = mysqli_real_escape_string($link, $_POST['usuario_eliminar']);
    if ($usuario_eliminar != "admin1") {
        $sql = "DELETE FROM usuario WHERE usuario = '$usuario_eliminar'";
        mysqli_query($link, $sql);
    }
}

// Procesar editar usuario
if (isset($_POST['editar'])) {
    $usuario_editar = mysqli_real_escape_string($link, $_POST['usuario_editar']);
    $nuevo_email = mysqli_real_escape_string($link, $_POST['editar_email']);
    $nueva_contrasena = mysqli_real_escape_string($link, $_POST['editar_contrasena']);
    if (!empty($nueva_contrasena)) {
        $sql = "UPDATE usuario SET email = '$nuevo_email', contrasena = '$nueva_contrasena' WHERE usuario = '$usuario_editar'";
    } else {
        $sql = "UPDATE usuario SET email = '$nuevo_email' WHERE usuario = '$usuario_editar'";
    }
    mysqli_query($link, $sql);
}

// Obtener usuarios
$sql = "SELECT usuario, email FROM usuario";
$rs = mysqli_query($link, $sql);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Administración de Usuarios</title>
    <link href="css/estilos.css" rel="stylesheet">
    <link href="css/contenido.css" rel="stylesheet">
    <link href="css/admin_usuarios.css" rel="stylesheet">
</head>
<body>
    <div class="admin-usuarios-container">
        <h2>Administración de Usuarios</h2>
        <a href="salir.php" class="cerrar-sesion">Cerrar sesión</a>
        <h3>Usuarios registrados</h3>
        <table border="1">
            <tr><th>Usuario</th><th>Email</th><th>Editar</th><th>Eliminar</th></tr>
            <?php while($row = mysqli_fetch_assoc($rs)) { ?>
            <tr>
                <form method="post">
                <td><?php echo htmlspecialchars($row['usuario']); ?>
                    <input type="hidden" name="usuario_editar" value="<?php echo htmlspecialchars($row['usuario']); ?>">
                </td>
                <td><input type="email" name="editar_email" value="<?php echo htmlspecialchars($row['email']); ?>" required></td>
                <td>
                    <input type="password" name="editar_contrasena" placeholder="Nueva contraseña (opcional)">
                    <input type="submit" name="editar" value="Editar">
                </td>
                <td>
                    <?php if ($row['usuario'] != "admin1") { ?>
                        <input type="hidden" name="usuario_eliminar" value="<?php echo htmlspecialchars($row['usuario']); ?>">
                        <input type="submit" name="eliminar" value="Eliminar" onclick="return confirm('¿Seguro que deseas eliminar este usuario?');">
                    <?php } else { echo "-"; } ?>
                </td>
                </form>
            </tr>
            <?php } ?>
        </table>
        <h3>Agregar nuevo usuario</h3>
        <form method="post" class="form-agregar-usuario-horizontal" id="formAgregarUsuario">
            <div class="form-row">
                <label for="nuevo_nombre">Nombre</label>
                <input type="text" id="nuevo_nombre" name="nuevo_nombre" placeholder="Nombre" required>
            </div>
            <div class="form-row">
                <label for="nuevo_apellido">Apellido</label>
                <input type="text" id="nuevo_apellido" name="nuevo_apellido" placeholder="Apellido" required>
            </div>
            <div class="form-row">
                <label for="nuevo_usuario">Usuario</label>
                <input type="text" id="nuevo_usuario" name="nuevo_usuario" placeholder="Usuario" required>
            </div>
            <div class="form-row">
                <label for="nuevo_email">Email</label>
                <input type="email" id="nuevo_email" name="nuevo_email" placeholder="Email" required>
            </div>
            <div class="form-row">
                <label for="nueva_contrasena">Contraseña</label>
                <input type="password" id="nueva_contrasena" name="nueva_contrasena" placeholder="Ingrese aquí su contraseña" required>
            </div>
            <div class="form-row">
                <label for="confirmar_contrasena">Confirmar Contraseña</label>
                <input type="password" id="confirmar_contrasena" name="confirmar_contrasena" placeholder="Confirme su contraseña" required>
            </div>
            <input type="submit" name="agregar" value="Agregar">
        </form>
    </div>
    <script>
    document.getElementById('formAgregarUsuario').onsubmit = function(e) {
        var pass = document.getElementById('nueva_contrasena').value;
        var conf = document.getElementById('confirmar_contrasena').value;
        if (pass !== conf) {
            alert('Las contraseñas no coinciden.');
            e.preventDefault();
            return false;
        }
    };
    </script>
</body>
</html>
<?php
mysqli_close($link);
?> 