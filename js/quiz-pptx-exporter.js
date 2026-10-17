// ==========================================================
// YOUTUBE VIDEO PPTX EXPORTER FOR AK LEARNING POINT
// File: js/quiz-pptx-exporter.js (Fixed 16:9 Bounds & Answer Parser)
// ==========================================================

function generateYouTubeQuizPPT(quizTitle, questionsList) {
  if (typeof PptxGenJS === "undefined") {
    alert("PPT Generator library load nahi hui hai! Kripya internet connection check karein.");
    return;
  }

  if (!questionsList || !Array.isArray(questionsList) || questionsList.length === 0) {
    alert("Export karne ke liye koi questions nahi mile!");
    return;
  }

  var pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9'; // Standard: 10.0 x 5.625 inches

  var cleanTitle = (quizTitle || "AK_Learning_Quiz").replace(/[^a-zA-Z0-9_\-]/g, "_");

  // Title Slide for YouTube Video Intro
  var titleSlide = pptx.addSlide();
  titleSlide.background = { color: '0F172A' };

  titleSlide.addText("AK LEARNING POINT", {
    x: 0.8, y: 1.2, w: 8.4, h: 0.6,
    fontSize: 24, color: 'D4AF37', bold: true, align: 'center'
  });

  titleSlide.addText(quizTitle || "Objective Practice Set", {
    x: 0.8, y: 2.0, w: 8.4, h: 1.2,
    fontSize: 32, color: 'FFFFFF', bold: true, align: 'center'
  });

  titleSlide.addText("Complete Chapter MCQs • Video Solution & Explanation", {
    x: 0.8, y: 3.4, w: 8.4, h: 0.5,
    fontSize: 16, color: '94A3B8', align: 'center'
  });

  // Loop through questions
  questionsList.forEach(function(q, idx) {
    var qNum = idx + 1;
    var questionText = q.question || q.q || q.questionText || "Question text unavailable";
    
    // Extract 4 Options safely
    var optA = q.optionA || q.a || q.optA || (q.options ? q.options[0] : "") || "";
    var optB = q.optionB || q.b || q.optB || (q.options ? q.options[1] : "") || "";
    var optC = q.optionC || q.c || q.optC || (q.options ? q.options[2] : "") || "";
    var optD = q.optionD || q.d || q.optD || (q.options ? q.options[3] : "") || "";

    // -------------------------------------------------------------------
    // SMART ANSWER PARSER (Handles A/B/C/D, 1/2/3/4, 0/1/2/3 or Exact Text)
    // -------------------------------------------------------------------
    var rawAns = q.correctOption || q.correct || q.answer || q.ans || q.correctAnswer || q.rightAnswer || "";
    var correct = "";
    var correctText = "";

    var cleanRaw = String(rawAns).trim();

    if (cleanRaw === "0" || cleanRaw.toUpperCase() === "A" || cleanRaw === "1") {
      // Check if "1" means Option A or 1-based index
      if (cleanRaw.toUpperCase() === "A" || cleanRaw === "0") { correct = "A"; }
      else if (cleanRaw === "1" && !q.option1) { correct = "A"; }
    }
    
    if (cleanRaw === "1" && correct === "") correct = "A";
    else if (cleanRaw === "2" || cleanRaw.toUpperCase() === "B") correct = "B";
    else if (cleanRaw === "3" || cleanRaw.toUpperCase() === "C") correct = "C";
    else if (cleanRaw === "4" || cleanRaw.toUpperCase() === "D") correct = "D";

    // Agar direct text diya ho (e.g. "His nephew")
    if (!correct) {
      var normA = String(optA).trim().toLowerCase();
      var normB = String(optB).trim().toLowerCase();
      var normC = String(optC).trim().toLowerCase();
      var normD = String(optD).trim().toLowerCase();
      var normAns = cleanRaw.toLowerCase();

      if (normAns === normA && normA !== "") correct = "A";
      else if (normAns === normB && normB !== "") correct = "B";
      else if (normAns === normC && normC !== "") correct = "C";
      else if (normAns === normD && normD !== "") correct = "D";
      else correct = "A"; // default fallback
    }

    if (correct === "A") correctText = optA;
    else if (correct === "B") correctText = optB;
    else if (correct === "C") correctText = optC;
    else if (correct === "D") correctText = optD;

    var explanation = q.explanation || q.solution || q.note || "";

    // -------------------------------------------------------------------
    // SLIDE 1: QUESTION + 4 OPTIONS (Canvas bounds: W=10.0, H=5.625)
    // -------------------------------------------------------------------
    var s1 = pptx.addSlide();
    s1.background = { color: '0F172A' };

    // Brand ribbon (x=0.6, w=8.8)
    s1.addText("AK LEARNING POINT • " + (quizTitle || "SPECIAL QUIZ"), {
      x: 0.6, y: 0.3, w: 6.4, h: 0.4,
      fontSize: 12, color: 'D4AF37', bold: true
    });
    s1.addText("⏱️ 10 SECONDS", {
      x: 7.0, y: 0.3, w: 2.4, h: 0.4,
      fontSize: 12, color: 'F59E0B', bold: true, align: 'right'
    });

    // Question Box (fits inside canvas)
    s1.addText("Q" + qNum + ". " + questionText, {
      x: 0.6, y: 0.8, w: 8.8, h: 1.5,
      fontSize: 18, color: 'FFFFFF', bold: true,
      fill: { color: '1E293B' }, align: 'left', valign: 'middle',
      margin: 8
    });

    // 4 Options Grid (Two columns of w=4.25 each, Total: 0.6 + 4.25 + 0.3 + 4.25 = 9.4 <= 10.0)
    s1.addText("(A) " + optA, { x: 0.6, y: 2.6, w: 4.25, h: 0.9, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });
    s1.addText("(B) " + optB, { x: 5.15, y: 2.6, w: 4.25, h: 0.9, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });
    s1.addText("(C) " + optC, { x: 0.6, y: 3.8, w: 4.25, h: 0.9, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });
    s1.addText("(D) " + optD, { x: 5.15, y: 3.8, w: 4.25, h: 0.9, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });

    // -------------------------------------------------------------------
    // SLIDE 2: ANSWER REVEAL & EXPLANATION (Canvas bounds: W=10.0, H=5.625)
    // -------------------------------------------------------------------
    var s2 = pptx.addSlide();
    s2.background = { color: '0F172A' };

    s2.addText("QUESTION " + qNum + " • ANSWER REVEAL", {
      x: 0.6, y: 0.3, w: 8.8, h: 0.4,
      fontSize: 12, color: '22C55E', bold: true
    });

    // Question preview
    s2.addText("Q" + qNum + ". " + questionText, {
      x: 0.6, y: 0.8, w: 8.8, h: 1.1,
      fontSize: 16, color: '94A3B8', fill: { color: '1E293B' }, margin: 8
    });

    // Correct Answer Highlight Box (fits perfectly)
    s2.addText("✅ CORRECT ANSWER: (" + correct + ") " + correctText, {
      x: 0.6, y: 2.1, w: 8.8, h: 1.1,
      fontSize: 19, color: 'FFFFFF', bold: true, fill: { color: '166534' }, margin: 8
    });

    // Concept / Explanation Box
    var explanationText = explanation ? ("💡 Concept / Solution:\n" + explanation) : "💡 Concept: Remember this point for upcoming Board/School exams.";
    s2.addText(explanationText, {
      x: 0.6, y: 3.4, w: 8.8, h: 1.6,
      fontSize: 15, color: 'F1F5F9', fill: { color: '1E293B' }, margin: 8
    });
  });

  // Outro Slide
  var endSlide = pptx.addSlide();
  endSlide.background = { color: '0F172A' };
  endSlide.addText("Thanks For Watching!", { x: 0.8, y: 1.8, w: 8.4, h: 0.8, fontSize: 32, color: 'FFFFFF', bold: true, align: 'center' });
  endSlide.addText("Like • Share • Subscribe to AK Learning Point", { x: 0.8, y: 2.8, w: 8.4, h: 0.6, fontSize: 18, color: 'D4AF37', bold: true, align: 'center' });

  // Download PPTX
  pptx.writeFile({ fileName: cleanTitle + "_YouTube_16x9.pptx" });
}
