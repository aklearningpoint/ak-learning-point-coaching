// Master Controller for Teacher Panel & Administration
let isClassLocked = false;
let currentLockedClass = "Nur & Play";
let activeSelectedStudent = null;

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
  document.getElementById(tabId).classList.add("active");
  event.currentTarget.classList.add("active");
}

// 3. Rapid Admission Logic
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
  const nextRoll = SchoolDB.getNextRoll(currentLockedClass);
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

  const nextRoll = SchoolDB.getNextRoll(currentLockedClass);
  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);

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
    photo: "assets/avatar.png",
    fees: { total: 0, paid: 0, due: 0 }
  };

  students.push(newStudent);
  SchoolDB.set(SchoolDB.KEYS.STUDENTS, students);

  nameInput.value = "";
  nameInput.focus();
  updateNextRollDisplay();
  renderRapidClassList();
}

function renderRapidClassList() {
  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const classList = students.filter(s => s.className === currentLockedClass && s.status !== "BLOCKED");
  const tbody = document.getElementById("rapidClassStudentList");
  tbody.innerHTML = "";

  classList.slice().reverse().forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td><b>Roll ${s.rollNo}</b></td>
        <td>${s.name}</td>
        <td>${s.className}</td>
        <td><button onclick="handleSoftDelete('${s.id}', '${s.className}')" class="btn-sm-del"><i class="fa fa-trash"></i></button></td>
      </tr>
    `;
  });
}

// 4. Manage Students & Soft Delete
function renderManageStudents() {
  const cls = document.getElementById("manageClassFilter").value;
  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const active = students.filter(s => s.className === cls && s.status !== "BLOCKED");
  const grid = document.getElementById("manageStudentsGrid");
  grid.innerHTML = "";

  active.forEach(s => {
    grid.innerHTML += `
      <div class="student-manage-card" onclick="inspectStudentProfile('${s.id}')">
        <div class="card-meta">
          <span class="roll-badge">Roll ${s.rollNo}</span>
          <span class="reg-badge">${s.regNo}</span>
        </div>
        <h4>${s.name}</h4>
        <small>Father: ${s.father || 'Not Updated'}</small><br>
        <small>Contact: ${s.mobile1 || 'N/A'}</small>
        <div class="card-action-bar" onclick="event.stopPropagation()">
          <button onclick="handleSoftDelete('${s.id}', '${s.className}')" class="btn-sm-danger"><i class="fa fa-trash"></i> Delete & Re-Roll</button>
        </div>
      </div>
    `;
  });
}

function handleSoftDelete(studentId, className) {
  if (confirm("Are you sure? Deleting this student will shift subsequent roll numbers upwards automatically.")) {
    SchoolDB.softDeleteAndReindex(studentId, className);
    renderManageStudents();
    if (isClassLocked) {
      updateNextRollDisplay();
      renderRapidClassList();
    }
  }
}

function inspectStudentProfile(id) {
  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const s = students.find(st => st.id === id);
  if (!s) return;

  document.getElementById("modalStudentName").innerText = s.name + " (Roll " + s.rollNo + " - " + s.className + ")";
  document.getElementById("modalStudentBody").innerHTML = `
    <p><b>Register No:</b> ${s.regNo}</p>
    <p><b>Father's Name:</b> ${s.father || 'Not provided'}</p>
    <p><b>Mother's Name:</b> ${s.mother || 'Not provided'}</p>
    <p><b>Date of Birth:</b> ${s.dob || 'Not provided'}</p>
    <p><b>Primary Mobile:</b> ${s.mobile1 || 'Not provided'}</p>
    <p><b>Secondary Mobile:</b> ${s.mobile2 || 'N/A'}</p>
    <p><b>Transport Mode:</b> ${s.transport}</p>
    <p><b>Fee Due Balance:</b> ₹${s.fees ? s.fees.due : 0}</p>
  `;
  document.getElementById("studentDetailModal").style.display = "flex";
}

function closeStudentModal() {
  document.getElementById("studentDetailModal").style.display = "none";
}

// 5. Fee Search (Roll vs Sibling Register No)
function searchFeeByRoll() {
  const cls = document.getElementById("feeSearchClass").value;
  const roll = parseInt(document.getElementById("feeSearchRoll").value);
  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const st = students.find(s => s.className === cls && s.rollNo === roll && s.status !== "BLOCKED");

  document.getElementById("siblingNoticeBox").style.display = "none";
  if (st) {
    displayStudentFeeProfile(st);
  } else {
    alert("No student found with Class " + cls + " and Roll " + roll);
  }
}

function searchFeeByRegister() {
  const reg = document.getElementById("feeSearchReg").value.trim();
  if (!reg) return;

  const matched = SchoolDB.getStudentsByRegisterNo(reg);
  if (matched.length === 0) {
    alert("No active students found with Register Number: " + reg);
    return;
  }

  if (matched.length === 1) {
    document.getElementById("siblingNoticeBox").style.display = "none";
    displayStudentFeeProfile(matched[0]);
  } else {
    // Siblings Bucket Detected
    const container = document.getElementById("siblingListButtons");
    container.innerHTML = "";
    matched.forEach(s => {
      container.innerHTML += `
        <button onclick='displayStudentFeeProfile(${JSON.stringify(s)})' class="btn-sibling-pick">
          ${s.name} (${s.className}, Roll ${s.rollNo})
        </button>
      `;
    });
    document.getElementById("siblingNoticeBox").style.display = "block";
    displayStudentFeeProfile(matched[0]);
  }
}

function displayStudentFeeProfile(student) {
  activeSelectedStudent = student;
  if (!activeSelectedStudent.fees) {
    activeSelectedStudent.fees = { total: 0, paid: 0, due: 0 };
  }

  document.getElementById("feeStudentTitle").innerText = `${student.name} (${student.className}, Roll ${student.rollNo}) - Reg: ${student.regNo}`;
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

  // Update central storage
  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const idx = students.findIndex(s => s.id === activeSelectedStudent.id);
  if (idx !== -1) {
    students[idx].fees = activeSelectedStudent.fees;
    SchoolDB.set(SchoolDB.KEYS.STUDENTS, students);
  }

  amountInput.value = "";
  displayStudentFeeProfile(activeSelectedStudent);
  alert("Fee record updated successfully.");
}

// 6. Exam Planner & Dual-Cut A4 Print
function loadPlannerSubjectFields() {
  const cls = document.getElementById("plannerClass").value;
  const subjects = CLASS_SUBJECTS[cls] || [];
  const container = document.getElementById("plannerSubjectsGrid");
  container.innerHTML = "";

  subjects.forEach(sub => {
    container.innerHTML += `
      <div class="planner-sub-row">
        <span><b>${sub}</b></span>
        <input type="date" id="date_${sub.replace(/\s+/g, '')}" class="input-ctrl">
      </div>
    `;
  });
}

function saveExamPlannerNotice() {
  const term = document.getElementById("plannerTerm").value;
  const cls = document.getElementById("plannerClass").value;
  const instructions = document.getElementById("plannerInstructions").value.trim();
  const subjects = CLASS_SUBJECTS[cls] || [];
  const schedule = {};

  subjects.forEach(sub => {
    const val = document.getElementById("date_" + sub.replace(/\s+/g, '')).value;
    schedule[sub] = val;
  });

  const plans = SchoolDB.get(SchoolDB.KEYS.EXAM_PLANS, {});
  if (!plans[cls]) plans[cls] = {};
  plans[cls][term] = { instructions, schedule, updatedAt: new Date().toLocaleDateString() };

  SchoolDB.set(SchoolDB.KEYS.EXAM_PLANS, plans);
  alert("Exam timetable saved successfully! Student Admit Cards are now updated.");
}

function printDualExamNotice() {
  const term = document.getElementById("plannerTerm").value;
  const cls = document.getElementById("plannerClass").value;
  const instructions = document.getElementById("plannerInstructions").value || "Bring your Admit Card and writing board.";
  const subjects = CLASS_SUBJECTS[cls] || [];

  let tableRows = "";
  subjects.forEach(sub => {
    const d = document.getElementById("date_" + sub.replace(/\s+/g, '')).value || "TBA";
    tableRows += `<tr><td>${sub}</td><td>${d}</td><td>09:00 AM - 11:30 AM</td></tr>`;
  });

  const noticeMarkup = `
    <div class="print-notice-box">
      <div class="notice-head">
        <h2>ASSENT PUBLIC SCHOOL</h2>
        <p>Singhiya Khurd, Samastipur, Bihar • EXAMINATION NOTICE: ${term.toUpperCase()}</p>
      </div>
      <p><b>Target Class:</b> ${cls} | <b>Date Released:</b> ${new Date().toLocaleDateString()}</p>
      <div class="notice-instructions"><b>Instructions:</b> ${instructions}</div>
      <table class="notice-table">
        <thead><tr><th>Subject</th><th>Exam Date</th><th>Time Slot</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="notice-foot">
        <div><b>M. K. Aryan</b><br>Director (9199xxxxxx)</div>
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
    SchoolDB.set(SchoolDB.KEYS.ADS_PPT, { marquee: marquee });
    alert("Live notice posted to school dashboard wall.");
  }
}

