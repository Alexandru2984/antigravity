<?php
header('Content-Type: application/json');
echo json_encode([
    "status" => "ok",
    "service" => "PHP-legacy-web",
    "php_version" => phpversion()
]);
