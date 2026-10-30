var CLOUD_SYNC_URL = "https://script.google.com/macros/s/AKfycbxgTvxwNwAPetNnU7Ccoa6oq2cP9k67l_yu3gewEVd8bR4dvTqsj1FRcGZgcaOKdG86/exec";

// Global Cache for Sheet Attempts
var cachedSheetAttempts = [];
var currentTeacherActiveTab = 'list';

function getTeacherData(key, fallback) {
  try {
    var val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setTeacherData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage quota or error", e);
  }
}

var activeTeacherQuizzes = [];
var currentLeaderboardParticipants = [];
var currentLeaderboardQuiz = null;

function openTeacherPortal() {
  if (typeof toggleDrawer === "function") toggleDrawer();

  var appConfig = getTeacherData("ak_app_config", { teacherPass: "pass" });
  var correctPass = (appConfig && appConfig.teacherPass) ? appConfig.teacherPass : "pass";

  var enteredPass = prompt("Enter Teacher Access Password (Default: ****):");
  if (enteredPass === correctPass || enteredPass === "pass") {
    renderTeacherDashboard();
  } else if (enteredPass !== null) {
    alert("Incorrect Teacher Password! (Default is: pass)");
  }
}

function renderTeacherDashboard() {
  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f8fafc; z-index:3000; display:flex; flex-direction:column;">' +
    '<div style="height:55px; background:var(--primary-navy, #0f172a); color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px;">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<i class="fas fa-chalkboard-teacher" style="color:#fbbf24;"></i>' +
    '<strong>Teacher Control Panel</strong>' +
    '</div>' +
    '<div style="display:flex; align-items:center; gap:10px;">' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '<button onclick="closeDynamicView()" style="background:none; border:none; color:white; font-size:1.3rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '</div>' +
    
    // Balanced Symmetrical 5-Tile Action Bar
    '<div style="background:white; border-bottom:1px solid #e2e8f0; display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); padding:10px 12px; gap:8px; align-items:center;">' +
    '<button id="tabBtn_maker" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:6px; background:#1e40af; border:2px solid transparent; transition:all 0.2s;" onclick="showTeacherSection(\'maker\')"><i class="fas fa-file-alt"></i> <span>+ Create Quiz</span></button>' +
    '<button id="tabBtn_list" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:6px; background:#0284c7; border:2px solid transparent; transition:all 0.2s;" onclick="showTeacherSection(\'list\')"><i class="fas fa-chart-line"></i> <span>Manage Quizzes</span></button>' +
    '<button id="tabBtn_material" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:6px; background:#d97706; border:2px solid transparent; transition:all 0.2s;" onclick="openTeacherMaterialModal()"><i class="fas fa-upload"></i> <span>Post Material</span></button>' +
    '<button id="tabBtn_notice" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:6px; background:#eab308; color:#0f172a; font-weight:700; border:2px solid transparent; transition:all 0.2s;" onclick="openTeacherNotificationModal()"><i class="fas fa-bullhorn"></i> <span>Post Notice</span></button>' +
    '<button id="tabBtn_ppt" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:6px; background:#dc2626; border:2px solid transparent; transition:all 0.2s;" onclick="window.location.href=\'teacher-portal.html\'"><i class="fas fa-file-powerpoint"></i> <span>PPT Hub</span></button>' +
    '</div>' +
    
    '<div id="teacherContentBody" style="flex:1; overflow-y:auto; padding:16px; max-width:850px; margin:0 auto; width:100%;"></div>' +
    '</div>';

  document.getElementById("dynamicView").innerHTML = html;
  showTeacherSection('list');
}

function updateTeacherTabAppearance(activeSec) {
  currentTeacherActiveTab = activeSec;
  var tabIds = ['maker', 'list', 'material', 'notice', 'ppt'];
  
  tabIds.forEach(function(sec) {
    var btn = document.getElementById("tabBtn_" + sec);
    if (!btn) return;
    
    if (sec === activeSec) {
      btn.style.borderColor = "#fbbf24";
      btn.style.boxShadow = "0 0 10px rgba(251, 191, 36, 0.65)";
      btn.style.transform = "scale(1.02)";
      btn.style.fontWeight = "bold";
    } else {
      btn.style.borderColor = "transparent";
      btn.style.boxShadow = "none";
      btn.style.transform = "scale(1)";
      btn.style.opacity = "0.9";
    }
  });
}

