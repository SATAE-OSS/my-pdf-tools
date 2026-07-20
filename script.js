// ==========================================
// ระบบสลับหน้าต่าง (Tabs)
// ==========================================
function openTab(tabId, btnElement) {
    // ซ่อนเนื้อหาทั้งหมด
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.style.display = 'none');
    
    // เอาสี active ออกจากทุกปุ่ม
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    
    // โชว์หน้าที่เลือก และใส่สี active ให้ปุ่มที่โดนกด
    document.getElementById(tabId).style.display = 'block';
    btnElement.classList.add('active');

    // Canvas ที่ซ่อนอยู่จะวัดความกว้างไม่ได้ จึงปรับขนาดหลังเปิดแท็บ
    if (tabId === 'sketchTab') {
        requestAnimationFrame(() => {
            resizeCanvas();
            restoreCanvasDraft();
        });
    }
}

// ==========================================
// ส่วนที่ 1: ระบบรวมรูปเป็น PDF
// ==========================================
const fileInput = document.getElementById('fileInput');
const gallery = document.getElementById('gallery');
const previewBtn = document.getElementById('previewBtn');
const downloadBtn = document.getElementById('downloadBtn');
const pdfPageSize = document.getElementById('pdfPageSize');
const pdfOrientation = document.getElementById('pdfOrientation');
const pdfMargin = document.getElementById('pdfMargin');
const pdfQuality = document.getElementById('pdfQuality');

function updatePageNumbers() {
    const cards = gallery.querySelectorAll('.img-card');
    cards.forEach((card, index) => {
        const badge = card.querySelector('.page-badge');
        if (badge) badge.innerText = `หน้า ${index + 1}`;
    });
}

new Sortable(gallery, {
    animation: 300,              // ปรับให้การขยับช้าลงอีกนิด ตาจะตามทันง่ายขึ้น
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',  // เพิ่ม Class ตอนกำลังลาก เพื่อให้เราตกแต่งรูปที่ลากได้
    delay: 150,                  // ต้องกดค้างนิดนึงก่อนลาก ป้องกันการลากโดยไม่ได้ตั้งใจ
    touchStartThreshold: 5,      // ช่วยให้เลื่อนหน้าจอได้เนียนขึ้น ไม่เผลอไปลากรูปบ่อยๆ
    onEnd: function () { 
        updatePageNumbers(); 
    }
});

fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const div = document.createElement('div');
            div.className = 'img-card';
            
            const badge = document.createElement('div');
            badge.className = 'page-badge';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '✕';
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = 'ลบรูปนี้';
            
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                div.remove();
                updatePageNumbers();
            });

            const rotateBtn = document.createElement('button');
            rotateBtn.innerHTML = '↻';
            rotateBtn.className = 'rotate-btn';
            rotateBtn.title = 'หมุนรูป 90 องศา';
            div.dataset.rotation = '0';
            rotateBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const rotation = (Number(div.dataset.rotation) + 90) % 360;
                div.dataset.rotation = String(rotation);
                img.style.transform = `rotate(${rotation}deg)`;
            });
            
            const img = document.createElement('img');
            img.src = event.target.result;
            
            div.appendChild(badge);
            div.appendChild(deleteBtn);
            div.appendChild(rotateBtn);
            div.appendChild(img);
            gallery.appendChild(div);
            
            updatePageNumbers();
        }
        reader.readAsDataURL(file);
    });
    fileInput.value = '';
});

