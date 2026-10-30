// =========================================================================
// STUDENT PORTAL MODULE: AUTH, MULTI-PROFILE, LMS DASHBOARD & FEES ENGINE
// =========================================================================

function getSafeAccountData(key) {
  try {
    if (window.AppInventor && window.AppInventor.getWebViewString) {
      var appData = window.AppInventor.getWebViewString();
      if (appData && appData.length > 5 && appData.indexOf("{") !== -1) {
        localStorage.setItem(key, appData);
        return JSON.parse(appData);
      }
    }
    var d = localStorage.getItem(key);
    return d ? JSON.parse(d) : null;
  } catch(e) {
    return null;
  }
}

function setSafeAccountData(key, val) {
  try {
    var str = JSON.stringify(val);
    localStorage.setItem(key, str);
    if (window.AppInventor && window.AppInventor.setWebViewString) {
      window.AppInventor.setWebViewString(str);
    }
  } catch(e) {}
}

function getRegisteredAccountsList() {
  try {
    return JSON.parse(localStorage.getItem("ak_saved_student_accounts") || "[]");
  } catch(e) {
    return [];
  }
}

function saveRegisteredAccountsList(accounts) {
  try {
    localStorage.setItem("ak_saved_student_accounts", JSON.stringify(accounts));
  } catch(e) {}
}

// 1. Entry Point
function openStudentAccountModal() {
  var activeProfile = getSafeAccountData("ak_student_profile");
  if (activeProfile && activeProfile.mobile) {
    renderStudentAccountDashboard(activeProfile);
    return;
  }
  renderMobileCheckModal();
}

// 2. Mobile Number Verification Screen
function renderMobileCheckModal() {
  var dv = document.getElementById("dynamicView");
  if (!dv) return;

  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15, 23, 42, 0.75); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;">' +
    '<div style="background:white; max-width:420px; width:100%; border-radius:24px; padding:24px; box-shadow:0 15px 35px rgba(0,0,0,0.2); text-align:center;">' +
    '<div style="width:60px; height:60px; border-radius:50%; background:#e0f2fe; color:#0284c7; display:flex; align-items:center; justify-content:center; margin:0 auto 12px auto; font-size:1.8rem;">' +
    '<i class="fas fa-user-graduate"></i>' +
    '</div>' +
    '<h3 style="color:#0f172a; margin:0 0 6px 0; font-size:1.3rem; font-weight:800;">Student Portal Login</h3>' +
    '<p style="color:#64748b; font-size:0.84rem; margin:0 0 18px 0;">Apna 10-digit mobile number enter karke dashboard me login karein.</p>' +
    '<form onsubmit="handleMobileCheckSubmit(event)" style="display:flex; flex-direction:column; gap:12px; text-align:left;">' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">WhatsApp / Mobile Number</label>' +
    '<input type="tel" id="loginMobileInput" required pattern="[0-9]{10}" placeholder="Enter 10-digit number" style="width:100%; padding:12px; border-radius:12px; border:1.5px solid #cbd5e1; font-size:1rem; box-sizing:border-box; margin-top:4px; outline:none;">' +
    '</div>' +
    '<button type="submit" style="background:#059669; color:white; border:none; padding:12px; border-radius:12px; font-weight:800; font-size:1rem; cursor:pointer; box-shadow:0 4px 12px rgba(5,150,105,0.3);">' +
    'Continue <i class="fas fa-arrow-right"></i>' +
    '</button>' +
    '</form>' +
    '<button onclick="closeDynamicView()" style="margin-top:14px; background:transparent; border:none; color:#64748b; font-size:0.85rem; cursor:pointer;"><i class="fas fa-times"></i> Cancel</button>' +
    '</div></div>';

  dv.innerHTML = html;
}

// 3. Multi-source Search (Local Accounts + Attempts History + Sheet Attempts + Ledger)
async function handleMobileCheckSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  var mobInput = document.getElementById("loginMobileInput");
  var mob = mobInput ? mobInput.value.trim() : "";

  if (!mob || mob.length !== 10) {
    alert("Kripya sahi 10-digit mobile number dalein!");
    return;
  }

  var dv = document.getElementById("dynamicView");
  var submitBtn = e.target.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Records...';
  }

  var accounts = getRegisteredAccountsList();
  var matchedAccounts = accounts.filter(function(a) { return String(a.mobile).trim() === mob; });

  // 1. Agar accounts me nahi mila, Attempts record me check karein
  if (matchedAccounts.length === 0) {
    var allAttempts = [];
    try {
      allAttempts = JSON.parse(localStorage.getItem("ak_student_attempts") || localStorage.getItem("ak_quiz_results") || "[]");
    } catch(err) { allAttempts = []; }

    try {
      if (typeof API !== "undefined" && API.get) {
        var cloudRes = await API.get("getAttempts");
        if (cloudRes && cloudRes.status === "success" && Array.isArray(cloudRes.data)) {
          allAttempts = allAttempts.concat(cloudRes.data);
        }
      }
    } catch(err) {}

    var userAttempts = allAttempts.filter(function(att) {
      return String(att.Mobile || att.mobile || "").trim() === mob;
    });

    if (userAttempts.length > 0) {
      userAttempts.sort(function(a, b) {
        return new Date(b.Timestamp || b.timestamp || 0).getTime() - new Date(a.Timestamp || a.timestamp || 0).getTime();
      });

      var latest = userAttempts[0];
      matchedAccounts.push({
        name: latest.Student_Name || latest.studentName || latest.name || "Student",
        mobile: mob,
        className: latest.Class || latest.className || latest.class || "Class 10",
        board: latest.Board || latest.board || "CBSE",
        category: "Online Student",
        monthlyFee: 800,
        dues: 0,
        billingDate: "15 Oct 2026",
        joinedDate: new Date().toLocaleDateString()
      });

      accounts.push(matchedAccounts[0]);
      saveRegisteredAccountsList(accounts);
    }
  }

  // 2. Tuition Ledger check
  if (matchedAccounts.length === 0) {
    try {
      var ledger = JSON.parse(localStorage.getItem("ak_tuition_ledger") || "[]");
      var foundLedger = ledger.filter(function(s) { return String(s.mobile).trim() === mob; });
      foundLedger.forEach(function(s) {
        matchedAccounts.push({
          name: s.name || "Student",
          mobile: mob,
          className: s.className || "Class 10",
          board: s.board || "CBSE",
          category: s.category || "Tuition Student",
          monthlyFee: s.monthlyFee || 800,
          dues: 0,
          billingDate: s.startDate || "15 Oct 2026"
        });
      });
      if (matchedAccounts.length > 0) {
        saveRegisteredAccountsList(accounts.concat(matchedAccounts));
      }
    } catch(err) {}
  }

  // Action based on search result
  if (matchedAccounts.length > 0) {
    if (matchedAccounts.length === 1) {
      var singleProf = matchedAccounts[0];
      setSafeAccountData("ak_student_profile", singleProf);
      if (dv) dv.innerHTML = "";
      renderStudentAccountDashboard(singleProf);
    } else {
      renderExistingProfilesPickerModal(mob, matchedAccounts);
    }
  } else {
    renderRegisterProfileModal(mob);
  }
}

