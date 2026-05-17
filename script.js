// --- CONFIG ---
const webAppUrl = 'https://script.google.com/macros/s/AKfycbxrLSl2CHVeuOrqKRxPiexZfzCSq5bqfkQZRFD1ooUCjI18TQFwfXpDRqKwvaCtEGT_/exec';

// --- LOCAL AUTH CREDENTIALS ---
const AUTH_CONFIG = {
    admin: { user: 'admin', pass: 'admin123', role: 'admin' },
    staff: { user: 'staff', pass: 'staff123', role: 'staff' }
};

// --- HELPERS ---
const getTodayDate = () => new Date().toISOString().split('T')[0];

const saveState = () => {
    localStorage.setItem('academyHubState', JSON.stringify(state));
    if (window.firebaseDB) {
        syncAllToFirebase();
    }
};

const saveStateLocalOnly = () => {
    localStorage.setItem('academyHubState', JSON.stringify(state));
};


const syncAllStudents = () => {
    syncWithGoogleSheets({
        action: 'sync_all_students',
        students: state.students
    });
};

const syncAllStaff = () => {
    syncWithGoogleSheets({
        action: 'sync_all_staff',
        staff: state.staff
    });
};

const syncWithGoogleSheets = (data) => {
  if (!webAppUrl) return;
  fetch(webAppUrl, {
    method: 'POST',
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(res => console.log('Sync response:', res))
    .catch(err => console.error('Sync error:', err));
};
// --- STATE MANAGEMENT ---
const defaultState = {
    currentSection: 'attendance',
    studentFilter: 'all',
    studentSearchQuery: '',
    students: [
        { id: 'STU001', name: 'Arun Kumar', fatherName: 'Kumarasamy', schoolName: 'City Higher Secondary', email: 'arun.k@example.com', phone: '+91 98765 00001', phoneSecondary: '+91 98765 00011', dob: '2005-06-15', joinDate: '2024-01-10', session: 'Both', address: '123 Tech Park, Chennai', course: 'Computer Science', startTime: '09:00', endTime: '11:00', startTime2: '16:00', endTime2: '18:00', status: 'Active', attendanceHistory: {} },
        { id: 'STU002', name: 'Priya Dharshini', fatherName: 'Dharmaraj', schoolName: 'Memorial School', email: 'priya.d@example.com', phone: '+91 98765 00002', phoneSecondary: '+91 98765 00022', dob: '2006-02-10', joinDate: '2024-01-15', session: 'Evening', address: '45 Gandhi Road, Madurai', course: 'Business Admin', startTime: '16:00', endTime: '18:00', status: 'Active', attendanceHistory: {} },
        { id: 'STU003', name: 'Sanjay Viswan', fatherName: 'Viswanathan', schoolName: 'Vivekananda Vidyalaya', email: 'sanjay.v@example.com', phone: '+91 98765 00003', phoneSecondary: '+91 98765 00033', dob: '2005-11-22', joinDate: '2024-02-01', session: 'Morning', address: '88 Lotus Colony, Coimbatore', course: 'Data Science', startTime: '11:00', endTime: '13:00', status: 'Active', attendanceHistory: {} },
        { id: 'STU004', name: 'Meera Nair', fatherName: 'Narayanan', schoolName: 'Govt Girls School', email: 'meera.n@example.com', phone: '+91 98765 00004', phoneSecondary: '+91 98765 00044', dob: '2006-08-05', joinDate: '2024-02-15', session: 'Evening', address: '12 Pearl Heights, Trichy', course: 'UI/UX Design', startTime: '18:00', endTime: '20:00', status: 'Discontinued', attendanceHistory: {} }
    ],
    staff: [
        { id: 'STF001', name: 'Prof. Rajesh', department: 'Technology', position: 'Head of Dept', password: 'staff123' },
        { id: 'STF002', name: 'Dr. Anita', department: 'Science', position: 'Senior Lecturer', password: 'staff123' }
    ],
    transactions: [],
    activities: [
        { message: 'System initialized successfully', time: 'Just now' },
        { message: 'Academic year 2024-25 records loaded', time: '2 hours ago' }
    ],
    attendanceType: 'students',
    viewingDate: getTodayDate(),
    pendingAttendance: {}
};

const state = JSON.parse(localStorage.getItem('academyHubState')) || defaultState;
// Sync all existing data to Google Sheets on first load
if (!localStorage.getItem('academyHubState')) {
    syncAllStudents();
    syncAllStaff();
}

// Ensure state integrity
state.students.forEach(s => {
    if (!s.attendanceHistory) s.attendanceHistory = {};
});
if (!state.viewingDate) state.viewingDate = getTodayDate();

// --- DOM ELEMENTS ---
const sections = document.querySelectorAll('.content-section');
const navLinks = document.querySelectorAll('.nav-link');
const studentTableBody = document.getElementById('studentTableBody');

// --- DASHBOARD LOGIC ---
function updateDashboardStats() {
    const studentCount = document.getElementById('totalStudentCount');
    const staffCount = document.getElementById('totalStaffCount');
    const avgAttendance = document.getElementById('avgAttendance');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpensesEl = document.getElementById('totalExpenses');
    const netBalanceEl = document.getElementById('netBalance');
    
    const activeStudentsToday = state.students.filter(s => s.status !== 'Discontinued');
    if (studentCount) studentCount.innerText = activeStudentsToday.length.toLocaleString();
    if (staffCount) staffCount.innerText = state.staff.length.toLocaleString();

    const todayKey = getTodayDate();
    const presentCount = activeStudentsToday.filter(s => {
        let rec = s.attendanceHistory ? s.attendanceHistory[todayKey] : null;
        let status = (typeof rec === 'object' && rec !== null) ? rec.status : rec;
        return status === 'P';
    }).length;
    const total = activeStudentsToday.length;
    const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    if (avgAttendance) avgAttendance.innerText = percentage + '%';

    const totalIncome = state.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    if (totalIncomeEl) totalIncomeEl.innerText = '₹' + totalIncome.toLocaleString('en-IN');

    const totalExpenses = state.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    if (totalExpensesEl) totalExpensesEl.innerText = '₹' + totalExpenses.toLocaleString('en-IN');

    const netBalance = totalIncome - totalExpenses;
    if (netBalanceEl) {
        netBalanceEl.innerText = '₹' + netBalance.toLocaleString('en-IN');
    }

    renderActivities();
}

function logActivity(message) {
    state.activities.unshift({ message, time: 'Just now' });
    if (state.activities.length > 5) state.activities.pop();
    renderActivities();
    saveState();
}

function renderActivities() {
    const list = document.getElementById('recentActivityList');
    if (!list) return;

    if (state.activities.length === 0) {
        list.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-dim);">No recent activity to show.</p>`;
        return;
    }

    list.innerHTML = state.activities.map(act => `
        <div style="display: flex; gap: 12px; margin-bottom: 16px; align-items: flex-start;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-top: 6px;"></div>
            <div>
                <p style="font-size: 0.85rem; font-weight: 500;">${act.message}</p>
                <p style="font-size: 0.7rem; color: var(--text-dim);">${act.time}</p>
            </div>
        </div>
    `).join('');
}

function renderDashboardChart() {
    // Placeholder — chart is currently static SVG in HTML
    console.log('Dashboard chart rendered.');
}

// --- NAVIGATION LOGIC ---
function switchSection(sectionId) {
    sections.forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });

    navLinks.forEach(link => {
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    state.currentSection = sectionId;
    renderSection(sectionId);
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.dataset.section;
        switchSection(sectionId);
        
        // Close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            toggleSidebar(false);
        }
    });
});

