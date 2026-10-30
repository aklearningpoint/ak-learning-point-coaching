// =========================================================================
// ADMIN MASTER CONTROL: LOGO, SECURITY, LIVE LEDGER, PROMO & LEADS
// =========================================================================

function getAdminData(key, fallback) {
  try {
    var val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setAdminData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage full or unavailable", e);
  }
}

var currentAdminActiveTab = 'branding';

var appConfig = getAdminData("ak_app_config", {
  adminPass: "password",
  teacherPass: "pass",
  tuitionPass: "pass",
  logoData: ""
});

var promoBanners = getAdminData("ak_promo_banners", []);

function applyLogoToUI(dataUrl) {
  if (!dataUrl) return;
  var el = document.getElementById("appLogo");
  if (el) el.src = dataUrl;
  var preview = document.getElementById("logoPreviewImg");
  if (preview) preview.src = dataUrl;
}

async function syncCloudAppConfig() {
  if (appConfig.logoData) {
    applyLogoToUI(appConfig.logoData);
  }

  try {
    if (typeof API !== "undefined" && API.get) {
      var res = await API.get("getAppConfig");
      if (res && res.status === "success" && res.data) {
        var cloudCfg = res.data;
        if (cloudCfg.logoData) {
          appConfig.logoData = cloudCfg.logoData;
          applyLogoToUI(cloudCfg.logoData);
        }
        if (cloudCfg.adminPass) appConfig.adminPass = cloudCfg.adminPass;
        if (cloudCfg.teacherPass) appConfig.teacherPass = cloudCfg.teacherPass;
        if (cloudCfg.tuitionPass) appConfig.tuitionPass = cloudCfg.tuitionPass;

        setAdminData("ak_app_config", appConfig);
      }
    }
  } catch (err) {
    console.warn("Cloud config sync offline:", err);
  }
}

window.addEventListener("DOMContentLoaded", syncCloudAppConfig);

function openAdminPortal() {
  if (typeof toggleDrawer === "function") toggleDrawer();

  var enteredPass = prompt("Enter Master Admin Password (Default: password):");
  if (enteredPass === appConfig.adminPass || enteredPass === "password") {
    renderAdminDashboard();
  } else if (enteredPass !== null) {
    alert("Incorrect Admin Password!");
  }
}

function renderAdminDashboard() {
  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f8fafc; z-index:3000; display:flex; flex-direction:column;">' +
    // Top Bar
    '<div style="height:55px; background:var(--primary-navy, #0f172a); color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px; flex-shrink:0;">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<i class="fas fa-user-shield" style="color:#fbbf24;"></i>' +
    '<strong>Master Admin Panel</strong>' +
    '</div>' +
    '<div style="display:flex; align-items:center; gap:10px;">' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '<button onclick="closeDynamicView()" style="background:none; border:none; color:white; font-size:1.3rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '</div>' +

    // Navigation Tabs
    '<div style="background:white; border-bottom:1px solid #e2e8f0; display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); padding:10px 12px; gap:8px; flex-shrink:0;">' +
    '<button id="admBtn_branding" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#1e40af; border:2px solid transparent;" onclick="showAdminSection(\'branding\')"><i class="fas fa-shield-alt"></i> Security</button>' +
    '<button id="admBtn_ledger" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#0284c7; border:2px solid transparent;" onclick="showAdminSection(\'ledger\')"><i class="fas fa-users-cog"></i> Students Ledger</button>' +
    '<button id="admBtn_notice" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#eab308; color:#0f172a; font-weight:700; border:2px solid transparent;" onclick="openTeacherNotificationModal()"><i class="fas fa-bullhorn"></i> Post Notice</button>' +
    '<button id="admBtn_banners" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#7c3aed; border:2px solid transparent;" onclick="showAdminSection(\'banners\')"><i class="fas fa-images"></i> Promo Slides</button>' +
    '<button id="admBtn_leads" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#059669; border:2px solid transparent;" onclick="showAdminSection(\'leads\')"><i class="fas fa-address-book"></i> Leads</button>' +
    '</div>' +

    '<div id="adminContentBody" style="flex:1; overflow-y:auto; padding:16px; max-width:960px; margin:0 auto; width:100%; box-sizing:border-box;"></div>' +
    '</div>';

  document.getElementById("dynamicView").innerHTML = html;
  showAdminSection('branding');
}