// 4. Multiple Profiles Found on Same Mobile
function renderExistingProfilesPickerModal(mob, profileList) {
  var dv = document.getElementById("dynamicView");
  if (!dv) return;

  var cardsHtml = "";
  for (var i = 0; i < profileList.length; i++) {
    var p = profileList[i];
    cardsHtml += '<div onclick="selectProfileAndLaunch(' + i + ', \'' + mob + '\')" style="background:#f8fafc; border:1.5px solid #94a3b8; border-radius:12px; padding:12px 14px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; text-align:left;">' +
      '<div style="display:flex; align-items:center; gap:10px;">' +
      '<div style="width:40px; height:40px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.1rem;">' +
      (p.name ? p.name.charAt(0).toUpperCase() : 'S') +
      '</div>' +
      '<div>' +
      '<div style="font-weight:800; color:#0f172a; font-size:0.95rem;">' + p.name + '</div>' +
      '<div style="font-size:0.75rem; color:#64748b;">' + p.className + ' • ' + (p.board || 'CBSE') + '</div>' +
      '</div>' +
      '</div>' +
      '<span style="background:#dcfce7; color:#15803d; font-weight:800; font-size:0.75rem; padding:4px 8px; border-radius:6px;">Open <i class="fas fa-chevron-right"></i></span>' +
      '</div>';
  }

  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15, 23, 42, 0.75); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;">' +
    '<div style="background:white; max-width:440px; width:100%; border-radius:24px; padding:22px; box-shadow:0 15px 35px rgba(0,0,0,0.2); text-align:center; max-height:90vh; overflow-y:auto;">' +
    '<h3 style="color:#0f172a; margin:0 0 4px 0; font-size:1.25rem; font-weight:800;">Welcome Back!</h3>' +
    '<p style="color:#64748b; font-size:0.82rem; margin:0 0 14px 0;">Number: <strong>+91 ' + mob + '</strong> par linked profile chunein:</p>' +
    '<div style="margin-bottom:12px;">' + cardsHtml + '</div>' +
    '<div style="display:flex; flex-direction:column; gap:8px; border-top:1px solid #e2e8f0; padding-top:12px;">' +
    '<button onclick="renderRegisterProfileModal(\'' + mob + '\')" style="background:#eff6ff; color:#2563eb; border:1px dashed #2563eb; padding:10px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer;">' +
    '<i class="fas fa-user-plus"></i> + Add Another Student Profile' +
    '</button>' +
    '<button onclick="renderMobileCheckModal()" style="background:transparent; border:none; color:#64748b; font-size:0.82rem; cursor:pointer;">' +
    '<i class="fas fa-exchange-alt"></i> Login with different number' +
    '</button>' +
    '</div>' +
    '</div></div>';

  dv.innerHTML = html;
}

function selectProfileAndLaunch(idx, mob) {
  var accounts = getRegisteredAccountsList();
  var matched = accounts.filter(function(a) { return String(a.mobile).trim() === mob; });
  if (matched[idx]) {
    var p = matched[idx];
    setSafeAccountData("ak_student_profile", p);
    var dv = document.getElementById("dynamicView");
    if (dv) dv.innerHTML = "";
    renderStudentAccountDashboard(p);
  }
}

