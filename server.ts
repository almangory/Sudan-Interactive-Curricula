import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs/promises";
import { createRequire } from "module";

const requireNext = createRequire(path.resolve(process.cwd(), "server.ts"));
const pdfModule = requireNext("pdf-parse");

dotenv.config();

// Memory cache for accessed curriculum URLs to enable instant responses
// Key: URL, Value: array of paragraph strings
const contentCache = new Map<string, string[]>();
const loadingUrls = new Set<string>();

const ARABIC_STOPWORDS = new Set([
  "في", "من", "على", "عن", "إلى", "مع", "بين", "حتى", "خلال", "عند", "قبل", "بعد",
  "ما", "منذ", "هل", "هو", "هي", "هما", "هم", "هن", "هذا", "هذه", "هؤلاء", "ذلك", "تلك",
  "الذي", "التي", "الذين", "اللذان", "اللتان", "اللاتي", "اللواتي", "كم", "كيف", "لماذا",
  "متى", "أين", "كذلك", "أن", "إن", "أو", "لكن", "بل", "لا", "نعم", "لم", "لن", "لو", "إذا",
  "قد", "لقد", "كان", "كانت", "يكون", "تم", "قام", "قامت", "تمت", "أنا", "أنت", "ان", "انها",
  "انه", "كيفية", "ماذا", "هل", "يا", "بكل", "بما", "فيها", "عبر", "حول", "كل"
]);

