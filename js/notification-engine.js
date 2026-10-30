// ==========================================
// AK LEARNING POINT - NOTIFICATION ENGINE
// ==========================================

function openTeacherNotificationModal() {
  if (typeof updateTeacherTabAppearance === "function") {
    updateTeacherTabAppearance('notice');
  }
  
  var modalHtml = '<div class="modal-overlay" style="display:flex; z-index:3600;" id="teacherNoticeModal">' +
    '<div class="modal-card" style="max-width:580px; width:92%; max-height:90vh; overflow-y:auto;">' +
    '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">' +
    '<h3 style="margin:0; color:var(--primary-navy, #0f172a);"><i class="fas fa-bullhorn" style="color:#eab308;"></i> Post Class Notification</h3>' +
    '<button class="close-btn" onclick="document.getElementById(\'teacherNoticeModal\').remove(); if(typeof updateTeacherTabAppearance===\'function\') updateTeacherTabAppearance(currentTeacherActiveTab);" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +

    '<div style="margin-top:12px; display:flex; flex-direction:column; gap:10px;">' +
    '<div class="form-group">' +
    '<label style="font-size:0.85rem; font-weight:600;">Notice Title / Heading</label>' +
    '<input type="text" id="notifTitle" placeholder="e.g. Science Test Alert / Tomorrow Holiday" required style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;">' +
    '</div>' +

    '<div class="form-group">' +
    '<label style="font-size:0.85rem; font-weight:600;">Target Audience / Class Filter</label>' +
    '<select id="notifClass" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-weight:600;">' +
    '<option value="All Classes">📢 All Classes (Entire School/Coaching)</option>' +
    '<option value="Class 1">Class 1</option><option value="Class 2">Class 2</option><option value="Class 3">Class 3</option>' +
    '<option value="Class 4">Class 4</option><option value="Class 5">Class 5</option><option value="Class 6">Class 6</option>' +
    '<option value="Class 7">Class 7</option><option value="Class 8">Class 8</option><option value="Class 9">Class 9</option>' +
    '<option value="Class 10">Class 10</option><option value="Class 11">Class 11</option><option value="Class 12">Class 12</option>' +
    '</select>' +
    '</div>' +

    '<div class="form-group">' +
    '<label style="font-size:0.85rem; font-weight:600;">Detailed Message / Announcement</label>' +
    '<textarea id="notifMessage" rows="5" placeholder="Bacchon ke liye poori jankari yahan likhein..." style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-family:sans-serif;"></textarea>' +
    '</div>' +

    '<div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">' +
    '<button class="nav-pill-btn nav-back-btn" onclick="document.getElementById(\'teacherNoticeModal\').remove(); if(typeof updateTeacherTabAppearance===\'function\') updateTeacherTabAppearance(currentTeacherActiveTab);">Cancel</button>' +
    '<button class="btn-primary" style="background:#16a34a; width:auto; padding:6px 18px; margin:0;" onclick="saveTeacherNotification()"><i class="fas fa-paper-plane"></i> Publish Notification</button>' +
    '</div>' +
    '</div>' +
    '</div></div>';

  var div = document.createElement("div");
  div.innerHTML = modalHtml;
  document.body.appendChild(div.firstElementChild);
}

async function saveTeacherNotification() {
  var title = document.getElementById("notifTitle").value.trim();
  var targetClass = document.getElementById("notifClass").value;
  var message = document.getElementById("notifMessage").value.trim();

  if (!title || !message) {
    alert("Title aur Message dono bharna zaroori hai!");
    return;
  }

  var newNotice = {
    id: "notif_" + Date.now(),
    title: title,
    targetClass: targetClass,
    message: message,
    postedBy: "Teacher / Faculty",
    date: new Date().toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: new Date().toISOString()
  };

  // 1. LocalStorage Me Sync
  var notifications = [];
  try {
    notifications = JSON.parse(localStorage.getItem("ak_notifications") || "[]");
  } catch(e) { notifications = []; }

  notifications.unshift(newNotice);
  localStorage.setItem("ak_notifications", JSON.stringify(notifications));

  // 2. Google Apps Script / Cloud Sync
  if (typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL && !CLOUD_SYNC_URL.includes("APNA_DEPLOYED")) {
    try {
      fetch(CLOUD_SYNC_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveNotification",
          notification: newNotice
        })
      });
    } catch(e) {
      console.warn("Could not sync notification to sheet:", e);
    }
  }

  alert("Notification Class " + targetClass + " ke liye successfully post ho gaya!");
  var modal = document.getElementById("teacherNoticeModal");
  if (modal) modal.remove();
  if (typeof updateTeacherTabAppearance === "function") {
    updateTeacherTabAppearance(currentTeacherActiveTab);
  }
}
