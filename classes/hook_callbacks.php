<?php

namespace local_accessontu;

defined('MOODLE_INTERNAL') || die();

class hook_callbacks {

    public static function before_footer(
    \core\hook\output\before_footer_html_generation $hook
): void {
    global $OUTPUT, $PAGE;

    if (!isloggedin() || isguestuser()) {
        return;
    }

    $PAGE->requires->js(
        new \moodle_url('/local/accessontu/accessibility.js')
    );

    echo $OUTPUT->render_from_template(
        'local_accessontu/panel',
        []
    );
}
}