function generatePDF() {
    const cards = gallery.querySelectorAll('.img-card');
    if(cards.length === 0) return null;
    
    const { jsPDF } = window.jspdf;
    const format = pdfPageSize.value;
    const orientation = pdfOrientation.value;
    const margin = Number(pdfMargin.value);
    const quality = Number(pdfQuality.value);
    const pdf = new jsPDF({ orientation, unit: 'mm', format, compress: true });
    
    cards.forEach((card, index) => {
        const img = card.querySelector('img');
        if(index > 0) pdf.addPage();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const rotation = Number(card.dataset.rotation || 0);
        const processedImage = prepareImageForPdf(img, rotation, quality);
        const rotated = rotation === 90 || rotation === 270;
        const sourceWidth = rotated ? img.naturalHeight : img.naturalWidth;
        const sourceHeight = rotated ? img.naturalWidth : img.naturalHeight;
        const ratio = sourceWidth / sourceHeight;
        const availableWidth = Math.max(1, pageWidth - margin * 2);
        const availableHeight = Math.max(1, pageHeight - margin * 2);
        
        let width = availableWidth;
        let height = availableWidth / ratio;
        if(height > availableHeight) { height = availableHeight; width = availableHeight * ratio; }
        
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;
        pdf.addImage(processedImage, 'JPEG', x, y, width, height, undefined, 'MEDIUM');
    });
    return pdf;
}

function prepareImageForPdf(image, rotation, quality) {
    const rotated = rotation === 90 || rotation === 270;
    const output = document.createElement('canvas');
    output.width = rotated ? image.naturalHeight : image.naturalWidth;
    output.height = rotated ? image.naturalWidth : image.naturalHeight;
    const outputContext = output.getContext('2d');
    outputContext.fillStyle = '#ffffff';
    outputContext.fillRect(0, 0, output.width, output.height);
    outputContext.translate(output.width / 2, output.height / 2);
    outputContext.rotate(rotation * Math.PI / 180);
    outputContext.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    return output.toDataURL('image/jpeg', quality);
}

previewBtn.addEventListener('click', function() {
    // เปิดหน้าต่างทันทีจากการคลิก เพื่อไม่ให้เบราว์เซอร์มือถือมองว่าเป็นป๊อปอัป
    const previewWindow = window.open('', '_blank');
    const pdf = generatePDF();
    if(!pdf) {
        if (previewWindow) previewWindow.close();
        alert('กรุณาอัปโหลดรูปภาพก่อนครับ!');
        return;
    }
    
    // สร้าง Blob แล้วเปิดในหน้าต่างใหม่ (วิธีนี้มือถือจะไม่บล็อกครับ)
    const blob = pdf.output('blob');
    const blobURL = URL.createObjectURL(blob);
    if (previewWindow) {
        previewWindow.location.href = blobURL;
    } else {
        alert('เบราว์เซอร์บล็อกหน้าพรีวิว กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้');
    }
    // ให้แท็บใหม่มีเวลาอ่าน Blob ก่อนคืนหน่วยความจำ
    window.setTimeout(() => URL.revokeObjectURL(blobURL), 60000);
});

downloadBtn.addEventListener('click', function() {
    const pdf = generatePDF();
    if(!pdf) { alert('กรุณาอัปโหลดรูปภาพก่อนครับ!'); return; }
    const fileNameInput = document.getElementById('fileName').value;
    const fileName = fileNameInput.trim() !== '' ? fileNameInput : 'document';
    pdf.save(fileName + '.pdf');
});

// ==========================================
// ส่วนที่ 2: ระบบแปลง PDF เป็นรูปภาพและเลือกบันทึกทีละหน้า
// ==========================================
const pdfInput = document.getElementById('pdfInput');
const pdfGallery = document.getElementById('pdfGallery');
const extractStatus = document.getElementById('extractStatus');

pdfInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    pdfGallery.innerHTML = '<p class="drawing-placeholder">⏳ กำลังแยกหน้า PDF...</p>';
    extractStatus.textContent = 'กำลังประมวลผล กรุณารอสักครู่';
    const sourceName = file.name.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]/g, '_') || 'PDF';

    const fileReader = new FileReader();
    fileReader.onload = async function() {
        try {
            const typedarray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            pdfGallery.innerHTML = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const imgUrl = canvas.toDataURL('image/jpeg');

            const div = document.createElement('div');
            div.className = 'img-card pdf-page-card';
            
            // ใส่เลขหน้าให้พรีวิวด้วย
            const badge = document.createElement('div');
            badge.className = 'page-badge';
            badge.innerText = `หน้า ${i}`;

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = `${sourceName} หน้า ${i}`;

            const dlBtn = document.createElement('a');
            dlBtn.href = imgUrl;
            dlBtn.download = `${sourceName}-หน้า-${i}.jpg`;
            dlBtn.innerHTML = '⬇️ บันทึกภาพหน้านี้';
            dlBtn.className = 'dl-img-btn';
            dlBtn.setAttribute('aria-label', `บันทึกภาพหน้า ${i}`);

            div.appendChild(badge);
            div.appendChild(img);
            div.appendChild(dlBtn);
                pdfGallery.appendChild(div);
            }
        
            extractStatus.textContent = `แยกเสร็จแล้ว ${pdf.numPages} หน้า · เลือกกดบันทึกใต้ภาพที่ต้องการ`;
        } catch (error) {
            console.error('ไม่สามารถอ่าน PDF ได้:', error);
            extractStatus.textContent = 'แยกไฟล์ไม่สำเร็จ';
            pdfGallery.innerHTML = '<p class="error-message" style="grid-column: 1 / -1; text-align: center;">❌ ไม่สามารถอ่าน PDF ได้ ไฟล์อาจเสีย มีรหัสผ่าน หรือไม่ใช่ PDF ที่รองรับ</p>';
        }
    };
    fileReader.onerror = function() {
        extractStatus.textContent = 'อ่านไฟล์ไม่สำเร็จ';
        pdfGallery.innerHTML = '<p class="error-message" style="grid-column: 1 / -1; text-align: center;">❌ เบราว์เซอร์ไม่สามารถอ่านไฟล์นี้ได้ กรุณาลองใหม่</p>';
    };
    fileReader.readAsArrayBuffer(file);
});
// ==========================================
// 1. ระบบโหมดทำงานกลางคืน (Dark Mode)
// ==========================================
const darkModeBtn = document.getElementById('darkModeBtn');

function applyTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    darkModeBtn.innerText = isDark ? '☀️' : '🌙';
    darkModeBtn.setAttribute('aria-label', isDark ? 'ปิดโหมดกลางคืน' : 'เปิดโหมดกลางคืน');
    darkModeBtn.setAttribute('aria-pressed', String(isDark));
}

const savedTheme = localStorage.getItem('pdf-magic-theme');
applyTheme(savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);

darkModeBtn.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-mode');
    applyTheme(isDark);
    localStorage.setItem('pdf-magic-theme', isDark ? 'dark' : 'light');
});

// ==========================================
// 2. ระบบบับเบิ้ลกันกระแทก พร้อมเสียง ASMR
// ==========================================
const bubbleGrid = document.getElementById('bubbleGrid');
const resetBubblesBtn = document.getElementById('resetBubblesBtn');

function createBubbles() {
    bubbleGrid.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const bubble = document.createElement('button');
        bubble.type = 'button';
        bubble.className = 'bubble';
        bubble.setAttribute('aria-label', `บับเบิ้ลลูกที่ ${i + 1}`);
        bubble.setAttribute('aria-pressed', 'false');
        bubble.addEventListener('click', () => {
            if (bubble.classList.contains('popped')) return;
            bubble.classList.add('popped');
            bubble.setAttribute('aria-pressed', 'true');
            playPopSound();
        });
        bubbleGrid.appendChild(bubble);
    }
}

