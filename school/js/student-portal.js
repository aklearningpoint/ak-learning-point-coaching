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

// Photo Preview & Base64 Encoder (Camera + File Picker)
function previewStudentPhoto(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      if (activeLoggedStudent) {
        activeLoggedStudent.photo = e.target.result;
      }
      const statusEl = document.getElementById("photoUploadStatus");
      if (statusEl) {
        statusEl.style.display = "inline-flex";
        statusEl.innerHTML = '<i class="fas fa-check-circle" style="margin-right:4px;"></i> Photo Attached!';
      }
    };
    reader.readAsDataURL(file);
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

// Tab 2: Official 6cm x 9cm Printable Identity Card
function renderStudentIdCard() {
  const container = document.getElementById("idCardContainer");
  if (!container || !activeLoggedStudent) return;

  // Gatekeeper: Jab tak student profile fill na kare tab tak ID card hide rahega
  const hasReg = activeLoggedStudent.regNo && activeLoggedStudent.regNo.trim() !== "" && activeLoggedStudent.regNo !== "REG-101";
  const hasFather = activeLoggedStudent.father && activeLoggedStudent.father.trim() !== "" && activeLoggedStudent.father !== "Parent Record";

  if (!hasReg || !hasFather) {
    container.innerHTML = `
      <div style="text-align:center; padding:35px 20px; background:#fff; border-radius:10px; border:2px dashed #cbd5e1; max-width:400px; margin:20px auto;">
        <i class="fas fa-id-card-clip" style="font-size:42px; color:#d97706; margin-bottom:12px;"></i>
        <h3 style="margin:6px 0; color:#1e293b;">Profile Details Incomplete</h3>
        <p style="color:#64748b; font-size:13px; line-height:1.5;">Aapka ID Card tabhi generate hoga jab aap Profile Details tab me apna <b>Register Number</b> aur <b>Father's Name</b> fill karke save karenge.</p>
        <button class="tab-btn active" style="margin:10px auto 0;" onclick="switchTab('profileTab')"><i class="fa fa-user-edit"></i> Fill Profile Details</button>
      </div>
    `;
    return;
  }

 <div class="form-group mt-3">
  <label style="display:block; margin-bottom:6px; font-weight:600;">Upload Photograph:</label>
  <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
    <!-- Gallery / File Manager Se -->
    <label style="background:#e2e8f0; color:#1e293b; padding:8px 14px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
      <i class="fas fa-folder-open"></i> Choose File
      <input type="file" id="stuPhotoInput" accept="image/*" onchange="previewStudentPhoto(this)" style="display:none;">
    </label>
    
    <!-- Phone / Device Camera Se Direct Snap -->
    <label style="background:#0284c7; color:#fff; padding:8px 14px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
      <i class="fas fa-camera"></i> Take Photo (Camera)
      <input type="file" id="stuCameraInput" accept="image/*" capture="user" onchange="previewStudentPhoto(this)" style="display:none;">
    </label>
    
    <span id="photoUploadStatus" style="font-size:12px; color:#16a34a; font-weight:600; display:none;">
      <i class="fas fa-check-circle"></i> Photo Attached!
    </span>
  </div>
</div>

  container.innerHTML = `
    <div class="id-card-wrapper" style="display:flex; flex-direction:column; align-items:center; padding:15px 0;">
      <div id="idCardPrintArea" style="width:240px; min-height:360px; background:#ffffff; border:2px solid #0f172a; border-radius:10px; overflow:hidden; box-shadow:0 6px 16px rgba(0,0,0,0.12); font-family:'Segoe UI', Arial, sans-serif; display:flex; flex-direction:column; justify-content:space-between;">
        
        <!-- Header (Logo on Top-Left + Name + Address) -->
        <div style="background:linear-gradient(135deg, #0f172a, #1e3a8a); color:#ffffff; padding:7px 8px; text-align:center; position:relative;">
          <img src="../logo.png" onerror="this.onerror=null; this.src='https://cdn-icons-png.flaticon.com/512/2997/2997322.png'" style="position:absolute; left:7px; top:6px; width:28px; height:28px; object-fit:contain; border-radius:50%; background:#fff; padding:1px;" alt="Logo">
          <div style="margin-left:26px;">
            <div style="font-size:11.5px; font-weight:800; letter-spacing:0.3px; line-height:1.2;">ASSENT PUBLIC SCHOOL</div>
            <div style="font-size:7.5px; color:#cbd5e1; margin-top:1px;">Singhiya Khurd, Samastipur</div>
            <div style="font-size:8px; color:#93c5fd; font-weight:bold; letter-spacing:0.4px;">STUDENT IDENTITY CARD (6x9 cm)</div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:6px 10px; text-align:center; flex:1;">
          <div style="width:68px; height:76px; margin:0 auto 4px; border:1.5px solid #0f172a; border-radius:5px; overflow:hidden; background:#f8fafc;">
            <img src="${studentPhoto}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'" style="width:100%; height:100%; object-fit:cover;" alt="Student">
          </div>
          <div style="font-size:13px; font-weight:bold; color:#0f172a; line-height:1.2;">${activeLoggedStudent.name}</div>
          <div style="font-size:10px; color:#2563eb; font-weight:700; margin-bottom:5px;">Class: ${activeLoggedStudent.className} | Roll: ${activeLoggedStudent.rollNo}</div>
          
          <div style="text-align:left; font-size:9.5px; line-height:1.5; background:#f8fafc; padding:6px 8px; border-radius:6px; border:1px solid #e2e8f0; color:#1e293b;">
            <div><b>Reg No:</b> ${activeLoggedStudent.regNo}</div>
            <div><b>Father:</b> ${activeLoggedStudent.father}</div>
            <div><b>DOB:</b> ${activeLoggedStudent.dob || '—'}</div>
            <div><b>Mobile 1:</b> ${activeLoggedStudent.mobile1 || 'N/A'}</div>
            <div><b>Mobile 2:</b> ${activeLoggedStudent.mobile2 || '—'}</div>
            <div><b>Transport:</b> ${activeLoggedStudent.transport || 'School Transport'}</div>
            <div><b>Session:</b> 2026-2027</div>
          </div>
        </div>

        <!-- Signatures & Authority Helpline -->
        <div style="background:#f1f5f9; border-top:1px dashed #cbd5e1; padding:5px 8px; font-size:8px; color:#0f172a;">
          <div style="display:flex; justify-content:space-between; text-align:center;">
            <div><b>G. K. Thakur</b><br><span style="color:#475569;">Director</span><br><a href="tel:7739400300" style="color:#0284c7; text-decoration:none; font-weight:bold;">7739400300</a></div>
            <div><b>A. K. Singh</b><br><span style="color:#475569;">Principal</span><br><a href="tel:9570638608" style="color:#0284c7; text-decoration:none; font-weight:bold;">9570638608</a></div>
          </div>
        </div>

      </div>
      <button class="btn-download-img" style="margin-top:12px; background:#16a34a; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:6px;" onclick="downloadStudentIdCardImage()">
        <i class="fas fa-download"></i> Download ID Card (Image)
      </button>
    </div>
  `;
}

