<?php
if ($_POST["usuario"] == "Walter" && $_POST["contrasena"] == "72943816") {
    session_name("loginUsuario");
    session_start();
    $_SESSION["autenticado"] = "SI";
    $_SESSION["usuario"] = $_POST["usuario"];
    $_SESSION["ultimoAcceso"] = date("Y-n-j H:i:s");
    header("Location: aplicacion.php");
} else {
    header("Location: index.php?errorusuario=si");
}
?>