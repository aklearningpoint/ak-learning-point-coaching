// ==========================================================
// YOUTUBE VIDEO PPTX EXPORTER FOR AK LEARNING POINT
// File: js/quiz-pptx-exporter.js (Sheet 0=A, 1=B, 2=C, 3=D Aligned)
// ==========================================================

function resolveCorrectKey(raw, optA, optB, optC, optD) {
  if (raw === undefined || raw === null) return "A";
  var str = String(raw).trim();

  // 1. Direct Text check for "Option B", "Option A", etc.
  if (/\boption\s*b\b/i.test(str)) return "B";
  if (/\boption\s*c\b/i.test(str)) return "C";
  if (/\boption\s*d\b/i.test(str)) return "D";
  if (/\boption\s*a\b/i.test(str)) return "A";

  // 2. Direct Letter check
  var up = str.toUpperCase();
  if (up === "B") return "B";
  if (up === "C") return "C";
  if (up === "D") return "D";
  if (up === "A") return "A";

  // 3. Exact Google Sheet 0-index Match: 0=A, 1=B, 2=C, 3=D
  var numMatch = str.match(/\d+/);
  if (numMatch) {
    var val = parseInt(numMatch[0], 10);
    if (val === 1) return "B";
    if (val === 2) return "C";
    if (val === 3) return "D";
    if (val === 0) return "A";
  }

  // 4. Exact text matching fallback
  var target = str.toLowerCase();
  if (target && optB && target === String(optB).trim().toLowerCase()) return "B";
  if (target && optC && target === String(optC).trim().toLowerCase()) return "C";
  if (target && optD && target === String(optD).trim().toLowerCase()) return "D";
  if (target && optA && target === String(optA).trim().toLowerCase()) return "A";

  return "A";
}

