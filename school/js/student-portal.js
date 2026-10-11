// Student Portal Controller (Gatekeeper, Results, 7x10 ID Card)
let activeLoggedStudent = null;

function verifyStudentCandidate() {
  const cls = document.getElementById("loginClass").value;
  const roll = parseInt(document.getElementById("loginRoll").value);

  if (!roll || isNaN(roll)) {
    alert("Please enter a valid numeric Roll Number.");
    return;
  }

  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const found = students.find(s => s.className === cls && s.rollNo === roll && s.status !== "BLOCKED");

  if (!found) {
    alert("No student record found for " + cls + " with Roll " + roll + ".");
    return;
  }

  // Verification Prompt (Strict English)
  const isConfirmed = confirm("Candidate Verification:\n\nName: " + found.name + "\nClass: " + found.className + "\nRoll: " + found.rollNo + "\n\nIs this your profile?");
  if (isConfirmed) {
    activeLoggedStudent = found;
    unlockStudentWorkspace();
  }
}

function unlockStudentWorkspace() {
  document.getElementById("studentAuthOverlay").style.display = "none";
  document.getElementById("studentWorkspace").style.display = "block";
  document.getElementById("welcomeBanner").innerText = "Welcome, " + activeLoggedStudent.name;

  populateProfileForm();
  renderStudentIdCard();
  renderStudentResults();
  renderStudentFees();
}

function logoutStudent() {
  activeLoggedStudent = null;
  document.getElementById("studentWorkspace").style.display = "none";
  document.getElementById("studentAuthOverlay").style.display = "flex";
  document.getElementById("loginRoll").value = "";
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-pane").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
  event.currentTarget.classList.add("active");
}

// Tab 1: Profile Details & Self Update
function populateProfileForm() {
  if (!activeLoggedStudent) return;
  document.getElementById("stuRegNo").value = activeLoggedStudent.regNo || "";
  document.getElementById("stuFather").value = activeLoggedStudent.father || "";
  document.getElementById("stuMother").value = activeLoggedStudent.mother || "";
  document.getElementById("stuGender").value = activeLoggedStudent.gender || "Male";
  document.getElementById("stuTransport").value = activeLoggedStudent.transport || "School Transport";
  document.getElementById("stuMob1").value = activeLoggedStudent.mobile1 || "";
  document.getElementById("stuMob2").value = activeLoggedStudent.mobile2 || "";
  document.getElementById("stuDOB").value = activeLoggedStudent.dob || "";
}

function saveStudentSelfDetails(e) {
  e.preventDefault();
  if (!activeLoggedStudent) return;

  activeLoggedStudent.regNo = document.getElementById("stuRegNo").value.trim();
  activeLoggedStudent.father = document.getElementById("stuFather").value.trim();
  activeLoggedStudent.mother = document.getElementById("stuMother").value.trim();
  activeLoggedStudent.gender = document.getElementById("stuGender").value;
  activeLoggedStudent.transport = document.getElementById("stuTransport").value;
  activeLoggedStudent.mobile1 = document.getElementById("stuMob1").value.trim();
  activeLoggedStudent.mobile2 = document.getElementById("stuMob2").value.trim();
  activeLoggedStudent.dob = document.getElementById("stuDOB").value;

  const students = SchoolDB.get(SchoolDB.KEYS.STUDENTS, []);
  const idx = students.findIndex(s => s.id === activeLoggedStudent.id);
  if (idx !== -1) {
    students[idx] = activeLoggedStudent;
    SchoolDB.set(SchoolDB.KEYS.STUDENTS, students);
    alert("Profile details updated successfully!");
    renderStudentIdCard();
  }
}

// Tab 3: Official 7x10cm Printable Identity Card
function renderStudentIdCard() {
  if (!activeLoggedStudent) return;
  document.getElementById("idCardName").innerText = activeLoggedStudent.name;
  document.getElementById("idCardClass").innerText = activeLoggedStudent.className;
  document.getElementById("idCardRoll").innerText = activeLoggedStudent.rollNo;
  document.getElementById("idCardReg").innerText = activeLoggedStudent.regNo || "N/A";
  document.getElementById("idCardFather").innerText = activeLoggedStudent.father || "Parent Record";
  document.getElementById("idCardContact").innerText = activeLoggedStudent.mobile1 || "N/A";
  document.getElementById("idCardTrans").innerText = activeLoggedStudent.transport || "Self";
}

// Tab 2: Result Gatekeeper
function renderStudentResults() {
  const publishedList = SchoolDB.get(SchoolDB.KEYS.RESULTS_PUBLISHED, {});
  const marksDB = SchoolDB.get(SchoolDB.KEYS.MARKS, {});
  // Checks if term is published by teacher
}

// Tab 5: Fee Display
function renderStudentFees() {
  // Shows updated ledger
}
