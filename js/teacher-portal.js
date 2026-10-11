// Function: Har quiz ke actual attempts count karna (ID + Title Smart Match)
function getQuizAttemptCount(quiz) {
  if (!quiz) return 0;
  var allStored = [];
  try {
    allStored = JSON.parse(localStorage.getItem("ak_student_attempts") || "[]");
  } catch(e) {
    allStored = [];
  }

  var targetTitle = (quiz.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  var matches = allStored.filter(function(a) {
    var idMatch = a.quizId && quiz.id && (String(a.quizId).trim() === String(quiz.id).trim());
    var aTitle = (a.quizTitle || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    var titleMatch = targetTitle && aTitle && (targetTitle.includes(aTitle) || aTitle.includes(targetTitle));
    return idMatch || titleMatch;
  });

  return matches.length;
}
// Teacher Portal: Smart Parser, Test Preview Mode, Live Leaderboards & Actual A4 Quiz Print Engine

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
    '<div style="height:55px; background:var(--primary-navy); color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px;">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<i class="fas fa-chalkboard-teacher" style="color:#fbbf24;"></i>' +
    '<strong>Teacher Control Panel</strong>' +
    '</div>' +
    '<div style="display:flex; align-items:center; gap:10px;">' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '<button onclick="closeDynamicView()" style="background:none; border:none; color:white; font-size:1.3rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '</div>' +
    '<div style="background:white; border-bottom:1px solid #e2e8f0; display:flex; overflow-x:auto; padding:8px 12px; gap:8px;">' +
    '<button class="btn-primary" style="width:auto; padding:6px 14px; font-size:0.85rem; margin:0;" onclick="showTeacherSection(\'maker\')">+ Create Quiz (Smart Parser)</button>' +
    '<button class="btn-primary" style="width:auto; padding:6px 14px; font-size:0.85rem; margin:0; background:#0284c7;" onclick="showTeacherSection(\'list\')">Manage Quizzes & Leaderboards</button>' +
    '</div>' +
    '<div id="teacherContentBody" style="flex:1; overflow-y:auto; padding:16px; max-width:850px; margin:0 auto; width:100%;"></div>' +
    '</div>';

  document.getElementById("dynamicView").innerHTML = html;
  showTeacherSection('list');
}

function showTeacherSection(sec) {
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
      '<div style="background:#f1f5f9; padding:12px; border-radius:8px; margin-left:0; margin-right:0; margin-top:12px; margin-bottom:12px; border:1px solid #cbd5e1;">' +
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

function renderTeacherQuizList() {
  var container = document.getElementById("teacherContentBody");

  if (!activeTeacherQuizzes || activeTeacherQuizzes.length === 0) {
    container.innerHTML = '<div class="modal-card" style="text-align:center; padding:30px;">' +
      '<h3>No Quizzes Available</h3>' +
      '<p style="color:#64748b; margin:10px 0;">Create your first test using the Smart Parser!</p>' +
      '<button class="btn-primary" onclick="showTeacherSection(\'maker\')">+ Create Quiz</button>' +
      '</div>';
    return;
  }

  var html = '<h3 style="color:var(--primary-navy); margin-bottom:12px;">Active Quiz List</h3>';

  for (var idx = 0; idx < activeTeacherQuizzes.length; idx++) {
    var q = activeTeacherQuizzes[idx];
    var isDraft = (q.status === 'draft');
    var borderColor = isDraft ? '#94a3b8' : '#16a34a';
    var qCount = q.questions ? q.questions.length : 0;
var attCount = getQuizAttemptCount(q);
    
    html += '<div class="modal-card" style="max-width:100%; margin-bottom:12px; border-left: 5px solid ' + borderColor + ';">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">' +
      '<div>' +
      '<h3 style="color:var(--primary-navy); margin-bottom:4px;">' + q.title + '</h3>' +
      '<div style="font-size:0.85rem; color:#64748b;">' +
      '<strong>' + q.board + '</strong> | <strong>' + q.className + '</strong> | <strong>' + q.subject + '</strong> • ' + qCount + ' Questions ' +
      (q.isRewarding ? '<span style="background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:4px; font-weight:700; margin-left:6px;">🎁 Code: ' + (q.passkey || '') + '</span>' : '') +
      '<span style="background:' + (isDraft ? '#e2e8f0' : '#dcfce7') + '; color:' + (isDraft ? '#475569' : '#16a34a') + '; padding:2px 6px; border-radius:4px; font-weight:700; margin-left:4px;">' +
      (isDraft ? 'Draft (Coming Soon)' : 'Published Live') +
      '</span>' +
      '</div>' +
      '</div>' +
      '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
      '<button onclick="startTeacherTestPreview(' + idx + ')" class="btn-primary" style="width:auto; padding:5px 10px; font-size:0.8rem; margin:0; background:#4f46e5;" title="Test without saving marks"><i class="fas fa-play-circle"></i> Test / Preview</button>' +
      '<button onclick="togglePublishStatus(' + idx + ')" class="btn-primary" style="width:auto; padding:5px 10px; font-size:0.8rem; margin:0; background:' + (isDraft ? '#16a34a' : '#64748b') + ';">' +
      (isDraft ? 'Publish' : 'Unpublish') +
      '</button>' +
      '<button onclick="openQuizLeaderboard(' + idx + ')" class="btn-primary" style="width:auto; padding:5px 10px; font-size:0.8rem; margin:0; background:#0284c7;">Leaderboard</button>' +
      '<button onclick="openQuizEditorModal(' + idx + ')" class="btn-primary" style="width:auto; padding:5px 10px; font-size:0.8rem; margin:0; background:#d97706;">Edit Keys</button>' +
      '<button onclick="printActualQuizByIndex(' + idx + ')" class="btn-primary" style="width:auto; padding:5px 10px; font-size:0.8rem; margin:0; background:#059669;" title="Print A4 Question Paper"><i class="fas fa-print"></i> Print</button>' +
      '<button onclick="deleteQuizPermanently(' + idx + ')" class="btn-primary" style="width:auto; padding:5px 10px; font-size:0.8rem; margin:0; background:#dc2626;"><i class="fas fa-trash"></i></button>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  container.innerHTML = html;
}

// 2. Teacher Testing / Preview Mode
function startTeacherTestPreview(idx) {
  var quiz = activeTeacherQuizzes[idx];
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    alert("Is quiz me koi question nahi hai!");
    return;
  }

  isTeacherTestingMode = true;
  currentQuiz = JSON.parse(JSON.stringify(quiz));
  currentQuiz.participantName = "Teacher (Preview Mode)";
  currentQuiz.participantMobile = "0000000000";

  startActualExam();
}

function handleTimerTypeChange() {
  var type = document.getElementById("tqTimerType").value;
  var grp = document.getElementById("timerValueGroup");
  var lbl = document.getElementById("timerValueLabel");
  var val = document.getElementById("tqTimerValue");

  if (type === "none") {
    grp.style.display = "none";
  } else if (type === "per_question") {
    grp.style.display = "block";
    lbl.innerText = "Time Per Question (Seconds)";
    val.value = "30";
  } else {
    grp.style.display = "block";
    lbl.innerText = "Total Duration (Minutes)";
    val.value = "15";
  }
}

function toggleRewardingField() {
  var chk = document.getElementById("tqIsRewarding").checked;
  document.getElementById("rewardingPassContainer").style.display = chk ? "block" : "none";
}

var parsedQuestionsBuffer = [];

function parseRawQuestions() {
  var text = document.getElementById("tqRawText").value.trim();
  if (!text) {
    alert("Kripya questions paste karein!");
    return;
  }

  parsedQuestionsBuffer = [];
  var lines = text.split("\n");
  var currentQ = null;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;

    if (/^(Q\d+[\.:\)]|\d+[\.:\)]|Question\s*\d+[\.:\)]|प्रश्न\s*\d+[\.:\)]|\([ivx]+\)|[ivx]+[\.:\)])/i.test(line)) {
      if (currentQ) parsedQuestionsBuffer.push(currentQ);
      currentQ = {
        question: line.replace(/^(Q\d+[\.:\)]|\d+[\.:\)]|Question\s*\d+[\.:\)]|प्रश्न\s*\d+[\.:\)]|\([ivx]+\)|[ivx]+[\.:\)])/i, "").trim(),
        options: [],
        correctAnswer: 0
      };
    } else if (/^(\([a-d]\)|[a-d][\.:\)]|\[[a-d]\]|\([क-घ]\)|[क-घ][\.:\)])/i.test(line)) {
      if (currentQ) {
        currentQ.options.push(line.replace(/^(\([a-d]\)|[a-d][\.:\)]|\[[a-d]\]|\([क-घ]\)|[क-घ][\.:\)])/i, "").trim());
      }
    } else if (/^(Ans|Answer|उत्तर)[\s\.:]+/i.test(line)) {
      if (currentQ) {
        if (/b|\(b\)|ख/i.test(line)) currentQ.correctAnswer = 1;
        else if (/c|\(c\)|ग/i.test(line)) currentQ.correctAnswer = 2;
        else if (/d|\(d\)|घ/i.test(line)) currentQ.correctAnswer = 3;
        else currentQ.correctAnswer = 0;
      }
    }
  }

  if (currentQ) parsedQuestionsBuffer.push(currentQ);
  renderParsedPreview();
}

