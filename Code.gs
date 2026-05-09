// Spreadsheet ID extracted from the provided URL
const SPREADSHEET_ID = '1XeolmWhmVF6YcJXq0GhgXD1YUC5po_DWGIoTflXNokI';

// Enable CORS for the web app
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ message: 'GET not supported' }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result = { success: false };

    switch (action) {
      // STUDENT ACTIONS
      case 'add_student':
        result = addStudent(data.student);
        break;
      case 'update_student':
        result = updateStudent(data.student);
        break;
      case 'sync_all_students':
        result = syncAllStudents(data.students);
        break;
      case 'update_student_status':
        result = updateStudentStatus(data.student);
        break;

      // STAFF ACTIONS
      case 'add_staff':
        result = addStaff(data.staff);
        break;
      case 'update_staff':
        result = updateStaff(data.staff);
        break;
      case 'sync_all_staff':
        result = syncAllStaff(data.staffMembers);
        break;

      // ATTENDANCE ACTIONS
      case 'sync_attendance':
        result = syncAttendance(data.attendance);
        break;

      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

// Helper to get a sheet by name, creates it if missing
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add headers if it's a new sheet
    if (name === 'Students') {
      sheet.appendRow(['ID', 'Name', 'Father Name', 'School', 'Email', 'Phone', 'Secondary Phone', 'DOB', 'Join Date', 'Session', 'Address', 'Course', 'Start Time', 'End Time', 'Start Time 2', 'End Time 2', 'Monthly Fee', 'Last Paid Month', 'Status']);
    } else if (name === 'Staff') {
      sheet.appendRow(['ID', 'Name', 'Department', 'Position', 'Email', 'Phone', 'Status']);
    } else if (name === 'Attendance') {
      sheet.appendRow(['Date', 'Student ID', 'Student Name', 'Status', 'Time']);
    }
  }
  return sheet;
}

// --- STUDENT FUNCTIONS ---
function addStudent(student) {
  const sheet = getSheet('Students');
  const row = [
    student.id, student.name, student.fatherName || '', student.schoolName || '',
    student.email || '', student.phone || '', student.phoneSecondary || '',
    student.dob || '', student.joinDate || '', student.session || '',
    student.address || '', student.course || '', student.startTime || '',
    student.endTime || '', student.startTime2 || '', student.endTime2 || '',
    student.monthlyFee || '500',
    student.lastPaidMonth || '',
    student.status || 'Active'
  ];
  sheet.appendRow(row);
  return { success: true };
}

function updateStudent(student) {
  const sheet = getSheet('Students');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === student.id) {
      const row = [
        student.id, student.name, student.fatherName || '', student.schoolName || '',
        student.email || '', student.phone || '', student.phoneSecondary || '',
        student.dob || '', student.joinDate || '', student.session || '',
        student.address || '', student.course || '', student.startTime || '',
        student.endTime || '', student.startTime2 || '', student.endTime2 || '',
        student.monthlyFee || '500',
        student.lastPaidMonth || '',
        student.status || 'Active'
      ];
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return { success: true };
    }
  }
  return { success: false, error: 'Student not found' };
}

function syncAllStudents(students) {
  const sheet = getSheet('Students');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  const rows = students.map(s => [
    s.id, s.name, s.fatherName || '', s.schoolName || '',
    s.email || '', s.phone || '', s.phoneSecondary || '',
    s.dob || '', s.joinDate || '', s.session || '',
    s.address || '', s.course || '', s.startTime || '',
    s.endTime || '', s.startTime2 || '', s.endTime2 || '',
    s.monthlyFee || '500',
    s.lastPaidMonth || '',
    s.status || 'Active'
  ]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  return { success: true };
}

function updateStudentStatus(student) {
  return updateStudent(student);
}

// --- STAFF FUNCTIONS ---
function addStaff(staff) {
  const sheet = getSheet('Staff');
  const row = [
    staff.id, staff.name, staff.department || '', staff.position || '',
    staff.email || '', staff.phone || '', staff.status || 'Active'
  ];
  sheet.appendRow(row);
  return { success: true };
}

function updateStaff(staff) {
  const sheet = getSheet('Staff');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === staff.id) {
      const row = [
        staff.id, staff.name, staff.department || '', staff.position || '',
        staff.email || '', staff.phone || '', staff.status || 'Active'
      ];
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return { success: true };
    }
  }
  return { success: false, error: 'Staff member not found' };
}

function syncAllStaff(staffMembers) {
  const sheet = getSheet('Staff');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  const rows = staffMembers.map(s => [
    s.id, s.name, s.department || '', s.position || '',
    s.email || '', s.phone || '', s.status || 'Active'
  ]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  return { success: true };
}

// --- ATTENDANCE FUNCTIONS ---
function syncAttendance(attendanceArray) {
  const sheet = getSheet('Attendance');
  const rows = attendanceArray.map(a => [a.date, a.studentId, a.studentName, a.status, a.time]);
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }
  return { success: true };
}
