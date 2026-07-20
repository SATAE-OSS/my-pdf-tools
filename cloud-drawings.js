const cloudConfig = window.PDF_MAGIC_SUPABASE;
const supabaseClient = window.supabase.createClient(cloudConfig.url, cloudConfig.publishableKey);

const signedOutPanel = document.getElementById('signedOutPanel');
const signedInPanel = document.getElementById('signedInPanel');
const authEmail = document.getElementById('authEmail');
const sendLoginLinkBtn = document.getElementById('sendLoginLinkBtn');
const signOutBtn = document.getElementById('signOutBtn');
const currentUserEmail = document.getElementById('currentUserEmail');
const cloudStatus = document.getElementById('cloudStatus');
const cloudMessage = document.getElementById('cloudMessage');
const drawingTitle = document.getElementById('drawingTitle');
const saveDrawingBtn = document.getElementById('saveDrawingBtn');
const refreshDrawingsBtn = document.getElementById('refreshDrawingsBtn');
const savedDrawings = document.getElementById('savedDrawings');

let cloudUser = null;

function setCloudMessage(message = '', type = '') {
    cloudMessage.textContent = message;
    cloudMessage.className = `cloud-message ${type}`.trim();
}

function setButtonBusy(button, busy, busyText) {
    if (busy) button.dataset.originalText = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? busyText : button.dataset.originalText;
}

function updateAuthUI(user) {
    cloudUser = user;
    const signedIn = Boolean(user);
    signedOutPanel.hidden = signedIn;
    signedInPanel.hidden = !signedIn;
    cloudStatus.textContent = signedIn ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เข้าสู่ระบบ';
    cloudStatus.classList.toggle('connected', signedIn);
    currentUserEmail.textContent = user?.email || '';
    const savedTitle = localStorage.getItem('pdf-magic-drawing-title');
    if (signedIn && savedTitle) drawingTitle.value = savedTitle;
    if (!signedIn) savedDrawings.innerHTML = '';
}

sendLoginLinkBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    if (!email || !authEmail.checkValidity()) {
        setCloudMessage('กรุณากรอกอีเมลให้ถูกต้อง', 'error');
        authEmail.focus();
        return;
    }

    // เก็บงานไว้ก่อน เพราะลิงก์อีเมลอาจเปิดเว็บในแท็บใหม่
    saveCanvasDraft();
    localStorage.setItem('pdf-magic-drawing-title', drawingTitle.value.trim());
    setButtonBusy(sendLoginLinkBtn, true, 'กำลังส่ง...');
    setCloudMessage('');
    const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
    });
    setButtonBusy(sendLoginLinkBtn, false);

    if (error) {
        setCloudMessage(`ส่งอีเมลไม่สำเร็จ: ${error.message}`, 'error');
        return;
    }
    setCloudMessage('ส่งลิงก์แล้ว กรุณาเปิดอีเมลและกดลิงก์เข้าสู่ระบบ', 'success');
});

authEmail.addEventListener('keydown', event => {
    if (event.key === 'Enter') sendLoginLinkBtn.click();
});

signOutBtn.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) setCloudMessage(`ออกจากระบบไม่สำเร็จ: ${error.message}`, 'error');
});

function canvasToBlob() {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('สร้างไฟล์ภาพไม่สำเร็จ')), 'image/png');
    });
}

saveDrawingBtn.addEventListener('click', async () => {
    if (!cloudUser) return;

    const title = drawingTitle.value.trim() || 'ภาพวาดของฉัน';
    const drawingId = crypto.randomUUID();
    const storagePath = `${cloudUser.id}/${drawingId}.png`;
    setButtonBusy(saveDrawingBtn, true, 'กำลังบันทึก...');
    setCloudMessage('');

    try {
        const imageBlob = await canvasToBlob();
        const { error: uploadError } = await supabaseClient.storage
            .from('drawings')
            .upload(storagePath, imageBlob, { contentType: 'image/png', upsert: false });
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabaseClient.from('drawings').insert({
            id: drawingId,
            user_id: cloudUser.id,
            title,
            storage_path: storagePath
        });
        if (insertError) {
            await supabaseClient.storage.from('drawings').remove([storagePath]);
            throw insertError;
        }

        setCloudMessage('บันทึกภาพเรียบร้อยแล้ว', 'success');
        await loadSavedDrawings();
    } catch (error) {
        setCloudMessage(`บันทึกไม่สำเร็จ: ${friendlyCloudError(error)}`, 'error');
    } finally {
        setButtonBusy(saveDrawingBtn, false);
    }
});

