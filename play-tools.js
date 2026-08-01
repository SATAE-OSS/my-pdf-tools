(() => {
    'use strict';

    const canvas = document.getElementById('miniRoomCanvas');
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
    const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    const storageKey = 'jane-mini-room-v4';
    const previousStorageKey = 'jane-mini-room-v3';
    const legacyStorageKey = 'jane-mini-room-v2';
    const definitions = {
        sofa: { width: 220, height: 94, color: '#de8fb5', label: 'โซฟา', icon: '🛋️' },
        loveseat: { width: 160, height: 88, color: '#d8a0bd', label: 'โซฟาเล็ก', icon: '🛋️' },
        armchair: { width: 92, height: 92, color: '#dfa0bd', label: 'อาร์มแชร์', icon: '🪑' },
        chair: { width: 72, height: 72, color: '#c88570', label: 'เก้าอี้', icon: '🪑' },
        bench: { width: 150, height: 55, color: '#d3a47d', label: 'ม้านั่ง', icon: '▰' },
        stool: { width: 58, height: 58, color: '#c99775', label: 'สตูล', icon: '◉', round: true },
        coffeeTable: { width: 120, height: 78, color: '#c99d78', label: 'โต๊ะกลาง', icon: '◯', round: true },
        sideTable: { width: 62, height: 62, color: '#bd8e6a', label: 'โต๊ะข้าง', icon: '◉', round: true },
        bed: { width: 180, height: 230, color: '#9ba9dd', label: 'เตียงคู่', icon: '🛏️', bed: true },
        singleBed: { width: 112, height: 225, color: '#aab7e4', label: 'เตียงเดี่ยว', icon: '🛏️', bed: true },
        nightstand: { width: 65, height: 58, color: '#c69b79', label: 'โต๊ะหัวเตียง', icon: '▣' },
        wardrobe: { width: 155, height: 64, color: '#bc9576', label: 'ตู้เสื้อผ้า', icon: '🚪', storage: true },
        dresser: { width: 130, height: 58, color: '#caa281', label: 'ตู้ลิ้นชัก', icon: '▤', storage: true },
        vanity: { width: 125, height: 58, color: '#d6a4bd', label: 'โต๊ะเครื่องแป้ง', icon: '🪞' },
        desk: { width: 165, height: 75, color: '#c99f7c', label: 'โต๊ะทำงาน', icon: '🖥️' },
        officeChair: { width: 72, height: 78, color: '#8b8ea7', label: 'เก้าอี้ทำงาน', icon: '💺' },
        diningTable: { width: 160, height: 110, color: '#c28f68', label: 'โต๊ะอาหาร', icon: '🍽️', round: true },
        shelf: { width: 135, height: 48, color: '#b68b6b', label: 'ชั้นวาง', icon: '▥', storage: true },
        bookcase: { width: 170, height: 52, color: '#ab8166', label: 'ตู้หนังสือ', icon: '📚', storage: true },
        cabinet: { width: 120, height: 62, color: '#b99578', label: 'ตู้เก็บของ', icon: '▥', storage: true },
        tvConsole: { width: 170, height: 48, color: '#aa826e', label: 'ชั้นทีวี', icon: '▰' },
        rug: { width: 275, height: 175, color: '#e9b5c8', label: 'พรม', icon: '▰', rug: true },
        plant: { width: 82, height: 82, color: '#69b58a', label: 'ต้นไม้', icon: '🪴', plant: true },
        lamp: { width: 60, height: 60, color: '#ffd97d', label: 'โคมไฟ', icon: '💡', lamp: true },
        mirror: { width: 105, height: 52, color: '#bde1e8', label: 'กระจก', icon: '🪞', glass: true },
        tv: { width: 140, height: 45, color: '#4d5360', label: 'ทีวี', icon: '📺', screen: true },
        art: { width: 105, height: 42, color: '#eaa3ba', label: 'รูปติดผนัง', icon: '🖼️' },
        door: { width: 125, height: 24, color: '#b98968', label: 'ประตู', icon: '🚪', door: true },
        window: { width: 145, height: 22, color: '#8fd0df', label: 'หน้าต่าง', icon: '🪟', glass: true },
        partition: { width: 180, height: 22, color: '#d3b99c', label: 'ฉากกั้น', icon: '▯', storage: true },
        floorLamp: { width: 68, height: 68, color: '#f2bf69', label: 'โคมตั้งพื้น', icon: '🏮', lamp: true }
    };

    const makeItem = (type, x, y, extra = {}) => ({
        id: uid(),
        type,
        x,
        y,
        rotation: 0,
        scale: 1,
        ...extra
    });
    const presets = {
        blank: () => [],
        living: () => [
            makeItem('rug', 455, 335, { scale: 1.25 }),
            makeItem('sofa', 455, 185),
            makeItem('coffeeTable', 455, 330),
            makeItem('armchair', 270, 335, { rotation: 90 }),
            makeItem('armchair', 640, 335, { rotation: -90 }),
            makeItem('tvConsole', 455, 510),
            makeItem('tv', 455, 475),
            makeItem('plant', 740, 170),
            makeItem('floorLamp', 180, 185)
        ],
        bedroom: () => [
            makeItem('rug', 455, 355, { rotation: 90, scale: 1.15 }),
            makeItem('bed', 455, 305),
            makeItem('nightstand', 300, 205),
            makeItem('nightstand', 610, 205),
            makeItem('wardrobe', 725, 480, { rotation: 90 }),
            makeItem('dresser', 205, 470, { rotation: 90 }),
            makeItem('mirror', 245, 470, { rotation: 90 }),
            makeItem('plant', 720, 150)
        ],
        studio: () => [
            makeItem('rug', 455, 330, { scale: 1.15 }),
            makeItem('desk', 455, 175),
            makeItem('officeChair', 455, 275),
            makeItem('bookcase', 700, 210, { rotation: 90 }),
            makeItem('cabinet', 700, 440, { rotation: 90 }),
            makeItem('loveseat', 280, 455),
            makeItem('sideTable', 405, 455),
            makeItem('lamp', 405, 455),
            makeItem('plant', 185, 170)
        ]
    };
    const localizeItems = (items, widthMeters = 6, lengthMeters = 4) => items.map(item => ({
        ...item,
        mx: clamp(((item.x ?? 450) - 38) / 824 * widthMeters, 0, widthMeters),
        my: clamp(((item.y ?? 310) - 38) / 544 * lengthMeters, 0, lengthMeters)
    }));
    const defaultRoom = (name = 'ห้องนั่งเล่น', items = presets.living(), position = {}) => ({
        id: uid(),
        name,
        widthMeters: 6,
        lengthMeters: 4,
        xMeters: position.xMeters ?? 0,
        yMeters: position.yMeters ?? 0,
        floor: '#eadbc7',
        wall: '#fff8f2',
        items: localizeItems(items)
    });
    const normalizeProject = saved => {
        if (!Array.isArray(saved?.rooms) || !saved.rooms.length) return null;
        let nextX = 0;
        const rooms = saved.rooms.map((entry, index) => {
            const widthMeters = clamp(Number(entry.widthMeters) || 6, 2, 20);
            const lengthMeters = clamp(Number(entry.lengthMeters) || 4, 2, 20);
            const xMeters = Number.isFinite(Number(entry.xMeters)) ? Number(entry.xMeters) : nextX;
            const yMeters = Number.isFinite(Number(entry.yMeters)) ? Number(entry.yMeters) : 0;
            nextX = Math.max(nextX, xMeters + widthMeters);
            return {
                ...entry,
                id: entry.id || uid(),
                name: entry.name || `ห้อง ${index + 1}`,
                widthMeters,
                lengthMeters,
                xMeters,
                yMeters,
                floor: entry.floor || '#eadbc7',
                wall: entry.wall || '#fff8f2',
                items: (entry.items || []).map(item => item.mx != null && item.my != null ? item : localizeItems([item], widthMeters, lengthMeters)[0])
            };
        });
        return { activeRoomId: rooms.some(entry => entry.id === saved.activeRoomId) ? saved.activeRoomId : rooms[0].id, rooms };
    };
    const loadProject = () => {
        try {
            const saved = normalizeProject(JSON.parse(localStorage.getItem(storageKey)));
            if (saved) return saved;
            const previous = normalizeProject(JSON.parse(localStorage.getItem(previousStorageKey)));
            if (previous) return previous;
            const legacy = JSON.parse(localStorage.getItem(legacyStorageKey));
            if (legacy?.items && Array.isArray(legacy.items)) {
                return normalizeProject({
                    activeRoomId: 'legacy-room',
                    rooms: [{ ...legacy, id: 'legacy-room', name: 'ห้องนั่งเล่น', widthMeters: 6, lengthMeters: 4 }]
                });
            }
        } catch (_) {}
        const firstRoom = defaultRoom();
        return { activeRoomId: firstRoom.id, rooms: [firstRoom] };
    };

    let project = loadProject();
    let room = project.rooms.find(entry => entry.id === project.activeRoomId) || project.rooms[0];
    project.activeRoomId = room.id;
    let selectedId = room.items.at(-1)?.id || null;
    const pointers = new Map();
    let gesture = null;
    let selectionControls = [];
    let roomMoveControls = [];
    let frozenView = null;
    const itemCount = document.getElementById('roomItemCount');
    const dimensionBadge = document.getElementById('roomDimensionBadge');
    const message = document.getElementById('roomBuilderMessage');
    const selected = () => room.items.find(item => item.id === selectedId);
    const save = () => {
        try { localStorage.setItem(storageKey, JSON.stringify(project)); } catch (_) {}
    };
    const setMessage = text => { if (message) message.textContent = text; };
    const shade = (hex, amount) => {
        const value = parseInt(hex.replace('#', ''), 16);
        const r = clamp((value >> 16) + amount, 0, 255);
        const g = clamp(((value >> 8) & 255) + amount, 0, 255);
        const b = clamp((value & 255) + amount, 0, 255);
        return `rgb(${r}, ${g}, ${b})`;
    };
    const roundedRect = (ctx, x, y, width, height, radius) => {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, r);
    };
    const canvasPoint = event => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height
        };
    };
    let currentView = null;
    function computeView() {
        const minimumX = Math.min(...project.rooms.map(entry => entry.xMeters));
        const minimumY = Math.min(...project.rooms.map(entry => entry.yMeters));
        const maximumX = Math.max(...project.rooms.map(entry => entry.xMeters + entry.widthMeters));
        const maximumY = Math.max(...project.rooms.map(entry => entry.yMeters + entry.lengthMeters));
        const planWidth = Math.max(1, maximumX - minimumX);
        const planHeight = Math.max(1, maximumY - minimumY);
        const padding = 82;
        const pixelsPerMeter = Math.min((canvas.width - padding * 2) / planWidth, (canvas.height - padding * 2) / planHeight, 138);
        const drawnWidth = planWidth * pixelsPerMeter;
        const drawnHeight = planHeight * pixelsPerMeter;
        return {
            minimumX,
            minimumY,
            pixelsPerMeter,
            offsetX: (canvas.width - drawnWidth) / 2,
            offsetY: (canvas.height - drawnHeight) / 2
        };
    }
    const roomBounds = (entry, view = currentView) => ({
        x: view.offsetX + (entry.xMeters - view.minimumX) * view.pixelsPerMeter,
        y: view.offsetY + (entry.yMeters - view.minimumY) * view.pixelsPerMeter,
        width: entry.widthMeters * view.pixelsPerMeter,
        height: entry.lengthMeters * view.pixelsPerMeter
    });
    const itemCanvasPoint = (entry, item, view = currentView) => {
        const bounds = roomBounds(entry, view);
        return { x: bounds.x + item.mx * view.pixelsPerMeter, y: bounds.y + item.my * view.pixelsPerMeter };
    };
    const furniturePixelScale = () => currentView.pixelsPerMeter / (824 / 6);

    function syncRoomEditor() {
        document.getElementById('roomNameInput').value = room.name || 'ห้อง';
        document.getElementById('roomWidthInput').value = room.widthMeters;
        document.getElementById('roomLengthInput').value = room.lengthMeters;
        document.getElementById('roomRemoveBtn').disabled = project.rooms.length <= 1;
        document.getElementById('roomTabs').innerHTML = project.rooms.map((entry, index) => `
            <button type="button" role="tab" aria-selected="${entry.id === room.id}" class="${entry.id === room.id ? 'active' : ''}" data-room-id="${entry.id}">
                ${escapeHtml(entry.name || `ห้อง ${index + 1}`)} · ${entry.widthMeters}×${entry.lengthMeters} ม.
            </button>`).join('');
    }

    function mapPresetToCurrentRoom(items) {
        return localizeItems(items, room.widthMeters, room.lengthMeters);
    }

    function drawItem(item, isSelected, ownerRoom) {
        const definition = definitions[item.type];
        if (!definition) return;
        const { width, height } = definition;
        const color = item.color || definition.color;
        context.save();
        const point = itemCanvasPoint(ownerRoom, item);
        context.translate(point.x, point.y);
        context.rotate(item.rotation * Math.PI / 180);
        const displayScale = item.scale * furniturePixelScale();
        context.scale(item.flipX ? -displayScale : displayScale, displayScale);
        context.shadowColor = 'rgba(66, 43, 57, .2)';
        context.shadowBlur = 13;
        context.shadowOffsetY = 6;

        if (definition.rug) {
            roundedRect(context, -width / 2, -height / 2, width, height, 25);
            context.fillStyle = color;
            context.globalAlpha = .7;
            context.fill();
            context.globalAlpha = 1;
            context.shadowColor = 'transparent';
            context.strokeStyle = 'rgba(255,255,255,.7)';
            context.lineWidth = 5;
            context.setLineDash([15, 10]);
            roundedRect(context, -width / 2 + 11, -height / 2 + 11, width - 22, height - 22, 18);
            context.stroke();
            context.setLineDash([]);
        } else if (definition.plant) {
            context.beginPath();
            context.arc(0, 0, 28, 0, Math.PI * 2);
            context.fillStyle = '#b78366';
            context.fill();
            context.shadowColor = 'transparent';
            for (let index = 0; index < 8; index++) {
                context.save();
                context.rotate(index * Math.PI / 4);
                context.beginPath();
                context.ellipse(0, -24, 12, 28, 0, 0, Math.PI * 2);
                context.fillStyle = index % 2 ? shade(color, 18) : color;
                context.fill();
                context.restore();
            }
        } else if (definition.lamp) {
            context.beginPath();
            context.arc(0, 0, width / 2, 0, Math.PI * 2);
            context.fillStyle = 'rgba(255,220,111,.3)';
            context.fill();
            context.beginPath();
            context.arc(0, 0, width / 3, 0, Math.PI * 2);
            context.fillStyle = color;
            context.fill();
        } else if (definition.round) {
            context.beginPath();
            context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
            context.fillStyle = color;
            context.fill();
            context.shadowColor = 'transparent';
            context.strokeStyle = shade(color, -25);
            context.lineWidth = 4;
            context.stroke();
        } else if (definition.door) {
            context.shadowColor = 'transparent';
            context.fillStyle = color;
            context.fillRect(-width / 2, -height / 2, width, height);
            context.strokeStyle = shade(color, -35);
            context.lineWidth = 3;
            context.beginPath();
            context.arc(-width / 2, 0, width, -Math.PI / 2, 0);
            context.stroke();
        } else {
            roundedRect(context, -width / 2, -height / 2, width, height, definition.glass ? 6 : 16);
            context.fillStyle = color;
            context.fill();
            context.shadowColor = 'transparent';
            context.strokeStyle = definition.screen ? '#252a33' : shade(color, -25);
            context.lineWidth = 4;
            context.stroke();
            if (definition.bed) {
                context.fillStyle = '#fff7fa';
                roundedRect(context, -width / 2 + 9, -height / 2 + 10, width - 18, 55, 12);
                context.fill();
                context.fillStyle = shade(color, 22);
                roundedRect(context, -width / 2 + 10, -height / 2 + 72, width - 20, height - 82, 13);
                context.fill();
            } else if (definition.storage) {
                context.strokeStyle = shade(color, -35);
                context.lineWidth = 3;
                [-.25, .25].forEach(part => {
                    context.beginPath();
                    context.moveTo(-width / 2 + 9, height * part);
                    context.lineTo(width / 2 - 9, height * part);
                    context.stroke();
                });
            } else if (item.type.includes('sofa') || item.type === 'armchair' || item.type === 'chair') {
                context.fillStyle = shade(color, 20);
                roundedRect(context, -width / 2 + 13, -height / 2 + 13, width - 26, height - 26, 13);
                context.fill();
            }
        }

        if (!definition.rug && !definition.plant && !definition.lamp && !definition.bed && width >= 58) {
            context.shadowColor = 'transparent';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.font = `${Math.min(26, Math.max(15, height * .31))}px sans-serif`;
            context.fillStyle = definition.screen ? '#fff' : 'rgba(76, 51, 63, .78)';
            context.fillText(definition.icon, 0, 0);
        }
        if (isSelected) {
            context.shadowColor = 'transparent';
            context.strokeStyle = '#d25094';
            context.lineWidth = 4 / displayScale;
            context.setLineDash([10 / displayScale, 7 / displayScale]);
            roundedRect(context, -width / 2 - 10, -height / 2 - 10, width + 20, height + 20, 14);
            context.stroke();
            context.setLineDash([]);
        }
        context.restore();
    }

    function drawSelectionControls(item) {
        selectionControls = [];
        if (!item) return;
        const definition = definitions[item.type];
        if (!definition) return;
        const displayScale = item.scale * furniturePixelScale();
        const radians = item.rotation * Math.PI / 180;
        const halfWidth = (Math.abs(Math.cos(radians)) * definition.width + Math.abs(Math.sin(radians)) * definition.height) * displayScale / 2;
        const halfHeight = (Math.abs(Math.sin(radians)) * definition.width + Math.abs(Math.cos(radians)) * definition.height) * displayScale / 2;
        const displayWidth = canvas.getBoundingClientRect().width || canvas.width;
        const touchScale = canvas.width / displayWidth;
        const radius = clamp(18 * touchScale, 20, 46);
        const gap = radius * 2 + 7 * touchScale;
        const controls = [
            { action: 'flip', icon: '↔', label: 'พลิก' },
            { action: 'rotate', icon: '↻', label: 'หมุน' },
            { action: 'shrink', icon: '−', label: 'ย่อ' },
            { action: 'grow', icon: '+', label: 'ขยาย' },
            { action: 'delete', icon: '×', label: 'ลบ', danger: true }
        ];
        const toolbarWidth = gap * (controls.length - 1);
        const itemPoint = itemCanvasPoint(room, item);
        const centerX = clamp(itemPoint.x, toolbarWidth / 2 + radius + 8, canvas.width - toolbarWidth / 2 - radius - 8);
        let centerY = itemPoint.y - halfHeight - radius * 1.65;
        if (centerY - radius < 8) centerY = itemPoint.y + halfHeight + radius * 1.65;
        centerY = clamp(centerY, radius + 8, canvas.height - radius - 8);

        context.save();
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        controls.forEach((control, index) => {
            const x = centerX - toolbarWidth / 2 + index * gap;
            selectionControls.push({ ...control, x, y: centerY, radius: radius * 1.18 });
            context.beginPath();
            context.arc(x, centerY, radius, 0, Math.PI * 2);
            context.fillStyle = control.danger ? '#df6078' : '#fff8fc';
            context.shadowColor = 'rgba(71,42,59,.24)';
            context.shadowBlur = 10 * touchScale;
            context.shadowOffsetY = 3 * touchScale;
            context.fill();
            context.shadowColor = 'transparent';
            context.lineWidth = Math.max(2, 2 * touchScale);
            context.strokeStyle = control.danger ? '#fff' : '#d35d96';
            context.stroke();
            context.fillStyle = control.danger ? '#fff' : '#a84d78';
            context.font = `700 ${Math.round(radius * 1.2)}px sans-serif`;
            context.fillText(control.icon, x, centerY + radius * .03);
        });
        context.restore();
    }

    function drawRoomMoveControl(entry, bounds) {
        if (entry.id !== room.id) return;
        const displayWidth = canvas.getBoundingClientRect().width || canvas.width;
        const touchScale = canvas.width / displayWidth;
        const radius = clamp(17 * touchScale, 20, 42);
        const x = clamp(bounds.x + bounds.width - radius - 9, radius + 7, canvas.width - radius - 7);
        const y = clamp(bounds.y + radius + 9, radius + 7, canvas.height - radius - 7);
        roomMoveControls.push({ roomId: entry.id, x, y, radius: radius * 1.3 });
        context.save();
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = '#fff8fc';
        context.shadowColor = 'rgba(71,42,59,.25)';
        context.shadowBlur = 10 * touchScale;
        context.shadowOffsetY = 3 * touchScale;
        context.fill();
        context.shadowColor = 'transparent';
        context.lineWidth = Math.max(2, 2 * touchScale);
        context.strokeStyle = '#d65395';
        context.stroke();
        context.fillStyle = '#a84d78';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `700 ${Math.round(radius * 1.15)}px sans-serif`;
        context.fillText('✥', x, y + radius * .04);
        context.restore();
    }

    function controlAt(point) {
        return selectionControls.find(control => Math.hypot(point.x - control.x, point.y - control.y) <= control.radius) || null;
    }

    function roomMoveControlAt(point) {
        return roomMoveControls.find(control => Math.hypot(point.x - control.x, point.y - control.y) <= control.radius) || null;
    }

    function runSelectionControl(action) {
        const item = selected();
        if (!item) return;
        const messages = { flip: 'พลิกชิ้นที่เลือกแล้ว', rotate: 'หมุนชิ้นที่เลือก 15°', shrink: 'ย่อชิ้นที่เลือกแล้ว', grow: 'ขยายชิ้นที่เลือกแล้ว', delete: 'ลบชิ้นที่เลือกแล้ว' };
        if (action === 'flip') item.flipX = !item.flipX;
        if (action === 'rotate') item.rotation += 15;
        if (action === 'shrink') item.scale -= .1;
        if (action === 'grow') item.scale += .1;
        if (action === 'delete') {
            room.items = room.items.filter(entry => entry.id !== selectedId);
            selectedId = null;
        } else {
            constrain(item);
        }
        save();
        draw();
        setMessage(messages[action]);
    }

    function updateControls() {
        const disabled = !selected();
        document.querySelectorAll('[data-furniture-color]').forEach(button => {
            button.disabled = disabled;
            button.classList.toggle('active', !disabled && selected().color === button.dataset.furnitureColor);
        });
        if (itemCount) itemCount.textContent = `${room.items.length} ชิ้น`;
        if (dimensionBadge) dimensionBadge.textContent = `${room.name} ${room.widthMeters} × ${room.lengthMeters} ม.`;
    }

    function draw(showSelection = true) {
        currentView = frozenView || computeView();
        roomMoveControls = [];
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#f8f1f5';
        context.fillRect(0, 0, canvas.width, canvas.height);
        project.rooms.forEach(entry => {
            const bounds = roomBounds(entry);
            const active = entry.id === room.id;
            context.save();
            context.shadowColor = active ? 'rgba(210,80,148,.28)' : 'rgba(62,42,52,.14)';
            context.shadowBlur = active ? 20 : 12;
            context.fillStyle = entry.floor;
            context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
            context.shadowColor = 'transparent';
            context.beginPath();
            context.rect(bounds.x, bounds.y, bounds.width, bounds.height);
            context.clip();
            context.strokeStyle = 'rgba(108,79,59,.11)';
            context.lineWidth = 1.5;
            for (let meter = 1; meter < entry.widthMeters; meter += 1) {
                const x = bounds.x + meter * currentView.pixelsPerMeter;
                context.beginPath(); context.moveTo(x, bounds.y); context.lineTo(x, bounds.y + bounds.height); context.stroke();
            }
            for (let meter = 1; meter < entry.lengthMeters; meter += 1) {
                const y = bounds.y + meter * currentView.pixelsPerMeter;
                context.beginPath(); context.moveTo(bounds.x, y); context.lineTo(bounds.x + bounds.width, y); context.stroke();
            }
            context.restore();
            context.strokeStyle = '#6f5362';
            context.lineWidth = Math.max(5, currentView.pixelsPerMeter * .08);
            context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            context.strokeStyle = active ? '#d65395' : entry.wall;
            context.lineWidth = Math.max(3, currentView.pixelsPerMeter * .045);
            context.strokeRect(bounds.x + 4, bounds.y + 4, bounds.width - 8, bounds.height - 8);
            context.fillStyle = active ? '#b74078' : '#735867';
            context.font = `700 ${clamp(currentView.pixelsPerMeter * .13, 11, 17)}px 'Prompt', sans-serif`;
            context.textAlign = 'left';
            context.textBaseline = 'top';
            context.fillText(`${entry.name} · ${entry.widthMeters}×${entry.lengthMeters} ม.`, bounds.x + 12, bounds.y + 10);
            entry.items.forEach(item => drawItem(item, showSelection && active && item.id === selectedId, entry));
            if (showSelection) drawRoomMoveControl(entry, bounds);
        });
        if (showSelection) drawSelectionControls(selected());
        else selectionControls = [];
        updateControls();
    }

    function hitTest(point) {
        for (let roomIndex = project.rooms.length - 1; roomIndex >= 0; roomIndex -= 1) {
            const ownerRoom = project.rooms[roomIndex];
            for (let index = ownerRoom.items.length - 1; index >= 0; index -= 1) {
                const item = ownerRoom.items[index];
                const definition = definitions[item.type];
                if (!definition) continue;
                const itemPoint = itemCanvasPoint(ownerRoom, item);
                const radians = -item.rotation * Math.PI / 180;
                const dx = point.x - itemPoint.x;
                const dy = point.y - itemPoint.y;
                const displayScale = item.scale * furniturePixelScale();
                const localX = (dx * Math.cos(radians) - dy * Math.sin(radians)) / displayScale;
                const localY = (dx * Math.sin(radians) + dy * Math.cos(radians)) / displayScale;
                if (Math.abs(localX) <= definition.width / 2 + 12 && Math.abs(localY) <= definition.height / 2 + 12) return { room: ownerRoom, item };
            }
        }
        return null;
    }
    function roomAt(point) {
        return [...project.rooms].reverse().find(entry => {
            const bounds = roomBounds(entry);
            return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
        }) || null;
    }
    const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
    const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    const center = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const constrain = item => {
        item.mx = clamp(item.mx, 0, room.widthMeters);
        item.my = clamp(item.my, 0, room.lengthMeters);
        item.scale = clamp(item.scale, .4, 2);
    };
    function beginGesture() {
        const item = selected();
        const points = [...pointers.values()];
        if (!item || !points.length) { gesture = null; return; }
        const itemPoint = itemCanvasPoint(room, item);
        if (points.length === 1) {
            gesture = { mode: 'drag', offsetX: itemPoint.x - points[0].x, offsetY: itemPoint.y - points[0].y };
        } else {
            const midpoint = center(points[0], points[1]);
            gesture = {
                mode: 'pinch',
                distance: Math.max(20, distance(points[0], points[1])),
                angle: angle(points[0], points[1]),
                startScale: item.scale,
                startRotation: item.rotation,
                offsetX: itemPoint.x - midpoint.x,
                offsetY: itemPoint.y - midpoint.y
            };
        }
    }

    canvas.addEventListener('pointerdown', event => {
        event.preventDefault();
        if (gesture?.mode === 'room-drag') return;
        const point = canvasPoint(event);
        const pressedControl = pointers.size === 0 ? controlAt(point) : null;
        if (pressedControl) {
            runSelectionControl(pressedControl.action);
            return;
        }
        const pressedRoomMoveControl = pointers.size === 0 ? roomMoveControlAt(point) : null;
        if (pressedRoomMoveControl) {
            const targetRoom = project.rooms.find(entry => entry.id === pressedRoomMoveControl.roomId);
            if (!targetRoom) return;
            project.activeRoomId = targetRoom.id;
            room = targetRoom;
            selectedId = null;
            pointers.set(event.pointerId, point);
            canvas.setPointerCapture(event.pointerId);
            frozenView = { ...currentView };
            gesture = {
                mode: 'room-drag',
                pointerId: event.pointerId,
                startPoint: point,
                startX: room.xMeters,
                startY: room.yMeters
            };
            canvas.classList.add('moving-room');
            syncRoomEditor();
            syncRoomThemeButtons();
            draw();
            return;
        }
        pointers.set(event.pointerId, point);
        canvas.setPointerCapture(event.pointerId);
        if (pointers.size === 1) {
            const hit = hitTest(point);
            const touchedRoom = hit?.room || roomAt(point);
            if (touchedRoom && touchedRoom.id !== room.id) {
                project.activeRoomId = touchedRoom.id;
                room = touchedRoom;
                syncRoomEditor();
                syncRoomThemeButtons();
            }
            selectedId = hit?.item?.id || null;
        }
        beginGesture();
        draw();
    });
    canvas.addEventListener('pointermove', event => {
        if (!pointers.has(event.pointerId)) return;
        event.preventDefault();
        pointers.set(event.pointerId, canvasPoint(event));
        if (gesture?.mode === 'room-drag') {
            const point = pointers.get(gesture.pointerId);
            if (!point || !frozenView) return;
            room.xMeters = Math.round((gesture.startX + (point.x - gesture.startPoint.x) / frozenView.pixelsPerMeter) * 100) / 100;
            room.yMeters = Math.round((gesture.startY + (point.y - gesture.startPoint.y) / frozenView.pixelsPerMeter) * 100) / 100;
            draw();
            return;
        }
        const item = selected();
        const points = [...pointers.values()];
        if (!item || !gesture) return;
        const bounds = roomBounds(room);
        if (points.length === 1 && gesture.mode === 'drag') {
            item.mx = (points[0].x + gesture.offsetX - bounds.x) / currentView.pixelsPerMeter;
            item.my = (points[0].y + gesture.offsetY - bounds.y) / currentView.pixelsPerMeter;
        } else if (points.length >= 2) {
            if (gesture.mode !== 'pinch') beginGesture();
            const midpoint = center(points[0], points[1]);
            item.mx = (midpoint.x + gesture.offsetX - bounds.x) / currentView.pixelsPerMeter;
            item.my = (midpoint.y + gesture.offsetY - bounds.y) / currentView.pixelsPerMeter;
            item.scale = gesture.startScale * distance(points[0], points[1]) / gesture.distance;
            item.rotation = gesture.startRotation + angle(points[0], points[1]) - gesture.angle;
        }
        constrain(item);
        draw();
    });
    const finishPointer = event => {
        if (!pointers.has(event.pointerId)) return;
        if (gesture?.mode === 'room-drag') {
            pointers.delete(event.pointerId);
            frozenView = null;
            gesture = null;
            canvas.classList.remove('moving-room');
            save();
            syncRoomEditor();
            draw();
            setMessage(`ย้าย${room.name}แล้ว`);
            return;
        }
        pointers.delete(event.pointerId);
        save();
        beginGesture();
        draw();
    };
    canvas.addEventListener('pointerup', finishPointer);
    canvas.addEventListener('pointercancel', finishPointer);

    function syncRoomThemeButtons() {
        document.querySelectorAll('[data-room-floor]').forEach(button => button.classList.toggle('active', button.dataset.roomFloor === room.floor));
        document.querySelectorAll('[data-room-wall]').forEach(button => button.classList.toggle('active', button.dataset.roomWall === room.wall));
    }

    function activateRoom(roomId) {
        const nextRoom = project.rooms.find(entry => entry.id === roomId);
        if (!nextRoom) return;
        project.activeRoomId = nextRoom.id;
        room = nextRoom;
        selectedId = null;
        pointers.clear();
        syncRoomEditor();
        syncRoomThemeButtons();
        save();
        draw();
        setMessage(`กำลังจัด ${room.name}`);
    }

    document.getElementById('roomTabs').addEventListener('click', event => {
        const button = event.target.closest('[data-room-id]');
        if (button) activateRoom(button.dataset.roomId);
    });
    const roomsOverlap = (first, second) => first.xMeters < second.xMeters + second.widthMeters
        && first.xMeters + first.widthMeters > second.xMeters
        && first.yMeters < second.yMeters + second.lengthMeters
        && first.yMeters + first.lengthMeters > second.yMeters;
    document.querySelectorAll('[data-room-add-side]').forEach(button => button.addEventListener('click', () => {
        const side = button.dataset.roomAddSide;
        const nextNumber = project.rooms.length + 1;
        const nextRoom = defaultRoom(`ห้อง ${nextNumber}`, []);
        if (side === 'left') nextRoom.xMeters = room.xMeters - nextRoom.widthMeters;
        if (side === 'right') nextRoom.xMeters = room.xMeters + room.widthMeters;
        if (side === 'top') nextRoom.yMeters = room.yMeters - nextRoom.lengthMeters;
        if (side === 'bottom') nextRoom.yMeters = room.yMeters + room.lengthMeters;
        let attempts = 0;
        while (project.rooms.some(entry => roomsOverlap(entry, nextRoom)) && attempts < 20) {
            attempts += 1;
            if (side === 'left' || side === 'right') nextRoom.yMeters += nextRoom.lengthMeters;
            else nextRoom.xMeters += nextRoom.widthMeters;
        }
        project.rooms.push(nextRoom);
        activateRoom(nextRoom.id);
        setMessage(`เพิ่ม${nextRoom.name}ติดด้าน${{ left: 'ซ้าย', right: 'ขวา', top: 'บน', bottom: 'ล่าง' }[side]}แล้ว`);
    }));
    document.getElementById('roomRemoveBtn').addEventListener('click', async () => {
        if (project.rooms.length <= 1) return;
        if (typeof confirmAction === 'function') {
            const confirmed = await confirmAction(`${room.name} และของทั้งหมดในห้องนี้จะถูกลบ`, 'ลบห้องนี้');
            if (!confirmed) return;
        }
        const currentIndex = project.rooms.findIndex(entry => entry.id === room.id);
        project.rooms.splice(currentIndex, 1);
        const nextRoom = project.rooms[Math.max(0, currentIndex - 1)] || project.rooms[0];
        activateRoom(nextRoom.id);
        setMessage('ลบห้องแล้ว');
    });
    document.getElementById('roomApplySizeBtn').addEventListener('click', () => {
        const name = document.getElementById('roomNameInput').value.trim() || 'ห้อง';
        const widthMeters = clamp(Number(document.getElementById('roomWidthInput').value) || 6, 2, 20);
        const lengthMeters = clamp(Number(document.getElementById('roomLengthInput').value) || 4, 2, 20);
        room.name = name;
        room.widthMeters = Math.round(widthMeters * 10) / 10;
        room.lengthMeters = Math.round(lengthMeters * 10) / 10;
        room.items.forEach(constrain);
        syncRoomEditor();
        save();
        draw();
        setMessage(`ตั้ง ${room.name} เป็น ${room.widthMeters} × ${room.lengthMeters} เมตรแล้ว`);
    });

    document.querySelectorAll('[data-furniture-type]').forEach(button => button.addEventListener('click', () => {
        const offset = room.items.length % 5;
        const item = makeItem(button.dataset.furnitureType, 0, 0, {
            mx: clamp(room.widthMeters / 2 + offset * .14, 0, room.widthMeters),
            my: clamp(room.lengthMeters / 2 + offset * .12, 0, room.lengthMeters)
        });
        room.items.push(item);
        selectedId = item.id;
        save();
        draw();
        setMessage(`เพิ่ม${definitions[item.type].label}แล้ว ลากไปวางได้เลย`);
    }));
    document.querySelectorAll('[data-room-preset]').forEach(button => button.addEventListener('click', async () => {
        if (room.items.length && typeof confirmAction === 'function') {
            const confirmed = await confirmAction('ของที่จัดอยู่จะถูกแทนด้วยชุดห้องใหม่', 'ใช้ชุดห้องนี้');
            if (!confirmed) return;
        }
        room.items = mapPresetToCurrentRoom(presets[button.dataset.roomPreset]());
        selectedId = room.items.at(-1)?.id || null;
        save();
        draw();
        setMessage(button.dataset.roomPreset === 'blank' ? 'ได้ห้องเปล่าแล้ว เริ่มแต่งได้เลย' : 'วางชุดห้องให้แล้ว ปรับต่อได้ตามใจ');
    }));
    document.querySelectorAll('[data-room-floor]').forEach(button => button.addEventListener('click', () => {
        room.floor = button.dataset.roomFloor;
        document.querySelectorAll('[data-room-floor]').forEach(item => item.classList.toggle('active', item === button));
        save(); draw();
    }));
    document.querySelectorAll('[data-room-wall]').forEach(button => button.addEventListener('click', () => {
        room.wall = button.dataset.roomWall;
        document.querySelectorAll('[data-room-wall]').forEach(item => item.classList.toggle('active', item === button));
        save(); draw();
    }));
    document.querySelectorAll('[data-furniture-color]').forEach(button => button.addEventListener('click', () => {
        const item = selected();
        if (!item) return;
        item.color = button.dataset.furnitureColor;
        save(); draw();
        setMessage('เปลี่ยนสีชิ้นที่เลือกแล้ว');
    }));
    document.getElementById('roomResetBtn')?.addEventListener('click', async () => {
        if (typeof confirmAction === 'function') {
            const confirmed = await confirmAction('ห้องปัจจุบันจะถูกจัดใหม่ทั้งหมด', 'จัดใหม่');
            if (!confirmed) return;
        }
        room.floor = '#eadbc7';
        room.wall = '#fff8f2';
        room.items = mapPresetToCurrentRoom(presets.living());
        selectedId = room.items.at(-1)?.id || null;
        syncRoomThemeButtons();
        save(); draw(); setMessage('จัดห้องตัวอย่างใหม่แล้ว');
    });
    document.getElementById('roomDownloadBtn')?.addEventListener('click', () => {
        draw(false);
        window.janeDownload.saveDataUrl(
            canvas.toDataURL('image/png'),
            `floor-plan-${new Date().toISOString().slice(0, 10)}.png`,
            { title: 'แปลนรวมห้องจาก Jane Tools' }
        );
        draw();
        setMessage(window.janeDownload.isAppleTouchDevice
            ? 'เลือก “บันทึกรูปภาพ” หรือ “บันทึกไปยังไฟล์” ได้เลย'
            : 'บันทึกภาพห้องแล้ว');
    });

    syncRoomEditor();
    syncRoomThemeButtons();
    window.addEventListener('jane:mini-room-open', draw);
    window.addEventListener('resize', () => requestAnimationFrame(draw));
    draw();
})();
