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

    // Interior work calculators.
    const interiorToolButtons = [...page.querySelectorAll('[data-interior-tool]')];
    const interiorTools = [...page.querySelectorAll('.interior-tool')];
    const resultCard = (label, value, note = '', wide = false) => `
        <article class="interior-result-card${wide ? ' wide' : ''}">
            <span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ''}
        </article>`;

    interiorToolButtons.forEach(button => button.addEventListener('click', () => {
        interiorToolButtons.forEach(item => item.classList.toggle('active', item === button));
        interiorTools.forEach(tool => {
            const active = tool.id === button.dataset.interiorTool;
            tool.hidden = !active;
            tool.classList.toggle('active', active);
        });
    }));

    function positiveNumber(id, fallback = 0) {
        const value = Number(document.getElementById(id).value);
        return Number.isFinite(value) && value > 0 ? value : fallback;
    }

    const ceilingControlIds = ['ceilingWidth', 'ceilingLength', 'slabHeight', 'ceilingHeight', 'hangerSpacingX', 'hangerSpacingY', 'furringSpacing', 'trayBorderWidth', 'ceilingBoardSize', 'ceilingWaste'];
    function updateCeilingCalculator() {
        const width = positiveNumber('ceilingWidth');
        const length = positiveNumber('ceilingLength');
        const slabHeight = positiveNumber('slabHeight');
        const finishHeight = positiveNumber('ceilingHeight');
        const spacingX = positiveNumber('hangerSpacingX');
        const spacingY = positiveNumber('hangerSpacingY');
        const furringSpacing = positiveNumber('furringSpacing');
        const trayBorder = Math.max(0, Number(document.getElementById('trayBorderWidth').value) || 0) / 100;
        const result = document.getElementById('ceilingResults');
        const invalidTray = trayBorder > 0 && trayBorder * 2 >= Math.min(width, length);
        if (!width || !length || !slabHeight || !finishHeight || !spacingX || !spacingY || !furringSpacing || finishHeight >= slabHeight || invalidTray) {
            result.innerHTML = resultCard('ตรวจข้อมูล', 'กรอกขนาดให้ถูกต้อง', invalidTray ? 'ขอบฝ้าหลุมต้องไม่เกินครึ่งหนึ่งของด้านสั้น' : 'ระดับฝ้าต้องต่ำกว่าระดับท้องพื้น', true);
            return;
        }
        const [boardWidth, boardLength] = document.getElementById('ceilingBoardSize').value.split('x').map(Number);
        const waste = Number(document.getElementById('ceilingWaste').value) / 100;
        const area = width * length;
        const drop = slabHeight - finishHeight;
        const trayWidth = Math.max(0, width - trayBorder * 2);
        const trayLength = Math.max(0, length - trayBorder * 2);
        const fasciaArea = trayBorder > 0 ? (trayWidth + trayLength) * 2 * drop / 100 : 0;
        const boardSurfaceArea = area + fasciaArea;
        const acrossCount = Math.ceil(width / spacingX) + 1;
        const alongCount = Math.ceil(length / spacingY) + 1;
        const hangerCount = acrossCount * alongCount;
        const boards = Math.ceil(boardSurfaceArea / (boardWidth * boardLength) * (1 + waste));
        const totalHangerLength = hangerCount * drop / 100;
        const mainFrameLength = acrossCount * length;
        const furringRows = Math.ceil(length / furringSpacing) + 1;
        const furringLength = furringRows * width;
        result.innerHTML = [
            resultCard('พื้นที่ฝ้า', `${formatNumber(area)} ตร.ม.`, `รอบห้อง ${formatNumber((width + length) * 2)} เมตร`),
            resultCard('ระยะดรอป/สลิงต่อเส้น', `${formatNumber(drop)} ซม.`, `จาก ${formatNumber(slabHeight)} เหลือ ${formatNumber(finishHeight)} ซม.`),
            resultCard('จุดสลิงโดยประมาณ', `${formatNumber(hangerCount)} จุด`, `ตารางประมาณ ${acrossCount} × ${alongCount} จุด`),
            resultCard('แผ่นฝ้าโดยประมาณ', `${formatNumber(boards)} แผ่น`, `รวมเผื่อเศษ ${formatNumber(waste * 100)}%`),
            resultCard('ช่องกลางฝ้าหลุม', trayBorder > 0 ? `${formatNumber(trayWidth)} × ${formatNumber(trayLength)} ม.` : 'ฝ้าเรียบ', trayBorder > 0 ? `หน้าตั้งเพิ่มประมาณ ${formatNumber(fasciaArea)} ตร.ม.` : 'ไม่ได้กำหนดขอบฝ้าหลุม'),
            resultCard('โครงหลักโดยประมาณ', `${formatNumber(mainFrameLength)} เมตร`, `${acrossCount} แนวตามความยาวห้อง`),
            resultCard('โครงซอยโดยประมาณ', `${formatNumber(furringLength)} เมตร`, `${furringRows} แนว ระยะประมาณ ${formatNumber(furringSpacing)} ม.`),
            resultCard('ความยาวสลิงรวมขั้นต่ำ', `${formatNumber(totalHangerLength)} เมตร`, 'ยังไม่รวมระยะผูก ยึด และเศษหน้างาน', true)
        ].join('');
    }

    const spacingControlIds = ['spacingLength', 'spacingCount', 'spacingMode', 'spacingEdge'];
    function updateSpacingCalculator() {
        const length = positiveNumber('spacingLength');
        const count = Math.max(1, Math.min(30, Math.round(positiveNumber('spacingCount', 1))));
        const mode = document.getElementById('spacingMode').value;
        const customEdge = Math.max(0, Number(document.getElementById('spacingEdge').value) || 0);
        const edgeWrapper = document.getElementById('spacingEdgeWrap');
        edgeWrapper.hidden = mode !== 'customEdge';
        const result = document.getElementById('spacingResults');
        let gap;
        let edge;
        let positions;
        if (mode === 'equalEdges') {
            gap = length / (count + 1);
            edge = gap;
            positions = Array.from({ length: count }, (_, index) => gap * (index + 1));
        } else if (count === 1) {
            gap = 0;
            edge = length / 2;
            positions = [length / 2];
        } else {
            edge = customEdge;
            gap = (length - edge * 2) / (count - 1);
            positions = Array.from({ length: count }, (_, index) => edge + gap * index);
        }
        if (!length || gap < 0) {
            result.innerHTML = resultCard('ตรวจข้อมูล', 'พื้นที่ไม่พอ', 'ลดระยะจากขอบหรือลดจำนวนจุด', true);
            return;
        }
        const preview = document.getElementById('spacingPreview');
        preview.innerHTML = positions.slice(0, 12).map(position => `<i class="spacing-preview-point" style="left:${position / length * 100}%" data-pos="${formatNumber(position)}"></i>`).join('');
        result.innerHTML = [
            resultCard('ระยะห่างระหว่างจุด', count === 1 ? 'มีจุดเดียว' : `${formatNumber(gap)} ซม.`),
            resultCard('ระยะจากขอบ', `${formatNumber(edge)} ซม.`, 'วัดจากขอบถึงกึ่งกลางจุดแรก'),
            resultCard('ตำแหน่งที่ต้องทำเครื่องหมาย', positions.map(position => formatNumber(position)).join(', ') + ' ซม.', 'วัดต่อเนื่องจากขอบด้านเดียวกัน', true)
        ].join('');
    }

    const wallControlIds = ['wallLength', 'wallHeight', 'wallOpenings', 'paintCoats', 'paintCoverage', 'paintWaste'];
    function updateWallCalculator() {
        const length = positiveNumber('wallLength');
        const height = positiveNumber('wallHeight');
        const openings = Math.max(0, Number(document.getElementById('wallOpenings').value) || 0);
        const coats = Math.max(1, Math.round(positiveNumber('paintCoats', 1)));
        const coverage = positiveNumber('paintCoverage');
        const waste = Number(document.getElementById('paintWaste').value) / 100;
        const grossArea = length * height;
        const netArea = Math.max(0, grossArea - openings);
        const paintLiters = coverage ? netArea * coats / coverage * (1 + waste) : 0;
        document.getElementById('wallResults').innerHTML = [
            resultCard('พื้นที่ผนังก่อนหัก', `${formatNumber(grossArea)} ตร.ม.`),
            resultCard('พื้นที่ช่องเปิด', `${formatNumber(openings)} ตร.ม.`),
            resultCard('พื้นที่ผนังสุทธิ', `${formatNumber(netArea)} ตร.ม.`, 'ใช้เป็นพื้นที่ตั้งต้นสำหรับวัสดุ'),
            resultCard('สีที่ควรเตรียม', `${formatNumber(paintLiters)} ลิตร`, `${coats} เที่ยว รวมเผื่อ ${formatNumber(waste * 100)}%`)
        ].join('');
    }

    const tileControlIds = ['tileAreaWidth', 'tileAreaLength', 'tileWidth', 'tileLength', 'tilesPerBox', 'tileWaste'];
    function updateTileCalculator() {
        const areaWidth = positiveNumber('tileAreaWidth');
        const areaLength = positiveNumber('tileAreaLength');
        const tileWidth = positiveNumber('tileWidth') / 100;
        const tileLength = positiveNumber('tileLength') / 100;
        const perBox = Math.max(1, Math.round(positiveNumber('tilesPerBox', 1)));
        const waste = Number(document.getElementById('tileWaste').value) / 100;
        const area = areaWidth * areaLength;
        const tileArea = tileWidth * tileLength;
        const rawTiles = tileArea ? area / tileArea : 0;
        const requiredTiles = Math.ceil(rawTiles * (1 + waste));
        const boxes = Math.ceil(requiredTiles / perBox);
        const purchasedTiles = boxes * perBox;
        document.getElementById('tileResults').innerHTML = [
            resultCard('พื้นที่ทั้งหมด', `${formatNumber(area)} ตร.ม.`),
            resultCard('จำนวนก่อนเผื่อ', `${formatNumber(Math.ceil(rawTiles))} แผ่น`),
            resultCard('จำนวนรวมเผื่อ', `${formatNumber(requiredTiles)} แผ่น`, `เผื่อตัด/แตก ${formatNumber(waste * 100)}%`),
            resultCard('จำนวนที่ควรซื้อ', `${formatNumber(boxes)} กล่อง`, `${formatNumber(purchasedTiles)} แผ่น เมื่อกล่องละ ${perBox} แผ่น`)
        ].join('');
    }

    const wallpaperControlIds = ['wallpaperWallLength', 'wallpaperWallHeight', 'wallpaperRollWidth', 'wallpaperRollLength', 'wallpaperPatternWaste', 'baseboardDoors', 'baseboardWaste'];
    function updateWallpaperCalculator() {
        const wallLength = positiveNumber('wallpaperWallLength');
        const wallHeight = positiveNumber('wallpaperWallHeight');
        const rollWidth = positiveNumber('wallpaperRollWidth') / 100;
        const rollLength = positiveNumber('wallpaperRollLength');
        const patternWaste = Math.max(0, Number(document.getElementById('wallpaperPatternWaste').value) || 0) / 100;
        const doorWidth = Math.max(0, Number(document.getElementById('baseboardDoors').value) || 0);
        const baseboardWaste = Number(document.getElementById('baseboardWaste').value) / 100;
        const stripLength = wallHeight + patternWaste;
        const stripsNeeded = rollWidth ? Math.ceil(wallLength / rollWidth) : 0;
        const stripsPerRoll = stripLength ? Math.floor(rollLength / stripLength) : 0;
        const rolls = stripsPerRoll ? Math.ceil(stripsNeeded / stripsPerRoll) : 0;
        const baseboardNet = Math.max(0, wallLength - doorWidth);
        const baseboardPurchase = baseboardNet * (1 + baseboardWaste);
        document.getElementById('wallpaperResults').innerHTML = [
            resultCard('แถบวอลเปเปอร์ที่ต้องใช้', `${formatNumber(stripsNeeded)} แถบ`, `แถบละ ${formatNumber(stripLength)} เมตร`),
            resultCard('ตัดได้ต่อม้วน', stripsPerRoll ? `${formatNumber(stripsPerRoll)} แถบ` : 'ม้วนสั้นเกินไป', `ม้วนยาว ${formatNumber(rollLength)} เมตร`),
            resultCard('จำนวนวอลเปเปอร์', stripsPerRoll ? `${formatNumber(rolls)} ม้วน` : 'ตรวจขนาดม้วน', 'ควรซื้อรุ่นและล็อตสีเดียวกัน'),
            resultCard('ความยาวบัวสุทธิ', `${formatNumber(baseboardNet)} เมตร`, `หักช่องประตู ${formatNumber(doorWidth)} เมตร`),
            resultCard('บัวที่ควรเตรียม', `${formatNumber(baseboardPurchase)} เมตร`, `รวมเผื่อตัด ${formatNumber(baseboardWaste * 100)}%`, true)
        ].join('');
    }

    const sheetControlIds = ['sheetArea', 'sheetWidth', 'sheetLength', 'sheetLayers', 'sheetWaste'];
    function updateSheetCalculator() {
        const area = positiveNumber('sheetArea');
        const sheetWidth = positiveNumber('sheetWidth') / 1000;
        const sheetLength = positiveNumber('sheetLength') / 1000;
        const layers = Math.max(1, Math.round(positiveNumber('sheetLayers', 1)));
        const waste = Number(document.getElementById('sheetWaste').value) / 100;
        const oneSheetArea = sheetWidth * sheetLength;
        const workingArea = area * layers;
        const sheets = oneSheetArea ? Math.ceil(workingArea / oneSheetArea * (1 + waste)) : 0;
        const purchasedArea = sheets * oneSheetArea;
        document.getElementById('sheetResults').innerHTML = [
            resultCard('พื้นที่งานรวมทุกชั้น', `${formatNumber(workingArea)} ตร.ม.`, `${layers} ชั้น`),
            resultCard('พื้นที่ต่อแผ่น', `${formatNumber(oneSheetArea)} ตร.ม.`, `${formatNumber(sheetWidth)} × ${formatNumber(sheetLength)} เมตร`),
            resultCard('จำนวนที่ควรซื้อ', `${formatNumber(sheets)} แผ่น`, `รวมเผื่อตัด ${formatNumber(waste * 100)}%`),
            resultCard('พื้นที่วัสดุที่ซื้อ', `${formatNumber(purchasedArea)} ตร.ม.`, `เหลือจากพื้นที่คำนวณประมาณ ${formatNumber(Math.max(0, purchasedArea - workingArea))} ตร.ม.`)
        ].join('');
    }

    const lightingControlIds = ['lightRoomWidth', 'lightRoomLength', 'targetLux', 'lampLumens', 'lightFactor'];
    function updateLightingCalculator() {
        const width = positiveNumber('lightRoomWidth');
        const length = positiveNumber('lightRoomLength');
        const lux = positiveNumber('targetLux');
        const lampLumens = positiveNumber('lampLumens');
        const factor = positiveNumber('lightFactor');
        const area = width * length;
        const requiredLumens = factor ? area * lux / factor : 0;
        const lamps = lampLumens ? Math.max(1, Math.ceil(requiredLumens / lampLumens)) : 0;
        const columns = lamps ? Math.max(1, Math.ceil(Math.sqrt(lamps * width / Math.max(length, .01)))) : 0;
        const rows = columns ? Math.ceil(lamps / columns) : 0;
        const spacingX = columns ? width / (columns + 1) : 0;
        const spacingY = rows ? length / (rows + 1) : 0;
        const estimatedLux = area ? lamps * lampLumens * factor / area : 0;
        const preview = document.getElementById('lightingPreview');
        preview.style.setProperty('--light-cols', columns || 1);
        preview.innerHTML = Array.from({ length: Math.min(lamps, 48) }, () => '<i></i>').join('');
        document.getElementById('lightingResults').innerHTML = [
            resultCard('พื้นที่ห้อง', `${formatNumber(area)} ตร.ม.`),
            resultCard('แสงที่ต้องใช้', `${formatNumber(requiredLumens)} ลูเมน`, `เป้าหมาย ${formatNumber(lux)} lux`),
            resultCard('จำนวนโคมประมาณ', `${formatNumber(lamps)} โคม`, `โคมละ ${formatNumber(lampLumens)} ลูเมน`),
            resultCard('จัดผังเริ่มต้น', `${columns} × ${rows} จุด`, `ระยะคร่าว ๆ ${formatNumber(spacingX)} × ${formatNumber(spacingY)} ม.`),
            resultCard('ความสว่างที่ได้ประมาณ', `${formatNumber(estimatedLux)} lux`, 'ก่อนพิจารณาความสูงและการกระจายแสงจริง', true)
        ].join('');
    }

    const furnitureControlIds = ['furnitureWidth', 'furnitureDepth', 'furnitureHeight', 'doorClearWidth', 'doorClearHeight', 'furnitureClearance'];
    function updateFurnitureCalculator() {
        const width = positiveNumber('furnitureWidth');
        const depth = positiveNumber('furnitureDepth');
        const height = positiveNumber('furnitureHeight');
        const doorWidth = positiveNumber('doorClearWidth');
        const doorHeight = positiveNumber('doorClearHeight');
        const clearance = Math.max(0, Number(document.getElementById('furnitureClearance').value) || 0);
        const usableWidth = Math.max(0, doorWidth - clearance * 2);
        const usableHeight = Math.max(0, doorHeight - clearance * 2);
        const orientations = [
            ['ตั้งตรงด้านหน้า', width, height],
            ['ตั้งตรงด้านข้าง', depth, height],
            ['นอนชิ้นงาน', width, depth]
        ];
        const fitting = orientations.find(([, first, second]) =>
            (first <= usableWidth && second <= usableHeight) || (second <= usableWidth && first <= usableHeight));
        const smallestSide = Math.min(width, depth, height);
        const verdict = fitting ? 'มีแนวที่น่าจะผ่าน ✓' : 'ขนาดตรง ๆ ยังไม่ผ่าน ✕';
        document.getElementById('furnitureResults').innerHTML = [
            resultCard('ช่องใช้งานหลังเผื่อ', `${formatNumber(usableWidth)} × ${formatNumber(usableHeight)} ซม.`, `เผื่อรอบด้าน ${formatNumber(clearance)} ซม.`),
            resultCard('ด้านเล็กสุดของชิ้นงาน', `${formatNumber(smallestSide)} ซม.`),
            resultCard('ผลตรวจเบื้องต้น', verdict, fitting ? `ลองขนแบบ “${fitting[0]}”` : 'ลองถอดชิ้นส่วนหรือใช้ช่องเปิดที่ใหญ่กว่า', true)
        ].join('');
    }

    const tableControlIds = ['tableLength', 'tableWidth', 'seatWidth', 'tableEndSeats', 'tableClearance'];
    function updateTableCalculator() {
        const length = positiveNumber('tableLength');
        const width = positiveNumber('tableWidth');
        const seatWidth = positiveNumber('seatWidth');
        const endSeats = Number(document.getElementById('tableEndSeats').value);
        const clearance = Math.max(0, Number(document.getElementById('tableClearance').value) || 0);
        const eachLongSide = seatWidth ? Math.floor(length / seatWidth) : 0;
        const totalSeats = eachLongSide * 2 + endSeats;
        const footprintLength = length + clearance * 2;
        const footprintWidth = width + clearance * 2;
        document.getElementById('tableResults').innerHTML = [
            resultCard('ที่นั่งด้านยาว', `${formatNumber(eachLongSide)} คน/ด้าน`),
            resultCard('จำนวนที่นั่งรวม', `${formatNumber(totalSeats)} คน`, `รวมหัวโต๊ะ ${endSeats} คน`),
            resultCard('พื้นที่ใช้งานที่ควรมี', `${formatNumber(footprintLength)} × ${formatNumber(footprintWidth)} ซม.`, `รวมทางใช้งานรอบโต๊ะ ${formatNumber(clearance)} ซม.`, true)
        ].join('');
    }

    function listenToCalculator(ids, update) {
        ids.forEach(id => {
            const control = document.getElementById(id);
            control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input', update);
        });
        update();
    }
    listenToCalculator(ceilingControlIds, updateCeilingCalculator);
    listenToCalculator(spacingControlIds, updateSpacingCalculator);
    listenToCalculator(wallControlIds, updateWallCalculator);
    listenToCalculator(tileControlIds, updateTileCalculator);
    listenToCalculator(wallpaperControlIds, updateWallpaperCalculator);
    listenToCalculator(sheetControlIds, updateSheetCalculator);
    listenToCalculator(lightingControlIds, updateLightingCalculator);
    listenToCalculator(furnitureControlIds, updateFurnitureCalculator);
    listenToCalculator(tableControlIds, updateTableCalculator);

    updateScaleCalculator();
    updatePaperChecker();
})();