function showTeacherSection(sec) {
  updateTeacherTabAppearance(sec);
  var container = document.getElementById("teacherContentBody");

  if (sec === 'maker') {
    var makerHtml = '<div class="modal-card" style="max-width:100%;">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
      '<h3 style="color:var(--primary-navy); margin:0;">Create New Quiz / Examination</h3>' +
      '<button class="nav-pill-btn nav-back-btn" onclick="showTeacherSection(\'list\')"><i class="fas fa-arrow-left"></i> Quiz List</button>' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">' +
      '<div class="form-group">' +
      '<label>Quiz Title / Chapter Name</label>' +
      '<input type="text" id="tqTitle" placeholder="e.g. Chapter 3: Atmosphere" required>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Board</label>' +
      '<select id="tqBoard"><option value="CBSE">CBSE Board</option><option value="BSEB">BSEB (Bihar Board)</option></select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Class</label>' +
      '<select id="tqClass">' +
      '<option value="Play">Play</option><option value="Nur">Nursery</option><option value="LKG">LKG</option><option value="UKG">UKG</option>' +
      '<option value="Class 1">Class 1</option><option value="Class 2">Class 2</option><option value="Class 3">Class 3</option>' +
      '<option value="Class 4">Class 4</option><option value="Class 5">Class 5</option><option value="Class 6">Class 6</option>' +
      '<option value="Class 7">Class 7</option><option value="Class 8">Class 8</option><option value="Class 9">Class 9</option>' +
      '<option value="Class 10">Class 10</option><option value="Class 11">Class 11</option><option value="Class 12">Class 12</option>' +
      '</select>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Subject</label>' +
      '<select id="tqSubject">' +
      '<option value="Science">Science</option><option value="Math">Math</option><option value="Hindi">Hindi</option>' +
      '<option value="English">English</option><option value="S.St">S.St</option><option value="G.K">G.K</option><option value="Computer">Computer</option>' +
      '</select>' +
      '</div>' +
      '</div>' +
      '<div style="background:#f1f5f9; padding:12px; border-radius:8px; margin-top:12px; margin-bottom:12px; border:1px solid #cbd5e1;">' +
      '<h4 style="color:var(--primary-navy); margin-bottom:10px; font-size:0.95rem;"><i class="fas fa-stopwatch" style="color:#d97706;"></i> Exam Settings</h4>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">' +
      '<div class="form-group">' +
      '<label>Timer Type</label>' +
      '<select id="tqTimerType" onchange="handleTimerTypeChange()">' +
      '<option value="full">Total Quiz Timer (Minutes)</option>' +
      '<option value="per_question">Per Question Timer (Seconds)</option>' +
      '<option value="none">No Timer</option>' +
      '</select>' +
      '</div>' +
      '<div class="form-group" id="timerValueGroup">' +
      '<label id="timerValueLabel">Total Duration (Minutes)</label>' +
      '<input type="number" id="tqTimerValue" value="15" min="1">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Negative Marking</label>' +
      '<select id="tqNegativeMarking">' +
      '<option value="0">No Penalty (0)</option><option value="0.25">-0.25 (1/4th)</option><option value="0.33">-0.33 (1/3rd)</option><option value="0.50">-0.50 (1/2)</option>' +
      '</select>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div style="background:#fff7ed; padding:12px; border-radius:8px; border:1px solid #ffedd5; margin-bottom:12px;">' +
      '<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">' +
      '<input type="checkbox" id="tqIsRewarding" onchange="toggleRewardingField()">' +
      '<strong style="color:#c2410c;">🎁 Enable Rewarding Quiz Mode (Passkey Required)</strong>' +
      '</label>' +
      '<div id="rewardingPassContainer" style="display:none; margin-top:8px;">' +
      '<label style="font-size:0.8rem; font-weight:600;">Secret Access Passkey</label>' +
      '<input type="text" id="tqPasskey" placeholder="Enter Quiz Passkey" style="margin-top:4px;">' +
      '</div>' +
      '</div>' +
      '<div style="background:#eef2ff; padding:12px; border-radius:8px; border:1px solid #c7d2fe; margin-bottom:12px;">' +
      '<label style="display:flex; align-items:center; gap:8px; cursor:pointer;">' +
      '<input type="checkbox" id="tqIsAdvertised" checked>' +
      '<strong style="color:#3730a3;"><i class="fas fa-bullhorn"></i> Feature in Today\'s Home Ad Banner (Auto Promotion)</strong>' +
      '</label>' +
      '<small style="color:#6366f1; display:block; margin-top:4px; margin-left:24px;">Tick rakhne par ye quiz direct app dashboard ke Top Ad Banner par live slide karega.</small>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Paste Questions Text (Any Book / AI Format)</label>' +
      '<textarea id="tqRawText" rows="7" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:8px; font-family:monospace;" placeholder="Q1. Example Question?\na) Option 1\nb) Option 2\nc) Option 3\nd) Option 4\nAns: b"></textarea>' +
      '</div>' +
      '<button class="btn-primary" style="background:#7c3aed;" onclick="parseRawQuestions()"><i class="fas fa-magic"></i> Parse Questions</button>' +
      '<div id="parsedPreviewArea" style="margin-top:16px;"></div>' +
      '</div>';

    container.innerHTML = makerHtml;
  } else if (sec === 'list') {
    activeTeacherQuizzes = getTeacherData("ak_teacher_quizzes", []);
    renderTeacherQuizList();

    if (typeof API !== "undefined" && API.get) {
      API.get("getQuizzes", { allStatus: "true" }).then(function(res) {
        if (res && res.data && res.data.length > 0) {
          activeTeacherQuizzes = res.data;
          setTeacherData("ak_teacher_quizzes", activeTeacherQuizzes);
          renderTeacherQuizList();
        }
      }).catch(function(e) {});
    }
  }
}

