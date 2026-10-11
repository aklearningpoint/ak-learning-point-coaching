// Admin Master Control: Logo Upload, Passwords, Tuition Ledger & Promo Banner Store

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

// Config Cache
var appConfig = getAdminData("ak_app_config", {
  adminPass: "password",
  teacherPass: "pass",
  tuitionPass: "pass",
  logoData: ""
});

var promoBanners = getAdminData("ak_promo_banners", []);

var tuitionLedger = getAdminData("ak_tuition_ledger", [
  {
    id: "stu_1",
    name: "Aarav Kumar",
    mobile: "9876543210",
    monthlyFee: 1000,
    startDate: "2026-09-10",
    history: []
  }
]);

// Set logo on DOM load
window.addEventListener("DOMContentLoaded", function() {
  if (appConfig.logoData) {
    var el = document.getElementById("appLogo");
    if (el) el.src = appConfig.logoData;
  }
});

function openAdminPortal() {
  if (typeof toggleDrawer === "function") toggleDrawer();

  var enteredPass = prompt("Enter Master Admin Password (Default: *****):");
  if (enteredPass === appConfig.adminPass || enteredPass === "password") {
    renderAdminDashboard();
  } else if (enteredPass !== null) {
    alert("Incorrect Admin Password! (Default is: password)");
  }
}

function renderAdminDashboard() {
  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f8fafc; z-index:3000; display:flex; flex-direction:column;">' +
    '<div style="height:55px; background:var(--primary-navy); color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px;">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<i class="fas fa-user-shield" style="color:#fbbf24;"></i>' +
    '<strong>Master Admin Panel</strong>' +
    '</div>' +
    '<div style="display:flex; align-items:center; gap:10px;">' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '<button onclick="closeDynamicView()" style="background:none; border:none; color:white; font-size:1.3rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '</div>' +
    '<div style="background:white; border-bottom:1px solid #e2e8f0; display:flex; overflow-x:auto; padding:8px 12px; gap:8px;">' +
    '<button class="btn-primary" style="width:auto; padding:6px 12px; font-size:0.85rem; margin:0;" onclick="showAdminSection(\'branding\')">Logo & Security</button>' +
    '<button class="btn-primary" style="width:auto; padding:6px 12px; font-size:0.85rem; margin:0; background:#0284c7;" onclick="showAdminSection(\'ledger\')">Tuition Ledger</button>' +
    '<button class="btn-primary" style="width:auto; padding:6px 12px; font-size:0.85rem; margin:0; background:#7c3aed;" onclick="showAdminSection(\'banners\')">Promo Slides Store</button>' +
    '<button class="btn-primary" style="width:auto; padding:6px 12px; font-size:0.85rem; margin:0; background:#059669;" onclick="showAdminSection(\'leads\')">Student Leads</button>' +
    '</div>' +
    '<div id="adminContentBody" style="flex:1; overflow-y:auto; padding:16px; max-width:900px; margin:0 auto; width:100%;"></div>' +
    '</div>';

  document.getElementById("dynamicView").innerHTML = html;
  showAdminSection('branding');
}

function showAdminSection(sec) {
  var container = document.getElementById("adminContentBody");

  if (sec === 'branding') {
    var brandingHtml = '<div class="modal-card" style="max-width:100%;">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
      '<h3 style="color:var(--primary-navy); margin:0;">App Logo & Passwords</h3>' +
      '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Upload App Logo (Direct File From Mobile / PC)</label>' +
      '<input type="file" id="adminLogoFileInput" accept="image/*" onchange="previewAndStoreLogo(this)">' +
      '<div style="margin-top:8px;">' +
      '<img id="logoPreviewImg" src="' + (appConfig.logoData || 'https://via.placeholder.com/60') + '" style="width:60px; height:60px; border-radius:50%; border:2px solid #cbd5e1; object-fit:cover;">' +
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
      '<button class="btn-primary" onclick="saveAdminSecurityConfig()">Save & Lock Changes</button>' +
      '</div>';

    container.innerHTML = brandingHtml;
  } else if (sec === 'ledger') {
    renderTuitionLedgerSection(container);
  } else if (sec === 'banners') {
    renderPromoBannersSection(container);
  } else if (sec === 'leads') {
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
      '<h3 style="color:var(--primary-navy); margin-bottom:12px;">Community Registered Leads</h3>' +
      (leadsHtml || '<p style="color:#64748b;">Abhi tak koi naya lead record nahi hai.</p>') +
      '</div>';
  }
}

