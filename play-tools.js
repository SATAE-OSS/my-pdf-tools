(() => {
    'use strict';

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const uid = () => crypto.randomUUID?.() || `toy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const canvasPoint = (canvas, event) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height
        };
    };

    // ห้องจิ๋วจัดเฟอร์
    const roomCanvas = document.getElementById('miniRoomCanvas');
    const roomContext = roomCanvas?.getContext('2d');
    if (roomCanvas && roomContext) {
        const roomStorageKey = 'jane-mini-room-v1';
        const roomMessage = document.getElementById('roomBuilderMessage');
        const furnitureDefinitions = {
            sofa: { width: 220, height: 90, color: '#d98eae', label: 'โซฟา' },
            chair: { width: 88, height: 88, color: '#e1a7bf', label: 'เก้าอี้' },
            table: { width: 118, height: 118, color: '#b98566', label: 'โต๊ะ' },
            bed: { width: 155, height: 225, color: '#b8a4dd', label: 'เตียง' },
            rug: { width: 225, height: 145, color: '#e8b9c9', label: 'พรม' },
            plant: { width: 82, height: 82, color: '#63af83', label: 'ต้นไม้' },
            lamp: { width: 68, height: 68, color: '#f2c766', label: 'โคมไฟ' },
            shelf: { width: 76, height: 190, color: '#a77c63', label: 'ชั้นวาง' }
        };
        const createFurniture = (type, x, y, extras = {}) => ({
            id: uid(),
            type,
            x,
            y,
            scale: 1,
            rotation: 0,
            ...extras
        });
        const defaultRoom = () => ({
            floor: '#eadbc7',
            wall: '#fff8f2',
            items: [
                createFurniture('rug', 485, 332, { scale: 1.2, rotation: 0 }),
                createFurniture('sofa', 475, 180, { rotation: 0 }),
                createFurniture('table', 480, 340, { scale: .9 }),
                createFurniture('plant', 730, 150, { scale: .9 }),
                createFurniture('chair', 685, 340, { rotation: -90 })
            ]
        });
        let roomState;
        try {
            const saved = JSON.parse(localStorage.getItem(roomStorageKey));
            roomState = saved?.items?.length ? saved : defaultRoom();
        } catch {
            roomState = defaultRoom();
        }
        let selectedFurnitureId = roomState.items.at(-1)?.id || null;
        const roomPointers = new Map();
        let roomGesture = null;

        const roundedRect = (context, x, y, width, height, radius) => {
            const safeRadius = Math.min(radius, width / 2, height / 2);
            context.beginPath();
            context.moveTo(x + safeRadius, y);
            context.arcTo(x + width, y, x + width, y + height, safeRadius);
            context.arcTo(x + width, y + height, x, y + height, safeRadius);
            context.arcTo(x, y + height, x, y, safeRadius);
            context.arcTo(x, y, x + width, y, safeRadius);
            context.closePath();
        };
        const shade = (hex, amount) => {
            const value = parseInt(hex.slice(1), 16);
            const channel = shift => clamp((value >> shift & 255) + amount, 0, 255);
            return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
        };
        const selectedFurniture = () => roomState.items.find(item => item.id === selectedFurnitureId) || null;
        const saveRoom = () => localStorage.setItem(roomStorageKey, JSON.stringify(roomState));
        const setRoomMessage = message => {
            roomMessage.textContent = message;
            window.clearTimeout(setRoomMessage.timer);
            setRoomMessage.timer = window.setTimeout(() => {
                roomMessage.textContent = 'หนึ่งนิ้วลาก · สองนิ้วหมุนและย่อขยาย';
            }, 2200);
        };

        function drawFurniture(item, selected = false) {
            const definition = furnitureDefinitions[item.type];
            const width = definition.width;
            const height = definition.height;
            const context = roomContext;
            context.save();
            context.translate(item.x, item.y);
            context.rotate(item.rotation * Math.PI / 180);
            context.scale(item.scale, item.scale);
            context.shadowColor = 'rgba(71,48,61,.18)';
            context.shadowBlur = 13;
            context.shadowOffsetY = 7;

            if (item.type === 'rug') {
                roundedRect(context, -width / 2, -height / 2, width, height, 24);
                context.fillStyle = definition.color;
                context.globalAlpha = .72;
                context.fill();
                context.globalAlpha = 1;
                context.shadowColor = 'transparent';
                context.strokeStyle = 'rgba(255,255,255,.5)';
                context.lineWidth = 5;
                context.setLineDash([15, 10]);
                roundedRect(context, -width / 2 + 10, -height / 2 + 10, width - 20, height - 20, 18);
                context.stroke();
                context.setLineDash([]);
            } else if (item.type === 'table') {
                context.beginPath();
                context.arc(0, 0, width / 2, 0, Math.PI * 2);
                context.fillStyle = definition.color;
                context.fill();
                context.shadowColor = 'transparent';
                context.beginPath();
                context.arc(0, 0, width / 2 - 12, 0, Math.PI * 2);
                context.strokeStyle = shade(definition.color, 24);
                context.lineWidth = 5;
                context.stroke();
                [[-31, -31], [31, -31], [-31, 31], [31, 31]].forEach(([x, y]) => {
                    context.beginPath();
                    context.arc(x, y, 5, 0, Math.PI * 2);
                    context.fillStyle = shade(definition.color, -32);
                    context.fill();
                });
            } else if (item.type === 'plant') {
                context.beginPath();
                context.arc(0, 0, 34, 0, Math.PI * 2);
                context.fillStyle = '#bc8d69';
                context.fill();
                context.shadowColor = 'transparent';
                for (let index = 0; index < 7; index++) {
                    context.save();
                    context.rotate(index * Math.PI * 2 / 7);
                    context.beginPath();
                    context.ellipse(0, -23, 13, 28, 0, 0, Math.PI * 2);
                    context.fillStyle = index % 2 ? '#72bf90' : definition.color;
                    context.fill();
                    context.restore();
                }
                context.beginPath();
                context.arc(0, 0, 8, 0, Math.PI * 2);
                context.fillStyle = '#3f8e64';
                context.fill();
            } else if (item.type === 'lamp') {
                context.beginPath();
                context.arc(0, 0, 32, 0, Math.PI * 2);
                context.fillStyle = 'rgba(255,223,122,.34)';
                context.fill();
                context.beginPath();
                context.arc(0, 0, 19, 0, Math.PI * 2);
                context.fillStyle = definition.color;
                context.fill();
                context.shadowColor = 'transparent';
                context.beginPath();
                context.arc(-6, -7, 6, 0, Math.PI * 2);
                context.fillStyle = 'rgba(255,255,255,.75)';
                context.fill();
            } else {
                roundedRect(context, -width / 2, -height / 2, width, height, item.type === 'shelf' ? 9 : 18);
                context.fillStyle = definition.color;
                context.fill();
                context.shadowColor = 'transparent';
                context.lineWidth = 4;
                context.strokeStyle = shade(definition.color, -26);
                context.stroke();

                if (item.type === 'sofa') {
                    context.fillStyle = shade(definition.color, 18);
                    [-1, 1].forEach(side => {
                        roundedRect(context, side * 50 - 43, -30, 86, 60, 15);
                        context.fill();
                    });
                    context.fillStyle = shade(definition.color, -18);
                    roundedRect(context, -width / 2 + 8, -height / 2 + 8, 16, height - 16, 7);
                    context.fill();
                    roundedRect(context, width / 2 - 24, -height / 2 + 8, 16, height - 16, 7);
                    context.fill();
                } else if (item.type === 'chair') {
                    context.fillStyle = shade(definition.color, 19);
                    roundedRect(context, -30, -28, 60, 56, 14);
                    context.fill();
                    context.fillStyle = shade(definition.color, -22);
                    roundedRect(context, -width / 2 + 6, -height / 2 + 6, width - 12, 13, 6);
                    context.fill();
                } else if (item.type === 'bed') {
                    context.fillStyle = '#f8eff5';
                    roundedRect(context, -width / 2 + 9, -height / 2 + 10, width - 18, 55, 13);
                    context.fill();
                    context.fillStyle = shade(definition.color, 26);
                    roundedRect(context, -width / 2 + 10, -height / 2 + 70, width - 20, height - 80, 14);
                    context.fill();
                    context.strokeStyle = 'rgba(255,255,255,.7)';
                    context.beginPath();
                    context.moveTo(-width / 2 + 14, 24);
                    context.lineTo(width / 2 - 14, 24);
                    context.stroke();
                } else if (item.type === 'shelf') {
                    context.strokeStyle = shade(definition.color, -30);
                    context.lineWidth = 5;
                    [-55, 0, 55].forEach(y => {
                        context.beginPath();
                        context.moveTo(-width / 2 + 6, y);
                        context.lineTo(width / 2 - 6, y);
                        context.stroke();
                    });
                }
            }

            if (selected) {
                context.shadowColor = 'transparent';
                context.strokeStyle = '#c64f8b';
                context.lineWidth = 4 / item.scale;
                context.setLineDash([10 / item.scale, 7 / item.scale]);
                roundedRect(context, -width / 2 - 10, -height / 2 - 10, width + 20, height + 20, 14);
                context.stroke();
                context.setLineDash([]);
                context.beginPath();
                context.arc(width / 2 + 11, -height / 2 - 11, 7 / item.scale, 0, Math.PI * 2);
                context.fillStyle = '#fff';
                context.fill();
                context.strokeStyle = '#c64f8b';
                context.lineWidth = 3 / item.scale;
                context.stroke();
            }
            context.restore();
        }

        function drawRoom(showSelection = true) {
            const context = roomContext;
            context.clearRect(0, 0, roomCanvas.width, roomCanvas.height);
            context.fillStyle = roomState.wall;
            context.fillRect(0, 0, roomCanvas.width, roomCanvas.height);
            context.save();
            context.shadowColor = 'rgba(62,42,52,.18)';
            context.shadowBlur = 18;
            context.fillStyle = roomState.floor;
            roundedRect(context, 38, 38, roomCanvas.width - 76, roomCanvas.height - 76, 10);
            context.fill();
            context.restore();

            context.save();
            roundedRect(context, 38, 38, roomCanvas.width - 76, roomCanvas.height - 76, 10);
            context.clip();
            context.strokeStyle = 'rgba(108,79,59,.1)';
            context.lineWidth = 2;
            for (let x = 48; x < roomCanvas.width; x += 62) {
                context.beginPath();
                context.moveTo(x, 38);
                context.lineTo(x, roomCanvas.height - 38);
                context.stroke();
            }
            for (let y = 69; y < roomCanvas.height; y += 62) {
                context.beginPath();
                context.moveTo(38, y);
                context.lineTo(roomCanvas.width - 38, y);
                context.stroke();
            }
            context.restore();

            context.strokeStyle = 'rgba(100,70,82,.45)';
            context.lineWidth = 8;
            roundedRect(context, 35, 35, roomCanvas.width - 70, roomCanvas.height - 70, 12);
            context.stroke();
            roomState.items.forEach(item => drawFurniture(item, showSelection && item.id === selectedFurnitureId));
            updateRoomControls();
        }

        const hitFurniture = point => {
            for (let index = roomState.items.length - 1; index >= 0; index--) {
                const item = roomState.items[index];
                const definition = furnitureDefinitions[item.type];
                const radians = -item.rotation * Math.PI / 180;
                const dx = point.x - item.x;
                const dy = point.y - item.y;
                const localX = (dx * Math.cos(radians) - dy * Math.sin(radians)) / item.scale;
                const localY = (dx * Math.sin(radians) + dy * Math.cos(radians)) / item.scale;
                if (Math.abs(localX) <= definition.width / 2 + 12 && Math.abs(localY) <= definition.height / 2 + 12) return item;
            }
            return null;
        };
        const roomDistance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
        const roomAngle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        const roomCenter = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        const startRoomGesture = () => {
            const item = selectedFurniture();
            const points = [...roomPointers.values()];
            if (!item || !points.length) {
                roomGesture = null;
                return;
            }
            if (points.length === 1) {
                roomGesture = { mode: 'drag', offsetX: item.x - points[0].x, offsetY: item.y - points[0].y };
            } else {
                const center = roomCenter(points[0], points[1]);
                roomGesture = {
                    mode: 'pinch',
                    distance: Math.max(20, roomDistance(points[0], points[1])),
                    angle: roomAngle(points[0], points[1]),
                    startScale: item.scale,
                    startRotation: item.rotation,
                    offsetX: item.x - center.x,
                    offsetY: item.y - center.y
                };
            }
        };
        const constrainFurniture = item => {
            item.x = clamp(item.x, 48, roomCanvas.width - 48);
            item.y = clamp(item.y, 48, roomCanvas.height - 48);
            item.scale = clamp(item.scale, .45, 1.9);
        };
        const updateRoomControls = () => {
            const disabled = !selectedFurniture();
            ['roomRotateLeftBtn', 'roomShrinkBtn', 'roomGrowBtn', 'roomDuplicateBtn', 'roomDeleteBtn'].forEach(id => {
                document.getElementById(id).disabled = disabled;
            });
        };
        const editSelectedFurniture = (editor, message) => {
            const item = selectedFurniture();
            if (!item) return;
            editor(item);
            constrainFurniture(item);
            saveRoom();
            drawRoom();
            if (message) setRoomMessage(message);
        };

        roomCanvas.addEventListener('pointerdown', event => {
            event.preventDefault();
            const point = canvasPoint(roomCanvas, event);
            roomPointers.set(event.pointerId, point);
            roomCanvas.setPointerCapture(event.pointerId);
            if (roomPointers.size === 1) {
                const hit = hitFurniture(point);
                selectedFurnitureId = hit?.id || null;
                if (hit) {
                    roomState.items = roomState.items.filter(item => item.id !== hit.id);
                    roomState.items.push(hit);
                }
            }
            startRoomGesture();
            drawRoom();
        });
        roomCanvas.addEventListener('pointermove', event => {
            if (!roomPointers.has(event.pointerId)) return;
            event.preventDefault();
            roomPointers.set(event.pointerId, canvasPoint(roomCanvas, event));
            const item = selectedFurniture();
            const points = [...roomPointers.values()];
            if (!item || !roomGesture) return;
            if (points.length === 1 && roomGesture.mode === 'drag') {
                item.x = points[0].x + roomGesture.offsetX;
                item.y = points[0].y + roomGesture.offsetY;
            } else if (points.length >= 2) {
                if (roomGesture.mode !== 'pinch') startRoomGesture();
                const center = roomCenter(points[0], points[1]);
                item.x = center.x + roomGesture.offsetX;
                item.y = center.y + roomGesture.offsetY;
                item.scale = roomGesture.startScale * roomDistance(points[0], points[1]) / roomGesture.distance;
                item.rotation = roomGesture.startRotation + roomAngle(points[0], points[1]) - roomGesture.angle;
            }
            constrainFurniture(item);
            drawRoom();
        });
        const finishRoomPointer = event => {
            roomPointers.delete(event.pointerId);
            saveRoom();
            startRoomGesture();
            drawRoom();
        };
        roomCanvas.addEventListener('pointerup', finishRoomPointer);
        roomCanvas.addEventListener('pointercancel', finishRoomPointer);

        document.querySelectorAll('[data-furniture-type]').forEach(button => button.addEventListener('click', () => {
            const count = roomState.items.length;
            const item = createFurniture(button.dataset.furnitureType, 450 + (count % 3 - 1) * 28, 310 + (count % 2) * 24);
            roomState.items.push(item);
            selectedFurnitureId = item.id;
            saveRoom();
            drawRoom();
            setRoomMessage(`เพิ่ม${furnitureDefinitions[item.type].label}แล้ว ลากไปวางได้เลย`);
        }));
        document.querySelectorAll('[data-room-floor]').forEach(button => button.addEventListener('click', () => {
            roomState.floor = button.dataset.roomFloor;
            document.querySelectorAll('[data-room-floor]').forEach(item => item.classList.toggle('active', item === button));
            saveRoom();
            drawRoom();
        }));
        document.querySelectorAll('[data-room-wall]').forEach(button => button.addEventListener('click', () => {
            roomState.wall = button.dataset.roomWall;
            document.querySelectorAll('[data-room-wall]').forEach(item => item.classList.toggle('active', item === button));
            saveRoom();
            drawRoom();
        }));
        document.getElementById('roomRotateLeftBtn').addEventListener('click', () => editSelectedFurniture(item => item.rotation -= 15, 'หมุนซ้าย 15°'));
        document.getElementById('roomShrinkBtn').addEventListener('click', () => editSelectedFurniture(item => item.scale -= .1, 'ย่อเฟอร์นิเจอร์แล้ว'));
        document.getElementById('roomGrowBtn').addEventListener('click', () => editSelectedFurniture(item => item.scale += .1, 'ขยายเฟอร์นิเจอร์แล้ว'));
        document.getElementById('roomDuplicateBtn').addEventListener('click', () => {
            const item = selectedFurniture();
            if (!item) return;
            const duplicate = { ...item, id: uid(), x: item.x + 35, y: item.y + 35 };
            roomState.items.push(duplicate);
            selectedFurnitureId = duplicate.id;
            saveRoom();
            drawRoom();
            setRoomMessage('ทำสำเนาแล้ว');
        });
        document.getElementById('roomDeleteBtn').addEventListener('click', () => {
            if (!selectedFurniture()) return;
            roomState.items = roomState.items.filter(item => item.id !== selectedFurnitureId);
            selectedFurnitureId = roomState.items.at(-1)?.id || null;
            saveRoom();
            drawRoom();
            setRoomMessage('ลบเฟอร์นิเจอร์แล้ว');
        });
        document.getElementById('roomResetBtn').addEventListener('click', async () => {
            if (typeof confirmAction === 'function' && !await confirmAction('ห้องปัจจุบันจะถูกจัดใหม่ทั้งหมด', 'จัดใหม่')) return;
            roomState = defaultRoom();
            selectedFurnitureId = roomState.items.at(-1).id;
            saveRoom();
            drawRoom();
            setRoomMessage('จัดห้องตัวอย่างใหม่แล้ว');
        });
        document.getElementById('roomDownloadBtn').addEventListener('click', () => {
            drawRoom(false);
            const link = document.createElement('a');
            link.download = `mini-room-${new Date().toISOString().slice(0, 10)}.png`;
            link.href = roomCanvas.toDataURL('image/png');
            link.click();
            drawRoom();
            setRoomMessage('บันทึกภาพห้องแล้ว');
        });
        document.querySelectorAll('[data-room-floor]').forEach(button => button.classList.toggle('active', button.dataset.roomFloor === roomState.floor));
        document.querySelectorAll('[data-room-wall]').forEach(button => button.classList.toggle('active', button.dataset.roomWall === roomState.wall));
        drawRoom();
    }

    // เครื่องผสมสีเจล
    const gelCanvas = document.getElementById('gelMixerCanvas');
    const gelContext = gelCanvas?.getContext('2d');
    if (gelCanvas && gelContext) {
        const paletteStorageKey = 'jane-gel-palette-v1';
        const gelColorButtons = [...document.querySelectorAll('[data-gel-color]')];
        const gelDropSize = document.getElementById('gelDropSize');
        const gelMixedSwatch = document.getElementById('gelMixedSwatch');
        const gelMixedHex = document.getElementById('gelMixedHex');
        const gelMixDescription = document.getElementById('gelMixDescription');
        const saveGelColorBtn = document.getElementById('saveGelColorBtn');
        const savedGelPalette = document.getElementById('savedGelPalette');
        let activeGelColor = gelColorButtons[0].dataset.gelColor;
        let gelDrops = [];
        let gelMixColors = [];
        let currentMixedColor = '';
        const gelPointers = new Map();
        let gelAudioContext = null;

        const hexToRgb = hex => ({
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16)
        });
        const rgbToHex = ({ r, g, b }) => `#${[r, g, b].map(value => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0')).join('')}`;
        const mixGelColors = () => {
            if (!gelMixColors.length) {
                currentMixedColor = '';
                gelMixedSwatch.style.backgroundColor = '';
                gelMixedHex.textContent = 'ยังไม่ได้หยดสี';
                gelMixDescription.textContent = 'เลือกสองสีขึ้นไปแล้วลองคนดู';
                saveGelColorBtn.disabled = true;
                return;
            }
            const totalWeight = gelMixColors.reduce((sum, color) => sum + color.weight, 0);
            const mixed = gelMixColors.reduce((result, color) => {
                const rgb = hexToRgb(color.hex);
                result.r += Math.pow(rgb.r / 255, 2.2) * color.weight;
                result.g += Math.pow(rgb.g / 255, 2.2) * color.weight;
                result.b += Math.pow(rgb.b / 255, 2.2) * color.weight;
                return result;
            }, { r: 0, g: 0, b: 0 });
            currentMixedColor = rgbToHex({
                r: Math.pow(mixed.r / totalWeight, 1 / 2.2) * 255,
                g: Math.pow(mixed.g / totalWeight, 1 / 2.2) * 255,
                b: Math.pow(mixed.b / totalWeight, 1 / 2.2) * 255
            });
            gelMixedSwatch.style.backgroundColor = currentMixedColor;
            gelMixedHex.textContent = currentMixedColor.toUpperCase();
            const uniqueColors = new Set(gelMixColors.map(color => color.hex)).size;
            gelMixDescription.textContent = uniqueColors === 1 ? 'สีเจลเดี่ยว ลองเพิ่มอีกสีดูสิ' : `ผสมจาก ${uniqueColors} สี · แตะรหัสสีเพื่อคัดลอก`;
            saveGelColorBtn.disabled = false;
        };
        const playGelSound = () => {
            try {
                gelAudioContext ||= new (window.AudioContext || window.webkitAudioContext)();
                if (gelAudioContext.state === 'suspended') gelAudioContext.resume();
                const oscillator = gelAudioContext.createOscillator();
                const gain = gelAudioContext.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(120, gelAudioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(76, gelAudioContext.currentTime + .09);
                gain.gain.setValueAtTime(.025, gelAudioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(.001, gelAudioContext.currentTime + .1);
                oscillator.connect(gain).connect(gelAudioContext.destination);
                oscillator.start();
                oscillator.stop(gelAudioContext.currentTime + .11);
            } catch {
                // เสียงเป็นลูกเล่นเสริม การเล่นสีไม่ควรหยุดหากอุปกรณ์บล็อกเสียง
            }
        };
        const addGelDrop = point => {
            const radius = Number(gelDropSize.value);
            gelDrops.push({
                x: point.x,
                y: point.y,
                radius,
                color: activeGelColor,
                wobble: Math.random() * Math.PI * 2,
                stretchX: .85 + Math.random() * .3,
                stretchY: .85 + Math.random() * .3
            });
            if (gelDrops.length > 32) gelDrops.shift();
            gelMixColors.push({ hex: activeGelColor, weight: radius * radius });
            if (gelMixColors.length > 50) gelMixColors.shift();
            mixGelColors();
            playGelSound();
        };
        const drawGelMixer = timestamp => {
            const context = gelContext;
            context.clearRect(0, 0, gelCanvas.width, gelCanvas.height);
            const background = context.createLinearGradient(0, 0, gelCanvas.width, gelCanvas.height);
            background.addColorStop(0, '#f8f2f7');
            background.addColorStop(1, '#ddd3e3');
            context.fillStyle = background;
            context.fillRect(0, 0, gelCanvas.width, gelCanvas.height);
            context.save();
            context.globalCompositeOperation = 'multiply';
            context.filter = 'blur(6px)';
            gelDrops.forEach((drop, index) => {
                const pulse = Math.sin(timestamp / 520 + drop.wobble + index * .2) * 2.2;
                const gradient = context.createRadialGradient(
                    drop.x - drop.radius * .24,
                    drop.y - drop.radius * .28,
                    drop.radius * .08,
                    drop.x,
                    drop.y,
                    drop.radius + pulse
                );
                gradient.addColorStop(0, `${drop.color}f2`);
                gradient.addColorStop(.62, `${drop.color}d9`);
                gradient.addColorStop(1, `${drop.color}12`);
                context.save();
                context.translate(drop.x, drop.y);
                context.scale(drop.stretchX, drop.stretchY);
                context.beginPath();
                context.arc(0, 0, drop.radius + pulse, 0, Math.PI * 2);
                context.fillStyle = gradient;
                context.fill();
                context.restore();
            });
            context.restore();
            context.save();
            context.globalCompositeOperation = 'screen';
            gelDrops.forEach(drop => {
                context.beginPath();
                context.ellipse(
                    drop.x - drop.radius * .23,
                    drop.y - drop.radius * .26,
                    drop.radius * .23,
                    drop.radius * .11,
                    -.45,
                    0,
                    Math.PI * 2
                );
                context.fillStyle = 'rgba(255,255,255,.4)';
                context.fill();
            });
            context.restore();
        };
        const animateGel = timestamp => {
            if (document.getElementById('gelMixerTab').style.display !== 'none') drawGelMixer(timestamp);
            requestAnimationFrame(animateGel);
        };
        const stirGel = (previous, current) => {
            const dx = current.x - previous.x;
            const dy = current.y - previous.y;
            gelDrops.forEach(drop => {
                const distance = Math.hypot(drop.x - current.x, drop.y - current.y);
                if (distance > 190) return;
                const force = (1 - distance / 190);
                drop.x += dx * force * .82 - dy * force * .08;
                drop.y += dy * force * .82 + dx * force * .08;
                drop.x = clamp(drop.x, drop.radius * .35, gelCanvas.width - drop.radius * .35);
                drop.y = clamp(drop.y, drop.radius * .35, gelCanvas.height - drop.radius * .35);
                drop.stretchX = clamp(drop.stretchX + Math.abs(dx) * .002, .72, 1.35);
                drop.stretchY = clamp(drop.stretchY + Math.abs(dy) * .002, .72, 1.35);
            });
        };
        const renderSavedGelPalette = () => {
            let colors = [];
            try {
                colors = JSON.parse(localStorage.getItem(paletteStorageKey)) || [];
            } catch {
                colors = [];
            }
            if (!colors.length) {
                savedGelPalette.innerHTML = '<p>ยังไม่มีสีที่บันทึกไว้</p>';
                return;
            }
            savedGelPalette.innerHTML = '';
            colors.forEach(color => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'saved-color-chip';
                button.style.setProperty('--saved-color', color);
                button.setAttribute('aria-label', `ใช้สี ${color}`);
                button.innerHTML = `<span>${color.toUpperCase()}</span>`;
                button.addEventListener('click', () => {
                    activeGelColor = color;
                    gelColorButtons.forEach(item => item.classList.remove('active'));
                    navigator.clipboard?.writeText(color);
                    gelMixDescription.textContent = `คัดลอก ${color.toUpperCase()} แล้ว`;
                });
                savedGelPalette.appendChild(button);
            });
        };

        gelCanvas.addEventListener('pointerdown', event => {
            event.preventDefault();
            const point = canvasPoint(gelCanvas, event);
            gelPointers.set(event.pointerId, point);
            gelCanvas.setPointerCapture(event.pointerId);
            addGelDrop(point);
            drawGelMixer(performance.now());
        });
        gelCanvas.addEventListener('pointermove', event => {
            if (!gelPointers.has(event.pointerId)) return;
            event.preventDefault();
            const previous = gelPointers.get(event.pointerId);
            const current = canvasPoint(gelCanvas, event);
            gelPointers.set(event.pointerId, current);
            stirGel(previous, current);
            drawGelMixer(performance.now());
        });
        const releaseGelPointer = event => gelPointers.delete(event.pointerId);
        gelCanvas.addEventListener('pointerup', releaseGelPointer);
        gelCanvas.addEventListener('pointercancel', releaseGelPointer);
        gelColorButtons.forEach(button => button.addEventListener('click', () => {
            activeGelColor = button.dataset.gelColor;
            gelColorButtons.forEach(item => item.classList.toggle('active', item === button));
        }));
        document.getElementById('gelClearBtn').addEventListener('click', () => {
            gelDrops = [];
            gelMixColors = [];
            mixGelColors();
            drawGelMixer(performance.now());
        });
        gelMixedHex.addEventListener('click', () => {
            if (!currentMixedColor) return;
            navigator.clipboard?.writeText(currentMixedColor);
            gelMixDescription.textContent = `คัดลอก ${currentMixedColor.toUpperCase()} แล้ว`;
        });
        saveGelColorBtn.addEventListener('click', () => {
            if (!currentMixedColor) return;
            let colors = [];
            try {
                colors = JSON.parse(localStorage.getItem(paletteStorageKey)) || [];
            } catch {
                colors = [];
            }
            colors = [currentMixedColor, ...colors.filter(color => color !== currentMixedColor)].slice(0, 12);
            localStorage.setItem(paletteStorageKey, JSON.stringify(colors));
            renderSavedGelPalette();
            saveGelColorBtn.textContent = '♥ เก็บสีแล้ว';
            window.setTimeout(() => saveGelColorBtn.textContent = '♡ เก็บสีนี้ไว้', 1200);
        });
        document.getElementById('clearGelPaletteBtn').addEventListener('click', () => {
            localStorage.removeItem(paletteStorageKey);
            renderSavedGelPalette();
        });
        renderSavedGelPalette();
        mixGelColors();
        drawGelMixer(0);
        requestAnimationFrame(animateGel);
    }
})();