function toggleDateGroup(groupId) {
  var content = document.getElementById("groupId".replace("groupId", groupId));
  var icon = document.getElementById("icon-" + groupId);
  if (content) {
    if (content.style.display === "none" || content.style.display === "") {
      content.style.display = "block";
      if (icon) icon.className = "fas fa-chevron-up";
    } else {
      content.style.display = "none";
      if (icon) icon.className = "fas fa-chevron-down";
    }
  }
}

// LATEST TO OLDEST DATE SORTED LIST
async function renderTeacherQuizList() {
  var container = document.getElementById("teacherContentBody");
  if (!container) return;

  var blacklist = [];
  try {
    blacklist = JSON.parse(localStorage.getItem("ak_deleted_quizzes_blacklist")) || [];
  } catch(e) { blacklist = []; }

  if (Array.isArray(activeTeacherQuizzes) && blacklist.length > 0) {
    activeTeacherQuizzes = activeTeacherQuizzes.filter(function(q) {
      var key = String(q.id || q.title || "");
      return blacklist.indexOf(key) === -1;
    });
  }

  if (!activeTeacherQuizzes || activeTeacherQuizzes.length === 0) {
    container.innerHTML = '<div class="modal-card" style="text-align:center; padding:30px;">' +
      '<h3>No Quizzes Available</h3>' +
      '<p style="color:#64748b; margin:10px 0;">Create your first test using the Smart Parser!</p>' +
      '<button class="btn-primary" onclick="showTeacherSection(\'maker\')">+ Create Quiz</button>' +
      '</div>';
    return;
  }

  if (typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL && !CLOUD_SYNC_URL.includes("APNA_DEPLOYED")) {
    try {
      var res = await fetch(CLOUD_SYNC_URL + "?action=getAttempts");
      var json = await res.json();
      if (json && json.data && Array.isArray(json.data)) {
        cachedSheetAttempts = json.data;
      }
    } catch(e) {}
  }

  var localAttempts = [];
  try {
    var stored1 = JSON.parse(localStorage.getItem("ak_student_attempts") || "[]");
    var stored2 = JSON.parse(localStorage.getItem("ak_quiz_results") || "[]");
    localAttempts = stored1.concat(stored2);
  } catch(e) {}

  var allAttemptsCombined = (cachedSheetAttempts || []).concat(localAttempts);

  function getLiveQuizAttemptCount(quiz) {
    var qId = String(quiz.id || "").trim();
    var qTitle = String(quiz.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    var matched = allAttemptsCombined.filter(function(a) {
      var sName = String(a.Student_Name || a.studentName || "").toLowerCase().trim();
      if (sName === "teacher" || sName === "teacher preview") return false;

      var aId = String(a.Quiz_ID || a.quizId || "").trim();
      var aTitle = String(a.Quiz_Title || a.quizTitle || a.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      return (qId && aId === qId) || (qTitle && aTitle && (qTitle.includes(aTitle) || aTitle.includes(qTitle)));
    });

    var uMap = {};
    matched.forEach(function(m) {
      var key = String(m.Student_Name || m.studentName || "").toLowerCase() + "_" + String(m.Mobile || m.mobile || "");
      uMap[key] = true;
    });
    return Object.keys(uMap).length;
  }

  var groups = {};
  var dateTimestamps = {};

  for (var i = 0; i < activeTeacherQuizzes.length; i++) {
    var item = activeTeacherQuizzes[i];
    var rawDate = item.createdAt || item.Created_At || item.timestamp || item.Timestamp || item.date || item.Date;
    var dObj = null;

    if (rawDate) {
      var parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) dObj = parsed;
    }

    if (!dObj) {
      var idStr = String(item.id || item.Quiz_ID || "");
      var timeMatch = idStr.match(/\d{12,}/);
      if (timeMatch) {
        var fromId = new Date(parseInt(timeMatch[0], 10));
        if (!isNaN(fromId.getTime())) dObj = fromId;
      }
    }

    var dateLabel = dObj ? dObj.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "Older Quizzes";
    var timeScore = dObj ? dObj.getTime() : 0;

    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
      dateTimestamps[dateLabel] = timeScore;
    } else {
      if (timeScore > dateTimestamps[dateLabel]) {
        dateTimestamps[dateLabel] = timeScore;
      }
    }
    groups[dateLabel].push({ quiz: item, originalIndex: i });
  }

  var sortedDateKeys = Object.keys(groups).sort(function(a, b) {
    return dateTimestamps[b] - dateTimestamps[a];
  });

  var html = '<h3 style="color:var(--primary-navy); margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">' +
             '<span><i class="fas fa-folder"></i> Quizzes by Date</span>' +
             '<span style="font-size:0.8rem; background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:12px;">Total: ' + activeTeacherQuizzes.length + ' Tests</span>' +
             '</h3>';

  sortedDateKeys.forEach(function(dateKey, gIndex) {
    var quizItems = groups[dateKey];
    var groupId = "quizGroup_" + gIndex;
    var isTopLatest = (gIndex === 0);

    html += '<div style="margin-bottom:12px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; background:#fff;">' +
      '<div onclick="toggleDateGroup(\'' + groupId + '\')" style="background:#f8fafc; padding:11px 14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none; border-bottom:1px solid #e2e8f0;">' +
      '<div style="font-weight:700; color:#1e293b; font-size:0.95rem; display:flex; align-items:center; gap:6px;">' +
      '<i class="far fa-calendar-alt" style="color:#0284c7;"></i> ' + dateKey + ' ' +
      '<span style="background:#e2e8f0; color:#475569; font-size:0.75rem; padding:1px 7px; border-radius:10px;">' + quizItems.length + ' Tests</span>' +
      (isTopLatest ? '<span style="background:#dbeafe; color:#1e40af; font-size:0.7rem; padding:1px 6px; border-radius:8px; font-weight:800;">LATEST</span>' : '') +
      '</div>' +
      '<div><i id="icon-' + groupId + '" class="fas fa-chevron-down" style="color:#64748b;"></i></div>' +
      '</div>' +

      '<div id="' + groupId + '" style="padding:10px; display:none;">';

    quizItems.forEach(function(entry) {
      var q = entry.quiz;
      var idx = entry.originalIndex;
      var isDraft = (q.status === 'draft');
      var borderColor = isDraft ? '#94a3b8' : '#16a34a';
      var qCount = q.questions ? q.questions.length : 0;
      var attCount = getLiveQuizAttemptCount(q);

      html += '<div class="modal-card" style="max-width:100%; margin-bottom:10px; border-left: 5px solid ' + borderColor + '; padding:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">' +
        '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">' +
        '<div>' +
        '<h4 style="color:var(--primary-navy); margin:0 0 4px 0; display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:0.95rem;">' +
        q.title + ' <span style="background:#e0f2fe; color:#0284c7; padding:1px 7px; border-radius:10px; font-size:0.75rem; font-weight:700;"><i class="fas fa-users"></i> ' + attCount + ' Attempts</span></h4>' +
        '<div style="font-size:0.8rem; color:#64748b;">' +
        '<strong>' + (q.board || 'CBSE') + '</strong> | <strong>Class ' + (q.className || '—') + '</strong> | <strong>' + (q.subject || '—') + '</strong> • ' + qCount + ' Questions ' +
        (q.isRewarding ? '<span style="background:#fee2e2; color:#dc2626; padding:1px 5px; border-radius:4px; font-weight:700; margin-left:4px;">🎁 Passkey: ' + (q.passkey || '') + '</span>' : '') +
        '<span style="background:' + (isDraft ? '#e2e8f0' : '#dcfce7') + '; color:' + (isDraft ? '#475569' : '#16a34a') + '; padding:1px 5px; border-radius:4px; font-weight:700; margin-left:4px;">' +
        (isDraft ? 'Draft' : 'Live') +
        '</span>' +
        '</div>' +
        '</div>' +
        '<div style="display:flex; gap:5px; flex-wrap:wrap;">' +
        '<button onclick="shareQuizOnWhatsApp(' + idx + ')" class="btn-primary" style="width:auto; padding:4px 8px; font-size:0.78rem; margin:0; background:#25D366; color:#fff;"><i class="fab fa-whatsapp"></i> Share</button>' +
        '<button onclick="startTeacherTestPreview(' + idx + ')" class="btn-primary" style="width:auto; padding:4px 8px; font-size:0.78rem; margin:0; background:#4f46e5;"><i class="fas fa-play"></i> Preview</button>' +
        '<button onclick="togglePublishStatus(' + idx + ')" class="btn-primary" style="width:auto; padding:4px 8px; font-size:0.78rem; margin:0; background:' + (isDraft ? '#16a34a' : '#64748b') + ';">' + (isDraft ? 'Publish' : 'Unpublish') + '</button>' +
        '<button onclick="openQuizLeaderboard(' + idx + ')" class="btn-primary" style="width:auto; padding:4px 8px; font-size:0.78rem; margin:0; background:#0284c7;">Leaderboard</button>' +
        '<button onclick="openQuizEditorModal(' + idx + ')" class="btn-primary" style="width:auto; padding:4px 8px; font-size:0.78rem; margin:0; background:#d97706;">Edit</button>' +
        '<button onclick="printActualQuizByIndex(' + idx + ')" class="btn-primary" style="width:auto; padding:4px 8px; font-size:0.78rem; margin:0; background:#059669;"><i class="fas fa-print"></i></button>' +
        '<button onclick="deleteQuizPermanently(' + idx + ')" class="btn-primary" style="width:auto; padding:4px 8px; font-size:0.78rem; margin:0; background:#dc2626;"><i class="fas fa-trash"></i></button>' +
        '</div>' +
        '</div>' +
        '</div>';
    });

    html += '</div></div>';
  });

  container.innerHTML = html;
}

