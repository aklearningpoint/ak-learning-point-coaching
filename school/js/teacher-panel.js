// =======================================================
// MASTER CONTROLLER FOR TEACHER PANEL & ADMINISTRATION
// File: js/teacher-panel.js
// =======================================================

let isClassLocked = false;
let currentLockedClass = "Nur & Play";
let activeSelectedStudent = null;

// SMART CLASS MATCHER HELPER
function normalizeClsString(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchClassFlexible(classA, classB) {
  var a = normalizeClsString(classA);
  var b = normalizeClsString(classB);
  if (!a || !b) return false;
  if (a === b || a === ("class" + b) || ("class" + a) === b) return true;
  if ((a.includes("nur") || a.includes("play")) && (b.includes("nur") || b.includes("play"))) return true;
  return false;
}

// Helper to reliably get students array across both versions
function getGlobalStudentsList() {
  if (typeof SchoolDB !== "undefined" && typeof SchoolDB.getStudents === "function") {
    var list = SchoolDB.getStudents();
    if (list && list.length > 0) return list;
  }
  try {
    return JSON.parse(localStorage.getItem("ak_school_students") || "[]");
  } catch(e) {
    return [];
  }
}

function saveGlobalStudentsList(list) {
  localStorage.setItem("ak_school_students", JSON.stringify(list));
}

// Subject Matrix for Exam Planner
const CLASS_SUBJECTS = {
  "Nur & Play": ["Hindi", "English", "Math"],
  "LKG": ["Hindi", "English", "Math"],
  "UKG": ["Hindi", "English", "Math", "EVS"],
  "1": ["Hindi", "English", "Math", "Science", "SST"],
  "2": ["Hindi", "English", "Math", "Science", "SST"],
  "3": ["Hindi", "English", "Math", "Science", "SST"],
  "4": ["Hindi", "English", "Math", "Science", "SST"],
  "5": ["Hindi", "English", "Math", "Science", "SST"]
};

// 1. Password Verification (Master Key: 'pass')
function verifyTeacherAccess() {
  const pass = document.getElementById("teacherPassInput").value;
  if (pass === "pass") {
    document.getElementById("teacherAuthGate").style.display = "none";
    document.getElementById("teacherWorkspace").style.display = "block";
    loadPlannerSubjectFields();
    renderManageStudents();
  } else {
    alert("Incorrect password. Access denied.");
  }
}

function logoutTeacher() {
  document.getElementById("teacherPassInput").value = "";
  document.getElementById("teacherWorkspace").style.display = "none";
  document.getElementById("teacherAuthGate").style.display = "flex";
}

// 2. Navigation Switcher
function switchAdminTab(tabId) {
  document.querySelectorAll(".admin-tab-pane").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".t-tab").forEach(el => el.classList.remove("active"));
  
  var target = document.getElementById(tabId);
  if (target) target.classList.add("active");
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add("active");
  }
}

// 3. Rapid Admission Logic
function getNextRollForClass(className) {
  const students = getGlobalStudentsList();
  const classStudents = students.filter(s => matchClassFlexible(s.className || s.class, className));
  let maxRoll = 0;
  classStudents.forEach(s => {
    let r = parseInt(s.rollNo || s.roll, 10);
    if (!isNaN(r) && r > maxRoll) maxRoll = r;
  });
  return maxRoll + 1;
}

function toggleLockClass() {
  const sel = document.getElementById("rapidClassSelect");
  const lockBtn = document.getElementById("btnLockClass");
  const entryRow = document.getElementById("rapidEntryInputRow");

  if (!isClassLocked) {
    isClassLocked = true;
    currentLockedClass = sel.value;
    sel.disabled = true;
    lockBtn.innerHTML = '<i class="fa fa-unlock"></i> Unlock Class';
    lockBtn.classList.add("unlocked-state");
    entryRow.style.display = "flex";
    document.getElementById("currentLockedClassText").innerText = currentLockedClass;
    updateNextRollDisplay();
    renderRapidClassList();
    document.getElementById("rapidStudentName").focus();
  } else {
    isClassLocked = false;
    sel.disabled = false;
    lockBtn.innerHTML = '<i class="fa fa-lock"></i> Lock Class';
    lockBtn.classList.remove("unlocked-state");
    entryRow.style.display = "none";
  }
}

