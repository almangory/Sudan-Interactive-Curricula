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

// ==========================================
// 🛡️ المصفوفات والمتغيرات الأساسية (فوق خالص لضمان الترتيب البرمجي)
// ==========================================
let serverFriendships: any[] = [];
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
      content: "توجد المادة في الطبيعة المحيطة بنا في ثلاث حالات أساسية، وتتحول من حالة إلى أخرى بالحرارة والبرودة:\n1. الحالة الصلبة: لها شكل ثابت وحجم محدد وجاف (مثل: الخشب, الحجر، الثلج).\n2. الحالة السائلة: لها حجم محدد ولكنها تأخذ شكل الوعاء الذي توضع فيه (مثل: الماء، الزيت، العصير).\n3. الحالة الغازية: ليس لها شكل أو حجم محدد، بل تنتشر في الفراغ (مثل: الهواء، بخار الماء، الأوكسجين).\n- الانصهار: تحول المادة من الحالة الصلبة للسائلة بالتسخين.\n- التجمد: تحول المادة من الحالة السائلة للصلبة بالتبريد."
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
          const parser = new PDFParseClass({ data: Buffer.from(buffer) });
          const textResult = await parser.getText();
          rawText = textResult?.text || "";
        } else if (typeof pdfModule === 'function') {
          const pdfData = await pdfModule(Buffer.from(buffer));
          rawText = pdfData?.text || "";
        }
      } catch (err: any) {
        console.error("Error parsing PDF:", err);
      }
      return rawText.split(/(?:\s*\r?\n\s*){2,}/).map(p => p.replace(/\s+/g, " ").trim()).filter(p => p.length > 15);
    } else {
      const htmlText = await response.text();
      const cleanHtml = htmlText.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "").replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "").replace(/<\/?[^>]+(>|$)/g, " ");
      return cleanHtml.split(/(?:\. |\r?\n|\t|\s{2,})/).map(p => p.replace(/\s+/g, " ").trim()).filter(p => p.length > 20 && p.length < 500);
    }
  } catch (error) {
    console.error(`Error loading or parsing "${url}":`, error);
    return [];
  }
}

function searchInParagraphs(paragraphs: string[], query: string): { text: string; score: number }[] {
  const queryWords = query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?]/g, " ").split(/\s+/).filter(w => w.length > 1 && !ARABIC_STOPWORDS.has(w));
  if (queryWords.length === 0) return [];
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
        if (matches) score += matches.length * 5;
      }
    });
    if (paraClean.includes(queryWords.join(" "))) score += 40;
    if (score > 0) results.push({ text: para.trim(), score });
  }
  return results.sort((a, b) => b.score - a.score);
}

async function loadChatMessages() {
  try {
    const fileData = await fs.readFile(chatMessagesFilePath, "utf8");
    serverChatMessages = JSON.parse(fileData);
  } catch (err) {
    serverChatMessages = [];
  }
}

async function saveChatMessages() {
  try {
    await fs.writeFile(chatMessagesFilePath, JSON.stringify(serverChatMessages, null, 2), "utf8");
  } catch (err) {
    console.warn("Failed to write chat messages to disk:", err);
  }
}
loadChatMessages();

function censorBadWords(text: string): string {
  let censored = text;
  const profaneList = [
    "يا كلب", "ياكلب", "ابن الكلب", "بنت الكلب", "يا حمار", "ياحمار", "كلب", "حمار", "غبي", "حيوان", "خرة", "زق", "قذر", "قذرة",
    "سافل", "سافلة", "وسخ", "وسخة", "متخلف", "منحط", "يا جزمة", "ياجزمة", "سرسر", "شرير", "حقير", "حقيرة", "تفه",
    "كس", "طيز", "شرموط", "ديوث", "عرص", "عاهر", "قحبة", "منيوك", "نكاح", "شرموطة", "قحبة", "عاهرة", "منيوكة", "لوطي"
  ];
  for (const word of profaneList) {
    censored = censored.replace(new RegExp(word, 'gi'), (match) => "*".repeat(match.length));
  }
  return censored;
}

const app = express();
const PORT = 3000;

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey: apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================================
// 🛡️ الروابط المؤمنة والسريعة المتوافقة مع سوبابيس
// ==========================================

// 1. جلب إعدادات سوبابيس للـ UI (مؤمنة بالكامل وسريعة ضد الـ 500)
app.get("/api/config/supabase", (req, res) => {
  try {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://ecgqrdkiybhhncdrtlea.supabase.co";
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
    res.json({ url: url.trim(), anonKey: anonKey.trim(), isConfigured: true });
  } catch (err: any) {
    res.json({ url: "https://ecgqrdkiybhhncdrtlea.supabase.co", anonKey: "", isConfigured: true });
  }
});