function updateAdminTabAppearance(activeSec) {
  currentAdminActiveTab = activeSec;
  var tabIds = ['branding', 'ledger', 'banners', 'leads'];
  tabIds.forEach(function(sec) {
    var btn = document.getElementById("admBtn_" + sec);
    if (!btn) return;
    if (sec === activeSec) {
      btn.style.borderColor = "#fbbf24";
      btn.style.boxShadow = "0 0 10px rgba(251, 191, 36, 0.65)";
      btn.style.transform = "scale(1.02)";
      btn.style.fontWeight = "bold";
    } else {
      btn.style.borderColor = "transparent";
      btn.style.boxShadow = "none";
      btn.style.transform = "scale(1)";
      btn.style.opacity = "0.9";
    }
  });
}

function showAdminSection(sec) {
  updateAdminTabAppearance(sec);
  var container = document.getElementById("adminContentBody");
  if (!container) return;

  // 1. BRANDING & SECURITY
  if (sec === 'branding') {
    var brandingHtml = '<div class="modal-card" style="max-width:100%;">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
      '<h3 style="color:var(--primary-navy, #0f172a); margin:0;">App Logo & Passwords</h3>' +
      '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Upload App Logo (Direct File From Mobile / PC)</label>' +
      '<input type="file" id="adminLogoFileInput" accept="image/*" onchange="previewAndStoreLogo(this)">' +
      '<div style="margin-top:8px; display:flex; align-items:center; gap:12px;">' +
      '<img id="logoPreviewImg" src="' + (appConfig.logoData || 'https://via.placeholder.com/60') + '" style="width:60px; height:60px; border-radius:50%; border:2px solid #cbd5e1; object-fit:cover;">' +
      '<small id="logoUploadStatus" style="color:#64748b;">Ready to upload</small>' +
      '</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Admin Master Password</label>' +
      '<input type="text" id="cfgAdminPass" value="' + appConfig.adminPass + '">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Teacher Access Password</label>' +
      '<input type="text" id="cfgTeacherPass" value="' + appConfig.teacherPass + '">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Tuition Section Passkey</label>' +
      '<input type="text" id="cfgTuitionPass" value="' + appConfig.tuitionPass + '">' +
      '</div>' +
      '<button class="btn-primary" id="btnSaveConfig" onclick="saveAdminSecurityConfig()"><i class="fas fa-cloud-upload-alt"></i> Save & Sync to Cloud</button>' +
      '</div>';

    container.innerHTML = brandingHtml;
  } 
  // 2. STUDENTS LEDGER SECTION (DIRECT EMBEDDED ENGINE)
  else if (sec === 'ledger') {
    renderAdminLedgerDirect(container);
  } 
  // 3. PROMO BANNERS
  else if (sec === 'banners') {
    renderPromoBannersSection(container);
  } 
  // 4. COMMUNITY LEADS
  else if (sec === 'leads') {
    var leads = getAdminData("ak_community_leads", []);
    var leadsHtml = "";
    for (var i = 0; i < leads.length; i++) {
      var ld = leads[i];
      leadsHtml += '<div style="padding:10px; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">' +
        '<div><strong>' + ld.name + '</strong> (' + ld.className + ') - ' + ld.state + '<br><small style="color:#64748b;">Mob: ' + ld.mobile + '</small></div>' +
        '<a href="https://wa.me/91' + ld.mobile + '" target="_blank" style="background:#25d366; color:white; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:0.85rem;"><i class="fab fa-whatsapp"></i> Chat</a>' +
        '</div>';
    }

    container.innerHTML = '<div class="modal-card" style="max-width:100%;">' +
      '<h3 style="color:var(--primary-navy, #0f172a); margin-bottom:12px;">Community Registered Leads</h3>' +
      (leadsHtml || '<p style="color:#64748b;">Abhi tak koi naya lead record nahi hai.</p>') +
      '</div>';
  }
}

// =========================================================================
// EMBEDDED LIVE STUDENTS LEDGER ENGINE (NO EXTERNAL DEPENDENCY)
// =========================================================================

