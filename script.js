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
            
            const img = document.createElement('img');
            img.src = event.target.result;
            
            div.appendChild(badge);
            div.appendChild(deleteBtn);
            div.appendChild(img);
            gallery.appendChild(div);
            
            updatePageNumbers();
        }
        reader.readAsDataURL(file);
    });
    fileInput.value = '';
});

function generatePDF() {
    const images = gallery.querySelectorAll('img');
    if(images.length === 0) return null;
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    images.forEach((img, index) => {
        if(index > 0) pdf.addPage();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = img.naturalWidth / img.naturalHeight;
        
        let width = pageWidth;
        let height = pageWidth / ratio;
        if(height > pageHeight) { height = pageHeight; width = pageHeight * ratio; }
        
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;
        pdf.addImage(img.src, 'JPEG', x, y, width, height);
    });
    return pdf;
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
// ส่วนที่ 2: ระบบแปลง PDF เป็นรูปภาพ (แบบมีปุ่ม ZIP)
// ==========================================
const pdfInput = document.getElementById('pdfInput');
const pdfGallery = document.getElementById('pdfGallery');
const downloadZipBtn = document.getElementById('downloadZipBtn');

// สร้างตัวแปรเก็บข้อมูลภาพไว้สำหรับทำ ZIP
let extractedImages = []; 

pdfInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    pdfGallery.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">⏳ กำลังประมวลผล แยกหน้า PDF...</p>';
    downloadZipBtn.style.display = 'none'; // ซ่อนปุ่ม ZIP ระหว่างโหลด
    extractedImages = []; // เคลียร์ภาพเก่า

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

            // เก็บภาพลง Array ไว้เตรียมทำ ZIP
            extractedImages.push({
                name: `page_${i}.jpg`,
                data: imgUrl.split(',')[1] // เก็บเฉพาะข้อมูล base64 ไม่เอาส่วน header
            });

            const div = document.createElement('div');
            div.className = 'img-card';
            
            // ใส่เลขหน้าให้พรีวิวด้วย
            const badge = document.createElement('div');
            badge.className = 'page-badge';
            badge.innerText = `หน้า ${i}`;

            const img = document.createElement('img');
            img.src = imgUrl;

            const dlBtn = document.createElement('a');
            dlBtn.href = imgUrl;
            dlBtn.download = `page_${i}.jpg`;
            dlBtn.innerHTML = `⬇️ โหลดหน้าที่ ${i}`;
            dlBtn.className = 'dl-img-btn';

            div.appendChild(badge);
            div.appendChild(img);
            div.appendChild(dlBtn);
                pdfGallery.appendChild(div);
            }
        
            // เมื่อดึงภาพครบทุกหน้าแล้ว ให้แสดงปุ่มดาวน์โหลด ZIP
            if(extractedImages.length > 0) {
                downloadZipBtn.style.display = 'block';
            }
        } catch (error) {
            console.error('ไม่สามารถอ่าน PDF ได้:', error);
            extractedImages = [];
            downloadZipBtn.style.display = 'none';
            pdfGallery.innerHTML = '<p class="error-message" style="grid-column: 1 / -1; text-align: center;">❌ ไม่สามารถอ่าน PDF ได้ ไฟล์อาจเสีย มีรหัสผ่าน หรือไม่ใช่ PDF ที่รองรับ</p>';
        }
    };
    fileReader.onerror = function() {
        pdfGallery.innerHTML = '<p class="error-message" style="grid-column: 1 / -1; text-align: center;">❌ เบราว์เซอร์ไม่สามารถอ่านไฟล์นี้ได้ กรุณาลองใหม่</p>';
    };
    fileReader.readAsArrayBuffer(file);
});