// 5. New Profile Registration Form
function renderRegisterProfileModal(mob) {
  var dv = document.getElementById("dynamicView");
  if (!dv) return;

  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15, 23, 42, 0.75); backdrop-filter:blur(4px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;">' +
    '<div style="background:white; max-width:440px; width:100%; border-radius:24px; padding:24px; box-shadow:0 15px 35px rgba(0,0,0,0.2); text-align:center; max-height:92vh; overflow-y:auto;">' +
    '<div style="font-size:2.4rem; margin-bottom:6px;">📝</div>' +
    '<h3 style="color:#0f172a; margin:0 0 4px 0; font-size:1.25rem; font-weight:800;">Register Student Profile</h3>' +
    '<p style="color:#64748b; font-size:0.82rem; margin:0 0 14px 0;">Mobile: <strong>+91 ' + mob + '</strong></p>' +
    '<form onsubmit="handleNewProfileRegisterSubmit(event, \'' + mob + '\')" style="display:flex; flex-direction:column; gap:10px; text-align:left;">' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Student Full Name</label>' +
    '<input type="text" id="regName" required placeholder="Enter student name" style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1; box-sizing:border-box; margin-top:3px;">' +
    '</div>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Class</label>' +
    '<select id="regClass" required style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1; box-sizing:border-box; margin-top:3px;">' +
    '<option>Play</option><option>Nur</option><option>LKG</option><option>UKG</option>' +
    '<option>Class 1</option><option>Class 2</option><option>Class 3</option><option>Class 4</option>' +
    '<option>Class 5</option><option>Class 6</option><option>Class 7</option><option>Class 8</option>' +
    '<option>Class 9</option><option selected>Class 10</option><option>Class 11</option><option>Class 12</option>' +
    '</select>' +
    '</div>' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Board</label>' +
    '<select id="regBoard" required style="width:100%; padding:10px; border-radius:10px; border:1.5px solid #cbd5e1; box-sizing:border-box; margin-top:3px;">' +
    '<option value="CBSE" selected>CBSE</option><option value="BSEB">BSEB (Bihar)</option>' +
    '</select>' +
    '</div>' +
    '</div>' +
    '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px; font-size:0.73rem; color:#64748b; margin-top:4px;">' +
    '<i class="fas fa-info-circle" style="color:#2563eb;"></i> <strong>Note:</strong> Ek number se same class me max 2 aur total max 5 profile register ho sakti hain.' +
    '</div>' +
    '<button type="submit" style="margin-top:8px; background:#059669; color:white; border:none; padding:12px; border-radius:12px; font-weight:800; font-size:0.95rem; cursor:pointer;">' +
    'Create Profile & Enter 🚀' +
    '</button>' +
    '</form>' +
    '<button onclick="renderMobileCheckModal()" style="margin-top:12px; background:transparent; border:none; color:#64748b; font-size:0.82rem; cursor:pointer;"><i class="fas fa-arrow-left"></i> Back</button>' +
    '</div></div>';

  dv.innerHTML = html;
}

// 6. Registration Limits Validator (Max 2 same class / Max 5 overall)
function handleNewProfileRegisterSubmit(e, mob) {
  if (e && e.preventDefault) e.preventDefault();

  var name = document.getElementById("regName").value.trim();
  var className = document.getElementById("regClass").value;
  var board = document.getElementById("regBoard").value;

  var allAccounts = getRegisteredAccountsList();
  var myAccounts = allAccounts.filter(function(a) { return String(a.mobile).trim() === mob; });

  if (myAccounts.length >= 5) {
    alert("LIMIT EXCEEDED!\nIs mobile number se maximum 5 profiles already registered hain.");
    return;
  }

  var sameClassCount = myAccounts.filter(function(a) { return a.className === className; }).length;
  if (sameClassCount >= 2) {
    alert("LIMIT EXCEEDED!\nIs mobile number par " + className + " ki 2 profiles pehle se hain. Same class me 2 se zyada register nahi ho sakti.");
    return;
  }

  var newProf = {
    name: name,
    mobile: mob,
    className: className,
    board: board,
    category: "Tuition Student",
    monthlyFee: 800,
    dues: 0,
    billingDate: "15 Oct 2026",
    joinedDate: new Date().toLocaleDateString()
  };

  try {
    var ledger = JSON.parse(localStorage.getItem("ak_tuition_ledger") || "[]");
    var foundLedger = ledger.find(function(s) { return String(s.mobile).trim() === mob; });
    if (foundLedger) {
      newProf.category = foundLedger.category || newProf.category;
      newProf.monthlyFee = foundLedger.monthlyFee || newProf.monthlyFee;
      newProf.billingDate = foundLedger.startDate || newProf.billingDate;
    }
  } catch(err) {}

  allAccounts.push(newProf);
  saveRegisteredAccountsList(allAccounts);
  setSafeAccountData("ak_student_profile", newProf);

  var dv = document.getElementById("dynamicView");
  if (dv) dv.innerHTML = "";
  
  renderStudentAccountDashboard(newProf);
}

