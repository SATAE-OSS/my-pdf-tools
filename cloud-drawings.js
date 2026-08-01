const cloudConfig = window.PDF_MAGIC_SUPABASE;
const supabaseClient = window.supabase.createClient(cloudConfig.url, cloudConfig.publishableKey);
window.pdfMagicSupabase = supabaseClient;

const signedOutPanel = document.getElementById('signedOutPanel');
const signedInPanel = document.getElementById('signedInPanel');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const googleLoginLabel = document.getElementById('googleLoginLabel');
const emailLoginFallback = document.getElementById('emailLoginFallback');
const authEmail = document.getElementById('authEmail');
const sendLoginLinkBtn = document.getElementById('sendLoginLinkBtn');
const emailLoginStep = document.getElementById('emailLoginStep');
const otpLoginStep = document.getElementById('otpLoginStep');
const otpCode = document.getElementById('otpCode');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const changeLoginEmailBtn = document.getElementById('changeLoginEmailBtn');
const otpEmailLabel = document.getElementById('otpEmailLabel');
const authCooldownNote = document.getElementById('authCooldownNote');
const signOutBtn = document.getElementById('signOutBtn');
const currentUserEmail = document.getElementById('currentUserEmail');
const cloudStatus = document.getElementById('cloudStatus');
const cloudMessage = document.getElementById('cloudMessage');
const drawingTitle = document.getElementById('drawingTitle');
const saveDrawingBtn = document.getElementById('saveDrawingBtn');
const refreshDrawingsBtn = document.getElementById('refreshDrawingsBtn');
const savedDrawings = document.getElementById('savedDrawings');
const accountUsage = document.getElementById('accountUsage');
const downloadAllDrawingsBtn = document.getElementById('downloadAllDrawingsBtn');
const deleteAllDrawingsBtn = document.getElementById('deleteAllDrawingsBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const shareDialog = document.getElementById('shareDialog');
const shareLinkInput = document.getElementById('shareLinkInput');
const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
const closeShareDialogBtn = document.getElementById('closeShareDialogBtn');
const sharedViewDialog = document.getElementById('sharedViewDialog');
const sharedViewTitle = document.getElementById('sharedViewTitle');
const sharedViewImage = document.getElementById('sharedViewImage');
const downloadSharedViewBtn = document.getElementById('downloadSharedViewBtn');
const closeSharedViewBtn = document.getElementById('closeSharedViewBtn');
const cloudSavePanel = document.getElementById('cloudSavePanel');
const saveCloudShortcutBtn = document.getElementById('saveCloudShortcutBtn');
const authGateMessage = document.getElementById('authGateMessage');
const appShell = document.getElementById('appShell');
const headerUserEmail = document.getElementById('headerUserEmail');

let cloudUser = null;
let pendingLoginEmail = sessionStorage.getItem('pdf-magic-login-email') || '';
const AUTH_RESEND_AT_KEY = 'jane-auth-resend-at';
let authCooldownTimer = null;

function setCloudMessage(message = '', type = '') {
    cloudMessage.textContent = message;
    cloudMessage.className = `cloud-message ${type}`.trim();
    if (authGateMessage) {
        authGateMessage.textContent = message;
        authGateMessage.className = `cloud-message ${type}`.trim();
    }
}

function setButtonBusy(button, busy, busyText) {
    if (busy) button.dataset.originalText = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? busyText : button.dataset.originalText;
}

function getAuthCooldownSeconds() {
    const resendAt = Number(sessionStorage.getItem(AUTH_RESEND_AT_KEY) || 0);
    return Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
}

function formatAuthCooldown(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateAuthCooldownUI() {
    const remaining = getAuthCooldownSeconds();
    if (remaining > 0) {
        const countdown = formatAuthCooldown(remaining);
        sendLoginLinkBtn.disabled = true;
        resendOtpBtn.disabled = true;
        sendLoginLinkBtn.textContent = `ส่งใหม่ได้ใน ${countdown}`;
        resendOtpBtn.textContent = `ส่งใหม่ได้ใน ${countdown}`;
        authCooldownNote.hidden = false;
        authCooldownNote.textContent = 'ใช้รหัสล่าสุดในอีเมลได้เลย ระบบพักปุ่มส่งใหม่ชั่วคราวเพื่อป้องกันการขอรหัสถี่เกินไป';
        return;
    }

    sessionStorage.removeItem(AUTH_RESEND_AT_KEY);
    sendLoginLinkBtn.disabled = false;
    resendOtpBtn.disabled = false;
    sendLoginLinkBtn.textContent = 'รับรหัส OTP';
    resendOtpBtn.textContent = 'ส่งรหัสอีกครั้ง';
    authCooldownNote.hidden = true;
    if (authCooldownTimer) {
        clearInterval(authCooldownTimer);
        authCooldownTimer = null;
    }
}

function startAuthCooldown(seconds) {
    sessionStorage.setItem(AUTH_RESEND_AT_KEY, String(Date.now() + (seconds * 1000)));
    updateAuthCooldownUI();
    if (authCooldownTimer) clearInterval(authCooldownTimer);
    authCooldownTimer = setInterval(updateAuthCooldownUI, 1000);
}

function isEmailRateLimitError(error) {
    const detail = `${error?.code || ''} ${error?.message || ''}`;
    return error?.status === 429 || /rate.?limit|too many|over_email_send_rate_limit/i.test(detail);
}

function friendlyAuthError(error, action = 'send') {
    const detail = `${error?.code || ''} ${error?.message || ''}`;
    if (isEmailRateLimitError(error)) {
        return 'โควตาส่งอีเมลของ Supabase เต็มชั่วคราว ไม่ได้เกิดจากการกดครั้งนี้ซ้ำ หากมีรหัสล่าสุดให้ใช้รหัสนั้นก่อน หรือรอแล้วลองใหม่อีกครั้ง โดยบางกรณีอาจต้องรอประมาณ 1 ชั่วโมง';
    }
    if (/invalid.*email|email.*invalid/i.test(detail)) return 'รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจอีเมลอีกครั้ง';
    if (/expired|invalid.*token|token.*invalid|otp/i.test(detail) && action === 'verify') {
        return 'รหัสไม่ถูกต้องหรือหมดอายุ ลองตรวจรหัสล่าสุดในอีเมลอีกครั้ง';
    }
    if (/network|fetch|offline/i.test(detail)) return 'เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาตรวจสัญญาณแล้วลองใหม่';
    return action === 'verify'
        ? 'ตรวจรหัสไม่สำเร็จ กรุณาลองกรอกรหัสล่าสุดอีกครั้ง'
        : 'ส่งรหัสไม่สำเร็จ กรุณารอสักครู่แล้วลองใหม่';
}

function showOtpStep(email) {
    pendingLoginEmail = email;
    sessionStorage.setItem('pdf-magic-login-email', email);
    authEmail.value = email;
    otpEmailLabel.textContent = email;
    emailLoginFallback.open = true;
    emailLoginStep.hidden = true;
    otpLoginStep.hidden = false;
}

googleLoginBtn.addEventListener('click', async () => {
    saveCanvasDraft();
    localStorage.setItem('pdf-magic-drawing-title', drawingTitle.value.trim());
    googleLoginBtn.disabled = true;
    googleLoginLabel.textContent = 'กำลังเปิด Google...';
    setCloudMessage('กำลังพาไปเลือกบัญชี Google');

    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
    });

    if (!error) return;
    googleLoginBtn.disabled = false;
    googleLoginLabel.textContent = 'เข้าสู่ระบบด้วย Google';
    const detail = `${error.code || ''} ${error.message || ''}`;
    const message = /provider.*not.*enabled|unsupported.*provider/i.test(detail)
        ? 'ยังไม่ได้เปิด Google Login ใน Supabase กรุณาตั้งค่า Google Provider ก่อนใช้งาน'
        : 'เปิดหน้าเข้าสู่ระบบ Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
    setCloudMessage(message, 'error');
});

