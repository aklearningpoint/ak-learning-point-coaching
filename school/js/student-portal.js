// ==========================================
// STUDENT PORTAL ENGINE - ASSENT PUBLIC SCHOOL
// File: js/student-portal.js (Production Level 2)
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

  // Persistent Local Photo Check (Cloud sync overwrite protection)
  var savedLocalPhoto = localStorage.getItem("ak_stu_photo_" + (student.regNo || student.id));
  if (savedLocalPhoto) {
    student.photo = savedLocalPhoto;
  }

  currentStudent = student;
  document.getElementById("studentAuthOverlay").style.display = "none";
  document.getElementById("studentWorkspace").style.display = "block";

  // Update Top Broad Ribbon
  updateTopRibbon(student);
  populateProfile(student);
  renderStudentIDCard(student);
  renderResults(student);
}

function updateTopRibbon(s) {
  var nameEl = document.getElementById("welcomeBanner");
  if (nameEl) nameEl.innerText = "Welcome, " + (s.name || "Student");

  var clsBadge = document.getElementById("ribbonClassBadge");
  if (clsBadge) clsBadge.innerText = "Class: " + (s.className || s.class || "—");

  var rollBadge = document.getElementById("ribbonRollBadge");
  if (rollBadge) rollBadge.innerText = "Roll: " + (s.rollNo || s.roll || "—");

  var regBadge = document.getElementById("ribbonRegBadge");
  if (regBadge) regBadge.innerText = "Reg: " + (s.regNo || "PENDING");

  var photoImg = document.getElementById("ribbonStudentPhoto");
  if (photoImg) {
    photoImg.src = s.photo || ("https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(s.name || "Student"));
  }
}

function logoutStudent() {
  stopCamera();
  currentStudent = null;
  document.getElementById("studentWorkspace").style.display = "none";
  document.getElementById("studentAuthOverlay").style.display = "flex";
  document.getElementById("loginRoll").value = "";
}

// Support both Tab Bar & Action Cards
function switchTab(tabId, cardElem) {
  var panes = document.querySelectorAll(".tab-pane");
  panes.forEach(function(p) { p.classList.remove("active"); });

  var cards = document.querySelectorAll(".portal-action-card, .tab-btn");
  cards.forEach(function(b) { b.classList.remove("active"); });

  var target = document.getElementById(tabId);
  if (target) target.classList.add("active");

  if (cardElem) {
    cardElem.classList.add("active");
  } else if (window.event && window.event.currentTarget) {
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

  updateTopRibbon(currentStudent);
  renderStudentIDCard(currentStudent);
  renderResults(currentStudent);
  alert("Profile update ho gayi!");
}

// ----------------------------------------------------
// CAMERA & PERSISTENT PHOTO ENGINE
// ----------------------------------------------------
function previewStudentPhoto(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      saveStudentPhotoLocally(e.target.result);
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function saveStudentPhotoLocally(dataUrl) {
  if (!currentStudent) return;
  currentStudent.photo = dataUrl;
  
  // Persistent Storage Key
  localStorage.setItem("ak_stu_photo_" + (currentStudent.regNo || currentStudent.id), dataUrl);
  
  updateTopRibbon(currentStudent);
  renderStudentIDCard(currentStudent);
  renderResults(currentStudent);
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

  var img = canvas.toDataURL("image/jpeg", 0.9);
  saveStudentPhotoLocally(img);
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

// ----------------------------------------------------
// 2. OFFICIAL 6:9 ID CARD (BOTH MOBILES + DIRECTOR)
// ----------------------------------------------------
function renderStudentIDCard(s) {
  var box = document.getElementById("idCardContainer");
  if (!box) return;

  var photo = s.photo || ("https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(s.name || "Student"));

  var html = 
    '<div id="printableIdCard" class="official-id-card-6x9" style="width:290px; height:450px; aspect-ratio:6/9; background:#fff; border:2px solid #0f172a; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 24px rgba(0,0,0,0.15);">' +
      '<div style="background:linear-gradient(135deg, #0f172a, #1e3a8a); color:#fff; text-align:center; padding:10px 8px; border-bottom:3px solid #d97706;">' +
        '<div style="font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">ASSENT PUBLIC SCHOOL</div>' +
        '<div style="font-size:9.5px; color:#93c5fd;">Singhiya Khurd, Samastipur, Bihar - 848101</div>' +
        '<div style="font-size:8.5px; background:rgba(217,119,6,0.25); color:#fef3c7; display:inline-block; padding:2px 8px; border-radius:10px; margin-top:3px; font-weight:700;">IDENTITY CARD 2026-27</div>' +
      '</div>' +

      '<div style="padding:10px 14px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">' +
        '<div style="width:85px; height:100px; margin:0 auto; border:2px solid #1e3a8a; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.12);">' +
          '<img src="' + photo + '" style="width:100%; height:100%; object-fit:cover;">' +
        '</div>' +

        '<div style="text-align:center;">' +
          '<h4 style="margin:2px 0; font-size:13px; text-transform:uppercase; color:#0f172a; font-weight:800;">' + (s.name || 'STUDENT NAME') + '</h4>' +
          '<div style="font-size:11px; font-weight:700; color:#1e3a8a;">Class: ' + (s.className || s.class || '—') + ' | Roll: ' + (s.rollNo || s.roll || '—') + '</div>' +
        '</div>' +

        '<div style="font-size:9.5px; line-height:1.55; background:#f8fafc; padding:8px 10px; border-radius:6px; border:1px solid #e2e8f0;">' +
          '<div><b>Reg No:</b> ' + (s.regNo || 'PENDING') + '</div>' +
          '<div><b>Father:</b> ' + (s.father || '—') + '</div>' +
          '<div><b>Mother:</b> ' + (s.mother || '—') + '</div>' +
          '<div><b>Primary Mob:</b> ' + (s.mobile1 || s.mobile || '—') + '</div>' +
          '<div><b>Alt Mob:</b> ' + (s.mobile2 || '—') + '</div>' +
          '<div><b>Transport:</b> ' + (s.transport || 'School Transport') + '</div>' +
        '</div>' +

        '<div style="display:flex; justify-content:space-between; font-size:8.5px; color:#334155; border-top:1px dashed #cbd5e1; padding-top:6px; font-weight:700;">' +
          '<div style="text-align:center;"><b>G. K. Thakur</b><br><small style="font-size:7.5px; color:#64748b;">Director</small></div>' +
          '<div style="text-align:center;"><b>Principal A. K. Sign</b><br><small style="font-size:7.5px; color:#64748b;">Assent Public School</small></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div style="display:flex; gap:10px; margin-top:14px;" class="no-print">' +
      '<button onclick="downloadIdCardPDF()" style="background:#15803d; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;"><i class="fa fa-file-pdf"></i> Download ID PDF</button>' +
      '<button onclick="window.print()" style="background:#1e3a8a; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;"><i class="fa fa-print"></i> Print Card</button>' +
    '</div>';

  box.innerHTML = html;
}

function downloadIdCardPDF() {
  var element = document.getElementById("printableIdCard");
  if (!element) return;
  var opt = {
    margin: [10, 10, 10, 10],
    filename: (currentStudent.name || "Student") + "_ID_Card.pdf",
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 3, useCORS: true },
    jsPDF: { unit: 'mm', format: [100, 150], orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}

// ----------------------------------------------------
// 3. OFFICIAL SINGLE A4 REPORT CARD WITH AUTO-SUM
// ----------------------------------------------------
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
    box.innerHTML = 
      '<div class="card-p4" style="background:#fff; border-radius:12px; padding:30px; text-align:center; color:#64748b; border:1px solid #e2e8f0;">' +
        '<i class="fa fa-clipboard-list" style="font-size:36px; margin-bottom:10px; color:#cbd5e1;"></i>' +
        '<h4>Abhi is session ka result publish nahi hua hai.</h4>' +
        '<p style="font-size:12px;">Class Teacher dwara scores submit aur publish hone par official Marksheet yahan generate ho jayegi.</p>' +
      '</div>';
    return;
  }

  var m = studentMarks[0];
  var h = parseFloat(m.hindi || 0);
  var e = parseFloat(m.english || 0);
  var math = parseFloat(m.math || 0);
  var evs = parseFloat(m.evs || m.science || 0);
  var draw = m.drawing !== undefined ? parseFloat(m.drawing) : 0;

  // Auto-Calculation Engine: Agar Cloud Sheet se Total 0 aaya ho
  var calculatedTotal = (m.grandTotal && parseFloat(m.grandTotal) > 0) ? parseFloat(m.grandTotal) : (h + e + math + evs + draw);
  var maxTotal = (m.drawing !== undefined) ? 450 : 400;
  var calculatedPct = (m.percentage && parseFloat(m.percentage) > 0) ? parseFloat(m.percentage) : parseFloat(((calculatedTotal / maxTotal) * 100).toFixed(2));

  var grade = "A+";
  if (calculatedPct < 60) grade = "B";
  if (calculatedPct < 45) grade = "C";
  if (calculatedPct < 33) grade = "D";

  var photo = s.photo || ("https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(s.name));

  var html = 
    '<div class="no-print" style="text-align:right; margin-bottom:12px;">' +
      '<button onclick="downloadReportCardPDF()" style="background:#15803d; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer; margin-right:8px;"><i class="fa fa-file-pdf"></i> Download A4 Marksheet</button>' +
      '<button onclick="window.print()" style="background:#0f172a; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:700; cursor:pointer;"><i class="fa fa-print"></i> Print Marksheet</button>' +
    '</div>' +

    '<div id="officialA4ReportSheet" style="max-width:800px; margin:0 auto; background:#fff; border:3px double #0f172a; padding:24px; border-radius:8px; font-family:\'Segoe UI\', Tahoma, sans-serif; box-shadow:0 8px 24px rgba(0,0,0,0.08);">' +
      '<div style="text-align:center; border-bottom:2px solid #0f172a; padding-bottom:12px; margin-bottom:15px;">' +
        '<h2 style="margin:0; font-size:24px; color:#0f172a; letter-spacing:1px; text-transform:uppercase;">ASSENT PUBLIC SCHOOL</h2>' +
        '<p style="margin:2px 0; font-size:11.5px; color:#475569;">Singhiya Khurd, Samastipur, Bihar - 848101</p>' +
        '<p style="margin:2px 0; font-size:10.5px; color:#64748b;">Recognized / Affiliated Curriculum • Academic Session 2026-2027</p>' +
        '<div style="display:inline-block; background:#d97706; color:#fff; font-weight:800; font-size:11px; padding:2px 14px; border-radius:12px; margin-top:4px; text-transform:uppercase;">OFFICIAL PROGRESS REPORT CARD (' + (m.term || 'TERM 1') + ')</div>' +
      '</div>' +

      '<div style="display:grid; grid-template-columns: 1fr 100px; gap:15px; background:#f8fafc; padding:12px 16px; border-radius:6px; border:1px solid #e2e8f0; margin-bottom:18px; font-size:12px;">' +
        '<div style="line-height:1.6;">' +
          '<div><b>Candidate Name:</b> <span style="text-transform:uppercase; font-weight:800; color:#0f172a;">' + s.name + '</span></div>' +
          '<div><b>Class & Section:</b> Class ' + (s.className || s.class) + ' | <b>Roll No:</b> ' + (s.rollNo || s.roll) + '</div>' +
          '<div><b>Admission / Reg No:</b> ' + (s.regNo || 'REG-PENDING') + '</div>' +
          '<div><b>Father\'s Name:</b> ' + (s.father || 'Not Updated') + '</div>' +
          '<div><b>Mother\'s Name:</b> ' + (s.mother || 'Not Updated') + '</div>' +
          '<div><b>Contact:</b> ' + (s.mobile1 || s.mobile || '—') + '</div>' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<img src="' + photo + '" style="width:85px; height:95px; object-fit:cover; border-radius:6px; border:2px solid #0f172a;">' +
        '</div>' +
      '</div>' +

      '<table style="width:100%; border-collapse:collapse; margin-bottom:16px; font-size:12.5px;">' +
        '<thead>' +
          '<tr style="background:#0f172a; color:#fff;">' +
            '<th style="border:1px solid #cbd5e1; padding:8px 10px; text-align:left;">Subject Name</th>' +
            '<th style="border:1px solid #cbd5e1; padding:8px 10px; text-align:center;">Max Marks</th>' +
            '<th style="border:1px solid #cbd5e1; padding:8px 10px; text-align:center;">Passing Marks</th>' +
            '<th style="border:1px solid #cbd5e1; padding:8px 10px; text-align:center;">Marks Obtained</th>' +
            '<th style="border:1px solid #cbd5e1; padding:8px 10px; text-align:center;">Grade</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>' +
          '<tr><td style="border:1px solid #cbd5e1; padding:8px 10px; text-align:left;"><b>Hindi</b></td><td style="border:1px solid #cbd5e1; text-align:center;">100</td><td style="border:1px solid #cbd5e1; text-align:center;">33</td><td style="border:1px solid #cbd5e1; text-align:center;"><b>' + h + '</b></td><td style="border:1px solid #cbd5e1; text-align:center;">' + (h>=60?'A':'B') + '</td></tr>' +
          '<tr><td style="border:1px solid #cbd5e1; padding:8px 10px; text-align:left;"><b>English</b></td><td style="border:1px solid #cbd5e1; text-align:center;">100</td><td style="border:1px solid #cbd5e1; text-align:center;">33</td><td style="border:1px solid #cbd5e1; text-align:center;"><b>' + e + '</b></td><td style="border:1px solid #cbd5e1; text-align:center;">' + (e>=60?'A':'B') + '</td></tr>' +
          '<tr><td style="border:1px solid #cbd5e1; padding:8px 10px; text-align:left;"><b>Mathematics</b></td><td style="border:1px solid #cbd5e1; text-align:center;">100</td><td style="border:1px solid #cbd5e1; text-align:center;">33</td><td style="border:1px solid #cbd5e1; text-align:center;"><b>' + math + '</b></td><td style="border:1px solid #cbd5e1; text-align:center;">' + (math>=60?'A':'B') + '</td></tr>' +
          '<tr><td style="border:1px solid #cbd5e1; padding:8px 10px; text-align:left;"><b>EVS / Science</b></td><td style="border:1px solid #cbd5e1; text-align:center;">100</td><td style="border:1px solid #cbd5e1; text-align:center;">33</td><td style="border:1px solid #cbd5e1; text-align:center;"><b>' + evs + '</b></td><td style="border:1px solid #cbd5e1; text-align:center;">' + (evs>=60?'A':'B') + '</td></tr>' +
          (m.drawing !== undefined ? '<tr><td style="border:1px solid #cbd5e1; padding:8px 10px; text-align:left;"><b>Drawing</b></td><td style="border:1px solid #cbd5e1; text-align:center;">50</td><td style="border:1px solid #cbd5e1; text-align:center;">17</td><td style="border:1px solid #cbd5e1; text-align:center;"><b>' + draw + '</b></td><td style="border:1px solid #cbd5e1; text-align:center;">' + (draw>=30?'A':'B') + '</td></tr>' : '') +
        '</tbody>' +
      '</table>' +

      '<div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; background:#f1f5f9; padding:10px; border-radius:6px; border:1px solid #cbd5e1; margin-bottom:35px; text-align:center; font-size:12px;">' +
        '<div><b>Max Marks:</b><br>' + maxTotal + '</div>' +
        '<div><b>Marks Obtained:</b><br><span style="font-weight:800; color:#1e3a8a; font-size:14px;">' + calculatedTotal + '</span></div>' +
        '<div><b>Percentage:</b><br><span style="font-weight:800; color:#16a34a; font-size:14px;">' + calculatedPct + '%</span></div>' +
        '<div><b>Final Result:</b><br><span style="font-weight:800; color:#0f172a;">PASSED (' + grade + ')</span></div>' +
      '</div>' +

      '<div style="display:flex; justify-content:space-between; padding:0 20px; font-size:12px; font-weight:700; color:#0f172a;">' +
        '<div style="text-align:center;">' +
          '<div>____________________</div>' +
          '<div style="margin-top:4px;">Class Teacher</div>' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<div><b>M. K. Aryan</b></div>' +
          '<div style="margin-top:2px; font-size:11px; color:#475569;">Director (Assent Public School)</div>' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<div>____________________</div>' +
          '<div style="margin-top:4px;">Principal Signature</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  box.innerHTML = html;
}

function downloadReportCardPDF() {
  var element = document.getElementById("officialA4ReportSheet");
  if (!element) return;
  var opt = {
    margin: [10, 10, 10, 10],
    filename: (currentStudent.name || "Student") + "_Report_Card.pdf",
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}