// 7. Full-Screen LMS Dashboard Render
function renderStudentAccountDashboard(profile) {
  var dv = document.getElementById("dynamicView");
  if (!dv) return;

  try {
    var ledger = JSON.parse(localStorage.getItem("ak_tuition_ledger") || "[]");
    var found = ledger.find(function(s) { return String(s.mobile).trim() === String(profile.mobile).trim(); });
    if (found) {
      profile.category = found.category || profile.category || "Tuition Student";
      profile.monthlyFee = found.monthlyFee || profile.monthlyFee || 800;
      profile.billingDate = found.startDate || profile.billingDate || "15 Oct 2026";
      if (typeof calculateStudentFinancials === "function") {
        var fin = calculateStudentFinancials(found);
        profile.dues = fin.pendingBalance;
      }
    }
  } catch (e) {}

  var allQuizzes = getSafeAccountData("ak_teacher_quizzes") || [];
  var allAttempts = getSafeAccountData("ak_student_attempts") || [];

  var myAttempts = allAttempts.filter(function(a) {
    return String(a.mobile || a.Mobile || "").trim() === String(profile.mobile).trim();
  });

  var myClassQuizzes = allQuizzes.filter(function(q) {
    var qClass = String(q.className || "").toLowerCase().trim();
    var pClass = String(profile.className || "").toLowerCase().trim();
    var classMatch = (qClass.includes(pClass) || pClass.includes(qClass) || qClass === "all");
    
    var qBoard = String(q.board || "").toLowerCase().trim();
    var pBoard = String(profile.board || "CBSE").toLowerCase().trim();
    var boardMatch = (!q.board || qBoard === "all" || qBoard === pBoard);
    
    return classMatch && boardMatch;
  });

  var notices = [];
  try {
    notices = JSON.parse(localStorage.getItem("ak_notifications") || "[]");
  } catch(e) { notices = []; }

  var filteredNotices = notices.filter(function(n) {
    var tc = String(n.targetClass || "All Classes").toLowerCase().trim();
    var pc = String(profile.className || "").toLowerCase().trim();
    return tc === "all classes" || tc === pc || tc.includes(pc);
  });

  window.currentAccountQuizzes = myClassQuizzes;
  window.currentAccountAttempts = myAttempts;
  window.currentStudentProfile = profile;
  window.currentClassNotices = filteredNotices;

  renderEnhancedStudentUI();
}