function updateNextRollDisplay() {
  const nextRoll = getNextRollForClass(currentLockedClass);
  document.getElementById("nextRollDisp").innerText = nextRoll;
}

function handleRapidNameKey(e) {
  if (e.key === "Enter") {
    submitRapidStudent();
  }
}

function submitRapidStudent() {
  const nameInput = document.getElementById("rapidStudentName");
  const name = nameInput.value.trim();
  if (!name) return;

  const nextRoll = getNextRollForClass(currentLockedClass);
  const students = getGlobalStudentsList();

  const newStudent = {
    id: "stu_" + Date.now(),
    name: name,
    className: currentLockedClass,
    rollNo: nextRoll,
    regNo: "REG-" + (100 + students.length + 1),
    status: "ACTIVE",
    father: "",
    mother: "",
    gender: "Male",
    transport: "School Transport",
    mobile1: "",
    mobile2: "",
    dob: "",
    photo: "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(name),
    fees: { total: 0, paid: 0, due: 0 }
  };

  students.push(newStudent);
  saveGlobalStudentsList(students);

  // Cloud sync if available
  if (typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL) {
    try {
      fetch(CLOUD_SYNC_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStudentDetails", student: newStudent })
      });
    } catch(err) {}
  }

  nameInput.value = "";
  nameInput.focus();
  updateNextRollDisplay();
  renderRapidClassList();
}

