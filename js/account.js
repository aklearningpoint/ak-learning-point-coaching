// ==========================================
// AK Learning Point - Student & Visitor Dashboard Engine
// ==========================================

// 1. Check if user already exists
function getStudentProfile() {
  try {
    var raw = localStorage.getItem("ak_student_profile");
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

// 2. Save visitor/student profile locally
function saveStudentProfile(name, mobile, sClass, board) {
  var profile = {
    name: name,
    mobile: mobile,
    className: sClass || "Class 10",
    board: board || "CBSE",
    joinedDate: new Date().toLocaleDateString()
  };
  localStorage.setItem("ak_student_profile", JSON.stringify(profile));
  localStorage.setItem("ak_user_logged_in", "true");
  return profile;
}

// 3. Open My Account Dashboard
function openMyAccount() {
  var profile = getStudentProfile();
  var dynamicView = document.getElementById("dynamicView");
  if (!dynamicView) return;

  // Agar user new visitor hai (Login nahi hai)
  if (!profile) {
    dynamicView.innerHTML = `
      <div class="modal-overlay" style="display:flex;">
        <div class="modal-card" style="max-width:420px; border-radius:20px; text-align:center; padding:24px;">
          <div style="font-size:2.8rem; margin-bottom:8px;">🎓</div>
          <h3 style="color:#0f172a; margin-bottom:6px;">Student / Visitor Portal</h3>
          <p style="color:#64748b; font-size:0.85rem; margin-bottom:20px;">Apna naam aur number set karein taaki aapka test record saved rahe.</p>
          <form onsubmit="handleAccountLoginSubmit(event)" style="display:flex; flex-direction:column; gap:12px; text-align:left;">
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#475569;">Full Name</label>
              <input type="text" id="accInputName" required placeholder="Aapka pura naam" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:#475569;">WhatsApp Number</label>
              <input type="tel" id="accInputMobile" required pattern="[0-9]{10}" placeholder="10-digit number" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:#475569;">Class</label>
                <select id="accInputClass" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
                  <option>Class 6</option><option>Class 7</option><option>Class 8</option>
                  <option>Class 9</option><option selected>Class 10</option><option>Class 11</option><option>Class 12</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:#475569;">Board</label>
                <select id="accInputBoard" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">
                  <option selected>CBSE</option><option>BSEB</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn-primary" style="margin-top:10px; background:#1e40af; padding:12px; font-weight:700; cursor:pointer;">Save Profile</button>
          </form>
          <div style="margin-top:14px; border-top:1px solid #e2e8f0; padding-top:10px;">
            <button class="nav-pill-btn nav-home-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i> Close</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Agar user already setup hai (Returning Visitor)
  var attempts = [];
  try {
    var rawAtt = localStorage.getItem("ak_student_attempts");
    attempts = rawAtt ? JSON.parse(rawAtt) : [];
  } catch(e) {}

  var totalTests = attempts.length;
  var totalAcc = 0;
  var bestScore = 0;

  for (var i = 0; i < attempts.length; i++) {
    var p = parseFloat(attempts[i].percentage || 0);
    totalAcc += p;
    if (attempts[i].score > bestScore) bestScore = attempts[i].score;
  }
  var avgAccuracy = totalTests > 0 ? (totalAcc / totalTests).toFixed(1) : "0.0";

  var historyHtml = "";
  if (totalTests === 0) {
    historyHtml = '<p style="color:#94a3b8; font-size:0.85rem; text-align:center; padding:15px 0;">Abhi tak koi test attempt nahi kiya hai.</p>';
  } else {
    for (var k = 0; k < Math.min(attempts.length, 4); k++) {
      var att = attempts[k];
      historyHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px 14px; border-radius:10px; margin-bottom:8px; border-left:4px solid #2563eb;">
          <div style="text-align:left;">
            <strong style="color:#0f172a; font-size:0.9rem; display:block;">${att.quizTitle || 'Practice Test'}</strong>
            <small style="color:#64748b;">${new Date(att.timestamp).toLocaleDateString()} • Marks: ${att.score}/${att.totalMarks || att.total}</small>
          </div>
          <span style="background:#e0f2fe; color:#0369a1; font-size:0.8rem; font-weight:700; padding:4px 8px; border-radius:6px;">${att.percentage}%</span>
        </div>
      `;
    }
  }

  dynamicView.innerHTML = `
    <div class="modal-overlay" style="display:flex;">
      <div class="modal-card" style="max-width:520px; border-radius:24px; padding:0; overflow:hidden; background:#ffffff;">
        <div style="background:linear-gradient(135deg, #1e3a8a, #0284c7); color:white; padding:22px; text-align:center; position:relative;">
          <button onclick="closeDynamicView()" style="position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.2); border:none; color:white; width:30px; height:30px; border-radius:50%; cursor:pointer;"><i class="fas fa-times"></i></button>
          <div style="width:65px; height:65px; border-radius:50%; background:#ffffff; color:#1e40af; font-size:2rem; font-weight:900; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
            ${profile.name.charAt(0).toUpperCase()}
          </div>
          <h3 style="margin:0; font-size:1.25rem; font-weight:800; letter-spacing:0.3px;">${profile.name}</h3>
          <p style="margin:4px 0 0; font-size:0.82rem; color:#bae6fd;">📱 +91 ${profile.mobile} • 🎓 ${profile.className} (${profile.board})</p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; padding:16px 20px 8px; text-align:center;">
          <div style="background:#eff6ff; padding:10px; border-radius:12px; border:1px solid #bfdbfe;">
            <div style="font-size:1.3rem; font-weight:800; color:#1d4ed8;">${totalTests}</div>
            <div style="font-size:0.72rem; color:#64748b; font-weight:600; margin-top:2px;">Tests Given</div>
          </div>
          <div style="background:#f0fdf4; padding:10px; border-radius:12px; border:1px solid #bbf7d0;">
            <div style="font-size:1.3rem; font-weight:800; color:#16a34a;">${avgAccuracy}%</div>
            <div style="font-size:0.72rem; color:#64748b; font-weight:600; margin-top:2px;">Avg Accuracy</div>
          </div>
          <div style="background:#fffbeb; padding:10px; border-radius:12px; border:1px solid #fde68a;">
            <div style="font-size:1.3rem; font-weight:800; color:#d97706;">${bestScore}</div>
            <div style="font-size:0.72rem; color:#64748b; font-weight:600; margin-top:2px;">Top Score</div>
          </div>
        </div>

        <div style="padding:10px 20px 20px; max-height:240px; overflow-y:auto;">
          <h4 style="font-size:0.9rem; color:#334155; margin-bottom:10px; text-align:left; border-bottom:1px solid #f1f5f9; padding-bottom:6px;">📊 Recent Test Attempts</h4>
          ${historyHtml}
        </div>

        <div style="padding:14px 20px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
          <button onclick="handleStudentLogout()" style="background:transparent; border:none; color:#ef4444; font-size:0.85rem; font-weight:700; cursor:pointer;">
            <i class="fas fa-sign-out-alt"></i> Logout / Switch
          </button>
          <button class="nav-pill-btn nav-home-btn" onclick="closeDynamicView()" style="margin:0;"><i class="fas fa-check"></i> Done</button>
        </div>
      </div>
    </div>
  `;
}

function handleAccountLoginSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  var name = document.getElementById("accInputName").value.trim();
  var mobile = document.getElementById("accInputMobile").value.trim();
  var sClass = document.getElementById("accInputClass").value;
  var board = document.getElementById("accInputBoard").value;

  if (!name || mobile.length < 10) {
    alert("Kripya pura naam aur 10-digit mobile number bharein!");
    return;
  }

  saveStudentProfile(name, mobile, sClass, board);
  openMyAccount();
}

function handleStudentLogout() {
  if (confirm("Kya aap account switch ya logout karna chahte hain?")) {
    localStorage.removeItem("ak_student_profile");
    localStorage.removeItem("ak_user_logged_in");
    openMyAccount();
  }
}
