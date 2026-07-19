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

const modal = document.getElementById('previewModal');
const closeModal = document.getElementById('closeModal');
const pdfFrame = document.getElementById('pdfFrame');

// ------------------------------------------
// เปลี่ยนจากเดิมที่เป็น Modal ให้เป็นการเปิดไฟล์ในแท็บใหม่แทน
// ------------------------------------------
previewBtn.addEventListener('click', function() {
    const pdf = generatePDF();
    if(!pdf) { alert('กรุณาอัปโหลดรูปภาพก่อนครับ!'); return; }
    
    // สร้าง Blob แล้วเปิดในหน้าต่างใหม่ (วิธีนี้มือถือจะไม่บล็อกครับ)
    const blob = pdf.output('blob');
    const blobURL = URL.createObjectURL(blob);
    window.open(blobURL, '_blank'); 
});

closeModal.addEventListener('click', function() {
    modal.style.display = 'none';
    pdfFrame.src = ''; 
});

window.addEventListener('click', function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
        pdfFrame.src = '';
    }
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
        link.href = URL.createObjectURL(content);
        link.download = "extracted_images.zip";
        link.click();
        
        downloadZipBtn.innerText = "📦 ดาวน์โหลดรูปทั้งหมด (.ZIP)";
    });
});