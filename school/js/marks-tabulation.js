// Master Tabulation Register, Subject Matrix & Dual Entry Engine

const SUBJECT_RULES = {
  "Nur & Play": { base: ["Hindi", "English", "Math"], baseMax: 100, drawingMax: 50 },
  "LKG":        { base: ["Hindi", "English", "Math"], baseMax: 100, drawingMax: 50 },
  "UKG":        { base: ["Hindi", "English", "Math", "EVS"], baseMax: 100, drawingMax: 50 },
  "1":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 },
  "2":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 },
  "3":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 },
  "4":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 },
  "5":          { base: ["Hindi", "English", "Math", "Science", "SST"], baseMax: 100, drawingMax: 50 }
};

let currentClass = "Nur & Play";
let currentTerm = "Term 1";

// Helper: Get active subjects list for current Class and Term
function getActiveSubjects(cls, term) {
  const rule = SUBJECT_RULES[cls] || { base: ["Hindi", "English", "Math"], baseMax: 100, drawingMax: 50 };
  const list = [...rule.base];
  if (term === "Term 2" || term === "Term 3") {
    list.push("Drawing");
  }
  return list;
}

function getMaxMarksForSubject(subject) {
  return subject === "Drawing" ? 50 : 100;
}

// 1. Initialization
window.addEventListener("DOMContentLoaded", () => {
  handleClassTermChange();
  checkPublishStatus();
});

function handleClassTermChange() {
  currentClass = document.getElementById("marksClassSelect").value;
  currentTerm = document.getElementById("marksTermSelect").value;
  document.getElementById("ledgerSubTitle").innerText = `Class: ${currentClass} • ${currentTerm}`;
  
  populateModeAStudents();
  populateModeBSubjects();
  renderTabulationLedger();
  checkPublishStatus();
}

// 2. Mode Switching UI
function switchEntryModeUI() {
  const mode = document.getElementById("entryModeSelect").value;
  if (mode === "modeA") {
    document.getElementById("uiModeA").style.display = "block";
    document.getElementById("uiModeB").style.display = "none";
    loadStudentMarksForModeA();
  } else {
    document.getElementById("uiModeA").style.display = "none";
    document.getElementById("uiModeB").style.display = "block";
    renderModeBTable();
  }
}

// 3. Mode A: Student-Wise Matrix
function populateModeAStudents() {
  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const classStudents = students.filter(s => s.className === currentClass && s.status !== "BLOCKED");
  const sel = document.getElementById("modeAStudentSelect");
  sel.innerHTML = "";

  classStudents.forEach(s => {
    sel.innerHTML += `<option value="${s.id}">Roll ${s.rollNo} - ${s.name}</option>`;
  });

  loadStudentMarksForModeA();
}

function loadStudentMarksForModeA() {
  const studentId = document.getElementById("modeAStudentSelect").value;
  const subjects = getActiveSubjects(currentClass, currentTerm);
  const container = document.getElementById("modeASubjectsForm");
  container.innerHTML = "";

  if (!studentId) return;

  const marksDB = SchoolDB.get(SchoolDB.KEYS.MARKS, {});
  const studentMarks = (marksDB[studentId] && marksDB[studentId][currentTerm]) ? marksDB[studentId][currentTerm] : {};

  subjects.forEach(sub => {
    const max = getMaxMarksForSubject(sub);
    const score = studentMarks[sub] !== undefined ? studentMarks[sub] : "";
    container.innerHTML += `
      <div class="sub-input-card">
        <label><b>${sub}</b> (Max: ${max})</label>
        <input type="number" id="modeA_sub_${sub}" class="input-ctrl" max="${max}" min="0" value="${score}" placeholder="Marks">
      </div>
    `;
  });
}

function saveAndNextModeA() {
  const sel = document.getElementById("modeAStudentSelect");
  const studentId = sel.value;
  if (!studentId) return;

  const subjects = getActiveSubjects(currentClass, currentTerm);
  const marksDB = SchoolDB.get(SchoolDB.KEYS.MARKS, {});
  if (!marksDB[studentId]) marksDB[studentId] = {};
  if (!marksDB[studentId][currentTerm]) marksDB[studentId][currentTerm] = {};

  subjects.forEach(sub => {
    const val = document.getElementById("modeA_sub_" + sub).value;
    marksDB[studentId][currentTerm][sub] = val !== "" ? parseFloat(val) : 0;
  });

  SchoolDB.set(SchoolDB.KEYS.MARKS, marksDB);

  // Jump to Next Student automatically
  if (sel.selectedIndex < sel.options.length - 1) {
    sel.selectedIndex += 1;
    loadStudentMarksForModeA();
  } else {
    alert("Marks updated! You have reached the end of the class roster.");
  }
  renderTabulationLedger();
}

// 4. Mode B: Rapid Subject Column Entry
function populateModeBSubjects() {
  const subjects = getActiveSubjects(currentClass, currentTerm);
  const sel = document.getElementById("modeBSubjectSelect");
  sel.innerHTML = "";
  subjects.forEach(sub => {
    sel.innerHTML += `<option value="${sub}">${sub} (Max: ${getMaxMarksForSubject(sub)})</option>`;
  });
  renderModeBTable();
}