const LOCAL_CURRICULUM_FALLBACK: Record<string, { keywords: string[], title: string, content: string }[]> = {
  "arabic": [
    {
      keywords: ["حروف", "الحروف", "الأبجدية", "أبجد", "الجر", "ألف", "ياء"],
      title: "الحروف العربية وأقسام الكلمة",
      content: "تتكون اللغة العربية من 28 حرفاً أساسياً تبدأ بالألف (أ) وتنتهي بالياء (ي). وتقسم الكلمة في لغتنا الجميلة إلى ثلاثة أقسام رئيسية:\n1. الاسم: وهو ما دل على إنسان، حيوان، نبات، أو جماد (مثل: كراس، قلم، النيل).\n2. الفعل: وهو ما دل على حدث يقع في زمن معين (مثل: كَتَبَ، يَقْرَأُ، ادرس).\n3. الحرف: وهو لفظ لا يظهر معناه كاملاً إلا عندما يوضع في جملة تامة (مثل حروف الجر: من، إلى، في، على، الكاف، اللام، الباء)."
    },
    {
      keywords: ["الجر", "حروف الجر", "مجرور"],
      title: "قواعد حروف الجر في لغتنا الجميلة",
      content: "حروف الجر هي حروف تدخل على الأسماء فقط فتقوم بجرها (تصبح حركتها الكسرة في الحالة العادية). ومن أشهر حروف الجر:\n- (مِن، إِلَى، عَنْ، عَلَى، فِي، الباء، الكاف، اللام).\nمثال: 'يذهبُ الطالبُ إلى المدرسةِِ' -> الاسم (المدرسةِ) اسم مجرور بـ (إلى) وعلامة جره الكسرة الظاهرة تحت آخره."
    },
    {
      keywords: ["تنوين", "تحريك", "الضمة", "الفتحة", "الفتحتين"],
      title: "التنوين وأشكاله الثلاثة",
      content: "التنوين هو نون ساكنة زائدة تلحق بآخر الاسم لفظاً لا كتابةً، أي ننطقها نوناً ولكن نكتبها على شكل حركتين متطابقتين. وله ثلاثة أنواع:\n1. تنوين الضم: ويُكتب ضمتين فوق الحرف الأخير (مثل: ولدٌ).\n2. تنوين الفتح: ويُكتب فتحتين فوق الحرف الأخير وغالباً يحتاج لألف زائدة بعده (مثل: ولداً، ما عدا في تاء التأنيث المربوطة مثل شجرةً).\n3. تنوين الكسر: ويُكتب كسرتين تحت الحرف الأخير للكلمة (مثل: ولدٍ)."
    },
    {
      keywords: ["مبتدأ", "خبر", "جملة اسيمة", "جملة اسمية", "فعلية", "الجملة"],
      title: "أنواع الجمل: الجملة الاسمية والجملة الفعلية",
      content: "تنقسم الجمل والعبارات في المنهج الدراسي إلى نوعين:\n1. الجملة الاسمية: وهي الجملة التي تبدأ باسم، وتتكون من ركنين أساسيين هما: المبتدأ (الاسم الأول المرفوع الذي نبدأ به) والخبر (الذي يخبرنا بالمعنى ويتمم الجملة). مثال: 'النيلُ عذبٌ'.\n2. الجملة الفعلية: وهي الجملة التي تبدأ بفعل، وتتكون من ركنين أساسيين هما: الفعل والفاعل (وقد يأتي مفعولاً به لتكتمل الفائدة). مثال: 'يزرعُ الفلاحُ الأرضَ'."
    }
  ],
  "math": [
    {
      keywords: ["عد", "أرقام", "ارقام", "العد", "خانات", "جمع", "طرح", "الجمع", "الطرح"],
      title: "مهارات الحساب والعمليات الأساسية للرياضيات",
      content: "العمليات الرياضية الأربعة هي الأساس لحب الرياضيات والتميز فيها:\n1. الجمع (+): وهو عملية ضم مجموعتين من الأعداد معاً للحصول على ناتج أكبر. مثال: 5 + 3 = 8.\n2. الطرح (-): وهو إنقاص أو أخذ عدد من عدد آخر لمعرفة المتبقي. مثال: 9 - 4 = 5.\n3. الضرب (×): وهو تكرار عملية الجمع عدة مرات للسرعة والدقة. مثال: 4 × 3 = 12 (أي جمع الرقم 4 ثلاث مرات 4+4+4).\n4. القسمة (÷): وهي توزيع عدد معين من الأشياء بالتساوي على مجموعات. مثال: 10 ÷ 2 = 5."
    },
    {
      keywords: ["كسور", "كسر", "مقام", "بسط"],
      title: "فهم الكسور والأجزاء",
      content: "الكسر هو جزء من الكل (أقل من الرقم واحد الصحيح). يتكون الكسر الاعتيادي من جزئين:\n- البسط: وهو الرقم الموجود في الأعلى ويمثل عدد الأجزاء المختارة.\n- المقام: وهو الرقم الموجود في الأسفل ويمثل العدد الكلي للأجزاء المتطابقة للواحد الصحيح.\n- خط الكسر: هو الخط الفاصل بينهما.\nمثال: الكسر 1/2 (النصف)، والكسر 1/4 (الربع)."
    },
    {
      keywords: ["هندسة", "مربع", "مستطيل", "دائرة", "مثلث", "محيط", "مساحة"],
      title: "الأشكال الهندسية الأساسية وحساباتها",
      content: "الأشكال الهندسية تحيط بنا في كل مكان، ومن أهمها:\n1. المربع: شكل رباعي مغلق، جميع أضلاعه الأربعة متساوية في الطول وزواياه قائمة.\n2. المستطيل: شكل رباعي فيه كل ضلعين متقابلين متساويين في الطول، وزواياه قائمة.\n3. المثلث: شكل هندسي مغلق يحتوي على 3 أضلاع و 3 زوايا مجموعها 180 درجة.\n4. الدائرة: شكل منحني مغلق متكامل ومركزه يبعد مسافة ثابتة عن محيطه الخارجي."
    }
  ],
  "science": [
    {
      keywords: ["حالات المادة", "صلبة", "سائلة", "غازية", "انصهار", "تجمد", "تبخر", "تكثف"],
      title: "حالات المادة الثلاث بأسلوب مبسط",
      content: "توجد المادة في الطبيعة المحيطة بنا في ثلاث حالات أساسية، وتتحول من حالة إلى أخرى بالحرارة والبرودة:\n1. الحالة الصلبة: لها شكل ثابت وحجم محدد وجاف (مثل: الخشب، الحجر، الثلج).\n2. الحالة السائلة: لها حجم محدد ولكنها تأخذ شكل الوعاء الذي توضع فيه (مثل: الماء، الزيت، العصير).\n3. الحالة الغازية: ليس لها شكل أو حجم محدد، بل تنتشر في الفراغ (مثل: الهواء، بخار الماء، الأوكسجين).\n- الانصهار: تحول المادة من الحالة الصلبة للسائلة بالتسخين.\n- التجمد: تحول المادة من الحالة السائلة للصلبة بالتبريد."
    },
    {
      keywords: ["نبات", "أوراق", "بناء ضوئي", "جذور", "أزهار", "ساق"],
      title: "أجزاء النبات ووظائفها ودورة الغذاء",
      content: "أليست النباتات الخضراء رائعة؟ إنها تتكون من أجزاء دقيقة تؤدي مهام حيوية رائعة:\n1. الجذور: تثبت النبات بقوة في التربة، وتمتص الماء والأملاح المعدنية اللازمة.\n2. الساق: تدعم النبات وتنقل الماء والغذاء من الجذور إلى بقية الأجزاء والأوراق.\n3. الأوراق: مصنع الغذاء الحقيقي! تقوم بصنع الغذاء للنبات بعملية تسمى 'البناء الضوئي' باستخدام ضوء الشمس والهواء والماء.\n4. الأزهار: العضو المسؤول عن التكاثر وإنتاج البذور والثمار اللذيذة."
    },
    {
      keywords: ["دوران", "الدم", "القلب", "التنفس", "الهضم", "جسم", "رئتين", "رئة"],
      title: "جسم الإنسان الخارق وأجهزته الأساسية",
      content: "يعمل جسم الإنسان كفريق متكامل شديد الذكاء:\n1. الجهاز الهضمي: يستقبل الطعام ويقوم بتفكيكه وتحليله ليستخرج منه الطاقة اللازمة للنمو.\n2. الجهاز التنفسي: يوفر الأوكسجين النقي للجسم ويتخلص من ثاني أكسيد الكربون عبر الرئتين بالتنفس.\n3. الجهاز الدوري (القلب والأوعية): يقوم بضخ الدم المحمل بالغذاء والأكسجين إلى سائر خلايا الجسم بنشاط دائم."
    }
  ],
  "religion": [
    {
      keywords: ["أركان", "إسلام", "الشهادة", "الصلاة", "الزكاة", "الحج", "رمضان", "الصوم"],
      title: "أركان الإسلام الخمسة",
      content: "بني الإسلام على خمس دعائم أساسية يجب على كل مسلم ومسلمة معرفتها والتمسك بها:\n1. شهادة أن لا إله إلا الله وأن محمداً رسول الله (مفتاح الدخول للإسلام).\n2. إقام الصلاة (خمس صلوات في اليوم والليلة وهي صلة المسلم بربه).\n3. إيتاء الزكاة (حق معلوم للفقراء يؤخذ من مال الأغنياء تطهيراً وبركة).\n4. صوم رمضان (الامتناع عن الطعام والشراب والذنوب من الفجر وحتى الغروب).\n5. حج البيت لمن استطاع إليه سبيلاً (رحلة وفريضة عظيمة مرة في العمر)."
    },
    {
      keywords: ["إيمان", "ملائكة", "كتب", "رسل", "القدر"],
      title: "أركان الإيمان الستة",
      content: "أركان الإيمان هي الاعتقاد بالقلب والاعتراف باللسان ويشمل ستة أمور:\n1. الإيمان بالله تعالى (بوجوده ووحدانيته وأنه الخالق المتفرد).\n2. الإيمان بملائكته الكرام (مثل جبريل وميكائيل وملاك الموت).\n3. الإيمان بكتبه السماوية (القرآن، التوراة، الإنجيل، الزبور).\n4. الإيمان برسله وأنبيائه (بداية بآدم مرورا بموسى وعيسى ونوح وانتهاءً بمحمد صلى الله عليه وسلم).\n5. الإيمان باليوم الآخر (يوم الحساب والجزاء والجنة والنار).\n6. الإيمان بالقدر خيره وشره."
    }
  ],
  "history": [
    {
      keywords: ["سودان", "نيل", "حضارة", "كوش", "مروي", "الخرطوم", "تاريخ"],
      title: "الحضارة السودانية القديمة وعظمة النيل",
      content: "السودان بلد غني جداً بالتاريخ والحضارة العريقة. قامت على أرضه حضارات زاهرة مثل حضارة 'كوش' العظيمة التي اشتهرت بآثارها وأهراماتها الرائعة في 'البجراوية' و'مروي' و'البركل'.\n- نيل السودان: يلتقي النيل الأزرق القادم من إثيوبيا بالنيل الأبيض القادم من بحيرة فيكتوريا في مدينة الخرطوم ليرسما سويّاً أطول نهر في العالم مغذياً للحضارة والزراعة والحياة في شمال إفريقيا على مر التاريخ البشري."
    }
  ]
};

