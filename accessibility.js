function initAccessibilityPanel() {
    const byId = id => document.getElementById(id);

    const el = {
        open: byId('accessontu-open'),
        close: byId('accessontu-close'),
        panel: byId('accessontu-panel'),

        preset: byId('accessontu-preset'),
        font: byId('accessontu-font'),
        theme: byId('accessontu-theme'),

        decrease: byId('accessontu-decrease'),
        increase: byId('accessontu-increase'),
        sizeValue: byId('accessontu-size-value'),

        line: byId('accessontu-line-spacing'),
        lineValue: byId('accessontu-line-value'),
        letter: byId('accessontu-letter-spacing'),
        letterValue: byId('accessontu-letter-value'),

        ruler: byId('accessontu-ruler'),
        narrow: byId('accessontu-narrow'),
        motion: byId('accessontu-motion'),

        speechSection: byId('accessontu-speech-section'),
        voice: byId('accessontu-voice'),
        speed: byId('accessontu-speed'),
        speedValue: byId('accessontu-speed-value'),
        speakSelected: byId('accessontu-speak-selected'),
        readFrom: byId('accessontu-read-from'),
        prev: byId('accessontu-prev'),
        speak: byId('accessontu-speak'),
        next: byId('accessontu-next'),
        stop: byId('accessontu-stop'),
        status: byId('accessontu-status'),

        reset: byId('accessontu-reset')
    };

    if (!el.open || !el.panel) {
        console.error('Accessibility panel elements not found');
        return;
    }

    /* ============================================================
       Налаштування: єдине джерело істини — об'єкт state
       ============================================================ */

    const STORAGE_KEY = 'accessontu.settings';

    const DEFAULTS = {
        preset: '',
        font: 'default',
        theme: 'light',
        fontsize: 100,
        linespacing: 1.5,
        letterspacing: 0,
        ruler: false,
        narrow: false,
        motion: false,
        voice: '',
        speed: 1
    };

    const FONTS = ['default', 'dyslexic', 'legible'];
    const THEMES = ['light', 'dark', 'contrast'];

    // Готові набори налаштувань.
    const PRESETS = {
        lowvision: {
            font: 'legible',
            theme: 'contrast',
            fontsize: 130,
            linespacing: 1.8,
            letterspacing: 1,
            narrow: true,
            ruler: false,
            motion: false
        },
        dyslexia: {
            font: 'dyslexic',
            theme: 'light',
            fontsize: 110,
            linespacing: 2,
            letterspacing: 1.5,
            narrow: true,
            ruler: true,
            motion: false
        },
        photophobia: {
            font: 'default',
            theme: 'dark',
            fontsize: 110,
            linespacing: 1.6,
            letterspacing: 0.5,
            narrow: false,
            ruler: false,
            motion: true
        }
    };

    function clamp(value, min, max, fallback) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(max, Math.max(min, number));
    }

    // Приведення будь-яких даних (кеш, Moodle) до допустимих значень.
    function sanitize(raw) {
        const s = Object.assign({}, DEFAULTS, raw || {});

        return {
            preset: Object.prototype.hasOwnProperty.call(PRESETS, s.preset)
                ? s.preset
                : '',
            font: FONTS.includes(s.font) ? s.font : DEFAULTS.font,
            theme: THEMES.includes(s.theme) ? s.theme : DEFAULTS.theme,
            fontsize: clamp(s.fontsize, 80, 150, DEFAULTS.fontsize),
            linespacing: clamp(s.linespacing, 1, 2.5, DEFAULTS.linespacing),
            letterspacing: clamp(s.letterspacing, 0, 5, DEFAULTS.letterspacing),
            ruler: s.ruler === true || s.ruler === 'true',
            narrow: s.narrow === true || s.narrow === 'true',
            motion: s.motion === true || s.motion === 'true',
            voice: String(s.voice || ''),
            speed: clamp(s.speed, 0.5, 2, DEFAULTS.speed)
        };
    }

    function readCache() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            return null;
        }
    }

    function writeCache() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            // Сховище недоступне — працюємо без кешу.
        }
    }

    // Кеш застосовується одразу, щоб сторінка не блимала стандартним виглядом.
    let state = sanitize(readCache());

    /* ============================================================
       Лінійка читання
       ============================================================ */

    const ruler = document.createElement('div');
    ruler.className = 'accessontu-ruler';
    ruler.setAttribute('aria-hidden', 'true');
    ruler.hidden = true;
    document.body.appendChild(ruler);

    function moveRuler(y) {
        ruler.style.transform = 'translateY(' + Math.round(y - 27) + 'px)';
    }

    moveRuler(window.innerHeight / 2);

    document.addEventListener('mousemove', function(event) {
        if (state.ruler) {
            moveRuler(event.clientY);
        }
    }, { passive: true });

    document.addEventListener('touchmove', function(event) {
        if (state.ruler && event.touches[0]) {
            moveRuler(event.touches[0].clientY);
        }
    }, { passive: true });

    /* ============================================================
       Застосування налаштувань до сторінки та до панелі
       ============================================================ */

    function setSelectValue(select, value) {
        if (!select) {
            return;
        }

        const exists = Array.from(select.options).some(
            option => option.value === value
        );

        if (exists) {
            select.value = value;
        }
    }

    function render() {
        const body = document.body.classList;

        // Шрифт.
        body.toggle('accessontu-dyslexic', state.font === 'dyslexic');
        body.toggle('accessontu-legible', state.font === 'legible');

        // Тема.
        body.remove('accessontu-dark', 'accessontu-contrast');

        if (state.theme === 'dark') {
            body.add('accessontu-dark');
        }

        if (state.theme === 'contrast') {
            body.add('accessontu-contrast');
        }

        // Розмір тексту та інтервали.
        const rootStyle = document.documentElement.style;

        rootStyle.fontSize = state.fontsize === 100
            ? ''
            : state.fontsize + '%';

        rootStyle.setProperty('--accessontu-line-spacing', state.linespacing);
        rootStyle.setProperty(
            '--accessontu-letter-spacing',
            state.letterspacing + 'px'
        );

        // Клас інтервалів — лише якщо значення відрізняються від стандартних,
        // щоб не змінювати сайт тим, хто нічого не налаштовував.
        body.toggle(
            'accessontu-spacing',
            state.linespacing !== DEFAULTS.linespacing ||
            state.letterspacing !== DEFAULTS.letterspacing
        );

        // Допоміжні засоби читання.
        body.toggle('accessontu-narrow', state.narrow);
        body.toggle('accessontu-reduce-motion', state.motion);
        ruler.hidden = !state.ruler;

        // Елементи панелі.
        setSelectValue(el.preset, state.preset);
        setSelectValue(el.font, state.font);
        setSelectValue(el.theme, state.theme);

        if (el.sizeValue) {
            el.sizeValue.textContent = state.fontsize + '%';
        }

        if (el.line) {
            el.line.value = state.linespacing;
        }

        if (el.lineValue) {
            el.lineValue.textContent = state.linespacing.toFixed(1);
        }

        if (el.letter) {
            el.letter.value = state.letterspacing;
        }

        if (el.letterValue) {
            el.letterValue.textContent = state.letterspacing + ' px';
        }

        if (el.ruler) {
            el.ruler.checked = state.ruler;
        }

        if (el.narrow) {
            el.narrow.checked = state.narrow;
        }

        if (el.motion) {
            el.motion.checked = state.motion;
        }

        if (el.speed) {
            el.speed.value = state.speed;
        }

        if (el.speedValue) {
            el.speedValue.textContent = state.speed.toFixed(1);
        }

        setSelectValue(el.voice, state.voice);
    }

    /* ============================================================
       Збереження: кеш одразу, Moodle — із затримкою (debounce)
       ============================================================ */

    let saveTimer = null;

    function saveToMoodle() {
        if (typeof M === 'undefined' || !M.cfg) {
            return;
        }

        const data = new URLSearchParams();

        data.append('sesskey', M.cfg.sesskey);
        data.append('font', state.font);
        data.append('theme', state.theme);
        data.append('fontsize', state.fontsize);
        data.append('linespacing', state.linespacing);
        data.append('letterspacing', state.letterspacing);

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

    function scheduleSave() {
        writeCache();

        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveToMoodle, 400);
    }

    // Будь-яка ручна зміна скидає вибраний набір на «Власні налаштування».
    function update(patch, fromPreset) {
        const extra = fromPreset ? {} : { preset: '' };

        state = sanitize(Object.assign({}, state, patch, extra));
        render();
        scheduleSave();
    }

    function coreSettings(s) {
        return [s.font, s.theme, s.fontsize, s.linespacing, s.letterspacing]
            .join('|');
    }

    // Завантаження з Moodle: сервер має пріоритет для п'яти основних полів.
    function loadFromMoodle() {
        if (typeof M === 'undefined' || !M.cfg) {
            return;
        }

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
            const merged = sanitize(Object.assign({}, state, {
                font: settings.font,
                theme: settings.theme,
                fontsize: settings.fontsize,
                linespacing: settings.linespacing,
                letterspacing: settings.letterspacing
            }));

            if (coreSettings(merged) !== coreSettings(state)) {
                merged.preset = '';
            }

            state = merged;
            render();
            writeCache();

            console.log('Налаштування завантажено');
        })
        .catch(error => {
            console.error('Не вдалося завантажити налаштування:', error);
        });
    }

    /* ============================================================
       Панель: відкриття, закриття, доступність
       ============================================================ */

    el.panel.setAttribute('role', 'dialog');
    el.panel.setAttribute('tabindex', '-1');

    if (!el.panel.hasAttribute('aria-label')) {
        el.panel.setAttribute('aria-label', 'Налаштування доступності');
    }

    el.open.setAttribute('aria-controls', 'accessontu-panel');

    function setPanel(isOpen, restoreFocus) {
        el.panel.hidden = !isOpen;
        el.open.setAttribute('aria-expanded', String(isOpen));

        if (isOpen) {
            (el.close || el.panel).focus();
        } else {
            setPickMode(false);

            if (restoreFocus) {
                el.open.focus();
            }
        }
    }

    el.open.addEventListener('click', function() {
        setPanel(el.panel.hidden, true);
    });

    if (el.close) {
        el.close.addEventListener('click', function() {
            setPanel(false, true);
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') {
            return;
        }

        if (pickMode) {
            setPickMode(false);
            setStatus('');
            return;
        }

        if (!el.panel.hidden) {
            setPanel(false, true);
        }
    });

    /* ============================================================
       Обробники налаштувань
       ============================================================ */

    if (el.preset) {
        el.preset.addEventListener('change', function() {
            const key = el.preset.value;

            if (!PRESETS[key]) {
                return;
            }

            update(Object.assign({ preset: key }, PRESETS[key]), true);
        });
    }

    if (el.font) {
        el.font.addEventListener('change', function() {
            update({ font: el.font.value });
        });
    }

    if (el.theme) {
        el.theme.addEventListener('change', function() {
            update({ theme: el.theme.value });
        });
    }

    if (el.increase) {
        el.increase.addEventListener('click', function() {
            update({ fontsize: state.fontsize + 10 });
        });
    }

    if (el.decrease) {
        el.decrease.addEventListener('click', function() {
            update({ fontsize: state.fontsize - 10 });
        });
    }

    if (el.line) {
        el.line.addEventListener('input', function() {
            update({ linespacing: el.line.value });
        });
    }

    if (el.letter) {
        el.letter.addEventListener('input', function() {
            update({ letterspacing: el.letter.value });
        });
    }

    if (el.ruler) {
        el.ruler.addEventListener('change', function() {
            update({ ruler: el.ruler.checked });
        });
    }

    if (el.narrow) {
        el.narrow.addEventListener('change', function() {
            update({ narrow: el.narrow.checked });
        });
    }

    if (el.motion) {
        el.motion.addEventListener('change', function() {
            update({ motion: el.motion.checked });
        });
    }

    if (el.reset) {
        el.reset.addEventListener('click', function() {
            stopReading();
            setPickMode(false);

            state = sanitize({});
            render();

            // Скидання зберігаємо одразу, без затримки.
            clearTimeout(saveTimer);
            writeCache();
            saveToMoodle();
        });
    }

    /* ============================================================
       Озвучування: читання з обраного місця, пауза, навігація
       ============================================================ */

    const speech = window.speechSynthesis;

    let setStatus = function() {};
    let setPickMode = function() {};
    let stopReading = function() {};
    let pickMode = false;

    if (!speech || !el.speak) {
        // Браузер не підтримує озвучення — ховаємо весь блок.
        if (el.speechSection) {
            el.speechSection.hidden = true;
        }
    } else {
        initSpeech();
    }

    function initSpeech() {
        const BLOCK_SELECTOR =
            'p, li, h1, h2, h3, h4, h5, h6, blockquote, dt, dd, ' +
            'figcaption, td, th, pre';

        const SKIP_SELECTOR =
            'nav, aside, footer, script, style, [hidden], ' +
            '[aria-hidden="true"], .accessontu-panel, .accessontu-open';

        let voices = [];
        let items = [];
        let index = -1;
        let runId = 0;
        let playback = 'idle'; // idle | playing | paused
        let currentBlock = null;
        let hoverBlock = null;
        let savedSelection = { text: '', lang: '' };

        // ---------- допоміжні функції ----------

        setStatus = function(text) {
            if (el.status) {
                el.status.textContent = text;
            }
        };

        function setPlayback(value) {
            playback = value;

            if (!el.speak) {
                return;
            }

            const labels = {
                idle: 'Почати озвучення',
                playing: 'Пауза',
                paused: 'Продовжити озвучення'
            };

            el.speak.textContent = value === 'playing'
                ? '\u275A\u275A'
                : '\u25B6\uFE0E';

            el.speak.setAttribute('aria-label', labels[value]);
            el.speak.setAttribute('title', labels[value]);
        }

        function getLang(node) {
            const element = node && node.nodeType === 1
                ? node
                : node && node.parentElement;

            const withLang = element && element.closest('[lang]');

            return (withLang && withLang.getAttribute('lang'))
                || document.documentElement.lang
                || 'uk-UA';
        }

        function textOf(node) {
            return (node.innerText || '').replace(/\s+/g, ' ').trim();
        }

        function isVisible(node) {
            return node.getClientRects().length > 0 &&
                getComputedStyle(node).visibility !== 'hidden';
        }

        function getRoot() {
            return document.querySelector('[role="main"]')
                || document.getElementById('region-main')
                || document.querySelector('main')
                || document.body;
        }

        // Абзаци основного вмісту, без меню та службових блоків.
        function collectItems() {
            return Array.from(getRoot().querySelectorAll(BLOCK_SELECTOR))
                .filter(node =>
                    !node.querySelector(BLOCK_SELECTOR) &&
                    !node.closest(SKIP_SELECTOR) &&
                    isVisible(node) &&
                    textOf(node).length > 1
                )
                .map(node => ({
                    el: node,
                    text: textOf(node),
                    lang: getLang(node)
                }));
        }

        function firstVisibleIndex(list) {
            const found = list.findIndex(
                item => item.el.getBoundingClientRect().bottom > 80
            );

            return found < 0 ? 0 : found;
        }

        // Довгі абзаци ділимо на речення: Chrome обриває дуже довге мовлення.
        function chunkText(text) {
            const parts = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text];
            const chunks = [];
            let current = '';

            parts.forEach(function(part) {
                if (current && current.length + part.length > 220) {
                    chunks.push(current.trim());
                    current = part;
                } else {
                    current += part;
                }
            });

            if (current.trim()) {
                chunks.push(current.trim());
            }

            return chunks;
        }

        function hardCancel() {
            if (speech.paused) {
                speech.resume();
            }

            speech.cancel();
        }

        // ---------- підсвічування ----------

        function inView(node) {
            const rect = node.getBoundingClientRect();
            return rect.top >= 0 && rect.bottom <= window.innerHeight;
        }

        function highlight(node) {
            if (currentBlock) {
                currentBlock.classList.remove('accessontu-reading');
            }

            currentBlock = node || null;

            if (!currentBlock) {
                return;
            }

            currentBlock.classList.add('accessontu-reading');

            if (!inView(currentBlock)) {
                const tall = currentBlock.getBoundingClientRect().height >
                    window.innerHeight * 0.8;

                currentBlock.scrollIntoView({
                    block: tall ? 'start' : 'center',
                    behavior: state.motion ? 'auto' : 'smooth'
                });
            }
        }

        // ---------- голоси ----------

        function loadVoices() {
            voices = speech.getVoices();

            const ukrainian = voices.filter(
                voice => voice.lang.toLowerCase().startsWith('uk')
            );

            if (!el.voice) {
                return;
            }

            el.voice.innerHTML = '';

            const auto = document.createElement('option');
            auto.value = '';
            auto.textContent = 'Автоматично (за мовою тексту)';
            el.voice.appendChild(auto);

            ukrainian.forEach(function(voice) {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = voice.name;
                el.voice.appendChild(option);
            });

            setSelectValue(el.voice, state.voice);
        }

        loadVoices();
        speech.addEventListener('voiceschanged', loadVoices);

        function makeUtterance(text, lang) {
            const utterance = new SpeechSynthesisUtterance(text);

            utterance.lang = lang;
            utterance.rate = state.speed;
            utterance.pitch = 1;

            // Обраний голос застосовуємо лише до тексту його мови.
            const voice = voices.find(v => v.name === state.voice);

            if (voice && voice.lang.toLowerCase().startsWith(
                lang.toLowerCase().slice(0, 2)
            )) {
                utterance.voice = voice;
            }

            return utterance;
        }

        // ---------- основний цикл читання ----------

        function finish() {
            highlight(null);
            items = [];
            index = -1;
            setPlayback('idle');
            setStatus('Озвучення завершено.');
        }

        function speakItem(i) {
            if (i < 0 || i >= items.length) {
                finish();
                return;
            }

            const run = runId;
            const item = items[i];
            const chunks = chunkText(item.text);
            let chunkIndex = 0;

            index = i;
            highlight(item.el);
            setPlayback('playing');

            setStatus(
                items.length > 1
                    ? 'Абзац ' + (i + 1) + ' з ' + items.length
                    : 'Озвучення виділеного тексту'
            );

            function speakNextChunk() {
                // runId змінюється при зупинці, переході чи новому запуску.
                if (run !== runId) {
                    return;
                }

                if (chunkIndex >= chunks.length) {
                    speakItem(i + 1);
                    return;
                }

                const utterance = makeUtterance(chunks[chunkIndex], item.lang);
                chunkIndex += 1;

                utterance.onend = speakNextChunk;

                utterance.onerror = function(event) {
                    const ignored = ['canceled', 'interrupted'];

                    if (run === runId && !ignored.includes(event.error)) {
                        setStatus('Не вдалося озвучити текст.');
                        stopReading(true);
                    }
                };

                speech.speak(utterance);
            }

            speakNextChunk();
        }

        function startReading(list, from) {
            runId += 1;
            hardCancel();

            if (!list.length) {
                setPlayback('idle');
                setStatus('На сторінці немає тексту для озвучування.');
                return;
            }

            items = list;
            speakItem(from);
        }

        function jump(i) {
            runId += 1;
            hardCancel();
            speakItem(i);
        }

        stopReading = function(keepStatus) {
            runId += 1;
            hardCancel();

            highlight(null);
            items = [];
            index = -1;
            setPlayback('idle');

            if (!keepStatus) {
                setStatus('');
            }
        };

        function startFromVisible() {
            const list = collectItems();
            startReading(list, firstVisibleIndex(list));
        }

        // ---------- вибір місця читання кліком ----------

        function blockFromNode(node) {
            const element = node && node.nodeType === 1
                ? node
                : node && node.parentElement;

            if (!element || element.closest('.accessontu-panel, .accessontu-open')) {
                return null;
            }

            return element.closest(BLOCK_SELECTOR);
        }

        function setHover(block) {
            if (hoverBlock === block) {
                return;
            }

            if (hoverBlock) {
                hoverBlock.classList.remove('accessontu-pick-hover');
            }

            hoverBlock = block;

            if (hoverBlock) {
                hoverBlock.classList.add('accessontu-pick-hover');
            }
        }

        setPickMode = function(on) {
            pickMode = on;

            document.body.classList.toggle('accessontu-picking', on);

            if (el.readFrom) {
                el.readFrom.setAttribute('aria-pressed', String(on));
            }

            if (on) {
                setStatus('Клацніть на абзац на сторінці. Esc — скасувати.');
            } else {
                setHover(null);
            }
        };

        document.addEventListener('mouseover', function(event) {
            if (pickMode) {
                setHover(blockFromNode(event.target));
            }
        });

        document.addEventListener('click', function(event) {
            if (!pickMode) {
                return;
            }

            if (event.target.closest('.accessontu-panel, .accessontu-open')) {
                return;
            }

            // Не даємо клікові відкрити посилання чи кнопку на сторінці.
            event.preventDefault();
            event.stopPropagation();

            const block = blockFromNode(event.target);

            setPickMode(false);

            if (!block) {
                setStatus('Тут немає тексту. Спробуйте ще раз.');
                return;
            }

            const list = collectItems();

            const from = list.findIndex(
                item => item.el === block ||
                    block.contains(item.el) ||
                    item.el.contains(block)
            );

            if (from < 0) {
                setStatus('Цей фрагмент неможливо озвучити.');
                return;
            }

            startReading(list, from);
        }, true);

        // ---------- виділений текст ----------

        function getSelectionInfo() {
            const selection = window.getSelection();

            return {
                text: selection.toString().replace(/\s+/g, ' ').trim(),
                lang: getLang(selection.anchorNode)
            };
        }

        document.addEventListener('selectionchange', function() {
            const info = getSelectionInfo();
            const anchor = window.getSelection().anchorNode;
            const element = anchor && (anchor.nodeType === 1
                ? anchor
                : anchor.parentElement);

            if (info.text && !(element && element.closest('.accessontu-panel'))) {
                savedSelection = info;
            }
        });

        // ---------- кнопки ----------

        if (el.speakSelected) {
            el.speakSelected.addEventListener('click', function() {
                const live = getSelectionInfo();
                const chosen = live.text ? live : savedSelection;

                if (!chosen.text) {
                    setStatus('Спочатку виділіть текст на сторінці.');
                    return;
                }

                startReading(
                    [{ el: null, text: chosen.text, lang: chosen.lang }],
                    0
                );
            });
        }

        if (el.readFrom) {
            el.readFrom.addEventListener('click', function() {
                if (pickMode) {
                    setPickMode(false);
                    setStatus('');
                } else {
                    setPickMode(true);
                }
            });
        }

        el.speak.addEventListener('click', function() {
            if (playback === 'playing') {
                speech.pause();
                setPlayback('paused');
                return;
            }

            if (playback === 'paused') {
                speech.resume();
                setPlayback('playing');
                return;
            }

            startFromVisible();
        });

        if (el.prev) {
            el.prev.addEventListener('click', function() {
                if (playback === 'idle') {
                    startFromVisible();
                    return;
                }

                jump(Math.max(0, index - 1));
            });
        }

        if (el.next) {
            el.next.addEventListener('click', function() {
                if (playback === 'idle') {
                    startFromVisible();
                    return;
                }

                jump(index + 1);
            });
        }

        if (el.stop) {
            el.stop.addEventListener('click', function() {
                stopReading();
            });
        }

        if (el.voice) {
            el.voice.addEventListener('change', function() {
                update({ voice: el.voice.value }, true);
            });
        }

        if (el.speed) {
            el.speed.addEventListener('input', function() {
                update({ speed: el.speed.value }, true);
            });
        }

        window.addEventListener('pagehide', function() {
            speech.cancel();
        });

        setPlayback('idle');
    }

    /* ============================================================
       Запуск
       ============================================================ */

    render();
    loadFromMoodle();
}

// Запуск після завантаження сторінки.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibilityPanel);
} else {
    initAccessibilityPanel();
}