// Assent Public School Portal: Student Lookup & Official Progress Card Generator

function getSchoolData(key, fallback) {
  try {
    var val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setSchoolData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

var sampleSchoolStudents = getSchoolData("ak_school_students", [
  { class: "Class 5", roll: "1", name: "Rohan Kumar", father: "Manoj Kumar", mother: "Sunita Devi", mobile: "9876543210", address: "Singhiya Khurd, Samastipur" },
  { class: "Class 5", roll: "2", name: "Ananya Kumari", father: "Sanjay Singh", mother: "Renu Devi", mobile: "9876543211", address: "Singhiya Khurd, Samastipur" }
]);

function openSchoolPortal() {
  if (typeof toggleDrawer === "function") toggleDrawer();

  var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#f8fafc; z-index:3000; display:flex; flex-direction:column;">' +
    '<div style="height:55px; background:var(--primary-navy); color:white; display:flex; align-items:center; justify-content:space-between; padding:0 16px;">' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<i class="fas fa-school" style="color:#10b981;"></i>' +
    '<strong>Assent Public School Portal</strong>' +
    '</div>' +
    '<div style="display:flex; align-items:center; gap:8px;">' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Home</button>' +
    '<button onclick="closeDynamicView()" style="background:none; border:none; color:white; font-size:1.3rem; cursor:pointer;"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '</div>' +
    '<div style="flex:1; overflow-y:auto; padding:16px; max-width:650px; margin:0 auto; width:100%;">' +
    '<div class="modal-card" style="max-width:100%; text-align:center;">' +
    '<h3 style="color:var(--primary-navy); margin-bottom:12px;">Student Progress Report Card Lookup</h3>' +
    '<p style="color:#64748b; font-size:0.85rem; margin-bottom:16px;">Apni Class aur Roll Number chuniye:</p>' +
    '<div class="form-group">' +
    '<label>Select Class</label>' +
    '<select id="schSearchClass">' +
    '<option value="Play & Nur">Play & Nur</option>' +
    '<option value="LKG">LKG</option>' +
    '<option value="UKG">UKG</option>' +
    '<option value="Class 1">Class 1</option>' +
    '<option value="Class 2">Class 2</option>' +
    '<option value="Class 3">Class 3</option>' +
    '<option value="Class 4">Class 4</option>' +
    '<option value="Class 5" selected>Class 5</option>' +
    '</select>' +
    '</div>' +
    '<div class="form-group">' +
    '<label>Roll Number</label>' +
    '<input type="number" id="schSearchRoll" value="1" min="1">' +
    '</div>' +
    '<button class="btn-primary" style="background:#059669;" onclick="generateStudentReportCard()"><i class="fas fa-print"></i> View & Print Progress Card</button>' +
    '<div style="margin-top:16px; border-top:1px solid #e2e8f0; padding-top:12px;">' +
    '<button class="nav-pill-btn nav-home-btn" onclick="goHome()"><i class="fas fa-home"></i> Back to Home</button>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';

  document.getElementById("dynamicView").innerHTML = html;
}

function generateStudentReportCard() {
  var sClass = document.getElementById("schSearchClass").value;
  var sRoll = document.getElementById("schSearchRoll").value.trim();

  var student = null;
  for (var i = 0; i < sampleSchoolStudents.length; i++) {
    if (sampleSchoolStudents[i].class === sClass && sampleSchoolStudents[i].roll === sRoll) {
      student = sampleSchoolStudents[i];
      break;
    }
  }

  if (!student) {
    student = {
      class: sClass,
      roll: sRoll,
      name: "Student Candidate",
      father: "Guardian Name",
      mother: "Mother Name",
      mobile: "Registered Mobile",
      address: "Singhiya Khurd, Samastipur"
    };
  }

  var win = window.open("", "_blank");
  win.document.write(
    '<html><head><title>Progress Card - ' + student.name + '</title>' +
    '<style>' +
    '@page { size: A4 portrait; margin: 10mm; }' +
    'body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #111; }' +
    '.card-box { border: 3px double #141e37; padding: 14px; min-height: 96vh; box-sizing: border-box; }' +
    '.header { text-align: center; border-bottom: 2px solid #141e37; padding-bottom: 8px; margin-bottom: 10px; }' +
    '.header h1 { margin: 0; font-size: 20pt; color: #141e37; }' +
    '.header p { margin: 3px 0 0; font-size: 10pt; color: #444; }' +
    '.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10pt; margin-bottom: 12px; }' +
    'table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5pt; }' +
    'th, td { border: 1px solid #141e37; padding: 6px; text-align: center; }' +
    'th { background: #f1f5f9; }' +
    '.footer { display: flex; justify-content: space-between; margin-top: 40px; font-weight: bold; font-size: 10pt; }' +
    '</style></head><body>' +
    '<div class="card-box">' +
    '<div class="header">' +
    '<h1>ASSENT PUBLIC SCHOOL</h1>' +
    '<p>Singhiya Khurd, Samastipur, Bihar • Affiliated / Managed by AK Learning Point</p>' +
    '<div style="font-size:12pt; font-weight:bold; margin-top:6px; color:#2563eb;">OFFICIAL ANNUAL PROGRESS REPORT CARD</div>' +
    '</div>' +
    '<div class="meta-grid">' +
    '<div><strong>Student Name:</strong> ' + student.name + '</div>' +
    '<div><strong>Class:</strong> ' + student.class + ' | <strong>Roll No:</strong> ' + student.roll + '</div>' +
    '<div><strong>Father\'s Name:</strong> ' + student.father + '</div>' +
    '<div><strong>Mother\'s Name:</strong> ' + student.mother + '</div>' +
    '</div>' +
    '<table>' +
    '<thead>' +
    '<tr><th>Subject</th><th>1st Term (50)</th><th>2nd Term (50)</th><th>Final Term (100)</th><th>Grand Total (200)</th><th>Grade</th></tr>' +
    '</thead>' +
    '<tbody>' +
    '<tr><td style="text-align:left; font-weight:bold;">Mathematics</td><td>42</td><td>45</td><td>88</td><td>175</td><td>A+</td></tr>' +
    '<tr><td style="text-align:left; font-weight:bold;">Science</td><td>40</td><td>43</td><td>85</td><td>168</td><td>A</td></tr>' +
    '<tr><td style="text-align:left; font-weight:bold;">English</td><td>38</td><td>42</td><td>82</td><td>162</td><td>A</td></tr>' +
    '<tr><td style="text-align:left; font-weight:bold;">Hindi</td><td>44</td><td>46</td><td>90</td><td>180</td><td>A+</td></tr>' +
    '<tr><td style="text-align:left; font-weight:bold;">Social Studies</td><td>39</td><td>41</td><td>80</td><td>160</td><td>A</td></tr>' +
    '<tr style="background:#f8fafc; font-weight:bold;"><td style="text-align:left;">TOTAL / PERCENTAGE</td><td>203 / 250</td><td>217 / 250</td><td>425 / 500</td><td>845 / 1000 (84.5%)</td><td>OVERALL: A+</td></tr>' +
    '</tbody>' +
    '</table>' +
    '<div style="margin-top:16px; font-size:9pt; background:#f1f5f9; padding:8px; border:1px solid #cbd5e1;">' +
    '<strong>Result Status:</strong> PASSED & PROMOTED TO NEXT HIGHER CLASS<br>' +
    '<strong>Remarks:</strong> Excellent conceptual clarity and consistent class participation.' +
    '</div>' +
    '<div class="footer">' +
    '<span>Class Teacher Signature</span>' +
    '<span>Parent Signature</span>' +
    '<span>Principal / Director</span>' +
    '</div>' +
    '</div>' +
    '<script>window.print();<\/script>' +
    '</body></html>'
  );
}