function renderParsedPreview() {
  var container = document.getElementById("parsedPreviewArea");
  if (!parsedQuestionsBuffer || parsedQuestionsBuffer.length === 0) {
    container.innerHTML = '<p style="color:#dc2626;">Koi questions parse nahi ho sake! Format check karein.</p>';
    return;
  }

  var html = '<div style="background:#f1f5f9; padding:12px; border-radius:8px;">' +
    '<h4 style="color:#16a34a; margin-bottom:8px;">Parsed Questions (' + parsedQuestionsBuffer.length + '):</h4>';

  for (var i = 0; i < parsedQuestionsBuffer.length; i++) {
    var q = parsedQuestionsBuffer[i];
    html += '<div style="padding:8px 0; border-bottom:1px solid #cbd5e1; font-size:0.9rem;">' +
      '<strong>Q' + (i + 1) + ': ' + q.question + '</strong><br>' +
      '<small>Options: ' + q.options.join(" | ") + ' (Correct: Opt ' + (q.correctAnswer + 1) + ')</small>' +
      '</div>';
  }

  html += '<div style="display:flex; gap:10px; margin-top:12px;">' +
    '<button class="btn-primary" style="background:#64748b;" onclick="saveParsedQuiz(\'draft\')">Save as Draft (Coming Soon)</button>' +
    '<button class="btn-primary" style="background:#16a34a;" onclick="saveParsedQuiz(\'published\')">Publish Live</button>' +
    '</div></div>';

  container.innerHTML = html;
}