// POST MATERIAL
function openTeacherMaterialModal() {
  updateTeacherTabAppearance('material');
  var modalHtml = '<div class="modal-overlay" style="display:flex; z-index:3600;" id="teacherMaterialModal">' +
    '<div class="modal-card" style="max-width:680px; width:92%; max-height:90vh; overflow-y:auto;">' +
    '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">' +
    '<h3 style="margin:0; color:var(--primary-navy, #0f172a);"><i class="fas fa-book-reader" style="color:#d97706;"></i> Post Study Material</h3>' +
    '<button class="close-btn" onclick="document.getElementById(\'teacherMaterialModal\').remove(); updateTeacherTabAppearance(currentTeacherActiveTab);" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="margin-top:12px; display:flex; flex-direction:column; gap:10px;">' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Material Title / Chapter Topic</label><input type="text" id="matTitle" placeholder="e.g. Chapter 4: Motion and Force Notes" required style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></div>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Class</label><select id="matClass" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"><option value="Class 1">Class 1</option><option value="Class 2">Class 2</option><option value="Class 3">Class 3</option><option value="Class 4">Class 4</option><option value="Class 5">Class 5</option><option value="Class 6">Class 6</option><option value="Class 7">Class 7</option><option value="Class 8">Class 8</option><option value="Class 9">Class 9</option><option value="Class 10">Class 10</option><option value="Class 11">Class 11</option><option value="Class 12">Class 12</option></select></div>' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Subject</label><select id="matSubject" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"><option value="Science">Science</option><option value="Math">Math</option><option value="Hindi">Hindi</option><option value="English">English</option><option value="S.St">S.St</option><option value="G.K">G.K</option><option value="Computer">Computer</option></select></div>' +
    '</div>' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Content Format</label><select id="matType" onchange="toggleMaterialInputFields()" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"><option value="TEXT">📝 Text Notes</option><option value="PDF">📄 PDF Link</option><option value="PPT">📊 PPT Link</option><option value="IMAGE">🖼️ Image Link</option><option value="VIDEO">🎥 YouTube Link</option></select></div>' +
    '<div class="form-group" id="matUrlContainer" style="display:none;"><label id="matUrlLabel" style="font-size:0.85rem; font-weight:600;">Link</label><input type="url" id="matUrl" placeholder="https://..." style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></div>' +
    '<div class="form-group" id="matTextContainer"><label style="font-size:0.85rem; font-weight:600;">Notes Content</label><textarea id="matTextContent" rows="6" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></textarea></div>' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Remarks (Optional)</label><input type="text" id="matDesc" placeholder="e.g. Read before test" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></div>' +
    '<div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;"><button class="nav-pill-btn nav-back-btn" onclick="document.getElementById(\'teacherMaterialModal\').remove(); updateTeacherTabAppearance(currentTeacherActiveTab);">Cancel</button><button class="btn-primary" style="background:#16a34a; width:auto; padding:6px 18px; margin:0;" onclick="saveTeacherMaterial()"><i class="fas fa-check"></i> Publish Material</button></div>' +
    '</div></div></div>';

  var div = document.createElement("div");
  div.innerHTML = modalHtml;
  document.body.appendChild(div.firstElementChild);
}