function renderRapidClassList() {
  const students = getGlobalStudentsList();
  const classList = students.filter(s => matchClassFlexible(s.className || s.class, currentLockedClass) && s.status !== "BLOCKED");
  const tbody = document.getElementById("rapidClassStudentList");
  if (!tbody) return;
  tbody.innerHTML = "";

  classList.slice().reverse().forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td><b>Roll ${s.rollNo || s.roll}</b></td>
        <td>${s.name}</td>
        <td>${s.className || s.class}</td>
        <td><button onclick="handleSoftDelete('${s.id}', '${s.className || s.class}')" class="btn-sm-del"><i class="fa fa-trash"></i></button></td>
      </tr>
    `;
  });
}

// 4. Manage Students & Soft Delete (FIXED FOR CLASS 3, 4, 5)
function renderManageStudents() {
  const cls = document.getElementById("manageClassFilter").value;
  const students = getGlobalStudentsList();
  
  // Smart Normalizer matches "3", "4", "5", "Class 5", etc.
  const active = students.filter(s => {
    if (!cls || cls === "All") return s.status !== "BLOCKED";
    return matchClassFlexible(s.className || s.class, cls) && s.status !== "BLOCKED";
  });

  const grid = document.getElementById("manageStudentsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (active.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:30px; color:#64748b;">
      <i class="fa fa-user-slash" style="font-size:32px; margin-bottom:8px;"></i>
      <p>Class ${cls} ke liye koi student record nahi mila.</p>
    </div>`;
    return;
  }

  active.forEach(s => {
    grid.innerHTML += `
      <div class="student-manage-card" onclick="inspectStudentProfile('${s.id || s.regNo}')">
        <div class="card-meta">
          <span class="roll-badge">Roll ${s.rollNo || s.roll || '—'}</span>
          <span class="reg-badge">${s.regNo || 'PENDING'}</span>
        </div>
        <h4>${s.name}</h4>
        <small>Class: <b>${s.className || s.class}</b></small><br>
        <small>Father: ${s.father || 'Not Updated'}</small><br>
        <small>Contact: ${s.mobile1 || s.mobile || 'N/A'}</small>
        <div class="card-action-bar" onclick="event.stopPropagation()">
          <button onclick="handleSoftDelete('${s.id || s.regNo}', '${s.className || s.class}')" class="btn-sm-danger"><i class="fa fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
  });
}

function handleSoftDelete(studentId, className) {
  if (confirm("Are you sure? Is student ko remove karna chahte hain?")) {
    let students = getGlobalStudentsList();
    students = students.filter(s => String(s.id || s.regNo) !== String(studentId));
    saveGlobalStudentsList(students);
    renderManageStudents();
    if (isClassLocked) {
      updateNextRollDisplay();
      renderRapidClassList();
    }
  }
}

function inspectStudentProfile(id) {
  const students = getGlobalStudentsList();
  const s = students.find(st => String(st.id || st.regNo) === String(id));
  if (!s) return;

  document.getElementById("modalStudentName").innerText = s.name + " (Roll " + (s.rollNo || s.roll) + " - Class " + (s.className || s.class) + ")";
  document.getElementById("modalStudentBody").innerHTML = `
    <p><b>Register No:</b> ${s.regNo || 'PENDING'}</p>
    <p><b>Class:</b> ${s.className || s.class}</p>
    <p><b>Father's Name:</b> ${s.father || 'Not provided'}</p>
    <p><b>Mother's Name:</b> ${s.mother || 'Not provided'}</p>
    <p><b>Date of Birth:</b> ${s.dob || 'Not provided'}</p>
    <p><b>Primary Mobile:</b> ${s.mobile1 || s.mobile || 'Not provided'}</p>
    <p><b>Secondary Mobile:</b> ${s.mobile2 || 'N/A'}</p>
    <p><b>Transport Mode:</b> ${s.transport || 'School Transport'}</p>
    <p><b>Fee Due Balance:</b> ₹${s.fees ? s.fees.due : 0}</p>
  `;
  document.getElementById("studentDetailModal").style.display = "flex";
}

function closeStudentModal() {
  document.getElementById("studentDetailModal").style.display = "none";
}

// 5. Fee Search (Roll vs Register No)
function searchFeeByRoll() {
  const cls = document.getElementById("feeSearchClass").value;
  const roll = parseInt(document.getElementById("feeSearchRoll").value, 10);
  const students = getGlobalStudentsList();
  const st = students.find(s => matchClassFlexible(s.className || s.class, cls) && parseInt(s.rollNo || s.roll, 10) === roll && s.status !== "BLOCKED");

  var sibBox = document.getElementById("siblingNoticeBox");
  if (sibBox) sibBox.style.display = "none";

  if (st) {
    displayStudentFeeProfile(st);
  } else {
    alert("No student found with Class " + cls + " and Roll " + roll);
  }
}

function searchFeeByRegister() {
  const reg = document.getElementById("feeSearchReg").value.trim().toLowerCase();
  if (!reg) return;

  const students = getGlobalStudentsList();
  const matched = students.filter(s => String(s.regNo || "").toLowerCase() === reg && s.status !== "BLOCKED");

  if (matched.length === 0) {
    alert("No active students found with Register Number: " + reg);
    return;
  }

  var sibBox = document.getElementById("siblingNoticeBox");
  if (matched.length === 1) {
    if (sibBox) sibBox.style.display = "none";
    displayStudentFeeProfile(matched[0]);
  } else {
    const container = document.getElementById("siblingListButtons");
    if (container) {
      container.innerHTML = "";
      matched.forEach(s => {
        container.innerHTML += `
          <button onclick='displayStudentFeeProfile(${JSON.stringify(s)})' class="btn-sibling-pick">
            ${s.name} (${s.className || s.class}, Roll ${s.rollNo || s.roll})
          </button>
        `;
      });
    }
    if (sibBox) sibBox.style.display = "block";
    displayStudentFeeProfile(matched[0]);
  }
}

function displayStudentFeeProfile(student) {
  activeSelectedStudent = student;
  if (!activeSelectedStudent.fees) {
    activeSelectedStudent.fees = { total: 0, paid: 0, due: 0 };
  }

  document.getElementById("feeStudentTitle").innerText = `${student.name} (Class ${student.className || student.class}, Roll ${student.rollNo || student.roll}) - Reg: ${student.regNo || 'PENDING'}`;
  document.getElementById("statTotalFee").innerText = "₹" + activeSelectedStudent.fees.total;
  document.getElementById("statPaidFee").innerText = "₹" + activeSelectedStudent.fees.paid;
  document.getElementById("statDueFee").innerText = "₹" + activeSelectedStudent.fees.due;
  document.getElementById("activeFeeFormBox").style.display = "block";
}

function applyFeeChange(type) {
  if (!activeSelectedStudent) return;
  const amountInput = type === "add" ? document.getElementById("inputAddFee") : document.getElementById("inputPayFee");
  const amt = parseFloat(amountInput.value) || 0;
  if (amt <= 0) return;

  if (type === "add") {
    activeSelectedStudent.fees.total += amt;
    activeSelectedStudent.fees.due += amt;
  } else {
    activeSelectedStudent.fees.paid += amt;
    activeSelectedStudent.fees.due = Math.max(0, activeSelectedStudent.fees.due - amt);
  }

  const students = getGlobalStudentsList();
  const idx = students.findIndex(s => String(s.id || s.regNo) === String(activeSelectedStudent.id || activeSelectedStudent.regNo));
  if (idx !== -1) {
    students[idx].fees = activeSelectedStudent.fees;
    saveGlobalStudentsList(students);
  }

  amountInput.value = "";
  displayStudentFeeProfile(activeSelectedStudent);
  alert("Fee record updated successfully.");
}

// 6. Exam Planner & Dual-Cut A4 Print
function loadPlannerSubjectFields() {
  const cls = document.getElementById("plannerClass").value;
  let subjects = CLASS_SUBJECTS[cls] || [];
  if (subjects.length === 0) {
    // Fallback if class is written as 'Class 3' instead of '3'
    const norm = cls.replace(/[^0-9]/g, "");
    subjects = CLASS_SUBJECTS[norm] || ["Hindi", "English", "Math", "Science", "SST"];
  }

  const container = document.getElementById("plannerSubjectsGrid");
  if (!container) return;
  container.innerHTML = "";

  subjects.forEach(sub => {
    container.innerHTML += `
      <div class="planner-sub-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span><b>${sub}</b></span>
        <input type="date" id="date_${sub.replace(/\s+/g, '')}" class="input-ctrl" style="max-width:180px;">
      </div>
    `;
  });
}

function saveExamPlannerNotice() {
  const term = document.getElementById("plannerTerm").value;
  const cls = document.getElementById("plannerClass").value;
  const instructions = document.getElementById("plannerInstructions").value.trim();
  const subjects = CLASS_SUBJECTS[cls] || ["Hindi", "English", "Math", "Science", "SST"];
  const schedule = {};

  subjects.forEach(sub => {
    const elem = document.getElementById("date_" + sub.replace(/\s+/g, ''));
    schedule[sub] = elem ? elem.value : "";
  });

  let plans = {};
  try {
    plans = JSON.parse(localStorage.getItem("ak_school_exam_plans") || "{}");
  } catch(e) {
    plans = {};
  }

  if (!plans[cls]) plans[cls] = {};
  plans[cls][term] = { instructions, schedule, updatedAt: new Date().toLocaleDateString() };

  localStorage.setItem("ak_school_exam_plans", JSON.stringify(plans));
  alert("Exam timetable saved successfully! Student Admit Cards are now updated.");
}

function printDualExamNotice() {
  const term = document.getElementById("plannerTerm").value;
  const cls = document.getElementById("plannerClass").value;
  const instructions = document.getElementById("plannerInstructions").value || "Bring your Admit Card and writing board.";
  const subjects = CLASS_SUBJECTS[cls] || ["Hindi", "English", "Math", "Science", "SST"];

  let tableRows = "";
  subjects.forEach(sub => {
    const elem = document.getElementById("date_" + sub.replace(/\s+/g, ''));
    const d = (elem && elem.value) ? elem.value : "TBA";
    tableRows += `<tr><td>${sub}</td><td>${d}</td><td>09:00 AM - 11:30 AM</td></tr>`;
  });

  const noticeMarkup = `
    <div class="print-notice-box" style="padding:15px; border:2px solid #0f172a; margin-bottom:20px; font-family:sans-serif;">
      <div class="notice-head" style="text-align:center; border-bottom:1px solid #cbd5e1; padding-bottom:8px;">
        <h2 style="margin:0; text-transform:uppercase;">ASSENT PUBLIC SCHOOL</h2>
        <p style="margin:2px 0; font-size:11px;">Singhiya Khurd, Samastipur, Bihar • EXAMINATION NOTICE: ${term.toUpperCase()}</p>
      </div>
      <p style="font-size:12px; margin:8px 0;"><b>Target Class:</b> Class ${cls} | <b>Date Released:</b> ${new Date().toLocaleDateString()}</p>
      <div class="notice-instructions" style="font-size:11px; margin-bottom:8px;"><b>Instructions:</b> ${instructions}</div>
      <table class="notice-table" style="width:100%; border-collapse:collapse; font-size:11px; text-align:left;" border="1">
        <thead><tr style="background:#f1f5f9;"><th>Subject</th><th>Exam Date</th><th>Time Slot</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="notice-foot" style="display:flex; justify-content:space-between; margin-top:15px; font-size:11px;">
        <div><b>Director</b><br>Assent Public School</div>
        <div><b>Examination Controller</b><br>Assent Public School</div>
      </div>
    </div>
  `;

  document.getElementById("noticeHalfTop").innerHTML = noticeMarkup;
  document.getElementById("noticeHalfBottom").innerHTML = noticeMarkup;
  document.getElementById("dualNoticePrintArea").style.display = "block";
  window.print();
  document.getElementById("dualNoticePrintArea").style.display = "none";
}

// 7. Ads & Notices
function saveAdsSettings() {
  const marquee = document.getElementById("inputNoticeMarquee").value.trim();
  if (marquee) {
    localStorage.setItem("ak_school_notice_marquee", marquee);
    alert("Live notice posted to school dashboard wall.");
  }
}

// 8. Faculty & Study Video Management
function addFacultyMember() {
  const name = document.getElementById("facName").value.trim();
  const designation = document.getElementById("facDesig").value.trim();
  const classes = document.getElementById("facClasses").value.trim();
  const subject = document.getElementById("facSubject").value.trim();
  const photoInput = document.getElementById("facPhoto");

  if (!name) {
    alert("Please enter Faculty Member Name.");
    document.getElementById("facName").focus();
    return;
  }

  if (photoInput && photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      saveFacultyRecord(name, designation, classes, subject, e.target.result);
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    saveFacultyRecord(name, designation, classes, subject, "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(name));
  }
}

function saveFacultyRecord(name, designation, classes, subject, photoUrl) {
  let teachers = [];
  try {
    teachers = JSON.parse(localStorage.getItem("ak_school_teachers") || "[]");
  } catch(e) {
    teachers = [];
  }

  const newTeacher = {
    id: "fac_" + Date.now(),
    name: name,
    designation: designation || "Teacher",
    classes: classes || "All Classes",
    subject: subject || "All Subjects",
    photo: photoUrl
  };

  teachers.push(newTeacher);
  localStorage.setItem("ak_school_teachers", JSON.stringify(teachers));

  document.getElementById("facName").value = "";
  document.getElementById("facDesig").value = "";
  document.getElementById("facClasses").value = "";
  document.getElementById("facSubject").value = "";
  if (document.getElementById("facPhoto")) {
    document.getElementById("facPhoto").value = "";
  }

  alert("✅ Faculty Profile Saved Successfully!");
}

function addStudyVideo() {
  const title = document.getElementById("vidTitle").value.trim();
  const group = document.getElementById("vidClass").value;
  let url = document.getElementById("vidUrl").value.trim();

  if (!title || !url) {
    alert("Please provide both Video Title and YouTube Link/ID.");
    return;
  }

  let videoId = url;
  if (url.includes("v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  }

  let videos = [];
  try {
    videos = JSON.parse(localStorage.getItem("ak_school_videos") || "[]");
  } catch(e) {
    videos = [];
  }

  videos.push({
    id: "vid_" + Date.now(),
    title: title,
    group: group,
    videoId: videoId
  });

  localStorage.setItem("ak_school_videos", JSON.stringify(videos));

  document.getElementById("vidTitle").value = "";
  document.getElementById("vidUrl").value = "";

  alert("✅ Video Lecture Saved & Published to School Feed!");
}