// ==========================================
// 8. FACULTY & VIDEO MANAGEMENT CONTROLLERS
// ==========================================

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

  // Handle Photo: Optional (Uses default avatar if no image selected)
  if (photoInput && photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      saveFacultyRecord(name, designation, classes, subject, e.target.result);
    };
    reader.readAsDataURL(photoInput.files[0]);
  } else {
    // Default system avatar
    saveFacultyRecord(name, designation, classes, subject, "https://via.placeholder.com/150");
  }
}

function saveFacultyRecord(name, designation, classes, subject, photoUrl) {
  const teachers = SchoolDB.get(SchoolDB.KEYS.TEACHERS, []);
  
  const newTeacher = {
    id: "fac_" + Date.now(),
    name: name,
    designation: designation || "Teacher",
    classes: classes || "All Classes",
    subject: subject || "All Subjects",
    photo: photoUrl
  };

  teachers.push(newTeacher);
  SchoolDB.set(SchoolDB.KEYS.TEACHERS, teachers);

  // Clear Form
  document.getElementById("facName").value = "";
  document.getElementById("facDesig").value = "";
  document.getElementById("facClasses").value = "";
  document.getElementById("facSubject").value = "";
  if (document.getElementById("facPhoto")) {
    document.getElementById("facPhoto").value = "";
  }

  alert("✅ Faculty Profile Saved Successfully!\nThis will now show on the School Dashboard.");
}

function addStudyVideo() {
  const title = document.getElementById("vidTitle").value.trim();
  const group = document.getElementById("vidClass").value;
  let url = document.getElementById("vidUrl").value.trim();

  if (!title || !url) {
    alert("Please provide both Video Title and YouTube Link/ID.");
    return;
  }

  // Extract clean YouTube Video ID if full URL is pasted
  let videoId = url;
  if (url.includes("v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  }

  const videos = SchoolDB.get(SchoolDB.KEYS.STUDY_VIDEOS, []);
  videos.push({
    id: "vid_" + Date.now(),
    title: title,
    group: group,
    videoId: videoId
  });

  SchoolDB.set(SchoolDB.KEYS.STUDY_VIDEOS, videos);

  document.getElementById("vidTitle").value = "";
  document.getElementById("vidUrl").value = "";

  alert("✅ Video Lecture Saved & Published to School Feed!");
}