function toggleMaterialInputFields() {
  var type = document.getElementById("matType").value;
  var urlGrp = document.getElementById("matUrlContainer");
  var textGrp = document.getElementById("matTextContainer");
  urlGrp.style.display = (type === "TEXT") ? "none" : "block";
  textGrp.style.display = (type === "TEXT") ? "block" : "none";
}

async function saveTeacherMaterial() {
  var title = document.getElementById("matTitle").value.trim();
  var className = document.getElementById("matClass").value;
  var subject = document.getElementById("matSubject").value;
  var type = document.getElementById("matType").value;
  var url = document.getElementById("matUrl") ? document.getElementById("matUrl").value.trim() : "";
  var textContent = document.getElementById("matTextContent") ? document.getElementById("matTextContent").value.trim() : "";
  var desc = document.getElementById("matDesc").value.trim();

  if (!title) { alert("Title bharna zaroori hai!"); return; }
  if (type === "TEXT" && !textContent) { alert("Content likhna zaroori hai!"); return; }
  if (type !== "TEXT" && !url) { alert("Link dalna zaroori hai!"); return; }

  var newMat = {
    id: "mat_" + Date.now(),
    title: title,
    className: className,
    subject: subject,
    type: type,
    url: url,
    content: textContent,
    desc: desc,
    date: new Date().toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: new Date().toISOString()
  };

  var materials = getTeacherData("ak_study_materials", []);
  materials.unshift(newMat);
  setTeacherData("ak_study_materials", materials);

  if (typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL && !CLOUD_SYNC_URL.includes("APNA_DEPLOYED")) {
    try {
      fetch(CLOUD_SYNC_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saveMaterial", material: newMat })
      });
    } catch(e) {}
  }

  alert("Study Material publish ho gaya!");
  var modal = document.getElementById("teacherMaterialModal");
  if (modal) modal.remove();
  updateTeacherTabAppearance(currentTeacherActiveTab);
}