async function requestLoginCode(email, button) {
    setButtonBusy(button, true, 'กำลังส่ง...');
    setCloudMessage('');
    const { error } = await supabaseClient.auth.signInWithOtp({ email });
    setButtonBusy(button, false);

    if (error) {
        if (isEmailRateLimitError(error)) {
            showOtpStep(email);
            startAuthCooldown(60);
        }
        setCloudMessage(friendlyAuthError(error, 'send'), 'error');
        return false;
    }

    showOtpStep(email);
    startAuthCooldown(60);
    otpCode.focus();
    setCloudMessage('ส่งรหัสแล้ว กรุณาตรวจกล่องจดหมายหรืออีเมลขยะ แล้วกรอกรหัส 6 หลัก', 'success');
    return true;
}

function updateAuthUI(user) {
    cloudUser = user;
    const signedIn = Boolean(user);
    signedOutPanel.hidden = signedIn;
    signedInPanel.hidden = !signedIn;
    if (appShell) appShell.hidden = !signedIn;
    document.body.classList.toggle('auth-pending', !signedIn);
    if (headerUserEmail) headerUserEmail.textContent = user?.email || '';
    cloudStatus.textContent = signedIn ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เข้าสู่ระบบ';
    cloudStatus.classList.toggle('connected', signedIn);
    currentUserEmail.textContent = user?.email || '';
    if (!signedIn) {
        const waitingForOtp = Boolean(pendingLoginEmail);
        emailLoginStep.hidden = waitingForOtp;
        otpLoginStep.hidden = !waitingForOtp;
        if (waitingForOtp) {
            authEmail.value = pendingLoginEmail;
            otpEmailLabel.textContent = pendingLoginEmail;
            emailLoginFallback.open = true;
        }
        updateAuthCooldownUI();
    }
    const savedTitle = localStorage.getItem('pdf-magic-drawing-title');
    if (signedIn && savedTitle) drawingTitle.value = savedTitle;
    if (!signedIn) savedDrawings.innerHTML = '';
    window.dispatchEvent(new CustomEvent('pdfmagic:auth', { detail: { user } }));
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
    await requestLoginCode(email, sendLoginLinkBtn);
});