function friendlyCloudError(error) {
    if (/relation.*drawings.*does not exist/i.test(error.message || '')) return 'ยังไม่ได้สร้างตาราง drawings ใน Supabase';
    if (/row-level security|policy/i.test(error.message || '')) return 'สิทธิ์ RLS หรือ Storage ยังตั้งค่าไม่ครบ';
    return error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
}

async function loadSavedDrawings() {
    if (!cloudUser) return;
    savedDrawings.innerHTML = '<p class="drawing-placeholder">กำลังโหลด...</p>';

    const { data, error } = await supabaseClient
        .from('drawings')
        .select('id,title,storage_path,created_at')
        .order('created_at', { ascending: false });

    if (error) {
        savedDrawings.innerHTML = '';
        setCloudMessage(`โหลดรายการไม่สำเร็จ: ${friendlyCloudError(error)}`, 'error');
        return;
    }

    if (!data.length) {
        savedDrawings.innerHTML = '<p class="drawing-placeholder">ยังไม่มีภาพที่บันทึกไว้</p>';
        return;
    }

    savedDrawings.innerHTML = '';
    for (const drawing of data) {
        const { data: signedData } = await supabaseClient.storage
            .from('drawings')
            .createSignedUrl(drawing.storage_path, 3600);
        if (!signedData?.signedUrl) continue;
        savedDrawings.appendChild(createDrawingCard(drawing, signedData.signedUrl));
    }
}

function createDrawingCard(drawing, imageUrl) {
    const card = document.createElement('article');
    card.className = 'saved-drawing-card';

    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = drawing.title;
    image.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'saved-drawing-info';
    const title = document.createElement('strong');
    title.textContent = drawing.title;
    const date = document.createElement('small');
    date.textContent = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
        .format(new Date(drawing.created_at));
    info.append(title, date);

    const actions = document.createElement('div');
    actions.className = 'saved-drawing-actions';
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'text-btn';
    openBtn.textContent = 'เปิดวาดต่อ';
    openBtn.addEventListener('click', () => openDrawing(imageUrl, drawing.title));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'text-btn danger';
    deleteBtn.textContent = 'ลบ';
    deleteBtn.addEventListener('click', () => deleteDrawing(drawing));
    actions.append(openBtn, deleteBtn);

    card.append(image, info, actions);
    return card;
}

function openDrawing(imageUrl, title) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
        recordCanvasHistory();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        saveCanvasDraft();
        drawingTitle.value = title;
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setCloudMessage('เปิดภาพแล้ว สามารถวาดต่อได้เลย', 'success');
    };
    image.onerror = () => setCloudMessage('เปิดภาพไม่สำเร็จ กรุณารีเฟรชรายการแล้วลองใหม่', 'error');
    image.src = imageUrl;
}

async function deleteDrawing(drawing) {
    if (!window.confirm(`ลบ “${drawing.title}” ใช่ไหม?`)) return;
    setCloudMessage('กำลังลบภาพ...');

    const { error: storageError } = await supabaseClient.storage
        .from('drawings')
        .remove([drawing.storage_path]);
    if (storageError) {
        setCloudMessage(`ลบไม่สำเร็จ: ${friendlyCloudError(storageError)}`, 'error');
        return;
    }

    const { error: databaseError } = await supabaseClient
        .from('drawings')
        .delete()
        .eq('id', drawing.id);
    if (databaseError) {
        setCloudMessage(`ลบข้อมูลไม่สำเร็จ: ${friendlyCloudError(databaseError)}`, 'error');
        return;
    }

    setCloudMessage('ลบภาพแล้ว', 'success');
    await loadSavedDrawings();
}

refreshDrawingsBtn.addEventListener('click', loadSavedDrawings);

supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session?.user || null);
    if (session?.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        window.setTimeout(loadSavedDrawings, 0);
    }
    if (event === 'SIGNED_OUT') setCloudMessage('ออกจากระบบแล้ว');
});
