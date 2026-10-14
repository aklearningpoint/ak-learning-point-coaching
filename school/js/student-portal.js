// ==========================================
// STUDENT PORTAL ENGINE - ASSENT PUBLIC SCHOOL
// File: js/student-portal.js
// ==========================================

var currentStudent = null;
var videoStream = null;

function normalizeClass(cls) {
  return String(cls || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isClassEqual(classA, classB) {
  var a = normalizeClass(classA);
  var b = normalizeClass(classB);
  if (!a || !b) return false;
  if (a === b || a === ("class" + b) || ("class" + a) === b) return true;
  if ((a.includes("nur") || a.includes("play")) && (b.includes("nur") || b.includes("play"))) return true;
  return false;
}

// 1. GATEWAY: LOGIN & VERIFICATION
async function verifyStudentCandidate() {
  var selectedClass = document.getElementById("loginClass").value.trim();
  var enteredRoll = parseInt(document.getElementById("loginRoll").value, 10);

  if (isNaN(enteredRoll)) {
    alert("Kripya valid Roll Number enter karein!");
    return;
  }

  // 1. Local storage / schoolDB se load
  var studentsList = [];
  if (typeof schoolDB !== "undefined" && typeof schoolDB.getStudents === "function") {
    studentsList = schoolDB.getStudents() || [];
  }
  if (!studentsList || studentsList.length === 0) {
    try {
      studentsList = JSON.parse(localStorage.getItem("ak_school_students") || "[]");
    } catch(e) {
      studentsList = [];
    }
  }

  // 2. Agar local empty ho, direct cloud sheet se fetch
  if ((!studentsList || studentsList.length === 0) && typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL) {
    try {
      var resp = await fetch(CLOUD_SYNC_URL + "?action=getStudents");
      var resJson = await resp.json();
      if (resJson && resJson.data && Array.isArray(resJson.data)) {
        studentsList = resJson.data;
        localStorage.setItem("ak_school_students", JSON.stringify(studentsList));
      }
    } catch(err) {
      console.warn("Live fetch error:", err);
    }
  }

  if (!studentsList || studentsList.length === 0) {
    alert("Students data sheet se load ho raha hai. Kripya 2 second ruk kar dubara Proceed dabayein.");
    return;
  }

  // Smart Class Matcher
  var candidate = studentsList.find(function(s) {
    var rollMatch = parseInt(s.rollNo || s.roll, 10) === enteredRoll;
    var classMatch = isClassEqual(s.className || s.class, selectedClass);
    return rollMatch && classMatch;
  });

  if (!candidate) {
    alert("Student record nahi mila!\nClass: " + selectedClass + " | Roll No: " + enteredRoll + "\nKripya Class aur Roll Number verify karein.");
    return;
  }

  currentStudent = candidate;

  document.getElementById("studentAuthOverlay").style.display = "none";
  document.getElementById("studentWorkspace").style.display = "block";

  var welcomeElem = document.getElementById("welcomeBanner");
  if (welcomeElem) {
    welcomeElem.innerHTML = '<span style="color:#d97706;"><i class="fas fa-user-graduate"></i></span> Welcome, ' + 
      '<span style="background: linear-gradient(135deg, #1e3a8a, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight:800;">' + 
      (candidate.name || "Student") + '</span> ' +
      '<small style="font-size:12px; background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:20px; font-weight:700; margin-left:8px; display:inline-block; vertical-align:middle;">Class: ' + (candidate.className || candidate.class) + ' | Roll: ' + (candidate.rollNo || candidate.roll) + '</small>';
  }

  populateStudentProfile(candidate);
  renderStudentIDCard(candidate);
  renderStudentResults(candidate);
}

// 2. LOGOUT
function logoutStudent() {
  stopCamera();
  currentStudent = null;
  document.getElementById("studentWorkspace").style.display = "none";
  document.getElementById("studentAuthOverlay").style.display = "flex";
  document.getElementById("loginRoll").value = "";
}

// 3. TAB NAVIGATION
function switchTab(tabId) {
  var panes = document.querySelectorAll(".tab-pane");
  panes.forEach(function(pane) { pane.classList.remove("active"); });

  var btns = document.querySelectorAll(".tab-btn");
  btns.forEach(function(btn) { btn.classList.remove("active"); });

  var targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add("active");

  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add("active");
  }
}

// 4. POPULATE PROFILE
function populateStudentProfile(s) {
  document.getElementById("stuRegNo").value = s.regNo || "";
  document.getElementById("stuFather").value = s.father || "";
  document.getElementById("stuMother").value = s.mother || "";
  document.getElementById("stuGender").value = s.gender || "Male";
  document.getElementById("stuTransport").value = s.transport || "School Transport";
  document.getElementById("stuMob1").value = s.mobile1 || s.mobile || "";
  document.getElementById("stuMob2").value = s.mobile2 || "";
  document.getElementById("stuDOB").value = s.dob || "";
}

// 5. SAVE PROFILE
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

  if (typeof schoolDB !== "undefined" && typeof schoolDB.updateStudent === "function") {
    schoolDB.updateStudent(currentStudent);
  }

  if (typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL) {
    try {
      fetch(CLOUD_SYNC_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStudentDetails", student: currentStudent })
      });
    } catch(err) {}
  }

  alert("Profile update ho gayi!");
  renderStudentIDCard(currentStudent);
}

