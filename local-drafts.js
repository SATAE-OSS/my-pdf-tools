const LOCAL_DB_NAME = 'pdf-magic-local';
const LOCAL_STORE_NAME = 'drafts';
const localDraftsContainer = document.getElementById('localDrafts');
const saveLocalDraftBtn = document.getElementById('saveLocalDraftBtn');
const clearLocalDraftsBtn = document.getElementById('clearLocalDraftsBtn');

function openLocalDraftDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(LOCAL_DB_NAME, 1);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(LOCAL_STORE_NAME)) {
                database.createObjectStore(LOCAL_STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function runLocalDraftTransaction(mode, operation) {
    const database = await openLocalDraftDatabase();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(LOCAL_STORE_NAME, mode);
        const store = transaction.objectStore(LOCAL_STORE_NAME);
        const request = operation(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => database.close();
    });
}

function getAllLocalDrafts() {
    return runLocalDraftTransaction('readonly', store => store.getAll());
}

function putLocalDraft(draft) {
    return runLocalDraftTransaction('readwrite', store => store.put(draft));
}

function removeLocalDraft(id) {
    return runLocalDraftTransaction('readwrite', store => store.delete(id));
}

function clearLocalDraftDatabase() {
    return runLocalDraftTransaction('readwrite', store => store.clear());
}

async function renderLocalDrafts() {
    try {
        const drafts = (await getAllLocalDrafts()).sort((a, b) => b.updatedAt - a.updatedAt);
        localDraftsContainer.innerHTML = '';
        if (!drafts.length) {
            localDraftsContainer.innerHTML = '<p class="drawing-placeholder">ยังไม่มีงานที่เก็บในเครื่อง</p>';
            return;
        }

        drafts.forEach(draft => {
            const card = document.createElement('article');
            card.className = 'saved-drawing-card';
            const image = document.createElement('img');
            image.src = draft.image;
            image.alt = draft.title;

            const info = document.createElement('div');
            info.className = 'saved-drawing-info';
            const title = document.createElement('strong');
            title.textContent = draft.title;
            const date = document.createElement('small');
            date.textContent = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
                .format(new Date(draft.updatedAt));
            info.append(title, date);

            const actions = document.createElement('div');
            actions.className = 'saved-drawing-actions';
            const openButton = document.createElement('button');
            openButton.className = 'text-btn';
            openButton.type = 'button';
            openButton.textContent = 'เปิดวาดต่อ';
            openButton.addEventListener('click', async () => {
                recordCanvasHistory();
                await drawCanvasSnapshot(draft.image);
                canvasBackground.value = draft.background || 'white';
                canvas.classList.toggle('transparent-canvas', canvasBackground.value === 'transparent');
                canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            const deleteButton = document.createElement('button');
            deleteButton.className = 'text-btn danger';
            deleteButton.type = 'button';
            deleteButton.textContent = 'ลบ';
            deleteButton.addEventListener('click', async () => {
                if (!await confirmAction(`ภาพ “${draft.title}” จะถูกลบจากอุปกรณ์นี้และกู้คืนไม่ได้`)) return;
                await removeLocalDraft(draft.id);
                renderLocalDrafts();
            });
            actions.append(openButton, deleteButton);
            card.append(image, info, actions);
            localDraftsContainer.appendChild(card);
        });
    } catch (error) {
        localDraftsContainer.innerHTML = '<p class="drawing-placeholder">เบราว์เซอร์นี้ไม่รองรับการเก็บงานในเครื่อง</p>';
        console.error('โหลดงานในเครื่องไม่สำเร็จ:', error);
    }
}

saveLocalDraftBtn.addEventListener('click', async () => {
    const defaultTitle = `ภาพร่าง ${new Intl.DateTimeFormat('th-TH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`;
    const title = prompt('ตั้งชื่องานที่เก็บในเครื่อง', defaultTitle)?.trim();
    if (!title) return;
    saveLocalDraftBtn.disabled = true;
    try {
        await putLocalDraft({
            id: crypto.randomUUID(),
            title: title.slice(0, 80),
            image: canvas.toDataURL('image/png'),
            background: canvasBackground.value,
            updatedAt: Date.now()
        });
        await renderLocalDrafts();
    } finally {
        saveLocalDraftBtn.disabled = false;
    }
});

clearLocalDraftsBtn.addEventListener('click', async () => {
    if (!await confirmAction('งานที่เก็บในเครื่องทั้งหมดจะถูกลบและกู้คืนไม่ได้', 'ล้างทั้งหมด')) return;
    await clearLocalDraftDatabase();
    renderLocalDrafts();
});

renderLocalDrafts();