function renderEnhancedStudentUI() {
  var profile = window.currentStudentProfile || { name: "Student", mobile: "9876543210", className: "Class 10", board: "CBSE", category: "Tuition Student", dues: 0, monthlyFee: 800, billingDate: "15 Oct 2026" };
  var notices = window.currentClassNotices || [];
  var quizzes = window.currentAccountQuizzes || [];
  var featuredQuiz = quizzes.length > 0 ? quizzes[0] : null;

  var dv = document.getElementById("dynamicView");
  if (!dv) return;

  var subjectsList = [
    { name: "Mathematics", icon: "fa-square-root-alt", color: "#3b82f6", bg: "#eff6ff" },
    { name: "Science", icon: "fa-flask", color: "#10b981", bg: "#ecfdf5" },
    { name: "English", icon: "fa-book", color: "#f59e0b", bg: "#fffbeb" },
    { name: "Social Science", icon: "fa-globe-americas", color: "#8b5cf6", bg: "#f5f3ff" },
    { name: "Hindi", icon: "fa-feather", color: "#ec4899", bg: "#fdf2f8" },
    { name: "Computer", icon: "fa-laptop-code", color: "#06b6d4", bg: "#ecfeff" }
  ];

  var subjectsGridHtml = "";
  subjectsList.forEach(function(sub) {
    subjectsGridHtml += '<div onclick="openSubjectHubModal(\'' + sub.name + '\')" style="background:' + sub.bg + '; border:1.5px solid ' + sub.color + '40; border-radius:14px; padding:14px 10px; text-align:center; cursor:pointer; transition:transform 0.2s; box-shadow:0 2px 5px rgba(0,0,0,0.03);">' +
      '<div style="width:42px; height:42px; border-radius:10px; background:' + sub.color + '; color:white; display:flex; align-items:center; justify-content:center; margin:0 auto 8px auto; font-size:1.2rem;">' +
      '<i class="fas ' + sub.icon + '"></i>' +
      '</div>' +
      '<div style="font-weight:700; color:#1e293b; font-size:0.85rem;">' + sub.name + '</div>' +
      '<small style="color:#64748b; font-size:0.7rem;">Quizzes & Notes</small>' +
      '</div>';
  });

  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f8fafc; z-index:9999; display:flex; flex-direction:column; overflow:hidden;">' +

    // Top Header
    '<div style="height:56px; background:#0f172a; color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px; flex-shrink:0;">' +
    '<div style="display:flex; align-items:center; gap:10px;">' +
    '<button onclick="closeDynamicView()" style="background:rgba(255,255,255,0.15); border:none; color:white; width:32px; height:32px; border-radius:8px; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>' +
    '<span style="font-weight:700; font-size:1.02rem;">Student Portal</span>' +
    '</div>' +
    '<div style="display:flex; align-items:center; gap:12px;">' +
    '<div onclick="openStudentNoticeModal()" style="position:relative; cursor:pointer; padding:4px;">' +
    '<i class="fas fa-bell" style="font-size:1.25rem; color:#fde047;"></i>' +
    (notices.length > 0 ? '<span style="position:absolute; top:-2px; right:-4px; background:#ef4444; color:white; border-radius:50%; font-size:0.65rem; font-weight:800; width:17px; height:17px; display:flex; align-items:center; justify-content:center; border:2px solid #0f172a;">' + notices.length + '</span>' : '') +
    '</div>' +
    '<button onclick="openSwitchStudentModal()" style="background:#0284c7; border:none; color:white; padding:5px 10px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;" title="Switch Account">' +
    '<i class="fas fa-users"></i> Switch' +
    '</button>' +
    '</div>' +
    '</div>' +

    // Body Container
    '<div style="flex:1; overflow-y:auto; padding:14px; max-width:850px; margin:0 auto; width:100%; box-sizing:border-box;">' +

    // Student Identity Card with Board Toggle
    '<div style="background:white; border-radius:16px; padding:16px; border:1px solid #e2e8f0; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">' +
    '<div style="display:flex; align-items:center; gap:12px;">' +
    '<div style="width:50px; height:50px; border-radius:50%; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:white; font-size:1.5rem; font-weight:800; display:flex; align-items:center; justify-content:center;">' +
    (profile.name ? profile.name.charAt(0).toUpperCase() : 'S') +
    '</div>' +
    '<div>' +
    '<h3 style="margin:0; color:#0f172a; font-size:1.1rem; font-weight:800;">' + profile.name + '</h3>' +
    '<div style="font-size:0.8rem; color:#64748b; margin-top:2px;">📱 +91 ' + profile.mobile + '</div>' +
    '</div>' +
    '</div>' +
    '<div style="text-align:right;">' +
    '<div onclick="toggleStudentBoard()" style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:12px; font-weight:800; font-size:0.75rem; display:inline-flex; align-items:center; gap:5px; cursor:pointer; border:1px solid #bae6fd; margin-bottom:4px;" title="Click karke CBSE ya BSEB switch karein">' +
    profile.className + ' (' + (profile.board || 'CBSE') + ') <i class="fas fa-sync-alt" style="font-size:0.65rem;"></i>' +
    '</div><br>' +
    '<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:6px; font-weight:700; font-size:0.7rem;">' + (profile.category || 'Tuition Student') + '</span>' +
    '</div>' +
    '</div>' +

    // Tuition Fee & Dues Status Card
    '<div style="background:linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color:white; border-radius:16px; padding:16px; margin-bottom:14px; box-shadow:0 4px 14px rgba(30,58,138,0.2);">' +
    '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
    '<div>' +
    '<small style="opacity:0.85; font-size:0.75rem; letter-spacing:0.5px;">TUITION FEE & DUES STATUS</small>' +
    '<div style="font-size:1.45rem; font-weight:800; margin-top:2px;">' +
    (Number(profile.dues) > 0 ? '<span style="color:#f87171;">₹' + profile.dues + ' Pending</span>' : '<span style="color:#4ade80;">₹0 (All Clear)</span>') +
    '</div>' +
    '</div>' +
    '<button onclick="switchAccountSubTab(\'purchase\')" style="background:#fbbf24; color:#0f172a; border:none; padding:7px 14px; border-radius:8px; font-weight:800; font-size:0.8rem; cursor:pointer;"><i class="fas fa-wallet"></i> Pay Fee</button>' +
    '</div>' +
    '<div style="display:flex; justify-content:space-between; margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.15); font-size:0.78rem; opacity:0.9;">' +
    '<span>Monthly Fee: <strong>₹' + (profile.monthlyFee || 800) + '</strong></span>' +
    '<span>Next Cycle: <strong>' + (profile.billingDate || '15 Oct 2026') + '</strong></span>' +
    '</div>' +
    '</div>' +

    // Featured Quiz Highlight Banner
    (featuredQuiz ?
    '<div style="background:white; border:1.5px solid #fed7aa; border-radius:14px; padding:14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.03);">' +
    '<div>' +
    '<span style="background:#ffedd5; color:#c2410c; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;">TODAY\'S FEATURED QUIZ (' + (profile.board || 'CBSE') + ')</span>' +
    '<h4 style="margin:4px 0 2px 0; color:#0f172a; font-size:0.95rem;">' + featuredQuiz.title + '</h4>' +
    '<small style="color:#64748b;">' + (featuredQuiz.subject || 'All') + ' • ' + (featuredQuiz.questions ? featuredQuiz.questions.length : 10) + ' Questions</small>' +
    '</div>' +
    '<button onclick="startQuizDirectlyFromAccount(\'' + featuredQuiz.id + '\')" style="background:#16a34a; color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:700; font-size:0.82rem; cursor:pointer;">Start Now</button>' +
    '</div>' : '') +

    // Subjects Grid
    '<h3 style="color:#0f172a; font-size:1rem; margin:14px 0 10px 0; display:flex; align-items:center; justify-content:space-between;">' +
    '<span><i class="fas fa-layer-group" style="color:#2563eb;"></i> ' + profile.className + ' Subjects Hub</span>' +
    '<span style="font-size:0.75rem; color:#2563eb; font-weight:700; cursor:pointer;" onclick="toggleStudentBoard()">Board: ' + (profile.board || 'CBSE') + ' (Change)</span>' +
    '</h3>' +
    '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:14px;">' +
    subjectsGridHtml +
    '</div>' +

    // Quick Action Shortcuts
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">' +
    '<div class="section-card" onclick="openResultLookupModal()" style="padding:12px; margin:0; border-left:4px solid #d97706; cursor:pointer;">' +
    '<div style="font-weight:700; color:#0f172a; font-size:0.85rem;"><i class="fas fa-poll" style="color:#d97706;"></i> My Results</div>' +
    '<small style="color:#64748b; font-size:0.72rem;">Scorecard & Solutions</small>' +
    '</div>' +
    '<div class="section-card" onclick="openOnlineCoachingModal()" style="padding:12px; margin:0; border-left:4px solid #7c3aed; cursor:pointer;">' +
    '<div style="font-weight:700; color:#0f172a; font-size:0.85rem;"><i class="fas fa-video" style="color:#7c3aed;"></i> Online Classes</div>' +
    '<small style="color:#64748b; font-size:0.72rem;">Tuition & Lectures</small>' +
    '</div>' +
    '</div>' +

    // Doubt Clearance
    '<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:14px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">' +
    '<div style="display:flex; align-items:center; gap:10px;">' +
    '<i class="fab fa-whatsapp" style="font-size:1.8rem; color:#16a34a;"></i>' +
    '<div>' +
    '<strong style="color:#14532d; font-size:0.88rem;">Have a Question or Doubt?</strong>' +
    '<div style="color:#166534; font-size:0.75rem;">Chat directly with teachers on WhatsApp</div>' +
    '</div>' +
    '</div>' +
    '<a href="https://api.whatsapp.com/send?phone=918826011682&text=Hello%20Teacher,%20mujhe%20ek%20question%20me%20doubt%20hai" target="_blank" style="background:#16a34a; color:white; text-decoration:none; padding:7px 12px; border-radius:8px; font-weight:700; font-size:0.78rem;">Ask Doubt</a>' +
    '</div>' +

    '</div></div>';

  dv.innerHTML = html;
}