function toggleSidebar(force) {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (force !== undefined) {
        if (force) sidebar.classList.add('active');
        else sidebar.classList.remove('active');
    } else {
        sidebar.classList.toggle('active');
    }
    
    if (sidebar.classList.contains('active')) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.style.opacity = '1', 10);
    } else {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
    }
}

// --- RENDERING LOGIC ---
function renderSection(sectionId) {
    if (sectionId === 'students') renderStudents();
    if (sectionId === 'staff') renderStaff();
    if (sectionId === 'attendance') renderAttendanceSheet();
    if (sectionId === 'finance') renderFinance();
    if (sectionId === 'archive') renderArchive();
    updateDashboardStats();
}

function renderFinance() {
    const incomeList = document.getElementById('incomeList');
    const expenseList = document.getElementById('expenseList');
    if (!incomeList || !expenseList) return;

    const renderTransaction = (t) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 12px; margin-bottom: 8px; border: 1px solid var(--border);">
            <div>
                <p style="font-weight: 600; font-size: 0.9rem;">${t.category}${t.studentName ? ` - ${t.studentName}` : ''}</p>
                <p style="font-size: 0.75rem; color: var(--text-dim);">${t.date}</p>
            </div>
            <p style="font-weight: 800; color: ${t.type === 'income' ? '#10b981' : '#f43f5e'};">
                ${t.type === 'income' ? '+' : '-'} ₹${t.amount.toLocaleString('en-IN')}
            </p>
        </div>
    `;

    incomeList.innerHTML = state.transactions
        .filter(t => t.type === 'income')
        .map(renderTransaction).join('');

    expenseList.innerHTML = state.transactions
        .filter(t => t.type === 'expense')
        .map(renderTransaction).join('');
}

function renderAttendanceSheet() {
    const container = document.getElementById('quickAttendanceBody');
    const datePicker = document.getElementById('attendanceDatePicker');
    const todayPresence = document.getElementById('todayPresenceValue');

    
    if (!container) return;

    if (datePicker && !datePicker.value) {
        datePicker.value = state.viewingDate;
    }
    
    const viewingDate = (datePicker && datePicker.value) || state.viewingDate;
    state.viewingDate = viewingDate;

    const displayDate = new Date(viewingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateLabel = document.getElementById('attendanceDate');
    if (dateLabel) dateLabel.innerText = displayDate;

    // Filter students: Include if active OR if they have a record for this specific date (historical view)
    const studentsForDate = state.students.filter(s => {
        const isCurrentlyActive = s.status !== 'Discontinued';
        const hasRecordForDate = s.attendanceHistory && s.attendanceHistory[viewingDate];
        const joinedOnOrBefore = s.joinDate ? s.joinDate <= viewingDate : true;
        
        return hasRecordForDate || (isCurrentlyActive && joinedOnOrBefore);
    });

    const todayKey = viewingDate;
    container.innerHTML = studentsForDate.map(student => {
        const record = state.pendingAttendance[student.id] || (student.attendanceHistory && student.attendanceHistory[todayKey]);
        const status = (typeof record === 'object' && record !== null) ? record.status : (record || '');
        const timeStr = (typeof record === 'object' && record !== null && record.time) ? record.time : '--:--';

        return `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; color: var(--primary);">
                        ${student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style="font-weight: 500;">${student.name}</span>
                </div>
            </td>
            <td style="color: var(--text-dim); font-size: 0.85rem;">${timeStr}</td>
            <td>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn ${status === 'P' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="markAttendance('${student.id}', 'P')" 
                            style="padding: 6px 12px; min-width: 45px; ${status === 'P' ? 'background: #10b981; border: none;' : ''}">P</button>

                    <button class="btn ${status === 'A' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="markAttendance('${student.id}', 'A')" 
                            style="padding: 6px 12px; min-width: 45px; ${status === 'A' ? 'background: #f43f5e; border: none;' : ''}">A</button>
                </div>
            </td>
        </tr>
    `;}).join('');

    const presentCount = studentsForDate.filter(s => {
        let rec = state.pendingAttendance[s.id] || (s.attendanceHistory && s.attendanceHistory[todayKey]);
        let status = (typeof rec === 'object' && rec !== null) ? rec.status : (rec || '');
        return status === 'P';
    }).length;

    const total = studentsForDate.length;
    const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    if (todayPresence) todayPresence.innerText = percentage + '%';

    updateDashboardStats();
}

function markAttendance(studentId, status) {
    if (!state.pendingAttendance) state.pendingAttendance = {};
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    state.pendingAttendance[studentId] = { status, time: currentTime };
    renderAttendanceSheet();
}

function markAllPresent() {
    if (!state.pendingAttendance) state.pendingAttendance = {};
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    state.students.forEach(s => {
        if (s.status !== 'Discontinued') {
            state.pendingAttendance[s.id] = { status: 'P', time: currentTime };
        }
    });
    renderAttendanceSheet();
}

function confirmAttendance() {
    const todayKey = state.viewingDate;
    let updatedCount = 0;
    let syncData = [];
    
    if (state.pendingAttendance && Object.keys(state.pendingAttendance).length > 0) {
        state.students.forEach(s => {
            if (state.pendingAttendance[s.id]) {
                if (!s.attendanceHistory) s.attendanceHistory = {};
                s.attendanceHistory[todayKey] = state.pendingAttendance[s.id];
                updatedCount++;
                
                syncData.push({
                    date: todayKey,
                    studentId: s.id,
                    studentName: s.name,
                    status: state.pendingAttendance[s.id].status,
                    time: state.pendingAttendance[s.id].time
                });
            }
        });

        // Sync to Google Sheets
        syncWithGoogleSheets({
            action: 'sync_attendance',
            attendance: syncData
        });

        state.pendingAttendance = {}; // Clear pending
        renderAttendanceSheet();
        saveState();
        
        if (updatedCount > 0) {
            logActivity(`Saved attendance for ${updatedCount} students on ${todayKey}`);
            alert(`Successfully saved attendance for ${todayKey}!`);
        }
    } else {
        alert("No changes to save.");
    }
}

function renderStudents() {
    if (!studentTableBody) return;
    
    // Filter students
    let filteredStudents = state.students.filter(s => s.status !== 'Discontinued');

    // Apply Tab Filter
    if (state.studentFilter !== 'all') {
        if (state.studentFilter === 'paid') {
            filteredStudents = filteredStudents.filter(s => isFeePaid(s));
        } else if (state.studentFilter === 'unpaid') {
            filteredStudents = filteredStudents.filter(s => !isFeePaid(s));
        } else {
            // Course filters: Tuition, Computer, Both
            filteredStudents = filteredStudents.filter(s => s.course === state.studentFilter);
        }
    }

    // Apply Search Query
    if (state.studentSearchQuery) {
        const query = state.studentSearchQuery.toLowerCase();
        filteredStudents = filteredStudents.filter(s => 
            s.name.toLowerCase().includes(query) || 
            s.id.toLowerCase().includes(query)
        );
    }

    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-dim);">No students found matching your criteria.</td></tr>`;
        return;
    }

    const currentRole = sessionStorage.getItem('academyHubUserRole');
    const isAdmin = currentRole === 'admin';

    studentTableBody.innerHTML = filteredStudents.map(student => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="viewStudentDetail('${student.id}')">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800;">
                        ${student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style="font-weight: 600; color: var(--primary);">${student.name}</span>
                </div>
            </td>
            <td>${student.course}</td>
            <td style="font-size: 0.8rem; font-weight: 500; color: var(--primary);">
                ${student.startTime || '--:--'} - ${student.endTime || '--:--'}
                ${student.session === 'Both' ? `<br><span style="color:var(--text-dim)">${student.startTime2 || '--:--'} - ${student.endTime2 || '--:--'}</span>` : ''}
            </td>

            <td>
                <span class="status-pill ${student.status.toLowerCase()}">${student.status}</span>
                <br>
                <span style="font-size: 0.7rem; color: var(--text-dim); margin-top: 4px; display: block;">
                    Fee: ₹${student.monthlyFee || 500}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    ${isAdmin ? (isFeePaid(student) ? 
                        `<button class="btn btn-secondary" style="padding: 6px 10px; color: #10b981; border-color: rgba(16, 185, 129, 0.2); background: rgba(16, 185, 129, 0.1);" onclick="unpayFee('${student.id}')" title="Click to mark as Unpaid">
                            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none"><polyline points="20 6 9 17 4 12"/></svg> Paid
                        </button>` : 
                        `<button class="btn btn-secondary" style="padding: 6px 10px; color: var(--primary); border-color: var(--primary-glow);" onclick="collectFee('${student.id}')">Collect ₹${student.monthlyFee || 500}</button>`
                    ) : ''}
                    <a href="tel:${student.phone}" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: #10b981;" title="Call Student">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.28-2.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </a>
                    <a href="https://wa.me/${student.phone.replace(/\D/g, '')}" target="_blank" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: #25d366;" title="WhatsApp Student">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/></svg>
                    </a>
                    ${isAdmin ? `<button class="btn btn-secondary" style="padding: 6px 10px;" onclick="editStudent('${student.id}')">Edit</button>
                    <button class="btn btn-secondary" style="padding: 6px 10px; color: ${student.status === 'Active' ? '#f43f5e' : '#10b981'}" onclick="toggleStudentStatus('${student.id}')">
                        ${student.status === 'Active' ? 'Archive' : 'Restore'}
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function toggleStudentStatus(id) {
    const student = state.students.find(s => s.id === id);
    if (student) {
        student.status = student.status === 'Active' ? 'Discontinued' : 'Active';
        logActivity(`${student.status === 'Active' ? 'Restored' : 'Archived'} student: ${student.name}`);
        
        // Sync status change
        syncWithGoogleSheets({
            action: 'update_student_status',
            student: {
                id: student.id,
                name: student.name,
                status: student.status
            }
        });

        renderStudents();
        renderArchive();
        renderAttendanceSheet();
        updateDashboardStats();
        saveState();
    }
}

function renderArchive() {
    const archiveTableBody = document.getElementById('archiveTableBody');
    if (!archiveTableBody) return;

    const discontinuedStudents = state.students.filter(s => s.status === 'Discontinued');
    archiveTableBody.innerHTML = discontinuedStudents.map(student => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="viewStudentDetail('${student.id}')">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; color: #f43f5e;">
                        ${student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style="font-weight: 600; color: var(--text);">${student.name}</span>
                </div>
            </td>
            <td>${student.course}</td>
            <td style="font-size: 0.8rem; font-weight: 500;">
                ${student.startTime || '--:--'} - ${student.endTime || '--:--'}
            </td>
            <td><span class="status-pill discontinued">${student.status}</span></td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <a href="tel:${student.phone}" class="btn btn-secondary" style="padding: 6px; border-radius: 8px; color: #10b981;">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.28-2.28a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </a>
                    <button class="btn btn-secondary" style="padding: 6px 10px; color: #10b981;" onclick="toggleStudentStatus('${student.id}')">
                        Restore
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function editStudent(id) {
    const student = state.students.find(s => s.id === id);
    if (!student) return;

    document.getElementById('modalTitle').innerText = 'Edit Student';
    document.getElementById('editStudentId').value = student.id;
    document.getElementById('studentNameInput').value = student.name;
    document.getElementById('studentFatherNameInput').value = student.fatherName || '';
    document.getElementById('studentSchoolInput').value = student.schoolName || '';
    document.getElementById('studentPhoneInput').value = student.phone || '';
    document.getElementById('studentPhoneSecondaryInput').value = student.phoneSecondary || '';
    document.getElementById('studentDobInput').value = student.dob || '';
    document.getElementById('studentJoinDateInput').value = student.joinDate || '';
    document.getElementById('studentSessionInput').value = student.session || 'Morning';
    document.getElementById('studentAddressInput').value = student.address || '';
    document.getElementById('studentCourseInput').value = student.course;
    document.getElementById('studentEndTimeInput').value = student.endTime || '';
    document.getElementById('studentStartTimeInput2').value = student.startTime2 || '';
    document.getElementById('studentEndTimeInput2').value = student.endTime2 || '';
    document.getElementById('studentFeeInput').value = student.monthlyFee || '500';

    // Trigger session type layout update
    const sessionInput = document.getElementById('studentSessionInput');
    const timingSection2 = document.getElementById('timingSection2');
    const timingLabel1 = document.getElementById('timingLabel1');
    
    if (sessionInput.value === 'Both') {
        timingSection2.style.display = 'block';
        timingLabel1.innerText = 'Morning Session Timing';
    } else {
        timingSection2.style.display = 'none';
        timingLabel1.innerText = 'Session Timing';
    }

    showModal('studentModal');
}

const studentForm = document.getElementById('studentForm');
if (studentForm) {
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editStudentId').value;
        const name = document.getElementById('studentNameInput').value;
        const fatherName = document.getElementById('studentFatherNameInput').value;
        const schoolName = document.getElementById('studentSchoolInput').value;
        const phone = document.getElementById('studentPhoneInput').value;
        const phoneSecondary = document.getElementById('studentPhoneSecondaryInput').value;
        const dob = document.getElementById('studentDobInput').value;
        const joinDate = document.getElementById('studentJoinDateInput').value;
        const session = document.getElementById('studentSessionInput').value;
        const address = document.getElementById('studentAddressInput').value;
        const course = document.getElementById('studentCourseInput').value;
        const startTime = document.getElementById('studentStartTimeInput').value;
        const endTime = document.getElementById('studentEndTimeInput').value;
        const startTime2 = document.getElementById('studentStartTimeInput2').value;
        const endTime2 = document.getElementById('studentEndTimeInput2').value;
        const monthlyFee = document.getElementById('studentFeeInput').value;

        let studentData = { name, fatherName, schoolName, phone, phoneSecondary, dob, joinDate, session, address, course, startTime, endTime, startTime2, endTime2, monthlyFee };
        let action = '';

        if (id) {
            const index = state.students.findIndex(s => s.id === id);
            if (index !== -1) {
                studentData.id = id;
                studentData.status = state.students[index].status;
                studentData.attendanceHistory = state.students[index].attendanceHistory;
                state.students[index] = { ...state.students[index], ...studentData };
                action = 'update_student';
                logActivity(`Updated profile for ${name}`);
            }
        } else {
            const newId = 'STU' + String(state.students.length + 1).padStart(3, '0');
            studentData.id = newId;
            studentData.status = 'Active';
            studentData.attendanceHistory = {};
            state.students.push(studentData);
            action = 'add_student';
            logActivity(`Registered new student: ${name}`);
        }

        // Sync with Google Sheets
        if (action) {
            syncAllStudents();
        }

        hideModal('studentModal');
        renderStudents();
        updateDashboardStats();
        saveState();
        studentForm.reset();
        document.getElementById('editStudentId').value = '';
    });
}

function renderStaff() {
    const staffTableBody = document.getElementById('staffTableBody');
    if (!staffTableBody) return;
    
    staffTableBody.innerHTML = state.staff.map(member => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; color: var(--secondary);">
                        ${member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style="font-weight: 600;">${member.name}</span>
                    <span style="font-size: 0.7rem; color: var(--text-muted); display: block;">ID: ${member.id}</span>
                </div>
            </td>
            <td>${member.department}</td>
            <td>${member.position}</td>
            <td>
                <button class="btn btn-secondary" style="padding: 6px 10px;" onclick="editStaff('${member.id}')">Edit</button>
            </td>
        </tr>
    `).join('');
}

function editStaff(id) {
    const member = state.staff.find(s => s.id === id);
    if (!member) return;

    document.getElementById('staffModalTitle').innerText = 'Edit Staff Member';
    document.getElementById('editStaffId').value = member.id;
    document.getElementById('staffNameInput').value = member.name;
    document.getElementById('staffDeptInput').value = member.department;
    document.getElementById('staffPosInput').value = member.position;
    document.getElementById('staffEmailInput').value = member.email || '';
    document.getElementById('staffPhoneInput').value = member.phone || '';
    document.getElementById('staffPassInput').value = member.password || 'staff123';

    showModal('staffModal');
}

const staffForm = document.getElementById('staffForm');
if (staffForm) {
    staffForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editStaffId').value;
        const name = document.getElementById('staffNameInput').value;
        const department = document.getElementById('staffDeptInput').value;
        const position = document.getElementById('staffPosInput').value;
        const email = document.getElementById('staffEmailInput').value;
        const phone = document.getElementById('staffPhoneInput').value;
        const password = document.getElementById('staffPassInput').value || 'staff123';

        let staffData = { name, department, position, email, phone, password };
        let action = '';

        if (id) {
            const index = state.staff.findIndex(s => s.id === id);
            if (index !== -1) {
                staffData.id = id;
                state.staff[index] = { ...state.staff[index], ...staffData };
                action = 'update_staff';
                logActivity(`Updated profile for staff: ${name}`);
            }
        } else {
            const newId = 'STF' + String(state.staff.length + 1).padStart(3, '0');
            staffData.id = newId;
            state.staff.push(staffData);
            action = 'add_staff';
            logActivity(`Registered new staff: ${name}`);
        }

        // Sync with Google Sheets
        if (action) {
            syncWithGoogleSheets({
                action: action,
                staff: staffData
            });
        }

        hideModal('staffModal');
        renderStaff();
        updateDashboardStats();
        saveState();
        staffForm.reset();
        document.getElementById('editStaffId').value = '';
    });
}

function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        if (id === 'studentModal') {
            document.getElementById('modalTitle').innerText = 'Add New Student';
            document.getElementById('editStudentId').value = '';
            studentForm.reset();
        } else if (id === 'staffModal') {
            document.getElementById('staffModalTitle').innerText = 'Add New Staff';
            document.getElementById('editStaffId').value = '';
            staffForm.reset();
        }
    }
}