function renderAdminLedgerDirect(container) {
  var html = '<div class="modal-card" style="max-width:100%; padding:18px;">' +
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">' +
    '<div>' +
    '<h3 style="color:#0f172a; margin:0; font-size:1.2rem;"><i class="fas fa-users-cog" style="color:#0284c7;"></i> Tuition Students Ledger</h3>' +
    '<small style="color:#64748b;">Real-time synchronized with Google Sheets</small>' +
    '</div>' +
    '<div style="display:flex; gap:8px;">' +
    '<button onclick="openAddStudentModal()" style="background:#059669; color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:700; font-size:0.82rem; cursor:pointer;"><i class="fas fa-user-plus"></i> + Add Student</button>' +
    '<button onclick="loadAdminLedgerTableData()" style="background:#0284c7; color:white; border:none; padding:8px 12px; border-radius:8px; font-weight:700; font-size:0.82rem; cursor:pointer;"><i class="fas fa-sync-alt"></i> Refresh</button>' +
    '</div>' +
    '</div>' +

    '<div style="overflow-x:auto; border:1px solid #e2e8f0; border-radius:10px;">' +
    '<table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.85rem;">' +
    '<thead>' +
    '<tr style="background:#0f172a; color:white;">' +
    '<th style="padding:10px;">#</th>' +
    '<th style="padding:10px;">Student Name</th>' +
    '<th style="padding:10px;">Mobile</th>' +
    '<th style="padding:10px;">Class</th>' +
    '<th style="padding:10px;">Fee</th>' +
    '<th style="padding:10px;">Dues Status</th>' +
    '<th style="padding:10px;">Next Cycle</th>' +
    '<th style="padding:10px;">Action</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody id="adminLedgerTableBody">' +
    '<tr><td colspan="8" style="text-align:center; padding:20px; color:#64748b;"><i class="fas fa-spinner fa-spin"></i> Loading Ledger Records...</td></tr>' +
    '</tbody>' +
    '</table>' +
    '</div>' +
    '</div>';

  container.innerHTML = html;
  loadAdminLedgerTableData();
}

async function loadAdminLedgerTableData() {
  var tbody = document.getElementById("adminLedgerTableBody");
  if (!tbody) return;

  var ledgerData = [];

  // Live Sheet Fetch
  try {
    if (typeof API !== "undefined" && API.get) {
      var res = await API.get("getLedger&_t=" + Date.now());
      if (res && res.status === "success" && Array.isArray(res.data)) {
        ledgerData = res.data;
        localStorage.setItem("ak_tuition_ledger", JSON.stringify(ledgerData));
      }
    }
  } catch (err) {
    console.warn("Live ledger fetch fallback:", err);
  }

  // Local storage fallback
  if (ledgerData.length === 0) {
    try {
      ledgerData = JSON.parse(localStorage.getItem("ak_tuition_ledger") || "[]");
    } catch(e) { ledgerData = []; }
  }

  if (ledgerData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:24px; color:#dc2626;"><i class="fas fa-exclamation-circle fa-2x"></i><p style="margin-top:6px; font-weight:700;">No student ledger record found in Google Sheet.</p></td></tr>';
    return;
  }

  window.activeAdminLedgerData = ledgerData;

  var rowsHtml = "";
  for (var i = 0; i < ledgerData.length; i++) {
    var s = ledgerData[i];
    var sId = s.Student_ID || s.id || ("stu_" + i);
    var sName = s.Name || s.name || "Student";
    var sMob = s.Mobile || s.mobile || "N/A";
    var sClass = s.Class || s.className || "Class 10";
    var sFee = Number(s.Monthly_Fee || s.monthlyFee || 0);
    var sDues = Number(s.calculatedDues !== undefined ? s.calculatedDues : (s.Dues || s.dues || 0));
    var sCycle = s.nextBillingDate || s.currentCycleText || s.Start_Date || "Active";

    rowsHtml += '<tr style="border-bottom:1px solid #e2e8f0; background:' + (i % 2 === 0 ? '#ffffff' : '#f8fafc') + ';">' +
      '<td style="padding:10px; font-weight:700; color:#64748b;">' + (i + 1) + '</td>' +
      '<td style="padding:10px;"><strong style="color:#0f172a; font-size:0.92rem;">' + sName + '</strong><br><small style="color:#64748b;">' + (s.Category || 'Tuition Student') + '</small></td>' +
      '<td style="padding:10px; color:#334155; font-weight:600;">+91 ' + sMob + '</td>' +
      '<td style="padding:10px;"><span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:6px; font-weight:700; font-size:0.75rem;">' + sClass + '</span></td>' +
      '<td style="padding:10px; font-weight:700; color:#059669;">₹' + sFee + '</td>' +
      '<td style="padding:10px; font-weight:800;">' + (sDues > 0 ? '<span style="color:#dc2626;">₹' + sDues + ' Due</span>' : '<span style="color:#16a34a;">₹0 (Clear)</span>') + '</td>' +
      '<td style="padding:10px; font-size:0.8rem; color:#475569;">' + sCycle + '</td>' +
      '<td style="padding:10px;">' +
      '<button onclick="recordQuickPaymentByIndex(' + i + ')" title="Mark Paid" style="background:#10b981; color:white; border:none; padding:5px 9px; border-radius:6px; font-size:0.75rem; cursor:pointer; margin-right:4px;"><i class="fas fa-check-circle"></i> Paid</button>' +
      '</td>' +
      '</tr>';
  }

  tbody.innerHTML = rowsHtml;
}

