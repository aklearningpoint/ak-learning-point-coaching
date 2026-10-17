// ==========================================================
// YOUTUBE VIDEO PPTX EXPORTER FOR AK LEARNING POINT
// File: js/quiz-pptx-exporter.js (Sheet Reviewed & 100% Verified)
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
  pptx.layout = 'LAYOUT_16x9'; // 10.0 x 5.625 inches

  var cleanTitle = (quizTitle || "AK_Learning_Quiz").replace(/[^a-zA-Z0-9_\-]/g, "_");

  // Title Slide for YouTube Intro
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
    var questionText = q.Question_Text || q.questionText || q.question || q.q || "Question text unavailable";
    
    // Exact mapping with Google Sheet Columns
    var optA = q.Opt_A || q.optA || q.optionA || q.a || (q.options ? q.options[0] : "") || "";
    var optB = q.Opt_B || q.optB || q.optionB || q.b || (q.options ? q.options[1] : "") || "";
    var optC = q.Opt_C || q.optC || q.optionC || q.c || (q.options ? q.options[2] : "") || "";
    var optD = q.Opt_D || q.optD || q.optionD || q.d || (q.options ? q.options[3] : "") || "";

    // -------------------------------------------------------------------
    // PRECISE SHEET ANSWER RESOLVER:
    // Handles 0,1,2,3 Indexing (0=A, 1=B, 2=C, 3=D) & Direct 'A','B','C','D'
    // -------------------------------------------------------------------
    var raw = q.Correct_Option || q.correct_option || q.correctOption || q.correct || q.answer || q.ans || "";
    var cleanRaw = String(raw).trim();
    var correct = "A";

    if (cleanRaw === "0" || cleanRaw.toUpperCase() === "A") {
      correct = "A";
    } else if (cleanRaw === "1" || cleanRaw.toUpperCase() === "B") {
      correct = "B";
    } else if (cleanRaw === "2" || cleanRaw.toUpperCase() === "C") {
      correct = "C";
    } else if (cleanRaw === "3" || cleanRaw.toUpperCase() === "D") {
      correct = "D";
    } else {
      // Direct text matching fallback
      var target = cleanRaw.toLowerCase();
      if (target === String(optA).trim().toLowerCase()) correct = "A";
      else if (target === String(optB).trim().toLowerCase()) correct = "B";
      else if (target === String(optC).trim().toLowerCase()) correct = "C";
      else if (target === String(optD).trim().toLowerCase()) correct = "D";
    }

    // Pick text according to selected correct option
    var correctText = (correct === "A" ? optA : correct === "B" ? optB : correct === "C" ? optC : optD);
    var explanation = q.Explanation || q.explanation || q.solution || q.note || "";

    // -------------------------------------------------------------------
    // SLIDE 1: QUESTION + 4 OPTIONS (Canvas bounds: W=10.0, H=5.625)
    // -------------------------------------------------------------------
    var s1 = pptx.addSlide();
    s1.background = { color: '0F172A' };

    // Header Ribbon
    s1.addText("AK LEARNING POINT • " + (quizTitle || "SPECIAL QUIZ"), {
      x: 0.6, y: 0.3, w: 6.4, h: 0.4,
      fontSize: 12, color: 'D4AF37', bold: true
    });
    s1.addText("⏱️ 10 SECONDS", {
      x: 7.0, y: 0.3, w: 2.4, h: 0.4,
      fontSize: 12, color: 'F59E0B', bold: true, align: 'right'
    });

    // Question Box
    s1.addText("Q" + qNum + ". " + questionText, {
      x: 0.6, y: 0.8, w: 8.8, h: 1.5,
      fontSize: 18, color: 'FFFFFF', bold: true,
      fill: { color: '1E293B' }, align: 'left', valign: 'middle',
      margin: 8
    });

    // 4 Options Grid (Canvas ke andar perfect width)
    s1.addText("(A) " + optA, { x: 0.6, y: 2.6, w: 4.25, h: 0.9, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });
    s1.addText("(B) " + optB, { x: 5.15, y: 2.6, w: 4.25, h: 0.9, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });
    s1.addText("(C) " + optC, { x: 0.6, y: 3.8, w: 4.25, h: 0.9, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });
    s1.addText("(D) " + optD, { x: 5.15, y: 3.8, w: 4.25, h: 0.9, fontSize: 15, color: 'FFFFFF', fill: { color: '334155' }, margin: 6 });

    // -------------------------------------------------------------------
    // SLIDE 2: ANSWER REVEAL & EXPLANATION
    // -------------------------------------------------------------------
    var s2 = pptx.addSlide();
    s2.background = { color: '0F172A' };

    s2.addText("QUESTION " + qNum + " • ANSWER REVEAL", {
      x: 0.6, y: 0.3, w: 8.8, h: 0.4,
      fontSize: 12, color: '22C55E', bold: true
    });

    // Question Preview
    s2.addText("Q" + qNum + ". " + questionText, {
      x: 0.6, y: 0.8, w: 8.8, h: 1.1,
      fontSize: 16, color: '94A3B8', fill: { color: '1E293B' }, margin: 8
    });

    // Correct Answer Highlighted in Green
    s2.addText("✅ CORRECT ANSWER: (" + correct + ") " + correctText, {
      x: 0.6, y: 2.1, w: 8.8, h: 1.1,
      fontSize: 19, color: 'FFFFFF', bold: true, fill: { color: '166534' }, margin: 8
    });

    // Explanation Box
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
