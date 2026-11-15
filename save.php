
<?php

require_once(__DIR__ . '/../../config.php');

require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    throw new moodle_exception('invalidrequest');
}

require_sesskey();

// Отримання налаштувань.
$font = required_param('font', PARAM_ALPHA);
$theme = required_param('theme', PARAM_ALPHA);
$fontsize = required_param('fontsize', PARAM_INT);
$linespacing = required_param('linespacing', PARAM_FLOAT);
$letterspacing = required_param('letterspacing', PARAM_FLOAT);

// Перевірка допустимих значень.
if (!in_array($font, ['default', 'dyslexic'])) {
    throw new moodle_exception('invalidparameter');
}

if (!in_array($theme, ['light', 'dark', 'contrast'])) {
    throw new moodle_exception('invalidparameter');
}

if ($fontsize < 50 || $fontsize > 200) {
    throw new moodle_exception('invalidparameter');
}

if ($linespacing < 1 || $linespacing > 2.5) {
    throw new moodle_exception('invalidparameter');
}

if ($letterspacing < 0 || $letterspacing > 5) {
    throw new moodle_exception('invalidparameter');
}

// Збереження налаштувань у профілі користувача.
set_user_preferences([
    'local_accessontu_font' => $font,
    'local_accessontu_theme' => $theme,
    'local_accessontu_fontsize' => $fontsize,
    'local_accessontu_linespacing' => $linespacing,
    'local_accessontu_letterspacing' => $letterspacing,
]);

// Відповідь для JavaScript.
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'success' => true,
    'message' => 'Налаштування збережено'
]);
