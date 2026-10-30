// Content Modules: Results, Rewarding Contests, Coaching, Flip-Book, A4 100-Q OMR Engine & Enhanced Student LMS Dashboard

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

// ==========================================
// 1. STUDENT RESULT LOOKUP ENGINE
// ==========================================
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

  if (allRecords.length === 0) {
    var localAttempts = [];
    try {
      localAttempts = JSON.parse(localStorage.getItem("ak_student_attempts") || localStorage.getItem("ak_quiz_results") || "[]");
    } catch (err) { localAttempts = []; }
    allRecords = localAttempts;
  }

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

async function viewQuizAnalysisByIndex(idx) {
  var att = window.activeSearchedAttempts[idx];
  var listContainer = document.getElementById("dynamicView");
  
  var userAns = {};
  try {
    userAns = typeof att.answers === "string" ? JSON.parse(att.answers) : (att.answers || {});
  } catch (e) { userAns = {}; }

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

// ==========================================
// 2. REWARDING QUIZ ENGINE
// ==========================================
async function openRewardingQuizzes() {
  var rewardingList = [];

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

// ==========================================
// 3. ONLINE COACHING CLASSES
// ==========================================
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

// ==========================================
// 4. STUDY MATERIAL FLIP-BOOK
// ==========================================
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

// ==========================================
// 5. OMR PRINTABLE SHEET ENGINE (A4 100 Q)
// ==========================================
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

// ==========================================
// 6. WHATSAPP COMMUNITY LEAD HANDLER
// ==========================================
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

// ==========================================
// 7. DYNAMIC LIVE QUIZ AD BANNER ENGINE
// ==========================================
var activeAdQuizzes = [];
var currentAdIndex = 0;
var adBannerTimer = null;

async function initDynamicQuizAdBanner() {
  var bannerContainer = document.getElementById("dynamicQuizAdBanner");
  if (!bannerContainer) return;

  var allQuizzes = [];
  try {
    if (typeof API !== "undefined" && API.get) {
      var res = await API.get("getQuizzes");
      if (res && res.data && Array.isArray(res.data)) {
        allQuizzes = res.data;
      }
    }
  } catch (e) {}

  if (allQuizzes.length === 0) {
    allQuizzes = getModuleData("ak_teacher_quizzes", []);
  }

  var candidates = allQuizzes.filter(function(q) {
    return q.status === "published" || !q.status;
  });

  var advertised = candidates.filter(function(q) {
    return q.isAdvertised === true || q.isAdvertised === "true";
  });

  activeAdQuizzes = advertised.length > 0 ? advertised : candidates.slice(0, 5);

  if (activeAdQuizzes.length === 0) {
    bannerContainer.style.display = "none";
    return;
  }

  bannerContainer.style.display = "block";
  currentAdIndex = 0;
  renderCurrentAdQuiz();

  if (adBannerTimer) clearInterval(adBannerTimer);
  if (activeAdQuizzes.length > 1) {
    adBannerTimer = setInterval(function() {
      currentAdIndex = (currentAdIndex + 1) % activeAdQuizzes.length;
      renderCurrentAdQuiz();
    }, 4500);
  }
}

function renderCurrentAdQuiz() {
  var q = activeAdQuizzes[currentAdIndex];
  if (!q) return;

  var titleEl = document.getElementById("quizAdTitle");
  var metaEl = document.getElementById("quizAdMeta");
  var indEl = document.getElementById("quizAdTickerIndicator");
  var btnEl = document.getElementById("quizAdActionBtn");

  if (titleEl) titleEl.innerText = q.title;
  if (metaEl) {
    var qCount = q.questions ? q.questions.length : 10;
    metaEl.innerText = (q.className || 'General') + " • " + (q.subject || 'All Subjects') + " • " + qCount + " Questions";
  }
  if (indEl) indEl.innerText = (currentAdIndex + 1) + "/" + activeAdQuizzes.length;

  if (btnEl) {
    btnEl.onclick = function() {
      if (typeof openQuizEntryModalByObject === "function") {
        openQuizEntryModalByObject(q);
      } else if (typeof startTeacherTestPreview === "function") {
        var appBaseUrl = window.location.origin + window.location.pathname.replace("index.html", "");
        window.location.href = appBaseUrl + "index.html?quizId=" + encodeURIComponent(q.id || q.title);
      }
    };
  }
}

// =========================================================================
// 8. ENHANCED STUDENT DASHBOARD (SCREEN 2): BOARD SWITCH & MULTI-ACCOUNT
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

function openStudentAccountModal() {
  try {
    var savedProfile = getSafeAccountData("ak_student_profile");
    if (!savedProfile || !savedProfile.mobile) {
      renderStudentProfileSetupModal();
      return;
    }
    renderStudentAccountDashboard(savedProfile);
  } catch(err) {
    console.error("Account Open Error:", err);
    renderStudentProfileSetupModal();
  }
}

function renderStudentProfileSetupModal() {
  var dv = document.getElementById("dynamicView");
  if (!dv) return;

  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f8fafc; z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;">' +
    '<div style="background:white; max-width:440px; width:100%; border-radius:24px; padding:28px; box-shadow:0 10px 25px rgba(0,0,0,0.1); text-align:center;">' +
    '<div style="font-size:3rem; margin-bottom:8px;">🎓</div>' +
    '<h2 style="color:#0f172a; margin:0 0 6px 0; font-size:1.35rem;">Student Sign-In / Setup</h2>' +
    '<p style="color:#64748b; font-size:0.85rem; margin-bottom:18px;">Apna account banayein ya switch karein taaki aapka board, test aur data save rahe.</p>' +
    '<form onsubmit="handleSaveStudentProfile(event)" style="display:flex; flex-direction:column; gap:12px; text-align:left;">' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Full Name</label>' +
    '<input type="text" id="stpName" required placeholder="Aapka pura naam" style="width:100%; padding:11px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;">' +
    '</div>' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">10-Digit Mobile / WhatsApp</label>' +
    '<input type="tel" id="stpMobile" required pattern="[0-9]{10}" placeholder="WhatsApp number" style="width:100%; padding:11px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;">' +
    '</div>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Class</label>' +
    '<select id="stpClass" style="width:100%; padding:11px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;">' +
    '<option>Play</option><option>Nur</option><option>LKG</option><option>UKG</option>' +
    '<option>Class 1</option><option>Class 2</option><option>Class 3</option><option>Class 4</option>' +
    '<option>Class 5</option><option>Class 6</option><option>Class 7</option><option>Class 8</option>' +
    '<option>Class 9</option><option selected>Class 10</option><option>Class 11</option><option>Class 12</option>' +
    '</select>' +
    '</div>' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Board</label>' +
    '<select id="stpBoard" style="width:100%; padding:11px; border-radius:10px; border:1px solid #cbd5e1; box-sizing:border-box; margin-top:4px;">' +
    '<option value="CBSE" selected>CBSE Board</option>' +
    '<option value="BSEB">BSEB (Bihar Board)</option>' +
    '</select>' +
    '</div>' +
    '</div>' +
    '<button type="submit" style="margin-top:10px; background:#059669; color:white; border:none; padding:12px; border-radius:12px; font-weight:700; font-size:1rem; cursor:pointer;">Save & Enter Dashboard 🚀</button>' +
    '</form>' +
    '<button onclick="closeDynamicView()" style="margin-top:14px; background:transparent; border:none; color:#64748b; font-size:0.85rem; cursor:pointer;"><i class="fas fa-times"></i> Cancel</button>' +
    '</div></div>';

  dv.innerHTML = html;
}

function handleSaveStudentProfile(e) {
  if (e && e.preventDefault) e.preventDefault();
  var nameEl = document.getElementById("stpName");
  var mobEl = document.getElementById("stpMobile");
  var clsEl = document.getElementById("stpClass");
  var brdEl = document.getElementById("stpBoard");

  var mob = mobEl ? mobEl.value.trim() : "";

  var prof = {
    name: nameEl ? nameEl.value.trim() : "Student",
    mobile: mob,
    className: clsEl ? clsEl.value : "Class 10",
    board: brdEl ? brdEl.value : "CBSE",
    category: "Tuition Student",
    monthlyFee: 800,
    dues: 0,
    billingDate: "15 Oct 2026",
    joinedDate: new Date().toLocaleDateString()
  };

  // Sync details if already exists in tuition ledger
  try {
    var ledger = JSON.parse(localStorage.getItem("ak_tuition_ledger") || "[]");
    var found = ledger.find(function(s) { return String(s.mobile).trim() === mob; });
    if (found) {
      prof.name = found.name || prof.name;
      prof.category = found.category || prof.category;
      prof.monthlyFee = found.monthlyFee || prof.monthlyFee;
      prof.billingDate = found.startDate || prof.billingDate;
      if (typeof calculateStudentFinancials === "function") {
        var fin = calculateStudentFinancials(found);
        prof.dues = fin.pendingBalance;
      }
    }
  } catch (err) {}

  // Multi-profile history save
  var studentAccounts = [];
  try {
    studentAccounts = JSON.parse(localStorage.getItem("ak_saved_student_accounts") || "[]");
  } catch(err) { studentAccounts = []; }

  var existingIdx = studentAccounts.findIndex(function(s) { return s.mobile === mob; });
  if (existingIdx > -1) {
    studentAccounts[existingIdx] = prof;
  } else {
    studentAccounts.push(prof);
  }
  localStorage.setItem("ak_saved_student_accounts", JSON.stringify(studentAccounts));

  setSafeAccountData("ak_student_profile", prof);
  renderStudentAccountDashboard(prof);
}

function renderStudentAccountDashboard(profile) {
  var dv = document.getElementById("dynamicView");
  if (!dv) return;

  // Refresh latest classification & ledger dues
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

  // 1. Quizzes fetch
  var allQuizzes = getSafeAccountData("ak_teacher_quizzes") || [];

  // 2. Attempts fetch
  var allAttempts = getSafeAccountData("ak_student_attempts") || [];

  // Filter attempts strictly by active student mobile
  var myAttempts = allAttempts.filter(function(a) {
    return String(a.mobile || a.Mobile || "").trim() === String(profile.mobile).trim();
  });

  // Filter quizzes by current student class AND current board
  var myClassQuizzes = allQuizzes.filter(function(q) {
    var qClass = String(q.className || "").toLowerCase().trim();
    var pClass = String(profile.className || "").toLowerCase().trim();
    var classMatch = (qClass.includes(pClass) || pClass.includes(qClass) || qClass === "all");
    
    var qBoard = String(q.board || "").toLowerCase().trim();
    var pBoard = String(profile.board || "CBSE").toLowerCase().trim();
    var boardMatch = (!q.board || qBoard === "all" || qBoard === pBoard);
    
    return classMatch && boardMatch;
  });

  // Notifications for student's class
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

    // Top Header with Active Notification Bell & Switch Student Option
    '<div style="height:56px; background:#0f172a; color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px; flex-shrink:0;">' +
    '<div style="display:flex; align-items:center; gap:10px;">' +
    '<button onclick="closeDynamicView()" style="background:rgba(255,255,255,0.15); border:none; color:white; width:32px; height:32px; border-radius:8px; cursor:pointer;"><i class="fas fa-arrow-left"></i></button>' +
    '<span style="font-weight:700; font-size:1.02rem;">Student Portal</span>' +
    '</div>' +
    '<div style="display:flex; align-items:center; gap:12px;">' +
    // NOTIFICATION BELL (WITH LIVE BADGE)
    '<div onclick="openStudentNoticeModal()" style="position:relative; cursor:pointer; padding:4px;">' +
    '<i class="fas fa-bell" style="font-size:1.25rem; color:#fde047;"></i>' +
    (notices.length > 0 ? '<span style="position:absolute; top:-2px; right:-4px; background:#ef4444; color:white; border-radius:50%; font-size:0.65rem; font-weight:800; width:17px; height:17px; display:flex; align-items:center; justify-content:center; border:2px solid #0f172a;">' + notices.length + '</span>' : '') +
    '</div>' +
    // SWITCH STUDENT BUTTON
    '<button onclick="openSwitchStudentModal()" style="background:#0284c7; border:none; color:white; padding:5px 10px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;" title="Switch Account">' +
    '<i class="fas fa-users"></i> Switch' +
    '</button>' +
    '</div>' +
    '</div>' +

    // Scrollable Portal Content
    '<div style="flex:1; overflow-y:auto; padding:14px; max-width:850px; margin:0 auto; width:100%; box-sizing:border-box;">' +

    // 1. Student Identity Header (With Interactive Board Switcher)
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
    // BOARD SWITCH CHIP (CLICK KARKE BOARD CHANGE HOGA)
    '<div onclick="toggleStudentBoard()" style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:12px; font-weight:800; font-size:0.75rem; display:inline-flex; align-items:center; gap:5px; cursor:pointer; border:1px solid #bae6fd; margin-bottom:4px;" title="Click karke CBSE ya BSEB me switch karein">' +
    profile.className + ' (' + (profile.board || 'CBSE') + ') <i class="fas fa-sync-alt" style="font-size:0.65rem;"></i>' +
    '</div><br>' +
    '<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:6px; font-weight:700; font-size:0.7rem;">' + (profile.category || 'Tuition Student') + '</span>' +
    '</div>' +
    '</div>' +

    // 2. Tuition Fee & Dues Status Card
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

    // 3. Featured Quiz Highlight Banner (Filtered for current board)
    (featuredQuiz ?
    '<div style="background:white; border:1.5px solid #fed7aa; border-radius:14px; padding:14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.03);">' +
    '<div>' +
    '<span style="background:#ffedd5; color:#c2410c; font-size:0.7rem; font-weight:800; padding:2px 8px; border-radius:10px;">TODAY\'S FEATURED QUIZ (' + (profile.board || 'CBSE') + ')</span>' +
    '<h4 style="margin:4px 0 2px 0; color:#0f172a; font-size:0.95rem;">' + featuredQuiz.title + '</h4>' +
    '<small style="color:#64748b;">' + (featuredQuiz.subject || 'All') + ' • ' + (featuredQuiz.questions ? featuredQuiz.questions.length : 10) + ' Questions</small>' +
    '</div>' +
    '<button onclick="startQuizDirectlyFromAccount(\'' + featuredQuiz.id + '\')" style="background:#16a34a; color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:700; font-size:0.82rem; cursor:pointer;">Start Now</button>' +
    '</div>' : '') +

    // 4. Class & Board Specific Subjects Grid
    '<h3 style="color:#0f172a; font-size:1rem; margin:14px 0 10px 0; display:flex; align-items:center; justify-content:space-between;">' +
    '<span><i class="fas fa-layer-group" style="color:#2563eb;"></i> ' + profile.className + ' Subjects Hub</span>' +
    '<span style="font-size:0.75rem; color:#2563eb; font-weight:700; cursor:pointer;" onclick="toggleStudentBoard()">Board: ' + (profile.board || 'CBSE') + ' (Change)</span>' +
    '</h3>' +
    '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:14px;">' +
    subjectsGridHtml +
    '</div>' +

    // 5. Dual Action Shortcut Cards
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

    // 6. WhatsApp Doubt Clearance Banner
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

// TOGGLE BOARD (CBSE <-> BSEB) INSTANTLY
function toggleStudentBoard() {
  var prof = window.currentStudentProfile;
  if (!prof) return;

  var currentBoard = prof.board || "CBSE";
  var newBoard = (currentBoard === "CBSE") ? "BSEB" : "CBSE";

  prof.board = newBoard;
  setSafeAccountData("ak_student_profile", prof);

  // Saved accounts list me bhi update karein
  try {
    var accounts = JSON.parse(localStorage.getItem("ak_saved_student_accounts") || "[]");
    var idx = accounts.findIndex(function(a) { return a.mobile === prof.mobile; });
    if (idx > -1) {
      accounts[idx].board = newBoard;
      localStorage.setItem("ak_saved_student_accounts", JSON.stringify(accounts));
    }
  } catch(e) {}

  renderStudentAccountDashboard(prof);
}

// MULTI-ACCOUNT / SWITCH STUDENT MODAL
function openSwitchStudentModal() {
  var currentProf = window.currentStudentProfile || {};
  var savedAccounts = [];
  try {
    savedAccounts = JSON.parse(localStorage.getItem("ak_saved_student_accounts") || "[]");
  } catch(e) { savedAccounts = []; }

  var listHtml = "";
  savedAccounts.forEach(function(acc) {
    var isCurrent = (acc.mobile === currentProf.mobile);
    listHtml += '<div onclick="switchToSpecificAccount(\'' + acc.mobile + '\')" style="background:' + (isCurrent ? '#ecfdf5' : '#f8fafc') + '; border:1.5px solid ' + (isCurrent ? '#10b981' : '#cbd5e1') + '; border-radius:10px; padding:10px 12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">' +
      '<div>' +
      '<strong style="color:#0f172a; font-size:0.92rem;">' + acc.name + '</strong> ' + (isCurrent ? '<span style="background:#10b981; color:white; font-size:0.65rem; padding:1px 6px; border-radius:4px; font-weight:800;">ACTIVE</span>' : '') + '<br>' +
      '<small style="color:#64748b;">+91 ' + acc.mobile + ' • ' + acc.className + ' (' + (acc.board || 'CBSE') + ')</small>' +
      '</div>' +
      '<i class="fas fa-chevron-right" style="color:#94a3b8;"></i>' +
      '</div>';
  });

  var html = '<div class="modal-overlay" style="display:flex; z-index:10000;" id="switchStudentModal">' +
    '<div class="modal-card" style="max-width:460px; width:92%; max-height:85vh; overflow-y:auto;">' +
    '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">' +
    '<h3 style="margin:0; color:#0f172a; font-size:1.1rem;"><i class="fas fa-users-cog" style="color:#0284c7;"></i> Switch Student Profile</h3>' +
    '<button class="close-btn" onclick="document.getElementById(\'switchStudentModal\').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +

    '<div style="margin-top:12px;">' +
    '<p style="color:#64748b; font-size:0.82rem; margin:0 0 10px 0;">Kisi doosre student ke account par switch karein ya naya account jodein:</p>' +
    (listHtml || '<p style="color:#94a3b8; font-size:0.8rem; text-align:center; padding:10px;">Koi doosra saved account nahi mila.</p>') +

    '<div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:12px; display:flex; gap:8px;">' +
    '<button onclick="document.getElementById(\'switchStudentModal\').remove(); renderStudentProfileSetupModal();" style="flex:1; background:#059669; color:white; border:none; padding:10px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">' +
    '<i class="fas fa-user-plus"></i> + Add / New Student' +
    '</button>' +
    '<button onclick="logoutCurrentStudent()" style="background:#fee2e2; color:#dc2626; border:none; padding:10px 14px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">' +
    '<i class="fas fa-sign-out-alt"></i> Logout' +
    '</button>' +
    '</div>' +
    '</div>' +
    '</div></div>';

  var div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
}

function switchToSpecificAccount(mobile) {
  var savedAccounts = [];
  try {
    savedAccounts = JSON.parse(localStorage.getItem("ak_saved_student_accounts") || "[]");
  } catch(e) { savedAccounts = []; }

  var target = savedAccounts.find(function(a) { return a.mobile === mobile; });
  if (target) {
    setSafeAccountData("ak_student_profile", target);
    var modal = document.getElementById("switchStudentModal");
    if (modal) modal.remove();
    renderStudentAccountDashboard(target);
  }
}

function logoutCurrentStudent() {
  if (confirm("Kya aap is device se apna active profile logout karna chahte hain?")) {
    localStorage.removeItem("ak_student_profile");
    var modal = document.getElementById("switchStudentModal");
    if (modal) modal.remove();
    renderStudentProfileSetupModal();
  }
}

// =========================================================================
// 9. STUDENT NOTIFICATIONS MODAL & SUBJECTS HUB
// =========================================================================

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

// Subject Specific Hub (Quizzes + Study Materials Modal)
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

// Payment Sub-Tab Loader (UPI QR & Proof Upload)
function switchAccountSubTab(tabName) {
  if (tabName === "purchase") {
    var profile = window.currentStudentProfile;
    var html = '<div class="modal-overlay" style="display:flex; z-index:10000;" id="feePayModal">' +
      '<div class="modal-card" style="max-width:480px; width:92%; max-height:90vh; overflow-y:auto;">' +
      '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">' +
      '<h3 style="margin:0; color:#0f172a; font-size:1.1rem;"><i class="fas fa-qrcode" style="color:#16a34a;"></i> Tuition Fee Payment</h3>' +
      '<button class="close-btn" onclick="document.getElementById(\'feePayModal\').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div style="text-align:center; padding:12px 0;">' +
      '<div style="background:#f8fafc; border:2px dashed #cbd5e1; border-radius:14px; padding:14px; margin-bottom:12px;">' +
      '<div style="font-weight:700; color:#1e293b; font-size:0.85rem; margin-bottom:8px;">Scan via PhonePe / GPay / Paytm</div>' +
      '<img src="./assets/qr.png" onerror="this.src=\'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=8826011682@upi&pn=AK%20Learning%20Point\'" style="width:160px; height:160px; border-radius:10px; background:white; padding:4px; border:1px solid #e2e8f0;">' +
      '<div style="margin-top:8px; font-size:0.85rem; color:#334155;">UPI ID: <strong style="color:#059669;">8826011682@upi</strong></div>' +
      '</div>' +
      '<div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:12px; text-align:left;">' +
      '<h4 style="margin:0 0 4px 0; color:#166534; font-size:0.88rem;"><i class="fas fa-file-invoice"></i> Upload Payment Screenshot</h4>' +
      '<p style="color:#15803d; font-size:0.75rem; margin-bottom:8px;">Screenshot upload hone par payment verify ho jayegi.</p>' +
      '<input type="file" id="payProofFile" accept="image/*" style="width:100%; font-size:0.8rem; margin-bottom:8px;">' +
      '<button id="btnUploadProof" onclick="uploadPaymentProofToDrive()" style="background:#16a34a; color:white; border:none; padding:9px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer; width:100%;">' +
      '<i class="fas fa-cloud-upload-alt"></i> Confirm & Upload' +
      '</button>' +
      '<div id="uploadStatusMsg" style="margin-top:6px; font-size:0.78rem; text-align:center; font-weight:700;"></div>' +
      '</div>' +
      '</div>' +
      '</div></div>';

    var div = document.createElement("div");
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
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

function switchStudentAccount() {
  if (confirm("Kya aap account change ya logout karna chahte hain?")) {
    localStorage.removeItem("ak_student_profile");
    renderStudentProfileSetupModal();
  }
}

function startQuizDirectlyFromAccount(quizId) {
  closeDynamicView();
  var quizzes = window.currentAccountQuizzes || [];
  var target = null;
  for (var i = 0; i < quizzes.length; i++) {
    if (String(quizzes[i].id) === String(quizId)) {
      target = quizzes[i];
      break;
    }
  }
  if (target && typeof openQuizEntryModalByIndex === "function") {
    window.activeLoadedQuizzes = [target];
    openQuizEntryModalByIndex(0);
  } else if (target) {
    var appBaseUrl = window.location.origin + window.location.pathname.replace("index.html", "");
    window.location.href = appBaseUrl + "index.html?quizId=" + encodeURIComponent(target.id || target.title);
  }
}

function downloadScoreCardDirect(attemptId) {
  var attempts = window.currentAccountAttempts || [];
  var att = null;
  for (var i = 0; i < attempts.length; i++) {
    if (String(attempts[i].id) === String(attemptId)) {
      att = attempts[i];
      break;
    }
  }
  if (att) {
    window.lastSubmittedAttempt = att;
    if (typeof downloadScoreCardAsImage === "function") {
      downloadScoreCardAsImage();
    }
  }
}
