(() => {
    'use strict';

    const supabase = window.pdfMagicSupabase;
    if (!supabase) return;

    const byId = id => document.getElementById(id);
    const surveyDialog = byId('siteSurveyDialog');
    const surveyForm = byId('siteSurveyForm');
    const materialDialog = byId('materialDialog');
    const materialForm = byId('materialForm');
    const surveyList = byId('siteSurveyList');
    const materialList = byId('materialList');
    const materialImage = byId('materialImage');
    const materialImagePreview = byId('materialImagePreview');
    const materialImagePrompt = byId('materialImagePrompt');
    const imageBucket = 'material-images';
    let currentUser = null;
    let surveys = [];
    let materials = [];
    let editingSurveyId = null;
    let editingMaterialId = null;
    let loadedUserId = null;
    let previewObjectUrl = '';

    const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
    const numberOrNull = value => value === '' ? null : Number(value);
    const formatNumber = value => value == null || value === '' ? '—' : Number(value).toLocaleString('th-TH', { maximumFractionDigits: 2 });
    const formatMoney = value => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const formatThaiDate = value => value ? new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : 'ไม่ระบุวันที่';

    function setMessage(id, text = '', type = '') {
        const element = byId(id);
        element.textContent = text;
        element.className = `planner-message ${type}`.trim();
    }

    function friendlyError(error) {
        const detail = error?.message || '';
        if (/relation.*(site_surveys|material_library).*does not exist/i.test(detail) || /bucket.*not found/i.test(detail)) {
            return 'ต้องอัปเดตฐานข้อมูลก่อน กรุณารันไฟล์ supabase-setup.sql รุ่นล่าสุดใน Supabase';
        }
        if (/row-level security|permission denied|policy/i.test(detail)) return 'สิทธิ์ฐานข้อมูลยังไม่ครบ กรุณารันไฟล์ตั้งค่า Supabase อีกครั้ง';
        if (/payload too large|maximum.*size|exceeded/i.test(detail)) return 'รูปมีขนาดใหญ่เกิน 5 MB กรุณาเลือกรูปที่เล็กลง';
        return detail || 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง';
    }

    function emptyState(icon, title, copy) {
        return `<div class="field-empty"><div><span>${icon}</span><h3>${title}</h3><p>${copy}</p></div></div>`;
    }

    function surveyArea(survey) {
        if (!survey.room_width || !survey.room_length) return null;
        return Number(survey.room_width) * Number(survey.room_length);
    }

    function renderSurveySummary() {
        const totalArea = surveys.reduce((sum, survey) => sum + (surveyArea(survey) || 0), 0);
        const openIssues = surveys.filter(survey => survey.issues?.trim()).length;
        byId('siteSurveySummary').innerHTML = `
            <article><span>📍</span><div><strong>${surveys.length}</strong><small>พื้นที่ที่บันทึก</small></div></article>
            <article><span>▦</span><div><strong>${formatNumber(totalArea)} ตร.ม.</strong><small>พื้นที่รวมที่วัดได้</small></div></article>
            <article><span>⚠️</span><div><strong>${openIssues}</strong><small>พื้นที่ที่พบปัญหา</small></div></article>`;
    }

    function renderSurveys() {
        renderSurveySummary();
        const keyword = byId('siteSurveySearch').value.trim().toLowerCase();
        const visible = surveys.filter(survey => [
            survey.name, survey.location, survey.issues, survey.notes, survey.lighting, survey.noise
        ].some(value => String(value || '').toLowerCase().includes(keyword)));
        if (!visible.length) {
            surveyList.innerHTML = emptyState('📍', keyword ? 'ไม่พบพื้นที่ที่ค้นหา' : 'ยังไม่มีข้อมูลสำรวจ', keyword ? 'ลองใช้คำค้นอื่นดูนะ' : 'กด “เพิ่มพื้นที่” แล้วเริ่มจดข้อมูลหน้างานได้เลย');
            return;
        }
        surveyList.innerHTML = visible.map(survey => {
            const area = surveyArea(survey);
            return `<article class="survey-card">
                <div class="survey-card-main">
                    <span>${escapeHTML(formatThaiDate(survey.surveyed_on))}</span>
                    <h3>${escapeHTML(survey.name)}</h3>
                    <small>${escapeHTML(survey.location || 'ยังไม่ระบุตำแหน่ง')}</small>
                    <div class="survey-dimensions">
                        <span><strong>${formatNumber(survey.room_width)}</strong>กว้าง (ม.)</span>
                        <span><strong>${formatNumber(survey.room_length)}</strong>ยาว (ม.)</span>
                        <span><strong>${area ? formatNumber(area) : '—'}</strong>พื้นที่ (ตร.ม.)</span>
                    </div>
                </div>
                <div class="survey-card-details">
                    <div class="survey-detail"><strong>🚪 ประตู ${survey.door_count || 0} จุด</strong><p>${escapeHTML(survey.door_details || 'ยังไม่มีรายละเอียด')}</p></div>
                    <div class="survey-detail"><strong>🪟 หน้าต่าง ${survey.window_count || 0} จุด</strong><p>${escapeHTML(survey.window_details || 'ยังไม่มีรายละเอียด')}</p></div>
                    <div class="survey-detail"><strong>☀️ แสง</strong><p>${escapeHTML(survey.lighting || 'ยังไม่มีรายละเอียด')}</p></div>
                    <div class="survey-detail"><strong>🔊 เสียง</strong><p>${escapeHTML(survey.noise || 'ยังไม่มีรายละเอียด')}</p></div>
                    <div class="survey-detail wide"><strong>⚠️ ปัญหาที่พบ</strong><p>${escapeHTML(survey.issues || 'ยังไม่พบปัญหา')}</p></div>
                </div>
                <div class="field-card-actions">
                    <button type="button" data-edit-survey="${survey.id}">แก้ไข</button>
                    <button class="danger" type="button" data-delete-survey="${survey.id}">ลบ</button>
                </div>
            </article>`;
        }).join('');
    }

    function renderMaterialSummary() {
        const categories = new Set(materials.map(material => material.category));
        const totalValue = materials.reduce((sum, material) => sum + Number(material.price || 0), 0);
        byId('materialSummary').innerHTML = `
            <article><span>🧱</span><div><strong>${materials.length}</strong><small>วัสดุที่บันทึก</small></div></article>
            <article><span>▦</span><div><strong>${categories.size}</strong><small>หมวดวัสดุ</small></div></article>
            <article><span>฿</span><div><strong>${formatMoney(totalValue)}</strong><small>ผลรวมราคาตัวอย่าง</small></div></article>`;
    }

    function renderMaterials() {
        renderMaterialSummary();
        const keyword = byId('materialSearch').value.trim().toLowerCase();
        const category = byId('materialCategoryFilter').value;
        const visible = materials.filter(material =>
            (category === 'all' || material.category === category) &&
            [material.name, material.brand_model, material.store, material.dimensions, material.notes]
                .some(value => String(value || '').toLowerCase().includes(keyword))
        );
        if (!visible.length) {
            materialList.innerHTML = emptyState('🧱', keyword || category !== 'all' ? 'ไม่พบวัสดุในตัวกรองนี้' : 'คลังวัสดุยังว่าง', keyword || category !== 'all' ? 'ลองเปลี่ยนคำค้นหรือหมวดวัสดุ' : 'เพิ่มวัสดุชิ้นแรกพร้อมรูป ราคา และร้านค้าได้เลย');
            return;
        }
        materialList.innerHTML = visible.map(material => `
            <article class="material-card">
                <div class="material-card-image">
                    ${material.signedUrl ? `<img src="${escapeHTML(material.signedUrl)}" alt="${escapeHTML(material.name)}">` : '<span>🧱</span>'}
                    <span class="material-category">${escapeHTML(material.category)}</span>
                </div>
                <div class="material-card-body">
                    <div><h3>${escapeHTML(material.name)}</h3><div class="material-model">${escapeHTML(material.brand_model || 'ยังไม่ระบุยี่ห้อหรือรุ่น')}</div></div>
                    <div class="material-price">${material.price != null ? `฿${formatMoney(material.price)} <small>/${escapeHTML(material.price_unit)}</small>` : 'ยังไม่ระบุราคา'}</div>
                    <div class="material-meta">
                        <span>📐 ${escapeHTML(material.dimensions || 'ไม่ระบุขนาด')}</span>
                        <span>🏪 ${escapeHTML(material.store || 'ไม่ระบุร้านค้า')}</span>
                    </div>
                    <div class="field-card-actions">
                        <button type="button" data-edit-material="${material.id}">แก้ไข</button>
                        <button class="danger" type="button" data-delete-material="${material.id}">ลบ</button>
                    </div>
                </div>
            </article>`).join('');
    }

    async function attachMaterialUrls(rows) {
        return Promise.all(rows.map(async material => {
            if (!material.image_path) return material;
            const { data } = await supabase.storage.from(imageBucket).createSignedUrl(material.image_path, 3600);
            return { ...material, signedUrl: data?.signedUrl || '' };
        }));
    }

    async function loadData() {
        if (!currentUser) return;
        setMessage('siteSurveyMessage', 'กำลังโหลด...');
        setMessage('materialMessage', 'กำลังโหลด...');
        const [surveyResult, materialResult] = await Promise.all([
            supabase.from('site_surveys').select('*').order('surveyed_on', { ascending: false }).order('created_at', { ascending: false }),
            supabase.from('material_library').select('*').order('created_at', { ascending: false })
        ]);
        if (surveyResult.error || materialResult.error) {
            const errorText = friendlyError(surveyResult.error || materialResult.error);
            setMessage('siteSurveyMessage', errorText, 'error');
            setMessage('materialMessage', errorText, 'error');
            renderSurveys();
            renderMaterials();
            return;
        }
        surveys = surveyResult.data || [];
        materials = await attachMaterialUrls(materialResult.data || []);
        setMessage('siteSurveyMessage');
        setMessage('materialMessage');
        renderSurveys();
        renderMaterials();
    }

    function openSurveyDialog(survey = null) {
        editingSurveyId = survey?.id || null;
        surveyForm.reset();
        byId('siteSurveyDialogTitle').textContent = survey ? 'แก้ไขพื้นที่สำรวจ' : 'เพิ่มพื้นที่สำรวจ';
        byId('surveyName').value = survey?.name || '';
        byId('surveyDate').value = survey?.surveyed_on || new Date().toISOString().slice(0, 10);
        byId('surveyLocation').value = survey?.location || '';
        byId('surveyWidth').value = survey?.room_width ?? '';
        byId('surveyLength').value = survey?.room_length ?? '';
        byId('surveyHeight').value = survey?.room_height ?? '';
        byId('surveyDoorCount').value = survey?.door_count ?? 0;
        byId('surveyDoorDetails').value = survey?.door_details || '';
        byId('surveyWindowCount').value = survey?.window_count ?? 0;
        byId('surveyWindowDetails').value = survey?.window_details || '';
        byId('surveyLighting').value = survey?.lighting || '';
        byId('surveyNoise').value = survey?.noise || '';
        byId('surveyIssues').value = survey?.issues || '';
        byId('surveyNotes').value = survey?.notes || '';
        setMessage('siteSurveyFormMessage');
        surveyDialog.showModal();
        setTimeout(() => byId('surveyName').focus(), 50);
    }

    function clearMaterialPreview() {
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = '';
        materialImagePreview.hidden = true;
        materialImagePreview.removeAttribute('src');
        materialImagePrompt.hidden = false;
    }

    function showMaterialPreview(source) {
        materialImagePreview.src = source;
        materialImagePreview.hidden = false;
        materialImagePrompt.hidden = true;
    }

    function openMaterialDialog(material = null) {
        editingMaterialId = material?.id || null;
        materialForm.reset();
        clearMaterialPreview();
        byId('materialDialogTitle').textContent = material ? 'แก้ไขวัสดุ' : 'เพิ่มวัสดุ';
        byId('materialName').value = material?.name || '';
        byId('materialCategory').value = material?.category || 'พื้น';
        byId('materialModel').value = material?.brand_model || '';
        byId('materialPrice').value = material?.price ?? '';
        byId('materialPriceUnit').value = material?.price_unit || 'ชิ้น';
        byId('materialStore').value = material?.store || '';
        byId('materialDimensions').value = material?.dimensions || '';
        byId('materialNotes').value = material?.notes || '';
        if (material?.signedUrl) showMaterialPreview(material.signedUrl);
        setMessage('materialFormMessage');
        materialDialog.showModal();
        setTimeout(() => byId('materialName').focus(), 50);
    }

    surveyForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!currentUser) return;
        const payload = {
            user_id: currentUser.id,
            name: byId('surveyName').value.trim(),
            surveyed_on: byId('surveyDate').value,
            location: byId('surveyLocation').value.trim() || null,
            room_width: numberOrNull(byId('surveyWidth').value),
            room_length: numberOrNull(byId('surveyLength').value),
            room_height: numberOrNull(byId('surveyHeight').value),
            door_count: Number(byId('surveyDoorCount').value || 0),
            door_details: byId('surveyDoorDetails').value.trim() || null,
            window_count: Number(byId('surveyWindowCount').value || 0),
            window_details: byId('surveyWindowDetails').value.trim() || null,
            lighting: byId('surveyLighting').value.trim() || null,
            noise: byId('surveyNoise').value.trim() || null,
            issues: byId('surveyIssues').value.trim() || null,
            notes: byId('surveyNotes').value.trim() || null
        };
        byId('saveSiteSurveyBtn').disabled = true;
        const result = editingSurveyId
            ? await supabase.from('site_surveys').update(payload).eq('id', editingSurveyId)
            : await supabase.from('site_surveys').insert(payload);
        byId('saveSiteSurveyBtn').disabled = false;
        if (result.error) {
            setMessage('siteSurveyFormMessage', friendlyError(result.error), 'error');
            return;
        }
        surveyDialog.close();
        await loadData();
        setMessage('siteSurveyMessage', editingSurveyId ? 'แก้ไขข้อมูลสำรวจแล้ว' : 'บันทึกพื้นที่สำรวจแล้ว', 'success');
    });

    materialImage.addEventListener('change', () => {
        const file = materialImage.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            materialImage.value = '';
            setMessage('materialFormMessage', 'รูปมีขนาดเกิน 5 MB กรุณาเลือกรูปที่เล็กลง', 'error');
            return;
        }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            materialImage.value = '';
            setMessage('materialFormMessage', 'รองรับเฉพาะไฟล์ PNG, JPG และ WebP', 'error');
            return;
        }
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = URL.createObjectURL(file);
        showMaterialPreview(previewObjectUrl);
        setMessage('materialFormMessage');
    });

    materialForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!currentUser) return;
        const oldMaterial = materials.find(item => item.id === editingMaterialId);
        const imageFile = materialImage.files[0];
        let newImagePath = oldMaterial?.image_path || null;
        let uploadedPath = '';
        byId('saveMaterialBtn').disabled = true;
        if (imageFile) {
            const extension = imageFile.type === 'image/jpeg' ? 'jpg' : imageFile.type.split('/')[1];
            uploadedPath = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
            const uploadResult = await supabase.storage.from(imageBucket).upload(uploadedPath, imageFile, {
                contentType: imageFile.type,
                cacheControl: '3600'
            });
            if (uploadResult.error) {
                byId('saveMaterialBtn').disabled = false;
                setMessage('materialFormMessage', friendlyError(uploadResult.error), 'error');
                return;
            }
            newImagePath = uploadedPath;
        }
        const payload = {
            user_id: currentUser.id,
            name: byId('materialName').value.trim(),
            category: byId('materialCategory').value,
            brand_model: byId('materialModel').value.trim() || null,
            price: numberOrNull(byId('materialPrice').value),
            price_unit: byId('materialPriceUnit').value,
            store: byId('materialStore').value.trim() || null,
            dimensions: byId('materialDimensions').value.trim() || null,
            notes: byId('materialNotes').value.trim() || null,
            image_path: newImagePath
        };
        const result = editingMaterialId
            ? await supabase.from('material_library').update(payload).eq('id', editingMaterialId)
            : await supabase.from('material_library').insert(payload);
        if (result.error) {
            if (uploadedPath) await supabase.storage.from(imageBucket).remove([uploadedPath]);
            byId('saveMaterialBtn').disabled = false;
            setMessage('materialFormMessage', friendlyError(result.error), 'error');
            return;
        }
        if (uploadedPath && oldMaterial?.image_path) await supabase.storage.from(imageBucket).remove([oldMaterial.image_path]);
        byId('saveMaterialBtn').disabled = false;
        materialDialog.close();
        clearMaterialPreview();
        await loadData();
        setMessage('materialMessage', editingMaterialId ? 'แก้ไขวัสดุแล้ว' : 'เพิ่มวัสดุในคลังแล้ว', 'success');
    });

    surveyList.addEventListener('click', async event => {
        const editButton = event.target.closest('[data-edit-survey]');
        const deleteButton = event.target.closest('[data-delete-survey]');
        if (editButton) openSurveyDialog(surveys.find(item => item.id === editButton.dataset.editSurvey));
        if (deleteButton) {
            const survey = surveys.find(item => item.id === deleteButton.dataset.deleteSurvey);
            if (!survey || (typeof confirmAction === 'function' && !await confirmAction(`ลบข้อมูลสำรวจ “${survey.name}” หรือไม่`, 'ลบข้อมูล'))) return;
            const { error } = await supabase.from('site_surveys').delete().eq('id', survey.id);
            if (error) setMessage('siteSurveyMessage', friendlyError(error), 'error');
            else await loadData();
        }
    });

    materialList.addEventListener('click', async event => {
        const editButton = event.target.closest('[data-edit-material]');
        const deleteButton = event.target.closest('[data-delete-material]');
        if (editButton) openMaterialDialog(materials.find(item => item.id === editButton.dataset.editMaterial));
        if (deleteButton) {
            const material = materials.find(item => item.id === deleteButton.dataset.deleteMaterial);
            if (!material || (typeof confirmAction === 'function' && !await confirmAction(`ลบวัสดุ “${material.name}” หรือไม่`, 'ลบวัสดุ'))) return;
            const { error } = await supabase.from('material_library').delete().eq('id', material.id);
            if (error) {
                setMessage('materialMessage', friendlyError(error), 'error');
                return;
            }
            if (material.image_path) await supabase.storage.from(imageBucket).remove([material.image_path]);
            await loadData();
        }
    });

    byId('addSiteSurveyBtn').addEventListener('click', () => openSurveyDialog());
    byId('addMaterialBtn').addEventListener('click', () => openMaterialDialog());
    byId('cancelSiteSurveyBtn').addEventListener('click', () => surveyDialog.close());
    byId('cancelMaterialBtn').addEventListener('click', () => materialDialog.close());
    byId('siteSurveySearch').addEventListener('input', renderSurveys);
    byId('materialSearch').addEventListener('input', renderMaterials);
    byId('materialCategoryFilter').addEventListener('change', renderMaterials);
    materialDialog.addEventListener('close', clearMaterialPreview);

    async function setUser(user) {
        currentUser = user || null;
        if (!currentUser) {
            loadedUserId = null;
            surveys = [];
            materials = [];
            renderSurveys();
            renderMaterials();
            return;
        }
        if (loadedUserId === currentUser.id) return;
        loadedUserId = currentUser.id;
        await loadData();
    }

    window.addEventListener('pdfmagic:auth', event => setUser(event.detail.user));
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    renderSurveys();
    renderMaterials();
})();