// REMAINING LEADERBOARD & UTILITIES
function startTeacherTestPreview(idx) {
  var quiz = activeTeacherQuizzes[idx];
  if (!quiz || !quiz.questions || quiz.questions.length === 0) { alert("No questions!"); return; }
  isTeacherTestingMode = true;
  currentQuiz = JSON.parse(JSON.stringify(quiz));
  currentQuiz.participantName = "Teacher (Preview Mode)";
  currentQuiz.participantMobile = "0000000000";
  startActualExam();
}

function togglePublishStatus(idx) {
  var quiz = activeTeacherQuizzes[idx];
  quiz.status = (quiz.status === 'published') ? 'draft' : 'published';
  setTeacherData("ak_teacher_quizzes", activeTeacherQuizzes);
  if (typeof API !== "undefined" && API.post) API.post("updateQuizMeta", { id: quiz.id, status: quiz.status });
  renderTeacherQuizList();
}

function deleteQuizPermanently(idx) {
  var quiz = activeTeacherQuizzes[idx];
  if (!quiz) return;
  if (confirm("Delete \"" + quiz.title + "\"?")) {
    var quizId = String(quiz.id || quiz.quizId || "");
    var deletedBlacklist = [];
    try { deletedBlacklist = JSON.parse(localStorage.getItem("ak_deleted_quizzes_blacklist")) || []; } catch(e) {}
    if (quizId && deletedBlacklist.indexOf(quizId) === -1) {
      deletedBlacklist.push(quizId);
      localStorage.setItem("ak_deleted_quizzes_blacklist", JSON.stringify(deletedBlacklist));
    }
    activeTeacherQuizzes.splice(idx, 1);
    setTeacherData("ak_teacher_quizzes", activeTeacherQuizzes);
    localStorage.setItem("ak_teacher_quizzes", JSON.stringify(activeTeacherQuizzes));
    if (typeof API !== "undefined" && API.post) API.post("deleteQuiz", { id: quizId });
    renderTeacherQuizList();
  }
}