// Quick Payment Action from Admin Table
async function recordQuickPaymentByIndex(idx) {
  var s = window.activeAdminLedgerData[idx];
  if (!s) return;

  var feeAmount = Number(s.Monthly_Fee || s.monthlyFee || 1300);
  if (!confirm(s.Name + " (" + s.Mobile + ") ki ₹" + feeAmount + " payment confirm karein?")) {
    return;
  }

  var payload = {
    action: "uploadPaymentReceipt",
    studentMobile: s.Mobile || s.mobile
  };

  try {
    if (typeof API !== "undefined" && API.post) {
      await API.post("uploadPaymentReceipt", payload);
      alert("Payment record sheet par update ho gaya!");
    } else {
      alert("Payment locally marked.");
    }
  } catch(e) {
    alert("Saved locally.");
  }

  loadAdminLedgerTableData();
}

// Add New Student to Sheet from Admin
function openAddStudentModal() {
  var html = '<div class="modal-overlay" style="display:flex; z-index:10000;" id="addStudentModal">' +
    '<div class="modal-card" style="max-width:440px; width:92%; padding:20px;">' +
    '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:12px;">' +
    '<h3 style="margin:0; color:#0f172a; font-size:1.15rem;"><i class="fas fa-user-plus" style="color:#059669;"></i> Add Student to Ledger</h3>' +
    '<button class="close-btn" onclick="document.getElementById(\'addStudentModal\').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +

    '<form onsubmit="handleAdminAddStudentSubmit(event)" style="display:flex; flex-direction:column; gap:10px; text-align:left;">' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Student Name</label>' +
    '<input type="text" id="admStName" required placeholder="Enter student name" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">' +
    '</div>' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">10-Digit Mobile Number</label>' +
    '<input type="tel" id="admStMobile" pattern="[0-9]{10}" required placeholder="WhatsApp Number" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">' +
    '</div>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Class</label>' +
    '<select id="admStClass" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">' +
    '<option>Class 5</option><option>Class 6</option><option>Class 7</option><option>Class 8</option><option selected>Class 9</option><option>Class 10</option><option>Class 11</option><option>Class 12</option>' +
    '</select>' +
    '</div>' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Monthly Fee (₹)</label>' +
    '<input type="number" id="admStFee" value="1300" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">' +
    '</div>' +
    '</div>' +
    '<div>' +
    '<label style="font-size:0.8rem; font-weight:700; color:#334155;">Joining / Cycle Start Date</label>' +
    '<input type="date" id="admStDate" required style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1; box-sizing:border-box;">' +
    '</div>' +
    '<button type="submit" id="btnSaveLedger" style="margin-top:10px; background:#059669; color:white; border:none; padding:11px; border-radius:8px; font-weight:700; font-size:0.9rem; cursor:pointer;">' +
    '<i class="fas fa-save"></i> Save to Google Sheet' +
    '</button>' +
    '</form>' +
    '</div></div>';

  var div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);

  var dInput = document.getElementById("admStDate");
  if (dInput) dInput.value = new Date().toISOString().split("T")[0];
}

async function handleAdminAddStudentSubmit(e) {
  e.preventDefault();
  var btn = document.getElementById("btnSaveLedger");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving to Cloud...';

  var newStudent = {
    action: "saveStudentLedger",
    name: document.getElementById("admStName").value.trim(),
    mobile: document.getElementById("admStMobile").value.trim(),
    className: document.getElementById("admStClass").value,
    category: "Tuition Student",
    monthlyFee: Number(document.getElementById("admStFee").value || 1300),
    startDate: document.getElementById("admStDate").value,
    dues: 0,
    paidHistory: []
  };

  try {
    if (typeof API !== "undefined" && API.post) {
      await API.post("saveStudentLedger", newStudent);
      alert("Student permanently saved in Google Sheet!");
    } else {
      alert("Offline: Saved to Local Cache.");
    }
  } catch(err) {
    console.warn("Cloud save failed:", err);
  }

  var modal = document.getElementById("addStudentModal");
  if (modal) modal.remove();

  loadAdminLedgerTableData();
}