function renderDashboardChart() {
    const container = document.getElementById('attendanceChart');
    if (!container) return;
    
    const svg = container.querySelector('svg');
    if (svg) {
        svg.style.opacity = '0';
        svg.style.transform = 'translateY(10px)';
        setTimeout(() => {
            svg.style.transition = 'all 1s ease';
            svg.style.opacity = '1';
            svg.style.transform = 'translateY(0)';
        }, 100);
    }
}

function viewStudentDetail(id) {
    const student = state.students.find(s => s.id === id);
    if (!student) return;

    switchSection('student-details');

    document.getElementById('detailStudentName').innerText = student.name;
    document.getElementById('detailNameDisplay').innerText = student.name;
    
    const timeRange = student.session === 'Both' 
        ? `${student.startTime} - ${student.endTime} & ${student.startTime2} - ${student.endTime2}`
        : `${student.startTime} - ${student.endTime}`;
    
    document.getElementById('detailCourseDisplay').innerText = student.course;
    document.getElementById('detailPhone').innerText = student.phone || 'N/A';
    document.getElementById('detailMonthlyFee').innerText = '₹' + (student.monthlyFee || '500');
    
    // Detailed fields
    const fatherField = document.getElementById('detailFatherName');
    if (fatherField) fatherField.innerText = student.fatherName || 'N/A';
    
    const joinField = document.getElementById('detailJoinDate');
    if (joinField) joinField.innerText = student.joinDate || 'N/A';

    const schoolField = document.getElementById('detailSchoolName');
    if (schoolField) schoolField.innerText = student.schoolName || 'N/A';

    const dobField = document.getElementById('detailDob');
    if (dobField) dobField.innerText = student.dob || 'N/A';

    const pPhoneField = document.getElementById('detailPhonePrimary');
    if (pPhoneField) pPhoneField.innerText = student.phone || 'N/A';

    const sPhoneField = document.getElementById('detailPhoneSecondary');
    if (sPhoneField) sPhoneField.innerText = student.phoneSecondary || 'N/A';

    const sessionField = document.getElementById('detailSessionType');
    if (sessionField) sessionField.innerText = student.session || 'N/A';

    const timingField = document.getElementById('detailTimingRange');
    if (timingField) timingField.innerText = timeRange;

    const addressField = document.getElementById('detailAddress');
    if (addressField) addressField.innerText = student.address || 'N/A';

    const initials = student.name.split(' ').map(n => n[0]).join('');
    document.getElementById('detailAvatar').innerText = initials;

    const statusPill = document.getElementById('detailStatusPill');
    statusPill.innerText = student.status;
    statusPill.className = `status-pill ${student.status.toLowerCase()}`;

    document.getElementById('detailEditBtn').onclick = () => editStudent(student.id);
}