function renderModeBTable() {
  const sub = document.getElementById("modeBSubjectSelect").value;
  const max = getMaxMarksForSubject(sub);
  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const classStudents = students.filter(s => s.className === currentClass && s.status !== "BLOCKED");
  const marksDB = SchoolDB.get(SchoolDB.KEYS.MARKS, {});
  const tbody = document.getElementById("modeBTableBody");
  tbody.innerHTML = "";

  classStudents.forEach(s => {
    const score = (marksDB[s.id] && marksDB[s.id][currentTerm] && marksDB[s.id][currentTerm][sub] !== undefined)
      ? marksDB[s.id][currentTerm][sub] : "";
    tbody.innerHTML += `
      <tr>
        <td><b>Roll ${s.rollNo}</b></td>
        <td>${s.name}</td>
        <td><input type="number" class="input-ctrl-sm modeB-score-input" data-sid="${s.id}" value="${score}" max="${max}" min="0"></td>
        <td>${max}</td>
      </tr>
    `;
  });
}

function saveModeBAllMarks() {
  const sub = document.getElementById("modeBSubjectSelect").value;
  const inputs = document.querySelectorAll(".modeB-score-input");
  const marksDB = SchoolDB.get(SchoolDB.KEYS.MARKS, {});

  inputs.forEach(inp => {
    const sid = inp.getAttribute("data-sid");
    const val = inp.value;
    if (!marksDB[sid]) marksDB[sid] = {};
    if (!marksDB[sid][currentTerm]) marksDB[sid][currentTerm] = {};
    marksDB[sid][currentTerm][sub] = val !== "" ? parseFloat(val) : 0;
  });

  SchoolDB.set(SchoolDB.KEYS.MARKS, marksDB);
  alert("Column marks for " + sub + " saved successfully!");
  renderTabulationLedger();
}

// 5. Master Tabulation Engine (Rank & Percentage Logic)
function renderTabulationLedger() {
  const subjects = getActiveSubjects(currentClass, currentTerm);
  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const classStudents = students.filter(s => s.className === currentClass && s.status !== "BLOCKED");
  const marksDB = SchoolDB.get(SchoolDB.KEYS.MARKS, {});

  // Calculate Maximum Possible Total
  let maxPossibleTotal = 0;
  subjects.forEach(sub => maxPossibleTotal += getMaxMarksForSubject(sub));

  // Build Headings
  let theadHtml = `<tr><th>Roll</th><th>Student Name</th>`;
  subjects.forEach(sub => theadHtml += `<th>${sub}</th>`);
  theadHtml += `<th>Grand Total (${maxPossibleTotal})</th><th>Percentage (%)</th><th>Rank</th></tr>`;
  document.getElementById("tabulationHead").innerHTML = theadHtml;

  // Compute Scores
  const studentRows = classStudents.map(s => {
    const sMarks = (marksDB[s.id] && marksDB[s.id][currentTerm]) ? marksDB[s.id][currentTerm] : {};
    let grandTotal = 0;
    const scores = {};

    subjects.forEach(sub => {
      const val = sMarks[sub] !== undefined ? sMarks[sub] : 0;
      scores[sub] = val;
      grandTotal += val;
    });

    const percentage = ((grandTotal / maxPossibleTotal) * 100).toFixed(2);
    return { student: s, scores, grandTotal, percentage: parseFloat(percentage) };
  });

  // Assign Class Ranks
  studentRows.sort((a, b) => b.grandTotal - a.grandTotal);
  studentRows.forEach((row, idx) => { row.rank = idx + 1; });

  // Re-sort back by Roll Number for regular Ledger view
  studentRows.sort((a, b) => a.student.rollNo - b.student.rollNo);

  // Render Table Rows
  const tbody = document.getElementById("tabulationBody");
  tbody.innerHTML = "";

  studentRows.forEach(row => {
    let trHtml = `<tr><td><b>${row.student.rollNo}</b></td><td>${row.student.name}</td>`;
    subjects.forEach(sub => {
      trHtml += `<td>${row.scores[sub]}</td>`;
    });
    trHtml += `<td><b>${row.grandTotal}</b></td><td><b>${row.percentage}%</b></td><td><span class="rank-tag">Rank ${row.rank}</span></td></tr>`;
    tbody.innerHTML += trHtml;
  });
}

// 6. Fee Protection: Result Publishing Toggle
function checkPublishStatus() {
  const publishedList = SchoolDB.get(SchoolDB.KEYS.RESULTS_PUBLISHED, {});
  const key = `${currentClass}_${currentTerm}`;
  const btn = document.getElementById("btnPublishToggle");

  if (publishedList[key]) {
    btn.className = "btn-publish-live";
    btn.innerHTML = `<i class="fa fa-globe"></i> Result Status: PUBLISHED LIVE`;
  } else {
    btn.className = "btn-publish-draft";
    btn.innerHTML = `<i class="fa fa-eye-slash"></i> Result Status: DRAFT (Locked)`;
  }
}

function toggleResultPublish() {
  const publishedList = SchoolDB.get(SchoolDB.KEYS.RESULTS_PUBLISHED, {});
  const key = `${currentClass}_${currentTerm}`;

  if (publishedList[key]) {
    delete publishedList[key];
    alert(`Results for ${currentClass} ${currentTerm} have been HIDDEN from student portal.`);
  } else {
    publishedList[key] = true;
    alert(`Results for ${currentClass} ${currentTerm} are now PUBLISHED LIVE for students!`);
  }

  SchoolDB.set(SchoolDB.KEYS.RESULTS_PUBLISHED, publishedList);
  checkPublishStatus();
}

function printLandscapeLedger() {
  window.print();
}