function cleanUrlForDownload(url: string): string {
  try {
    if (url.includes("drive.google.com")) {
      const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileDMatch && fileDMatch[1]) {
        return `https://docs.google.com/uc?export=download&id=${fileDMatch[1]}`;
      }
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://docs.google.com/uc?export=download&id=${idMatch[1]}`;
      }
    }
  } catch (e) {
    console.error("Error formatting URL:", e);
  }
  return url;
}

async function fetchAndParseUrl(url: string, type: 'pdf' | 'html'): Promise<string[]> {
  try {
    const targetUrl = cleanUrlForDownload(url);
    console.log(`Starting fetch and parse for ${type}: ${targetUrl} (original: ${url})`);
    
    // Set a timeout of 10 seconds for fetching to preserve response smoothness
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8"
      }
    });
    
    clearTimeout(id);

    if (!response.ok) {
      console.error(`Received status ${response.status} when fetching ${url}`);
      return [];
    }

    if (type === 'pdf') {
      const buffer = await response.arrayBuffer();
      let rawText = "";

      try {
        const PDFParseClass = pdfModule?.PDFParse || pdfModule;
        if (typeof PDFParseClass === 'function') {
          // Check if we can instantiate it as a class (new PDFParse pattern)
          const parser = new PDFParseClass({ data: Buffer.from(buffer) });
          const textResult = await parser.getText();
          rawText = textResult?.text || "";
        } else if (typeof pdfModule === 'function') {
          // Fallback to legacy function pattern
          const pdfData = await pdfModule(Buffer.from(buffer));
          rawText = pdfData?.text || "";
        } else {
          console.error("PDF Parsing library not found or unrecognized export:", pdfModule);
        }
      } catch (err: any) {
        console.error("Error parsing PDF via modern/legacy pdf-parse library:", err);
      }
      
      const paragraphs = rawText
        .split(/(?:\s*\r?\n\s*){2,}/)
        .map(p => p.replace(/\s+/g, " ").trim())
        .filter(p => p.length > 15);
      
      return paragraphs;
    } else {
      const htmlText = await response.text();
      
      const cleanHtml = htmlText
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
        .replace(/<\/?[^>]+(>|$)/g, " ");
      
      const paragraphs = cleanHtml
        .split(/(?:\. |\r?\n|\t|\s{2,})/)
        .map(p => p.replace(/\s+/g, " ").trim())
        .filter(p => p.length > 20 && p.length < 500);
      
      return paragraphs;
    }
  } catch (error) {
    console.error(`Error loading or parsing "${url}":`, error);
    return [];
  }
}

