// Admin Master Control: Cloud Logo Upload, Passwords, Promo Slides & Leads

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

// Config Cache
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
    '<div style="height:55px; background:var(--primary-navy, #0f172a); color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px;">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<i class="fas fa-user-shield" style="color:#fbbf24;"></i>' +
    '<strong>Master Admin Panel</strong>' +
    '</div>' +
    '<div style="display:flex; align-items:center; gap:10px;">' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '<button onclick="closeDynamicView()" style="background:none; border:none; color:white; font-size:1.3rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '</div>' +
    
    // Symmetrical Admin Navigation Bar
    '<div style="background:white; border-bottom:1px solid #e2e8f0; display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); padding:10px 12px; gap:8px;">' +
    '<button id="admBtn_branding" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#1e40af; border:2px solid transparent;" onclick="showAdminSection(\'branding\')"><i class="fas fa-shield-alt"></i> Logo & Security</button>' +
    '<button id="admBtn_ledger" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#0284c7; border:2px solid transparent;" onclick="showAdminSection(\'ledger\')"><i class="fas fa-users-cog"></i> Student & Ledger</button>' +
    '<button id="admBtn_notice" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#eab308; color:#0f172a; font-weight:700; border:2px solid transparent;" onclick="openTeacherNotificationModal()"><i class="fas fa-bullhorn"></i> Post Notice</button>' +
    '<button id="admBtn_banners" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#7c3aed; border:2px solid transparent;" onclick="showAdminSection(\'banners\')"><i class="fas fa-images"></i> Promo Slides</button>' +
    '<button id="admBtn_leads" class="btn-primary" style="padding:8px 10px; font-size:0.82rem; margin:0; border-radius:8px; background:#059669; border:2px solid transparent;" onclick="showAdminSection(\'leads\')"><i class="fas fa-address-book"></i> Student Leads</button>' +
    '</div>' +

    '<div id="adminContentBody" style="flex:1; overflow-y:auto; padding:16px; max-width:900px; margin:0 auto; width:100%;"></div>' +
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
  } else if (sec === 'ledger') {
    if (typeof renderTuitionLedgerSection === "function") {
      renderTuitionLedgerSection(container);
    }
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
      '<h3 style="color:var(--primary-navy, #0f172a); margin-bottom:12px;">Community Registered Leads</h3>' +
      (leadsHtml || '<p style="color:#64748b;">Abhi tak koi naya lead record nahi hai.</p>') +
      '</div>';
  }
}

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
