import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI with safe API Key check
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Middleware for JSON parsing with 50mb limit to handle large curriculum payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// API route for AI Tutor chat
app.post("/api/tutor/chat", async (req, res) => {
  try {
    const { message, history, grade, subject, stage } = req.body;

    if (!apiKey || !ai) {
      return res.status(503).json({
        error: "مفتاح الذكاء الاصطناعي (Gemini API Key) غير مهيأ حالياً. يرجى إضافته في إعدادات التطبيق.",
      });
    }

    const systemInstruction = `
أنت "المعلم السوداني الذكي" (أستاذ تفاعلي متميز ومحبوب لطلاب السودان).
تقوم بتقديم المساعدة لطلاب دولة السودان في المرحلة الدراسية: "${stage}"، الصف: "${grade}"، ومادة: "${subject}".
تحدث باللغة العربية الفصحى المبسطة، ويمكنك استخدام بعض العبارات السودانية اللطيفة والمشجعة مثل: "يا بطل"، "يا دكتورة"، "أبشر بالخير"، "يا ولدنا/بنتنا".
مهمتك:
1. الإجابة عن الأسئلة الدراسية المتعلقة بمادة ${subject} بما يتناسب مع الفئة العمرية للصف ${grade}.
2. تسهيل المفاهيم باستخدام أمثلة واقعية من البيئة السودانية (مثل الزراعة، النيل، السنط، الثقافة والتاريخ السوداني العريق، المدن مثل الخرطوم، بورتسودان، إلخ) لربط المادة بالواقع.
3. تفاعل مع الطالب كأستاذ حقيقي: قدم له سؤالاً تفاعلياً مبسطاً أو اختباراً قصيراً متعدد الخيارات عندما يطلب شرح موضوع، وقم بتقييم إجابته بلطف وتشجيع.
4. حافظ على نبرة تعليمية محفزة وهادئة ومرحة تبث الأمل وتناسب الطلاب في السودان.
    `;

    // Format contents with chat history for Gemini 3.5 Flash
    const contents: any[] = [];
    
    // Add history in Gemini API format
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }
    
    // Append the new message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Tutor Error:", error);
    res.status(500).json({ error: error.message || "حدث خطأ أثناء التواصل مع المعلم الذكي. يرجى المحاولة مرة أخرى." });
  }
});

// API route for getting a quick subject quiz
app.post("/api/tutor/quiz", async (req, res) => {
  try {
    const { grade, subject, stage } = req.body;

    if (!apiKey || !ai) {
      return res.status(503).json({
        error: "مفتاح الذكاء الاصطناعي غير متوفر حالياً لتوليد الأسئلة.",
      });
    }

    const prompt = `أنت خبير مناهج سودانية. قم بتوليد سؤالين (2) مسليين ومتعدد الخيارات لمادة ${subject} في الصف ${grade} لطلاب السودان.
يجب أن ترجع النتيجة في صيغة JSON مطابقة تماماً للمواصفات التالية:
{
  "quizzes": [
    {
      "question": "صيغة السؤال هنا بلغة عربية سهلة وواضحة تناسب الصف المذكور",
      "options": ["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"],
      "answerIndex": 0, // الرقم التعريفي للجواب الصحيح (0 إلى 3)
      "explanation": "شرح مبسط وجميل للحل الصحيح بأسلوب تربوي مشجع ولطيف"
    }
  ]
}
يرجى إرسال الـ JSON مباشرة دون استخدام كود ماركداون (مثل \`\`\`json) ليكون قابلاً للتفسير الفوري وعاملاً بشكل رائع.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: error.message || "فشل توليد الاختبار التفاعلي." });
  }
});

// API route for writing modified curriculum data directly to the code (persistent for publishing)
app.post("/api/curriculum/save", async (req, res) => {
  try {
    const { password, stages } = req.body;

    if (password !== "20302060") {
      return res.status(403).json({ error: "كلمة المرور الإدارية غير صحيحة." });
    }

    if (!stages || !Array.isArray(stages)) {
      return res.status(400).json({ error: "بيانات المنهج غير صالحة." });
    }

    const filePath = path.join(process.cwd(), "src", "data", "curriculum.ts");

    // Reconstruct the full TS file content
    const fileContent = `export interface Subject {
  id: string;
  name: string;
  iconName: string; // Used to select Lucide icon dynamically
  colorClass: string; // Tailwind bg/text/border color classes
  interactiveUrl: string; // External interactive website url
  interactiveLabel: string; // Friendly label for the external link
  curriculumSummary: string; // Short summary of what is taught in Sudan
  pdfUrl?: string; // Optional download link for the E-Book
  memoPdfUrl?: string; // Optional link to a PDF memorandum
  videoUrl?: string; // Optional YouTube channel or lesson video link
}

export interface Grade {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  colorTheme: string; // Tailwind color theme for this stage
  icon: string; // Lucide icon
  grades: Grade[];
}

export const stagesData: Stage[] = ${JSON.stringify(stages, null, 2)};
`;

    await fs.writeFile(filePath, fileContent, "utf8");
    res.json({ success: true, message: "تم تحديث كود المنهج وحفظه بنجاح في ملقم التعليم!" });
  } catch (err: any) {
    console.error("Save curriculum error:", err);
    res.status(500).json({ error: err.message || "فشل كتابة وحفظ كود المنهج الدراسي." });
  }
});

// PDF Proxy Endpoint to bypass CORS when sending documents to Google Drive client-side
app.get("/api/proxy-pdf", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "رابط الملف مطلوب." });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: "فشل تحميل الملف من المصدر الخارجي." });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="book.pdf"`);
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error("PDF proxy error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الملف: " + error.message });
  }
});

// Global JSON error handling middleware to safely catch body-parser/payload and unexpected server errors
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express App Error:", err);
  res.status(err.status || err.statusCode || 500).json({
    success: false,
    error: err.message || "حدث خطأ داخلي على الملقم."
  });
});

async function startServer() {
  // Serve assets with Vite in development, static in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen to port 3000 (Mandatory as per environmental constraints)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sudanese Curriculum Server is running on port ${PORT}`);
  });
}

startServer();
