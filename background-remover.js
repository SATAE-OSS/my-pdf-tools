(() => {
    'use strict';

    const input = document.getElementById('removeBgInput');
    const drop = document.getElementById('removeBgDrop');
    const workspace = document.getElementById('removeBgWorkspace');
    const originalCanvas = document.getElementById('removeBgOriginalCanvas');
    const resultCanvas = document.getElementById('removeBgResultCanvas');
    const toleranceInput = document.getElementById('removeBgTolerance');
    const featherInput = document.getElementById('removeBgFeather');
    const toleranceValue = document.getElementById('removeBgToleranceValue');
    const featherValue = document.getElementById('removeBgFeatherValue');
    const autoButton = document.getElementById('removeBgAutoBtn');
    const resetButton = document.getElementById('removeBgResetBtn');
    const downloadButton = document.getElementById('removeBgDownloadBtn');
    const status = document.getElementById('removeBgStatus');
    if (!input || !resultCanvas) return;

    const originalContext = originalCanvas.getContext('2d', { willReadFrequently: true });
    const resultContext = resultCanvas.getContext('2d');
    let sourcePixels = null;
    let backgroundSamples = [];
    let manualSeed = null;
    let sourceName = 'removed-background';
    let processTimer = 0;

    function setStatus(message, type = '') {
        status.textContent = message;
        status.className = `remove-bg-status ${type}`.trim();
    }

    function averagePatch(data, width, height, centerX, centerY, radius = 4) {
        let red = 0, green = 0, blue = 0, count = 0;
        for (let y = Math.max(0, centerY - radius); y <= Math.min(height - 1, centerY + radius); y += 1) {
            for (let x = Math.max(0, centerX - radius); x <= Math.min(width - 1, centerX + radius); x += 1) {
                const offset = (y * width + x) * 4;
                if (data[offset + 3] === 0) continue;
                red += data[offset]; green += data[offset + 1]; blue += data[offset + 2]; count += 1;
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

    function removeBackground() {
        if (!sourcePixels) return;
        const width = sourcePixels.width;
        const height = sourcePixels.height;
        const output = new ImageData(new Uint8ClampedArray(sourcePixels.data), width, height);
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

        resultContext.putImageData(output, 0, 0);
        setStatus(manualSeed
            ? 'ใช้สีจากจุดที่แตะแล้ว ลองปรับ “ลบมากขึ้น” หากยังเหลือพื้นหลัง'
            : 'ลบพื้นหลังอัตโนมัติแล้ว แตะพื้นหลังในภาพขวาได้หากระบบเลือกสีผิด', 'success');
    }

    function scheduleProcess() {
        toleranceValue.textContent = toleranceInput.value;
        featherValue.textContent = featherInput.value;
        clearTimeout(processTimer);
        setStatus('กำลังปรับขอบภาพ…');
        processTimer = window.setTimeout(() => requestAnimationFrame(removeBackground), 120);
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
            setAutomaticSamples();
            workspace.hidden = false;
            removeBackground();
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
        event.preventDefault(); drop.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach(type => drop.addEventListener(type, event => {
        event.preventDefault(); drop.classList.remove('dragging');
    }));
    drop.addEventListener('drop', event => loadImage(event.dataTransfer?.files?.[0]));
    toleranceInput.addEventListener('input', scheduleProcess);
    featherInput.addEventListener('input', scheduleProcess);
    autoButton.addEventListener('click', () => {
        setAutomaticSamples();
        toleranceInput.value = '42';
        featherInput.value = '20';
        scheduleProcess();
    });
    resetButton.addEventListener('click', () => {
        if (!sourcePixels) return;
        resultContext.putImageData(sourcePixels, 0, 0);
        manualSeed = null;
        setStatus('คืนภาพเดิมแล้ว กด “ลบอัตโนมัติ” เพื่อเริ่มใหม่');
    });
    resultCanvas.addEventListener('pointerup', event => {
        if (!sourcePixels) return;
        const bounds = resultCanvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(sourcePixels.width - 1, Math.floor((event.clientX - bounds.left) * sourcePixels.width / bounds.width)));
        const y = Math.max(0, Math.min(sourcePixels.height - 1, Math.floor((event.clientY - bounds.top) * sourcePixels.height / bounds.height)));
        backgroundSamples = [averagePatch(sourcePixels.data, sourcePixels.width, sourcePixels.height, x, y, 5)];
        manualSeed = { x, y };
        removeBackground();
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
