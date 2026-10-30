// ========================================================
// AK LEARNING POINT - STUDENT CLASSIFICATION & TUITION LEDGER
// ========================================================

function getTuitionData(key, fallback) {
  try {
    var val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setTuitionData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("Storage full or unavailable", e);
  }
}

var tuitionLedger = getTuitionData("ak_tuition_ledger", [
  {
    id: "stu_1",
    name: "Aarav Kumar",
    mobile: "9876543210",
    className: "Class 10",
    category: "Tuition Student",
    monthlyFee: 800,
    startDate: "2026-10-15",
    pin: "1234",
    history: []
  }
]);

// Financial Calculations (Cycle-wise)
function calculateStudentFinancials(student) {
  var start = new Date(student.startDate || new Date());
  var today = new Date();

  var totalMonthsDue = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
  if (today.getDate() >= start.getDate()) {
    totalMonthsDue += 1;
  }
  totalMonthsDue = Math.max(1, totalMonthsDue);

  var feeRate = Number(student.monthlyFee || 0);
  // Guest students are free
  if (student.category === "Guest Student") {
    feeRate = 0;
  }

  var totalFeeObligation = totalMonthsDue * feeRate;
  var totalPaid = 0;
  var hist = student.history || [];
  for (var i = 0; i < hist.length; i++) {
    totalPaid += Number(hist[i].amount);
  }

  var pendingBalance = Math.max(0, totalFeeObligation - totalPaid);
  return { totalMonthsDue: totalMonthsDue, totalPaid: totalPaid, pendingBalance: pendingBalance };
}