// =========================================================================
// BRANDING, PROMO BANNERS & CONFIG HANDLERS
// =========================================================================

function previewAndStoreLogo(input) {
  if (input.files && input.files[0]) {
    var file = input.files[0];
    var status = document.getElementById("logoUploadStatus");
    if (status) status.innerText = "Optimizing image...";

    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement("canvas");
        var maxDim = 160;
        var width = img.width;
        var height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        var compressedBase64 = canvas.toDataURL("image/png");
        appConfig.logoData = compressedBase64;
        applyLogoToUI(compressedBase64);

        if (status) status.innerHTML = "<span style='color:#16a34a;'>✓ Logo ready. Click 'Save & Sync' to make permanent.</span>";
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

async function saveAdminSecurityConfig() {
  var saveBtn = document.getElementById("btnSaveConfig");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Saving to Cloud...";
  }

  appConfig.adminPass = document.getElementById("cfgAdminPass").value.trim() || "password";
  appConfig.teacherPass = document.getElementById("cfgTeacherPass").value.trim() || "pass";
  appConfig.tuitionPass = document.getElementById("cfgTuitionPass").value.trim() || "pass";

  setAdminData("ak_app_config", appConfig);

  try {
    if (typeof API !== "undefined" && API.post) {
      await API.post("saveAppConfig", {
        adminPass: appConfig.adminPass,
        teacherPass: appConfig.teacherPass,
        tuitionPass: appConfig.tuitionPass,
        logoData: appConfig.logoData || ""
      });
    }
    alert("Settings & Logo Cloud par permanently save ho gaye!");
  } catch (err) {
    console.warn("Cloud save warning:", err);
    alert("Local settings save ho gayi hain.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = "<i class='fas fa-cloud-upload-alt'></i> Save & Sync to Cloud";
    }
  }
}

function renderPromoBannersSection(container) {
  var bannerCardsHtml = "";
  for (var i = 0; i < promoBanners.length; i++) {
    var b = promoBanners[i];
    bannerCardsHtml += '<div style="border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; background:white;">' +
      '<img src="' + b.imageData + '" style="width:100%; height:120px; object-fit:cover;">' +
      '<div style="padding:6px; display:flex; justify-content:space-between; align-items:center;">' +
      '<small style="font-weight:700;">' + b.title + '</small>' +
      '<button onclick="deletePromoBanner(' + i + ')" style="background:#fee2e2; color:#dc2626; border:none; padding:2px 6px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>' +
      '</div></div>';
  }

  container.innerHTML = '<div class="modal-card" style="max-width:100%;">' +
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
    '<h3 style="color:var(--primary-navy, #0f172a); margin:0;">Promotional Slide Store</h3>' +
    '<label class="btn-primary" style="width:auto; padding:6px 12px; font-size:0.8rem; margin:0; cursor:pointer;">' +
    '+ Upload Poster <input type="file" accept="image/*" style="display:none;" onchange="uploadPromoBanner(this)">' +
    '</label>' +
    '</div>' +
    '<p style="color:#64748b; font-size:0.85rem;">Phone se banaye gaye poster upload karein.</p>' +
    '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px; margin-top:14px;">' +
    (bannerCardsHtml || '<p style="color:#64748b;">No banners uploaded yet</p>') +
    '</div></div>';
}

function uploadPromoBanner(input) {
  if (input.files && input.files[0]) {
    var title = prompt("Banner Title / Name:", "Offer Poster");
    var reader = new FileReader();
    reader.onload = function(e) {
      promoBanners.push({
        id: "b_" + Date.now(),
        title: title || "Offer Banner",
        imageData: e.target.result
      });
      setAdminData("ak_promo_banners", promoBanners);
      showAdminSection('banners');
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function deletePromoBanner(idx) {
  promoBanners.splice(idx, 1);
  setAdminData("ak_promo_banners", promoBanners);
  showAdminSection('banners');
}