function saveParsedQuiz(status) {
  var isRewarding = document.getElementById("tqIsRewarding").checked;
  var passkey = document.getElementById("tqPasskey").value.trim();

  if (isRewarding && !passkey) {
    alert("Rewarding Quiz ke liye Passkey code dalna mandatory hai!");
    return;
  }

  var newQuiz = {
    id: "qz_" + Date.now(),
    title: document.getElementById("tqTitle").value.trim() || "Untitled Quiz",
    board: document.getElementById("tqBoard").value,
    className: document.getElementById("tqClass").value,
    subject: document.getElementById("tqSubject").value,
    timerType: document.getElementById("tqTimerType").value,
    timerValue: parseInt(document.getElementById("tqTimerValue").value || 15),
    negativeMarking: parseFloat(document.getElementById("tqNegativeMarking").value || 0),
    isRewarding: isRewarding,
    passkey: passkey,
    status: status,
    questions: parsedQuestionsBuffer
  };

  activeTeacherQuizzes = getTeacherData("ak_teacher_quizzes", []);
  activeTeacherQuizzes.unshift(newQuiz);
  setTeacherData("ak_teacher_quizzes", activeTeacherQuizzes);

  if (typeof API !== "undefined" && API.post) {
    API.post("saveQuiz", newQuiz);
  }

  alert("Quiz successfully saved as " + status + "!");
  showTeacherSection('list');
}

