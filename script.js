const fileInput = document.getElementById('fileInput');
const gallery = document.getElementById('gallery');
const downloadBtn = document.getElementById('downloadBtn');

// 1. เปิดใช้งานระบบลากวาง (Drag & Drop)
new Sortable(gallery, {
    animation: 200,
    ghostClass: 'sortable-ghost'
});

// 2. เมื่อเลือกรูปภาพ ให้นำมาแสดงเป็นพรีวิว
fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const div = document.createElement('div');
            div.className = 'img-card';
            
            const img = document.createElement('img');
            img.src = event.target.result;
            
            div.appendChild(img);
            gallery.appendChild(div);
        }
        reader.readAsDataURL(file);
    });
    
    // เคลียร์ค่า input เพื่อให้สามารถเลือกรูปเดิมซ้ำได้ถ้าต้องการ
    fileInput.value = '';
});

// 3. จัดการตอนกดปุ่มสร้าง PDF
downloadBtn.addEventListener('click', function() {
    const images = gallery.querySelectorAll('img');
    if(images.length === 0) {
        alert('กรุณาอัปโหลดรูปภาพก่อนครับ!');
        return;
    }

    downloadBtn.innerText = "⏳ กำลังสร้าง PDF...";
    
    // เรียกใช้ jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    images.forEach((img, index) => {
        if(index > 0) pdf.addPage();
        
        // คำนวณขนาดภาพให้พอดีกระดาษ A4
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = img.naturalWidth / img.naturalHeight;
        
        let width = pageWidth;
        let height = pageWidth / ratio;
        
        if(height > pageHeight) {
            height = pageHeight;
            width = pageHeight * ratio;
        }
        
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;
        
        pdf.addImage(img.src, 'JPEG', x, y, width, height);
    });
    
    // ดาวน์โหลดไฟล์
    const fileNameInput = document.getElementById('fileName').value;
    const fileName = fileNameInput.trim() !== '' ? fileNameInput : 'document';
    pdf.save(fileName + '.pdf');
    
    downloadBtn.innerText = "⬇️ แปลงเป็น PDF แล้วดาวน์โหลด";
});
