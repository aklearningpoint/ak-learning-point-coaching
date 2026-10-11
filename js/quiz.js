// Student Examination Engine, Board-Class Strict Filters, One-Time Lock & Ultra-Stylish Scorecard

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
var isTeacherTestingMode = false;

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
  isTeacherTestingMode = false;
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

// 4. Strict Matching & Loading (Loophole Fixed)
function loadQuizListing(subject) {
  selectedSubject = subject;

  var allTeacherQuizzes = getQuizStorageData("ak_teacher_quizzes", []);
  var matchedQuizzes = [];

  for (var i = 0; i < allTeacherQuizzes.length; i++) {
    var q = allTeacherQuizzes[i];
    var bMatch = (String(q.board || "").trim().toLowerCase() === String(selectedBoard).trim().toLowerCase());
    var cMatch = (String(q.className || "").trim().toLowerCase() === String(selectedClass).trim().toLowerCase());
    var sMatch = (String(q.subject || "").trim().toLowerCase() === String(selectedSubject).trim().toLowerCase());
    if (bMatch && cMatch && sMatch) {
      matchedQuizzes.push(q);
    }
  }

  renderQuizCardsView(matchedQuizzes);

  // Background Cloud Sync with Strict Filters
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
            var cq = cloudQuizzes[k];
            var bValid = (String(cq.board || "").trim().toLowerCase() === String(selectedBoard).trim().toLowerCase());
            var cValid = (String(cq.className || "").trim().toLowerCase() === String(selectedClass).trim().toLowerCase());
            var sValid = (String(cq.subject || "").trim().toLowerCase() === String(selectedSubject).trim().toLowerCase());
            if (bValid && cValid && sValid) {
              map[cq.id || cq.title] = cq;
            }
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
      '<button onclick="shareQuizWhatsAppByIndex(' + i + ')" style="background:#25d366; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;" title="Share on WhatsApp"><i class="fab fa-whatsapp"></i></button>' +
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

// WhatsApp Share with Live App Link
function shareQuizWhatsAppByIndex(idx) {
  var q = window.activeLoadedQuizzes[idx];
  // Direct Quiz Link with quizId Parameter
  var quizLink = window.location.origin + window.location.pathname + "?quizId=" + encodeURIComponent(q.id);
  var text = encodeURIComponent(
    "🎯 *AK Learning Point Coaching - Test Alert!*\n\n" +
    "📝 *Topic:* " + q.title + "\n" +
    "🎓 *Class:* " + q.className + " (" + q.board + ")\n" +
    "📚 *Subject:* " + q.subject + "\n" +
    "⏱️ *Duration:* " + (q.timerType === "full" ? q.timerValue + " Minutes" : "Standard") + "\n\n" +
    "👉 *Test Shuru Karne Ke Liye Yahan Click Karein:*\n" + quizLink + "\n\n" +
    "⚠️ *Note:* Ek student sirf ek hi baar test de sakta hai!"
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
    '<label>WhatsApp Number (Only 1 Attempt Allowed)</label>' +
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

  // 1-Time Attempt Check (Teacher Testing Mode Bypass)
  if (!isTeacherTestingMode) {
    var previousAttempts = getQuizStorageData("ak_student_attempts", []);
    for (var i = 0; i < previousAttempts.length; i++) {
      if (previousAttempts[i].quizId === currentQuiz.id && String(previousAttempts[i].mobile).trim() === mob) {
        alert("⚠️ Aap yeh quiz pehle hi de chuke hain! Har student sirf ek baar test de sakta hai.");
        return;
      }
    }
  }

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

  if (!isTeacherTestingMode && typeof SecurityShield !== "undefined" && SecurityShield.activate) {
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
    '<div style="display:flex; align-items:center; gap:8px;">' +
    (isTeacherTestingMode ? '<span style="background:#dc2626; color:white; font-size:0.75rem; padding:2px 6px; border-radius:4px; font-weight:bold;">TEACHER PREVIEW</span>' : '') +
    '<strong style="color:#fbbf24;">' + currentQuiz.title + '</strong>' +
    '</div>' +
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

function submitQuiz(e) {
  if (e && e.preventDefault) e.preventDefault();

  try {
    // 1. Participant Details Fetch
    var studentName = (document.getElementById("studentName")?.value || 
                       document.getElementById("quizStudentName")?.value || 
                       (typeof currentQuiz !== "undefined" && currentQuiz?.participantName) || 
                       "Student").trim();

    var studentMobile = (document.getElementById("studentMobile")?.value || 
                         document.getElementById("quizStudentMobile")?.value || 
                         (typeof currentQuiz !== "undefined" && currentQuiz?.participantMobile) || 
                         "").trim();

    // 2. Score & Answers Calculation
    var correctCount = 0;
    var wrongCount = 0;
    var deduction = 0;
    var questions = window.currentQuizQuestions || (typeof currentQuiz !== "undefined" && currentQuiz?.questions) || [];
    var totalQ = questions.length || 1;

    questions.forEach(function(q, idx) {
      var selected = (window.userAnswers && window.userAnswers[idx] !== undefined) ? window.userAnswers[idx] : null;
      if (selected !== null && selected !== undefined) {
        if (selected === q.correctAnswer) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    var netScore = correctCount;
    var pct = ((netScore / totalQ) * 100).toFixed(1);
    var activeQuizId = (typeof currentQuiz !== "undefined" && currentQuiz?.id) || window.activeQuizId || "default_quiz";
    var quizTitle = (typeof currentQuiz !== "undefined" && currentQuiz?.title) || "Practice Test";

    // 3. Save to Local Storage (Instant Leaderboard & Scorecard)
    var attemptRecord = {
      id: "att_" + Date.now(),
      quizId: activeQuizId,
      quizTitle: quizTitle,
      name: studentName,
      studentName: studentName,
      mobile: studentMobile,
      correctCount: correctCount,
      wrongCount: wrongCount,
      score: netScore,
      total: totalQ,
      totalMarks: totalQ,
      percentage: pct,
      answers: window.userAnswers || {},
      timestamp: new Date().toISOString()
    };

    var allAttempts = [];
    try {
      allAttempts = JSON.parse(localStorage.getItem("ak_student_attempts") || "[]");
      if (!Array.isArray(allAttempts)) allAttempts = [];
    } catch (err) {
      allAttempts = [];
    }

    allAttempts.unshift(attemptRecord);
    localStorage.setItem("ak_student_attempts", JSON.stringify(allAttempts));
    localStorage.setItem("ak_quiz_results", JSON.stringify(allAttempts));

    console.log("Result saved successfully:", attemptRecord);

    // 4. API Backend Push (agar available ho)
    if (typeof API !== "undefined" && API.post) {
      API.post("submitQuizAttempt", attemptRecord);
    }

    // 5. Security Shield Deactivate
    if (window.SecurityShield && typeof window.SecurityShield.deactivate === "function") {
      window.SecurityShield.deactivate();
    }

    // 6. Scorecard Modal Render
    if (typeof renderScorecardView === "function") {
      renderScorecardView(netScore, totalQ, pct, correctCount, wrongCount, deduction);
    } else if (typeof showScorecardModal === "function") {
      showScorecardModal(attemptRecord);
    } else {
      alert("Test Submitted!\nName: " + studentName + "\nScore: " + netScore + "/" + totalQ);
    }

  } catch (error) {
    console.error("Critical Quiz Submit Error:", error);
    alert("Submission error: " + error.message);
  }
}

// 3. Ultra-Stylish Scorecard (Cursive Name, Trophy / Big Sad Emoji & Quotes)
function renderScorecardView(netScore, totalMarks, pct, correct, wrong, deduction) {
  var pctVal = parseFloat(pct);
  var badgeIcon = "";
  var appreciationTitle = "";
  var appreciationQuote = "";
  var bannerBg = "";

  if (pctVal >= 80) {
    badgeIcon = '<div style="font-size:3.5rem; margin-bottom:5px; animation: bounce 1s infinite;">🏆</div>';
    appreciationTitle = '🌟 Adbhut! Outstanding Topper!';
    appreciationQuote = '"Aapne kamaal kar diya! Aapki mehnat aur lagan ne aapko top rank par pahunchaya hai. Shaabash!"';
    bannerBg = 'linear-gradient(135deg, #1e3a8a, #065f46)';
  } else if (pctVal >= 50) {
    badgeIcon = '<div style="font-size:3.2rem; margin-bottom:5px;">👍</div>';
    appreciationTitle = 'Bahut Accha Prayas!';
    appreciationQuote = '"Aap sahi disha me hain! Agli baar 90%+ ka target rakhein aur thoda aur revision karein."';
    bannerBg = 'linear-gradient(135deg, #1e3a8a, #3b82f6)';
  } else {
    badgeIcon = '<div style="font-size:3.8rem; margin-bottom:5px;">🥺</div>';
    appreciationTitle = 'Nirash Na Hon, Aur Mehnat Karein!';
    appreciationQuote = '"Asafalta ek chunauti hai, ise sweekar karo! Kahan kami reh gayi dekho aur sudhaar karo. Mehnat kijiye, agli baar top karein!"';
    bannerBg = 'linear-gradient(135deg, #7f1d1d, #b91c1c)';
  }

  var html = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card" style="text-align:center; max-width:480px; border-radius:24px; padding:24px;">' +
    '<div class="modal-header" style="border:none; margin-bottom:8px;">' +
    '<h3 style="font-size:1.1rem; color:#0f172a;">Official Examination Result</h3>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    (isTeacherTestingMode ? '<div style="background:#fee2e2; color:#dc2626; padding:6px; border-radius:8px; font-weight:bold; font-size:0.85rem; margin-bottom:10px;">⚠️ TEACHER TESTING MODE: Score NOT saved in Database</div>' : '') +
    '<div style="background:' + bannerBg + '; color:white; padding:22px; border-radius:20px; box-shadow:0 10px 25px rgba(0,0,0,0.15); margin-bottom:16px;">' +
    badgeIcon +
    '<h2 style="color:#fbbf24; margin:0 0 4px; font-size:1.3rem; letter-spacing:0.5px;">AK Learning Point Coaching</h2>' +
    '<div style="margin-top:6px; font-size:0.9rem; opacity:0.9;">Student Candidate:</div>' +
    '<div style="font-family:\'Brush Script MT\', \'Dancing Script\', cursive, serif; font-size:2.2rem; color:#ffffff; text-shadow:1px 2px 4px rgba(0,0,0,0.4); margin:2px 0 8px;">' +
    (currentQuiz.participantName || "Anonymous") +
    '</div>' +
    '<div style="font-size:0.85rem; opacity:0.85; margin-bottom:12px;">' + currentQuiz.title + '</div>' +
    '<div style="background:rgba(255,255,255,0.15); backdrop-filter:blur(5px); border-radius:14px; padding:12px; margin:10px 0;">' +
    '<div style="font-size:2.4rem; font-weight:900; color:#4ade80;">' + netScore + ' / ' + totalMarks + '</div>' +
    '<div style="font-size:1rem; font-weight:700; color:#f8fafc;">Accuracy: ' + pct + '%</div>' +
    '</div>' +
    '<div style="font-size:0.95rem; font-weight:700; color:#fde047; margin-top:8px;">' + appreciationTitle + '</div>' +
    '<p style="font-style:italic; font-size:0.85rem; color:#e2e8f0; margin-top:6px; line-height:1.4;">' + appreciationQuote + '</p>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-top:14px; font-size:0.8rem; background:rgba(0,0,0,0.25); padding:8px; border-radius:10px;">' +
    '<div style="color:#86efac;">✅ Correct: ' + correct + '</div>' +
    '<div style="color:#fca5a5;">❌ Wrong: ' + wrong + '</div>' +
    '<div style="color:#fde047;">⚠️ Penalty: -' + deduction.toFixed(2) + '</div>' +
    '</div>' +
    '</div>' +
    '<div style="display:flex; flex-direction:column; gap:10px;">' +
    '<button class="btn-primary" style="background:#25d366; font-size:1rem;" onclick="shareResultWhatsApp(\'' + netScore + '\', \'' + totalMarks + '\', \'' + pct + '\')"><i class="fab fa-whatsapp"></i> Share Scorecard on WhatsApp</button>' +
    '<button class="btn-primary" style="background:#2563eb;" onclick="openSolutionVerification()"><i class="fas fa-check-circle"></i> Verify Answers & Solutions</button>' +
    '<button class="btn-primary" style="background:#64748b;" onclick="goHome()"><i class="fas fa-home"></i> Back to Home</button>' +
    '</div>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML = html;
}

function shareResultWhatsApp(score, total, pct) {
  var liveUrl = window.location.origin + window.location.pathname;
  var text = encodeURIComponent(
    "🏆 *AK Learning Point Coaching - Scorecard*\n" +
    "👤 Student: " + (currentQuiz.participantName || "Anonymous") + "\n" +
    "📝 Test: " + currentQuiz.title + "\n" +
    "🎯 Score: " + score + "/" + total + " (" + pct + "% Accuracy)\n\n" +
    "👉 Practice Link: " + liveUrl
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
// URL Deep-Linking: Link click karte hi direct Entry Screen open karna
window.checkAndOpenDirectQuizFromUrl = function() {
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var targetQuizId = urlParams.get("quizId");
    if (!targetQuizId) return;

    var allQuizzes = getQuizStorageData("ak_teacher_quizzes", []);
    var foundQuiz = null;

    for (var i = 0; i < allQuizzes.length; i++) {
      if (String(allQuizzes[i].id).trim() === String(targetQuizId).trim()) {
        foundQuiz = allQuizzes[i];
        break;
      }
    }

    if (foundQuiz) {
      window.activeLoadedQuizzes = [foundQuiz];
      openQuizEntryModalByIndex(0);
    } else if (typeof API !== "undefined" && API.get) {
      API.get("getQuizzes", { allStatus: "true" }).then(function(res) {
        if (res && res.data) {
          for (var j = 0; j < res.data.length; j++) {
            if (String(res.data[j].id).trim() === String(targetQuizId).trim()) {
              window.activeLoadedQuizzes = [res.data[j]];
              openQuizEntryModalByIndex(0);
              break;
            }
          }
        }
      });
    }
  } catch (err) {
    console.warn("Deep-link error:", err);
  }
};

// Jab bhi page open ho, turant URL check karein
// Jab bhi page open ho, turant URL check karein
window.addEventListener("DOMContentLoaded", function() {
  setTimeout(checkAndOpenDirectQuizFromUrl, 300);
});

// Bridge for HTML button click compatibility
window.submitQuizNow = function(e) {
  if (typeof submitQuiz === "function") {
    submitQuiz(e);
  } else {
    console.error("submitQuiz function not found");
  }
};