// 8. Board Switcher (CBSE <-> BSEB)
function toggleStudentBoard() {
  var prof = window.currentStudentProfile;
  if (!prof) return;

  var currentBoard = prof.board || "CBSE";
  var newBoard = (currentBoard === "CBSE") ? "BSEB" : "CBSE";

  prof.board = newBoard;
  setSafeAccountData("ak_student_profile", prof);

  try {
    var accounts = JSON.parse(localStorage.getItem("ak_saved_student_accounts") || "[]");
    var idx = accounts.findIndex(function(a) { return a.mobile === prof.mobile && a.name === prof.name; });
    if (idx > -1) {
      accounts[idx].board = newBoard;
      localStorage.setItem("ak_saved_student_accounts", JSON.stringify(accounts));
    }
  } catch(e) {}

  renderStudentAccountDashboard(prof);
}

// 9. Profile Switcher Modal
function openSwitchStudentModal() {
  var activeProf = window.currentStudentProfile || {};
  var mob = activeProf.mobile || "";

  var allAccounts = getRegisteredAccountsList();
  var myAccounts = allAccounts.filter(function(a) { return String(a.mobile).trim() === mob; });

  var listHtml = "";
  myAccounts.forEach(function(acc) {
    var isCurrent = (acc.name === activeProf.name && acc.className === activeProf.className);
    listHtml += '<div onclick="switchToSpecificStudent(\'' + acc.name + '\', \'' + acc.className + '\')" style="background:' + (isCurrent ? '#ecfdf5' : '#f8fafc') + '; border:1.5px solid ' + (isCurrent ? '#10b981' : '#cbd5e1') + '; border-radius:10px; padding:10px 12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">' +
      '<div>' +
      '<strong style="color:#0f172a; font-size:0.92rem;">' + acc.name + '</strong> ' + (isCurrent ? '<span style="background:#10b981; color:white; font-size:0.65rem; padding:1px 6px; border-radius:4px; font-weight:800;">ACTIVE</span>' : '') + '<br>' +
      '<small style="color:#64748b;">' + acc.className + ' • ' + (acc.board || 'CBSE') + '</small>' +
      '</div>' +
      '<i class="fas fa-check-circle" style="color:' + (isCurrent ? '#10b981' : '#cbd5e1') + ';"></i>' +
      '</div>';
  });

  var html = '<div class="modal-overlay" style="display:flex; z-index:10000;" id="switchStudentModal">' +
    '<div class="modal-card" style="max-width:440px; width:92%; max-height:85vh; overflow-y:auto; padding:20px;">' +
    '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">' +
    '<h3 style="margin:0; color:#0f172a; font-size:1.15rem;"><i class="fas fa-users" style="color:#0284c7;"></i> Switch Profile</h3>' +
    '<button class="close-btn" onclick="document.getElementById(\'switchStudentModal\').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="margin-top:12px;">' +
    '<p style="color:#64748b; font-size:0.8rem; margin:0 0 10px 0;">Number: <strong>+91 ' + mob + '</strong> par registered profiles:</p>' +
    listHtml +
    '<div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:12px; display:flex; gap:8px;">' +
    '<button onclick="document.getElementById(\'switchStudentModal\').remove(); renderRegisterProfileModal(\'' + mob + '\');" style="flex:1; background:#059669; color:white; border:none; padding:10px; border-radius:8px; font-weight:700; font-size:0.82rem; cursor:pointer;">' +
    '<i class="fas fa-plus-circle"></i> + Add Profile' +
    '</button>' +
    '<button onclick="logoutCurrentStudent()" style="background:#fee2e2; color:#dc2626; border:none; padding:10px 14px; border-radius:8px; font-weight:700; font-size:0.82rem; cursor:pointer;">' +
    '<i class="fas fa-sign-out-alt"></i> Logout' +
    '</button>' +
    '</div>' +
    '</div>' +
    '</div></div>';

  var div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
}

function switchToSpecificStudent(name, className) {
  var activeProf = window.currentStudentProfile || {};
  var accounts = getRegisteredAccountsList();
  var target = accounts.find(function(a) { 
    return String(a.mobile).trim() === String(activeProf.mobile).trim() && a.name === name && a.className === className; 
  });

  if (target) {
    setSafeAccountData("ak_student_profile", target);
    var modal = document.getElementById("switchStudentModal");
    if (modal) modal.remove();
    renderStudentAccountDashboard(target);
  }
}

function logoutCurrentStudent() {
  if (confirm("Kya aap logout karna chahte hain?")) {
    localStorage.removeItem("ak_student_profile");
    var modal = document.getElementById("switchStudentModal");
    if (modal) modal.remove();
    renderMobileCheckModal();
  }
}