function togglePublishStatus(idx) {
  var quiz = activeTeacherQuizzes[idx];
  quiz.status = (quiz.status === 'published') ? 'draft' : 'published';
  setTeacherData("ak_teacher_quizzes", activeTeacherQuizzes);

  if (typeof API !== "undefined" && API.post) {
    API.post("updateQuizMeta", { id: quiz.id, status: quiz.status });
  }
  renderTeacherQuizList();
}

function deleteQuizPermanently(idx) {
  var quiz = activeTeacherQuizzes[idx];
  if (confirm("Kya aap \"" + quiz.title + "\" ko permanently delete karna chahte hain?")) {
    activeTeacherQuizzes.splice(idx, 1);
    setTeacherData("ak_teacher_quizzes", activeTeacherQuizzes);
    if (typeof API !== "undefined" && API.post) {
      API.post("deleteQuiz", { id: quiz.id });
    }
    renderTeacherQuizList();
  }
}

function openQuizLeaderboard(idx) {
  var quiz = activeTeacherQuizzes[idx];
  currentLeaderboardQuiz = quiz;

  var dynamicView = document.getElementById("dynamicView");
  dynamicView.innerHTML = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="max-width:720px;">' +
    '<div class="modal-header">' +
    '<div>' +
    '<h3 style="color:var(--primary-navy); margin:0;">Leaderboard: ' + quiz.title + '</h3>' +
    '<small style="color:#64748b;">' + quiz.className + ' • ' + quiz.board + '</small>' +
    '</div>' +
    '<button class="close-btn" onclick="renderTeacherDashboard()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div id="leaderboardListContainer" style="margin-top:10px; max-height:60vh; overflow-y:auto;">' +
    '<p style="text-align:center;">Loading participant results...</p>' +
    '</div>' +
    '<div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="renderTeacherDashboard()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

// Direct Safe Storage Reader (LocalStorage + Fallback)
  var allStored = [];
  try {
    allStored = JSON.parse(localStorage.getItem("ak_student_attempts") || "[]");
    if (!allStored.length && typeof getTeacherData === "function") {
      allStored = getTeacherData("ak_student_attempts", []) || [];
    }
  } catch(e) {
    allStored = [];
  }

  var localAttempts = allStored.filter(function(a) { 
    return String(a.quizId).trim() === String(quiz.id).trim(); 
  });
  currentLeaderboardParticipants = localAttempts;

  var container = document.getElementById("leaderboardListContainer");
  if (!currentLeaderboardParticipants || currentLeaderboardParticipants.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">Abhi kisi student ne is quiz ko attempt nahi kiya hai.</p>';
    return;
  }

  currentLeaderboardParticipants.sort(function(a, b) { return Number(b.score) - Number(a.score); });

  var tbHtml = '<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">' +
    '<thead><tr style="background:#f1f5f9; text-align:left; border-bottom:2px solid #cbd5e1;">' +
    '<th style="padding:6px;">Rank</th><th style="padding:6px;">Student Name</th><th style="padding:6px;">Mobile</th><th style="padding:6px;">Score</th><th style="padding:6px;">Accuracy</th><th style="padding:6px;">Action</th>' +
    '</tr></thead><tbody>';

  for (var pIdx = 0; pIdx < currentLeaderboardParticipants.length; pIdx++) {
    var p = currentLeaderboardParticipants[pIdx];
    tbHtml += '<tr style="border-bottom:1px solid #e2e8f0;">' +
      '<td style="padding:6px; font-weight:700;">#' + (pIdx + 1) + '</td>' +
      '<td style="padding:6px; font-weight:600; color:var(--brand-blue); cursor:pointer;" onclick="viewParticipantAnswersByIndex(' + pIdx + ')">' + p.studentName + ' <i class="fas fa-external-link-alt" style="font-size:0.7rem;"></i></td>' +
      '<td style="padding:6px;">' + (p.mobile || 'N/A') + '</td>' +
      '<td style="padding:6px; font-weight:700; color:#16a34a;">' + p.score + '/' + p.totalMarks + '</td>' +
      '<td style="padding:6px;">' + p.percentage + '%</td>' +
      '<td style="padding:6px;"><button onclick="deleteParticipantAttempt(' + pIdx + ', ' + idx + ')" style="background:#fee2e2; color:#dc2626; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button></td>' +
      '</tr>';
  }

  tbHtml += '</tbody></table>';
  container.innerHTML = tbHtml;
}

