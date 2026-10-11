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
  
  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add("active");

  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add("active");
  }

  if (tabId === "idCardTab") {
    renderStudentIdCard();
  }
}

// Tab 1: Profile Details & Self Update
function populateProfileForm() {
  if (!activeLoggedStudent) return;
  document.getElementById("stuRegNo").value = (activeLoggedStudent.regNo && activeLoggedStudent.regNo !== "REG-101") ? activeLoggedStudent.regNo : "";
  document.getElementById("stuFather").value = activeLoggedStudent.father || "";
  document.getElementById("stuMother").value = activeLoggedStudent.mother || "";
  document.getElementById("stuGender").value = activeLoggedStudent.gender || "Male";
  document.getElementById("stuTransport").value = activeLoggedStudent.transport || "School Transport";
  document.getElementById("stuMob1").value = activeLoggedStudent.mobile1 || "";
  document.getElementById("stuMob2").value = activeLoggedStudent.mobile2 || "";
  document.getElementById("stuDOB").value = activeLoggedStudent.dob || "";
}

function previewStudentPhoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      if (activeLoggedStudent) {
        activeLoggedStudent.photo = e.target.result;
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
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
    switchTab("idCardTab");
  }
}

// Tab 2: Official 7x10cm Printable Identity Card
function renderStudentIdCard() {
  const container = document.getElementById("idCardContainer");
  if (!container || !activeLoggedStudent) return;

  // Gatekeeper: Jab tak student profile fill na kare tab tak ID card hide rahega
  const hasReg = activeLoggedStudent.regNo && activeLoggedStudent.regNo.trim() !== "" && activeLoggedStudent.regNo !== "REG-101";
  const hasFather = activeLoggedStudent.father && activeLoggedStudent.father.trim() !== "" && activeLoggedStudent.father !== "Parent Record";

  if (!hasReg || !hasFather) {
    container.innerHTML = `
      <div style="text-align:center; padding:35px 20px; background:#fff; border-radius:10px; border:2px dashed #cbd5e1; max-width:440px; margin:20px auto;">
        <i class="fas fa-id-card-clip" style="font-size:42px; color:#d97706; margin-bottom:12px;"></i>
        <h3 style="margin:6px 0; color:#1e293b;">Profile Details Incomplete</h3>
        <p style="color:#64748b; font-size:13px; line-height:1.5;">Aapka ID Card tabhi generate hoga jab aap Profile Details tab me apna <b>Register Number</b> aur <b>Father's Name</b> fill karke save karenge.</p>
        <button class="tab-btn active" style="margin:10px auto 0;" onclick="switchTab('profileTab')"><i class="fa fa-user-edit"></i> Fill Profile Details</button>
      </div>
    `;
    return;
  }

  const studentPhoto = activeLoggedStudent.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  container.innerHTML = `
    <div class="id-card-wrapper">
      <div class="official-id-card-7x10" id="idCardPrintArea">
        <div class="id-header-box">
          <h4>ASSENT PUBLIC SCHOOL</h4>
          <small>STUDENT IDENTITY CARD (7cm x 10cm)</small>
        </div>
        <div class="id-body-box">
          <div class="id-photo-slot">
            <img src="${studentPhoto}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'" alt="Student">
          </div>
          <h4 style="margin:0; font-size:15px; color:#0f172a;">${activeLoggedStudent.name}</h4>
          <div style="font-size:11px; color:#2563eb; font-weight:600; margin-top:2px;">Class: ${activeLoggedStudent.className} | Roll No: ${activeLoggedStudent.rollNo}</div>
          
          <div class="id-details-list">
            <div><b>Reg No:</b> ${activeLoggedStudent.regNo}</div>
            <div><b>Father:</b> ${activeLoggedStudent.father}</div>
            <div><b>Contact:</b> ${activeLoggedStudent.mobile1 || 'N/A'}</div>
            <div><b>Transport:</b> ${activeLoggedStudent.transport || 'School Transport'}</div>
            <div><b>Session:</b> 2026-2027</div>
          </div>

          <div class="id-signatures">
            <div><b>G. K. Thakur</b><br>Director</div>
            <div><b>A. K. Singh</b><br>Principal</div>
          </div>
        </div>
      </div>
      <button class="btn-download-img" onclick="downloadStudentIdCardImage()"><i class="fas fa-download"></i> Download ID Card (Image)</button>
    </div>
  `;
}

// 7cm x 10cm Exact Aspect Ratio Image Exporter (Canvas)
function downloadStudentIdCardImage() {
  const s = activeLoggedStudent;
  if (!s) return;

  const canvas = document.createElement("canvas");
  // 7cm x 10cm @ 150 DPI ratio (420px x 600px)
  canvas.width = 420;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 420, 600);

  // Outer Border & Card Structure
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#0f172a";
  ctx.strokeRect(10, 10, 400, 580);

  // Header Banner
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(12, 12, 396, 76);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText("ASSENT PUBLIC SCHOOL", 210, 46);

  ctx.fillStyle = "#93c5fd";
  ctx.font = "12px Arial";
  ctx.fillText("STUDENT IDENTITY CARD", 210, 68);

  // Name & Class
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 20px Arial";
  ctx.fillText(s.name, 210, 220);

  ctx.fillStyle = "#2563eb";
  ctx.font = "bold 14px Arial";
  ctx.fillText("Class: " + s.className + "  |  Roll No: " + s.rollNo, 210, 245);

  // Info Grid Box
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(35, 270, 350, 190);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.strokeRect(35, 270, 350, 190);

  ctx.textAlign = "left";
  ctx.fillStyle = "#334155";
  ctx.font = "14px Arial";
  ctx.fillText("Reg No:      " + (s.regNo || "—"), 55, 305);
  ctx.fillText("Father:        " + (s.father || "—"), 55, 340);
  ctx.fillText("Contact:      " + (s.mobile1 || "—"), 55, 375);
  ctx.fillText("Transport:  " + (s.transport || "School Transport"), 55, 410);
  ctx.fillText("Session:      2026-2027", 55, 445);

  // Signatures
  ctx.textAlign = "center";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 12px Arial";
  ctx.fillText("G. K. Thakur", 95, 520);
  ctx.font = "10px Arial";
  ctx.fillText("Director", 95, 535);

  ctx.font = "bold 12px Arial";
  ctx.fillText("A. K. Singh", 325, 520);
  ctx.font = "10px Arial";
  ctx.fillText("Principal", 325, 535);

  // Bottom Line
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(12, 570);
  ctx.lineTo(408, 570);
  ctx.stroke();

  // Photo Drawing (If exists as dataURL or default fallback)
  const drawPhotoAndSave = (imgElement) => {
    if (imgElement) {
      try {
        ctx.drawImage(imgElement, 155, 105, 110, 110);
      } catch (e) {
        // Fallback placeholder box
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(155, 105, 110, 110);
      }
    }
    const link = document.createElement("a");
    link.download = (s.name.replace(/\s+/g, "_") || "Student") + "_ID_Card.png";
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => drawPhotoAndSave(img);
  img.onerror = () => drawPhotoAndSave(null);
  img.src = s.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
}

// Tab 3: Result Gatekeeper
function renderStudentResults() {
  const publishedList = SchoolDB.get(SchoolDB.KEYS.RESULTS_PUBLISHED, {});
  const marksDB = SchoolDB.get(SchoolDB.KEYS.MARKS, {});
  // Checks if term is published by teacher
}

// Tab 5: Fee Display
function renderStudentFees() {
  // Shows updated ledger
}