// ใช้ AudioContext ตัวเดียวซ้ำ เพราะมือถือจำกัดจำนวน context ที่เปิดพร้อมกัน
let popAudioContext = null;
async function playPopSound() {
    if (!popAudioContext || popAudioContext.state === 'closed') {
        popAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (popAudioContext.state === 'suspended') {
        await popAudioContext.resume();
    }

    const osc = popAudioContext.createOscillator();
    const gain = popAudioContext.createGain();
    osc.connect(gain);
    gain.connect(popAudioContext.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, popAudioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, popAudioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.45, popAudioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, popAudioContext.currentTime + 0.1);
    
    osc.start();
    osc.stop(popAudioContext.currentTime + 0.1);
    osc.addEventListener('ended', () => {
        osc.disconnect();
        gain.disconnect();
    });
}
resetBubblesBtn.addEventListener('click', createBubbles);
// เรียกสร้างบับเบิ้ลครั้งแรกตอนเปิดเว็บ
window.addEventListener('load', createBubbles);

// ==========================================
// 3. ของเล่นสกุชชี่
// ==========================================
const squishyToy = document.getElementById('squishyToy');
const squishyHint = document.getElementById('squishyHint');
const resetSquishyBtn = document.getElementById('resetSquishyBtn');
const squishyColorButtons = document.querySelectorAll('[data-squishy-color]');
let squishyPointerId = null;
let squishyStartX = 0;
let squishyStartY = 0;
let squishyMoved = false;

function resetSquishy() {
    squishyPointerId = null;
    squishyToy.classList.remove('grabbing');
    squishyToy.style.removeProperty('--move-x');
    squishyToy.style.removeProperty('--move-y');
    squishyToy.style.removeProperty('--stretch-x');
    squishyToy.style.removeProperty('--stretch-y');
    squishyToy.style.removeProperty('--tilt');
    squishyToy.style.removeProperty('border-radius');
}

squishyToy.addEventListener('pointerdown', event => {
    if (squishyPointerId !== null) return;
    event.preventDefault();
    squishyPointerId = event.pointerId;
    squishyStartX = event.clientX;
    squishyStartY = event.clientY;
    squishyMoved = false;
    squishyToy.classList.add('grabbing');
    squishyToy.setPointerCapture(event.pointerId);
    if (navigator.vibrate) navigator.vibrate(6);
});

squishyToy.addEventListener('pointermove', event => {
    if (event.pointerId !== squishyPointerId) return;
    const deltaX = Math.max(-85, Math.min(85, event.clientX - squishyStartX));
    const deltaY = Math.max(-65, Math.min(65, event.clientY - squishyStartY));
    const distance = Math.hypot(deltaX, deltaY);
    squishyMoved ||= distance > 6;
    const stretch = Math.min(.34, distance / 260);
    squishyToy.style.setProperty('--move-x', `${deltaX * .38}px`);
    squishyToy.style.setProperty('--move-y', `${deltaY * .3}px`);
    squishyToy.style.setProperty('--stretch-x', String(1 + stretch));
    squishyToy.style.setProperty('--stretch-y', String(1 - stretch * .55));
    squishyToy.style.setProperty('--tilt', `${deltaX * .06}deg`);
    squishyToy.style.borderRadius = `${48 + deltaY * .08}% ${52 - deltaX * .05}% ${48 - deltaY * .08}% ${52 + deltaX * .05}%`;
});

function releaseSquishy(event) {
    if (event.pointerId !== squishyPointerId) return;
    squishyToy.classList.add('rebounding');
    resetSquishy();
    squishyHint.textContent = squishyMoved ? 'เด้งกลับแล้ว นุ่มนิ่มมาก ☁️' : 'ลองลากให้ยืดกว่านี้อีกนิด';
    window.setTimeout(() => squishyToy.classList.remove('rebounding'), 480);
}

squishyToy.addEventListener('pointerup', releaseSquishy);
squishyToy.addEventListener('pointercancel', releaseSquishy);
resetSquishyBtn.addEventListener('click', () => {
    resetSquishy();
    squishyHint.textContent = 'คืนรูปเรียบร้อย พร้อมบีบต่อ ✨';
});
squishyColorButtons.forEach(button => button.addEventListener('click', () => {
    squishyToy.dataset.color = button.dataset.squishyColor;
    squishyColorButtons.forEach(item => item.classList.toggle('active', item === button));
}));

// ==========================================
// 4. ระบบกระดานสเก็ตช์ภาพมินิ
// ==========================================
const canvas = document.getElementById('sketchCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearBtn = document.getElementById('clearCanvasBtn');
const brushToolBtn = document.getElementById('brushToolBtn');
const fillToolBtn = document.getElementById('fillToolBtn');
const eraserToolBtn = document.getElementById('eraserToolBtn');
const undoCanvasBtn = document.getElementById('undoCanvasBtn');
const redoCanvasBtn = document.getElementById('redoCanvasBtn');
const downloadCanvasBtn = document.getElementById('downloadCanvasBtn');
const brushSizeValue = document.getElementById('brushSizeValue');
const colorSwatches = document.querySelectorAll('.color-swatch');
const sizePresetButtons = document.querySelectorAll('.size-btn');
const extraToolButtons = document.querySelectorAll('[data-drawing-tool]');
const canvasRatio = document.getElementById('canvasRatio');
const canvasBackground = document.getElementById('canvasBackground');
const canvasZoom = document.getElementById('canvasZoom');
const canvasViewport = document.getElementById('canvasViewport');
const canvasZoomStage = document.getElementById('canvasZoomStage');
const brushCursor = document.getElementById('brushCursor');

let isDrawing = false;
let activePointerId = null;
let lastX = 0;
let lastY = 0;
let currentTool = 'brush';
let shapeStart = null;
let shapeSnapshot = null;
const CANVAS_DRAFT_KEY = 'pdf-magic-canvas-draft';
let draftRestored = false;
const undoHistory = [];
const redoHistory = [];
const MAX_HISTORY = 15;

function saveCanvasDraft() {
    if (!canvas.width || !canvas.height) return;
    try {
        localStorage.setItem(CANVAS_DRAFT_KEY, canvas.toDataURL('image/png'));
    } catch (error) {
        console.warn('บันทึกภาพร่างในเครื่องไม่สำเร็จ:', error);
    }
}

function restoreCanvasDraft() {
    if (draftRestored || !canvas.width || !canvas.height) return;
    const draft = localStorage.getItem(CANVAS_DRAFT_KEY);
    draftRestored = true;
    if (!draft) return;

    const image = new Image();
    image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = draft;
}

function updateHistoryButtons() {
    undoCanvasBtn.disabled = undoHistory.length === 0;
    redoCanvasBtn.disabled = redoHistory.length === 0;
}

function recordCanvasHistory() {
    undoHistory.push(canvas.toDataURL('image/png'));
    if (undoHistory.length > MAX_HISTORY) undoHistory.shift();
    redoHistory.length = 0;
    updateHistoryButtons();
}

function drawCanvasSnapshot(dataUrl) {
    return new Promise(resolve => {
        const image = new Image();
        image.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            saveCanvasDraft();
            resolve();
        };
        image.src = dataUrl;
    });
}

async function undoCanvas() {
    if (!undoHistory.length) return;
    redoHistory.push(canvas.toDataURL('image/png'));
    await drawCanvasSnapshot(undoHistory.pop());
    updateHistoryButtons();
}

async function redoCanvas() {
    if (!redoHistory.length) return;
    undoHistory.push(canvas.toDataURL('image/png'));
    await drawCanvasSnapshot(redoHistory.pop());
    updateHistoryButtons();
}

function selectDrawingTool(tool) {
    currentTool = tool;
    const usingBrush = tool === 'brush';
    const usingFill = tool === 'fill';
    const usingEraser = tool === 'eraser';
    brushToolBtn.classList.toggle('active', usingBrush);
    fillToolBtn.classList.toggle('active', usingFill);
    eraserToolBtn.classList.toggle('active', usingEraser);
    brushToolBtn.setAttribute('aria-pressed', String(usingBrush));
    fillToolBtn.setAttribute('aria-pressed', String(usingFill));
    eraserToolBtn.setAttribute('aria-pressed', String(usingEraser));
    extraToolButtons.forEach(button => {
        const selected = button.dataset.drawingTool === tool;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    brushSize.disabled = usingFill;
    sizePresetButtons.forEach(button => button.disabled = usingFill);
    canvas.classList.toggle('fill-mode', usingFill);
    canvas.classList.toggle('eraser-mode', usingEraser);
    if (!usingEraser) brushCursor.classList.remove('visible');
}

brushToolBtn.addEventListener('click', () => selectDrawingTool('brush'));
fillToolBtn.addEventListener('click', () => selectDrawingTool('fill'));
eraserToolBtn.addEventListener('click', () => selectDrawingTool('eraser'));
extraToolButtons.forEach(button => button.addEventListener('click', () => selectDrawingTool(button.dataset.drawingTool)));

function selectColor(color) {
    colorPicker.value = color;
    colorSwatches.forEach(swatch => {
        const selected = swatch.dataset.color === color;
        swatch.classList.toggle('active', selected);
        swatch.setAttribute('aria-pressed', String(selected));
    });
}

colorSwatches.forEach(swatch => swatch.addEventListener('click', () => selectColor(swatch.dataset.color)));
colorPicker.addEventListener('input', () => selectColor(colorPicker.value));

function selectBrushSize(size) {
    brushSize.value = size;
    brushSizeValue.value = size;
    sizePresetButtons.forEach(button => {
        const selected = button.dataset.size === String(size);
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
}

sizePresetButtons.forEach(button => button.addEventListener('click', () => selectBrushSize(button.dataset.size)));
brushSize.addEventListener('input', () => selectBrushSize(brushSize.value));
selectColor(colorPicker.value);
selectBrushSize(brushSize.value);

function getCanvasHeight(width) {
    const ratios = { '1:1': 1, '4:3': 3 / 4, '16:9': 9 / 16, a4: 1.414 };
    return canvasRatio.value === 'free' ? 400 : Math.round(width * ratios[canvasRatio.value]);
}

function updateCanvasZoom() {
    const zoom = Number(canvasZoom.value);
    canvasZoomStage.style.width = `${canvas.width * zoom}px`;
}

// ปรับขนาด Canvas ให้พอดีกับอุปกรณ์และอัตราส่วนที่เลือก
function resizeCanvas() {
    const newWidth = canvasViewport.clientWidth;
    const newHeight = getCanvasHeight(newWidth);
    if (!newWidth || (canvas.width === newWidth && canvas.height === newHeight)) {
        updateCanvasZoom();
        return;
    }

    // เก็บภาพเดิมไว้ เพราะการเปลี่ยน width/height จะล้าง Canvas อัตโนมัติ
    const snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext('2d').drawImage(canvas, 0, 0);

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height,
        0, 0, canvas.width, canvas.height);
    updateCanvasZoom();
}
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

function startDrawing(e) {
    e.preventDefault();
    if ((e.pointerType === 'mouse' && e.button !== 0) || activePointerId !== null) return;
    activePointerId = e.pointerId;
    if (e.pointerId !== undefined) canvas.setPointerCapture(e.pointerId);
    const pos = getPos(e);

    if (currentTool === 'text') {
        const text = window.prompt('พิมพ์ข้อความที่ต้องการใส่');
        if (!text) {
            activePointerId = null;
            return;
        }
        recordCanvasHistory();
        ctx.save();
        ctx.fillStyle = colorPicker.value;
        ctx.font = `${Math.max(16, Number(brushSize.value) * 3)}px Prompt, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(text.slice(0, 100), pos.x, pos.y);
        ctx.restore();
        saveCanvasDraft();
        activePointerId = null;
        return;
    }

    if (currentTool === 'fill') {
        recordCanvasHistory();
        floodFill(Math.floor(pos.x), Math.floor(pos.y), colorPicker.value);
        return;
    }

    recordCanvasHistory();
    isDrawing = true;
    lastX = pos.x;
    lastY = pos.y;

    if (['line', 'rect', 'ellipse'].includes(currentTool)) {
        shapeStart = pos;
        shapeSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.save();
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(1, Number(brushSize.value) / 2), 0, Math.PI * 2);
    ctx.fillStyle = colorPicker.value;
    ctx.fill();
    ctx.restore();
}

function draw(e) {
    if (!isDrawing || e.pointerId !== activePointerId) return;
    e.preventDefault(); // ป้องกันการเลื่อนจอตอนวาด
    const pos = getPos(e);

    if (['line', 'rect', 'ellipse'].includes(currentTool)) {
        ctx.putImageData(shapeSnapshot, 0, 0);
        ctx.save();
        ctx.strokeStyle = colorPicker.value;
        ctx.lineWidth = Number(brushSize.value);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (currentTool === 'line') {
            ctx.moveTo(shapeStart.x, shapeStart.y);
            ctx.lineTo(pos.x, pos.y);
        } else if (currentTool === 'rect') {
            ctx.rect(shapeStart.x, shapeStart.y, pos.x - shapeStart.x, pos.y - shapeStart.y);
        } else {
            const centerX = (shapeStart.x + pos.x) / 2;
            const centerY = (shapeStart.y + pos.y) / 2;
            ctx.ellipse(centerX, centerY, Math.abs(pos.x - shapeStart.x) / 2,
                Math.abs(pos.y - shapeStart.y) / 2, 0, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
        return;
    }
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = colorPicker.value;
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    const pressure = e.pointerType === 'pen' && e.pressure > 0 ? 0.55 + e.pressure : 1;
    ctx.lineWidth = Number(brushSize.value) * pressure;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing(e) {
    if (activePointerId === null || (e?.pointerId !== undefined && e.pointerId !== activePointerId)) return;
    if (isDrawing) saveCanvasDraft();
    isDrawing = false;
    activePointerId = null;
    shapeStart = null;
    shapeSnapshot = null;
    ctx.globalCompositeOperation = 'source-over';
}

// ดึงตำแหน่งเมาส์ หรือ นิ้วสัมผัส
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function updateBrushCursor(e) {
    if (currentTool !== 'eraser') return;
    const rect = canvas.getBoundingClientRect();
    const size = Number(brushSize.value) * (rect.width / canvas.width);
    brushCursor.style.width = `${size}px`;
    brushCursor.style.height = `${size}px`;
    brushCursor.style.left = `${e.clientX - rect.left}px`;
    brushCursor.style.top = `${e.clientY - rect.top}px`;
    brushCursor.classList.add('visible');
}

function hexToRgba(hex) {
    return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
        255
    ];
}

// เติมสีเฉพาะพื้นที่ที่เชื่อมถึงกัน (Flood Fill) เหมือนเครื่องมือถังสี
function floodFill(startX, startY, hexColor) {
    if (startX < 0 || startY < 0 || startX >= canvas.width || startY >= canvas.height) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const fillColor = hexToRgba(hexColor);
    const startIndex = (startY * canvas.width + startX) * 4;
    const targetColor = Array.from(pixels.slice(startIndex, startIndex + 4));
    const visited = new Uint8Array(canvas.width * canvas.height);

    if (targetColor.every((value, index) => value === fillColor[index])) return;

    // Canvas ทำขอบเส้นแบบ anti-alias จึงมีพิกเซลกึ่งโปร่งใสรอบเส้น
    // ยอมรับสีใกล้เคียงและวางสีไว้ "ใต้" ขอบโปร่งใส เพื่อไม่ให้เกิดขอบหยัก
    const matchesTarget = index => {
        const pixelNumber = index / 4;
        if (visited[pixelNumber]) return false;
        const alpha = pixels[index + 3];
        if (targetColor[3] < 16) return alpha < 245;
        const red = pixels[index] - targetColor[0];
        const green = pixels[index + 1] - targetColor[1];
        const blue = pixels[index + 2] - targetColor[2];
        const alphaDifference = alpha - targetColor[3];
        return red * red + green * green + blue * blue < 110 * 110 &&
            alphaDifference * alphaDifference < 80 * 80;
    };

    const paintPixel = index => {
        visited[index / 4] = 1;
        const originalAlpha = pixels[index + 3] / 255;
        if (targetColor[3] < 16 && originalAlpha > 0) {
            pixels[index] = Math.round(pixels[index] * originalAlpha + fillColor[0] * (1 - originalAlpha));
            pixels[index + 1] = Math.round(pixels[index + 1] * originalAlpha + fillColor[1] * (1 - originalAlpha));
            pixels[index + 2] = Math.round(pixels[index + 2] * originalAlpha + fillColor[2] * (1 - originalAlpha));
        } else {
            pixels[index] = fillColor[0];
            pixels[index + 1] = fillColor[1];
            pixels[index + 2] = fillColor[2];
        }
        pixels[index + 3] = 255;
    };
    const stack = [[startX, startY]];

    while (stack.length) {
        const [x, y] = stack.pop();
        let currentY = y;
        let index = (currentY * canvas.width + x) * 4;

        while (currentY >= 0 && matchesTarget(index)) {
            currentY--;
            index -= canvas.width * 4;
        }
        currentY++;

        let reachLeft = false;
        let reachRight = false;
        for (; currentY < canvas.height; currentY++) {
            index = (currentY * canvas.width + x) * 4;
            if (!matchesTarget(index)) break;

            paintPixel(index);

            if (x > 0) {
                const leftIndex = index - 4;
                if (matchesTarget(leftIndex) && !reachLeft) {
                    stack.push([x - 1, currentY]);
                    reachLeft = true;
                } else if (!matchesTarget(leftIndex)) {
                    reachLeft = false;
                }
            }

            if (x < canvas.width - 1) {
                const rightIndex = index + 4;
                if (matchesTarget(rightIndex) && !reachRight) {
                    stack.push([x + 1, currentY]);
                    reachRight = true;
                } else if (!matchesTarget(rightIndex)) {
                    reachRight = false;
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    saveCanvasDraft();
}

// Pointer Events ชุดเดียวรองรับเมาส์ นิ้ว ปากกา และ Apple Pencil
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', event => {
    updateBrushCursor(event);
    draw(event);
});
canvas.addEventListener('pointerdown', updateBrushCursor);
canvas.addEventListener('pointerup', event => {
    stopDrawing(event);
    if (event.pointerType === 'touch') brushCursor.classList.remove('visible');
});
canvas.addEventListener('pointercancel', stopDrawing);
canvas.addEventListener('lostpointercapture', stopDrawing);
canvas.addEventListener('pointerleave', () => {
    if (!isDrawing) brushCursor.classList.remove('visible');
});

clearBtn.addEventListener('click', async () => {
    if (!await confirmAction('ภาพบนกระดาษวาดจะถูกล้างทั้งหมด', 'ล้างภาพ')) return;
    recordCanvasHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCanvasDraft();
});

undoCanvasBtn.addEventListener('click', undoCanvas);
redoCanvasBtn.addEventListener('click', redoCanvas);

downloadCanvasBtn.addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportContext = exportCanvas.getContext('2d');
    if (canvasBackground.value === 'white') {
        exportContext.fillStyle = '#ffffff';
        exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    exportContext.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `sketch-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
});

canvasRatio.addEventListener('change', () => {
    recordCanvasHistory();
    resizeCanvas();
    saveCanvasDraft();
});
canvasZoom.addEventListener('change', updateCanvasZoom);
canvasBackground.addEventListener('change', () => {
    canvas.classList.toggle('transparent-canvas', canvasBackground.value === 'transparent');
    localStorage.setItem('pdf-magic-canvas-background', canvasBackground.value);
});

canvasBackground.value = localStorage.getItem('pdf-magic-canvas-background') || 'white';
canvas.classList.toggle('transparent-canvas', canvasBackground.value === 'transparent');

window.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redoCanvas() : undoCanvas();
    } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redoCanvas();
    }
});

const confirmDialog = document.getElementById('confirmDialog');
const confirmDialogMessage = document.getElementById('confirmDialogMessage');
const confirmDialogOk = document.getElementById('confirmDialogOk');
const confirmDialogCancel = document.getElementById('confirmDialogCancel');

function confirmAction(message, confirmLabel = 'ลบ') {
    return new Promise(resolve => {
        confirmDialogMessage.textContent = message;
        confirmDialogOk.textContent = confirmLabel;
        confirmDialog.showModal();

        const finish = result => {
            confirmDialog.close();
            confirmDialogOk.removeEventListener('click', approve);
            confirmDialogCancel.removeEventListener('click', cancel);
            confirmDialog.oncancel = null;
            resolve(result);
        };
        const approve = () => finish(true);
        const cancel = () => finish(false);
        confirmDialogOk.addEventListener('click', approve);
        confirmDialogCancel.addEventListener('click', cancel);
        confirmDialog.oncancel = event => {
            event.preventDefault();
            cancel();
        };
    });
}