// --- Local initialization (skipping Firebase Auth) ---
function initFirebase() {
    console.log("Local Auth System Initialized...");
    
    // Check if already logged in from previous session
    const isLoggedIn = sessionStorage.getItem('academyHubLoggedIn') === 'true';
    if (isLoggedIn) {
        const role = sessionStorage.getItem('academyHubUserRole');
        const userEmail = sessionStorage.getItem('academyHubUserEmail');
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        applyRoleRestrictions(role, userEmail);
        
        const startSection = role === 'staff' ? 'attendance' : (state.currentSection || 'attendance');
        switchSection(startSection);
    }
    
    // We still keep the Realtime DB sync if you are using it for data
    // Setup Firebase Realtime DB sync
    if (window.firebaseDB && window.rtDB) {
        const { ref, onValue } = window.rtDB;
        const db = window.firebaseDB;
        
        // Listen for remote changes
        onValue(ref(db), (snapshot) => {
            const remoteData = snapshot.val();
            if (remoteData) {
                let changed = false;
                if (remoteData.students && JSON.stringify(remoteData.students) !== JSON.stringify(state.students)) {
                    state.students = remoteData.students;
                    changed = true;
                }
                if (remoteData.staff && JSON.stringify(remoteData.staff) !== JSON.stringify(state.staff)) {
                    state.staff = remoteData.staff;
                    changed = true;
                }
                if (remoteData.transactions && JSON.stringify(remoteData.transactions) !== JSON.stringify(state.transactions)) {
                    state.transactions = remoteData.transactions;
                    changed = true;
                }
                
                if (changed) {
                    saveStateLocalOnly();
                    renderStudents();
                    renderStaff();
                    renderAttendanceSheet();
                    updateDashboardStats();
                }
            }
        });
        console.log('Firebase Realtime DB listener initialized.');
    } else {
        // Fallback or initial sync if no remote data
        syncAllToFirebase();
    }
}