// ฟังก์ชันเมื่อกดปุ่มดาวน์โหลด ZIP
downloadZipBtn.addEventListener('click', function() {
    if(extractedImages.length === 0) return;
    
    downloadZipBtn.innerText = "⏳ กำลังสร้างไฟล์ ZIP...";
    const zip = new JSZip();
    
    // เอาภาพทั้งหมดที่เก็บไว้ ยัดลงไฟล์ ZIP
    extractedImages.forEach(img => {
        zip.file(img.name, img.data, {base64: true});
    });
    
    // สั่งดาวน์โหลด
    zip.generateAsync({type:"blob"}).then(function(content) {
        const link = document.createElement('a');
        const zipURL = URL.createObjectURL(content);
        link.href = zipURL;
        link.download = "extracted_images.zip";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(zipURL), 1000);
        
        downloadZipBtn.innerText = "📦 ดาวน์โหลดรูปทั้งหมด (.ZIP)";
    });
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
function createBubbles() {
    const grid = document.getElementById('bubbleGrid');
    grid.innerHTML = '';
    // สร้างบับเบิ้ล 20 ลูก
    for (let i = 0; i < 20; i++) {
        let bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.onclick = function() {
            if (!this.classList.contains('popped')) {
                this.classList.add('popped');
                playPopSound(); // เรียกเสียงตอนกด
            }
        };
        grid.appendChild(bubble);
    }
}

// สร้างเสียง "ป๊อป" ด้วย Web Audio API (ไม่ต้องโหลดไฟล์เสียงเพิ่ม)
function playPopSound() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}
// เรียกสร้างบับเบิ้ลครั้งแรกตอนเปิดเว็บ
window.addEventListener('load', createBubbles);

// ==========================================
// 3. ระบบกระดานสเก็ตช์ภาพมินิ
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

let isDrawing = false;
let activePointerId = null;
let lastX = 0;
let lastY = 0;
let currentTool = 'brush';
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
    brushSize.disabled = usingFill;
    sizePresetButtons.forEach(button => button.disabled = usingFill);
    canvas.classList.toggle('fill-mode', usingFill);
    canvas.classList.toggle('eraser-mode', usingEraser);
}

brushToolBtn.addEventListener('click', () => selectDrawingTool('brush'));
fillToolBtn.addEventListener('click', () => selectDrawingTool('fill'));
eraserToolBtn.addEventListener('click', () => selectDrawingTool('eraser'));

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

// ปรับขนาด Canvas ให้พอดีมือถือ
function resizeCanvas() {
    const newWidth = canvas.parentElement.clientWidth;
    if (!newWidth || (canvas.width === newWidth && canvas.height === 400)) return;

    // เก็บภาพเดิมไว้ เพราะการเปลี่ยน width/height จะล้าง Canvas อัตโนมัติ
    const snapshot = document.createElement('canvas');
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext('2d').drawImage(canvas, 0, 0);

    canvas.width = newWidth;
    canvas.height = 400;
    ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height,
        0, 0, canvas.width, canvas.height);
}
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

function startDrawing(e) {
    e.preventDefault();
    if ((e.pointerType === 'mouse' && e.button !== 0) || activePointerId !== null) return;
    activePointerId = e.pointerId;
    if (e.pointerId !== undefined) canvas.setPointerCapture(e.pointerId);
    const pos = getPos(e);

    if (currentTool === 'fill') {
        recordCanvasHistory();
        floodFill(Math.floor(pos.x), Math.floor(pos.y), colorPicker.value);
        return;
    }

    recordCanvasHistory();
    isDrawing = true;
    lastX = pos.x;
    lastY = pos.y;

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

    if (targetColor.every((value, index) => value === fillColor[index])) return;

    const matchesTarget = index =>
        pixels[index] === targetColor[0] && pixels[index + 1] === targetColor[1] &&
        pixels[index + 2] === targetColor[2] && pixels[index + 3] === targetColor[3];
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

            pixels[index] = fillColor[0];
            pixels[index + 1] = fillColor[1];
            pixels[index + 2] = fillColor[2];
            pixels[index + 3] = fillColor[3];

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
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);
canvas.addEventListener('lostpointercapture', stopDrawing);

clearBtn.addEventListener('click', () => {
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
    exportContext.fillStyle = '#ffffff';
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportContext.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `sketch-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
});

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