// 6. PHOTO & CAMERA ENGINE
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
        '<h4 style="margin:0 0 10px 0; color:#0f172a;"><i class="fas fa-camera"></i> Live Photo Capture</h4>' +
        '<video id="cameraVideo" autoplay playsinline style="width:100%; height:240px; background:#000; border-radius:8px; object-fit:cover;"></video>' +
        '<canvas id="cameraCanvas" style="display:none;"></canvas>' +
        '<div style="display:flex; gap:10px; justify-content:center; margin-top:14px;">' +
          '<button onclick="captureStudentPhoto()" style="background:#16a34a; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;"><i class="fas fa-camera"></i> Click Photo</button>' +
          '<button onclick="closeStudentCamera()" style="background:#dc2626; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;"><i class="fas fa-times"></i> Cancel</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  modal.style.display = "flex";
  var video = document.getElementById("cameraVideo");

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(function(stream) {
        videoStream = stream;
        video.srcObject = stream;
      })
      .catch(function(err) {
        alert("Camera access nahi mila: " + err.message);
        closeStudentCamera();
      });
  } else {
    alert("Camera browser me support nahi kar raha hai!");
    closeStudentCamera();
  }
}

function captureStudentPhoto() {
  var video = document.getElementById("cameraVideo");
  var canvas = document.getElementById("cameraCanvas");
  if (!video || !canvas) return;

  canvas.width = 300;
  canvas.height = 360;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, 300, 360);

  var imgData = canvas.toDataURL("image/jpeg", 0.85);
  if (currentStudent) {
    currentStudent.photo = imgData;
    renderStudentIDCard(currentStudent);
  }

  closeStudentCamera();
}

function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(function(track) { track.stop(); });
    videoStream = null;
  }
}

function closeStudentCamera() {
  stopCamera();
  var modal = document.getElementById("cameraModal");
  if (modal) modal.style.display = "none";
}

// 7. RENDER 6:9 ID CARD
function renderStudentIDCard(s) {
  var container = document.getElementById("idCardContainer");
  if (!container) return;

  var photoSrc = s.photo || "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(s.name || "Student");

  var cardHtml = '<div class="id-card-wrapper" style="display:flex; flex-direction:column; align-items:center; padding:15px 0;">' +
    '<div class="official-id-card-6x9" id="officialCardNode" style="width:280px; height:420px; aspect-ratio:6/9; background:#ffffff; border:2px solid #0f172a; border-radius:14px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.15); display:flex; flex-direction:column; justify-content:space-between; font-family:\'Segoe UI\', Tahoma, sans-serif;">' +
      
      '<div style="background: linear-gradient(135deg, #0f172a, #1e3a8a); color:#fff; text-align:center; padding:10px 8px; border-bottom:3px solid #d97706;">' +
        '<div style="font-size:13px; font-weight:800; letter-spacing:0.8px; text-transform:uppercase;">ASSENT PUBLIC SCHOOL</div>' +
        '<div style="font-size:9px; color:#93c5fd; letter-spacing:0.3px;">Singhiya Khurd, Samastipur, Bihar - 848101</div>' +
        '<div style="font-size:8.5px; background:rgba(217, 119, 6, 0.25); color:#fef3c7; border:1px solid rgba(255,255,255,0.2); border-radius:10px; display:inline-block; padding:1px 8px; margin-top:3px; font-weight:600;">IDENTITY CARD • 2026-27</div>' +
      '</div>' +

      '<div style="padding:10px 14px; flex:1; display:flex; flex-direction:column; justify-content:space-between; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">' +
        '<div style="width:82px; height:94px; margin:0 auto; border:2.5px solid #1e3a8a; border-radius:8px; overflow:hidden; background:#e2e8f0; box-shadow:0 4px 8px rgba(0,0,0,0.1);">' +
          '<img src="' + photoSrc + '" alt="Student Photo" style="width:100%; height:100%; object-fit:cover;">' +
        '</div>' +

        '<div style="text-align:center; margin-top:4px;">' +
          '<h4 style="margin:0; color:#0f172a; font-size:13px; text-transform:uppercase; font-weight:800; letter-spacing:0.4px;">' + (s.name || 'STUDENT NAME') + '</h4>' +
          '<div style="font-size:10.5px; font-weight:700; color:#1e3a8a; background:#e0e7ff; border-radius:12px; display:inline-block; padding:2px 10px; margin-top:2px;">' +
            'Class: ' + (s.className || s.class || '—') + ' | Roll No: ' + (s.rollNo || s.roll || '—') +
          '</div>' +
        '</div>' +

        '<div style="font-size:10px; line-height:1.6; background:#ffffff; padding:6px 10px; border-radius:8px; border:1px solid #e2e8f0; color:#334155;">' +
          '<div><strong style="color:#0f172a;">Reg No:</strong> <span style="color:#2563eb; font-weight:700;">' + (s.regNo || 'PENDING') + '</span></div>' +
          '<div><strong style="color:#0f172a;">Father:</strong> ' + (s.father || '—') + '</div>' +
          '<div><strong style="color:#0f172a;">Mother:</strong> ' + (s.mother || '—') + '</div>' +
          '<div><strong style="color:#0f172a;">DOB:</strong> ' + (s.dob || '—') + '</div>' +
          '<div><strong style="color:#0f172a;">Mobile:</strong> ' + (s.mobile1 || s.mobile || '—') + '</div>' +
          '<div><strong style="color:#0f172a;">Transport:</strong> ' + (s.transport || 'School Transport') + '</div>' +
        '</div>' +

        '<div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:8.5px; font-weight:700; color:#64748b; border-top:1px dashed #cbd5e1; padding-top:4px; margin-top:2px;">' +
          '<span>Guardian Sign</span>' +
          '<span style="color:#1e3a8a;">Principal Sign</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div style="margin-top:14px;">' +
      '<button class="btn-download-img" style="background:#1e3a8a; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:700; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 10px rgba(30,58,138,0.25);" onclick="window.print()"><i class="fa fa-print"></i> Print Card</button>' +
    '</div>' +
  '</div>';

  container.innerHTML = cardHtml;
}