// 6cm x 9cm Exact Ratio (480px x 720px) Canvas Image Exporter
function downloadStudentIdCardImage() {
  const s = activeLoggedStudent;
  if (!s) return;

  const canvas = document.createElement("canvas");
  // 6cm x 9cm standard proportions
  canvas.width = 480;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 480, 720);

  // Outer Border
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#0f172a";
  ctx.strokeRect(8, 8, 464, 704);

  // Header Banner
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(10, 10, 460, 95);

  // Header Texts
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 21px Arial";
  ctx.textAlign = "center";
  ctx.fillText("ASSENT PUBLIC SCHOOL", 260, 42);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "12px Arial";
  ctx.fillText("Singhiya Khurd, Samastipur", 260, 62);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 13px Arial";
  ctx.fillText("STUDENT IDENTITY CARD", 260, 84);

  // Student Name & Class
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 21px Arial";
  ctx.fillText(s.name, 240, 275);

  ctx.fillStyle = "#2563eb";
  ctx.font = "bold 14px Arial";
  ctx.fillText("Class: " + s.className + "  |  Roll No: " + s.rollNo, 240, 298);

  // Info Box
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(30, 315, 420, 260);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 315, 420, 260);

  // Details List
  ctx.textAlign = "left";
  ctx.fillStyle = "#1e293b";
  ctx.font = "14px Arial";
  ctx.fillText("Reg No:       " + (s.regNo || "—"), 45, 345);
  ctx.fillText("Father:         " + (s.father || "—"), 45, 380);
  ctx.fillText("DOB:            " + (s.dob || "—"), 45, 415);
  ctx.fillText("Mobile 1:      " + (s.mobile1 || "—"), 45, 450);
  ctx.fillText("Mobile 2:      " + (s.mobile2 || "—"), 45, 485);
  ctx.fillText("Transport:   " + (s.transport || "School Transport"), 45, 520);
  ctx.fillText("Session:       2026-2027", 45, 555);

  // Bottom Line & Authority Section
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(10, 600);
  ctx.lineTo(470, 600);
  ctx.stroke();

  // Authorities & Contact
  ctx.textAlign = "center";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px Arial";
  ctx.fillText("G. K. Thakur", 110, 630);
  ctx.font = "11px Arial";
  ctx.fillStyle = "#475569";
  ctx.fillText("Director", 110, 647);
  ctx.fillStyle = "#0284c7";
  ctx.font = "bold 12px Arial";
  ctx.fillText("7739400300", 110, 665);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px Arial";
  ctx.fillText("A. K. Singh", 370, 630);
  ctx.font = "11px Arial";
  ctx.fillStyle = "#475569";
  ctx.fillText("Principal", 370, 647);
  ctx.fillStyle = "#0284c7";
  ctx.font = "bold 12px Arial";
  ctx.fillText("9570638608", 370, 665);

  // Composite Photo & Logo Drawing
  const triggerSave = () => {
    const link = document.createElement("a");
    link.download = (s.name.replace(/\s+/g, "_") || "Student") + "_ID_Card_6x9.png";
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const photoImg = new Image();
  photoImg.crossOrigin = "anonymous";
  photoImg.onload = () => {
    ctx.drawImage(photoImg, 185, 120, 110, 125);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0f172a";
    ctx.strokeRect(185, 120, 110, 125);
    triggerSave();
  };
  photoImg.onerror = () => {
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(185, 120, 110, 125);
    triggerSave();
  };
  photoImg.src = s.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
}