authEmail.addEventListener('keydown', event => {
    if (event.key === 'Enter') sendLoginLinkBtn.click();
});

otpCode.addEventListener('input', () => {
    otpCode.value = otpCode.value.replace(/\D/g, '').slice(0, 6);
});
otpCode.addEventListener('keydown', event => {
    if (event.key === 'Enter') verifyOtpBtn.click();
});

verifyOtpBtn.addEventListener('click', async () => {
    const token = otpCode.value.trim();
    if (!pendingLoginEmail || token.length !== 6) {
        setCloudMessage('กรุณากรอกรหัส OTP ให้ครบ 6 หลัก', 'error');
        return;
    }
    setButtonBusy(verifyOtpBtn, true, 'กำลังตรวจ...');
    const { error } = await supabaseClient.auth.verifyOtp({
        email: pendingLoginEmail,
        token,
        type: 'email'
    });
    setButtonBusy(verifyOtpBtn, false);
    if (error) {
        setCloudMessage(friendlyAuthError(error, 'verify'), 'error');
        return;
    }
    sessionStorage.removeItem('pdf-magic-login-email');
    pendingLoginEmail = '';
    otpCode.value = '';
    setCloudMessage('เข้าสู่ระบบเรียบร้อยแล้ว', 'success');
});

resendOtpBtn.addEventListener('click', async () => {
    if (!pendingLoginEmail || getAuthCooldownSeconds() > 0) return;
    await requestLoginCode(pendingLoginEmail, resendOtpBtn);
});

changeLoginEmailBtn.addEventListener('click', () => {
    pendingLoginEmail = '';
    sessionStorage.removeItem('pdf-magic-login-email');
    otpCode.value = '';
    otpLoginStep.hidden = true;
    emailLoginStep.hidden = false;
    authEmail.focus();
    setCloudMessage('');
});

signOutBtn.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) setCloudMessage(`ออกจากระบบไม่สำเร็จ: ${error.message}`, 'error');
});