// Render Ledger & Classification in Admin Portal
function renderTuitionLedgerSection(container) {
  var totalMonthlyPotential = 0;
  var totalOutstandingDues = 0;
  var monthlyCollectionMap = {};

  for (var i = 0; i < tuitionLedger.length; i++) {
    var s = tuitionLedger[i];
    if (s.category !== "Guest Student") {
      totalMonthlyPotential += Number(s.monthlyFee || 0);
    }
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
    var cycleDay = new Date(st.startDate || new Date()).getDate();

    rowsHtml += '<tr style="border-bottom:1px solid #e2e8f0;">' +
      '<td style="padding:8px;"><strong>' + st.name + '</strong><br><small style="color:#64748b;">' + st.mobile + '</small></td>' +
      '<td style="padding:8px;"><span style="background:#e0e7ff; color:#3730a3; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:700;">' + (st.category || 'Tuition Student') + '</span><br><small>' + (st.className || 'Class 10') + '</small></td>' +
      '<td style="padding:8px;">' + cycleDay + 'th of Month<br><small style="color:#64748b;">From ' + (st.startDate || '—') + '</small></td>' +
      '<td style="padding:8px; font-weight:700;">₹' + (st.category === 'Guest Student' ? '0 (Free)' : st.monthlyFee) + '</td>' +
      '<td style="padding:8px; font-weight:800; color:' + (stFin.pendingBalance > 0 ? '#dc2626' : '#16a34a') + ';">₹' + stFin.pendingBalance + '</td>' +
      '<td style="padding:8px;">' +
      '<div style="display:flex; gap:4px; flex-wrap:wrap;">' +
      '<button onclick="recordFeePayment(' + idx + ')" style="background:#0284c7; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" title="Record Payment"><i class="fas fa-hand-holding-usd"></i> Pay</button>' +
      '<button onclick="sendDueReminderWhatsApp(' + idx + ')" style="background:#f59e0b; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" title="WhatsApp Reminder"><i class="fab fa-whatsapp"></i> Due</button>' +
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
    '<h3 style="color:var(--primary-navy, #0f172a); margin:0;">Student Classification & Ledger</h3>' +
    '<button class="btn-primary" style="width:auto; padding:6px 14px; font-size:0.85rem; margin:0;" onclick="openAddEditStudentModal()">+ Add New Student</button>' +
    '</div>' +
    '<div style="overflow-x:auto;">' +
    '<table style="width:100%; border-collapse:collapse; font-size:0.85rem;">' +
    '<thead><tr style="background:#f1f5f9; text-align:left; border-bottom:2px solid #cbd5e1;">' +
    '<th style="padding:8px;">Name / Mob</th><th style="padding:8px;">Category / Class</th><th style="padding:8px;">Billing Date</th><th style="padding:8px;">Monthly Fee</th><th style="padding:8px;">Balance Due</th><th style="padding:8px;">Actions</th>' +
    '</tr></thead><tbody>' + (rowsHtml || '<tr><td colspan="6" style="text-align:center; padding:12px;">No students added yet</td></tr>') + '</tbody></table>' +
    '</div></div>';

  container.innerHTML = ledgerHtml;
}

// Full Modal matching Screen Mockup (Classification, Fee, Pin)
function openAddEditStudentModal(idx) {
  var student = (idx !== undefined && idx !== null) ? tuitionLedger[idx] : {
    name: "",
    mobile: "",
    className: "Class 10",
    category: "Tuition Student",
    monthlyFee: 800,
    startDate: new Date().toISOString().split("T")[0],
    pin: "1234"
  };

  var categories = ["Tuition Student", "Online Class Student", "Weekend Class Student", "Guest Student"];
  var catOptions = "";
  categories.forEach(function(cat) {
    catOptions += '<option value="' + cat + '" ' + (student.category === cat ? 'selected' : '') + '>' + cat + '</option>';
  });

  var html = '<div class="modal-overlay" style="display:flex; z-index:3500;" id="tuitionModal">' +
    '<div class="modal-card" style="max-width:650px; width:92%; max-height:90vh; overflow-y:auto;">' +
    '<div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">' +
    '<h3 style="margin:0; color:var(--primary-navy);">' + ((idx !== undefined && idx !== null) ? 'Edit Student Classification' : 'Add Student & Classification') + '</h3>' +
    '<button class="close-btn" onclick="document.getElementById(\'tuitionModal\').remove()" style="background:none; border:none; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<form onsubmit="handleSaveTuitionStudent(event, ' + (idx !== undefined && idx !== null ? idx : 'null') + ')" style="margin-top:12px; display:flex; flex-direction:column; gap:10px;">' +
    
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Student Name</label><input type="text" id="tsName" value="' + student.name + '" required style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></div>' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Mobile Number (Login ID)</label><input type="tel" id="tsMobile" pattern="[0-9]{10}" value="' + student.mobile + '" required style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></div>' +
    '</div>' +

    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Select Class</label>' +
    '<select id="tsClass" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;">' +
    '<option value="Class 1" ' + (student.className==='Class 1'?'selected':'') + '>Class 1</option>' +
    '<option value="Class 2" ' + (student.className==='Class 2'?'selected':'') + '>Class 2</option>' +
    '<option value="Class 3" ' + (student.className==='Class 3'?'selected':'') + '>Class 3</option>' +
    '<option value="Class 4" ' + (student.className==='Class 4'?'selected':'') + '>Class 4</option>' +
    '<option value="Class 5" ' + (student.className==='Class 5'?'selected':'') + '>Class 5</option>' +
    '<option value="Class 6" ' + (student.className==='Class 6'?'selected':'') + '>Class 6</option>' +
    '<option value="Class 7" ' + (student.className==='Class 7'?'selected':'') + '>Class 7</option>' +
    '<option value="Class 8" ' + (student.className==='Class 8'?'selected':'') + '>Class 8</option>' +
    '<option value="Class 9" ' + (student.className==='Class 9'?'selected':'') + '>Class 9</option>' +
    '<option value="Class 10" ' + (student.className==='Class 10'?'selected':'') + '>Class 10</option>' +
    '<option value="Class 11" ' + (student.className==='Class 11'?'selected':'') + '>Class 11</option>' +
    '<option value="Class 12" ' + (student.className==='Class 12'?'selected':'') + '>Class 12</option>' +
    '</select></div>' +

    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Student Category</label>' +
    '<select id="tsCategory" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-weight:700;">' + catOptions + '</select></div>' +
    '</div>' +

    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Monthly Fee (₹)</label><input type="number" id="tsFee" value="' + (student.monthlyFee || 800) + '" required style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></div>' +
    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Billing Cycle Start Date</label><input type="date" id="tsStartDate" value="' + (student.startDate || '') + '" required style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></div>' +
    '</div>' +

    '<div class="form-group"><label style="font-size:0.85rem; font-weight:600;">Security PIN / Password (For Re-login)</label><input type="text" id="tsPin" value="' + (student.pin || '1234') + '" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;"></div>' +

    '<button type="submit" class="btn-primary" style="background:#16a34a; margin-top:10px;"><i class="fas fa-cloud-upload-alt"></i> Save Student & Sync to Cloud</button>' +
    '</form>' +
    '</div></div>';

  document.getElementById("dynamicView").innerHTML += html;
}

async function handleSaveTuitionStudent(e, idx) {
  e.preventDefault();
  var name = document.getElementById("tsName").value.trim();
  var mobile = document.getElementById("tsMobile").value.trim();
  var className = document.getElementById("tsClass").value;
  var category = document.getElementById("tsCategory").value;
  var fee = Number(document.getElementById("tsFee").value);
  var startDate = document.getElementById("tsStartDate").value;
  var pin = document.getElementById("tsPin").value.trim() || "1234";

  var data = {
    id: (idx !== null) ? tuitionLedger[idx].id : "stu_" + Date.now(),
    name: name,
    mobile: mobile,
    className: className,
    category: category,
    monthlyFee: fee,
    startDate: startDate,
    pin: pin,
    history: (idx !== null) ? tuitionLedger[idx].history : []
  };

  if (idx !== null) {
    tuitionLedger[idx] = data;
  } else {
    tuitionLedger.push(data);
  }

  setTuitionData("ak_tuition_ledger", tuitionLedger);

  // Cloud Sync to Google Apps Script
  if (typeof CLOUD_SYNC_URL !== "undefined" && CLOUD_SYNC_URL && !CLOUD_SYNC_URL.includes("APNA_DEPLOYED")) {
    try {
      fetch(CLOUD_SYNC_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveStudentLedger",
          student: data
        })
      });
    } catch(err) {
      console.warn("Ledger sheet sync error:", err);
    }
  }

  var modal = document.getElementById("tuitionModal");
  if (modal) modal.remove();
  renderTuitionLedgerSection(document.getElementById("adminContentBody"));
  alert("Student details aur classification safalta-purvak save ho gaye!");
}

function deleteTuitionStudent(idx) {
  if (confirm("Kya aap " + tuitionLedger[idx].name + " ko permanently delete karna chahte hain?")) {
    tuitionLedger.splice(idx, 1);
    setTuitionData("ak_tuition_ledger", tuitionLedger);
    renderTuitionLedgerSection(document.getElementById("adminContentBody"));
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

  setTuitionData("ak_tuition_ledger", tuitionLedger);
  renderTuitionLedgerSection(document.getElementById("adminContentBody"));

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
