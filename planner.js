(() => {
    const supabase = window.pdfMagicSupabase;
    if (!supabase) return;

    const dayNames = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const shortDayNames = ['', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
    const todayDay = new Date().getDay() || 7;
    let plannerUser = null;
    let courses = [];
    let homework = [];
    let activeDay = todayDay;
    let calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let selectedCalendarDate = formatDateInput(new Date());
    let activeHomeworkFilter = 'all';
    let editingCourseId = null;
    let editingHomeworkId = null;
    let reschedulingHomeworkId = null;
    let loadedForUserId = null;

    const byId = id => document.getElementById(id);
    const scheduleBoard = byId('scheduleBoard');
    const weekStrip = byId('weekStrip');
    const calendarGrid = byId('calendarGrid');
    const calendarAgendaList = byId('calendarAgendaList');
    const homeworkList = byId('homeworkList');
    const homeworkSummary = byId('homeworkSummary');
    const courseDialog = byId('courseDialog');
    const homeworkDialog = byId('homeworkDialog');
    const rescheduleDialog = byId('rescheduleDialog');
    const courseForm = byId('courseForm');
    const homeworkForm = byId('homeworkForm');
    const rescheduleForm = byId('rescheduleForm');

    function escapeHTML(value = '') {
        return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
    }

    function setPlannerMessage(targetId, message = '', type = '') {
        const target = byId(targetId);
        target.textContent = message;
        target.className = `planner-message ${type}`.trim();
    }

    function friendlyPlannerError(error) {
        const message = error?.message || '';
        if (/relation.*(student_courses|homework_tasks).*does not exist/i.test(message)) {
            return 'ยังไม่ได้ติดตั้งตารางเรียนใน Supabase กรุณารันไฟล์ supabase-setup.sql รุ่นล่าสุดก่อน';
        }
        if (/row-level security|permission denied|policy/i.test(message)) return 'สิทธิ์ฐานข้อมูลยังตั้งค่าไม่ครบ กรุณารัน SQL ตั้งค่า RLS อีกครั้ง';
        return message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    }

    function formatDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatTimeInput(date) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    const timePickers = {
        courseStart: ['courseStartHour', 'courseStartMinute'],
        courseEnd: ['courseEndHour', 'courseEndMinute'],
        homeworkDue: ['homeworkDueHour', 'homeworkDueMinute'],
        reschedule: ['rescheduleHour', 'rescheduleMinute']
    };

    function setupTimePicker(prefix, initialValue) {
        const [hourId, minuteId] = timePickers[prefix];
        const hourSelect = byId(hourId);
        const minuteSelect = byId(minuteId);
        hourSelect.innerHTML = Array.from({ length: 24 }, (_, hour) => `<option value="${String(hour).padStart(2, '0')}">${String(hour).padStart(2, '0')}</option>`).join('');
        minuteSelect.innerHTML = Array.from({ length: 60 }, (_, minute) => `<option value="${String(minute).padStart(2, '0')}">${String(minute).padStart(2, '0')}</option>`).join('');
        setTimePicker(prefix, initialValue);
    }

    function setTimePicker(prefix, value = '00:00') {
        const [hourId, minuteId] = timePickers[prefix];
        const [hour = '00', minute = '00'] = String(value).slice(0, 5).split(':');
        byId(hourId).value = hour.padStart(2, '0');
        byId(minuteId).value = minute.padStart(2, '0');
    }

    function getTimePicker(prefix) {
        const [hourId, minuteId] = timePickers[prefix];
        return `${byId(hourId).value}:${byId(minuteId).value}`;
    }

    function disableTimePicker(prefix, disabled) {
        timePickers[prefix].forEach(id => { byId(id).disabled = disabled; });
    }

    function localDateTimeToISO(dateValue, timeValue) {
        return new Date(`${dateValue}T${timeValue}:00`).toISOString();
    }

    function formatDueDate(value) {
        return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
    }

    function formatCourseTime(course) {
        return `${String(course.start_time).slice(0, 5)}–${String(course.end_time).slice(0, 5)} น.`;
    }

    setupTimePicker('courseStart', '09:00');
    setupTimePicker('courseEnd', '12:00');
    setupTimePicker('homeworkDue', '23:59');
    setupTimePicker('reschedule', '23:59');

    function courseById(id) {
        return courses.find(course => course.id === id);
    }

    function homeworkState(task) {
        const due = new Date(task.due_at);
        const complete = task.status === 'completed';
        const completedLate = complete && task.completed_at && new Date(task.completed_at) > due;
        const overdue = !complete && due < new Date();
        return {
            complete,
            late: task.timing_status === 'late' || completedLate || overdue,
            postponed: task.timing_status === 'postponed',
            overdue
        };
    }

    function courseDayFromDate(date) {
        return date.getDay() || 7;
    }

    function homeworkForDate(date) {
        const key = formatDateInput(date);
        return homework.filter(task => formatDateInput(new Date(task.due_at)) === key);
    }

    function renderCalendarAgenda(date) {
        const dailyCourses = courses
            .filter(course => Number(course.day_of_week) === courseDayFromDate(date))
            .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
        const dailyHomework = homeworkForDate(date)
            .sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
        byId('calendarAgendaTitle').textContent = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
        const courseItems = dailyCourses.map(course => `
            <button class="calendar-agenda-item course-event" type="button" data-calendar-course="${course.id}" style="--event-color:${escapeHTML(course.color)}">
                <i></i><div><span>วิชาเรียน</span><strong>${escapeHTML(course.name)}</strong><small>${course.room ? escapeHTML(course.room) : 'ยังไม่ระบุห้อง'}</small></div><time>${formatCourseTime(course)}</time>
            </button>`);
        const homeworkItems = dailyHomework.map(task => {
            const course = courseById(task.course_id) || { name: 'ไม่พบวิชา', color: '#c88cac' };
            const state = homeworkState(task);
            return `<button class="calendar-agenda-item homework-event ${state.complete ? 'completed' : ''}" type="button" data-calendar-homework="${task.id}" style="--event-color:${escapeHTML(course.color)}">
                <i></i><div><span>${state.complete ? 'การบ้านเสร็จแล้ว' : state.late ? 'การบ้านเลยกำหนด' : 'กำหนดส่งการบ้าน'}</span><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(course.name)}</small></div><time>${formatTimeInput(new Date(task.due_at))}</time>
            </button>`;
        });
        calendarAgendaList.innerHTML = [...courseItems, ...homeworkItems].join('') || '<p class="calendar-empty">วันนี้ยังไม่มีเรียนหรือการบ้านกำหนดส่ง 🌿</p>';
    }

    function renderCalendar() {
        const year = calendarCursor.getFullYear();
        const month = calendarCursor.getMonth();
        byId('calendarMonthTitle').textContent = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(calendarCursor);
        const firstDay = new Date(year, month, 1);
        const mondayOffset = (firstDay.getDay() + 6) % 7;
        const gridStart = new Date(year, month, 1 - mondayOffset);
        const todayKey = formatDateInput(new Date());
        calendarGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
            const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
            const dateKey = formatDateInput(date);
            const dailyCourses = courses.filter(course => Number(course.day_of_week) === courseDayFromDate(date));
            const dailyHomework = homeworkForDate(date);
            const homeworkLabels = dailyHomework.slice(0, 2).map(task => {
                const state = homeworkState(task);
                return `<span class="calendar-task-label ${state.complete ? 'completed' : state.late ? 'late' : ''}">📝 ${escapeHTML(task.title)}</span>`;
            }).join('');
            const extraCount = Math.max(0, dailyHomework.length - 2);
            return `<button type="button" role="gridcell" data-calendar-date="${dateKey}" class="calendar-day ${date.getMonth() !== month ? 'outside-month' : ''} ${dateKey === todayKey ? 'today' : ''} ${dateKey === selectedCalendarDate ? 'selected' : ''}" aria-selected="${dateKey === selectedCalendarDate}">
                <span class="calendar-day-number">${date.getDate()}</span>
                <span class="calendar-event-summary">
                    ${dailyCourses.length ? `<span class="calendar-class-count">📚 ${dailyCourses.length} วิชา</span>` : ''}
                    ${homeworkLabels}${extraCount ? `<small>+${extraCount} งาน</small>` : ''}
                </span>
            </button>`;
        }).join('');
        renderCalendarAgenda(new Date(`${selectedCalendarDate}T12:00:00`));
    }

    function renderWeekStrip() {
        weekStrip.innerHTML = dayNames.slice(1).map((day, index) => {
            const dayNumber = index + 1;
            return `<button type="button" data-day="${dayNumber}" class="${dayNumber === activeDay ? 'active' : ''}" aria-pressed="${dayNumber === activeDay}"><span class="day-full">${day}</span><span class="day-short">${shortDayNames[dayNumber]}</span></button>`;
        }).join('');
    }

    function renderSchedule() {
        renderWeekStrip();
        const dailyCourses = courses.filter(course => Number(course.day_of_week) === activeDay)
            .sort((first, second) => String(first.start_time).localeCompare(String(second.start_time)));
        if (!dailyCourses.length) {
            scheduleBoard.innerHTML = `<div class="planner-empty-card"><span>📚</span><h3>วัน${dayNames[activeDay]}ไม่มีเรียน</h3><p>เลือกวันอื่น หรือกด “เพิ่มวิชา” เพื่อสร้างตาราง</p></div>`;
            return;
        }
        scheduleBoard.innerHTML = `<section class="daily-schedule"><div class="daily-schedule-title"><span>ตารางวัน</span><h3>${dayNames[activeDay]}</h3></div><div class="daily-course-list">${dailyCourses.map(course => `
            <article class="daily-course-card" style="--course-color:${escapeHTML(course.color)}">
                <div class="daily-course-time"><strong>${String(course.start_time).slice(0, 5)}</strong><span>ถึง ${String(course.end_time).slice(0, 5)} น.</span></div>
                <i></i>
                <div class="daily-course-info"><strong>${escapeHTML(course.name)}</strong>${course.code ? `<small>${escapeHTML(course.code)}</small>` : ''}<span>${course.room ? `📍 ${escapeHTML(course.room)}` : '📍 ยังไม่ระบุห้อง'}${course.instructor ? ` · ${escapeHTML(course.instructor)}` : ''}</span></div>
                <div class="course-actions"><button type="button" data-edit-course="${course.id}">แก้ไข</button><button type="button" class="danger" data-delete-course="${course.id}">ลบ</button></div>
            </article>`).join('')}</div></section>`;
    }

    function populateHomeworkCourses(selectedId = '') {
        const select = byId('homeworkCourse');
        if (!courses.length) {
            select.innerHTML = '<option value="">เพิ่มวิชาในตารางเรียนก่อน</option>';
            select.disabled = true;
            return;
        }
        select.disabled = false;
        select.innerHTML = courses
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, 'th'))
            .map(course => `<option value="${course.id}" ${course.id === selectedId ? 'selected' : ''}>${escapeHTML(course.name)}${course.code ? ` · ${escapeHTML(course.code)}` : ''}</option>`)
            .join('');
    }

    function matchesHomeworkFilter(task) {
        const state = homeworkState(task);
        if (activeHomeworkFilter === 'pending') return !state.complete;
        if (activeHomeworkFilter === 'completed') return state.complete;
        if (activeHomeworkFilter === 'late') return state.late;
        if (activeHomeworkFilter === 'postponed') return state.postponed;
        return true;
    }

    function renderHomeworkSummary() {
        const states = homework.map(homeworkState);
        const stats = [
            [homework.length, 'ทั้งหมด'],
            [states.filter(state => !state.complete).length, 'กำลังทำ'],
            [states.filter(state => state.complete).length, 'เสร็จแล้ว'],
            [states.filter(state => state.late).length, 'ช้า/เลยกำหนด']
        ];
        homeworkSummary.innerHTML = stats.map(([value, label]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join('');
    }

    function renderHomework() {
        renderHomeworkSummary();
        document.querySelectorAll('[data-homework-filter]').forEach(button => button.classList.toggle('active', button.dataset.homeworkFilter === activeHomeworkFilter));
        const visibleTasks = homework.filter(matchesHomeworkFilter).sort((first, second) => {
            const firstComplete = first.status === 'completed' ? 1 : 0;
            const secondComplete = second.status === 'completed' ? 1 : 0;
            return firstComplete - secondComplete || new Date(first.due_at) - new Date(second.due_at);
        });
        if (!visibleTasks.length) {
            homeworkList.innerHTML = `<div class="planner-empty-card"><span>📝</span><h3>${homework.length ? 'ไม่มีงานในสถานะนี้' : 'ยังไม่มีการบ้าน'}</h3><p>${homework.length ? 'ลองเลือกตัวกรองอื่นดูนะ' : 'เพิ่มวิชาในตาราง แล้วสร้างการบ้านชิ้นแรกได้เลย'}</p></div>`;
            return;
        }
        homeworkList.innerHTML = visibleTasks.map(task => {
            const course = courseById(task.course_id) || { name: 'ไม่พบรายวิชา', color: '#c88cac' };
            const state = homeworkState(task);
            const badges = [
                state.complete ? '<span class="status-badge completed">เสร็จแล้ว</span>' : '<span class="status-badge">กำลังทำ</span>',
                state.postponed ? '<span class="status-badge postponed">เลื่อน</span>' : '',
                state.late ? '<span class="status-badge late">ช้า</span>' : ''
            ].join('');
            const changedDue = task.timing_status !== 'normal' && task.original_due_at
                ? `<small class="original-due">กำหนดเดิม ${formatDueDate(task.original_due_at)}</small>`
                : '';
            return `<article class="homework-card ${state.complete ? 'completed' : ''}" style="--course-color:${escapeHTML(course.color)}">
                <button class="homework-check" type="button" data-toggle-homework="${task.id}" aria-label="${state.complete ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}">${state.complete ? '✓' : ''}</button>
                <div class="homework-main">
                    <h3>${escapeHTML(task.title)}</h3>
                    <span class="homework-course">${escapeHTML(course.name)}</span>
                    ${task.details ? `<p>${escapeHTML(task.details)}</p>` : ''}
                    <div class="homework-due"><span>ส่ง ${formatDueDate(task.due_at)}</span>${badges}</div>
                    ${changedDue}
                </div>
                <div class="homework-actions">
                    <button type="button" data-edit-homework="${task.id}">แก้ไข</button>
                    ${state.complete ? '' : `<button type="button" data-reschedule-homework="${task.id}">เปลี่ยนเวลา</button>`}
                    <button type="button" class="danger" data-delete-homework="${task.id}">ลบ</button>
                </div>
            </article>`;
        }).join('');
    }

    function renderDashboard() {
        const now = new Date();
        byId('dashboardDate').textContent = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
        const firstName = plannerUser?.email?.split('@')[0] || '';
        byId('dashboardGreeting').textContent = `สวัสดี${firstName ? ` ${firstName}` : ''} 👋`;
        const todayCourses = courses.filter(course => Number(course.day_of_week) === todayDay).sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
        const pending = homework.filter(task => task.status !== 'completed');
        const threeDays = new Date(now.getTime() + 3 * 86400000);
        const dueSoon = pending.filter(task => new Date(task.due_at) <= threeDays);
        byId('todayClassCount').textContent = todayCourses.length;
        byId('pendingHomeworkCount').textContent = pending.length;
        byId('dueSoonCount').textContent = dueSoon.length;
        byId('dashboardTodayClasses').innerHTML = todayCourses.length ? todayCourses.map(course => `<article class="dashboard-list-item" style="--item-color:${escapeHTML(course.color)}"><i></i><div><strong>${escapeHTML(course.name)}</strong><small>${course.room ? escapeHTML(course.room) : 'ยังไม่ระบุห้อง'}</small></div><span>${formatCourseTime(course)}</span></article>`).join('') : '<p class="empty-state">วันนี้ยังไม่มีวิชาเรียน 🌿</p>';
        const upcoming = pending.slice().sort((a, b) => new Date(a.due_at) - new Date(b.due_at)).slice(0, 4);
        byId('dashboardUpcomingHomework').innerHTML = upcoming.length ? upcoming.map(task => {
            const course = courseById(task.course_id) || { name: 'ไม่พบวิชา', color: '#c88cac' };
            return `<article class="dashboard-list-item" style="--item-color:${escapeHTML(course.color)}"><i></i><div><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(course.name)}</small></div><span>${new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(new Date(task.due_at))}</span></article>`;
        }).join('') : '<p class="empty-state">ยังไม่มีการบ้านใกล้ส่ง 🎉</p>';
    }

    function renderAll() {
        renderCalendar();
        renderSchedule();
        populateHomeworkCourses();
        renderHomework();
        renderDashboard();
    }

    async function loadPlannerData() {
        if (!plannerUser) return;
        setPlannerMessage('scheduleMessage', 'กำลังโหลด...');
        setPlannerMessage('homeworkMessage', 'กำลังโหลด...');
        const [courseResult, homeworkResult] = await Promise.all([
            supabase.from('student_courses').select('id,user_id,name,code,instructor,day_of_week,start_time,end_time,room,color,created_at').order('day_of_week').order('start_time'),
            supabase.from('homework_tasks').select('id,user_id,course_id,title,details,due_at,original_due_at,status,timing_status,completed_at,created_at,updated_at').order('due_at')
        ]);
        if (courseResult.error || homeworkResult.error) {
            const message = friendlyPlannerError(courseResult.error || homeworkResult.error);
            setPlannerMessage('scheduleMessage', message, 'error');
            setPlannerMessage('homeworkMessage', message, 'error');
            return;
        }
        courses = courseResult.data || [];
        homework = homeworkResult.data || [];
        setPlannerMessage('scheduleMessage');
        setPlannerMessage('homeworkMessage');
        renderAll();
    }

    function resetCourseForm(course = null) {
        courseForm.reset();
        editingCourseId = course?.id || null;
        byId('courseDialogTitle').textContent = course ? 'แก้ไขวิชา' : 'เพิ่มวิชา';
        byId('courseName').value = course?.name || '';
        byId('courseCode').value = course?.code || '';
        byId('courseInstructor').value = course?.instructor || '';
        byId('courseDay').value = String(course?.day_of_week || activeDay);
        byId('courseColor').value = course?.color || '#f08fb7';
        setTimePicker('courseStart', course ? String(course.start_time).slice(0, 5) : '09:00');
        setTimePicker('courseEnd', course ? String(course.end_time).slice(0, 5) : '12:00');
        byId('courseRoom').value = course?.room || '';
        setPlannerMessage('courseFormMessage');
    }

    function openCourseDialog(course = null) {
        resetCourseForm(course);
        courseDialog.showModal();
        window.setTimeout(() => byId('courseName').focus(), 50);
    }

    function openHomeworkDialog(task = null, dueDate = '') {
        if (!courses.length) {
            setPlannerMessage('homeworkMessage', 'เพิ่มวิชาในตารางเรียนก่อน แล้วจึงเพิ่มการบ้านได้', 'error');
            openTab('scheduleTab', byId('scheduleNavBtn'));
            return;
        }
        homeworkForm.reset();
        editingHomeworkId = task?.id || null;
        byId('homeworkDialogTitle').textContent = task ? 'แก้ไขการบ้าน' : 'เพิ่มการบ้าน';
        byId('homeworkTitle').value = task?.title || '';
        populateHomeworkCourses(task?.course_id || courses[0].id);
        const defaultDue = task ? new Date(task.due_at) : dueDate ? new Date(`${dueDate}T23:59:00`) : new Date(Date.now() + 86400000);
        byId('homeworkDueDate').value = formatDateInput(defaultDue);
        setTimePicker('homeworkDue', task ? formatTimeInput(defaultDue) : '23:59');
        byId('homeworkDueDate').disabled = Boolean(task);
        disableTimePicker('homeworkDue', Boolean(task));
        byId('homeworkDueDate').title = task ? 'ใช้ปุ่มเปลี่ยนเวลาเพื่อบันทึกสถานะช้าหรือเลื่อน' : '';
        timePickers.homeworkDue.forEach(id => { byId(id).title = byId('homeworkDueDate').title; });
        byId('homeworkDetails').value = task?.details || '';
        setPlannerMessage('homeworkFormMessage');
        homeworkDialog.showModal();
        window.setTimeout(() => byId('homeworkTitle').focus(), 50);
    }

    function openRescheduleDialog(task) {
        reschedulingHomeworkId = task.id;
        const currentDue = new Date(task.due_at);
        byId('rescheduleHomeworkName').textContent = task.title;
        byId('rescheduleType').value = new Date() > currentDue ? 'late' : 'postponed';
        byId('rescheduleDate').value = formatDateInput(currentDue);
        setTimePicker('reschedule', formatTimeInput(currentDue));
        setPlannerMessage('rescheduleFormMessage');
        rescheduleDialog.showModal();
    }

    async function askConfirmation(message, actionLabel) {
        if (typeof window.confirmAction === 'function') return window.confirmAction(message, actionLabel);
        return window.confirm(message);
    }

    courseForm.addEventListener('submit', async event => {
        event.preventDefault();
        const startTime = getTimePicker('courseStart');
        const endTime = getTimePicker('courseEnd');
        if (endTime <= startTime) {
            setPlannerMessage('courseFormMessage', 'เวลาเลิกเรียนต้องอยู่หลังเวลาเริ่มเรียน', 'error');
            return;
        }
        const payload = {
            user_id: plannerUser.id,
            name: byId('courseName').value.trim(),
            code: byId('courseCode').value.trim() || null,
            instructor: byId('courseInstructor').value.trim() || null,
            day_of_week: Number(byId('courseDay').value),
            start_time: startTime,
            end_time: endTime,
            room: byId('courseRoom').value.trim() || null,
            color: byId('courseColor').value
        };
        const button = byId('saveCourseBtn');
        button.disabled = true;
        const result = editingCourseId
            ? await supabase.from('student_courses').update(payload).eq('id', editingCourseId)
            : await supabase.from('student_courses').insert(payload);
        button.disabled = false;
        if (result.error) {
            setPlannerMessage('courseFormMessage', friendlyPlannerError(result.error), 'error');
            return;
        }
        courseDialog.close();
        await loadPlannerData();
        setPlannerMessage('scheduleMessage', editingCourseId ? 'แก้ไขวิชาแล้ว' : 'เพิ่มวิชาแล้ว', 'success');
    });

    homeworkForm.addEventListener('submit', async event => {
        event.preventDefault();
        const dueAt = localDateTimeToISO(byId('homeworkDueDate').value, getTimePicker('homeworkDue'));
        const payload = {
            user_id: plannerUser.id,
            course_id: byId('homeworkCourse').value,
            title: byId('homeworkTitle').value.trim(),
            details: byId('homeworkDetails').value.trim() || null
        };
        if (!editingHomeworkId) {
            payload.due_at = dueAt;
            payload.original_due_at = dueAt;
        }
        const button = byId('saveHomeworkBtn');
        button.disabled = true;
        const result = editingHomeworkId
            ? await supabase.from('homework_tasks').update(payload).eq('id', editingHomeworkId)
            : await supabase.from('homework_tasks').insert(payload);
        button.disabled = false;
        if (result.error) {
            setPlannerMessage('homeworkFormMessage', friendlyPlannerError(result.error), 'error');
            return;
        }
        homeworkDialog.close();
        await loadPlannerData();
        setPlannerMessage('homeworkMessage', editingHomeworkId ? 'แก้ไขการบ้านแล้ว' : 'เพิ่มการบ้านแล้ว', 'success');
    });

    rescheduleForm.addEventListener('submit', async event => {
        event.preventDefault();
        const task = homework.find(item => item.id === reschedulingHomeworkId);
        if (!task) return;
        const newDueAt = localDateTimeToISO(byId('rescheduleDate').value, getTimePicker('reschedule'));
        if (new Date(newDueAt).getTime() === new Date(task.due_at).getTime()) {
            setPlannerMessage('rescheduleFormMessage', 'กรุณาเลือกวันหรือเวลาใหม่ก่อนบันทึก', 'error');
            return;
        }
        if (new Date(newDueAt) <= new Date()) {
            setPlannerMessage('rescheduleFormMessage', 'กำหนดส่งใหม่ต้องเป็นเวลาในอนาคต', 'error');
            return;
        }
        const result = await supabase.from('homework_tasks').update({
            original_due_at: task.original_due_at || task.due_at,
            due_at: newDueAt,
            timing_status: byId('rescheduleType').value,
            status: 'pending',
            completed_at: null
        }).eq('id', task.id);
        if (result.error) {
            setPlannerMessage('rescheduleFormMessage', friendlyPlannerError(result.error), 'error');
            return;
        }
        rescheduleDialog.close();
        await loadPlannerData();
        setPlannerMessage('homeworkMessage', 'บันทึกกำหนดส่งใหม่และสถานะแล้ว', 'success');
    });

    weekStrip.addEventListener('click', event => {
        const button = event.target.closest('[data-day]');
        if (!button) return;
        activeDay = Number(button.dataset.day);
        renderSchedule();
    });

    scheduleBoard.addEventListener('click', async event => {
        const editButton = event.target.closest('[data-edit-course]');
        const deleteButton = event.target.closest('[data-delete-course]');
        if (editButton) openCourseDialog(courses.find(course => course.id === editButton.dataset.editCourse));
        if (deleteButton) {
            const course = courses.find(item => item.id === deleteButton.dataset.deleteCourse);
            if (!course || !await askConfirmation(`วิชา “${course.name}” และการบ้านที่ผูกกับวิชานี้จะถูกลบ`, 'ลบวิชา')) return;
            const { error } = await supabase.from('student_courses').delete().eq('id', course.id);
            if (error) setPlannerMessage('scheduleMessage', friendlyPlannerError(error), 'error');
            else await loadPlannerData();
        }
    });

    document.querySelectorAll('[data-planner-view]').forEach(button => button.addEventListener('click', () => {
        document.querySelectorAll('[data-planner-view]').forEach(item => {
            const active = item === button;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', String(active));
        });
        document.querySelectorAll('.planner-view-panel').forEach(panel => {
            panel.hidden = panel.id !== button.dataset.plannerView;
        });
    }));

    calendarGrid.addEventListener('click', event => {
        const dayButton = event.target.closest('[data-calendar-date]');
        if (!dayButton) return;
        selectedCalendarDate = dayButton.dataset.calendarDate;
        const selected = new Date(`${selectedCalendarDate}T12:00:00`);
        activeDay = courseDayFromDate(selected);
        calendarCursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
        renderCalendar();
    });

    calendarAgendaList.addEventListener('click', event => {
        const courseButton = event.target.closest('[data-calendar-course]');
        const homeworkButton = event.target.closest('[data-calendar-homework]');
        if (courseButton) openCourseDialog(courses.find(course => course.id === courseButton.dataset.calendarCourse));
        if (homeworkButton) openHomeworkDialog(homework.find(task => task.id === homeworkButton.dataset.calendarHomework));
    });

    byId('calendarPrevBtn').addEventListener('click', () => {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
        selectedCalendarDate = formatDateInput(calendarCursor);
        activeDay = courseDayFromDate(calendarCursor);
        renderCalendar();
    });
    byId('calendarNextBtn').addEventListener('click', () => {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
        selectedCalendarDate = formatDateInput(calendarCursor);
        activeDay = courseDayFromDate(calendarCursor);
        renderCalendar();
    });
    byId('calendarTodayBtn').addEventListener('click', () => {
        const today = new Date();
        calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
        selectedCalendarDate = formatDateInput(today);
        activeDay = courseDayFromDate(today);
        renderCalendar();
    });
    byId('calendarAddHomeworkBtn').addEventListener('click', () => openHomeworkDialog(null, selectedCalendarDate));

    homeworkList.addEventListener('click', async event => {
        const toggleButton = event.target.closest('[data-toggle-homework]');
        const editButton = event.target.closest('[data-edit-homework]');
        const rescheduleButton = event.target.closest('[data-reschedule-homework]');
        const deleteButton = event.target.closest('[data-delete-homework]');
        if (toggleButton) {
            const task = homework.find(item => item.id === toggleButton.dataset.toggleHomework);
            const complete = task.status !== 'completed';
            const { error } = await supabase.from('homework_tasks').update({ status: complete ? 'completed' : 'pending', completed_at: complete ? new Date().toISOString() : null }).eq('id', task.id);
            if (error) setPlannerMessage('homeworkMessage', friendlyPlannerError(error), 'error'); else await loadPlannerData();
        }
        if (editButton) openHomeworkDialog(homework.find(task => task.id === editButton.dataset.editHomework));
        if (rescheduleButton) openRescheduleDialog(homework.find(task => task.id === rescheduleButton.dataset.rescheduleHomework));
        if (deleteButton) {
            const task = homework.find(item => item.id === deleteButton.dataset.deleteHomework);
            if (!task || !await askConfirmation(`การบ้าน “${task.title}” จะถูกลบถาวร`, 'ลบการบ้าน')) return;
            const { error } = await supabase.from('homework_tasks').delete().eq('id', task.id);
            if (error) setPlannerMessage('homeworkMessage', friendlyPlannerError(error), 'error'); else await loadPlannerData();
        }
    });

    document.querySelectorAll('[data-homework-filter]').forEach(button => button.addEventListener('click', () => {
        activeHomeworkFilter = button.dataset.homeworkFilter;
        renderHomework();
    }));
    byId('addCourseBtn').addEventListener('click', () => openCourseDialog());
    byId('quickAddCourseBtn').addEventListener('click', () => openCourseDialog());
    byId('addHomeworkBtn').addEventListener('click', () => openHomeworkDialog());
    byId('quickAddHomeworkBtn').addEventListener('click', () => openHomeworkDialog());
    byId('cancelCourseBtn').addEventListener('click', () => courseDialog.close());
    byId('cancelHomeworkBtn').addEventListener('click', () => homeworkDialog.close());
    byId('cancelRescheduleBtn').addEventListener('click', () => rescheduleDialog.close());
    byId('appSignOutBtn').addEventListener('click', () => supabase.auth.signOut());

    async function setPlannerUser(user) {
        plannerUser = user || null;
        if (!plannerUser) {
            loadedForUserId = null;
            courses = [];
            homework = [];
            return;
        }
        if (loadedForUserId === plannerUser.id) return;
        loadedForUserId = plannerUser.id;
        await loadPlannerData();
    }

    window.addEventListener('pdfmagic:auth', event => setPlannerUser(event.detail.user));
    supabase.auth.getSession().then(({ data }) => setPlannerUser(data.session?.user || null));
})();