function generateYouTubeQuizPPT(quizTitle, questionsList) {
  if (typeof PptxGenJS === "undefined") {
    alert("PPT Generator library load nahi hui hai! Internet check karein.");
    return;
  }

  if (!questionsList || !Array.isArray(questionsList) || questionsList.length === 0) {
    alert("Export karne ke liye koi questions nahi mile!");
    return;
  }

  var pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9'; // 10.0 x 5.625 inches

  var cleanTitle = (quizTitle || "AK_Learning_Quiz").replace(/[^a-zA-Z0-9_\-]/g, "_");

  // Title Intro Slide
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
    var questionText = q.Question_Text || q.questionText || q.question || q.q || "";

    var optA = q.Opt_A || q.optA || q.optionA || q.option1 || q.a || (q.options ? q.options[0] : "") || "";
    var optB = q.Opt_B || q.optB || q.optionB || q.option2 || q.b || (q.options ? q.options[1] : "") || "";
    var optC = q.Opt_C || q.optC || q.optionC || q.option3 || q.c || (q.options ? q.options[2] : "") || "";
    var optD = q.Opt_D || q.optD || q.optionD || q.option4 || q.d || (q.options ? q.options[3] : "") || "";

    var rawAns = q.Correct_Option || q.correct_option || q.correctOption || q.correct || q.answer || q.ans || q.rightAnswer || "";
    var correct = resolveCorrectKey(rawAns, optA, optB, optC, optD);
    var correctText = (correct === "A" ? optA : correct === "B" ? optB : correct === "C" ? optC : optD);
    var explanation = q.Explanation || q.explanation || q.solution || q.note || "";

    // -------------------------------------------------------------------
    // SLIDE 1: QUESTION + ALL 4 NEUTRAL OPTIONS (Countdown Timer Mode)
    // -------------------------------------------------------------------
    var s1 = pptx.addSlide();
    s1.background = { color: '0F172A' };

    s1.addText("AK LEARNING POINT • " + (quizTitle || "SPECIAL QUIZ"), {
      x: 0.6, y: 0.3, w: 6.4, h: 0.4, fontSize: 12, color: 'D4AF37', bold: true
    });
    s1.addText("⏱️ 10 SECONDS", {
      x: 7.0, y: 0.3, w: 2.4, h: 0.4, fontSize: 12, color: 'F59E0B', bold: true, align: 'right'
    });

    s1.addText("Q" + qNum + ". " + questionText, {
      x: 0.6, y: 0.8, w: 8.8, h: 1.4,
      fontSize: 18, color: 'FFFFFF', bold: true,
      fill: { color: '1E293B' }, align: 'left', valign: 'middle', margin: 8
    });

    s1.addText("(A) " + optA, { x: 0.6, y: 2.5, w: 4.25, h: 0.85, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });
    s1.addText("(B) " + optB, { x: 5.15, y: 2.5, w: 4.25, h: 0.85, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });
    s1.addText("(C) " + optC, { x: 0.6, y: 3.6, w: 4.25, h: 0.85, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });
    s1.addText("(D) " + optD, { x: 5.15, y: 3.6, w: 4.25, h: 0.85, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });

    // -------------------------------------------------------------------
    // SLIDE 2: EXACT PREVIEW MATCHED (CORRECT OPTION HIGHLIGHTED IN GREEN)
    // -------------------------------------------------------------------
    var s2 = pptx.addSlide();
    s2.background = { color: '0F172A' };

    s2.addText("QUESTION " + qNum + " • ANSWER REVEAL", {
      x: 0.6, y: 0.3, w: 8.8, h: 0.4, fontSize: 12, color: '22C55E', bold: true
    });

    s2.addText("Q" + qNum + ". " + questionText, {
      x: 0.6, y: 0.8, w: 8.8, h: 1.4,
      fontSize: 18, color: 'FFFFFF', bold: true,
      fill: { color: '1E293B' }, align: 'left', valign: 'middle', margin: 8
    });

    // 4 Options Grid (Correct option is Dark Green #15803D with Gold/Green emphasis)
    var bgA = (correct === "A") ? { color: '15803D' } : { color: '334155' };
    var bgB = (correct === "B") ? { color: '15803D' } : { color: '334155' };
    var bgC = (correct === "C") ? { color: '15803D' } : { color: '334155' };
    var bgD = (correct === "D") ? { color: '15803D' } : { color: '334155' };

    s2.addText((correct === "A" ? "✔ " : "") + "(A) " + optA, { x: 0.6, y: 2.5, w: 4.25, h: 0.85, fontSize: 15, color: 'FFFFFF', bold: (correct === "A"), fill: bgA, margin: 6 });
    s2.addText((correct === "B" ? "✔ " : "") + "(B) " + optB, { x: 5.15, y: 2.5, w: 4.25, h: 0.85, fontSize: 15, color: 'FFFFFF', bold: (correct === "B"), fill: bgB, margin: 6 });
    s2.addText((correct === "C" ? "✔ " : "") + "(C) " + optC, { x: 0.6, y: 3.6, w: 4.25, h: 0.85, fontSize: 15, color: 'FFFFFF', bold: (correct === "C"), fill: bgC, margin: 6 });
    s2.addText((correct === "D" ? "✔ " : "") + "(D) " + optD, { x: 5.15, y: 3.6, w: 4.25, h: 0.85, fontSize: 15, color: 'FFFFFF', bold: (correct === "D"), fill: bgD, margin: 6 });

    // Bottom Result Bar matching Preview
    var expText = explanation ? ("💡 Concept: " + explanation) : ("💡 Correct Answer is (" + correct + ") " + correctText);
    s2.addText("✅ Answer: (" + correct + ") " + correctText + "\n" + expText, {
      x: 0.6, y: 4.65, w: 8.8, h: 0.8,
      fontSize: 13, color: 'FFFFFF', fill: { color: '14532D' }, line: { color: '22C55E', width: 1.5 }, margin: 6
    });
  });

  // Outro Slide
  var endSlide = pptx.addSlide();
  endSlide.background = { color: '0F172A' };
  endSlide.addText("Thanks For Watching!", { x: 0.8, y: 1.8, w: 8.4, h: 0.8, fontSize: 32, color: 'FFFFFF', bold: true, align: 'center' });
  endSlide.addText("Like • Share • Subscribe to AK Learning Point", { x: 0.8, y: 2.8, w: 8.4, h: 0.6, fontSize: 18, color: 'D4AF37', bold: true, align: 'center' });

  pptx.writeFile({ fileName: cleanTitle + "_YouTube_16x9.pptx" });
}