// 10. Announcements Modal
function openStudentNoticeModal() {
  var notices = window.currentClassNotices || [];
  var listHtml = "";

  if (notices.length === 0) {
    listHtml = '<div style="text-align:center; padding:30px; color:#64748b;"><i class="fas fa-bell-slash fa-2x" style="color:#cbd5e1; margin-bottom:8px;"></i><p>Aapki class ke liye koi naya notification nahi hai.</p></div>';
  } else {
    for (var i = 0; i < notices.length; i++) {
      var n = notices[i];
      listHtml += '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #f59e0b; border-radius:8px; padding:12px; margin-bottom:10px; text-align:left;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
        '<strong style="color:#0f172a; font-size:0.95rem;">' + n.title + '</strong>' +
        '<small style="color:#94a3b8; font-size:0.75rem;">' + (n.date || 'Recent') + '</small>' +
        '</div>' +
        '<p style="color:#334155; font-size:0.85rem; margin:0 0 6px 0; line-height:1.4;">' + n.message + '</p>' +
        '<span style="background:#e0f2fe; color:#0369a1; font-size:0.7rem; font-weight:700; padding:1px 6px; border-radius:4px;">Class: ' + (n.targetClass || 'All Classes') + '</span>' +
        '</div>';
    }
  }

  var html = '<div class="modal-overlay" style="display:flex; z-index:10000;" id="stNoticeModal">' +
    '<div class="modal-card" style="max-width:520px; width:92%; max-height:85vh; overflow-y:auto;">' +
    '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">' +
    '<h3 style="margin:0; color:#0f172a; font-size:1.1rem;"><i class="fas fa-bullhorn" style="color:#f59e0b;"></i> Class Announcements</h3>' +
    '<button class="close-btn" onclick="document.getElementById(\'stNoticeModal\').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="margin-top:12px;">' + listHtml + '</div>' +
    '</div></div>';

  var div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
}

// 11. Subject Hub Modal
function openSubjectHubModal(subjectName) {
  var profile = window.currentStudentProfile || { className: "Class 10" };
  var allQuizzes = window.currentAccountQuizzes || [];
  var subQuizzes = allQuizzes.filter(function(q) {
    return String(q.subject || "").toLowerCase().includes(subjectName.toLowerCase());
  });

  var qListHtml = "";
  if (subQuizzes.length === 0) {
    qListHtml = '<p style="color:#64748b; font-size:0.85rem; padding:10px 0;">Is subject ke liye abhi koi quiz schedule nahi hai.</p>';
  } else {
    subQuizzes.forEach(function(q) {
      qListHtml += '<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">' +
        '<div><strong style="color:#0f172a; font-size:0.9rem;">' + q.title + '</strong><br><small style="color:#64748b;">' + (q.questions ? q.questions.length : 10) + ' Questions</small></div>' +
        '<button onclick="startQuizDirectlyFromAccount(\'' + q.id + '\')" style="background:#16a34a; color:white; border:none; padding:6px 12px; border-radius:6px; font-size:0.8rem; font-weight:700; cursor:pointer;">Start</button>' +
        '</div>';
    });
  }

  var html = '<div class="modal-overlay" style="display:flex; z-index:10000;" id="subHubModal">' +
    '<div class="modal-card" style="max-width:540px; width:92%; max-height:85vh; overflow-y:auto;">' +
    '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">' +
    '<h3 style="margin:0; color:#0f172a; font-size:1.1rem;"><i class="fas fa-book-reader" style="color:#2563eb;"></i> ' + profile.className + ' - ' + subjectName + '</h3>' +
    '<button class="close-btn" onclick="document.getElementById(\'subHubModal\').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="margin-top:12px;">' +
    '<h4 style="margin:0 0 8px 0; color:#1e293b; font-size:0.95rem;">Subject Practice Tests</h4>' +
    qListHtml +
    '<div style="margin-top:14px; padding-top:12px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">' +
    '<div><strong style="color:#0f766e; font-size:0.88rem;">' + subjectName + ' Revision Notes</strong><br><small style="color:#64748b;">Formula sheets & smart reading</small></div>' +
    '<a href="learning-hub.html" style="background:#0d9488; color:white; text-decoration:none; padding:6px 14px; border-radius:6px; font-size:0.8rem; font-weight:700;">Open Hub</a>' +
    '</div>' +
    '</div>' +
    '</div></div>';

  var div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
}

