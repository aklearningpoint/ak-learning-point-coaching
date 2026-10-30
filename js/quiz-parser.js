// ==========================================
// AK LEARNING POINT - QUIZ PARSER ENGINE
// ==========================================

var parsedQuestionsBuffer = [];

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
  var isAdvertised = document.getElementById("tqIsAdvertised") ? document.getElementById("tqIsAdvertised").checked : true;
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
    isAdvertised: isAdvertised,
    status: status,
    questions: parsedQuestionsBuffer,
    createdAt: new Date().toISOString()
  };

  activeTeacherQuizzes = getTeacherData("ak_teacher_quizzes", []);
  activeTeacherQuizzes.unshift(newQuiz);
  setTeacherData("ak_teacher_quizzes", activeTeacherQuizzes);

  if (typeof API !== "undefined" && API.post) {
    API.post("saveQuiz", newQuiz);
  }

  alert("Quiz successfully saved as " + status + "!");
  if (typeof showTeacherSection === "function") {
    showTeacherSection('list');
  }
}
