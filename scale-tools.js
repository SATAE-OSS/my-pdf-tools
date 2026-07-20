(() => {
    const page = document.getElementById('scaleTab');
    if (!page) return;

    const numberFormatter = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 6 });
    const formatNumber = value => Number.isFinite(value) ? numberFormatter.format(Number(value.toPrecision(10))) : '—';

    const unitGroups = {
        length: {
            mm: { label: 'มิลลิเมตร', short: 'มม.', factor: .001 },
            cm: { label: 'เซนติเมตร', short: 'ซม.', factor: .01 },
            m: { label: 'เมตร', short: 'ม.', factor: 1 },
            km: { label: 'กิโลเมตร', short: 'กม.', factor: 1000 },
            in: { label: 'นิ้ว', short: 'นิ้ว', factor: .0254 },
            ft: { label: 'ฟุต', short: 'ฟุต', factor: .3048 },
            yd: { label: 'หลา', short: 'หลา', factor: .9144 }
        },
        area: {
            cm2: { label: 'ตารางเซนติเมตร', short: 'ซม.²', factor: .0001 },
            m2: { label: 'ตารางเมตร', short: 'ตร.ม.', factor: 1 },
            ft2: { label: 'ตารางฟุต', short: 'ft²', factor: .09290304 },
            wah2: { label: 'ตารางวา', short: 'ตร.ว.', factor: 4 },
            ngan: { label: 'งาน', short: 'งาน', factor: 400 },
            rai: { label: 'ไร่', short: 'ไร่', factor: 1600 }
        },
        volume: {
            ml: { label: 'มิลลิลิตร', short: 'มล.', factor: .001 },
            l: { label: 'ลิตร', short: 'ลิตร', factor: 1 },
            cm3: { label: 'ลูกบาศก์เซนติเมตร', short: 'ซม.³', factor: .001 },
            m3: { label: 'ลูกบาศก์เมตร', short: 'ม.³', factor: 1000 },
            gal: { label: 'แกลลอนสหรัฐ', short: 'gal', factor: 3.785411784 }
        },
        weight: {
            g: { label: 'กรัม', short: 'ก.', factor: .001 },
            kg: { label: 'กิโลกรัม', short: 'กก.', factor: 1 },
            lb: { label: 'ปอนด์', short: 'lb', factor: .45359237 },
            oz: { label: 'ออนซ์', short: 'oz', factor: .028349523125 }
        },
        temperature: {
            c: { label: 'เซลเซียส', short: '°C' },
            f: { label: 'ฟาเรนไฮต์', short: '°F' },
            k: { label: 'เคลวิน', short: 'K' }
        }
    };

    function fillUnitSelect(select, group, selected) {
        select.innerHTML = '';
        Object.entries(group).forEach(([value, unit]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = `${unit.label} (${unit.short})`;
            option.selected = value === selected;
            select.appendChild(option);
        });
    }

    function convertTemperature(value, from, to) {
        let celsius = value;
        if (from === 'f') celsius = (value - 32) * 5 / 9;
        if (from === 'k') celsius = value - 273.15;
        if (to === 'f') return celsius * 9 / 5 + 32;
        if (to === 'k') return celsius + 273.15;
        return celsius;
    }

    function convertUnit(value, category, from, to) {
        if (category === 'temperature') return convertTemperature(value, from, to);
        const group = unitGroups[category];
        return value * group[from].factor / group[to].factor;
    }

    // Switch between the three mini tools.
    const panelButtons = [...page.querySelectorAll('[data-scale-panel]')];
    const panels = [...page.querySelectorAll('.scale-panel')];
    panelButtons.forEach(button => button.addEventListener('click', () => {
        panelButtons.forEach(item => {
            const active = item === button;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', String(active));
        });
        panels.forEach(panel => {
            const active = panel.id === button.dataset.scalePanel;
            panel.hidden = !active;
            panel.classList.toggle('active', active);
        });
    }));

    // Drawing scale calculator.
    const scaleInput = document.getElementById('scaleInputValue');
    const scaleInputUnit = document.getElementById('scaleInputUnit');
    const scaleOutputUnit = document.getElementById('scaleOutputUnit');
    const scaleRatio = document.getElementById('drawingScaleRatio');
    const drawingCustomScale = document.getElementById('drawingCustomScale');
    const drawingCustomScaleWrap = document.getElementById('drawingCustomScaleWrap');
    const scaleInputLabel = document.getElementById('scaleInputLabel');
    const scaleResultValue = document.getElementById('scaleResultValue');
    const scaleResultExplanation = document.getElementById('scaleResultExplanation');
    const scaleModeButtons = [...page.querySelectorAll('[data-scale-mode]')];
    const scalePresetButtons = [...page.querySelectorAll('[data-scale-ratio]')];
    let scaleMode = 'realToPaper';

    fillUnitSelect(scaleInputUnit, unitGroups.length, 'm');
    fillUnitSelect(scaleOutputUnit, unitGroups.length, 'cm');

    function getScaleRatio(select, customInput) {
        const value = select.value === 'custom' ? Number(customInput.value) : Number(select.value);
        return Number.isFinite(value) && value > 0 ? value : 1;
    }

    function toggleCustomScale(select, wrapper) {
        wrapper.hidden = select.value !== 'custom';
    }

    function updateScaleCalculator() {
        const value = Number(scaleInput.value);
        const ratio = getScaleRatio(scaleRatio, drawingCustomScale);
        const from = unitGroups.length[scaleInputUnit.value];
        const to = unitGroups.length[scaleOutputUnit.value];
        const inputInMeters = value * from.factor;
        const resultInMeters = scaleMode === 'realToPaper' ? inputInMeters / ratio : inputInMeters * ratio;
        const result = resultInMeters / to.factor;
        scaleResultValue.textContent = `${formatNumber(result)} ${to.label}`;
        scaleResultExplanation.textContent = scaleMode === 'realToPaper'
            ? `ของจริง ${formatNumber(value)} ${from.label} ที่สเกล 1:${ratio} ให้วาดบนกระดาษยาว ${formatNumber(result)} ${to.label}`
            : `วัดบนกระดาษได้ ${formatNumber(value)} ${from.label} ที่สเกล 1:${ratio} ของจริงยาว ${formatNumber(result)} ${to.label}`;
        scalePresetButtons.forEach(button => button.classList.toggle('active', Number(button.dataset.scaleRatio) === ratio));
    }

    scaleModeButtons.forEach(button => button.addEventListener('click', () => {
        scaleMode = button.dataset.scaleMode;
        scaleModeButtons.forEach(item => item.classList.toggle('active', item === button));
        const paperToReal = scaleMode === 'paperToReal';
        scaleInputLabel.textContent = paperToReal ? 'ระยะที่วัดบนกระดาษ' : 'ระยะของจริง';
        fillUnitSelect(scaleInputUnit, unitGroups.length, paperToReal ? 'cm' : 'm');
        fillUnitSelect(scaleOutputUnit, unitGroups.length, paperToReal ? 'm' : 'cm');
        scaleInput.value = paperToReal ? '6' : '3';
        updateScaleCalculator();
    }));
    scalePresetButtons.forEach(button => button.addEventListener('click', () => {
        scaleRatio.value = button.dataset.scaleRatio;
        toggleCustomScale(scaleRatio, drawingCustomScaleWrap);
        updateScaleCalculator();
    }));
    [scaleInput, scaleInputUnit, scaleOutputUnit].forEach(control => {
        control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', updateScaleCalculator);
    });
    scaleRatio.addEventListener('change', () => {
        toggleCustomScale(scaleRatio, drawingCustomScaleWrap);
        updateScaleCalculator();
    });
    drawingCustomScale.addEventListener('input', updateScaleCalculator);

    // General unit converter.
    const unitCategory = document.getElementById('unitCategory');
    const unitInput = document.getElementById('unitInputValue');
    const unitFrom = document.getElementById('unitFrom');
    const unitTo = document.getElementById('unitTo');
    const unitOutput = document.getElementById('unitOutputValue');
    const unitEquation = document.getElementById('unitEquation');
    const swapUnitsButton = document.getElementById('swapUnitsBtn');
    const unitDefaults = {
        length: ['mm', 'm', 2400], area: ['m2', 'ft2', 24], volume: ['l', 'm3', 1000],
        weight: ['kg', 'lb', 10], temperature: ['c', 'f', 25]
    };

    function updateUnitConverter() {
        const category = unitCategory.value;
        const value = Number(unitInput.value);
        const result = convertUnit(value, category, unitFrom.value, unitTo.value);
        const from = unitGroups[category][unitFrom.value];
        const to = unitGroups[category][unitTo.value];
        unitOutput.textContent = formatNumber(result);
        unitEquation.textContent = `${formatNumber(value)} ${from.label} = ${formatNumber(result)} ${to.label}`;
    }

    function changeUnitCategory() {
        const category = unitCategory.value;
        const [from, to, value] = unitDefaults[category];
        fillUnitSelect(unitFrom, unitGroups[category], from);
        fillUnitSelect(unitTo, unitGroups[category], to);
        unitInput.value = value;
        updateUnitConverter();
    }
    unitCategory.addEventListener('change', changeUnitCategory);
    unitInput.addEventListener('input', updateUnitConverter);
    unitFrom.addEventListener('change', updateUnitConverter);
    unitTo.addEventListener('change', updateUnitConverter);
    swapUnitsButton.addEventListener('click', () => {
        const previousFrom = unitFrom.value;
        unitFrom.value = unitTo.value;
        unitTo.value = previousFrom;
        updateUnitConverter();
    });
    changeUnitCategory();

    // Paper fit checker. A 15 mm safe margin is reserved on every side.
    const roomWidth = document.getElementById('roomWidth');
    const roomHeight = document.getElementById('roomHeight');
    const paperScaleRatio = document.getElementById('paperScaleRatio');
    const paperCustomScale = document.getElementById('paperCustomScale');
    const paperCustomScaleWrap = document.getElementById('paperCustomScaleWrap');
    const paperSize = document.getElementById('paperSize');
    const paperOrientation = document.getElementById('paperOrientation');
    const paperPreview = document.getElementById('paperPreview');
    const drawingPreview = document.getElementById('drawingPreview');
    const paperResult = document.getElementById('paperResult');
    const paperResultTitle = document.getElementById('paperResultTitle');
    const paperResultDetail = document.getElementById('paperResultDetail');
    const paperSizes = {
        a0: [841, 1189], a1: [594, 841], a2: [420, 594], a3: [297, 420],
        a4: [210, 297], a5: [148, 210], letter: [215.9, 279.4],
        legal: [215.9, 355.6], tabloid: [279.4, 431.8]
    };
    const paperLabels = {
        a0: 'A0', a1: 'A1', a2: 'A2', a3: 'A3', a4: 'A4', a5: 'A5',
        letter: 'Letter', legal: 'Legal', tabloid: 'Tabloid'
    };
    const availableScales = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 500];

    function getPaperDimensions() {
        const [shortSide, longSide] = paperSizes[paperSize.value];
        return paperOrientation.value === 'landscape' ? [longSide, shortSide] : [shortSide, longSide];
    }

    function doesDrawingFit(widthMeters, heightMeters, ratio, usableWidth, usableHeight) {
        return widthMeters * 1000 / ratio <= usableWidth && heightMeters * 1000 / ratio <= usableHeight;
    }

    function updatePaperChecker() {
        const widthMeters = Math.max(0, Number(roomWidth.value));
        const heightMeters = Math.max(0, Number(roomHeight.value));
        const ratio = getScaleRatio(paperScaleRatio, paperCustomScale);
        const [paperWidth, paperHeight] = getPaperDimensions();
        const usableWidth = paperWidth - 30;
        const usableHeight = paperHeight - 30;
        const drawingWidth = widthMeters * 1000 / ratio;
        const drawingHeight = heightMeters * 1000 / ratio;
        const fits = drawingWidth <= usableWidth && drawingHeight <= usableHeight;
        const paperName = paperLabels[paperSize.value];

        paperPreview.classList.toggle('landscape', paperOrientation.value === 'landscape');
        drawingPreview.classList.toggle('too-large', !fits);
        drawingPreview.style.width = `${Math.min(125, drawingWidth / usableWidth * 100)}%`;
        drawingPreview.style.height = `${Math.min(125, drawingHeight / usableHeight * 100)}%`;
        paperResult.classList.toggle('fits', fits);
        paperResult.classList.toggle('does-not-fit', !fits);

        if (fits) {
            paperResultTitle.textContent = `✓ วางบน ${paperName} ได้`;
            paperResultDetail.textContent = `แบบจะมีขนาด ${formatNumber(drawingWidth / 10)} × ${formatNumber(drawingHeight / 10)} ซม. และยังเหลือขอบปลอดภัย 15 มม.`;
        } else {
            const suggestedRatio = availableScales.find(candidate => candidate > ratio && doesDrawingFit(widthMeters, heightMeters, candidate, usableWidth, usableHeight));
            paperResultTitle.textContent = `✕ แบบใหญ่เกิน ${paperName}`;
            paperResultDetail.textContent = suggestedRatio
                ? `ขนาดบนกระดาษคือ ${formatNumber(drawingWidth / 10)} × ${formatNumber(drawingHeight / 10)} ซม. ลองเปลี่ยนเป็นสเกล 1:${suggestedRatio}`
                : `ขนาดบนกระดาษคือ ${formatNumber(drawingWidth / 10)} × ${formatNumber(drawingHeight / 10)} ซม. ควรเลือกกระดาษใหญ่ขึ้น`;
        }
    }
    [roomWidth, roomHeight].forEach(input => input.addEventListener('input', updatePaperChecker));
    paperScaleRatio.addEventListener('change', () => {
        toggleCustomScale(paperScaleRatio, paperCustomScaleWrap);
        updatePaperChecker();
    });
    paperCustomScale.addEventListener('input', updatePaperChecker);
    [paperSize, paperOrientation].forEach(select => select.addEventListener('change', updatePaperChecker));

    updateScaleCalculator();
    updatePaperChecker();
})();
