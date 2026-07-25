(() => {
    'use strict';

    const supabase = window.pdfMagicSupabase;
    if (!supabase) return;

    const byId = id => document.getElementById(id);
    const petDialog = byId('petDialog');
    const petForm = byId('petForm');
    const closetDialog = byId('petClosetDialog');
    const avatar = byId('dashboardPetAvatar');
    const petImage = byId('dashboardPetImage');
    const speciesNames = { pig: 'หมู', dog: 'หมา', cat: 'แมว', rabbit: 'กระต่าย', capybara: 'คาปิบาร่า' };
    const defaultNames = { pig: 'โมจิ', dog: 'บ๊อบบี้', cat: 'มีตังค์', rabbit: 'ปุยเมฆ', capybara: 'กะปิ' };
    const closetItems = [
        { id: '', icon: '✨', name: 'ไม่ใส่ของแต่ง', price: 0 },
        { id: 'ribbon', icon: '🎀', name: 'โบว์ชมพู', price: 8 },
        { id: 'glasses', icon: '🕶️', name: 'แว่นเท่', price: 12 },
        { id: 'hat', icon: '🎓', name: 'หมวกรับปริญญา', price: 15 }
    ];
    let user = null;
    let pet = null;
    let selectedSpecies = 'pig';
    let audioContext = null;

    function setMessage(id, text = '', type = '') {
        const element = byId(id);
        element.textContent = text;
        element.className = `planner-message ${type}`.trim();
    }

    function friendlyError(error) {
        const detail = error?.message || '';
        if (/relation.*study_pets.*does not exist|function.*reward_pet_for_homework.*does not exist/i.test(detail)) {
            return 'ต้องอัปเดตฐานข้อมูลสัตว์เลี้ยงก่อน กรุณารัน supabase-setup.sql รุ่นล่าสุด';
        }
        return detail || 'บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง';
    }

    function playPetSound(frequency = 540) {
        try {
            audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') audioContext.resume();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, audioContext.currentTime + .12);
            gain.gain.setValueAtTime(.035, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .18);
            oscillator.connect(gain).connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + .19);
        } catch (_) {}
    }

    function animatePet(className) {
        avatar.classList.remove('pet-bounce', 'pet-fed');
        void avatar.offsetWidth;
        avatar.classList.add(className);
        setTimeout(() => avatar.classList.remove(className), 900);
    }

    function petMoodText() {
        if (!pet) return 'ทำการบ้านสำเร็จเพื่อรับกลีบดอกไม้ แล้วนำมาให้อาหารหรือปลดล็อกของแต่ง';
        if (pet.happiness >= 90) return `${pet.name} อารมณ์ดีสุด ๆ พร้อมอยู่เป็นเพื่อนตอนทำงาน`;
        if (pet.happiness >= 65) return `${pet.name} กำลังนั่งรอให้ลูบหัวอยู่ตรงนี้`;
        return `${pet.name} อยากได้กำลังใจนิดหน่อย ลองลูบหัวหรือให้อาหารดูนะ`;
    }

    function renderPet() {
        const hasPet = Boolean(pet);
        avatar.className = `pet-avatar ${hasPet ? pet.species : 'pet-empty'}`;
        petImage.src = `assets/pets/${hasPet ? pet.species : 'pig'}.webp`;
        avatar.dataset.accessory = pet?.equipped_accessory || '';
        avatar.setAttribute('aria-label', hasPet ? `${speciesNames[pet.species]}ชื่อ ${pet.name}` : 'ยังไม่ได้เลือกสัตว์เลี้ยง');
        byId('studyPetName').textContent = hasPet ? `${pet.name} · ${speciesNames[pet.species]}คู่เรียน` : 'รับสัตว์เลี้ยงคู่เรียนกันไหม?';
        byId('studyPetMessage').textContent = petMoodText();
        byId('petStatusRow').hidden = !hasPet;
        byId('petPetBtn').hidden = !hasPet;
        byId('feedPetBtn').hidden = !hasPet;
        byId('petClosetBtn').hidden = !hasPet;
        byId('choosePetBtn').textContent = hasPet ? 'เปลี่ยนตัว/ชื่อ' : 'เลือกสัตว์เลี้ยง';
        if (hasPet) {
            byId('petPetals').textContent = pet.petals;
            byId('petHappiness').textContent = pet.happiness;
        }
    }

    function openPetDialog() {
        selectedSpecies = pet?.species || 'pig';
        byId('petNameInput').value = pet?.name || defaultNames[selectedSpecies];
        document.querySelectorAll('[data-pet-species]').forEach(button => button.classList.toggle('active', button.dataset.petSpecies === selectedSpecies));
        byId('petDialogTitle').textContent = pet ? 'เปลี่ยนเพื่อนคู่เรียน' : 'เลือกเพื่อนคู่เรียน';
        setMessage('petFormMessage');
        petDialog.showModal();
    }

    function renderCloset() {
        const owned = new Set(pet?.owned_accessories || []);
        byId('petClosetGrid').innerHTML = closetItems.map(item => {
            const unlocked = !item.id || owned.has(item.id);
            const equipped = (pet?.equipped_accessory || '') === item.id;
            return `<button class="pet-closet-item ${equipped ? 'equipped' : ''}" type="button" data-closet-item="${item.id}">
                <span>${item.icon}</span><div><strong>${item.name}</strong><small>${equipped ? 'กำลังสวมอยู่' : unlocked ? 'ปลดล็อกแล้ว' : 'แตะเพื่อปลดล็อก'}</small></div>
                <em>${unlocked ? equipped ? '✓' : 'ใส่' : `${item.price} 🌸`}</em>
            </button>`;
        }).join('');
    }

    async function loadPet() {
        if (!user) return;
        const { data, error } = await supabase.from('study_pets').select('*').maybeSingle();
        if (error) {
            byId('studyPetMessage').textContent = friendlyError(error);
            return;
        }
        pet = data || null;
        renderPet();
    }

    async function updatePet(changes) {
        if (!pet) return false;
        const { data, error } = await supabase.from('study_pets').update(changes).eq('user_id', user.id).select().single();
        if (error) {
            byId('studyPetMessage').textContent = friendlyError(error);
            return false;
        }
        pet = data;
        renderPet();
        return true;
    }

    document.querySelectorAll('[data-pet-species]').forEach(button => button.addEventListener('click', () => {
        selectedSpecies = button.dataset.petSpecies;
        document.querySelectorAll('[data-pet-species]').forEach(item => item.classList.toggle('active', item === button));
        if (!pet || byId('petNameInput').value === defaultNames[pet.species]) byId('petNameInput').value = defaultNames[selectedSpecies];
    }));

    petForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!user) return;
        const payload = {
            user_id: user.id,
            species: selectedSpecies,
            name: byId('petNameInput').value.trim(),
            petals: pet?.petals ?? 10,
            happiness: pet?.happiness ?? 75,
            owned_accessories: pet?.owned_accessories || [],
            equipped_accessory: pet?.equipped_accessory || ''
        };
        byId('savePetBtn').disabled = true;
        const { data, error } = await supabase.from('study_pets').upsert(payload, { onConflict: 'user_id' }).select().single();
        byId('savePetBtn').disabled = false;
        if (error) {
            setMessage('petFormMessage', friendlyError(error), 'error');
            return;
        }
        pet = data;
        petDialog.close();
        renderPet();
        animatePet('pet-bounce');
        playPetSound(580);
    });

    byId('petPetBtn').addEventListener('click', async () => {
        if (!pet) return;
        const lastPetted = pet.petted_at ? new Date(pet.petted_at).getTime() : 0;
        if (Date.now() - lastPetted < 10000) {
            byId('studyPetMessage').textContent = `${pet.name} เคลิ้มแล้ว รอสักนิดค่อยลูบอีกทีนะ`;
            animatePet('pet-bounce');
            return;
        }
        if (await updatePet({ happiness: Math.min(100, pet.happiness + 3), petted_at: new Date().toISOString() })) {
            animatePet('pet-bounce');
            playPetSound(620);
        }
    });

    byId('feedPetBtn').addEventListener('click', async () => {
        if (!pet) return;
        if (pet.petals < 2) {
            byId('studyPetMessage').textContent = 'กลีบดอกไม้ยังไม่พอ ทำการบ้านสำเร็จแล้วจะได้รับเพิ่มนะ';
            return;
        }
        if (await updatePet({ petals: pet.petals - 2, happiness: Math.min(100, pet.happiness + 10), fed_at: new Date().toISOString() })) {
            animatePet('pet-fed');
            playPetSound(460);
        }
    });

    byId('petClosetGrid').addEventListener('click', async event => {
        const button = event.target.closest('[data-closet-item]');
        if (!button || !pet) return;
        const item = closetItems.find(entry => entry.id === button.dataset.closetItem);
        const owned = new Set(pet.owned_accessories || []);
        if (item.id && !owned.has(item.id)) {
            if (pet.petals < item.price) {
                setMessage('petClosetMessage', `ต้องใช้ ${item.price} กลีบ ตอนนี้มี ${pet.petals} กลีบ`, 'error');
                return;
            }
            owned.add(item.id);
            const success = await updatePet({
                petals: pet.petals - item.price,
                owned_accessories: [...owned],
                equipped_accessory: item.id
            });
            if (!success) return;
            setMessage('petClosetMessage', `ปลดล็อก${item.name}แล้ว`, 'success');
        } else {
            if (!await updatePet({ equipped_accessory: item.id })) return;
            setMessage('petClosetMessage', item.id ? `ใส่${item.name}แล้ว` : 'ถอดของแต่งแล้ว', 'success');
        }
        renderCloset();
        animatePet('pet-bounce');
    });

    byId('choosePetBtn').addEventListener('click', openPetDialog);
    byId('cancelPetBtn').addEventListener('click', () => petDialog.close());
    byId('petClosetBtn').addEventListener('click', () => {
        renderCloset();
        setMessage('petClosetMessage');
        closetDialog.showModal();
    });
    byId('closePetClosetBtn').addEventListener('click', () => closetDialog.close());
    window.addEventListener('jane:pet-updated', loadPet);
    window.addEventListener('pdfmagic:auth', event => {
        user = event.detail.user || null;
        pet = null;
        renderPet();
        if (user) loadPet();
    });
    supabase.auth.getSession().then(({ data }) => {
        user = data.session?.user || null;
        if (user) loadPet();
    });
    renderPet();
})();