function canvasToBlob() {
    return new Promise((resolve, reject) => {
        const output = document.createElement('canvas');
        output.width = canvas.width;
        output.height = canvas.height;
        const outputContext = output.getContext('2d');
        if (canvasBackground.value === 'white') {
            outputContext.fillStyle = '#ffffff';
            outputContext.fillRect(0, 0, output.width, output.height);
        }
        outputContext.drawImage(canvas, 0, 0);
        output.toBlob(blob => blob ? resolve(blob) : reject(new Error('สร้างไฟล์ภาพไม่สำเร็จ')), 'image/png');
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
            storage_path: storagePath,
            file_size: imageBlob.size
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

saveCloudShortcutBtn.addEventListener('click', () => {
    cloudSavePanel.open = true;
    cloudSavePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (!cloudUser) {
        setCloudMessage('เข้าสู่ระบบก่อนครั้งเดียว แล้วภาพจะเปิดได้จากทุกอุปกรณ์', 'error');
        window.setTimeout(() => authEmail.focus(), 350);
        return;
    }
    saveDrawingBtn.click();
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
        .select('id,title,storage_path,created_at,file_size,is_public,share_token,public_path')
        .order('created_at', { ascending: false });

    if (error) {
        savedDrawings.innerHTML = '';
        setCloudMessage(`โหลดรายการไม่สำเร็จ: ${friendlyCloudError(error)}`, 'error');
        return;
    }

    if (!data.length) {
        updateAccountUsage([]);
        savedDrawings.innerHTML = '<p class="drawing-placeholder">ยังไม่มีภาพที่บันทึกไว้</p>';
        return;
    }

    savedDrawings.innerHTML = '';
    updateAccountUsage(data);
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

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'text-btn';
    shareBtn.textContent = drawing.is_public ? 'คัดลอกลิงก์' : 'แชร์';
    shareBtn.addEventListener('click', () => shareDrawing(drawing, imageUrl));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'text-btn danger';
    deleteBtn.textContent = 'ลบ';
    deleteBtn.addEventListener('click', () => deleteDrawing(drawing));
    actions.append(openBtn, shareBtn);
    if (drawing.is_public) {
        const stopShareBtn = document.createElement('button');
        stopShareBtn.type = 'button';
        stopShareBtn.className = 'text-btn danger';
        stopShareBtn.textContent = 'หยุดแชร์';
        stopShareBtn.addEventListener('click', () => stopSharingDrawing(drawing));
        actions.appendChild(stopShareBtn);
    }
    actions.appendChild(deleteBtn);

    card.append(image, info, actions);
    return card;
}

function openDrawing(imageUrl, title) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
        if (!loadImageIntoCanvas(image)) {
            setCloudMessage('เปิดภาพไม่สำเร็จ เนื่องจากขนาดภาพไม่ถูกต้อง', 'error');
            return;
        }
        drawingTitle.value = title;
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setCloudMessage('เปิดภาพแล้ว สามารถวาดต่อได้เลย', 'success');
    };
    image.onerror = () => setCloudMessage('เปิดภาพไม่สำเร็จ กรุณารีเฟรชรายการแล้วลองใหม่', 'error');
    image.src = imageUrl;
}

async function deleteDrawing(drawing) {
    if (!await confirmAction(`ภาพ “${drawing.title}” จะถูกลบจากคลาวด์และกู้คืนไม่ได้`)) return;
    setCloudMessage('กำลังลบภาพ...');

    const { error: storageError } = await supabaseClient.storage
        .from('drawings')
        .remove([drawing.storage_path]);
    if (storageError) {
        setCloudMessage(`ลบไม่สำเร็จ: ${friendlyCloudError(storageError)}`, 'error');
        return;
    }

    if (drawing.public_path) {
        await supabaseClient.storage.from('shared-drawings').remove([drawing.public_path]);
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
cloudSavePanel.addEventListener('toggle', () => {
    if (cloudSavePanel.open && cloudUser) loadSavedDrawings();
});

function updateAccountUsage(drawings) {
    const bytes = drawings.reduce((total, drawing) => total + Number(drawing.file_size || 0), 0);
    accountUsage.textContent = `${drawings.length} ภาพ · ${formatBytes(bytes)}`;
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function getShareUrl(token) {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('share', token);
    return url.toString();
}

function showShareDialog(token) {
    shareLinkInput.value = getShareUrl(token);
    shareDialog.showModal();
    shareLinkInput.select();
}

async function shareDrawing(drawing, imageUrl) {
    if (drawing.is_public && drawing.share_token) {
        showShareDialog(drawing.share_token);
        return;
    }
    setCloudMessage('กำลังสร้างลิงก์แชร์...');
    try {
        const token = crypto.randomUUID();
        const publicPath = `${cloudUser.id}/${token}.png`;
        const imageBlob = await fetch(imageUrl).then(response => response.blob());
        const { error: uploadError } = await supabaseClient.storage
            .from('shared-drawings')
            .upload(publicPath, imageBlob, { contentType: 'image/png', upsert: false });
        if (uploadError) throw uploadError;

        const { error: updateError } = await supabaseClient.from('drawings').update({
            is_public: true,
            share_token: token,
            public_path: publicPath
        }).eq('id', drawing.id);
        if (updateError) {
            await supabaseClient.storage.from('shared-drawings').remove([publicPath]);
            throw updateError;
        }
        showShareDialog(token);
        setCloudMessage('สร้างลิงก์แชร์แล้ว', 'success');
        loadSavedDrawings();
    } catch (error) {
        setCloudMessage(`แชร์ไม่สำเร็จ: ${friendlyCloudError(error)}`, 'error');
    }
}

async function stopSharingDrawing(drawing) {
    if (!await confirmAction(`คนที่มีลิงก์จะเปิด “${drawing.title}” ไม่ได้อีก`, 'หยุดแชร์')) return;
    if (drawing.public_path) {
        await supabaseClient.storage.from('shared-drawings').remove([drawing.public_path]);
    }
    const { error } = await supabaseClient.from('drawings').update({
        is_public: false,
        share_token: null,
        public_path: null
    }).eq('id', drawing.id);
    if (error) setCloudMessage(`หยุดแชร์ไม่สำเร็จ: ${friendlyCloudError(error)}`, 'error');
    else {
        setCloudMessage('หยุดแชร์ภาพแล้ว', 'success');
        loadSavedDrawings();
    }
}

copyShareLinkBtn.addEventListener('click', async () => {
    try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
        await navigator.clipboard.writeText(shareLinkInput.value);
    } catch (error) {
        shareLinkInput.select();
        document.execCommand('copy');
    }
    copyShareLinkBtn.textContent = 'คัดลอกแล้ว ✓';
    setTimeout(() => copyShareLinkBtn.textContent = 'คัดลอกลิงก์', 1500);
});
closeShareDialogBtn.addEventListener('click', () => shareDialog.close());
closeSharedViewBtn.addEventListener('click', () => sharedViewDialog.close());

async function getAllCloudDrawings() {
    const { data, error } = await supabaseClient.from('drawings')
        .select('id,title,storage_path,public_path,file_size,created_at');
    if (error) throw error;
    return data;
}

downloadAllDrawingsBtn.addEventListener('click', async () => {
    const fallbackWindow = window.janeDownload.reserveWindow();
    setButtonBusy(downloadAllDrawingsBtn, true, 'กำลังรวมไฟล์...');
    try {
        const drawings = await getAllCloudDrawings();
        const zip = new JSZip();
        for (const [index, drawing] of drawings.entries()) {
            const { data } = await supabaseClient.storage.from('drawings')
                .createSignedUrl(drawing.storage_path, 600);
            if (!data?.signedUrl) continue;
            const blob = await fetch(data.signedUrl).then(response => response.blob());
            const safeTitle = drawing.title.replace(/[\\/:*?"<>|]/g, '_');
            zip.file(`${String(index + 1).padStart(2, '0')}-${safeTitle}.png`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        await window.janeDownload.saveBlob(zipBlob, 'jane-tools-drawings.zip', {
            title: 'ภาพวาดทั้งหมด',
            fallbackWindow
        });
    } catch (error) {
        if (fallbackWindow && !fallbackWindow.closed) fallbackWindow.close();
        setCloudMessage(`ดาวน์โหลดไม่สำเร็จ: ${friendlyCloudError(error)}`, 'error');
    } finally {
        setButtonBusy(downloadAllDrawingsBtn, false);
    }
});

async function deleteAllCloudDrawings() {
    const drawings = await getAllCloudDrawings();
    const privatePaths = drawings.map(drawing => drawing.storage_path).filter(Boolean);
    const publicPaths = drawings.map(drawing => drawing.public_path).filter(Boolean);
    if (privatePaths.length) await supabaseClient.storage.from('drawings').remove(privatePaths);
    if (publicPaths.length) await supabaseClient.storage.from('shared-drawings').remove(publicPaths);
    const { error } = await supabaseClient.from('drawings').delete().eq('user_id', cloudUser.id);
    if (error) throw error;
}

deleteAllDrawingsBtn.addEventListener('click', async () => {
    if (!await confirmAction('ภาพบนคลาวด์ทั้งหมดจะถูกลบถาวร', 'ลบทั้งหมด')) return;
    try {
        await deleteAllCloudDrawings();
        setCloudMessage('ลบภาพบนคลาวด์ทั้งหมดแล้ว', 'success');
        loadSavedDrawings();
    } catch (error) {
        setCloudMessage(`ลบไม่สำเร็จ: ${friendlyCloudError(error)}`, 'error');
    }
});

deleteAccountBtn.addEventListener('click', async () => {
    if (!await confirmAction('บัญชีและภาพทั้งหมดจะถูกลบถาวร คุณจะไม่สามารถกู้คืนได้', 'ลบบัญชี')) return;
    try {
        await deleteAllCloudDrawings();
        const { error } = await supabaseClient.rpc('delete_my_account');
        if (error) throw error;
        await supabaseClient.auth.signOut();
        location.reload();
    } catch (error) {
        setCloudMessage(`ลบบัญชีไม่สำเร็จ: ${friendlyCloudError(error)}`, 'error');
    }
});

async function showSharedDrawingFromUrl() {
    const token = new URLSearchParams(location.search).get('share');
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return;
    const { data, error } = await supabaseClient
        .rpc('get_shared_drawing', { p_token: token })
        .maybeSingle();
    if (error || !data?.public_path) return;
    const { data: publicData } = supabaseClient.storage.from('shared-drawings').getPublicUrl(data.public_path);
    sharedViewTitle.textContent = data.title;
    sharedViewImage.src = publicData.publicUrl;
    downloadSharedViewBtn.href = publicData.publicUrl;
    downloadSharedViewBtn.download = `${data.title}.png`;
    downloadSharedViewBtn.onclick = async event => {
        event.preventDefault();
        const fallbackWindow = window.janeDownload.reserveWindow();
        try {
            const response = await fetch(publicData.publicUrl);
            if (!response.ok) throw new Error('โหลดภาพไม่สำเร็จ');
            await window.janeDownload.saveBlob(await response.blob(), `${data.title}.png`, {
                title: data.title,
                fallbackWindow
            });
        } catch (error) {
            if (fallbackWindow && !fallbackWindow.closed) fallbackWindow.location.href = publicData.publicUrl;
            else window.open(publicData.publicUrl, '_blank');
        }
    };
    sharedViewDialog.showModal();
}

if (pendingLoginEmail) {
    authEmail.value = pendingLoginEmail;
    otpEmailLabel.textContent = pendingLoginEmail;
    emailLoginFallback.open = true;
    emailLoginStep.hidden = true;
    otpLoginStep.hidden = false;
}
updateAuthCooldownUI();

showSharedDrawingFromUrl();

supabaseClient.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session?.user || null);
    if (session?.user && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        window.setTimeout(loadSavedDrawings, 0);
    }
    if (event === 'SIGNED_OUT') setCloudMessage('ออกจากระบบแล้ว');
});