function viewParticipantAnswersByIndex(pIdx) {
  var participant = currentLeaderboardParticipants[pIdx];
  var quiz = currentLeaderboardQuiz;
  if (!participant || !quiz) return;

  var solHtml = "";
  for (var idx = 0; idx < quiz.questions.length; idx++) {
    var q = quiz.questions[idx];
    var userChoice = participant.answers ? participant.answers[idx] : undefined;
    var isCorrect = (userChoice === q.correctAnswer);
    solHtml += '<div style="padding:8px 0; border-bottom:1px solid #e2e8f0; font-size:0.85rem;">' +
      '<strong>Q' + (idx + 1) + ': ' + q.question + '</strong>' +
      '<div style="margin-top:4px;">' +
      '<span style="color:' + (isCorrect ? '#16a34a' : '#dc2626') + '; font-weight:600;">Student Answer: ' + (userChoice !== undefined ? q.options[userChoice] : 'Unattempted') + '</span> | ' +
      '<span style="color:#16a34a;">Correct Answer: ' + q.options[q.correctAnswer] + '</span>' +
      '</div></div>';
  }

  document.getElementById("dynamicView").innerHTML += '<div class="modal-overlay" style="display:flex; z-index:3500;" id="stSheetModal">' +
    '<div class="modal-card" style="max-height:85vh; overflow-y:auto; max-width:600px;">' +
    '<div class="modal-header">' +
    '<div>' +
    '<h4 style="margin:0; color:var(--primary-navy);">' + participant.studentName + '\'s Attempt Sheet</h4>' +
    '<small style="color:#64748b;">Mobile: ' + participant.mobile + ' | Score: ' + participant.score + '/' + participant.totalMarks + '</small>' +
    '</div>' +
    '<button class="close-btn" onclick="document.getElementById(\'stSheetModal\').remove()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    solHtml +
    '</div></div>';
}

function deleteParticipantAttempt(pIdx, quizIdx) {
  if (confirm("Kya aap is record ko leaderboard se delete karna chahte hain?")) {
    var p = currentLeaderboardParticipants[pIdx];
    var attempts = getTeacherData("ak_student_attempts", []);
    var filtered = [];
    for (var i = 0; i < attempts.length; i++) {
      if (!(attempts[i].quizId === p.quizId && (attempts[i].mobile === p.mobile || attempts[i].id === p.id))) {
        filtered.push(attempts[i]);
      }
    }
    setTeacherData("ak_student_attempts", filtered);
    openQuizLeaderboard(quizIdx);
  }
}

var editingQuizBuffer = null;