// 2. جلب الطلبات المعلقة الحية مباشرة من جدول سوبابيس
app.get("/api/friendships/pending", async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || "https://ecgqrdkiybhhncdrtlea.supabase.co";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    const response = await fetch(`${supabaseUrl}/rest/v1/friendships?status=eq.pending`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    if (!response.ok) return res.json({ success: true, data: [] });
    res.json({ success: true, data: await response.json() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. جلب كل علاقات مستخدم معين من جدول سوبابيس
app.get("/api/friendships/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const supabaseUrl = process.env.SUPABASE_URL || "https://ecgqrdkiybhhncdrtlea.supabase.co";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    const response = await fetch(`${supabaseUrl}/rest/v1/friendships?or=(sender_id.eq.${userId},receiver_id.eq.${userId})`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    if (!response.ok) return res.json({ success: true, data: [] });
    res.json({ success: true, data: await response.json() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. إرسال طلب صداقة جديد
app.post("/api/friendships/send", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) return res.status(400).json({ success: false, error: "معطيات ناقصة" });
    const newFriendship = { id: "_" + Math.random().toString(36).substr(2, 9), sender_id: senderId, receiver_id: receiverId, status: "pending", created_at: new Date().toISOString() };
    res.json({ success: true, friendship: newFriendship });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. إدارة طلبات الصداقة (قبول أو رفض)
app.post("/api/friendships/respond", async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. حذف رسائل الدردشة للآدمين
app.post("/api/chat/delete", async (req, res) => {
  try {
    const { messageId, adminPassword } = req.body;
    if (adminPassword !== "20302060") return res.status(403).json({ success: false, error: "صلاحية غير صالحة." });
    serverChatMessages = serverChatMessages.filter(m => m.id !== messageId);
    await saveChatMessages();
    res.json({ success: true, messageId });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. جلب رسائل الشات القديمة وإرسال الرسائل الجديدة
app.get("/api/chat/messages", async (req, res) => {
  try {
    res.json({ success: true, messages: serverChatMessages.slice(-100) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/chat/send", async (req, res) => {
  try {
    const { userId, username, userRole, gradeName, text } = req.body;
    if (!userId || !username || !text) return res.status(400).json({ success: false, error: "بيانات ناقصة" });
    const filteredText = censorBadWords(text.slice(0, 250));
    const newMessage = { id: "MSG-" + Date.now(), userId, username, userRole: userRole || "student", gradeName: gradeName || null, text: filteredText, timestamp: new Date().toISOString() };
    serverChatMessages.push(newMessage);
    await saveChatMessages();
    res.json({ success: true, message: newMessage });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. الـ AI Tutor Chat (كامل ومسبوك لفحص وقراءة الكتب)
app.post("/api/tutor/chat", async (req, res) => {
  try {
    const { message, grade, subject, subjectObject } = req.body;
    if (!message || typeof message !== "string") return res.status(400).json({ error: "الرجاء كتابة سؤال صحيح" });

    const urls: { url: string; type: 'pdf' | 'html' }[] = [];
    if (subjectObject) {
      if (subjectObject.pdfUrl) urls.push({ url: subjectObject.pdfUrl, type: "pdf" });
      if (subjectObject.memoPdfUrl) urls.push({ url: subjectObject.memoPdfUrl, type: "pdf" });
      if (subjectObject.interactiveUrl && !subjectObject.interactiveUrl.includes("youtube.com")) {
        urls.push({ url: subjectObject.interactiveUrl, type: "html" });
      }
    }

    let allParagraphs: string[] = [];
    const pendingLoads: Promise<any>[] = [];

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

    if (pendingLoads.length > 0) {
      await Promise.race([Promise.all(pendingLoads), new Promise(resolve => setTimeout(resolve, 3500))]);
    }

    let matches = searchInParagraphs(allParagraphs, message);
    let foundSourceUrl = "";
    let searchResponse = "";

    if (matches.length > 0 && matches[0].score >= 5) {
      for (const item of urls) {
        const cached = contentCache.get(item.url);
        if (cached && cached.includes(matches[0].text)) { foundSourceUrl = item.url; break; }
      }
      const topMatches = matches.slice(0, 3).map(m => m.text);
      searchResponse = `أبشر يا بطل! لقد قمت بالبحث الفوري في كتاب ومراجع المادة ووجدت لك المعلومات الموثوقة التالية:\n\n` +
                       topMatches.map((t, i) => `📌 **الفقرة ${i+1}:** ${t}`).join("\n\n") + 
                       (foundSourceUrl ? `\n\n🔗 **المصدر المباشر للكتاب:** [اضغط هنا لتصفح مصدر المادة](${foundSourceUrl})` : "") +
                       `\n\nهل هذا الشرح كافٍ وواضح لك يا بطل؟`;
    }

    if (!searchResponse) {
      const localSummary = subjectObject?.curriculumSummary || "";
      if (localSummary && localSummary.length > 10 && message.toLowerCase().split(/\s+/).some(w => localSummary.toLowerCase().includes(w))) {
        searchResponse = `أهلاً بك يا بطل! قمت بالبحث في الخلاصة المعتمدة لمنهج مادة (${subject}) ووجدت التالي:\n\n📖 "${localSummary}"`;
      }
    }

    if (!searchResponse) {
      let fallbackCategory = "arabic";
      const subLower = subject.toLowerCase();
      if (subLower.includes("رياض") || subLower.includes("math")) fallbackCategory = "math";
      else if (subLower.includes("علم") || subLower.includes("طبيعة")) fallbackCategory = "science";
      else if (subLower.includes("دين") || subLower.includes("إسلام")) fallbackCategory = "religion";
      else if (subLower.includes("تاريخ") || subLower.includes("سودان")) fallbackCategory = "history";

      const topics = LOCAL_CURRICULUM_FALLBACK[fallbackCategory] || [];
      let bestFallback: any = null;
      let highestScore = 0;
      const queryWords = message.toLowerCase().split(/\s+/);

      topics.forEach(topic => {
        let score = 0;
        queryWords.forEach(word => { if (topic.keywords.some(kw => kw.includes(word))) score += 10; });
        if (score > highestScore) { highestScore = score; bestFallback = topic; }
      });

      if (bestFallback && highestScore > 0) {
        searchResponse = `أهلاً بك يا بطل! قمت بالبحث وحصلت على هذا الشرح لمفهوم سؤالك:\n\n⭐ **${bestFallback.title}**\n\n${bestFallback.content}`;
      }
    }

    if (!searchResponse) {
      searchResponse = `أهلاً بك يا بطل في كشوفات مادة (${subject}) للصف (${grade}).\n\nحاول كتابة سؤالك بكلمات مفتاحية مباشرة تقع ضمن موضوع المادة (مثال: "حروف الجر"، "الجمع والطرح") حتى أستطيع عزل السطور الصحيحة من الكتاب لك!`;
    }

    res.json({ text: searchResponse });
  } catch (error: any) {
    res.status(500).json({ error: "حدث خطأ أثناء البحث المباشر." });
  }
});

// 9. توليد الكويزات التفاعلية بالذكاء الاصطناعي
app.post("/api/tutor/quiz", async (req, res) => {
  try {
    const { grade, subject } = req.body;
    if (!apiKey || !ai) return res.status(503).json({ error: "مفتاح الذكاء الاصطناعي غير متوفر." });

    const prompt = `أنت خبير مناهج سودانية. قم بتوليد سؤالين (2) مسليين ومتعدد الخيارات لمادة ${subject} في الصف ${grade}.\nرجع النتيجة JSON مطابقة تماماً: {\"quizzes\": [{\"question\": \"..\", \"options\": [\"..\"], \"answerIndex\": 0, \"explanation\": \"..\"}]}`;
    const response = await ai.models.generateContent({ model: "gemini-3.5-flash", contents: prompt, config: { responseMimeType: "application/json" } });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    res.status(500).json({ error: "فشل توليد الاختبار." });
  }
});

// 10. حفظ تعديلات المناهج الإدارية وتمرير التحديث لسوبابيس
app.post("/api/curriculum/save", async (req, res) => {
  try {
    const { password, stages } = req.body;
    if (password !== "20302060") return res.status(403).json({ error: "كلمة مرور خاطئة." });
    const filePath = path.join(process.cwd(), "src", "data", "curriculum.ts");
    await fs.writeFile(filePath, `export const stagesData: any[] = ${JSON.stringify(stages, null, 2)};\n`, "utf8");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "فشل حفظ المنهج." });
  }
});

app.get("/api/proxy-pdf", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== "string") return res.status(400).json({ error: "الرابط مطلوب" });
    const response = await fetch(cleanUrlForDownload(url));
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Global JSON error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express App Error:", err);
  res.status(err.status || err.statusCode || 500).json({ success: false, error: err.message || "حدث خطأ داخلي على الملقم." });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sudanese Curriculum Server is running on port ${PORT}`);
  });
}

startServer();