<?php
session_name("loginUsuario");
session_start();

if (!isset($_SESSION["autenticado"]) || $_SESSION["autenticado"] != "SI") {
    header("Location: index.php");
    exit();
} else {
    $fechaGuardada = $_SESSION["ultimoAcceso"];
    $ahora = date("Y-n-j H:i:s");
    $tiempo_transcurrido = strtotime($ahora) - strtotime($fechaGuardada);

    if ($tiempo_transcurrido >= 600) { // 10 minutos
        session_destroy();
        header("Location: index.php");
        exit();
    } else {
        $_SESSION["ultimoAcceso"] = $ahora;
    }
}
?>