function previewAndStoreLogo(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      appConfig.logoData = e.target.result;
      var preview = document.getElementById("logoPreviewImg");
      if (preview) preview.src = e.target.result;
      var mainLogo = document.getElementById("appLogo");
      if (mainLogo) mainLogo.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function saveAdminSecurityConfig() {
  appConfig.adminPass = document.getElementById("cfgAdminPass").value.trim() || "password";
  appConfig.teacherPass = document.getElementById("cfgTeacherPass").value.trim() || "pass";
  appConfig.tuitionPass = document.getElementById("cfgTuitionPass").value.trim() || "pass";
  setAdminData("ak_app_config", appConfig);
  alert("Settings & Passwords saved successfully!");
}

// Tuition Ledger Financials Calculator
function calculateStudentFinancials(student) {
  var start = new Date(student.startDate);
  var today = new Date();

  var totalMonthsDue = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
  if (today.getDate() >= start.getDate()) {
    totalMonthsDue += 1;
  }
  totalMonthsDue = Math.max(1, totalMonthsDue);

  var totalFeeObligation = totalMonthsDue * Number(student.monthlyFee);
  var totalPaid = 0;
  var hist = student.history || [];
  for (var i = 0; i < hist.length; i++) {
    totalPaid += Number(hist[i].amount);
  }

  var pendingBalance = Math.max(0, totalFeeObligation - totalPaid);
  return { totalMonthsDue: totalMonthsDue, totalPaid: totalPaid, pendingBalance: pendingBalance };
}

function renderTuitionLedgerSection(container) {
  var totalMonthlyPotential = 0;
  var totalOutstandingDues = 0;
  var monthlyCollectionMap = {};

  for (var i = 0; i < tuitionLedger.length; i++) {
    var s = tuitionLedger[i];
    totalMonthlyPotential += Number(s.monthlyFee);
    var fin = calculateStudentFinancials(s);
    totalOutstandingDues += fin.pendingBalance;

    var hist = s.history || [];
    for (var j = 0; j < hist.length; j++) {
      var mKey = hist[j].monthName || "General";
      monthlyCollectionMap[mKey] = (monthlyCollectionMap[mKey] || 0) + Number(hist[j].amount);
    }
  }

  var collectionCardsHtml = "";
  var mKeys = Object.keys(monthlyCollectionMap);
  for (var k = 0; k < mKeys.length; k++) {
    collectionCardsHtml += '<span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:6px; font-weight:700; margin-right:6px;">' + mKeys[k] + ': ₹' + monthlyCollectionMap[mKeys[k]] + '</span>';
  }

  var rowsHtml = "";
  for (var idx = 0; idx < tuitionLedger.length; idx++) {
    var st = tuitionLedger[idx];
    var stFin = calculateStudentFinancials(st);
    var cycleDay = new Date(st.startDate).getDate();

    rowsHtml += '<tr style="border-bottom:1px solid #e2e8f0;">' +
      '<td style="padding:8px;"><strong>' + st.name + '</strong><br><small style="color:#64748b;">' + st.mobile + '</small></td>' +
      '<td style="padding:8px;">' + cycleDay + 'th of Month<br><small style="color:#64748b;">From ' + st.startDate + '</small></td>' +
      '<td style="padding:8px; font-weight:700;">₹' + st.monthlyFee + '</td>' +
      '<td style="padding:8px; font-weight:800; color:' + (stFin.pendingBalance > 0 ? '#dc2626' : '#16a34a') + ';">₹' + stFin.pendingBalance + '</td>' +
      '<td style="padding:8px;">' +
      '<div style="display:flex; gap:4px; flex-wrap:wrap;">' +
      '<button onclick="recordFeePayment(' + idx + ')" style="background:#0284c7; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-hand-holding-usd"></i> Pay</button>' +
      '<button onclick="sendDueReminderWhatsApp(' + idx + ')" style="background:#f59e0b; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fab fa-whatsapp"></i> Due</button>' +
      '<button onclick="openAddEditStudentModal(' + idx + ')" style="background:#64748b; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>' +
      '<button onclick="deleteTuitionStudent(' + idx + ')" style="background:#fee2e2; color:#dc2626; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
  }

  var ledgerHtml = '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:14px;">' +
    '<div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #cbd5e1; text-align:center;">' +
    '<small style="color:#64748b;">Monthly Potential</small>' +
    '<div style="font-size:1.3rem; font-weight:800; color:#0284c7;">₹' + totalMonthlyPotential + '</div>' +
    '</div>' +
    '<div style="background:#fef2f2; padding:12px; border-radius:8px; border:1px solid #fecaca; text-align:center;">' +
    '<small style="color:#dc2626;">Total Pending Dues</small>' +
    '<div style="font-size:1.3rem; font-weight:800; color:#dc2626;">₹' + totalOutstandingDues + '</div>' +
    '</div>' +
    '<div style="background:#f0fdf4; padding:12px; border-radius:8px; border:1px solid #bbf7d0; text-align:center;">' +
    '<small style="color:#16a34a;">Monthly Collection</small>' +
    '<div style="font-size:0.85rem; margin-top:4px;">' + (collectionCardsHtml || '<span>No payments yet</span>') + '</div>' +
    '</div>' +
    '</div>' +
    '<div class="modal-card" style="max-width:100%;">' +
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
    '<h3 style="color:var(--primary-navy); margin:0;">Enrolled Tuition Students</h3>' +
    '<button class="btn-primary" style="width:auto; padding:6px 12px; font-size:0.8rem; margin:0;" onclick="openAddEditStudentModal()">+ Add Student</button>' +
    '</div>' +
    '<div style="overflow-x:auto;">' +
    '<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">' +
    '<thead><tr style="background:#f1f5f9; text-align:left; border-bottom:2px solid #cbd5e1;">' +
    '<th style="padding:8px;">Name / Mob</th><th style="padding:8px;">Cycle Day</th><th style="padding:8px;">Monthly Fee</th><th style="padding:8px;">Balance Due</th><th style="padding:8px;">Actions</th>' +
    '</tr></thead><tbody>' + (rowsHtml || '<tr><td colspan="5" style="text-align:center; padding:12px;">No students added yet</td></tr>') + '</tbody></table>' +
    '</div></div>';

  container.innerHTML = ledgerHtml;
}

function openAddEditStudentModal(idx) {
  var student = (idx !== undefined && idx !== null) ? tuitionLedger[idx] : { name: "", mobile: "", monthlyFee: "", startDate: new Date().toISOString().split("T")[0] };

  var html = '<div class="modal-overlay" style="display:flex; z-index:3500;" id="tuitionModal">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<h3>' + ((idx !== undefined && idx !== null) ? 'Edit Student Details' : 'Add New Tuition Student') + '</h3>' +
    '<button class="close-btn" onclick="document.getElementById(\'tuitionModal\').remove()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<form onsubmit="handleSaveTuitionStudent(event, ' + (idx !== undefined && idx !== null ? idx : 'null') + ')">' +
    '<div class="form-group"><label>Student Name</label><input type="text" id="tsName" value="' + student.name + '" required></div>' +
    '<div class="form-group"><label>WhatsApp Number</label><input type="tel" id="tsMobile" pattern="[0-9]{10}" value="' + student.mobile + '" required></div>' +
    '<div class="form-group"><label>Monthly Fee (₹)</label><input type="number" id="tsFee" value="' + student.monthlyFee + '" required></div>' +
    '<div class="form-group"><label>Cycle Start Date (Billing Date)</label><input type="date" id="tsStartDate" value="' + student.startDate + '" required></div>' +
    '<button type="submit" class="btn-primary">Save Student</button>' +
    '</form>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML += html;
}

function handleSaveTuitionStudent(e, idx) {
  e.preventDefault();
  var data = {
    id: (idx !== null) ? tuitionLedger[idx].id : "stu_" + Date.now(),
    name: document.getElementById("tsName").value.trim(),
    mobile: document.getElementById("tsMobile").value.trim(),
    monthlyFee: Number(document.getElementById("tsFee").value),
    startDate: document.getElementById("tsStartDate").value,
    history: (idx !== null) ? tuitionLedger[idx].history : []
  };

  if (idx !== null) {
    tuitionLedger[idx] = data;
  } else {
    tuitionLedger.push(data);
  }

  setAdminData("ak_tuition_ledger", tuitionLedger);
  var modal = document.getElementById("tuitionModal");
  if (modal) modal.remove();
  showAdminSection('ledger');
}

function deleteTuitionStudent(idx) {
  if (confirm("Kya aap " + tuitionLedger[idx].name + " ko permanently delete karna chahte hain?")) {
    tuitionLedger.splice(idx, 1);
    setAdminData("ak_tuition_ledger", tuitionLedger);
    showAdminSection('ledger');
  }
}

function recordFeePayment(idx) {
  var student = tuitionLedger[idx];
  var amount = prompt("Enter amount received from " + student.name + " (Monthly: ₹" + student.monthlyFee + "):", student.monthlyFee);
  if (!amount) return;

  var monthName = prompt("Enter Month Name (e.g. October 2026):", "October 2026");

  student.history.push({
    amount: Number(amount),
    monthName: monthName || "General",
    date: new Date().toISOString()
  });

  setAdminData("ak_tuition_ledger", tuitionLedger);
  showAdminSection('ledger');

  var fin = calculateStudentFinancials(student);
  var text = encodeURIComponent(
    "✅ *AK Learning Point Coaching - Tuition Fee Receipt*\n" +
    "Dear " + student.name + ",\n" +
    "Aapki fee amount ₹" + amount + " (" + monthName + ") safaltapurvak prapt ho gayi hai. Shukriya!\n" +
    "Total Remaining Balance Due: ₹" + fin.pendingBalance + "\n\n" +
    "App: " + window.location.origin + window.location.pathname
  );
  window.open("https://api.whatsapp.com/send?phone=91" + student.mobile + "&text=" + text, "_blank");
}

function sendDueReminderWhatsApp(idx) {
  var student = tuitionLedger[idx];
  var fin = calculateStudentFinancials(student);

  var text = encodeURIComponent(
    "🔔 *AK Learning Point Coaching - Tuition Fee Reminder*\n" +
    "Dear Parent / " + student.name + ",\n" +
    "Aapki monthly tuition fee cycle update ho chuki hai:\n" +
    "• Monthly Fee: ₹" + student.monthlyFee + "\n" +
    "• *Total Outstanding Due: ₹" + fin.pendingBalance + "*\n\n" +
    "Kripya samay par jama karein. Dhanyawad!\n" +
    "App: " + window.location.origin + window.location.pathname
  );
  window.open("https://api.whatsapp.com/send?phone=91" + student.mobile + "&text=" + text, "_blank");
}

// Promotional Banner Slide Store
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
    '<h3 style="color:var(--primary-navy); margin:0;">Promotional Slide Store</h3>' +
    '<label class="btn-primary" style="width:auto; padding:6px 12px; font-size:0.8rem; margin:0; cursor:pointer;">' +
    '+ Upload Poster <input type="file" accept="image/*" style="display:none;" onchange="uploadPromoBanner(this)">' +
    '</label>' +
    '</div>' +
    '<p style="color:#64748b; font-size:0.85rem;">Phone se banaye gaye poster upload karein. WhatsApp smart share par inhe attach kar sakte hain.</p>' +
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

// Smart Share Interceptor
function triggerSmartShare(customText) {
  var d = document.getElementById("drawerOverlay");
  if (d && d.classList.contains("open")) {
    toggleDrawer();
  }

  var baseMessage = customText || "🎯 *AK Learning Point Coaching - Gyan ki nayi shuruat!*\nCBSE & BSEB Online Quizzes, Notes aur Tuition Classes.\nApp Link: " + window.location.origin + window.location.pathname;

  if (promoBanners.length === 0) {
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(baseMessage), "_blank");
    return;
  }

  var bannerSelectHtml = "";
  for (var i = 0; i < promoBanners.length; i++) {
    var b = promoBanners[i];
    bannerSelectHtml += '<div onclick="shareWithSelectedBanner(\'' + encodeURIComponent(baseMessage) + '\', \'' + b.title + '\')" style="border:2px solid #cbd5e1; border-radius:8px; padding:6px; cursor:pointer; text-align:center;">' +
      '<img src="' + b.imageData + '" style="width:100%; height:70px; object-fit:cover; border-radius:4px;">' +
      '<small style="font-weight:700; display:block; margin-top:4px;">' + b.title + '</small>' +
      '</div>';
  }

  document.getElementById("dynamicView").innerHTML = '<div class="modal-overlay" style="display:flex;">' +
    '<div class="modal-card">' +
    '<div class="modal-header">' +
    '<h3>Promotional Ad Attach Karein?</h3>' +
    '<button class="close-btn" onclick="closeDynamicView()"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<p style="font-size:0.85rem; color:#64748b; margin-bottom:12px;">Kya aap message ke sath koi poster attach karna chahte hain?</p>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:220px; overflow-y:auto; margin-bottom:12px;">' +
    bannerSelectHtml +
    '</div>' +
    '<button class="btn-primary" style="background:#64748b;" onclick="window.open(\'https://api.whatsapp.com/send?text=' + encodeURIComponent(baseMessage) + '\', \'_blank\'); closeDynamicView();">' +
    'Bina Poster Ke Direct Share Karein' +
    '</button>' +
    '</div></div>';
}

function shareWithSelectedBanner(encodedBaseMsg, bannerTitle) {
  var fullText = decodeURIComponent(encodedBaseMsg) + "\n\n📢 *Special Attachment: [" + bannerTitle + "]*";
  window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(fullText), "_blank");
  closeDynamicView();
}