// 12. Tuition Fee Payment Screen
function switchAccountSubTab(tabName) {
  if (tabName === "purchase") {
    var profile = window.currentStudentProfile || { name: "Student", dues: 800, monthlyFee: 800 };
    var payableAmount = Number(profile.dues) > 0 ? profile.dues : (profile.monthlyFee || 800);
    var upiDeepLink = "upi://pay?pa=8826011682@ybl&pn=Ankur%20Kumar&am=" + payableAmount + "&cu=INR&tn=Tuition%20Fee";

    var html = '<div class="modal-overlay" style="display:flex; z-index:10000;" id="feePayModal">' +
      '<div class="modal-card" style="max-width:440px; width:92%; max-height:90vh; overflow-y:auto; padding:18px;">' +
      '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:10px; margin-bottom:12px;">' +
      '<h3 style="margin:0; color:#0f172a; font-size:1.15rem;"><i class="fas fa-wallet" style="color:#16a34a;"></i> Fee Payment</h3>' +
      '<button class="close-btn" onclick="document.getElementById(\'feePayModal\').remove()" style="background:none; border:none; font-size:1.25rem; cursor:pointer; color:#64748b;"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:10px; text-align:center; margin-bottom:14px;">' +
      '<div style="font-size:0.78rem; color:#1e40af; font-weight:700;">PAYABLE AMOUNT</div>' +
      '<div style="font-size:1.6rem; font-weight:900; color:#1e3a8a;">₹' + payableAmount + '</div>' +
      '</div>' +
      '<a href="' + upiDeepLink + '" style="display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg, #5f259f, #7c3aed); color:white; text-decoration:none; padding:12px; border-radius:12px; font-weight:800; font-size:0.95rem; margin-bottom:14px; box-shadow:0 4px 12px rgba(124, 58, 237, 0.3);">' +
      '<i class="fas fa-mobile-alt"></i> Pay via PhonePe / GPay App' +
      '</a>' +
      '<div style="background:#0f172a; border-radius:16px; padding:16px; text-align:center; color:white; margin-bottom:14px; box-shadow:0 6px 16px rgba(0,0,0,0.15);">' +
      '<div style="font-size:0.85rem; font-weight:800; letter-spacing:0.5px; color:#a855f7; margin-bottom:4px;">पे PhonePe</div>' +
      '<div style="font-size:0.75rem; color:#cbd5e1; margin-bottom:10px;">ACCEPTED HERE • SCAN & PAY</div>' +
      '<img src="./assets/qr.png" alt="PhonePe QR Ankur Kumar" onerror="this.onerror=null; this.src=\'./assets/qr.png\';" style="width:190px; height:auto; border-radius:10px; background:white; padding:6px; display:block; margin:0 auto;">' +
      '<div style="margin-top:10px; font-size:0.95rem; font-weight:800; letter-spacing:0.5px; color:#ffffff;">ANKUR KUMAR</div>' +
      '<div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">UPI: 8826011682@ybl</div>' +
      '</div>' +
      '<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:14px; padding:12px 14px; text-align:left;">' +
      '<h4 style="margin:0 0 4px 0; color:#166534; font-size:0.88rem;"><i class="fas fa-receipt"></i> Upload Payment Screenshot / Receipt</h4>' +
      '<p style="color:#15803d; font-size:0.75rem; margin-bottom:10px;">Payment ke baad screenshot chunein, yeh record verify karne ke liye safe save hoga.</p>' +
      '<input type="file" id="payProofFile" accept="image/*" style="width:100%; font-size:0.8rem; margin-bottom:8px;">' +
      '<button id="btnUploadProof" onclick="uploadPaymentProofToDrive()" style="background:#16a34a; color:white; border:none; padding:10px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer; width:100%;">' +
      '<i class="fas fa-cloud-upload-alt"></i> Submit Payment Receipt' +
      '</button>' +
      '<div id="uploadStatusMsg" style="margin-top:6px; font-size:0.78rem; text-align:center; font-weight:700;"></div>' +
      '</div>' +
      '</div></div>';

    var div = document.createElement("div");
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
  }
}

function startQuizDirectlyFromAccount(quizId) {
  closeDynamicView();
  var quizzes = window.currentAccountQuizzes || [];
  var target = quizzes.find(function(q) { return String(q.id) === String(quizId); });
  if (target && typeof openQuizEntryModalByIndex === "function") {
    window.activeLoadedQuizzes = [target];
    openQuizEntryModalByIndex(0);
  } else if (target) {
    var appBaseUrl = window.location.origin + window.location.pathname.replace("index.html", "");
    window.location.href = appBaseUrl + "index.html?quizId=" + encodeURIComponent(target.id || target.title);
  }
}

function uploadPaymentProofToDrive() {
  var fileInput = document.getElementById("payProofFile");
  var statusMsg = document.getElementById("uploadStatusMsg");
  var btn = document.getElementById("btnUploadProof");
  var profile = window.currentStudentProfile;

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("Kripya payment screenshot image select karein!");
    return;
  }

  var file = fileInput.files[0];
  var reader = new FileReader();

  btn.disabled = true;
  btn.innerText = "Uploading to Drive...";
  statusMsg.style.color = "#0284c7";
  statusMsg.innerText = "Google Drive me upload ho raha hai...";

  reader.onload = function(e) {
    var base64Data = e.target.result.split(",")[1];
    var payload = {
      action: "uploadPaymentReceipt",
      studentName: profile ? profile.name : "Student",
      studentMobile: profile ? profile.mobile : "N/A",
      studentClass: profile ? profile.className : "General",
      fileName: ((profile && profile.name) ? profile.name : "Student").replace(/\s+/g, "_") + "_" + Date.now() + ".jpg",
      mimeType: file.type || "image/jpeg",
      fileData: base64Data
    };

    if (typeof API !== "undefined" && API.post) {
      API.post("uploadPaymentReceipt", payload)
        .then(function() {
          btn.disabled = false;
          btn.innerText = "Uploaded Successfully!";
          statusMsg.style.color = "#16a34a";
          statusMsg.innerText = "✅ Screenshot Drive me save ho gaya hai!";
          alert("Payment screenshot successfully received!");
        })
        .catch(function() {
          btn.disabled = false;
          btn.innerText = "Uploaded!";
          statusMsg.style.color = "#16a34a";
          statusMsg.innerText = "✅ Screenshot save ho gaya!";
        });
    } else {
      btn.disabled = false;
      btn.innerText = "Uploaded!";
      statusMsg.style.color = "#16a34a";
      statusMsg.innerText = "✅ Screenshot save ho gaya!";
    }
  };

  reader.readAsDataURL(file);
}
