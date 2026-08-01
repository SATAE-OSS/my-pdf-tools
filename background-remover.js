(() => {
    'use strict';

    const AI_MODULE_URL = 'https://esm.sh/@imgly/background-removal@1.7.0?bundle&deps=onnxruntime-web@1.21.0-dev.20250206-d981b153d3';
    const input = document.getElementById('removeBgInput');
    const drop = document.getElementById('removeBgDrop');
    const workspace = document.getElementById('removeBgWorkspace');
    const originalCanvas = document.getElementById('removeBgOriginalCanvas');
    const resultCanvas = document.getElementById('removeBgResultCanvas');
    const resultWrap = document.getElementById('removeBgResultWrap');
    const canvasHint = document.getElementById('removeBgCanvasHint');
    const toleranceInput = document.getElementById('removeBgTolerance');
    const featherInput = document.getElementById('removeBgFeather');
    const toleranceValue = document.getElementById('removeBgToleranceValue');
    const featherValue = document.getElementById('removeBgFeatherValue');
    const brushInput = document.getElementById('removeBgBrushSize');
    const brushValue = document.getElementById('removeBgBrushValue');
    const zoomInput = document.getElementById('removeBgZoom');
    const zoomValue = document.getElementById('removeBgZoomValue');
    const fastModeButton = document.getElementById('removeBgFastModeBtn');
    const aiButton = document.getElementById('removeBgAiBtn');
    const autoButton = document.getElementById('removeBgAutoBtn');
    const resetButton = document.getElementById('removeBgResetBtn');
    const downloadButton = document.getElementById('removeBgDownloadBtn');
    const undoButton = document.getElementById('removeBgUndoBtn');
    const redoButton = document.getElementById('removeBgRedoBtn');
    const status = document.getElementById('removeBgStatus');
    if (!input || !resultCanvas) return;

    const originalContext = originalCanvas.getContext('2d', { willReadFrequently: true });
    const resultContext = resultCanvas.getContext('2d', { willReadFrequently: true });
    let sourcePixels = null;
    let resultPixels = null;
    let backgroundSamples = [];
    let manualSeed = null;
    let sourceName = 'removed-background';
    let processTimer = 0;
    let activeTool = 'pick';
    let painting = false;
    let lastPaintPoint = null;
    let undoHistory = [];
    let redoHistory = [];
    let aiModulePromise = null;
    let aiBusy = false;

    function setStatus(message, type = '') {
        status.textContent = message;
        status.className = `remove-bg-status ${type}`.trim();
    }

    function cloneImageData(imageData) {
        return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
    }

    function putResult(imageData) {
        resultPixels = imageData;
        resultContext.putImageData(resultPixels, 0, 0);
    }

    function captureAlpha() {
        if (!resultPixels) return null;
        const alpha = new Uint8ClampedArray(resultPixels.width * resultPixels.height);
        for (let pixel = 0, offset = 3; pixel < alpha.length; pixel += 1, offset += 4) alpha[pixel] = resultPixels.data[offset];
        return alpha;
    }

    function restoreAlpha(alpha) {
        if (!resultPixels || !alpha || alpha.length !== resultPixels.width * resultPixels.height) return;
        for (let pixel = 0, offset = 3; pixel < alpha.length; pixel += 1, offset += 4) resultPixels.data[offset] = alpha[pixel];
        resultContext.putImageData(resultPixels, 0, 0);
    }

    function updateHistoryButtons() {
        undoButton.disabled = undoHistory.length === 0;
        redoButton.disabled = redoHistory.length === 0;
    }

    function rememberForUndo() {
        const alpha = captureAlpha();
        if (!alpha) return;
        undoHistory.push(alpha);
        if (undoHistory.length > 7) undoHistory.shift();
        redoHistory = [];
        updateHistoryButtons();
    }

    function averagePatch(data, width, height, centerX, centerY, radius = 4) {
        let red = 0, green = 0, blue = 0, count = 0;
        for (let y = Math.max(0, centerY - radius); y <= Math.min(height - 1, centerY + radius); y += 1) {
            for (let x = Math.max(0, centerX - radius); x <= Math.min(width - 1, centerX + radius); x += 1) {
                const offset = (y * width + x) * 4;
                if (data[offset + 3] === 0) continue;
                red += data[offset];
                green += data[offset + 1];
                blue += data[offset + 2];
                count += 1;
            }
        }
        return count ? [red / count, green / count, blue / count] : [255, 255, 255];
    }

    function setAutomaticSamples() {
        if (!sourcePixels) return;
        const { data, width, height } = sourcePixels;
        backgroundSamples = [
            averagePatch(data, width, height, 3, 3),
            averagePatch(data, width, height, width - 4, 3),
            averagePatch(data, width, height, 3, height - 4),
            averagePatch(data, width, height, width - 4, height - 4)
        ];
        manualSeed = null;
    }

    function distanceFromBackground(data, offset) {
        let closest = Infinity;
        for (const sample of backgroundSamples) {
            const red = data[offset] - sample[0];
            const green = data[offset + 1] - sample[1];
            const blue = data[offset + 2] - sample[2];
            const distance = Math.sqrt(red * red * .3 + green * green * .59 + blue * blue * .11);
            if (distance < closest) closest = distance;
        }
        return closest;
    }

    function setMode(mode) {
        fastModeButton.classList.toggle('active', mode === 'fast');
        aiButton.classList.toggle('active', mode === 'ai');
    }

    function removeFastBackground({ record = true } = {}) {
        if (!sourcePixels || aiBusy) return;
        if (record && resultPixels) rememberForUndo();
        const width = sourcePixels.width;
        const height = sourcePixels.height;
        const output = cloneImageData(sourcePixels);
        const data = output.data;
        const tolerance = Number(toleranceInput.value);
        const feather = Number(featherInput.value);
        const limit = tolerance + feather;
        const visited = new Uint8Array(width * height);
        const queue = new Int32Array(width * height);
        let head = 0;
        let tail = 0;

        const enqueue = pixelIndex => {
            if (pixelIndex < 0 || pixelIndex >= visited.length || visited[pixelIndex]) return;
            const offset = pixelIndex * 4;
            if (data[offset + 3] === 0 || distanceFromBackground(data, offset) > limit) return;
            visited[pixelIndex] = 1;
            queue[tail++] = pixelIndex;
        };

        for (let x = 0; x < width; x += 1) {
            enqueue(x);
            enqueue((height - 1) * width + x);
        }
        for (let y = 1; y < height - 1; y += 1) {
            enqueue(y * width);
            enqueue(y * width + width - 1);
        }
        if (manualSeed) enqueue(manualSeed.y * width + manualSeed.x);

        while (head < tail) {
            const pixelIndex = queue[head++];
            const offset = pixelIndex * 4;
            const distance = distanceFromBackground(data, offset);
            const originalAlpha = data[offset + 3];
            data[offset + 3] = distance <= tolerance || feather === 0
                ? 0
                : Math.min(originalAlpha, Math.round(originalAlpha * (distance - tolerance) / feather));
            const x = pixelIndex % width;
            if (x > 0) enqueue(pixelIndex - 1);
            if (x < width - 1) enqueue(pixelIndex + 1);
            if (pixelIndex >= width) enqueue(pixelIndex - width);
            if (pixelIndex < width * (height - 1)) enqueue(pixelIndex + width);
        }

        putResult(output);
        setMode('fast');
        setStatus(manualSeed
            ? 'เลือกสีจากจุดที่แตะแล้ว หากยังเหลือพื้นหลังให้ปรับ “ลบมากขึ้น”'
            : 'ลบพื้นหลังแบบเร็วแล้ว ใช้แปรงลบเพิ่มหรือคืนส่วนที่หายได้', 'success');
    }

    function scheduleFastProcess() {
        toleranceValue.textContent = toleranceInput.value;
        featherValue.textContent = featherInput.value;
        clearTimeout(processTimer);
        setStatus('กำลังปรับขอบภาพ…');
        processTimer = window.setTimeout(() => requestAnimationFrame(() => removeFastBackground({ record: false })), 120);
    }

    function canvasToBlob(canvas) {
        return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('สร้างข้อมูลภาพไม่สำเร็จ')), 'image/png', 1));
    }

    function drawBlobToResult(blob) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const image = new Image();
            image.onload = () => {
                resultContext.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
                resultContext.drawImage(image, 0, 0, resultCanvas.width, resultCanvas.height);
                resultPixels = resultContext.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
                URL.revokeObjectURL(url);
                resolve();
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('อ่านผลลัพธ์ AI ไม่สำเร็จ'));
            };
            image.src = url;
        });
    }

    async function runAiRemoval() {
        if (!sourcePixels || aiBusy) return;
        aiBusy = true;
        aiButton.disabled = true;
        const originalButtonHtml = aiButton.innerHTML;
        aiButton.innerHTML = '<span>⏳</span><strong>กำลังเตรียม AI…</strong><small>อย่าปิดหน้านี้</small>';
        setStatus('ครั้งแรกกำลังดาวน์โหลด AI ประมาณ 40 MB หลังจากนี้เบราว์เซอร์จะจำไว้');
        try {
            aiModulePromise ||= import(AI_MODULE_URL);
            const module = await aiModulePromise;
            const removeBackground = module.default;
            if (typeof removeBackground !== 'function') throw new Error('โหลดตัวประมวลผล AI ไม่สำเร็จ');
            const imageBlob = await canvasToBlob(originalCanvas);
            const progress = (key, current, total) => {
                if (!total) return;
                const percent = Math.min(99, Math.round(current / total * 100));
                aiButton.innerHTML = `<span>⏳</span><strong>AI กำลังทำงาน ${percent}%</strong><small>กำลังโหลดและวิเคราะห์ภาพ</small>`;
                setStatus(`AI กำลังเตรียมโมเดลและวิเคราะห์ภาพ ${percent}%`);
            };
            const config = {
                model: 'isnet_quint8',
                device: navigator.gpu ? 'gpu' : 'cpu',
                progress,
                output: { format: 'image/png', quality: 1, type: 'foreground' }
            };
            let outputBlob;
            try {
                outputBlob = await removeBackground(imageBlob, config);
            } catch (error) {
                if (config.device !== 'gpu') throw error;
                setStatus('อุปกรณ์นี้ใช้ AI ผ่าน GPU ไม่ได้ กำลังลองโหมดรองรับมือถือ…');
                outputBlob = await removeBackground(imageBlob, { ...config, device: 'cpu' });
            }
            rememberForUndo();
            await drawBlobToResult(outputBlob);
            manualSeed = null;
            setMode('ai');
            setTool('erase');
            setStatus('AI ลบพื้นหลังแล้ว ลองใช้ “ลบเพิ่ม” หรือ “คืนส่วนที่หาย” เก็บรายละเอียดต่อได้', 'success');
        } catch (error) {
            console.error('Background removal AI failed', error);
            aiModulePromise = null;
            setStatus('AI เปิดไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่ หรือใช้ “ลบแบบเร็ว” แทนได้', 'error');
        } finally {
            aiBusy = false;
            aiButton.disabled = false;
            aiButton.innerHTML = originalButtonHtml;
        }
    }

    function resultPoint(event) {
        const bounds = resultCanvas.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(resultCanvas.width - 1, (event.clientX - bounds.left) * resultCanvas.width / bounds.width)),
            y: Math.max(0, Math.min(resultCanvas.height - 1, (event.clientY - bounds.top) * resultCanvas.height / bounds.height)),
            scale: resultCanvas.width / bounds.width
        };
    }

    function paintDot(point, radius) {
        const minX = Math.max(0, Math.floor(point.x - radius));
        const maxX = Math.min(resultPixels.width - 1, Math.ceil(point.x + radius));
        const minY = Math.max(0, Math.floor(point.y - radius));
        const maxY = Math.min(resultPixels.height - 1, Math.ceil(point.y + radius));
        const softStart = radius * .68;
        for (let y = minY; y <= maxY; y += 1) {
            for (let x = minX; x <= maxX; x += 1) {
                const distance = Math.hypot(x - point.x, y - point.y);
                if (distance > radius) continue;
                const strength = distance <= softStart ? 1 : (radius - distance) / Math.max(1, radius - softStart);
                const offset = (y * resultPixels.width + x) * 4;
                if (activeTool === 'erase') {
                    resultPixels.data[offset + 3] = Math.round(resultPixels.data[offset + 3] * (1 - strength));
                } else {
                    const sourceAlpha = sourcePixels.data[offset + 3];
                    resultPixels.data[offset] = sourcePixels.data[offset];
                    resultPixels.data[offset + 1] = sourcePixels.data[offset + 1];
                    resultPixels.data[offset + 2] = sourcePixels.data[offset + 2];
                    resultPixels.data[offset + 3] = Math.round(resultPixels.data[offset + 3] + (sourceAlpha - resultPixels.data[offset + 3]) * strength);
                }
            }
        }
        return { minX, minY, maxX, maxY };
    }

    function paintLine(from, to) {
        if (!resultPixels) return;
        const radius = Math.max(2, Number(brushInput.value) * to.scale / 2);
        const length = Math.hypot(to.x - from.x, to.y - from.y);
        const steps = Math.max(1, Math.ceil(length / Math.max(1, radius * .28)));
        let dirty = { minX: resultPixels.width, minY: resultPixels.height, maxX: 0, maxY: 0 };
        for (let step = 0; step <= steps; step += 1) {
            const ratio = step / steps;
            const bounds = paintDot({ x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio }, radius);
            dirty.minX = Math.min(dirty.minX, bounds.minX);
            dirty.minY = Math.min(dirty.minY, bounds.minY);
            dirty.maxX = Math.max(dirty.maxX, bounds.maxX);
            dirty.maxY = Math.max(dirty.maxY, bounds.maxY);
        }
        resultContext.putImageData(resultPixels, 0, 0, dirty.minX, dirty.minY, dirty.maxX - dirty.minX + 1, dirty.maxY - dirty.minY + 1);
    }

    function setTool(tool) {
        activeTool = tool;
        document.querySelectorAll('[data-remove-bg-tool]').forEach(button => button.classList.toggle('active', button.dataset.removeBgTool === tool));
        const brushing = tool === 'erase' || tool === 'restore';
        resultCanvas.classList.toggle('brush-active', brushing);
        canvasHint.textContent = tool === 'pick' ? 'แตะพื้นหลังเพื่อเลือกสีใหม่' : tool === 'erase' ? 'ลากเพื่อลบส่วนเกิน' : 'ลากเพื่อคืนส่วนที่หาย';
    }

    function updateZoom() {
        zoomValue.textContent = `${zoomInput.value}%`;
        const availableWidth = Math.max(120, resultWrap.clientWidth - 28);
        const naturalFit = Math.min(resultCanvas.width, availableWidth);
        resultCanvas.style.width = `${naturalFit * Number(zoomInput.value) / 100}px`;
        resultCanvas.style.maxWidth = 'none';
        resultCanvas.style.maxHeight = Number(zoomInput.value) > 100 ? 'none' : '520px';
    }

    function loadImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            setStatus('กรุณาเลือกไฟล์ภาพ JPG, PNG หรือ WEBP', 'error');
            return;
        }
        sourceName = file.name.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '_') || 'removed-background';
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        setStatus('กำลังอ่านภาพ…');
        image.onload = () => {
            const maxDimension = 2000;
            const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
            const width = Math.max(1, Math.round(image.naturalWidth * scale));
            const height = Math.max(1, Math.round(image.naturalHeight * scale));
            originalCanvas.width = resultCanvas.width = width;
            originalCanvas.height = resultCanvas.height = height;
            originalContext.clearRect(0, 0, width, height);
            originalContext.drawImage(image, 0, 0, width, height);
            sourcePixels = originalContext.getImageData(0, 0, width, height);
            resultPixels = cloneImageData(sourcePixels);
            undoHistory = [];
            redoHistory = [];
            updateHistoryButtons();
            setAutomaticSamples();
            workspace.hidden = false;
            setTool('pick');
            removeFastBackground({ record: false });
            requestAnimationFrame(updateZoom);
            URL.revokeObjectURL(objectUrl);
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            setStatus('เปิดภาพนี้ไม่สำเร็จ ลองใช้ไฟล์ JPG หรือ PNG', 'error');
        };
        image.src = objectUrl;
    }

    input.addEventListener('change', () => {
        loadImage(input.files?.[0]);
        input.value = '';
    });
    ['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, event => {
        event.preventDefault();
        drop.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach(type => drop.addEventListener(type, event => {
        event.preventDefault();
        drop.classList.remove('dragging');
    }));
    drop.addEventListener('drop', event => loadImage(event.dataTransfer?.files?.[0]));
    toleranceInput.addEventListener('input', scheduleFastProcess);
    featherInput.addEventListener('input', scheduleFastProcess);
    brushInput.addEventListener('input', () => { brushValue.textContent = brushInput.value; });
    zoomInput.addEventListener('input', updateZoom);
    fastModeButton.addEventListener('click', () => {
        setAutomaticSamples();
        removeFastBackground();
    });
    aiButton.addEventListener('click', runAiRemoval);
    autoButton.addEventListener('click', () => {
        setAutomaticSamples();
        toleranceInput.value = '42';
        featherInput.value = '20';
        toleranceValue.textContent = toleranceInput.value;
        featherValue.textContent = featherInput.value;
        removeFastBackground();
    });
    resetButton.addEventListener('click', () => {
        if (!sourcePixels || aiBusy) return;
        rememberForUndo();
        putResult(cloneImageData(sourcePixels));
        manualSeed = null;
        setStatus('คืนภาพเดิมแล้ว เลือกวิธีลบพื้นหลังเพื่อเริ่มใหม่');
    });
    document.querySelectorAll('[data-remove-bg-tool]').forEach(button => button.addEventListener('click', () => setTool(button.dataset.removeBgTool)));
    document.querySelectorAll('[data-remove-bg-preview]').forEach(button => button.addEventListener('click', () => {
        const preview = button.dataset.removeBgPreview;
        resultWrap.classList.toggle('checkerboard', preview === 'checker');
        resultWrap.classList.toggle('preview-white', preview === 'white');
        resultWrap.classList.toggle('preview-dark', preview === 'dark');
        document.querySelectorAll('[data-remove-bg-preview]').forEach(entry => entry.classList.toggle('active', entry === button));
    }));

    resultCanvas.addEventListener('pointerdown', event => {
        if (!sourcePixels || aiBusy) return;
        event.preventDefault();
        const point = resultPoint(event);
        if (activeTool === 'pick') {
            backgroundSamples = [averagePatch(sourcePixels.data, sourcePixels.width, sourcePixels.height, Math.round(point.x), Math.round(point.y), 5)];
            manualSeed = { x: Math.round(point.x), y: Math.round(point.y) };
            removeFastBackground();
            return;
        }
        rememberForUndo();
        painting = true;
        lastPaintPoint = point;
        resultCanvas.setPointerCapture(event.pointerId);
        paintLine(point, point);
    });
    resultCanvas.addEventListener('pointermove', event => {
        if (!painting || !resultCanvas.hasPointerCapture(event.pointerId)) return;
        event.preventDefault();
        const point = resultPoint(event);
        paintLine(lastPaintPoint, point);
        lastPaintPoint = point;
    });
    const finishPainting = event => {
        if (!painting) return;
        painting = false;
        lastPaintPoint = null;
        if (resultCanvas.hasPointerCapture(event.pointerId)) resultCanvas.releasePointerCapture(event.pointerId);
        setStatus(activeTool === 'erase' ? 'ลบส่วนเกินด้วยแปรงแล้ว' : 'คืนส่วนที่หายด้วยแปรงแล้ว', 'success');
    };
    resultCanvas.addEventListener('pointerup', finishPainting);
    resultCanvas.addEventListener('pointercancel', finishPainting);

    undoButton.addEventListener('click', () => {
        const previous = undoHistory.pop();
        if (!previous) return;
        const current = captureAlpha();
        if (current) redoHistory.push(current);
        restoreAlpha(previous);
        updateHistoryButtons();
        setStatus('ย้อนกลับหนึ่งขั้นแล้ว');
    });
    redoButton.addEventListener('click', () => {
        const next = redoHistory.pop();
        if (!next) return;
        const current = captureAlpha();
        if (current) undoHistory.push(current);
        restoreAlpha(next);
        updateHistoryButtons();
        setStatus('ทำซ้ำหนึ่งขั้นแล้ว');
    });
    downloadButton.addEventListener('click', () => {
        if (!sourcePixels) return;
        window.janeDownload.saveDataUrl(resultCanvas.toDataURL('image/png'), `${sourceName}-no-bg.png`, {
            title: `${sourceName} ไม่มีพื้นหลัง`
        });
        setStatus(window.janeDownload.isAppleTouchDevice
            ? 'เลือก “บันทึกรูปภาพ” หรือ “บันทึกไปยังไฟล์” ได้เลย'
            : 'บันทึกภาพ PNG พื้นหลังโปร่งใสแล้ว', 'success');
    });
})();