function quickLogin(type) {
    const config = AUTH_CONFIG[type];
    if (!config) return;

    // Set session data
    sessionStorage.setItem('academyHubLoggedIn', 'true');
    sessionStorage.setItem('academyHubUserRole', config.role);
    sessionStorage.setItem('academyHubUserEmail', config.user + "@aathirai.com");

    // UI Feedback
    const buttons = document.querySelectorAll('#loginActions button');
    buttons.forEach(b => b.disabled = true);
    
    setTimeout(() => {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        applyRoleRestrictions(config.role, config.user);
        
        const startSection = config.role === 'staff' ? 'attendance' : 'dashboard';
        switchSection(startSection);
        
        buttons.forEach(b => b.disabled = false);
    }, 400);
}

document.addEventListener('DOMContentLoaded', () => {
    // Login Form Handler — always attach, it will wait for Firebase internally
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userInput = document.getElementById('loginEmail').value.trim().toLowerCase();
            const passInput = document.getElementById('loginPassword').value.trim();
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // Check against hardcoded admin
            let loggedInUser = null;
            if (userInput === AUTH_CONFIG.admin.user.toLowerCase() && passInput === AUTH_CONFIG.admin.pass) {
                loggedInUser = { ...AUTH_CONFIG.admin, displayName: 'Administrator' };
            } else {
                // Check against staff list - Name only as per user request
                const staffMember = state.staff.find(s => 
                    s.name.toLowerCase() === userInput && 
                    (s.password === passInput || passInput === 'staff123')
                );
                
                if (staffMember) {
                    loggedInUser = { 
                        user: staffMember.id, 
                        role: 'staff', 
                        displayName: staffMember.name 
                    };
                }
            }

            if (loggedInUser) {
                submitBtn.innerText = 'Success!';
                sessionStorage.setItem('academyHubLoggedIn', 'true');
                sessionStorage.setItem('academyHubUserRole', loggedInUser.role);
                sessionStorage.setItem('academyHubUserEmail', loggedInUser.displayName);

                setTimeout(() => {
                    document.getElementById('loginScreen').style.display = 'none';
                    document.getElementById('appContainer').style.display = 'flex';
                    applyRoleRestrictions(loggedInUser.role, loggedInUser.user);
                    switchSection(loggedInUser.role === 'staff' ? 'attendance' : 'dashboard');
                }, 500);
            } else {
                alert('Invalid Username or Password. Please try again.');
                document.getElementById('password').value = '';
            }
        });
    }