// 8. RENDER RESULTS TAB
function renderStudentResults(s) {
  var container = document.getElementById("studentResultsContainer");
  if (!container) return;

  var marksList = [];
  if (typeof schoolDB !== "undefined" && typeof schoolDB.getMarks === "function") {
    marksList = schoolDB.getMarks();
  } else {
    try {
      marksList = JSON.parse(localStorage.getItem("ak_school_marks") || "[]");
    } catch(e) {
      marksList = [];
    }
  }

  var studentMarks = marksList.filter(function(m) {
    return String(m.studentId || m.regNo) === String(s.id || s.regNo) ||
           (isClassEqual(m.className, s.className) && parseInt(m.rollNo, 10) === parseInt(s.rollNo, 10));
  });

  if (!studentMarks || studentMarks.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:35px 20px; color:#64748b;">' +
      '<i class="fas fa-file-invoice" style="font-size:38px; color:#cbd5e1; margin-bottom:10px;"></i>' +
      '<p style="font-weight:600; font-size:14px;">Abhi is student ka koi exam report card publish nahi hua hai.</p>' +
      '<small>Examinations section marks finalize kar raha hai.</small>' +
      '</div>';
    return;
  }

  var resHtml = '<div style="overflow-x:auto; border-radius:10px; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.04);">' +
    '<table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left; background:#fff;">' +
    '<thead><tr style="background:linear-gradient(135deg, #0f172a, #1e3a8a); color:#ffffff;">' +
    '<th style="padding:10px 12px;">Exam / Term</th>' +
    '<th style="padding:10px;">Hindi</th>' +
    '<th style="padding:10px;">English</th>' +
    '<th style="padding:10px;">Math</th>' +
    '<th style="padding:10px;">EVS / Science</th>' +
    '<th style="padding:10px;">Grand Total</th>' +
    '<th style="padding:10px;">Percentage</th>' +
    '</tr></thead><tbody>';

  studentMarks.forEach(function(m) {
    var pct = parseFloat(m.percentage || 0);
    var badgeColor = pct >= 60 ? "#16a34a" : (pct >= 40 ? "#d97706" : "#dc2626");
    var badgeBg = pct >= 60 ? "#dcfce7" : (pct >= 40 ? "#fef3c7" : "#fee2e2");

    resHtml += '<tr style="border-bottom:1px solid #f1f5f9;">' +
      '<td style="padding:10px 12px; font-weight:700; color:#1e293b;"><i class="fas fa-award" style="color:#d97706; margin-right:5px;"></i> ' + (m.term || 'Term 1') + '</td>' +
      '<td style="padding:10px; font-weight:600;">' + (m.hindi || 0) + '</td>' +
      '<td style="padding:10px; font-weight:600;">' + (m.english || 0) + '</td>' +
      '<td style="padding:10px; font-weight:600;">' + (m.math || 0) + '</td>' +
      '<td style="padding:10px; font-weight:600;">' + (m.evs || m.science || 0) + '</td>' +
      '<td style="padding:10px; font-weight:800; color:#1e3a8a; font-size:14px;">' + (m.grandTotal || m.total || 0) + '</td>' +
      '<td style="padding:10px;"><span style="background:' + badgeBg + '; color:' + badgeColor + '; font-weight:800; padding:3px 8px; border-radius:12px; font-size:12px;">' + pct + '%</span></td>' +
      '</tr>';
  });

  resHtml += '</tbody></table></div>';
  container.innerHTML = resHtml;
}
