
<?php

require_once(__DIR__ . '/../../config.php');

require_login();

header('Content-Type: application/json; charset=utf-8');

// Отримання налаштувань із профілю користувача.
$settings = [
    'font' => get_user_preferences('local_accessontu_font', 'default'),
    'theme' => get_user_preferences('local_accessontu_theme', 'light'),
    'fontsize' => get_user_preferences('local_accessontu_fontsize', 100),
    'linespacing' => get_user_preferences('local_accessontu_linespacing', 1.5),
    'letterspacing' => get_user_preferences('local_accessontu_letterspacing', 0),
];

echo json_encode($settings);
