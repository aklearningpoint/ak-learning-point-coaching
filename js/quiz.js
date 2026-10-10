// Student Examination Engine, Board-Class Selectors & Scorecard

var selectedBoard = "";
var selectedClass = "";
var selectedSubject = "";
var currentQuiz = null;
var currentQuestionIndex = 0;
var userAnswers = {};
var quizTimerInterval = null;
var remainingSeconds = 0;
var perQuestionTimerInterval = null;
var perQuestionRemaining = 0;

function getQuizStorageData(key, fallback) {
  try {
    var val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setQuizStorageData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

function closeDynamicView() {
  clearInterval(quizTimerInterval);
  clearInterval(perQuestionTimerInterval);
  var dv = document.getElementById("dynamicView");
  if (dv) dv.innerHTML = "";
}

// 1. Board Selection Modal
function openBoardSelectModal() {
  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="text-align:center;">' +
    '<div class="modal-header">' +
    '<h3>Choose Examination Board</h3>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<p style="color:#64748b; font-size:0.9rem; margin-bottom:15px;">Apna Board chuniye aur test series shuru kijiye:</p>' +
    '<div style="display:flex; gap:12px; justify-content:center;">' +
    '<button class="btn-primary" style="background:#1e40af;" onclick="selectBoard(\'CBSE\')">CBSE Board</button>' +
    '<button class="btn-primary" style="background:#d97706;" onclick="selectBoard(\'BSEB\')">BSEB (Bihar Board)</button>' +
    '</div>' +
    '<div style="margin-top:16px; border-top:1px solid #e2e8f0; padding-top:10px;">' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

// 2. Class Selection
function selectBoard(board) {
  selectedBoard = board;
  var classes = ["Play", "Nur", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

  var classCardsHtml = "";
  for (var i = 0; i < classes.length; i++) {
    var c = classes[i];
    var isPre = (c === "Play" || c === "Nur" || c === "LKG" || c === "UKG");
    var icon = isPre ? "fa-shapes" : "fa-graduation-cap";
    var bg = isPre ? "#fce7f3" : "#e0f2fe";
    var color = isPre ? "#ec4899" : "#0284c7";

    classCardsHtml += '<div class="section-card" style="margin-bottom:8px; cursor:pointer;" onclick="selectClass(\'' + c + '\')">' +
      '<div class="section-left">' +
      '<div class="section-icon" style="background:' + bg + '; color:' + color + ';"><i class="fas ' + icon + '"></i></div>' +
      '<div class="section-info"><h3>' + c + '</h3><p>' + (isPre ? 'Foundation Interactive' : 'Academic Exam Preparation') + '</p></div>' +
      '</div>' +
      '<i class="fas fa-chevron-right" style="color:#94a3b8;"></i>' +
      '</div>';
  }

  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="openBoardSelectModal()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<h3>' + board + ' - Select Class</h3>' +
    '</div>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="max-height:60vh; overflow-y:auto;">' + classCardsHtml + '</div>' +
    '<div style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="openBoardSelectModal()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

// 3. Subject Selection
function selectClass(className) {
  selectedClass = className;
  var subjects = ["Science", "Math", "Hindi", "English", "S.St", "G.K", "Computer", "Urdu", "History", "Geography", "Economics", "Civics"];

  var subHtml = "";
  for (var i = 0; i < subjects.length; i++) {
    var s = subjects[i];
    subHtml += '<div class="section-card" style="margin-bottom:8px; cursor:pointer;" onclick="loadQuizListing(\'' + s + '\')">' +
      '<div class="section-left">' +
      '<div class="section-icon" style="background:#ede9fe; color:#7c3aed;"><i class="fas fa-book"></i></div>' +
      '<div class="section-info"><h3>' + s + '</h3><p>Practice Quizzes</p></div>' +
      '</div>' +
      '<i class="fas fa-chevron-right" style="color:#94a3b8;"></i>' +
      '</div>';
  }

  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="selectBoard(\'' + selectedBoard + '\')"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<h3>' + selectedBoard + ' ' + className + ' Subjects</h3>' +
    '</div>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="max-height:60vh; overflow-y:auto;">' + subHtml + '</div>' +
    '<div style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="selectBoard(\'' + selectedBoard + '\')"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

// 4. Live Quiz Listing (Local + Cloud Sync)
function loadQuizListing(subject) {
  selectedSubject = subject;

  var allTeacherQuizzes = getQuizStorageData("ak_teacher_quizzes", []);
  var matchedQuizzes = [];

  for (var i = 0; i < allTeacherQuizzes.length; i++) {
    var q = allTeacherQuizzes[i];
    var bMatch = (!q.board || q.board.toLowerCase() === selectedBoard.toLowerCase());
    var cMatch = (!q.className || q.className.toLowerCase() === selectedClass.toLowerCase());
    var sMatch = (!q.subject || q.subject.toLowerCase() === selectedSubject.toLowerCase());
    if (bMatch && cMatch && sMatch) {
      matchedQuizzes.push(q);
    }
  }

  renderQuizCardsView(matchedQuizzes);

  // Background Cloud Check
  if (typeof API !== "undefined" && API.get) {
    API.get("getQuizzes", { board: selectedBoard, className: selectedClass, subject: selectedSubject })
      .then(function(res) {
        if (res && res.data && res.data.length > 0) {
          var cloudQuizzes = res.data;
          var map = {};
          for (var j = 0; j < matchedQuizzes.length; j++) {
            map[matchedQuizzes[j].id || matchedQuizzes[j].title] = matchedQuizzes[j];
          }
          for (var k = 0; k < cloudQuizzes.length; k++) {
            map[cloudQuizzes[k].id || cloudQuizzes[k].title] = cloudQuizzes[k];
          }
          var combined = Object.values(map);
          renderQuizCardsView(combined);
        }
      })
      .catch(function(e) {});
  }
}

function renderQuizCardsView(quizzes) {
  var dynamicView = document.getElementById("dynamicView");

  if (!quizzes || quizzes.length === 0) {
    dynamicView.innerHTML = '<div class="modal-overlay" style="display:flex;">' +
      '<div class="modal-card" style="text-align:center;">' +
      '<div class="modal-header">' +
      '<h3>' + selectedSubject + ' (' + selectedClass + ')</h3>' +
      '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<p style="margin:20px 0; color:#64748b;">Is class aur subject me abhi koi quiz live nahi hai.</p>' +
      '<div style="display:flex; justify-content:space-between;">' +
      '<button class="nav-pill-btn nav-back-btn" onclick="selectClass(\'' + selectedClass + '\')"><i class="fas fa-arrow-left"></i> Back</button>' +
      '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
      '</div>' +
      '</div></div>';
    return;
  }

  var listHtml = "";
  for (var i = 0; i < quizzes.length; i++) {
    var q = quizzes[i];
    var isDraft = (q.status === "draft");
    var qCount = q.questions ? q.questions.length : 0;
    var timerStr = "";
    if (q.timerType === "per_question") timerStr = " • ⏱️ " + q.timerValue + "s/Q";
    else if (q.timerType === "full") timerStr = " • ⏳ " + q.timerValue + "m";

    var negStr = (q.negativeMarking > 0) ? " • ⚠️ -" + q.negativeMarking : "";
    var rewStr = q.isRewarding ? " • 🎁 Rewarding" : "";

    listHtml += '<div class="section-card" style="margin-bottom:12px; ' + (isDraft ? 'opacity:0.65; border-left:4px solid #94a3b8;' : 'border-left:4px solid #16a34a;') + '">' +
      '<div style="flex:1;">' +
      '<h3 style="font-size:1rem; color:#0f172a;">' + q.title + '</h3>' +
      '<small style="color:#64748b;">' + qCount + ' Questions' + timerStr + negStr + rewStr + '</small>' +
      (isDraft ? '<span style="display:inline-block; font-size:0.75rem; background:#cbd5e1; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:700;">Coming Soon</span>' : '') +
      '<div style="margin-top:8px; display:flex; gap:8px;">' +
      (!isDraft ? '<button class="btn-primary" style="padding:6px 12px; font-size:0.85rem; width:auto; margin:0;" onclick=\'openQuizEntryModalByIndex(' + i + ')\'>Start Test</button>' : '<span style="font-size:0.8rem; color:#64748b; font-weight:600;">Teacher dwara jald publish hoga</span>') +
      '<button onclick="shareQuizWhatsApp(\'' + q.title + '\')" style="background:#25d366; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;"><i class="fab fa-whatsapp"></i></button>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  window.activeLoadedQuizzes = quizzes;

  dynamicView.innerHTML = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="selectClass(\'' + selectedClass + '\')"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<h3>' + selectedBoard + ' ' + selectedClass + ' - ' + selectedSubject + '</h3>' +
    '</div>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="max-height:60vh; overflow-y:auto;">' + listHtml + '</div>' +
    '<div style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="selectClass(\'' + selectedClass + '\')"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';
}

function shareQuizWhatsApp(title) {
  var text = encodeURIComponent(
    "🎯 *AK Learning Point Test Alert!*\nTopic: " + title + "\nClass: " + selectedClass + " (" + selectedBoard + ")\nAbhi attempt karein:\n" + window.location.origin + window.location.pathname
  );
  window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
}

function openQuizEntryModalByIndex(idx) {
  currentQuiz = window.activeLoadedQuizzes[idx];

  var timerText = "No Time Limit";
  if (currentQuiz.timerType === "per_question") timerText = currentQuiz.timerValue + " Seconds Per Question";
  else if (currentQuiz.timerType === "full") timerText = currentQuiz.timerValue + " Minutes Total";

  var negText = (currentQuiz.negativeMarking > 0) ? "-" + currentQuiz.negativeMarking + " per wrong answer" : "None";

  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<h3>Start: ' + currentQuiz.title + '</h3>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:12px; font-size:0.85rem; border:1px solid #e2e8f0;">' +
    '<div>⏱️ <strong>Timer Mode:</strong> ' + timerText + '</div>' +
    '<div>⚠️ <strong>Negative Marking:</strong> ' + negText + '</div>' +
    '</div>' +
    '<form onsubmit="handleStartQuiz(event)">' +
    '<div class="form-group">' +
    '<label>Student Full Name</label>' +
    '<input type="text" id="qzStudentName" required placeholder="Aapka pura naam">' +
    '</div>' +
    '<div class="form-group">' +
    '<label>WhatsApp Number</label>' +
    '<input type="tel" id="qzMobile" required pattern="[0-9]{10}" placeholder="10-digit number">' +
    '</div>' +
    (currentQuiz.isRewarding ? '<div class="form-group"><label>🎁 Rewarding Passkey</label><input type="text" id="qzPasskey" required placeholder="Enter passkey given by teacher"></div>' : '') +
    '<button type="submit" class="btn-primary">Enter Exam Hall</button>' +
    '</form>' +
    '<div style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="loadQuizListing(\'' + selectedSubject + '\')"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

function handleStartQuiz(e) {
  e.preventDefault();
  var name = document.getElementById("qzStudentName").value.trim();
  var mob = document.getElementById("qzMobile").value.trim();

  if (currentQuiz.isRewarding) {
    var inputKey = document.getElementById("qzPasskey").value.trim();
    if (inputKey !== String(currentQuiz.passkey).trim()) {
      alert("Galat Passkey! Teacher dwara diya gaya sahi code bharein.");
      return;
    }
  }

  currentQuiz.participantName = name;
  currentQuiz.participantMobile = mob;
  startActualExam();
}

function startActualExam() {
  currentQuestionIndex = 0;
  userAnswers = {};

  if (typeof SecurityShield !== "undefined" && SecurityShield.activate) {
    SecurityShield.activate(function() {
      submitQuizNow(true);
    });
  }

  if (currentQuiz.timerType === "per_question") {
    startPerQuestionTimer();
  } else if (currentQuiz.timerType === "full") {
    remainingSeconds = (currentQuiz.timerValue || 15) * 60;
    clearInterval(quizTimerInterval);
    quizTimerInterval = setInterval(function() {
      remainingSeconds--;
      var tEl = document.getElementById("quizTimerDisplay");
      if (tEl) {
        var mins = Math.floor(remainingSeconds / 60);
        var secs = remainingSeconds % 60;
        tEl.innerText = mins + ":" + (secs < 10 ? "0" : "") + secs;
      }
      if (remainingSeconds <= 0) {
        clearInterval(quizTimerInterval);
        alert("Time Up! Test submit ho raha hai.");
        submitQuizNow(false);
      }
    }, 1000);
  }

  renderExamScreen();
}

function startPerQuestionTimer() {
  clearInterval(perQuestionTimerInterval);
  perQuestionRemaining = currentQuiz.timerValue || 30;

  perQuestionTimerInterval = setInterval(function() {
    perQuestionRemaining--;
    var tEl = document.getElementById("perQuestionTimerDisplay");
    if (tEl) {
      tEl.innerText = perQuestionRemaining + "s";
    }
    if (perQuestionRemaining <= 0) {
      clearInterval(perQuestionTimerInterval);
      if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        renderExamScreen();
        startPerQuestionTimer();
      } else {
        submitQuizNow(false);
      }
    }
  }, 1000);
}

function renderExamScreen() {
  var q = currentQuiz.questions[currentQuestionIndex];
  var totalQ = currentQuiz.questions.length;

  var timerDisplayHtml = "<span>No Limit</span>";
  if (currentQuiz.timerType === "per_question") {
    timerDisplayHtml = '⏱️ <span id="perQuestionTimerDisplay" style="color:#f59e0b; font-weight:800;">' + perQuestionRemaining + 's</span>';
  } else if (currentQuiz.timerType === "full") {
    timerDisplayHtml = '⏳ <span id="quizTimerDisplay">--:--</span>';
  }

  var optionsHtml = "";
  for (var oIdx = 0; oIdx < q.options.length; oIdx++) {
    var opt = q.options[oIdx];
    var isChecked = (userAnswers[currentQuestionIndex] === oIdx);
    optionsHtml += '<div onclick="selectQuizOption(' + oIdx + ')" style="padding:12px 14px; border:2px solid ' + (isChecked ? '#2563eb' : '#e2e8f0') + '; background:' + (isChecked ? '#eff6ff' : 'white') + '; border-radius:10px; cursor:pointer; display:flex; align-items:center; gap:10px;">' +
      '<input type="radio" name="optRadio" ' + (isChecked ? 'checked' : '') + ' style="cursor:pointer;">' +
      '<span>' + opt + '</span>' +
      '</div>';
  }

  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:white; z-index:3000; display:flex; flex-direction:column;">' +
    '<div style="height:55px; background:var(--primary-navy); color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px;">' +
    '<strong style="color:#fbbf24;">' + currentQuiz.title + '</strong>' +
    '<div style="display:flex; align-items:center; gap:12px;">' +
    '<span style="background:rgba(255,255,255,0.15); padding:4px 8px; border-radius:4px; font-weight:700;">' + timerDisplayHtml + '</span>' +
    '<button onclick="submitQuizNow(false)" style="background:#dc2626; color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer;">Submit</button>' +
    '</div>' +
    '</div>' +
    '<div style="flex:1; overflow-y:auto; padding:20px; max-width:700px; margin:0 auto; width:100%;">' +
    '<div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:700; color:#64748b;">' +
    '<span>Question ' + (currentQuestionIndex + 1) + ' of ' + totalQ + '</span>' +
    (currentQuiz.negativeMarking > 0 ? '<span style="color:#ef4444; font-size:0.85rem;">Penalty: -' + currentQuiz.negativeMarking + '</span>' : '') +
    '</div>' +
    '<h3 style="font-size:1.15rem; margin-bottom:15px; color:#1e293b;">' + q.question + '</h3>' +
    '<div style="display:flex; flex-direction:column; gap:10px;">' + optionsHtml + '</div>' +
    '</div>' +
    '<div style="height:60px; border-top:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between; padding:0 16px;">' +
    '<button class="btn-primary" style="width:auto; background:#64748b;" ' + (currentQuestionIndex === 0 ? 'disabled style="opacity:0.5;"' : '') + ' onclick="prevQuestion()">Previous</button>' +
    (currentQuestionIndex === totalQ - 1 ? '<button class="btn-primary" style="width:auto; background:#16a34a;" onclick="submitQuizNow(false)">Finish & Submit</button>' : '<button class="btn-primary" style="width:auto;" onclick="nextQuestion()">Next</button>') +
    '</div>' +
    '</div>';

  document.getElementById("dynamicView").innerHTML = html;
}

function selectQuizOption(optIndex) {
  userAnswers[currentQuestionIndex] = optIndex;
  renderExamScreen();
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    if (currentQuiz.timerType === "per_question") startPerQuestionTimer();
    renderExamScreen();
  }
}

function nextQuestion() {
  if (currentQuestionIndex < currentQuiz.questions.length - 1) {
    currentQuestionIndex++;
    if (currentQuiz.timerType === "per_question") startPerQuestionTimer();
    renderExamScreen();
  }
}

function submitQuizNow(isAutoSubmit) {
  clearInterval(quizTimerInterval);
  clearInterval(perQuestionTimerInterval);
  if (typeof SecurityShield !== "undefined" && SecurityShield.deactivate) {
    SecurityShield.deactivate();
  }

  var correctCount = 0;
  var wrongCount = 0;
  var totalQ = currentQuiz.questions.length;
  var negMark = parseFloat(currentQuiz.negativeMarking || 0);

  for (var idx = 0; idx < currentQuiz.questions.length; idx++) {
    var q = currentQuiz.questions[idx];
    var ans = userAnswers[idx];
    if (ans !== undefined) {
      if (ans === q.correctAnswer) correctCount++;
      else wrongCount++;
    }
  }

  var deduction = (wrongCount * negMark);
  var netScore = Math.max(0, (correctCount - deduction)).toFixed(2);
  var pct = ((netScore / totalQ) * 100).toFixed(1);

  var attemptRecord = {
    id: "att_" + Date.now(),
    quizId: currentQuiz.id,
    quizTitle: currentQuiz.title,
    studentName: currentQuiz.participantName || "Anonymous",
    mobile: currentQuiz.participantMobile || "",
    correctCount: correctCount,
    wrongCount: wrongCount,
    score: netScore,
    totalMarks: totalQ,
    percentage: pct,
    answers: userAnswers,
    timestamp: new Date().toISOString()
  };

  // Local Save
  var allAttempts = getQuizStorageData("ak_student_attempts", []);
  allAttempts.unshift(attemptRecord);
  setQuizStorageData("ak_student_attempts", allAttempts);

  // Background Cloud Sync to Spreadsheet
  if (typeof API !== "undefined" && API.post) {
    API.post("submitQuizAttempt", attemptRecord);
  }

  renderScorecardView(netScore, totalQ, pct, correctCount, wrongCount, deduction);
}

function renderScorecardView(netScore, totalMarks, pct, correct, wrong, deduction) {
  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="text-align:center; max-width:480px;">' +
    '<div class="modal-header">' +
    '<h3>Test Result & Scorecard</h3>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div style="background:var(--primary-navy); color:white; padding:20px; border-radius:12px; margin-bottom:15px;">' +
    '<h2 style="color:#fbbf24; margin-bottom:4px;">AK Learning Point Coaching</h2>' +
    '<p style="font-size:0.85rem; opacity:0.8;">Student: <strong>' + currentQuiz.participantName + '</strong></p>' +
    '<hr style="border:none; border-top:1px solid rgba(255,255,255,0.2); margin:12px 0;">' +
    '<div style="font-size:2.2rem; font-weight:800; color:#4ade80;">' + netScore + ' / ' + totalMarks + '</div>' +
    '<div style="font-size:0.95rem; font-weight:600; margin-top:4px;">Accuracy: ' + pct + '%</div>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-top:12px; font-size:0.8rem; background:rgba(255,255,255,0.1); padding:8px; border-radius:6px;">' +
    '<div style="color:#86efac;">✅ Correct: ' + correct + '</div>' +
    '<div style="color:#fca5a5;">❌ Wrong: ' + wrong + '</div>' +
    '<div style="color:#fde047;">⚠️ Penalty: -' + deduction.toFixed(2) + '</div>' +
    '</div>' +
    '</div>' +
    '<div style="display:flex; flex-direction:column; gap:10px;">' +
    '<button class="btn-primary" style="background:#25d366;" onclick="shareResultWhatsApp(\'' + netScore + '\', \'' + totalMarks + '\', \'' + pct + '\')"><i class="fab fa-whatsapp"></i> Share on WhatsApp</button>' +
    '<button class="btn-primary" style="background:#2563eb;" onclick="openSolutionVerification()"><i class="fas fa-check-circle"></i> Verify Answers & Solutions</button>' +
    '<button class="btn-primary" style="background:#64748b;" onclick="goHome()"><i class="fas fa-home"></i> Back to Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

function shareResultWhatsApp(score, total, pct) {
  var text = encodeURIComponent(
    "🏆 *AK Learning Point Scorecard!*\nTopic: " + currentQuiz.title + "\nScore: " + score + "/" + total + " (" + pct + "% Accuracy)\nApp: " + window.location.origin + window.location.pathname
  );
  window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
}

function openSolutionVerification() {
  var solHtml = "";
  for (var idx = 0; idx < currentQuiz.questions.length; idx++) {
    var q = currentQuiz.questions[idx];
    var userChoice = userAnswers[idx];
    var isCorrect = (userChoice === q.correctAnswer);
    solHtml += '<div style="padding:12px; border-bottom:1px solid #e2e8f0; text-align:left;">' +
      '<strong>Q' + (idx + 1) + ': ' + q.question + '</strong>' +
      '<div style="margin-top:6px; font-size:0.9rem;">' +
      '<p style="color:' + (isCorrect ? '#16a34a' : '#dc2626') + ';">Aapka Answer: ' + (userChoice !== undefined ? q.options[userChoice] : 'Not Attempted') + '</p>' +
      '<p style="color:#16a34a; font-weight:600;">Sahi Answer: ' + q.options[q.correctAnswer] + '</p>' +
      '</div></div>';
  }

  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="max-height:85vh; overflow-y:auto;">' +
    '<div class="modal-header">' +
    '<h3>Answer Solutions</h3>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    solHtml +
    '<div style="margin-top:15px; display:flex; justify-content:space-between;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="closeDynamicView()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}
