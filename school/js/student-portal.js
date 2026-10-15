// ==========================================
// STUDENT PORTAL ENGINE - ASSENT PUBLIC SCHOOL
// File: js/student-portal.js
// ==========================================

var currentStudent = null;
var cameraStream = null;

function normalizeCls(c) {
  return String(c || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function compareClasses(a, b) {
  var k1 = normalizeCls(a);
  var k2 = normalizeCls(b);
  if (!k1 || !k2) return false;
  if (k1 === k2 || k1 === ("class" + k2) || ("class" + k1) === k2) return true;
  if ((k1.includes("nur") || k1.includes("play")) && (k2.includes("nur") || k2.includes("play"))) return true;
  return false;
}

// 1. GATEWAY: VERIFY CANDIDATE
async function verifyStudentCandidate() {
  var selectedClass = document.getElementById("loginClass").value.trim();
  var enteredRoll = parseInt(document.getElementById("loginRoll").value, 10);

  if (isNaN(enteredRoll)) {
    alert("Kripya valid Roll Number enter karein!");
    return;
  }

  var students = [];
  if (typeof SchoolDB !== "undefined" && typeof SchoolDB.getStudents === "function") {
    students = SchoolDB.getStudents();
  }
  if (!students || students.length === 0) {
    try {
      students = JSON.parse(localStorage.getItem("ak_school_students") || "[]");
    } catch(e) {
      students = [];
    }
  }

  // Cloud fallback agar cache load na hua ho
  if ((!students || students.length === 0) && typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL) {
    try {
      var r = await fetch(CLOUD_SYNC_URL + "?action=getStudents");
      var j = await r.json();
      if (j && j.data && Array.isArray(j.data)) {
        students = j.data;
        localStorage.setItem("ak_school_students", JSON.stringify(students));
      }
    } catch(e) {}
  }

  if (!students || students.length === 0) {
    alert("Data sync ho raha hai. 2 second me dubara Proceed dabayein.");
    return;
  }

  var student = students.find(function(s) {
    var rMatch = parseInt(s.rollNo || s.roll, 10) === enteredRoll;
    var cMatch = compareClasses(s.className || s.class, selectedClass);
    return rMatch && cMatch;
  });

  if (!student) {
    alert("Record nahi mila!\nClass: " + selectedClass + " | Roll No: " + enteredRoll);
    return;
  }

  currentStudent = student;
  document.getElementById("studentAuthOverlay").style.display = "none";
  document.getElementById("studentWorkspace").style.display = "block";

  var welcomeBanner = document.getElementById("welcomeBanner");
  if (welcomeBanner) {
    welcomeBanner.innerHTML = 'Welcome, <span style="color:#1e3a8a; font-weight:800;">' + (student.name || "Student") + '</span> ' +
      '<small style="font-size:11px; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:10px; margin-left:6px;">Class ' + (student.className || student.class) + ' | Roll ' + (student.rollNo || student.roll) + '</small>';
  }

  populateProfile(student);
  renderStudentIDCard(student);
  renderResults(student);
}

function logoutStudent() {
  stopCamera();
  currentStudent = null;
  document.getElementById("studentWorkspace").style.display = "none";
  document.getElementById("studentAuthOverlay").style.display = "flex";
  document.getElementById("loginRoll").value = "";
}

function switchTab(tabId) {
  var panes = document.querySelectorAll(".tab-pane");
  panes.forEach(function(p) { p.classList.remove("active"); });
  var btns = document.querySelectorAll(".tab-btn");
  btns.forEach(function(b) { b.classList.remove("active"); });

  var target = document.getElementById(tabId);
  if (target) target.classList.add("active");
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add("active");
  }
}

function populateProfile(s) {
  document.getElementById("stuRegNo").value = s.regNo || "";
  document.getElementById("stuFather").value = s.father || "";
  document.getElementById("stuMother").value = s.mother || "";
  document.getElementById("stuGender").value = s.gender || "Male";
  document.getElementById("stuTransport").value = s.transport || "School Transport";
  document.getElementById("stuMob1").value = s.mobile1 || s.mobile || "";
  document.getElementById("stuMob2").value = s.mobile2 || "";
  document.getElementById("stuDOB").value = s.dob || "";
}

function saveStudentSelfDetails(e) {
  e.preventDefault();
  if (!currentStudent) return;

  currentStudent.regNo = document.getElementById("stuRegNo").value.trim();
  currentStudent.father = document.getElementById("stuFather").value.trim();
  currentStudent.mother = document.getElementById("stuMother").value.trim();
  currentStudent.gender = document.getElementById("stuGender").value;
  currentStudent.transport = document.getElementById("stuTransport").value;
  currentStudent.mobile1 = document.getElementById("stuMob1").value.trim();
  currentStudent.mobile2 = document.getElementById("stuMob2").value.trim();
  currentStudent.dob = document.getElementById("stuDOB").value;

  if (typeof SchoolDB !== "undefined" && typeof SchoolDB.updateStudent === "function") {
    SchoolDB.updateStudent(currentStudent);
  }

  alert("Profile update ho gayi!");
  renderStudentIDCard(currentStudent);
}

// CAMERA ENGINE
function previewStudentPhoto(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      if (currentStudent) {
        currentStudent.photo = e.target.result;
        renderStudentIDCard(currentStudent);
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function openStudentCamera() {
  var modal = document.getElementById("cameraModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "cameraModal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.background = "rgba(0,0,0,0.85)";
    modal.style.zIndex = "99999";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.innerHTML = 
      '<div style="background:#fff; padding:18px; border-radius:12px; text-align:center; max-width:340px; width:90%;">' +
        '<h4 style="margin:0 0 10px 0; color:#0f172a;"><i class="fas fa-camera"></i> Live Photo</h4>' +
        '<video id="cameraVideo" autoplay playsinline style="width:100%; height:240px; background:#000; border-radius:8px; object-fit:cover;"></video>' +
        '<canvas id="cameraCanvas" style="display:none;"></canvas>' +
        '<div style="display:flex; gap:10px; justify-content:center; margin-top:14px;">' +
          '<button onclick="capturePhoto()" style="background:#16a34a; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;">Capture</button>' +
          '<button onclick="closeCamera()" style="background:#dc2626; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;">Cancel</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  modal.style.display = "flex";
  var video = document.getElementById("cameraVideo");

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(function(stream) {
        cameraStream = stream;
        video.srcObject = stream;
      })
      .catch(function(err) {
        alert("Camera permission nahi mili: " + err.message);
        closeCamera();
      });
  } else {
    alert("Camera browser me supported nahi hai!");
    closeCamera();
  }
}

function capturePhoto() {
  var video = document.getElementById("cameraVideo");
  var canvas = document.getElementById("cameraCanvas");
  if (!video || !canvas) return;

  canvas.width = 300;
  canvas.height = 360;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, 300, 360);

  var img = canvas.toDataURL("image/jpeg", 0.85);
  if (currentStudent) {
    currentStudent.photo = img;
    renderStudentIDCard(currentStudent);
  }
  closeCamera();
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(function(t) { t.stop(); });
    cameraStream = null;
  }
}

function closeCamera() {
  stopCamera();
  var modal = document.getElementById("cameraModal");
  if (modal) modal.style.display = "none";
}

// 6:9 ID CARD
function renderStudentIDCard(s) {
  var box = document.getElementById("idCardContainer");
  if (!box) return;

  var photo = s.photo || "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(s.name || "Student");

  var html = '<div style="display:flex; flex-direction:column; align-items:center; padding:15px 0;">' +
    '<div class="official-id-card-6x9" style="width:280px; height:420px; aspect-ratio:6/9; background:#fff; border:2px solid #0f172a; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 20px rgba(0,0,0,0.1);">' +
      '<div style="background:linear-gradient(135deg, #0f172a, #1e3a8a); color:#fff; text-align:center; padding:8px 6px; border-bottom:3px solid #d97706;">' +
        '<div style="font-size:13px; font-weight:800; text-transform:uppercase;">ASSENT PUBLIC SCHOOL</div>' +
        '<div style="font-size:9px; color:#93c5fd;">Singhiya Khurd, Samastipur, Bihar</div>' +
        '<div style="font-size:8px; background:rgba(217,119,6,0.25); color:#fef3c7; display:inline-block; padding:1px 6px; border-radius:8px; margin-top:2px;">IDENTITY CARD 2026-27</div>' +
      '</div>' +
      '<div style="padding:10px 14px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">' +
        '<div style="width:80px; height:90px; margin:0 auto; border:2px solid #1e3a8a; border-radius:6px; overflow:hidden;">' +
          '<img src="' + photo + '" style="width:100%; height:100%; object-fit:cover;">' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<h4 style="margin:2px 0; font-size:12.5px; text-transform:uppercase; color:#0f172a;">' + (s.name || 'STUDENT NAME') + '</h4>' +
          '<div style="font-size:10px; font-weight:700; color:#1e3a8a;">Class: ' + (s.className || s.class || '—') + ' | Roll: ' + (s.rollNo || s.roll || '—') + '</div>' +
        '</div>' +
        '<div style="font-size:9.5px; line-height:1.5; background:#f8fafc; padding:6px 8px; border-radius:6px; border:1px solid #e2e8f0;">' +
          '<div><strong>Reg No:</strong> ' + (s.regNo || 'PENDING') + '</div>' +
          '<div><strong>Father:</strong> ' + (s.father || '—') + '</div>' +
          '<div><strong>Mother:</strong> ' + (s.mother || '—') + '</div>' +
          '<div><strong>Mobile:</strong> ' + (s.mobile1 || s.mobile || '—') + '</div>' +
          '<div><strong>Transport:</strong> ' + (s.transport || 'School Transport') + '</div>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; font-size:8.5px; color:#64748b; border-top:1px dashed #cbd5e1; padding-top:4px;">' +
          '<span>Guardian Sign</span><span>Principal Sign</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<button onclick="window.print()" style="margin-top:12px; background:#1e3a8a; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;"><i class="fa fa-print"></i> Print Card</button>' +
  '</div>';

  box.innerHTML = html;
}

// RESULTS
function renderResults(s) {
  var box = document.getElementById("studentResultsContainer");
  if (!box) return;

  var marks = [];
  if (typeof SchoolDB !== "undefined" && typeof SchoolDB.getMarks === "function") {
    marks = SchoolDB.getMarks();
  }

  var studentMarks = marks.filter(function(m) {
    return String(m.studentId || m.regNo) === String(s.id || s.regNo) ||
           (compareClasses(m.className, s.className) && parseInt(m.rollNo, 10) === parseInt(s.rollNo, 10));
  });

  if (!studentMarks || studentMarks.length === 0) {
    box.innerHTML = '<p style="text-align:center; padding:20px; color:#64748b;">Abhi is session ka result publish nahi hua hai.</p>';
    return;
  }

  var html = '<div style="overflow-x:auto;"><table style="width:100%; border-collapse:collapse; font-size:12.5px;">' +
    '<thead><tr style="background:#0f172a; color:#fff;">' +
    '<th style="padding:8px;">Exam / Term</th><th style="padding:8px;">Hindi</th><th style="padding:8px;">English</th><th style="padding:8px;">Math</th><th style="padding:8px;">EVS</th><th style="padding:8px;">Total</th><th style="padding:8px;">%</th>' +
    '</tr></thead><tbody>';

  studentMarks.forEach(function(m) {
    html += '<tr style="border-bottom:1px solid #e2e8f0; text-align:center;">' +
      '<td style="padding:8px; font-weight:700;">' + (m.term || 'Term 1') + '</td>' +
      '<td style="padding:8px;">' + (m.hindi || 0) + '</td>' +
      '<td style="padding:8px;">' + (m.english || 0) + '</td>' +
      '<td style="padding:8px;">' + (m.math || 0) + '</td>' +
      '<td style="padding:8px;">' + (m.evs || m.science || 0) + '</td>' +
      '<td style="padding:8px; font-weight:700; color:#1e3a8a;">' + (m.grandTotal || m.total || 0) + '</td>' +
      '<td style="padding:8px; font-weight:700; color:#16a34a;">' + (m.percentage || 0) + '%</td>' +
      '</tr>';
  });

  html += '</tbody></table></div>';
  box.innerHTML = html;
}
