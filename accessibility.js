
function initAccessibilityPanel() {
    const openButton = document.getElementById('accessontu-open');
    const closeButton = document.getElementById('accessontu-close');
    const panel = document.getElementById('accessontu-panel');

    const fontSelect = document.getElementById('accessontu-font');
    const themeSelect = document.getElementById('accessontu-theme');

    const decreaseButton = document.getElementById('accessontu-decrease');
    const increaseButton = document.getElementById('accessontu-increase');
    const sizeValue = document.getElementById('accessontu-size-value');

    const resetButton = document.getElementById('accessontu-reset');

    const lineSpacing = document.getElementById('accessontu-line-spacing');
    const lineValue = document.getElementById('accessontu-line-value');

    const letterSpacing = document.getElementById('accessontu-letter-spacing');
    const letterValue = document.getElementById('accessontu-letter-value');

    // Елементи озвучування.
    const speakButton = document.getElementById('accessontu-speak');
    const speakSelectedButton = document.getElementById('accessontu-speak-selected');
    const stopButton = document.getElementById('accessontu-stop');

    const voiceSelect = document.getElementById('accessontu-voice');
    const speedSlider = document.getElementById('accessontu-speed');
    const speedValue = document.getElementById('accessontu-speed-value');

    if (!openButton || !panel) {
        console.error('Accessibility panel elements not found');
        return;
    }

    let fontSize = 100;

    // Збереження налаштувань у Moodle.
    function saveSettings() {
        const data = new URLSearchParams();

        data.append('sesskey', M.cfg.sesskey);
        data.append('font', fontSelect.value);
        data.append('theme', themeSelect.value);
        data.append('fontsize', fontSize);
        data.append('linespacing', lineSpacing.value);
        data.append('letterspacing', letterSpacing.value);

        fetch(M.cfg.wwwroot + '/local/accessontu/save.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: data.toString(),
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка збереження налаштувань');
            }

            return response.json();
        })
        .then(result => {
            console.log(result.message);
        })
        .catch(error => {
            console.error('Не вдалося зберегти налаштування:', error);
        });
    }

    // Завантаження налаштувань із Moodle.
    function loadSettings() {
        fetch(M.cfg.wwwroot + '/local/accessontu/load.php', {
            method: 'GET',
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Помилка завантаження налаштувань');
            }

            return response.json();
        })
        .then(settings => {
            // Відновлення шрифту.
            fontSelect.value = settings.font;

            document.body.classList.toggle(
                'accessontu-dyslexic',
                settings.font === 'dyslexic'
            );

            // Відновлення теми.
            themeSelect.value = settings.theme;

            document.body.classList.remove(
                'accessontu-dark',
                'accessontu-contrast'
            );

            if (settings.theme === 'dark') {
                document.body.classList.add('accessontu-dark');
            }

            if (settings.theme === 'contrast') {
                document.body.classList.add('accessontu-contrast');
            }

            // Відновлення розміру тексту.
            fontSize = Number(settings.fontsize);

            document.documentElement.style.fontSize =
                fontSize + '%';

            sizeValue.textContent = fontSize + '%';

            // Відновлення міжрядкового інтервалу.
            lineSpacing.value = settings.linespacing;

            document.documentElement.style.setProperty(
                '--accessontu-line-spacing',
                settings.linespacing
            );

            lineValue.textContent = settings.linespacing;

            // Відновлення відстані між літерами.
            letterSpacing.value = settings.letterspacing;

            document.documentElement.style.setProperty(
                '--accessontu-letter-spacing',
                settings.letterspacing + 'px'
            );

            letterValue.textContent =
                settings.letterspacing + ' px';

            document.body.classList.add('accessontu-spacing');

            console.log('Налаштування завантажено');
        })
        .catch(error => {
            console.error(
                'Не вдалося завантажити налаштування:',
                error
            );
        });
    }

    // Відкриття та закриття панелі.
    openButton.addEventListener('click', function() {
        panel.hidden = !panel.hidden;
    });

    if (closeButton) {
        closeButton.addEventListener('click', function() {
            panel.hidden = true;
        });
    }

    // Зміна розміру тексту.
    function updateFontSize() {
        document.documentElement.style.fontSize = fontSize + '%';
        sizeValue.textContent = fontSize + '%';
        saveSettings();
    }

    if (increaseButton) {
        increaseButton.addEventListener('click', function() {
            fontSize = Math.min(fontSize + 10, 150);
            updateFontSize();
        });
    }

    if (decreaseButton) {
        decreaseButton.addEventListener('click', function() {
            fontSize = Math.max(fontSize - 10, 80);
            updateFontSize();
        });
    }

    // Зміна шрифту.
    if (fontSelect) {
        fontSelect.addEventListener('change', function() {
            document.body.classList.toggle(
                'accessontu-dyslexic',
                fontSelect.value === 'dyslexic'
            );

            saveSettings();
        });
    }

    // Зміна теми.
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            document.body.classList.remove(
                'accessontu-dark',
                'accessontu-contrast'
            );

            if (themeSelect.value === 'dark') {
                document.body.classList.add('accessontu-dark');
            }

            if (themeSelect.value === 'contrast') {
                document.body.classList.add('accessontu-contrast');
            }

            saveSettings();
        });
    }

    // Зміна міжрядкового інтервалу.
    if (lineSpacing) {
        lineSpacing.addEventListener('input', function() {
            document.documentElement.style.setProperty(
                '--accessontu-line-spacing',
                lineSpacing.value
            );

            document.body.classList.add('accessontu-spacing');
            lineValue.textContent = lineSpacing.value;
        });

        lineSpacing.addEventListener('change', saveSettings);
    }

    // Зміна відстані між літерами.
    if (letterSpacing) {
        letterSpacing.addEventListener('input', function() {
            document.documentElement.style.setProperty(
                '--accessontu-letter-spacing',
                letterSpacing.value + 'px'
            );

            document.body.classList.add('accessontu-spacing');
            letterValue.textContent = letterSpacing.value + ' px';
        });

        letterSpacing.addEventListener('change', saveSettings);
    }

    // Скидання налаштувань.
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            fontSize = 100;

            fontSelect.value = 'default';
            themeSelect.value = 'light';

            document.body.classList.remove(
                'accessontu-dyslexic',
                'accessontu-dark',
                'accessontu-contrast',
                'accessontu-spacing'
            );

            document.documentElement.style.fontSize = '';
            sizeValue.textContent = '100%';

            lineSpacing.value = 1.5;
            letterSpacing.value = 0;

            lineValue.textContent = '1.5';
            letterValue.textContent = '0 px';

            document.documentElement.style.removeProperty(
                '--accessontu-line-spacing'
            );

            document.documentElement.style.removeProperty(
                '--accessontu-letter-spacing'
            );

            saveSettings();
        });
    }

    // ==========================================
    // НАЛАШТУВАННЯ ОЗВУЧУВАННЯ
    // ==========================================

    if (
        speakButton &&
        stopButton &&
        voiceSelect &&
        speedSlider &&
        speedValue &&
        window.speechSynthesis
    ) {
        let availableVoices = [];

        // Збереження виділеного тексту.
        let savedSelectedText = '';

        document.addEventListener('selectionchange', function() {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (selectedText.length > 0) {
                savedSelectedText = selectedText;
            }
        });

        // Отримання доступних голосів браузера.
        function loadVoices() {
            availableVoices = window.speechSynthesis.getVoices();

            const ukrainianVoices = availableVoices.filter(
                voice => voice.lang.toLowerCase().startsWith('uk')
            );

            const previousVoice = voiceSelect.value;

            voiceSelect.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Автоматичний український голос';

            voiceSelect.appendChild(defaultOption);

            ukrainianVoices.forEach(voice => {
                const option = document.createElement('option');

                option.value = voice.name;
                option.textContent = voice.name;

                voiceSelect.appendChild(option);
            });

            // Відновлення попереднього вибору голосу.
            if (ukrainianVoices.some(voice => voice.name === previousVoice)) {
                voiceSelect.value = previousVoice;
            }
        }

        loadVoices();

        window.speechSynthesis.addEventListener(
            'voiceschanged',
            loadVoices
        );

        // Отримання вибраного голосу.
        function getSelectedVoice() {
            return availableVoices.find(
                voice => voice.name === voiceSelect.value
            );
        }

        // Загальна функція озвучування.
        function speakText(text) {
            if (!text || !text.trim()) {
                alert('Текст для озвучування відсутній.');
                return;
            }

            window.speechSynthesis.cancel();

            const speech = new SpeechSynthesisUtterance(text);

            speech.lang = 'uk-UA';
            speech.rate = Number(speedSlider.value);
            speech.pitch = 1;

            const selectedVoice = getSelectedVoice();

            if (selectedVoice) {
                speech.voice = selectedVoice;
            }

            window.speechSynthesis.speak(speech);
        }

        // Зміна швидкості читання.
        speedSlider.addEventListener('input', function() {
            speedValue.textContent =
                Number(speedSlider.value).toFixed(1);
        });

        // Озвучування всієї сторінки.
        speakButton.addEventListener('click', function() {
            const text = document.querySelector('main')?.innerText
                || document.body.innerText;

            speakText(text);
        });

        // Озвучування виділеного тексту.
        if (speakSelectedButton) {
            speakSelectedButton.addEventListener('click', function() {
                const currentSelection = window.getSelection()
                    .toString()
                    .trim();

                const textToSpeak = currentSelection || savedSelectedText;

                if (!textToSpeak) {
                    alert('Спочатку виділіть текст для озвучування.');
                    return;
                }

                speakText(textToSpeak);
            });
        }

        // Зупинка озвучування.
        stopButton.addEventListener('click', function() {
            window.speechSynthesis.cancel();
        });
    }

    // Завантаження збережених налаштувань.
    loadSettings();
}

// Запуск після завантаження сторінки.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibilityPanel);
} else {
    initAccessibilityPanel();
}