// Google Login Handler (Disabled since using Local Auth)
// const googleLoginBtn = ...



    // Ensure any new students added before load are synced
    if (!localStorage.getItem('academyHubState')) {
        syncAllStudents();
        syncAllStaff();
    }
    switchSection(state.currentSection || 'attendance');
    autoPurgeAttendance();
    updateDashboardStats();
    renderStudents();
    renderDashboardChart();
    
    // Initialize Firebase — handles race condition with module script on GitHub Pages
    // If Firebase module already loaded (fast connection / localhost), init immediately.
    // Otherwise, wait for the 'firebaseReady' event dispatched by the module.
    if (window.firebaseAuth) {
        initFirebase();
    } else {
        console.log('Waiting for Firebase module to load...');
        window.addEventListener('firebaseReady', () => {
            console.log('Firebase module loaded — initializing...');
            initFirebase();
        });
    }

    // Session Type Change Listener
    const sessionInput = document.getElementById('studentSessionInput');
    if (sessionInput) {
        sessionInput.addEventListener('change', (e) => {
            const timingSection2 = document.getElementById('timingSection2');
            const timingLabel1 = document.getElementById('timingLabel1');
            if (e.target.value === 'Both') {
                timingSection2.style.display = 'block';
                timingLabel1.innerText = 'Morning Session Timing';
            } else {
                timingSection2.style.display = 'none';
                timingLabel1.innerText = 'Session Timing';
            }
        });
    }
    // Attendance Date Picker Listener
    const datePicker = document.getElementById('attendanceDatePicker');
    if (datePicker) {
        datePicker.value = state.viewingDate;
        datePicker.addEventListener('change', (e) => {
            state.viewingDate = e.target.value;
            state.pendingAttendance = {}; // Clear pending on date change
            renderAttendanceSheet();
        });
    }

    // Student Filter Event Listeners
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.studentFilter = tab.dataset.filter;
            renderStudents();
        });
    });

    // Student Search Event Listener
    const searchInput = document.getElementById('studentSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.studentSearchQuery = e.target.value;
            renderStudents();
        });
    }
});

