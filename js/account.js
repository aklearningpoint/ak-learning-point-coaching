// ==========================================
// AK Learning Point - Complete Student LMS & Account Engine
// ==========================================

// Global state for active tab inside Dashboard
var currentAccountTab = 'tests';

function getStudentProfile() {
  try {
    var raw = localStorage.getItem("ak_student_profile");
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

function saveStudentProfile(name, mobile, sClass, board) {
  var profile = {
    name: name,
    mobile: mobile,
    className: sClass || "Class 10",
    board: board || "CBSE",
    joinedDate: new Date().toLocaleDateString()
  };
  localStorage.setItem("ak_student_profile", JSON.stringify(profile));
  localStorage.setItem("ak_user_logged_in", "true");
  return profile;
}

// Full-Screen Dashboard Trigger
function openStudentAccountModal() {
  var profile = getStudentProfile();
  var dynamicView = document.getElementById("dynamicView");
  if (!dynamicView) return;

  // Case 1: First-time Onboarding Login
  if (!profile) {
    dynamicView.innerHTML = `
      <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f8fafc; z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;">
        <div style="background:white; max-width:440px; width:100%; border-radius:24px; padding:28px; box-shadow:0 10px 25px rgba(0,0,0,0.1); text-align:center;">
          <div style="font-size:3rem; margin-bottom:10px;">🎓</div>
          <h2 style="color:#0f172a; margin:0 0 6px 0; font-size:1.4rem;">Student Sign-In</h2>
          <p style="color:#64748b; font-size:0.85rem; margin-bottom:20px;">Apna profile setup kijiye aur apni class ka personalized material access karein.</p>
          
          <form onsubmit="handleAccountLoginSubmit(event)" style="display:flex; flex-direction:column; gap:12px; text-align:left;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#334155;">Student Full Name</label>
              <input type="text" id="accInputName" required placeholder="e.g. Rahul Kumar" style="width:100%; padding:11px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;">
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#334155;">WhatsApp Number</label>
              <input type="tel" id="accInputMobile" required pattern="[0-9]{10}" placeholder="10-digit number" style="width:100%; padding:11px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:#334155;">Class</label>
                <select id="accInputClass" style="width:100%; padding:11px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;">
                  <option>Play</option><option>Nur</option><option>LKG</option><option>UKG</option>
                  <option>Class 1</option><option>Class 2</option><option>Class 3</option><option>Class 4</option>
                  <option>Class 5</option><option>Class 6</option><option>Class 7</option><option>Class 8</option>
                  <option>Class 9</option><option selected>Class 10</option><option>Class 11</option><option>Class 12</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:#334155;">Board</label>
                <select id="accInputBoard" style="width:100%; padding:11px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;">
                  <option selected>CBSE</option><option>BSEB</option>
                </select>
              </div>
            </div>
            <button type="submit" style="margin-top:12px; background:#1e40af; color:white; border:none; padding:12px; border-radius:12px; font-weight:700; font-size:1rem; cursor:pointer;">Enter My Learning Room 🚀</button>
          </form>
          <button onclick="closeDynamicView()" style="margin-top:14px; background:transparent; border:none; color:#64748b; font-size:0.85rem; cursor:pointer;"><i class="fas fa-times"></i> Cancel</button>
        </div>
      </div>
    `;
    return;
  }

  // Case 2: Complete Full-Screen Dashboard
  renderDashboardFullScreen(profile);
}

function renderDashboardFullScreen(profile) {
  var dynamicView = document.getElementById("dynamicView");
  if (!dynamicView) return;

  var attempts = [];
  try {
    var rawAtt = localStorage.getItem("ak_student_attempts");
    attempts = rawAtt ? JSON.parse(rawAtt) : [];
  } catch(e) {}

  var totalTests = attempts.length;
  var totalAcc = 0;
  var bestScore = 0;

  for (var i = 0; i < attempts.length; i++) {
    var p = parseFloat(attempts[i].percentage || 0);
    totalAcc += p;
    if (attempts[i].score > bestScore) bestScore = attempts[i].score;
  }
  var avgAccuracy = totalTests > 0 ? (totalAcc / totalTests).toFixed(1) : "0.0";

  dynamicView.innerHTML = `
    <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f8fafc; z-index:9999; display:flex; flex-direction:column; overflow:hidden; font-family:inherit;">
      
      <!-- Top App Bar -->
      <div style="height:60px; background:#0f172a; color:white; display:flex; align-items:center; justify-content:space-between; padding:0 18px; flex-shrink:0;">
        <div style="display:flex; align-items:center; gap:10px;">
          <button onclick="closeDynamicView()" style="background:rgba(255,255,255,0.15); border:none; color:white; width:34px; height:34px; border-radius:8px; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>
          <span style="font-weight:700; font-size:1.05rem;">Student Dashboard</span>
        </div>
        <button onclick="handleStudentLogout()" style="background:#ef4444; border:none; color:white; padding:6px 12px; border-radius:8px; font-size:0.8rem; font-weight:700; cursor:pointer;">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      <!-- Main Scrollable Body -->
      <div style="flex:1; overflow-y:auto; padding:16px; max-width:850px; margin:0 auto; width:100%; box-sizing:border-box;">
        
        <!-- Profile Banner Card -->
        <div style="background:linear-gradient(135deg, #1e3a8a, #0284c7); color:white; border-radius:20px; padding:20px; box-shadow:0 8px 20px rgba(30, 58, 138, 0.25); margin-bottom:16px;">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:60px; height:60px; border-radius:50%; background:#ffffff; color:#1e40af; font-size:1.8rem; font-weight:900; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                ${profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style="margin:0; font-size:1.2rem; font-weight:800;">${profile.name}</h3>
                <div style="font-size:0.85rem; color:#bae6fd; margin-top:3px;">
                  <span>📱 +91 ${profile.mobile}</span> • 
                  <span style="background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:6px; font-weight:700;">${profile.className} (${profile.board})</span>
                </div>
              </div>
            </div>
            
            <button onclick="switchDashboardTab('purchase')" style="background:#fbbf24; color:#0f172a; border:none; padding:10px 16px; border-radius:12px; font-weight:800; font-size:0.88rem; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 4px 10px rgba(251, 191, 36, 0.3);">
              <i class="fas fa-crown"></i> Purchase Course / Batches
            </button>
          </div>

          <!-- Quick 3 Stats -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:16px;">
            <div style="background:rgba(255,255,255,0.12); padding:10px; border-radius:12px; text-align:center;">
              <div style="font-size:1.3rem; font-weight:800;">${totalTests}</div>
              <div style="font-size:0.75rem; color:#e0f2fe; margin-top:2px;">Tests Given</div>
            </div>
            <div style="background:rgba(255,255,255,0.12); padding:10px; border-radius:12px; text-align:center;">
              <div style="font-size:1.3rem; font-weight:800; color:#86efac;">${avgAccuracy}%</div>
              <div style="font-size:0.75rem; color:#e0f2fe; margin-top:2px;">Accuracy</div>
            </div>
            <div style="background:rgba(255,255,255,0.12); padding:10px; border-radius:12px; text-align:center;">
              <div style="font-size:1.3rem; font-weight:800; color:#fde047;">${bestScore}</div>
              <div style="font-size:0.75rem; color:#e0f2fe; margin-top:2px;">Top Score</div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom:14px;">
          <button id="tabBtn_tests" onclick="switchDashboardTab('tests')" style="padding:9px 15px; border-radius:10px; font-weight:700; font-size:0.85rem; border:none; cursor:pointer; background:#1e40af; color:white;">
            <i class="fas fa-clipboard-check"></i> My Class Tests
          </button>
          <button id="tabBtn_results" onclick="switchDashboardTab('results')" style="padding:9px 15px; border-radius:10px; font-weight:700; font-size:0.85rem; border:none; cursor:pointer; background:#e2e8f0; color:#475569;">
            <i class="fas fa-chart-line"></i> Results & Analysis
          </button>
          <button id="tabBtn_material" onclick="switchDashboardTab('material')" style="padding:9px 15px; border-radius:10px; font-weight:700; font-size:0.85rem; border:none; cursor:pointer; background:#e2e8f0; color:#475569;">
            <i class="fas fa-book-reader"></i> Study Material
          </button>
          <button id="tabBtn_classes" onclick="switchDashboardTab('classes')" style="padding:9px 15px; border-radius:10px; font-weight:700; font-size:0.85rem; border:none; cursor:pointer; background:#e2e8f0; color:#475569;">
            <i class="fas fa-video"></i> Online Classes
          </button>
          <button id="tabBtn_purchase" onclick="switchDashboardTab('purchase')" style="padding:9px 15px; border-radius:10px; font-weight:700; font-size:0.85rem; border:none; cursor:pointer; background:#e2e8f0; color:#475569;">
            <i class="fas fa-qrcode"></i> Buy / Pay
          </button>
        </div>

        <!-- Dynamic Content Body -->
        <div id="dashboardTabContent"></div>

      </div>
    </div>
  `;

  switchDashboardTab('tests');
}

// Tab Switching Controller
function switchDashboardTab(tabName) {
  currentAccountTab = tabName;
  var tabs = ['tests', 'results', 'material', 'classes', 'purchase'];
  tabs.forEach(function(t) {
    var btn = document.getElementById("tabBtn_" + t);
    if (btn) {
      if (t === tabName) {
        btn.style.background = "#1e40af";
        btn.style.color = "white";
      } else {
        btn.style.background = "#e2e8f0";
        btn.style.color = "#475569";
      }
    }
  });

  var container = document.getElementById("dashboardTabContent");
  if (!container) return;

  var profile = getStudentProfile();

  if (tabName === 'tests') {
    renderClassTestsTab(container, profile);
  } else if (tabName === 'results') {
    renderResultsAnalysisTab(container, profile);
  } else if (tabName === 'material') {
    renderStudyMaterialTab(container, profile);
  } else if (tabName === 'classes') {
    renderOnlineClassesTab(container, profile);
  } else if (tabName === 'purchase') {
    renderPurchaseCourseTab(container, profile);
  }
}

// 1. My Class Tests
function renderClassTestsTab(container, profile) {
  var allTeacherQuizzes = [];
  try {
    var raw = localStorage.getItem("ak_teacher_quizzes");
    allTeacherQuizzes = raw ? JSON.parse(raw) : [];
  } catch(e) {}

  var matched = allTeacherQuizzes.filter(function(q) {
    return String(q.className || "").trim().toLowerCase() === String(profile.className).trim().toLowerCase() &&
           String(q.board || "").trim().toLowerCase() === String(profile.board).trim().toLowerCase();
  });

  if (matched.length === 0) {
    container.innerHTML = `
      <div style="background:white; border-radius:16px; padding:30px; text-align:center; border:1px solid #e2e8f0;">
        <i class="fas fa-folder-open" style="font-size:2.5rem; color:#94a3b8; margin-bottom:10px;"></i>
        <h4 style="color:#1e293b; margin:0 0 6px 0;">Aapki Class (${profile.className} - ${profile.board}) ke liye abhi test upload ho rahe hain</h4>
        <p style="color:#64748b; font-size:0.85rem; margin-bottom:15px;">Aap general tests bhi de sakte hain.</p>
        <button onclick="closeDynamicView(); openBoardSelectModal();" style="background:#2563eb; color:white; border:none; padding:10px 18px; border-radius:10px; font-weight:700; cursor:pointer;">
          Explore All Quizzes
        </button>
      </div>
    `;
    return;
  }

  var html = matched.map(function(q, idx) {
    return `
      <div style="background:white; border-radius:14px; padding:16px; margin-bottom:12px; border:1px solid #e2e8f0; border-left:5px solid #2563eb; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h4 style="margin:0 0 4px 0; color:#0f172a; font-size:1rem;">${q.title}</h4>
          <span style="font-size:0.8rem; color:#64748b;">Subject: <strong>${q.subject}</strong> • ${q.questions ? q.questions.length : 0} Questions</span>
        </div>
        <button onclick="launchQuizFromAccount('${q.id}')" style="background:#16a34a; color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:700; cursor:pointer;">
          Start Test
        </button>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
}

// 2. Results & Detailed Analysis
function renderResultsAnalysisTab(container, profile) {
  var attempts = [];
  try {
    var rawAtt = localStorage.getItem("ak_student_attempts");
    attempts = rawAtt ? JSON.parse(rawAtt) : [];
  } catch(e) {}

  if (attempts.length === 0) {
    container.innerHTML = `
      <div style="background:white; border-radius:16px; padding:30px; text-align:center; border:1px solid #e2e8f0;">
        <i class="fas fa-chart-pie" style="font-size:2.5rem; color:#94a3b8; margin-bottom:10px;"></i>
        <h4 style="color:#1e293b; margin:0 0 4px 0;">No Test Records Found</h4>
        <p style="color:#64748b; font-size:0.85rem;">Pehle ek test complete kijiye, yahan instant analysis dikhega.</p>
      </div>
    `;
    return;
  }

  var html = attempts.map(function(att) {
    return `
      <div style="background:white; border-radius:14px; padding:16px; margin-bottom:12px; border:1px solid #e2e8f0; border-left:5px solid #059669;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h4 style="margin:0 0 4px 0; color:#0f172a; font-size:1rem;">${att.quizTitle || 'Practice Test'}</h4>
            <div style="font-size:0.8rem; color:#64748b;">Date: ${new Date(att.timestamp).toLocaleDateString()}</div>
          </div>
          <div style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:8px; font-weight:800; font-size:0.9rem;">
            ${att.percentage}%
          </div>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin:12px 0; background:#f8fafc; padding:10px; border-radius:10px; text-align:center; font-size:0.8rem;">
          <div>Marks: <strong>${att.score}/${att.totalMarks || att.total}</strong></div>
          <div style="color:#16a34a;">✅ Correct: ${att.correctCount || 0}</div>
          <div style="color:#ef4444;">❌ Wrong: ${att.wrongCount || 0}</div>
        </div>

        <button onclick="downloadScoreCardDirect('${att.id}')" style="background:#0284c7; color:white; border:none; padding:8px 12px; border-radius:8px; font-weight:700; font-size:0.8rem; cursor:pointer; width:100%;">
          <i class="fas fa-download"></i> Download Official Certificate (PNG)
        </button>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
}

// 3. Study Material
function renderStudyMaterialTab(container, profile) {
  container.innerHTML = `
    <div style="background:white; border-radius:16px; padding:20px; border:1px solid #e2e8f0;">
      <h3 style="margin:0 0 10px 0; color:#0f172a; font-size:1.1rem;"><i class="fas fa-book" style="color:#0891b2;"></i> ${profile.className} Smart Study Notes</h3>
      <p style="color:#64748b; font-size:0.85rem; margin-bottom:16px;">Aapki class ke important concepts, formulas aur chapter guides.</p>
      
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdfa; padding:12px 14px; border-radius:10px; border:1px solid #ccfbf1;">
          <div>
            <strong style="color:#0f766e; display:block; font-size:0.92rem;">Science & Math Quick Revision Guide</strong>
            <small style="color:#64748b;">Chapter formulas & Solved Examples</small>
          </div>
          <a href="learning-hub.html" style="background:#0d9488; color:white; text-decoration:none; padding:6px 12px; border-radius:8px; font-size:0.8rem; font-weight:700;">Open Hub</a>
        </div>
      </div>
    </div>
  `;
}

// 4. Online Classes
function renderOnlineClassesTab(container, profile) {
  container.innerHTML = `
    <div style="background:white; border-radius:16px; padding:20px; border:1px solid #e2e8f0;">
      <h3 style="margin:0 0 10px 0; color:#0f172a; font-size:1.1rem;"><i class="fas fa-video" style="color:#7c3aed;"></i> ${profile.className} Video Lectures</h3>
      <p style="color:#64748b; font-size:0.85rem; margin-bottom:16px;">Concept explanation videos aur doubt sessions.</p>
      
      <div style="background:#faf5ff; border:1px solid #f3e8ff; border-radius:12px; padding:16px; text-align:center;">
        <i class="fab fa-youtube" style="font-size:2.8rem; color:#dc2626; margin-bottom:8px;"></i>
        <h4 style="margin:0 0 4px 0; color:#1e293b;">Daily Concept Classes on Aaj Ka Sach</h4>
        <p style="color:#64748b; font-size:0.82rem; margin-bottom:12px;">Naye topics ki video classes YouTube par regularly update hoti hain.</p>
        <a href="https://youtube.com" target="_blank" style="background:#dc2626; color:white; text-decoration:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:0.85rem; display:inline-block;">Watch Lectures</a>
      </div>
    </div>
  `;
}

// 5. Course Purchase, Payment QR & Google Drive Screenshot Upload
function renderPurchaseCourseTab(container, profile) {
  container.innerHTML = `
    <div style="background:white; border-radius:20px; padding:20px; border:1px solid #e2e8f0; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
      <div style="text-align:center; margin-bottom:16px;">
        <span style="background:#fef3c7; color:#92400e; font-weight:800; font-size:0.75rem; padding:4px 10px; border-radius:20px; text-transform:uppercase;">Special Batch Admission</span>
        <h3 style="color:#0f172a; margin:6px 0 4px 0; font-size:1.2rem;">Enroll in Complete Coaching Package</h3>
        <p style="color:#64748b; font-size:0.85rem; margin:0;">Full syllabus tests, personal guidance, study notes & certificate support.</p>
      </div>

      <!-- Payment QR Card -->
      <div style="background:#f8fafc; border:2px dashed #cbd5e1; border-radius:16px; padding:16px; text-align:center; margin-bottom:18px;">
        <div style="font-weight:700; color:#1e293b; font-size:0.95rem; margin-bottom:10px;">Scan QR Code to Pay via PhonePe / GPay / Paytm</div>
        
        <!-- Aapka QR Code Image -->
        <img id="upiPaymentQr" src="./assets/qr.png" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=8826011682@upi&pn=AK%20Learning%20Point'" style="width:170px; height:170px; border-radius:12px; border:1px solid #e2e8f0; background:white; padding:6px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
        
        <div style="margin-top:10px; font-size:0.85rem; color:#334155;">
          UPI ID: <strong style="color:#1e40af;">8826011682@upi</strong>
        </div>
      </div>

      <!-- Screenshot Upload to Google Drive -->
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:14px; padding:16px;">
        <h4 style="margin:0 0 6px 0; color:#166534; font-size:0.95rem;"><i class="fas fa-receipt"></i> Upload Payment Screenshot</h4>
        <p style="color:#15803d; font-size:0.8rem; margin-bottom:12px;">Payment complete hone ke baad screenshot yahan upload karein. Ye direct hamare Google Drive me save hoga.</p>
        
        <input type="file" id="payProofFile" accept="image/*" style="width:100%; font-size:0.85rem; margin-bottom:10px;">
        
        <button id="btnUploadProof" onclick="uploadPaymentProof()" style="background:#16a34a; color:white; border:none; padding:10px 16px; border-radius:10px; font-weight:700; font-size:0.9rem; cursor:pointer; width:100%; display:flex; align-items:center; justify-content:center; gap:8px;">
          <i class="fas fa-cloud-upload-alt"></i> Submit Payment Screenshot
        </button>
        <div id="uploadStatusMsg" style="margin-top:8px; font-size:0.82rem; font-weight:700; text-align:center;"></div>
      </div>
    </div>
  `;
}

// Drive Upload Logic via Apps Script
function uploadPaymentProof() {
  var fileInput = document.getElementById("payProofFile");
  var statusMsg = document.getElementById("uploadStatusMsg");
  var btn = document.getElementById("btnUploadProof");
  var profile = getStudentProfile();

  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Kripya payment screenshot select karein!");
    return;
  }

  var file = fileInput.files[0];
  var reader = new FileReader();

  btn.disabled = true;
  btn.innerText = "Uploading to Drive...";
  statusMsg.style.color = "#0284c7";
  statusMsg.innerText = "Saving to Google Drive, please wait...";

  reader.onload = function(e) {
    var base64Data = e.target.result.split(",")[1];
    var payload = {
      action: "uploadPaymentReceipt",
      studentName: profile.name,
      studentMobile: profile.mobile,
      studentClass: profile.className,
      fileName: profile.name.replace(/\s+/g, "_") + "_" + Date.now() + ".jpg",
      mimeType: file.type || "image/jpeg",
      fileData: base64Data
    };

    // Google Apps Script Post
    if (typeof API !== "undefined" && API.post) {
      API.post("uploadPaymentReceipt", payload)
        .then(function(res) {
          btn.disabled = false;
          btn.innerText = "Submitted Successfully!";
          statusMsg.style.color = "#16a34a";
          statusMsg.innerText = "✅ Screenshot Drive me save ho gaya hai! Admin jald verify karenge.";
          alert("Payment receipt successfully received!");
        })
        .catch(function(err) {
          fallbackAppsScriptUpload(payload, btn, statusMsg);
        });
    } else {
      fallbackAppsScriptUpload(payload, btn, statusMsg);
    }
  };

  reader.readAsDataURL(file);
}

function fallbackAppsScriptUpload(payload, btn, statusMsg) {
  // Aapka Google Apps Script Web App URL
  var scriptUrl = "https://script.google.com/macros/s/AKfycbwPz26P35bU9hLg9qZ8k1-vG-M_Z8-XEXAMPLE/exec";

  fetch(scriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(function() {
    btn.disabled = false;
    btn.innerText = "Submitted!";
    statusMsg.style.color = "#16a34a";
    statusMsg.innerText = "✅ Screenshot save ho gaya hai!";
    alert("Payment screenshot successfully uploaded!");
  })
  .catch(function(e) {
    btn.disabled = false;
    btn.innerText = "Try Again";
    statusMsg.style.color = "#ef4444";
    statusMsg.innerText = "Upload failed. WhatsApp par share karein.";
  });
}

function launchQuizFromAccount(quizId) {
  closeDynamicView();
  var allQuizzes = [];
  try {
    allQuizzes = JSON.parse(localStorage.getItem("ak_teacher_quizzes") || "[]");
  } catch(e) {}
  
  var q = allQuizzes.find(function(item) { return item.id === quizId; });
  if (q && typeof openQuizEntryModalByIndex === "function") {
    window.activeLoadedQuizzes = [q];
    openQuizEntryModalByIndex(0);
  }
}

function downloadScoreCardDirect(attemptId) {
  var attempts = JSON.parse(localStorage.getItem("ak_student_attempts") || "[]");
  var att = attempts.find(function(a) { return a.id === attemptId; });
  if (att) {
    window.lastSubmittedAttempt = att;
    if (typeof downloadScoreCardAsImage === "function") {
      downloadScoreCardAsImage();
    }
  }
}

function handleAccountLoginSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  var name = document.getElementById("accInputName").value.trim();
  var mobile = document.getElementById("accInputMobile").value.trim();
  var sClass = document.getElementById("accInputClass").value;
  var board = document.getElementById("accInputBoard").value;

  if (!name || mobile.length < 10) {
    alert("Sahi naam aur 10-digit number bharein!");
    return;
  }

  saveStudentProfile(name, mobile, sClass, board);
  openStudentAccountModal();
}

function handleStudentLogout() {
  if (confirm("Kya aap account switch ya logout karna chahte hain?")) {
    localStorage.removeItem("ak_student_profile");
    localStorage.removeItem("ak_user_logged_in");
    openStudentAccountModal();
  }
}