function openQuizEditorModal(idx) {
  editingQuizBuffer = JSON.parse(JSON.stringify(activeTeacherQuizzes[idx]));

  var qListHtml = "";
  for (var qIdx = 0; qIdx < editingQuizBuffer.questions.length; qIdx++) {
    var q = editingQuizBuffer.questions[qIdx];
    var optInputs = "";
    for (var oIdx = 0; oIdx < q.options.length; oIdx++) {
      optInputs += '<div>' +
        '<label style="font-size:0.75rem;">Option ' + (oIdx + 1) + '</label>' +
        '<input type="text" value="' + q.options[oIdx] + '" onchange="updateOptionText(' + qIdx + ',' + oIdx + ', this.value)" style="font-size:0.85rem; padding:6px;">' +
        '</div>';
    }

    qListHtml += '<div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid #cbd5e1;">' +
      '<div class="form-group" style="margin-bottom:6px;">' +
      '<label>Q' + (qIdx + 1) + ' Question Text</label>' +
      '<input type="text" value="' + q.question + '" onchange="updateQuestionText(' + qIdx + ', this.value)">' +
      '</div>' +
      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:6px;">' + optInputs + '</div>' +
      '<div>' +
      '<label style="font-size:0.8rem; font-weight:700; color:#16a34a;">Correct Option Index (0 = A, 1 = B, 2 = C, 3 = D):</label>' +
      '<select onchange="updateCorrectAnswer(' + qIdx + ', this.value)" style="padding:6px; border-radius:6px; font-weight:700;">' +
      '<option value="0" ' + (q.correctAnswer === 0 ? 'selected' : '') + '>Option A (1)</option>' +
      '<option value="1" ' + (q.correctAnswer === 1 ? 'selected' : '') + '>Option B (2)</option>' +
      '<option value="2" ' + (q.correctAnswer === 2 ? 'selected' : '') + '>Option C (3)</option>' +
      '<option value="3" ' + (q.correctAnswer === 3 ? 'selected' : '') + '>Option D (4)</option>' +
      '</select>' +
      '</div>' +
      '</div>';
  }

  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="max-width:750px; max-height:90vh; overflow-y:auto;">' +
    '<div class="modal-header">' +
    '<h3>Edit Quiz & Answer Key: ' + editingQuizBuffer.title + '</h3>' +
    '<button class="close-btn" onclick="renderTeacherDashboard()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">' +
    '<div class="form-group">' +
    '<label>Title</label>' +
    '<input type="text" id="editQuizTitle" value="' + editingQuizBuffer.title + '">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>Rewarding Passkey</label>' +
    '<input type="text" id="editQuizPasskey" value="' + (editingQuizBuffer.passkey || '') + '">' +
    '</div>' +
    '</div>' +
    '<h4 style="color:var(--primary-navy); margin-bottom:8px;">Questions & Answer Keys:</h4>' +
    qListHtml +
    '<div style="display:flex; gap:10px; margin-top:12px;">' +
    '<button class="btn-primary" style="background:#16a34a;" onclick="saveEditedQuizChanges(' + idx + ')">Save Changes & Recalculate Student Scores</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

function updateQuestionText(qIdx, val) {
  editingQuizBuffer.questions[qIdx].question = val;
}

function updateOptionText(qIdx, oIdx, val) {
  editingQuizBuffer.questions[qIdx].options[oIdx] = val;
}

function updateCorrectAnswer(qIdx, val) {
  editingQuizBuffer.questions[qIdx].correctAnswer = parseInt(val);
}

function saveEditedQuizChanges(idx) {
  editingQuizBuffer.title = document.getElementById("editQuizTitle").value;
  editingQuizBuffer.passkey = document.getElementById("editQuizPasskey").value;

  activeTeacherQuizzes[idx] = editingQuizBuffer;
  setTeacherData("ak_teacher_quizzes", activeTeacherQuizzes);

  var allAttempts = getTeacherData("ak_student_attempts", []);
  var negMark = parseFloat(editingQuizBuffer.negativeMarking || 0);
  var totalQ = editingQuizBuffer.questions.length;

  for (var i = 0; i < allAttempts.length; i++) {
    var att = allAttempts[i];
    if (att.quizId === editingQuizBuffer.id && att.answers) {
      var correct = 0;
      var wrong = 0;
      for (var qIndex = 0; qIndex < editingQuizBuffer.questions.length; qIndex++) {
        var uAns = att.answers[qIndex];
        if (uAns !== undefined) {
          if (uAns === editingQuizBuffer.questions[qIndex].correctAnswer) correct++;
          else wrong++;
        }
      }
      var penalty = wrong * negMark;
      var net = Math.max(0, correct - penalty).toFixed(2);
      att.score = net;
      att.totalMarks = totalQ;
      att.percentage = ((net / totalQ) * 100).toFixed(1);
    }
  }

  setTeacherData("ak_student_attempts", allAttempts);

  if (typeof API !== "undefined" && API.post) {
    API.post("updateQuizAndRecalculate", { quiz: editingQuizBuffer });
  }

  alert("Quiz updated successfully! Sabhi bacchon ke scores recalculate ho chuke hain.");
  renderTeacherDashboard();
}

// 5. Actual Dynamic Quiz A4 Print (2 Columns + Sub-Columns + Separate Answer Key)
function printActualQuizByIndex(idx) {
  var quiz = activeTeacherQuizzes[idx];
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    alert("Is quiz me print karne ke liye questions nahi hain!");
    return;
  }

  var questions = quiz.questions;
  var qHtml = "";
  var keyHtml = "";

  var optLabels = ["(A)", "(B)", "(C)", "(D)"];

  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    var optGrid = "";
    for (var o = 0; o < q.options.length; o++) {
      optGrid += '<div><strong>' + optLabels[o] + '</strong> ' + q.options[o] + '</div>';
    }

    qHtml += '<div class="q-box">' +
      '<div class="q-title"><strong>Q' + (i + 1) + '.</strong> ' + q.question + '</div>' +
      '<div class="opt-grid">' + optGrid + '</div>' +
      '</div>';

    keyHtml += '<div style="font-size:10pt; padding:4px 0; border-bottom:1px dotted #ccc;">' +
      '<strong>Q' + (i + 1) + ':</strong> ' + optLabels[q.correctAnswer] + ' ' + (q.options[q.correctAnswer] || '') +
      '</div>';
  }

  var printWindow = window.open("", "_blank");
  printWindow.document.write(
    '<html><head><title>' + quiz.title + ' - Examination Paper</title>' +
    '<style>' +
    '@page { size: A4 portrait; margin: 10mm; }' +
    'body { font-family: "Times New Roman", serif; font-size: 10.5pt; color: #111; margin: 0; padding: 0; }' +
    '.header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }' +
    '.header h2 { margin: 0; font-size: 16pt; font-weight: bold; }' +
    '.header p { margin: 2px 0 0; font-size: 10pt; }' +
    '.meta-bar { display: flex; justify-content: space-between; font-weight: bold; font-size: 9.5pt; margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 4px; }' +
    '.two-columns { column-count: 2; column-gap: 20px; column-rule: 1px solid #cbd5e1; }' +
    '.q-box { break-inside: avoid; margin-bottom: 12px; }' +
    '.q-title { font-size: 10pt; margin-bottom: 4px; line-height: 1.3; }' +
    '.opt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 9.5pt; padding-left: 12px; }' +
    '.watermark { position: fixed; top: 40%; left: 20%; font-size: 55pt; color: rgba(0,0,0,0.04); transform: rotate(-30deg); font-weight: bold; pointer-events: none; }' +
    '.page-break { page-break-before: always; }' +
    '</style></head><body>' +
    '<div class="watermark">AK LEARNING POINT</div>' +
    '<div class="header">' +
    '<h2>AK LEARNING POINT COACHING / ASSENT PUBLIC SCHOOL</h2>' +
    '<p><strong>' + quiz.title + '</strong> • ' + quiz.className + ' (' + quiz.board + ') • Subject: ' + quiz.subject + '</p>' +
    '</div>' +
    '<div class="meta-bar">' +
    '<span>Name: ____________________</span>' +
    '<span>Roll No: _____</span>' +
    '<span>Time: ' + (quiz.timerType === "full" ? quiz.timerValue + " Mins" : "Standard") + '</span>' +
    '<span>F.M: ' + questions.length + '</span>' +
    '</div>' +
    '<div class="two-columns">' + qHtml + '</div>' +
    '<div class="page-break"></div>' +
    '<div class="header">' +
    '<h2>CONFIDENTIAL TEACHER ANSWER KEY & SOLUTIONS</h2>' +
    '<p>' + quiz.title + ' • ' + quiz.className + '</p>' +
    '</div>' +
    '<div style="max-width:550px; margin:0 auto; padding-top:10px;">' + keyHtml + '</div>' +
    '<script>window.print();<\/script>' +
    '</body></html>'
  );
}