function autoPurgeAttendance() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

    state.students.forEach(student => {
        if (student.attendanceHistory) {
            Object.keys(student.attendanceHistory).forEach(dateStr => {
                if (dateStr < oneMonthAgoStr) {
                    delete student.attendanceHistory[dateStr];
                }
            });
        }
    });
    saveState();
}

function downloadMonthlyAttendance() {
    const today = new Date();
    
    let csv = "Student Name,Date,Status,Time\n";
    
    state.students.forEach(student => {
        if (student.attendanceHistory) {
            // Sort dates to make the file readable
            const sortedDates = Object.keys(student.attendanceHistory).sort().reverse();
            
            sortedDates.forEach(dateStr => {
                const record = student.attendanceHistory[dateStr];
                const status = (typeof record === 'object') ? record.status : record;
                const time = (typeof record === 'object' && record.time) ? record.time : 'N/A';
                csv += `"${student.name}","${dateStr}","${status}","${time}"\n`;
            });
        }
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_History_${today.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function logout() {
    if (window.firebaseAuth) {
        const { signOut } = window.authMethods;
        signOut(window.firebaseAuth).then(() => {
            sessionStorage.removeItem('academyHubLoggedIn');
            sessionStorage.removeItem('academyHubUserRole');
            sessionStorage.removeItem('academyHubUserEmail');
            location.reload();
        });
    } else {
        sessionStorage.removeItem('academyHubLoggedIn');
        sessionStorage.removeItem('academyHubUserRole');
        sessionStorage.removeItem('academyHubUserEmail');
        location.reload();
    }
}


function isFeePaid(student) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return student.lastPaidMonth === currentMonth;
}

function unpayFee(studentId) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    if (!confirm(`Are you sure you want to mark ${student.name}'s fee as UNPAID? This will reverse their payment status for this month.`)) return;

    student.lastPaidMonth = null;

    // Remove the latest fee transaction for this student this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const txIndex = state.transactions.findIndex(t => 
        t.type === 'income' && 
        t.category === 'Fee Collection' && 
        t.studentId === student.id && 
        t.date.startsWith(currentMonth)
    );

    if (txIndex !== -1) {
        state.transactions.splice(txIndex, 1);
    }

    logActivity(`Reversed fee payment for ${student.name}`);
    
    renderStudents();
    updateDashboardStats();
    saveState();
}

function collectFee(studentId) {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = getTodayDate();
    const amount = parseInt(student.monthlyFee || 500);

    // Update student payment status
    student.lastPaidMonth = currentMonth;

    // Add transaction
    const transaction = {
        id: Date.now(),
        type: 'income',
        category: 'Fee Collection',
        amount: amount,
        date: today,
        studentId: student.id,
        studentName: student.name
    };
    state.transactions.push(transaction);

    logActivity(`Collected ₹${amount} fee from ${student.name}`);
    
    renderStudents();
    updateDashboardStats();
    saveState();

}

function applyRoleRestrictions(role, email) {
    const isAdmin = role === 'admin';
    const userEmail = email || sessionStorage.getItem('academyHubUserEmail') || '';
    
    // Update profile UI
    const nameEl = document.getElementById('displayName');
    const roleEl = document.getElementById('displayRole');
    if (nameEl) nameEl.innerText = userEmail || (isAdmin ? 'Administrator' : 'Portal Staff');
    if (roleEl) roleEl.innerText = isAdmin ? 'System Administrator' : 'Staff Member';

    // Navigation restrictions — staff can ONLY access attendance and students (view-only)
    const restrictedSections = ['dashboard', 'staff', 'finance', 'reports', 'settings', 'archive'];
    
    // Re-query nav links fresh to avoid stale references
    const allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(link => {
        const section = link.dataset.section;
        if (!isAdmin && restrictedSections.includes(section)) {
            link.parentElement.style.display = 'none';
        } else {
            link.parentElement.style.display = 'block';
        }
    });

    // Action restrictions — hide all admin-only buttons for staff
    const adminOnlyButtons = document.querySelectorAll('.admin-only');
    adminOnlyButtons.forEach(btn => {
        btn.style.display = isAdmin ? 'flex' : 'none';
    });

    // Re-render students table to apply view-only mode for staff
    if (typeof renderStudents === 'function') renderStudents();
}

function resetAllData() {
    if (confirm("Are you sure you want to completely erase ALL data (Students, Staff, Attendance, Finance)? This action CANNOT be undone!")) {
        state.students = [];
        state.staff = [];
        state.transactions = [];
        state.activities = [];
        state.pendingAttendance = {};
        
        saveState();
        
        // Sync empty state to sheets if configured
        syncAllStudents();
        syncAllStaff();
        
        alert("All data has been successfully erased.");
        location.reload();
    }
}

async function syncAllToFirebase() {
    if (!window.firebaseDB) return;
    const { ref, set } = window.rtDB;
    const db = window.firebaseDB;

    try {
        // Sync Students
        await set(ref(db, 'students'), state.students);

        // Sync Staff
        await set(ref(db, 'staff'), state.staff);

        // Sync Transactions
        await set(ref(db, 'transactions'), state.transactions);

        console.log("Firebase RTDB Sync Complete");
    } catch (error) {
        console.error("Firebase RTDB Sync Error:", error);
    }
}

function openTransactionModal(type) {
    document.getElementById('transactionTypeInput').value = type;
    document.getElementById('transactionModalTitle').innerText = type === 'income' ? 'Add Income' : 'Add Expense';
    document.getElementById('transactionSubmitBtn').style.background = type === 'income' ? '#10b981' : '#f43f5e';
    showModal('transactionModal');
}

const transactionForm = document.getElementById('transactionForm');
if (transactionForm) {
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('transactionTypeInput').value;
        const category = document.getElementById('transactionCategoryInput').value;
        const amount = parseInt(document.getElementById('transactionAmountInput').value);
        
        if (!category || !amount) return;

        const transaction = {
            id: Date.now(),
            type: type,
            category: category,
            amount: amount,
            date: getTodayDate()
        };

        state.transactions.unshift(transaction);
        logActivity(`Added ${type}: ₹${amount} for ${category}`);
        
        hideModal('transactionModal');
        updateDashboardStats();
        if (state.currentSection === 'finance') renderFinance();
        saveState();
        transactionForm.reset();
    });
}

function orderWaterCane() {
    if (!confirm("Do you want to order a Water Cane? This will automatically add a ₹30 expense and open your phone dialer.")) return;

    // 1. Add Expense Transaction
    const transaction = {
        id: Date.now(),
        type: 'expense',
        category: 'Water Cane',
        amount: 30,
        date: getTodayDate()
    };
    state.transactions.unshift(transaction);
    logActivity(`Added expense: ₹30 for Water Cane`);
    
    updateDashboardStats();
    if (state.currentSection === 'finance') renderFinance();
    saveState();

    // 2. Make Phone call (Change this to the actual water delivery number)
    const waterDeliveryNumber = "+919786703426"; 
    window.location.href = `tel:${waterDeliveryNumber}`; 
}