function searchInParagraphs(paragraphs: string[], query: string): { text: string; score: number }[] {
  const queryWords = query
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1 && !ARABIC_STOPWORDS.has(w));

  if (queryWords.length === 0) {
    return [];
  }

  const results: { text: string; score: number }[] = [];

  for (const para of paragraphs) {
    if (para.trim().length < 15) continue;

    let score = 0;
    const paraClean = para.toLowerCase();

    queryWords.forEach(word => {
      if (paraClean.includes(word)) {
        score += 10;
        
        const regex = new RegExp(`\\b${word}\\b|\\s${word}\\s`, 'g');
        const matches = paraClean.match(regex);
        if (matches) {
          score += matches.length * 5;
        }
      }
    });

    const cleanQueryStr = queryWords.join(" ");
    if (paraClean.includes(cleanQueryStr)) {
      score += 40;
    }

    if (score > 0) {
      results.push({ text: para.trim(), score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

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

// API route for AI Tutor chat (performs direct search in textbook links instead of using generative AI)
app.post("/api/tutor/chat", async (req, res) => {
  try {
    const { message, history, grade, subject, stage, subjectObject } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "الرجاء كتابة سؤال صحيح" });
    }

    // Gather active reference URLs for this subject
    const urls: { url: string; type: 'pdf' | 'html' }[] = [];
    if (subjectObject) {
      if (subjectObject.pdfUrl) {
        urls.push({ url: subjectObject.pdfUrl, type: "pdf" });
      }
      if (subjectObject.memoPdfUrl) {
        urls.push({ url: subjectObject.memoPdfUrl, type: "pdf" });
      }
      if (subjectObject.interactiveUrl && 
          !subjectObject.interactiveUrl.includes("youtube.com") && 
          !subjectObject.interactiveUrl.includes("youtu.be")) {
        urls.push({ url: subjectObject.interactiveUrl, type: "html" });
      }
    }

    let allParagraphs: string[] = [];
    const pendingLoads: Promise<any>[] = [];

    // Check memory caches or trigger background downloads
    for (const item of urls) {
      if (contentCache.has(item.url)) {
        allParagraphs.push(...(contentCache.get(item.url) || []));
      } else {
        const fetchPromise = (async () => {
          const paragraphs = await fetchAndParseUrl(item.url, item.type);
          if (paragraphs && paragraphs.length > 0) {
            contentCache.set(item.url, paragraphs);
            allParagraphs.push(...paragraphs);
          }
        })();
        pendingLoads.push(fetchPromise);
      }
    }

    // Wait for at most 3.5 seconds on first fetch so we can search real book elements on the spot!
    if (pendingLoads.length > 0) {
      await Promise.race([
        Promise.all(pendingLoads),
        new Promise(resolve => setTimeout(resolve, 3500))
      ]);
    }

    // Process matching paragraphs using keyword relevance
    let matches = searchInParagraphs(allParagraphs, message);

    let foundSourceUrl = "";
    let searchResponse = "";

    if (matches.length > 0 && matches[0].score >= 5) {
      // Find source URL of the best matching paragraph to give direct attribution
      for (const item of urls) {
        const cached = contentCache.get(item.url);
        if (cached && cached.includes(matches[0].text)) {
          foundSourceUrl = item.url;
          break;
        }
      }

      const topMatches = matches.slice(0, 3).map(m => m.text);
      searchResponse = `أبشر يا بطل! لقد قمت بالبحث الفوري في كتاب ومراجع المادة المرفقة ووجدت لك المعلومات الموثوقة والدقيقة التالية:\n\n` +
                       topMatches.map((t, i) => `📌 **الفقرة ${i+1}:** ${t}`).join("\n\n") + 
                       (foundSourceUrl ? `\n\n🔗 **المصدر المباشر للكتاب:** [اضغط هنا لتصفح مصدر المادة](${foundSourceUrl})` : "") +
                       `\n\nهل هذا الشرح من الكتاب كافٍ وواضح لك يا بطل؟ يمكنك دائماً سؤالي عن أي جزء آخر وسأبحث لك عنه فوراً!`;
    }

    // Fallback 1: Search inside standard local curriculumSummary
    if (!searchResponse) {
      const localSummary = subjectObject?.curriculumSummary || "";
      if (localSummary && localSummary.length > 10) {
        const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        let summaryMatch = false;
        words.forEach(w => {
          if (localSummary.toLowerCase().includes(w)) {
            summaryMatch = true;
          }
        });
        if (summaryMatch) {
          searchResponse = `أهلاً بك يا بطل! لم يكتمل تحميل كتاب المادة بالكامل بعد، ولكن قمت بالبحث في الخلاصة المعتمدة لمنهج مادة (${subject}) ووجدت المعلومات التالية:\n\n📖 "${localSummary}"\n\nسأستمر في فحص وتوثيق بقية كشوفات الكتب والمذكرات بالكامل قريباً لتبسيط أي مسائل أخرى!`;
        }
      }
    }

    // Fallback 2: Local contextual curriculum fallback dictionary matching
    if (!searchResponse) {
      let fallbackCategory = "arabic";
      const subLower = subject.toLowerCase();
      if (subLower.includes("رياض") || subLower.includes("حساب") || subLower.includes("جمع") || subLower.includes("عمليات") || subLower.includes("math") || subLower.includes("أرقام")) {
        fallbackCategory = "math";
      } else if (subLower.includes("علم") || subLower.includes("بيئة") || subLower.includes("طبيعة") || subLower.includes("ساق") || subLower.includes("ورقة") || subLower.includes("نبات") || subLower.includes("إنسان") || subLower.includes("خلية") || subLower.includes("سائل") || subLower.includes("صلب") || subLower.includes("غاز")) {
        fallbackCategory = "science";
      } else if (subLower.includes("دين") || subLower.includes("إسلام") || subLower.includes("قرآن") || subLower.includes("توحيد") || subLower.includes("عقيدة") || subLower.includes("فقه")) {
        fallbackCategory = "religion";
      } else if (subLower.includes("تاريخ") || subLower.includes("سودان") || subLower.includes("جغراف") || subLower.includes("مجتمع")) {
        fallbackCategory = "history";
      } else {
        fallbackCategory = "arabic";
      }

      const topics = LOCAL_CURRICULUM_FALLBACK[fallbackCategory] || [];
      let bestFallback: typeof topics[0] | null = null;
      let highestScore = 0;

      const queryWords = message.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      topics.forEach(topic => {
        let score = 0;
        queryWords.forEach(word => {
          if (topic.keywords.some(kw => kw.includes(word) || word.includes(kw))) {
            score += 10;
          }
        });
        if (score > highestScore) {
          highestScore = score;
          bestFallback = topic;
        }
      });

      if (bestFallback && highestScore > 0) {
        searchResponse = `أهلاً بك يا بطل! قمت بالبحث في الأرشيف التعليمي المعتمد للمادة وحصلت على هذا الشرح الدقيق والوافي لمفهوم سؤالك:\n\n` +
                         `⭐ **${(bestFallback as any).title}**\n\n` +
                         `${(bestFallback as any).content}\n\n` +
                         `أتمنى لك الفهم والتيسير يا بطل السودان الصاعد، وسلني عن أي مواضيع أخرى لتوضيحها لك بكامل السرور!`;
      }
    }

    // Fallback 3: Standard generic outline feedback
    if (!searchResponse) {
      searchResponse = `أهلاً بك يا بطل! لقد قمت بعملية فحص ذكية وشاملة في كافة كتب ومذكرات ومواقع مادة (${subject}) للصف (${grade}).\n\n` +
                       `لم أعثر على مطابقة دقيقة جداً لهذه الكلمات الحالية، ولكن أريد التذكير بأن منهج مادة **${subject}** السوداني يتناول:\n` +
                       `- تبسيط المفاهيم النظرية والتطبيق العملي.\n` +
                       `- حل الأنشطة وحفظ القواعد الأساسية المعتمدة.\n` +
                       `- ربط المعارف العلمية بالواقع الميداني في بلدنا الحبيب.\n\n` +
                       `💡 **نصيحة المعلم:** حاول كتابة سؤالك بكلمات مفتاحية أو مصطلحات تقع ضمن موضوع المادة (مثال: "حالات المادة الصالبة"، "حروف الجر"، "المربع والمستطيل"، "أركان الإسلام") حتى استطيع عزل السطور الصحيحة من الكتاب وإرسالها لك للتوثيق!`;
    }

    res.json({ text: searchResponse });
  } catch (error: any) {
    console.error("Link Search Tutor Error:", error);
    res.status(500).json({ error: error.message || "عذراً يا بطل، حدث خطأ أثناء إجراء عملية البحث الحية في مصادر الدرس. يرجى إعادة التجربة." });
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
  hidden?: boolean; // Optional property to hide subject
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

    const targetUrl = cleanUrlForDownload(url);
    const response = await fetch(targetUrl);
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

// API Endpoint to check and retrieve Supabase details dynamically from Server Env Variables (for zero-configuration on clients)
app.get("/api/config/supabase", (req, res) => {
  try {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
    
    res.json({
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConfigured: !!url && !!anonKey
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Realtime sync states for SSE (Server-Sent Events)
let sseClients: any[] = [];

// API Endpoint for Server-Sent Events (SSE)
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  if (typeof (res as any).flushHeaders === "function") {
    (res as any).flushHeaders();
  }
  
  // Instruct client-side EventSource to wait 15 seconds before retrying connection drops, reducing rate limiting
  res.write("retry: 15000\n\n");
  
  // Send initial connection feedback
  res.write(`data: ${JSON.stringify({ type: "connected", message: "متصل بنجاح بقناة المزامنة الفورية للبيانات" })}\n\n`);
  
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  sseClients.push(newClient);
  
  // Heartbeat ping every 20s to prevent Cloud Run proxy disconnects and loop-shunting
  const pingInterval = setInterval(() => {
    res.write(": keepalive ip\n\n");
  }, 20000);
  
  req.on("close", () => {
    clearInterval(pingInterval);
    sseClients = sseClients.filter(client => client.id !== clientId);
  });
});

// API Webhook Endpoint to receive notifications from Supabase
app.post("/api/webhooks/supabase", (req, res) => {
  try {
    const payload = req.body;
    console.log("Supabase Webhook Triggered with payload:", JSON.stringify(payload, null, 2));

    // Broadcast the "reload_curriculum" event to all active clients
    sseClients.forEach((client) => {
      client.res.write(`data: ${JSON.stringify({
        type: "reload_curriculum",
        table: payload?.table || "unknown",
        operation: payload?.type || "unknown",
        record: payload?.record || null,
        timestamp: new Date().toISOString()
      })}\n\n`);
    });

    res.json({
      success: true,
      message: "تم استلام حدث التحديث من سوبابيس بنجاح وبثه لجميع المستخدمين المتصلين فورياً!",
      connections: sseClients.length
    });
  } catch (err: any) {
    console.error("Supabase webhook process error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API Route to submit user feedback/suggestions
app.post("/api/feedback", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!email || !message) {
      return res.status(400).json({ error: "البريد الإلكتروني ومحتوى الملاحظة مطلوبين." });
    }

    const feedbackItem = {
      id: "FB-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      name: name || "مجهول",
      email: email.trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString()
    };

    // Log the feedback explicitly on the server console for audit/inspection
    console.log("=========================================");
    console.log("📥 NEW USER FEEDBACK RECEIVED!");
    console.log(`To: almangoryo@gmail.com (Direct Email Target)`);
    console.log(`From: ${feedbackItem.name} <${feedbackItem.email}>`);
    console.log(`Message: "${feedbackItem.message}"`);
    console.log("=========================================");

    // Persist the feedback locally in a feedbacks.json file with fail-safe support
    try {
      const filePath = path.join(process.cwd(), "feedbacks.json");
      let currentFeedbacks = [];
      try {
        const fileData = await fs.readFile(filePath, "utf8");
        currentFeedbacks = JSON.parse(fileData);
      } catch (e) {
        // file doesn't exist, start fresh
      }

      currentFeedbacks.push(feedbackItem);
      await fs.writeFile(filePath, JSON.stringify(currentFeedbacks, null, 2), "utf8");
    } catch (fsErr: any) {
      console.warn("Warning: Could not save feedback to file (read-only filesystem or container lock):", fsErr.message);
      // We do not fail the request, the logs are printed in the persistent console/GCP logs which is safe!
    }

    // Success response requested by the user
    res.json({
      success: true,
      message: "شكرا على ملاحظاتكم وهي محل اهتمامنا سيتم التعامل معها قريبا وشكرا لكم وفي امان الله"
    });
  } catch (error: any) {
    console.error("Feedback process error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء إرسال الملاحظة. الرجاء المحاولة مرة أخرى." });
  }
});

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  gradeName: string | null;
  text: string;
  timestamp: string;
}

let serverChatMessages: ChatMessage[] = [];
const chatMessagesFilePath = path.join(process.cwd(), "chat_messages.json");

// Helper to load chat messages from chat_messages.json
async function loadChatMessages() {
  try {
    const fileData = await fs.readFile(chatMessagesFilePath, "utf8");
    serverChatMessages = JSON.parse(fileData);
  } catch (err) {
    // If file doesn't exist or is invalid, initialize empty
    serverChatMessages = [];
  }
}

// Helper to save chat messages to chat_messages.json
async function saveChatMessages() {
  try {
    await fs.writeFile(chatMessagesFilePath, JSON.stringify(serverChatMessages, null, 2), "utf8");
  } catch (err) {
    console.warn("Failed to write chat messages to disk:", err);
  }
}

// Lazy load chat messages once when first accessed
loadChatMessages();

function censorBadWords(text: string): string {
  let censored = text;
  const profaneList = [
    "يا كلب", "ياكلب", "ابن الكلب", "بنت الكلب", "يا حمار", "ياحمار", "كلب", "حمار", "غبي", "حيوان", "خرة", "زق", "قذر", "قذرة",
    "سافل", "سافلة", "وسخ", "وسخة", "متخلف", "منحط", "يا جزمة", "ياجزمة", "سرسر", "شرير", "حقير", "حقيرة", "تفه",
    "كس", "طيز", "شرموط", "ديوث", "عرص", "عاهر", "قحبة", "منيوك", "نكاح", "شرموطة", "قحبة", "عاهرة", "منيوكة", "لوطي"
  ];
  const profaneEnglish = [
    "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "pussy", "slut", "whore"
  ];

  for (const word of profaneList) {
    const regex = new RegExp(word, 'gi');
    censored = censored.replace(regex, (match) => "*".repeat(match.length));
  }

  for (const word of profaneEnglish) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    censored = censored.replace(regex, (match) => "*".repeat(match.length));
  }

  return censored;
}

// GET chat messages history
app.get("/api/chat/messages", async (req, res) => {
  try {
    res.json({ success: true, messages: serverChatMessages.slice(-100) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST send new chat message
app.post("/api/chat/send", async (req, res) => {
  try {
    const { userId, username, userRole, gradeName, text } = req.body;
    
    if (!userId || !username || !text) {
      return res.status(400).json({ success: false, error: "بيانات الرسالة غير مكتملة." });
    }

    const filteredText = censorBadWords(text.slice(0, 250));

    const newMessage: ChatMessage = {
      id: "MSG-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      userId,
      username,
      userRole: userRole || "student",
      gradeName: gradeName || null,
      text: filteredText,
      timestamp: new Date().toISOString()
    };

    serverChatMessages.push(newMessage);
    
    // Keep internal memory buffer safe and clean
    if (serverChatMessages.length > 200) {
      serverChatMessages = serverChatMessages.slice(-200);
    }

    await saveChatMessages();

    // Broadcast messages to all active eventstream channels live!
    sseClients.forEach((client) => {
      try {
        client.res.write(`data: ${JSON.stringify({
          type: "new_chat_message",
          message: newMessage,
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (broadcastErr) {
        console.warn("Failed sending SSE chat broadcast message to client:", client.id);
      }
    });

    res.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error("Chat send error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ==========================================
// 🛡️ نظام إدارة الصداقات الجديد (فوري وعبر الـ SSE)
// ==========================================

// رفعنا تعريف المصفوفة فوق هنا أولاً عشان الدوال التحت تقراها بدون أخطاء
let serverFriendships: any[] = [];

// 1. جلب الطلبات المعلقة (حل خطأ /api/friendships/pending 404)
app.get("/api/friendships/pending", async (req, res) => {
  try {
    // جلب كل الطلبات القائمة المعلقة في السيرفر ومزامنتها
    const pendingRequests = serverFriendships.filter(f => f.status === "pending");
    res.json({ success: true, data: pendingRequests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. جلب كل علاقات مستخدم معين (احتياطية لو طلبها بالـ ID)
app.get("/api/friendships/:userId", async (req, res) => {
  const { userId } = req.params;
  const userRelations = serverFriendships.filter(f => f.sender_id === userId || f.receiver_id === userId);
  res.json({ success: true, data: userRelations });
});

// 3. إرسال طلب صداقة جديد
app.post("/api/friendships/send", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ success: false, error: "معطيات ناقصة" });
    }

    // التحقق من عدم وجود طلب سابق
    const exists = serverFriendships.find(f => 
      (f.sender_id === senderId && f.receiver_id === receiverId) ||
      (f.sender_id === receiverId && f.receiver_id === senderId)
    );

    if (exists) {
      return res.json({ success: false, message: "يوجد طلب صداقة قائم بالفعل." });
    }

    const newFriendship = {
      id: "_" + Math.random().toString(36).substr(2, 9),
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      created_at: new Date().toISOString()
    };

    serverFriendships.push(newFriendship);

    // بث الإشعار فوراً للمستخدم المستهدف عبر الـ SSE
    sseClients.forEach((client) => {
      try {
        client.res.write(`data: ${JSON.stringify({
          type: "incoming_friend_request",
          friendship: newFriendship
        })}\n\n`);
      } catch (err) {}
    });

    res.json({ success: true, friendship: newFriendship });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. إدارة طلبات الصداقة (قبول أو رفض)
app.post("/api/friendships/respond", async (req, res) => {
  try {
    const { friendshipId, action } = req.body; // action: 'accepted' أو 'rejected'

    if (action === "accepted") {
      serverFriendships = serverFriendships.map(f => 
        f.id === friendshipId ? { ...f, status: "accepted" } : f
      );
    } else {
      serverFriendships = serverFriendships.filter(f => f.id !== friendshipId);
    }

    // بث التحديث الفوري للطرفين
    sseClients.forEach((client) => {
      try {
        client.res.write(`data: ${JSON.stringify({
          type: "friendship_update",
          id: friendshipId,
          status: action === "accepted" ? "accepted" : "deleted"
        })}\n\n`);
      } catch (err) {}
    });

    res.json({ success: true, action });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST delete chat message (restricted to admin privileges)
app.post("/api/chat/delete", async (req, res) => {
  try {
    const { messageId, adminPassword } = req.body;

    if (adminPassword !== "20302060") {
      return res.status(403).json({ success: false, error: "صلاحية الإدارة غير صالحة." });
    }

    serverChatMessages = serverChatMessages.filter(m => m.id !== messageId);
    await saveChatMessages();

    // Broadcast message deletion to all eventstreams!
    sseClients.forEach((client) => {
      try {
        client.res.write(`data: ${JSON.stringify({
          type: "delete_chat_message",
          id: messageId,
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (broadcastErr) {
        // Safe skip stale connections
      }
    });

    res.json({ success: true, messageId });
  } catch (error: any) {
    console.error("Chat delete error:", error);
    res.status(500).json({ success: false, error: error.message });
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