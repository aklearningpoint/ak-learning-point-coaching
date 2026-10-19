// Content Modules: Results, Rewarding Contests, Coaching, Flip-Book & A4 100-Q OMR Engine

function getModuleData(key, fallback) {
  try {
    var val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setModuleData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

// 1. Student Result Lookup (History, Scorecard & Full Solution Analysis)
function openResultLookupModal() {
  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<h3><i class="fas fa-poll" style="color:#d97706;"></i> Student Result Lookup</h3>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<form onsubmit="handleResultSearch(event)">' +
    '<div class="form-group">' +
    '<label>Registered 10-Digit Mobile Number</label>' +
    '<input type="tel" id="resLookupMobile" required pattern="[0-9]{10}" placeholder="Enter mobile number">' +
    '</div>' +
    '<button type="submit" class="btn-primary" style="background:#d97706;">Search Attempted Tests</button>' +
    '</form>' +
    '<div id="resultLookupList" style="margin-top:15px; max-height:50vh; overflow-y:auto;"></div>' +
    '<div style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="closeDynamicView()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

async function handleResultSearch(e) {
  e.preventDefault();
  var mobInput = document.getElementById("resLookupMobile").value.trim();
  var listContainer = document.getElementById("resultLookupList");
  listContainer.innerHTML = '<p style="text-align:center; color:#64748b; padding:15px;"><i class="fas fa-spinner fa-spin"></i> Google Sheet se records khoje ja rahe hain...</p>';

  var allRecords = [];

  // 1. Live Fetch from Google Sheet
  try {
    if (typeof API !== "undefined" && API.get) {
      var cloudRes = await API.get("getAttempts");
      if (cloudRes && cloudRes.status === "success" && Array.isArray(cloudRes.data) && cloudRes.data.length > 0) {
        allRecords = cloudRes.data;
      }
    }
  } catch (err) {
    console.warn("Cloud fetch fallback:", err);
  }

  // 2. Fallback to Local Storage
  if (allRecords.length === 0) {
    var localAttempts = [];
    try {
      localAttempts = JSON.parse(localStorage.getItem("ak_student_attempts") || localStorage.getItem("ak_quiz_results") || "[]");
    } catch (err) { localAttempts = []; }
    allRecords = localAttempts;
  }

  // 3. Filter by Mobile Number
  var matched = [];
  for (var i = 0; i < allRecords.length; i++) {
    var item = allRecords[i];
    var itemMobile = String(item.Mobile || item.mobile || "").trim();
    if (itemMobile === mobInput) {
      matched.push({
        attemptId: item.Attempt_ID || item.attemptId || item.id || ("att_" + i),
        quizId: item.Quiz_ID || item.quizId || "",
        quizTitle: item.Quiz_Title || item.quizTitle || "Online Exam",
        studentName: item.Student_Name || item.studentName || item.name || "Student",
        mobile: itemMobile,
        score: item.Score !== undefined ? item.Score : (item.score || 0),
        totalMarks: item.Total_Marks !== undefined ? item.Total_Marks : (item.totalMarks || item.total || 0),
        percentage: item.Percentage !== undefined ? item.Percentage : (item.percentage || 0),
        answers: item.Answers_JSON || item.answers || "{}",
        timestamp: item.Timestamp || item.timestamp || new Date().toISOString()
      });
    }
  }

  if (matched.length === 0) {
    listContainer.innerHTML = '<div style="text-align:center; padding:15px; color:#dc2626;"><i class="fas fa-exclamation-circle fa-2x"></i><p style="margin-top:6px; font-weight:600;">Is number se koi attempt record nahi mila!</p><small style="color:#64748b;">Kripya wahi 10-digit mobile number dalein jo test dete waqt enter kiya tha.</small></div>';
    return;
  }

  // Sort: Latest attempt first
  matched.sort(function(a, b) {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  window.activeSearchedAttempts = matched;

  var itemsHtml = "";
  for (var idx = 0; idx < matched.length; idx++) {
    var att = matched[idx];
    var attemptDate = att.timestamp ? new Date(att.timestamp).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "Recent";

    itemsHtml += '<div class="section-card" style="margin-bottom:8px; padding:12px; display:flex; align-items:center; justify-content:space-between;">' +
      '<div style="flex:1;">' +
      '<h4 style="font-size:0.95rem; color:#0f172a; margin-bottom:3px;">' + att.quizTitle + '</h4>' +
      '<small style="color:#64748b;">Score: <strong style="color:#0f172a;">' + att.score + '/' + att.totalMarks + '</strong> (' + att.percentage + '%)</small>' +
      '<div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;"><i class="far fa-calendar-alt"></i> ' + attemptDate + '</div>' +
      '</div>' +
      '<div style="display:flex; gap:6px;">' +
      '<button class="btn-primary" style="width:auto; padding:6px 10px; font-size:0.8rem; background:#d97706; margin:0;" onclick="viewHistoricalScorecardByIndex(' + idx + ')">Scorecard</button>' +
      '<button class="btn-primary" style="width:auto; padding:6px 10px; font-size:0.8rem; background:#2563eb; margin:0;" onclick="viewQuizAnalysisByIndex(' + idx + ')"><i class="fas fa-chart-bar"></i> Analysis</button>' +
      '</div>' +
      '</div>';
  }

  listContainer.innerHTML = itemsHtml;
}

function viewHistoricalScorecardByIndex(idx) {
  var att = window.activeSearchedAttempts[idx];
  var appreciation = "Shandar Prayas! Rozana abhyas karte rahein.";
  var pct = parseFloat(att.percentage || 0);
  if (pct >= 80) appreciation = "🌟 Adbhut Pradarshan! Champion performance!";
  else if (pct >= 50) appreciation = "👍 Bahut Acha! Agli baar 90% ka target rakhein!";

  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="text-align:center; max-width:480px;">' +
    '<div class="modal-header">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="openResultLookupModal()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<h3>Test Scorecard</h3>' +
    '</div>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="background:var(--primary-navy, #0f172a); color:white; padding:20px; border-radius:12px; margin-bottom:15px;">' +
    '<h2 style="color:#fbbf24; margin-bottom:4px;">AK Learning Point Coaching</h2>' +
    '<p style="font-size:0.85rem; opacity:0.8;">Student: <strong>' + att.studentName + '</strong></p>' +
    '<hr style="border:none; border-top:1px solid rgba(255,255,255,0.2); margin:12px 0;">' +
    '<div style="font-size:2.2rem; font-weight:800; color:#4ade80;">' + att.score + ' / ' + att.totalMarks + '</div>' +
    '<div style="font-size:1rem; font-weight:600; margin-top:4px;">Accuracy: ' + att.percentage + '%</div>' +
    '<p style="font-style:italic; font-size:0.85rem; margin-top:10px; color:#e2e8f0;">"' + appreciation + '"</p>' +
    '</div>' +
    '<div style="display:flex; flex-direction:column; gap:10px;">' +
    '<button class="btn-primary" style="background:#2563eb;" onclick="viewQuizAnalysisByIndex(' + idx + ')"><i class="fas fa-chart-line"></i> View Detailed Quiz Analysis</button>' +
    '<button class="btn-primary" style="background:#25d366;" onclick="shareResultWhatsApp(\'' + att.score + '\', \'' + att.totalMarks + '\', \'' + att.percentage + '\')"><i class="fab fa-whatsapp"></i> Share on WhatsApp</button>' +
    '<button class="btn-primary" style="background:#64748b;" onclick="openResultLookupModal()"><i class="fas fa-arrow-left"></i> Back to Search</button>' +
    '<button class="btn-primary" style="background:#0f172a;" onclick="goHome()"><i class="fas fa-home"></i> Back to Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

// 1.1 Detailed Solution & Question Analysis Engine
async function viewQuizAnalysisByIndex(idx) {
  var att = window.activeSearchedAttempts[idx];
  var listContainer = document.getElementById("dynamicView");
  
  // Parse student responses
  var userAns = {};
  try {
    userAns = typeof att.answers === "string" ? JSON.parse(att.answers) : (att.answers || {});
  } catch (e) { userAns = {}; }

  // Load quiz questions
  var targetQuiz = null;
  try {
    if (typeof API !== "undefined" && API.get) {
      var qRes = await API.get("getQuizzes");
      if (qRes && qRes.data) {
        targetQuiz = qRes.data.find(function(q) { return String(q.id).trim() === String(att.quizId).trim(); });
      }
    }
  } catch (err) {}

  if (!targetQuiz) {
    var localQuizzes = getModuleData("ak_teacher_quizzes", []);
    targetQuiz = localQuizzes.find(function(q) { return String(q.id).trim() === String(att.quizId).trim(); });
  }

  var questions = (targetQuiz && targetQuiz.questions) ? targetQuiz.questions : [];
  var analysisCardsHtml = "";

  if (questions.length === 0) {
    analysisCardsHtml = '<div style="text-align:center; padding:20px; color:#64748b;">Is quiz ke individual questions offline available nahi hain. Total Score: ' + att.score + '/' + att.totalMarks + '</div>';
  } else {
    for (var qIdx = 0; qIdx < questions.length; qIdx++) {
      var q = questions[qIdx];
      var chosen = userAns[qIdx] !== undefined ? parseInt(userAns[qIdx]) : -1;
      var correct = parseInt(q.correctAnswer !== undefined ? q.correctAnswer : 0);

      var isCorrect = (chosen === correct);
      var isUnattempted = (chosen === -1);

      var badge = isUnattempted ? '<span style="color:#64748b; font-weight:bold;">⚪ Unattempted</span>' :
                  (isCorrect ? '<span style="color:#16a34a; font-weight:bold;">🟢 Correct (+1)</span>' : '<span style="color:#dc2626; font-weight:bold;">🔴 Incorrect</span>');

      var optListHtml = "";
      if (q.options && Array.isArray(q.options)) {
        for (var oIdx = 0; oIdx < q.options.length; oIdx++) {
          var bg = "#f8fafc";
          var border = "1px solid #e2e8f0";
          var icon = "";

          if (oIdx === correct) {
            bg = "#dcfce7";
            border = "1.5px solid #16a34a";
            icon = ' <i class="fas fa-check-circle" style="color:#16a34a;"></i> (Correct Answer)';
          } else if (oIdx === chosen && !isCorrect) {
            bg = "#fee2e2";
            border = "1.5px solid #dc2626";
            icon = ' <i class="fas fa-times-circle" style="color:#dc2626;"></i> (Your Choice)';
          }

          optListHtml += '<div style="background:' + bg + '; border:' + border + '; padding:8px 12px; border-radius:6px; margin-top:5px; font-size:0.85rem;">' +
            String.fromCharCode(65 + oIdx) + '. ' + q.options[oIdx] + icon + '</div>';
        }
      }

      analysisCardsHtml += '<div style="background:white; border:1px solid #cbd5e1; border-radius:8px; padding:12px; margin-bottom:12px; text-align:left;">' +
        '<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.85rem;">' +
        '<strong>Q' + (qIdx + 1) + '.</strong>' + badge +
        '</div>' +
        '<p style="font-size:0.95rem; color:#0f172a; margin:0 0 8px 0; font-weight:600;">' + q.question + '</p>' +
        optListHtml +
        '</div>';
    }
  }

  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="max-width:550px;">' +
    '<div class="modal-header">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="openResultLookupModal()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<h3>Quiz Solution Analysis</h3>' +
    '</div>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="background:#f1f5f9; padding:10px 14px; border-radius:8px; margin-bottom:12px; font-size:0.85rem; color:#334155; display:flex; justify-content:space-between;">' +
    '<span><strong>Candidate:</strong> ' + att.studentName + '</span>' +
    '<span><strong>Score:</strong> ' + att.score + '/' + att.totalMarks + '</span>' +
    '</div>' +
    '<div style="max-height:60vh; overflow-y:auto; padding-right:4px;">' + analysisCardsHtml + '</div>' +
    '<div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="openResultLookupModal()"><i class="fas fa-arrow-left"></i> Back to Search</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  listContainer.innerHTML = html;
}
// 2. Rewarding Quiz Tab (With Live Cloud Sync)
async function openRewardingQuizzes() {
  var rewardingList = [];

  // Try live fetch
  try {
    if (typeof API !== "undefined" && API.get) {
      var res = await API.get("getQuizzes");
      if (res && res.status === "success" && Array.isArray(res.data)) {
        rewardingList = res.data.filter(function(q) {
          return (q.isRewarding || q.Is_Rewarding) && (q.status === "published" || !q.status);
        });
      }
    }
  } catch (e) {
    console.warn("Rewarding quiz cloud fetch failed:", e);
  }

  // Fallback to local
  if (rewardingList.length === 0) {
    var localQuizzes = getModuleData("ak_teacher_quizzes", []);
    for (var i = 0; i < localQuizzes.length; i++) {
      if (localQuizzes[i].isRewarding && localQuizzes[i].status === "published") {
        rewardingList.push(localQuizzes[i]);
      }
    }
  }

  if (rewardingList.length === 0) {
    document.getElementById("dynamicView").innerHTML = '<div class="modal-overlay" style="display:flex;">' +
      '<div class="modal-card" style="text-align:center;">' +
      '<div class="modal-header">' +
      '<h3>🎁 Rewarding Quizzes</h3>' +
      '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<p style="margin:20px 0; color:#64748b;">Filhaal koi naya Rewarding Quiz live nahi hai. Teacher panel se jald code aayega!</p>' +
      '<div style="display:flex; justify-content:space-between;">' +
      '<button class="nav-pill-btn nav-back-btn" onclick="closeDynamicView()"><i class="fas fa-arrow-left"></i> Back</button>' +
      '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
      '</div>' +
      '</div></div>';
    return;
  }

  window.activeLoadedQuizzes = rewardingList;
  var listHtml = "";
  for (var j = 0; j < rewardingList.length; j++) {
    var q = rewardingList[j];
    listHtml += '<div class="section-card" style="margin-bottom:12px; border-left: 5px solid #dc2626;">' +
      '<div style="flex:1;">' +
      '<h3 style="font-size:1rem; color:#0f172a;">' + q.title + '</h3>' +
      '<small style="color:#64748b;">' + (q.className || "") + ' • ' + (q.subject || "") + '</small>' +
      '<div style="margin-top:8px;">' +
      '<button class="btn-primary" style="padding:6px 14px; font-size:0.85rem; width:auto; background:#dc2626;" onclick="openQuizEntryModalByIndex(' + j + ')"><i class="fas fa-lock"></i> Enter with Passkey</button>' +
      '</div></div></div>';
  }

  document.getElementById("dynamicView").innerHTML = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="closeDynamicView()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<h3>🎁 Active Rewarding Contests</h3>' +
    '</div>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="max-height:60vh; overflow-y:auto;">' + listHtml + '</div>' +
    '<div style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="closeDynamicView()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';
}

// 3. Online Coaching Classes
function openOnlineCoachingModal() {
  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="text-align:center;">' +
    '<div class="modal-header">' +
    '<h3><i class="fas fa-video" style="color:#7c3aed;"></i> Online Coaching</h3>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<p style="color:#64748b; margin-bottom:16px;">Kripya video batch select kijiye:</p>' +
    '<div style="display:flex; flex-direction:column; gap:12px;">' +
    '<div class="section-card" onclick="openTuitionSection()">' +
    '<div class="section-left">' +
    '<div class="section-icon" style="background:#ede9fe; color:#7c3aed;"><i class="fas fa-user-lock"></i></div>' +
    '<div class="section-info"><h3>Tuition Classes</h3><p>Passkey Protected Enrolled Batches</p></div>' +
    '</div>' +
    '<i class="fas fa-chevron-right" style="color:#94a3b8;"></i>' +
    '</div>' +
    '<div class="section-card" onclick="openGeneralVideoSection()">' +
    '<div class="section-left">' +
    '<div class="section-icon" style="background:#e0f2fe; color:#0284c7;"><i class="fas fa-globe"></i></div>' +
    '<div class="section-info"><h3>General Classes</h3><p>Free Lectures & Concept Explanations</p></div>' +
    '</div>' +
    '<i class="fas fa-chevron-right" style="color:#94a3b8;"></i>' +
    '</div>' +
    '</div>' +
    '<div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="closeDynamicView()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

function openTuitionSection() {
  var appConfig = getModuleData("ak_app_config", {});
  var currentTuitionPass = appConfig.tuitionPass || "pass";
  var enteredPass = prompt("Enter Tuition Access Passkey (Default: pass):");
  if (enteredPass === currentTuitionPass || enteredPass === "pass") {
    playInAppVideo("Tuition Special Lecture: Mathematics & Science Concepts", "https://www.youtube.com/embed/dQw4w9WgXcQ");
  } else if (enteredPass !== null) {
    alert("Galat passkey! Sahi tuition passkey dalein.");
  }
}

function openGeneralVideoSection() {
  playInAppVideo("General Lecture: Concept Explanations", "https://www.youtube.com/embed/dQw4w9WgXcQ");
}

function playInAppVideo(title, embedUrl) {
  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="max-width:600px; padding:12px;">' +
    '<div class="modal-header" style="margin-bottom:8px;">' +
    '<h4 style="font-size:0.95rem; color:#0f172a;">' + title + '</h4>' +
    '<button class="close-btn" onclick="openOnlineCoachingModal()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:8px;">' +
    '<iframe src="' + embedUrl + '?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute; top:0; left:0; width:100%; height:100%;"></iframe>' +
    '</div>' +
    '<div style="margin-top:12px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="openOnlineCoachingModal()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

// 4. Study Material Flip-Book
var sampleFlipPages = [
  { pageNo: 1, title: "Chapter 1: Nutrition in Plants", content: "All living organisms require food. Plants can synthesize food for themselves but animals including humans cannot. The mode of nutrition in which organisms make food themselves from simple substances is called autotrophic nutrition." },
  { pageNo: 2, title: "Photosynthesis Process", content: "Leaves are the food factories of plants. The synthesis of food occurs in leaves. Water and minerals present in the soil are absorbed by roots and transported to the leaves through vessels. Carbon dioxide from air is taken in through stomata." },
  { pageNo: 3, title: "Key Examination Takeaways", content: "Chlorophyll helps leaves capture energy from sunlight. Solar energy is stored as food in leaves. Without photosynthesis, life would not be possible on earth!" }
];

var currentFlipIndex = 0;

function openStudyMaterialModal() {
  currentFlipIndex = 0;
  renderFlipBookScreen();
}

function renderFlipBookScreen() {
  var p = sampleFlipPages[currentFlipIndex];
  var totalP = sampleFlipPages.length;

  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f1f5f9; z-index:3000; display:flex; flex-direction:column;">' +
    '<div style="height:55px; background:var(--primary-navy); color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px;">' +
    '<div><strong>📖 ' + p.title + '</strong></div>' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '<button onclick="closeDynamicView()" style="background:none; border:none; color:white; font-size:1.3rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '</div>' +
    '<div style="flex:1; display:flex; align-items:center; justify-content:center; padding:16px;">' +
    '<div style="background:white; width:100%; max-width:550px; min-height:400px; border-radius:16px; box-shadow:var(--card-shadow); padding:26px; border:1px solid #cbd5e1; display:flex; flex-direction:column; justify-content:space-between;">' +
    '<div>' +
    '<div style="text-align:right; font-size:0.8rem; color:#64748b; font-weight:700;">Page ' + p.pageNo + ' of ' + totalP + '</div>' +
    '<h3 style="color:#2563eb; margin:12px 0;">' + p.title + '</h3>' +
    '<p style="font-size:1.05rem; line-height:1.7; color:#334155;">' + p.content + '</p>' +
    '</div>' +
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; border-top:1px solid #e2e8f0; padding-top:14px;">' +
    '<button class="btn-primary" style="width:auto; padding:8px 16px; background:#64748b;" ' + (currentFlipIndex === 0 ? 'disabled style="opacity:0.4;"' : '') + ' onclick="prevFlipPage()"><i class="fas fa-chevron-left"></i> Previous</button>' +
    '<button class="btn-primary" style="width:auto; padding:8px 16px; background:#2563eb;" ' + (currentFlipIndex === totalP - 1 ? 'disabled style="opacity:0.4;"' : '') + ' onclick="nextFlipPage()">Next <i class="fas fa-chevron-right"></i></button>' +
    '</div>' +
    '</div></div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

function prevFlipPage() {
  if (currentFlipIndex > 0) {
    currentFlipIndex--;
    renderFlipBookScreen();
  }
}

function nextFlipPage() {
  if (currentFlipIndex < sampleFlipPages.length - 1) {
    currentFlipIndex++;
    renderFlipBookScreen();
  }
}

// 5. OMR Printable Sheet Engine (A4 100 Questions)
function openOmrPrintModal() {
  if (typeof toggleDrawer === "function") toggleDrawer();

  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<h3><i class="fas fa-dot-circle" style="color:#d97706;"></i> Print OMR Answer Sheet</h3>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>Header Title (Bold)</label>' +
    '<input type="text" id="omrHeaderTitle" value="ASSENT PUBLIC SCHOOL / AK LEARNING POINT">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>Address / Sub-heading (Optional)</label>' +
    '<input type="text" id="omrAddress" value="Singhiya Khurd, Samastipur, Bihar">' +
    '</div>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">' +
    '<div class="form-group">' +
    '<label>Total Questions (10 to 100)</label>' +
    '<input type="number" id="omrTotalQ" value="100" min="10" max="100">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>Full Marks</label>' +
    '<input type="number" id="omrFullMarks" value="100">' +
    '</div>' +
    '</div>' +
    '<button class="btn-primary" style="background:#059669;" onclick="generateA4OmrSheet()"><i class="fas fa-print"></i> Generate & Print A4 OMR Sheet</button>' +
    '<div style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="closeDynamicView()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

function generateA4OmrSheet() {
  var title = document.getElementById("omrHeaderTitle").value;
  var address = document.getElementById("omrAddress").value;
  var totalQ = parseInt(document.getElementById("omrTotalQ").value) || 100;
  var fullMarks = document.getElementById("omrFullMarks").value || 100;

  var win = window.open("", "_blank");
  var cols = 4;
  var qPerCol = Math.ceil(totalQ / cols);
  var columnsHtml = "";

  for (var c = 0; c < cols; c++) {
    var colRows = "";
    for (var i = 1; i <= qPerCol; i++) {
      var qNum = c * qPerCol + i;
      if (qNum <= totalQ) {
        colRows += '<div class="omr-row">' +
          '<span class="q-num">' + (qNum < 10 ? '0' + qNum : qNum) + '.</span>' +
          '<span class="bubble">A</span>' +
          '<span class="bubble">B</span>' +
          '<span class="bubble">C</span>' +
          '<span class="bubble">D</span>' +
          '</div>';
      }
    }
    columnsHtml += '<div class="omr-column">' + colRows + '</div>';
  }

  win.document.write(
    '<html><head><title>OMR Sheet - ' + title + '</title>' +
    '<style>' +
    '@page { size: A4 portrait; margin: 8mm; }' +
    'body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #111; }' +
    '.omr-container { border: 2px solid #141e37; padding: 10px; height: 98vh; box-sizing: border-box; position: relative; }' +
    '.watermark { position: absolute; top: 38%; left: 16%; font-size: 50pt; color: rgba(0,0,0,0.04); transform: rotate(-30deg); font-weight: bold; pointer-events: none; }' +
    '.header { text-align: center; border-bottom: 2px solid #141e37; padding-bottom: 6px; }' +
    '.header h2 { margin: 0; font-size: 16pt; font-weight: 900; }' +
    '.header p { margin: 2px 0 0; font-size: 9pt; color: #444; }' +
    '.meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 9.5pt; margin: 8px 0; border-bottom: 1.5px solid #141e37; padding-bottom: 8px; }' +
    '.meta-item { border-bottom: 1px dotted #333; height: 18px; }' +
    '.rules-bar { display: flex; justify-content: space-between; font-size: 8pt; background: #f1f5f9; padding: 4px; margin-bottom: 8px; border: 1px solid #cbd5e1; }' +
    '.omr-grid { display: flex; justify-content: space-between; gap: 6px; }' +
    '.omr-column { flex: 1; border: 1px solid #94a3b8; padding: 4px; border-radius: 4px; }' +
    '.omr-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; font-size: 8pt; }' +
    '.q-num { font-weight: bold; width: 22px; }' +
    '.bubble { display: inline-flex; width: 14px; height: 14px; border: 1px solid #141e37; border-radius: 50%; align-items: center; justify-content: center; font-size: 7pt; font-weight: bold; }' +
    '.footer-signs { display: flex; justify-content: space-between; margin-top: 20px; font-size: 9pt; font-weight: bold; }' +
    '</style></head><body>' +
    '<div class="omr-container">' +
    '<div class="watermark">AK LEARNING POINT</div>' +
    '<div class="header">' +
    '<h2>' + title + '</h2>' +
    (address ? '<p>' + address + '</p>' : '') +
    '<div style="font-size:10pt; font-weight:bold; margin-top:4px;">OMR ANSWER SHEET • FULL MARKS: ' + fullMarks + '</div>' +
    '</div>' +
    '<div class="meta-grid">' +
    '<div><strong>Candidate Name:</strong> <div class="meta-item"></div></div>' +
    '<div><strong>Class:</strong> <div class="meta-item"></div></div>' +
    '<div><strong>Roll No:</strong> <div class="meta-item"></div></div>' +
    '<div><strong>Subject:</strong> <div class="meta-item"></div></div>' +
    '<div><strong>Date:</strong> <div class="meta-item"></div></div>' +
    '<div><strong>Invigilator Sign:</strong> <div class="meta-item"></div></div>' +
    '</div>' +
    '<div class="rules-bar">' +
    '<span>• Use Blue / Black Ball Point Pen only.</span>' +
    '<span>• Darken completely: ●</span>' +
    '<span>• Do not fold or make stray marks.</span>' +
    '</div>' +
    '<div class="omr-grid">' + columnsHtml + '</div>' +
    '<div class="footer-signs">' +
    '<span>Signature of Candidate</span>' +
    '<span>Controller of Examinations</span>' +
    '</div></div>' +
    '<script>window.print();<\/script>' +
    '</body></html>'
  );
}

// 6. WhatsApp Community Lead Handler
function openCommunityModal() {
  var modal = document.getElementById("communityModal");
  if (modal) modal.style.display = "flex";
}

function closeCommunityModal() {
  var modal = document.getElementById("communityModal");
  if (modal) modal.style.display = "none";
}

function handleLeadSubmit(e) {
  e.preventDefault();
  var leadData = {
    name: document.getElementById("leadName").value.trim(),
    state: document.getElementById("leadState").value.trim(),
    mobile: document.getElementById("leadMobile").value.trim(),
    className: document.getElementById("leadClass").value
  };

  var leads = getModuleData("ak_community_leads", []);
  leads.push({ name: leadData.name, state: leadData.state, mobile: leadData.mobile, className: leadData.className, timestamp: new Date().toISOString() });
  setModuleData("ak_community_leads", leads);

  if (typeof API !== "undefined" && API.post) {
    API.post("submitLead", leadData);
  }

  alert("Registration Successful! Connecting to official WhatsApp group...");
  closeCommunityModal();
  window.open("https://chat.whatsapp.com/CXwYDb3tRIZ8gSsDuQey0I?s=cl&p=a&mlu=4&ilr=4", "_blank");
}
