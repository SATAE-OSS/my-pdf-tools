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
    if (tabId === 'sketchTab') requestAnimationFrame(resizeCanvas);
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
darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        darkModeBtn.innerText = '☀️';
    } else {
        darkModeBtn.innerText = '🌙';
    }
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

let isDrawing = false;
let lastX = 0;
let lastY = 0;

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
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault(); // ป้องกันการเลื่อนจอตอนวาด
    const pos = getPos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing() { isDrawing = false; }

// ดึงตำแหน่งเมาส์ หรือ นิ้วสัมผัส
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// รองรับทั้งเมาส์และนิ้วทัชสกรีน
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing, {passive: false});
canvas.addEventListener('touchmove', draw, {passive: false});
canvas.addEventListener('touchend', stopDrawing);

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