function openQuizLeaderboard(idx) {
  var quiz = activeTeacherQuizzes[idx];
  currentLeaderboardQuiz = quiz;
  var dynamicView = document.getElementById("dynamicView");
  dynamicView.innerHTML = '<div class="modal-overlay" style="display:flex;"><div class="modal-card" style="max-width:760px; width:92%;"><div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:10px;"><div><h3 style="color:var(--primary-navy); margin:0;">Leaderboard: ' + quiz.title + '</h3></div><button class="close-btn" onclick="renderTeacherDashboard()"><i class="fas fa-times"></i></button></div><div id="leaderboardListContainer" style="margin-top:12px; max-height:60vh; overflow-y:auto;"><p style="text-align:center; padding:20px;">Loading...</p></div><div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;"><button class="nav-pill-btn nav-back-btn" onclick="renderTeacherDashboard()">Back</button></div></div></div>';
  fetchAndRenderLeaderboard(quiz, idx);
}

async function fetchAndRenderLeaderboard(quiz, quizIdx) {
  var container = document.getElementById("leaderboardListContainer");
  if (!container) return;
  var targetQuizId = String(quiz.id || quiz.Quiz_ID || "").trim();
  var targetTitleClean = String(quiz.title || quiz.Title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  var attempts = [];

  if (typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL && !CLOUD_SYNC_URL.includes("APNA_DEPLOYED")) {
    try {
      var res = await fetch(CLOUD_SYNC_URL + "?action=getAttempts");
      var json = await res.json();
      var rawList = Array.isArray(json) ? json : (json && json.data ? json.data : []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        cachedSheetAttempts = rawList;
        attempts = rawList.map(function(r) {
          return {
            id: r.Attempt_ID || r.attemptId || r.id,
            quizId: String(r.Quiz_ID || r.quizId || "").trim(),
            quizTitle: r.Quiz_Title || r.quizTitle || r.title || "",
            studentName: r.Student_Name || r.studentName || r.name || "Student",
            mobile: r.Mobile || r.mobile || "N/A",
            score: Number(r.Score || r.score || 0),
            totalMarks: Number(r.Total_Marks || r.totalMarks || r.total || (quiz.questions ? quiz.questions.length : 10)),
            percentage: r.Percentage || r.percentage || 0
          };
        }).filter(function(r) {
          var sName = String(r.studentName).toLowerCase().trim();
          if (sName === "teacher" || sName === "teacher preview") return false;
          var idMatch = targetQuizId && r.quizId && (r.quizId === targetQuizId);
          var rTitleClean = String(r.quizTitle).toLowerCase().replace(/[^a-z0-9]/g, "");
          return idMatch || (targetTitleClean && rTitleClean && (targetTitleClean.includes(rTitleClean) || rTitleClean.includes(targetTitleClean)));
        });
      }
    } catch(e) {}
  }

  if (!attempts.length) {
    container.innerHTML = '<p style="text-align:center; padding:20px;">Koi attempt nahi mila.</p>';
    return;
  }

  var uniqueMap = {};
  attempts.forEach(function(att) {
    var key = String(att.studentName).toLowerCase() + "_" + String(att.mobile);
    if (!uniqueMap[key] || Number(att.score) > Number(uniqueMap[key].score)) uniqueMap[key] = att;
  });

  var sortedList = Object.values(uniqueMap).sort(function(a, b) { return Number(b.score) - Number(a.score); });
  currentLeaderboardParticipants = sortedList;

  var tbHtml = '<table style="width:100%; border-collapse:collapse; font-size:0.85rem;"><thead><tr style="background:#f1f5f9;"><th style="padding:6px;">Rank</th><th style="padding:6px;">Name</th><th style="padding:6px;">Mobile</th><th style="padding:6px; text-align:center;">Score</th></tr></thead><tbody>';
  for (var pIdx = 0; pIdx < sortedList.length; pIdx++) {
    var p = sortedList[pIdx];
    tbHtml += '<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:6px;">#' + (pIdx + 1) + '</td><td style="padding:6px;">' + p.studentName + '</td><td style="padding:6px;">' + p.mobile + '</td><td style="padding:6px; text-align:center; font-weight:700; color:#16a34a;">' + p.score + '/' + p.totalMarks + '</td></tr>';
  }
  tbHtml += '</tbody></table>';
  container.innerHTML = tbHtml;
}

function openQuizEditorModal(idx) {
  editingQuizBuffer = JSON.parse(JSON.stringify(activeTeacherQuizzes[idx]));
  var html = '<div class="modal-overlay" style="display:flex;"><div class="modal-card" style="max-width:700px; max-height:85vh; overflow-y:auto;"><div class="modal-header"><h3>Edit: ' + editingQuizBuffer.title + '</h3><button class="close-btn" onclick="renderTeacherDashboard()"><i class="fas fa-times"></i></button></div><div class="form-group" style="margin-top:10px;"><label>Title</label><input type="text" id="editQuizTitle" value="' + editingQuizBuffer.title + '"></div><button class="btn-primary" style="background:#16a34a; margin-top:12px;" onclick="saveEditedQuizChanges(' + idx + ')">Save Title Changes</button></div></div>';
  document.getElementById("dynamicView").innerHTML = html;
}

function saveEditedQuizChanges(idx) {
  editingQuizBuffer.title = document.getElementById("editQuizTitle").value;
  activeTeacherQuizzes[idx] = editingQuizBuffer;
  setTeacherData("ak_teacher_quizzes", activeTeacherQuizzes);
  alert("Quiz updated!");
  renderTeacherDashboard();
}

function printActualQuizByIndex(idx) {
  var quiz = activeTeacherQuizzes[idx];
  if (!quiz || !quiz.questions) return;
  var printWindow = window.open("", "_blank");
  printWindow.document.write('<html><head><title>' + quiz.title + '</title></head><body><h2>' + quiz.title + '</h2><p>Print preview generated.</p><script>window.print();<\/script></body></html>');
}

function shareQuizOnWhatsApp(idx) {
  var q = activeTeacherQuizzes[idx];
  if (!q) return;
  var link = window.location.origin + window.location.pathname.replace("index.html", "") + "index.html?quizId=" + encodeURIComponent(q.id || q.title);
  var msg = "📝 *AK Learning Point - Test*\nTopic: " + q.title + "\nLink: " + link;
  window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(msg), "_blank");
}
