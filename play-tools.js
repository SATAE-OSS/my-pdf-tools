(() => {
    'use strict';

    const canvas = document.getElementById('miniRoomCanvas');
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
    const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const storageKey = 'jane-mini-room-v2';
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
    const defaultRoom = () => ({
        floor: '#eadbc7',
        wall: '#fff8f2',
        items: presets.living()
    });
    const loadRoom = () => {
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey));
            if (saved?.items && Array.isArray(saved.items)) return saved;
        } catch (_) {}
        return defaultRoom();
    };

    let room = loadRoom();
    let selectedId = room.items.at(-1)?.id || null;
    const pointers = new Map();
    let gesture = null;
    const itemCount = document.getElementById('roomItemCount');
    const message = document.getElementById('roomBuilderMessage');
    const selected = () => room.items.find(item => item.id === selectedId);
    const save = () => {
        try { localStorage.setItem(storageKey, JSON.stringify(room)); } catch (_) {}
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

    function drawItem(item, isSelected) {
        const definition = definitions[item.type];
        if (!definition) return;
        const { width, height } = definition;
        const color = item.color || definition.color;
        context.save();
        context.translate(item.x, item.y);
        context.rotate(item.rotation * Math.PI / 180);
        context.scale(item.scale, item.scale);
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
            context.lineWidth = 4 / item.scale;
            context.setLineDash([10 / item.scale, 7 / item.scale]);
            roundedRect(context, -width / 2 - 10, -height / 2 - 10, width + 20, height + 20, 14);
            context.stroke();
            context.setLineDash([]);
        }
        context.restore();
    }

    function updateControls() {
        const disabled = !selected();
        [
            'roomRotateLeftBtn', 'roomRotateRightBtn', 'roomShrinkBtn', 'roomGrowBtn',
            'roomBackwardBtn', 'roomForwardBtn', 'roomDuplicateBtn', 'roomDeleteBtn'
        ].forEach(id => {
            const button = document.getElementById(id);
            if (button) button.disabled = disabled;
        });
        document.querySelectorAll('[data-furniture-color]').forEach(button => {
            button.disabled = disabled;
            button.classList.toggle('active', !disabled && selected().color === button.dataset.furnitureColor);
        });
        if (itemCount) itemCount.textContent = `${room.items.length} ชิ้น`;
    }

    function draw(showSelection = true) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = room.wall;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.shadowColor = 'rgba(62,42,52,.18)';
        context.shadowBlur = 18;
        context.fillStyle = room.floor;
        roundedRect(context, 38, 38, canvas.width - 76, canvas.height - 76, 10);
        context.fill();
        context.restore();
        context.save();
        roundedRect(context, 38, 38, canvas.width - 76, canvas.height - 76, 10);
        context.clip();
        context.strokeStyle = 'rgba(108,79,59,.1)';
        context.lineWidth = 2;
        for (let x = 48; x < canvas.width; x += 62) {
            context.beginPath(); context.moveTo(x, 38); context.lineTo(x, canvas.height - 38); context.stroke();
        }
        for (let y = 69; y < canvas.height; y += 62) {
            context.beginPath(); context.moveTo(38, y); context.lineTo(canvas.width - 38, y); context.stroke();
        }
        context.restore();
        context.strokeStyle = 'rgba(100,70,82,.45)';
        context.lineWidth = 8;
        roundedRect(context, 35, 35, canvas.width - 70, canvas.height - 70, 12);
        context.stroke();
        room.items.forEach(item => drawItem(item, showSelection && item.id === selectedId));
        updateControls();
    }

    function hitTest(point) {
        for (let index = room.items.length - 1; index >= 0; index--) {
            const item = room.items[index];
            const definition = definitions[item.type];
            if (!definition) continue;
            const radians = -item.rotation * Math.PI / 180;
            const dx = point.x - item.x;
            const dy = point.y - item.y;
            const localX = (dx * Math.cos(radians) - dy * Math.sin(radians)) / item.scale;
            const localY = (dx * Math.sin(radians) + dy * Math.cos(radians)) / item.scale;
            if (Math.abs(localX) <= definition.width / 2 + 12 && Math.abs(localY) <= definition.height / 2 + 12) return item;
        }
        return null;
    }
    const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
    const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    const center = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const constrain = item => {
        item.x = clamp(item.x, 42, canvas.width - 42);
        item.y = clamp(item.y, 42, canvas.height - 42);
        item.scale = clamp(item.scale, .4, 2);
    };
    function beginGesture() {
        const item = selected();
        const points = [...pointers.values()];
        if (!item || !points.length) { gesture = null; return; }
        if (points.length === 1) {
            gesture = { mode: 'drag', offsetX: item.x - points[0].x, offsetY: item.y - points[0].y };
        } else {
            const midpoint = center(points[0], points[1]);
            gesture = {
                mode: 'pinch',
                distance: Math.max(20, distance(points[0], points[1])),
                angle: angle(points[0], points[1]),
                startScale: item.scale,
                startRotation: item.rotation,
                offsetX: item.x - midpoint.x,
                offsetY: item.y - midpoint.y
            };
        }
    }

    canvas.addEventListener('pointerdown', event => {
        event.preventDefault();
        const point = canvasPoint(event);
        pointers.set(event.pointerId, point);
        canvas.setPointerCapture(event.pointerId);
        if (pointers.size === 1) selectedId = hitTest(point)?.id || null;
        beginGesture();
        draw();
    });
    canvas.addEventListener('pointermove', event => {
        if (!pointers.has(event.pointerId)) return;
        event.preventDefault();
        pointers.set(event.pointerId, canvasPoint(event));
        const item = selected();
        const points = [...pointers.values()];
        if (!item || !gesture) return;
        if (points.length === 1 && gesture.mode === 'drag') {
            item.x = points[0].x + gesture.offsetX;
            item.y = points[0].y + gesture.offsetY;
        } else if (points.length >= 2) {
            if (gesture.mode !== 'pinch') beginGesture();
            const midpoint = center(points[0], points[1]);
            item.x = midpoint.x + gesture.offsetX;
            item.y = midpoint.y + gesture.offsetY;
            item.scale = gesture.startScale * distance(points[0], points[1]) / gesture.distance;
            item.rotation = gesture.startRotation + angle(points[0], points[1]) - gesture.angle;
        }
        constrain(item);
        draw();
    });
    const finishPointer = event => {
        pointers.delete(event.pointerId);
        save();
        beginGesture();
        draw();
    };
    canvas.addEventListener('pointerup', finishPointer);
    canvas.addEventListener('pointercancel', finishPointer);

    document.querySelectorAll('[data-furniture-type]').forEach(button => button.addEventListener('click', () => {
        const offset = room.items.length % 5;
        const item = makeItem(button.dataset.furnitureType, 390 + offset * 30, 260 + offset * 18);
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
        room.items = presets[button.dataset.roomPreset]();
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
    const edit = (change, text) => {
        const item = selected();
        if (!item) return;
        change(item);
        constrain(item);
        save(); draw();
        if (text) setMessage(text);
    };
    document.getElementById('roomRotateLeftBtn')?.addEventListener('click', () => edit(item => item.rotation -= 15, 'หมุนซ้าย 15°'));
    document.getElementById('roomRotateRightBtn')?.addEventListener('click', () => edit(item => item.rotation += 15, 'หมุนขวา 15°'));
    document.getElementById('roomShrinkBtn')?.addEventListener('click', () => edit(item => item.scale -= .1, 'ย่อชิ้นที่เลือกแล้ว'));
    document.getElementById('roomGrowBtn')?.addEventListener('click', () => edit(item => item.scale += .1, 'ขยายชิ้นที่เลือกแล้ว'));
    document.getElementById('roomBackwardBtn')?.addEventListener('click', () => {
        const index = room.items.findIndex(item => item.id === selectedId);
        if (index <= 0) return;
        const [item] = room.items.splice(index, 1);
        room.items.splice(index - 1, 0, item);
        save(); draw(); setMessage('ส่งชิ้นที่เลือกไปด้านหลังแล้ว');
    });
    document.getElementById('roomForwardBtn')?.addEventListener('click', () => {
        const index = room.items.findIndex(item => item.id === selectedId);
        if (index < 0 || index === room.items.length - 1) return;
        const [item] = room.items.splice(index, 1);
        room.items.splice(index + 1, 0, item);
        save(); draw(); setMessage('นำชิ้นที่เลือกมาด้านหน้าแล้ว');
    });
    document.getElementById('roomDuplicateBtn')?.addEventListener('click', () => {
        const item = selected();
        if (!item) return;
        const duplicate = { ...item, id: uid(), x: item.x + 34, y: item.y + 34 };
        room.items.push(duplicate);
        selectedId = duplicate.id;
        save(); draw(); setMessage('ทำสำเนาแล้ว');
    });
    document.getElementById('roomDeleteBtn')?.addEventListener('click', () => {
        if (!selected()) return;
        room.items = room.items.filter(item => item.id !== selectedId);
        selectedId = room.items.at(-1)?.id || null;
        save(); draw(); setMessage('ลบชิ้นที่เลือกแล้ว');
    });
    document.getElementById('roomResetBtn')?.addEventListener('click', async () => {
        if (typeof confirmAction === 'function') {
            const confirmed = await confirmAction('ห้องปัจจุบันจะถูกจัดใหม่ทั้งหมด', 'จัดใหม่');
            if (!confirmed) return;
        }
        room = defaultRoom();
        selectedId = room.items.at(-1)?.id || null;
        save(); draw(); setMessage('จัดห้องตัวอย่างใหม่แล้ว');
    });
    document.getElementById('roomDownloadBtn')?.addEventListener('click', () => {
        draw(false);
        const link = document.createElement('a');
        link.download = `mini-room-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        draw();
        setMessage('บันทึกภาพห้องแล้ว');
    });

    document.querySelectorAll('[data-room-floor]').forEach(button => button.classList.toggle('active', button.dataset.roomFloor === room.floor));
    document.querySelectorAll('[data-room-wall]').forEach(button => button.classList.toggle('active', button.dataset.roomWall === room.wall));
    draw();
})();
