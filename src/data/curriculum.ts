export interface Subject {
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

export const stagesData: Stage[] = [
  {
    "id": "kindergarten",
    "name": "مرحلة الروضة (التعليم المبكر)",
    "description": "بناء اللبنات الأولى لشخصية الطفل عبر اللعب التفاعلي والألوان والمهارات الحركية والذهنية.",
    "colorTheme": "from-pink-550 to-rose-450",
    "icon": "Baby",
    "grades": [
      {
        "id": "kg-1",
        "name": "الروضة الأولى (البراعم)",
        "subjects": [
          {
            "id": "kg1-arabic",
            "name": "اللغة العربية وحكاياتها",
            "iconName": "Smile",
            "colorClass": "bg-amber-100 text-amber-700 border-amber-200",
            "interactiveUrl": "https://www.starfall.com/h/index-kindergarten.php",
            "interactiveLabel": "ألعاب الأحرف التفاعلية",
            "curriculumSummary": "التعرف البصري على الحروف العربية الأساسية، الاستماع للقصص، ونطق مخارج الحروف بطريقة غنائية لطيفة."
          },
          {
            "id": "kg1-math",
            "name": "عالم الأرقام والألعاب",
            "iconName": "Fingerprint",
            "colorClass": "bg-blue-100 text-blue-700 border-blue-200",
            "interactiveUrl": "https://phet.colorado.edu/ar/simulations/category/math",
            "interactiveLabel": "محاكاة عد تفاعلية PhET",
            "curriculumSummary": "العد بالأصابع والمكعبات من 1 إلى 10، وتصنيف الأشكال الهندسية البسيطة مثل الدائرة والمربع."
          },
          {
            "id": "kg1-religion",
            "name": "الآداب والقيم والأخلاق",
            "iconName": "Heart",
            "colorClass": "bg-emerald-100 text-emerald-700 border-emerald-200",
            "interactiveUrl": "https://kiddle.co",
            "interactiveLabel": "محرك بحث تفاعلي آمن للأطفال",
            "curriculumSummary": "تعليم الأطفال آداب الطعام والشراب، إلقاء التحية، والرحمة بالحيوانات وحب الوالدين عبر قصص تفاعلية."
          }
        ]
      },
      {
        "id": "kg-2",
        "name": "الروضة الثانية (الأمل)",
        "subjects": [
          {
            "id": "kg2-words",
            "name": "تكوين الكلمات والقصص",
            "iconName": "BookOpen",
            "colorClass": "bg-violet-100 text-violet-700 border-violet-200",
            "interactiveUrl": "https://www.abcya.com/grades/k",
            "interactiveLabel": "منصة ABCya التفاعلية للأطفال",
            "curriculumSummary": "ربط الحروف لتكوين كلمات ثنائية وثلاثية بسيطة، التعبير عن المشاعر ووصف الصور بلغة عربية سليمة."
          },
          {
            "id": "kg2-shapes",
            "name": "الحساب الذهني الإبداعي",
            "iconName": "LayoutGrid",
            "colorClass": "bg-indigo-100 text-indigo-700 border-indigo-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/make-ten/latest/make-ten_all.html",
            "interactiveLabel": "موقع تكوين الأرقام التفاعلي PhET",
            "curriculumSummary": "مفاهيم أكبر من وأصغر من، والجمع البسيط بالأشياء المحسوسة والأشكال التوضيحية."
          },
          {
            "id": "kg2-english",
            "name": "الحروف الإنجليزية الممتعة",
            "iconName": "Languages",
            "colorClass": "bg-pink-100 text-pink-700 border-pink-200",
            "interactiveUrl": "https://www.starfall.com/h/abcs/",
            "interactiveLabel": "نطق الحروف الإنجليزية التفاعلي",
            "curriculumSummary": "أبجديات اللغة الإنجليزية (A to Z) مع الكلمات المصورة البسيطة ومحاكاة النطق الصحيح."
          }
        ]
      },
      {
        "id": "kg-3",
        "name": "الروضة الثالثة (التمهيدي)",
        "subjects": [
          {
            "id": "kg3-reading",
            "name": "المهارات القرائية والتهجئة",
            "iconName": "BookMarked",
            "colorClass": "bg-amber-100 text-amber-700 border-amber-200",
            "interactiveUrl": "https://www.storylineonline.net",
            "interactiveLabel": "موقع قصص الأطفال المصورة والمحللة",
            "curriculumSummary": "قراءة الجمل البسيطة القصيرة، كتابة الاسم الشخصي، وإعداد الطفل بشكل كامل لدخول المدرسة الابتدائية."
          },
          {
            "id": "kg3-science",
            "name": "استكشاف الطبيعة والعلوم",
            "iconName": "Compass",
            "colorClass": "bg-cyan-100 text-cyan-700 border-cyan-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/build-a-fraction/latest/build-a-fraction_all.html",
            "interactiveLabel": "محاكاة الأشكال والنسب التفاعلية",
            "curriculumSummary": "استكشاف فصول السنة، أشكال الغيوم، وظائف الحواس الخمس، وزراعة نباتات بسيطة في بيئة السودان."
          },
          {
            "id": "kg3-art",
            "name": "الرسم والتلوين وتنمية الخيال",
            "iconName": "Palette",
            "colorClass": "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
            "interactiveUrl": "https://www.autodraw.com",
            "interactiveLabel": "رسم تفاعلي ذكي AutoDraw",
            "curriculumSummary": "تنسيق الألوان، تتبع الخطوط، رسم عناصر من الطبيعة، والتعبير الإبداعي بالمجسّمات الخفيفة."
          }
        ]
      }
    ]
  },
  {
    "id": "primary",
    "name": "المرحلة الابتدائية (الأساس الجديد)",
    "description": "التعليم التأسيسي الشامل لغرس المواد العلمية والأدبية، والتعرف الجغرافي والاجتماعي على السودان.",
    "colorTheme": "from-emerald-550 to-teal-450",
    "icon": "GraduationCap",
    "grades": [
      {
        "id": "pri-1",
        "name": "الصف الأول الابتدائي",
        "subjects": [
          {
            "id": "pri1-arabic",
            "name": "اللغة العربية (المرشد)",
            "iconName": "BookOpen",
            "colorClass": "bg-emerald-100 text-emerald-800 border-emerald-200",
            "interactiveUrl": "https://www.starfall.com",
            "interactiveLabel": "تمارين اللغات التفاعلية",
            "curriculumSummary": "الحروف الأبجدية بحركاتها الثلاث (الفتحة والضمة والكسرة)، التنوين، وقراءة النصوص القصيرة للبيئة السودانية."
          },
          {
            "id": "pri1-math",
            "name": "الرياضيات والعمليات",
            "iconName": "Calculator",
            "colorClass": "bg-blue-100 text-blue-800 border-blue-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/number-play/latest/number-play_all.html",
            "interactiveLabel": "لعبة الأرقام التفاعلية PhET",
            "curriculumSummary": "الجمع والطرح حتى العدد 99، قراءة وكتابة الأعداد، ومبادئ القياس والهندسة."
          },
          {
            "id": "pri1-science",
            "name": "العلوم والتربية الصحية",
            "iconName": "Atom",
            "colorClass": "bg-sky-100 text-sky-850 border-sky-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_all.html",
            "interactiveLabel": "حالات المادة مبسط PhET",
            "curriculumSummary": "التعرف على الكائنات الحية والجماد ومكونات البيئة من حولنا والنظافة والوقاية الصحية للطفل."
          }
        ]
      },
      {
        "id": "pri-2",
        "name": "الصف الثاني الابتدائي",
        "subjects": [
          {
            "id": "pri2-arabic",
            "name": "اللغة العربية والقصص",
            "iconName": "Languages",
            "colorClass": "bg-purple-100 text-purple-800 border-purple-200",
            "interactiveUrl": "https://www.indraak.org/",
            "interactiveLabel": "منصة إدراك للتعلم التفاعلي",
            "curriculumSummary": "قواعد لغوية مبسطة (أسماء الإشارة، الضمائر)، الإملاء الصحيح، وحفظ الأناشيد المدرسية الوطنية ولشعر الطبيعة."
          },
          {
            "id": "pri2-math",
            "name": "الرياضيات والهندسة",
            "iconName": "Compass",
            "colorClass": "bg-rose-100 text-rose-800 border-rose-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/area-builder/latest/area-builder_all.html",
            "interactiveLabel": "محاكاة بناء المساحات الهندسية",
            "curriculumSummary": "الأرقام الترتيبية، قراءة الساعة والوقت، الأشكال ثلاثية الأبعاد (المكعب والكرة)، وجداول الضرب البسيطة."
          },
          {
            "id": "pri2-islamic",
            "name": "التربية الإسلامية والفقه",
            "iconName": "Bookmark",
            "colorClass": "bg-emerald-100 text-emerald-800 border-emerald-200",
            "interactiveUrl": "https://quran.ksu.edu.sa",
            "interactiveLabel": "المصحف الإلكتروني التفاعلي للآيات",
            "curriculumSummary": "حفظ قصار السور من القرآن الكريم، السيرة النبوية المبسطة، الآداب الإسلامية اليومية والصلوات الخمس."
          }
        ]
      },
      {
        "id": "pri-3",
        "name": "الصف الثالث الابتدائي",
        "subjects": [
          {
            "id": "pri3-english",
            "name": "اللغة الإنجليزية (SMILE 3)",
            "iconName": "Languages",
            "colorClass": "bg-purple-100 text-purple-850 border-purple-200",
            "interactiveUrl": "https://smile-english-grade-3.vercel.app/",
            "interactiveLabel": "منصة اللغة الإنجليزية SMILE - الصف الثالث",
            "curriculumSummary": "سلسلة مناهج ابتسامة (SMILE) السودانية لتجربة سماع الكلمات وتكوين المحادثات والأغاني التعليمية التفاعلية."
          },
          {
            "id": "pri3-science",
            "name": "العلم في حياتنا",
            "iconName": "Leaf",
            "colorClass": "bg-green-100 text-green-800 border-green-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_all.html",
            "interactiveLabel": "محاكاة الطبيعة والكائنات الحية PhET",
            "curriculumSummary": "أجزاء النبات، دور حياة بعض الكائنات، مصادر المياه الطبيعية في السودان (الأمطار، النيل، الآبار) وأهمية الحفاظ عليها."
          },
          {
            "id": "pri3-math",
            "name": "الرياضيات ",
            "iconName": "Calculator",
            "colorClass": "bg-indigo-100 text-indigo-800 border-indigo-200",
            "interactiveUrl": "https://mathematics-3.vercel.app/",
            "interactiveLabel": "محاكاة الكسور التفاعلية",
            "curriculumSummary": "عمليات الضرب والقسمة، الكسور الاعتيادية، ومفهوم الميزان والوزن والكتلة.",
            "pdfUrl": "https://drive.google.com/file/d/1synoANAVOOcRdfwWsclY2rJffs8IttcE/view?usp=sharing",
            "videoUrl": "https://drive.google.com/file/d/1ejn8UlJQ9PsTfhwmD9ORFpLQ5qhXoN-O/view?usp=sharing",
            "memoPdfUrl": "https://drive.google.com/file/d/1ynqQn8DxTx8C4Bu6x7TtzvF_Ziw1nmRQ/view?usp=sharing"
          },
          {
            "id": "pri3-social",
            "name": "تاريخ بلادي وجغرافيتها",
            "iconName": "Map",
            "colorClass": "bg-amber-100 text-amber-800 border-amber-205",
            "interactiveUrl": "https://earth.google.com/web",
            "interactiveLabel": "جوجل إيرث التفاعلي لاستكشاف التضاريس",
            "curriculumSummary": "التعريف بوطننا السودان، حدوده الطبيعية العريضة، عاصمة السودان وتنوع ولاياته وجمال طبيعته المتنوعة."
          },
          {
            "id": "custom-subject-1781374310930",
            "name": "اللغة العربية",
            "iconName": "PenTool",
            "colorClass": "bg-emerald-900/20 text-emerald-400 border-emerald-800/40",
            "interactiveUrl": "",
            "interactiveLabel": "الموقع التفاعلي",
            "curriculumSummary": "كتاب اللغة العربية للصف الثالث الابتدائي في المنهج السوداني الجديد يعتبر خطوة أساسية ومهمة جداً في مسيرة الطفل التعليمية، لأنه بيركز على تمكين التلميذ من مهارات اللغة الأربعة (الاستماع، التحدث، القراءة، والكتابة) بطريقة مشوقة وتفاعلية بتناسب عمرو."
          }
        ]
      },
      {
        "id": "pri-4",
        "name": "الصف الرابع الابتدائي",
        "subjects": [
          {
            "id": "pri4-math",
            "name": "الرياضيات والكسور والأعداد العشرية",
            "iconName": "Calculator",
            "colorClass": "bg-blue-105 text-blue-900 border-blue-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/fractions-equality/latest/fractions-equality_all.html",
            "interactiveLabel": "تساوي الكسور التفاعلي PhET",
            "curriculumSummary": "الكسور المتكافئة، مقارنة وترتيب الأعداد العشرية، والمسائل الكلامية الحسابية المعقدة."
          },
          {
            "id": "pri4-science",
            "name": "العلوم والبيئة الطبيعية",
            "iconName": "Atom",
            "colorClass": "bg-teal-100 text-teal-800 border-teal-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_all.html",
            "interactiveLabel": "محاكاة الغازات والهواء PhET",
            "curriculumSummary": "حالات المادة (الصلبة والسائلة والغازية)، دورة المياه في الطبيعة، وتأثير درجات الحرارة."
          },
          {
            "id": "pri4-history",
            "name": "التاريخ والحضارات القديمة",
            "iconName": "History",
            "colorClass": "bg-amber-100 text-amber-800 border-amber-200",
            "interactiveUrl": "https://www.google.com/maps",
            "interactiveLabel": "خرائط تفاعلية للمواقع الأثرية",
            "curriculumSummary": "نشأة الحضارات القديمة على ضفاف النيل مثل حضارة كوش ومروي، والآثار السودانية الشهيرة (الأهرامات والقصور)."
          }
        ]
      },
      {
        "id": "pri-5",
        "name": "الصف الخامس الابتدائي",
        "subjects": [
          {
            "id": "pri5-science",
            "name": "العلوم ",
            "iconName": "Compass",
            "colorClass": "bg-cyan-100 text-cyan-800 border-cyan-200",
            "interactiveUrl": "",
            "interactiveLabel": "محاكاة الجاذبية والمدارات الفلكية",
            "curriculumSummary": "المجموعة الشمسية والنجوم والكواكب، حركة الأرض حول محورها وحقائق الفضاء الخارجي البسيطة.",
            "pdfUrl": "",
            "videoUrl": "https://youtu.be/wuF0eAlbqLU?si=qSgUuPkRS_21cAbW"
          },
          {
            "id": "pri5-english",
            "name": "اللغة الإنجليزية (Spine)",
            "iconName": "Languages",
            "colorClass": "bg-purple-100 text-purple-800 border-purple-200",
            "interactiveUrl": "https://learnenglishkids.britishcouncil.org",
            "interactiveLabel": "منصة المجلس الثقافي البريطاني للأطفال",
            "curriculumSummary": "قواعد اللغة الإنجليزية الأساسية، تركيب الجمل البسيطة، زمن المضارع البسيط، والكلمات المدرسية المعتادة."
          },
          {
            "id": "pri5-social",
            "name": "جغرافيا السودان الإقليمية",
            "iconName": "Globe",
            "colorClass": "bg-orange-100 text-orange-850 border-orange-200",
            "interactiveUrl": "https://earth.google.com/web/@12.8628,30.2176,1000a",
            "interactiveLabel": "مجسم ثلاثي الأبعاد لجغرافيا السودان",
            "curriculumSummary": "دراسة الطقس والمناخ والموارد المائية الطبيعية في السودان مثل النيلين الأزرق والأبيض ونهر عطبرة والتنمية الريفية."
          }
        ]
      },
      {
        "id": "pri-6",
        "name": "الصف السادس الابتدائي",
        "subjects": [
          {
            "id": "pri6-science",
            "name": "علوم الحياة والبيئة",
            "iconName": "Atom",
            "colorClass": "bg-green-100 text-green-900 border-green-200",
            "interactiveUrl": "https://science-grade-6.vercel.app/",
            "interactiveLabel": "منصة العلوم التفاعلية - الصف السادس",
            "curriculumSummary": "النظام البيئي وتوازنه، السلاسل والشبكات الغذائية، أثر الملوثات الحيوية والصناعية وكيف يساهم التشجير في جودة الهواء.",
            "pdfUrl": "https://drive.google.com/file/d/1xf9E4_l58w6Qt23jUzmaFORZkljxK57w/view?usp=sharing",
            "videoUrl": "https://drive.google.com/file/d/1GgXZ0vJvs11J2y096eCDF5SOigkB3sjr/view?usp=sharing"
          },
          {
            "id": "pri6-history",
            "name": "التاريخ",
            "iconName": "History",
            "colorClass": "bg-amber-100 text-amber-800 border-amber-200",
            "interactiveUrl": "https://history-grade-6.vercel.app/",
            "interactiveLabel": "منصة التاريخ التفاعلية - الصف السادس",
            "curriculumSummary": "دراسة تاريخ السودان القديم والحديث، معالم ورموز ووجوه من وطني ومبادئ المواطنة الصالحة والتربية الوطنية لدولة السودان.",
            "pdfUrl": "https://drive.google.com/file/d/13PZT76K0waAeodM2CMudtzLrEZGd7Xjf/view?usp=sharing",
            "videoUrl": ""
          },
          {
            "id": "pri6-geography",
            "name": "الجغرافيا",
            "iconName": "Globe",
            "colorClass": "bg-orange-100 text-orange-850 border-orange-200",
            "interactiveUrl": "",
            "interactiveLabel": "منصة الجغرافيا التفاعلية",
            "curriculumSummary": "دراسة جغرافيا السودان الإقليمية، تضاريس الولايات المختلفة، التنوع البيئي والمناخي ومصادر المياه والزراعة في السودان."
          },
          {
            "id": "pri6-math",
            "name": "الرياضيات",
            "iconName": "Calculator",
            "colorClass": "bg-blue-100 text-blue-900 border-blue-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/unit-rates-3d/latest/unit-rates-3d_all.html",
            "interactiveLabel": "محاكاة حساب النسب الرياضية",
            "curriculumSummary": "النسبة والتناسب، مقياس الرسم، وحساب مساحات الأشكال الهندسية المعقدة كالمثلث وشبه المنحرف.",
            "pdfUrl": "",
            "videoUrl": ""
          },
          {
            "id": "pri6-arabic",
            "name": "قواعد اللغة العربية وعلم النحو",
            "iconName": "BookOpen",
            "colorClass": "bg-violet-100 text-violet-800 border-violet-200",
            "interactiveUrl": "https://www.edraak.org",
            "interactiveLabel": "منصة إدراك للتعلم التفاعلي والأدبي",
            "curriculumSummary": "أقسام الكلام، إعراب الفاعل والمفعول به، كان وأخواتها وإن وأخواتها، والأدب والشعر السوداني الرصين."
          }
        ]
      }
    ]
  },
  {
    "id": "intermediate",
    "name": "المرحلة المتوسطة",
    "description": "مرحلة انتقالية هامة تركز على تمكين الطلاب من المفاهيم العلمية العميقة وقراءة وتحليل التاريخ والجغرافيا المعاصرة.",
    "colorTheme": "from-blue-550 to-indigo-455",
    "icon": "Compass",
    "grades": [
      {
        "id": "int-1",
        "name": "الصف السابع (أولى متوسط)",
        "subjects": [
          {
            "id": "int1-math",
            "name": "الرياضيات الجبرية",
            "iconName": "Calculator",
            "colorClass": "bg-indigo-100 text-indigo-805 border-indigo-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/expression-exchange/latest/expression-exchange_all.html",
            "interactiveLabel": "محاكاة التعابير الجبرية PhET",
            "curriculumSummary": "المجموعات الحسابية، الأعداد الصحيحة والعمليات عليها، الجبر وتكوين المقادير والحلول الرياضية لها."
          },
          {
            "id": "int1-science",
            "name": "العلوم والفيزياء التأسيسية",
            "iconName": "Flame",
            "colorClass": "bg-orange-100 text-orange-850 border-orange-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_all.html",
            "interactiveLabel": "محاكاة أشكال الطاقة وتحولاتها PhET",
            "curriculumSummary": "الذرة ومكوناتها، العناصر والمركبات الكيميائية، تحولات الطاقة وأشكال الحرارة الأساسية."
          },
          {
            "id": "int1-geography",
            "name": "الجغرافيا والمناخ والطقس",
            "iconName": "Globe",
            "colorClass": "bg-violet-100 text-violet-850 border-violet-200",
            "interactiveUrl": "https://earth.google.com/web/@0,0,0a,22251785d,35y,0h,0t,0r",
            "interactiveLabel": "خرائط مناخ كوكب الأرض التفاعلية",
            "curriculumSummary": "الأرض في الفضاء الخارجي، خطوط الطول ودوائر العرض، العوامل المؤثرة في مناخ قارة أفريقيا والوطن العربي."
          }
        ]
      },
      {
        "id": "int-2",
        "name": "الصف الثامن (ثاني متوسط)",
        "subjects": [
          {
            "id": "int2-math",
            "name": "الرياضيات والهندسة الرياضية",
            "iconName": "Compass",
            "colorClass": "bg-pink-100 text-pink-850 border-pink-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/pythagorean-theorem/latest/pythagorean-theorem_all.html",
            "interactiveLabel": "نظرية فيثاغورس التفاعلية PhET",
            "curriculumSummary": "الأعداد النسبية، نظرية فيثاغورس، مساحات الأشكال رباعية الأضلاع، وعلم الإحصاء والاحتمالات الأولية للبيانات."
          },
          {
            "id": "int2-science",
            "name": "العلوم الحيوية والكيمياء",
            "iconName": "Activity",
            "colorClass": "bg-emerald-100 text-emerald-850 border-emerald-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/reactants-products-and-leftovers/latest/reactants-products-and-leftovers_all.html",
            "interactiveLabel": "محاكاة التفاعلات الكيميائية والمردود",
            "curriculumSummary": "الجهاز الهضمي والـدوري عند الإنسان، التوازن البيئي العضوي، والتفاعلات والمعادلات الكيميائية البسيطة وطاقتها."
          },
          {
            "id": "int2-history",
            "name": "التاريخ الإسلامي وتاريخ السودان وسنار",
            "iconName": "History",
            "colorClass": "bg-amber-100 text-amber-850 border-amber-200",
            "interactiveUrl": "https://www.google.com/maps",
            "interactiveLabel": "تتبع مواقع الأحداث التاريخية إلكترونياً",
            "curriculumSummary": "التاريخ الإسلامي (الدولة الأموية والعباسية)، قيام سلطنة كوش وسلطنة سنار (الفونج) ونهضتها العريقة في السودان وتأثيرها الحضاري."
          }
        ]
      },
      {
        "id": "int-3",
        "name": "الصف التاسع (ثالث متوسط)",
        "subjects": [
          {
            "id": "int3-math",
            "name": "الرياضيات والمعادلات التفاضلية المبسطة",
            "iconName": "Calculator",
            "colorClass": "bg-blue-100 text-blue-900 border-blue-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/graphing-quadratics/latest/graphing-quadratics_all.html",
            "interactiveLabel": "مخططات المعادلات التربيعية التفاعلية",
            "curriculumSummary": "المعادلات الآنية والتربيعية، التحليل الجبري، حساب المثلثات والزوايا الأساسية، واستخدام الإحصاء في التحليل."
          },
          {
            "id": "int3-science",
            "name": "العلوم الفيزيائية والكهربائية",
            "iconName": "Zap",
            "colorClass": "bg-yellow-100 text-yellow-850 border-yellow-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc-virtual-lab/latest/circuit-construction-kit-dc-virtual-lab_all.html",
            "interactiveLabel": "معمل بناء الدوائر الكهربائية التفاعلي",
            "curriculumSummary": "الكهرباء الساكنة والتيارية، الدوائر الكهربائية والتوالي والتوازي، قانون أوم، وبنية الكائنات والمجهر والعدسات البصرية."
          },
          {
            "id": "int3-computer",
            "name": "تقنية المعلومات وحاسوب المستقبل",
            "iconName": "Cpu",
            "colorClass": "bg-slate-100 text-slate-800 border-slate-200",
            "interactiveUrl": "https://scratch.mit.edu",
            "interactiveLabel": "منصة سكراتش لتطوير المنطق والبرمجة",
            "curriculumSummary": "مفهوم الحواسيب والشبكات، الأجزاء والبرمجيات، مقدمة في الخوارزميات وصياغة التفكير المنطقي والبرمجي لحل المسائل الدراسية."
          }
        ]
      }
    ]
  },
  {
    "id": "secondary",
    "name": "المرحلة الثانوية",
    "description": "إعداد متميز لخوض اختبار الشهادة السودانية مع تخصص علمي وأدبي يعزز قدرات الطلاب للاستعداد للتعليم الجامعي المرموق.",
    "colorTheme": "from-purple-550 to-indigo-550",
    "icon": "Award",
    "grades": [
      {
        "id": "sec-1",
        "name": "الصف العاشر (الأول ثانوي)",
        "subjects": [
          {
            "id": "sec1-physics",
            "name": "الفيزياء الميكانيكية والسرعة",
            "iconName": "Disc",
            "colorClass": "bg-rose-100 text-rose-900 border-rose-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html",
            "interactiveLabel": "معمل القوى والحركة التفاعلي PhET",
            "curriculumSummary": "الكميات الفيزيائية المتجهة والقياسية، علم الحركة وقوانين نيوتن في الحركة الخطية، وحساب عزم القوة والاستقرار."
          },
          {
            "id": "sec1-chemistry",
            "name": "الكيمياء العضوية والذرية",
            "iconName": "Flame",
            "colorClass": "bg-sky-100 text-sky-900 border-sky-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html",
            "interactiveLabel": "معمل بناء الذرات والعناصر PhET",
            "curriculumSummary": "النظرية الذرية الحديثة، الجدول الدوري ومجموعاته وتدرج الخواص، والروابط العضوية وغير العضوية وتفاعلاتها الأساسية."
          },
          {
            "id": "sec1-math",
            "name": "الرياضيات البحتة والجبر",
            "iconName": "Calculator",
            "colorClass": "bg-indigo-100 text-indigo-900 border-indigo-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/trig-tour/latest/trig-tour_all.html",
            "interactiveLabel": "معجم المثلثات التفاعلي والظل والجا",
            "curriculumSummary": "المنطق الرياضي، المصفوفات والمحددات، العلاقات والدوال، والنسب المثلثية والتفاضل والتكامل الأساسي للمستويات."
          }
        ]
      },
      {
        "id": "sec-2",
        "name": "الصف الحادي عشر (الثاني ثانوي)",
        "subjects": [
          {
            "id": "sec2-physics",
            "name": "الفيزياء الموجية والبصرية والأمواج",
            "iconName": "Zap",
            "colorClass": "bg-yellow-105 text-yellow-900 border-yellow-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html",
            "interactiveLabel": "محاكاة انكسار وانعطاف الضوء PhET",
            "curriculumSummary": "الحركة الاهتزازية والموجية، الصوت وخصائصه وقانون دوبلر، الضوء والهندسة البصرية كالمرايا الكروية والعدسات."
          },
          {
            "id": "sec2-chemistry",
            "name": "الكيمياء الحرارية والسرعة التفاعلية",
            "iconName": "Droplet",
            "colorClass": "bg-blue-100 text-blue-900 border-blue-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/concentration/latest/concentration_all.html",
            "interactiveLabel": "محاكاة تركيز المحاليل وتأثير الحرارة",
            "curriculumSummary": "حسابات المحاليل المائية، الكيمياء الحرارية والتغير في المحتوى الحراري، سرعة التفاعل والاتزان الكهربائي والكيميائي."
          },
          {
            "id": "sec2-biology",
            "name": "الأحياء والخلية النباتية والحيوانية",
            "iconName": "Leaf",
            "colorClass": "bg-emerald-110 text-emerald-950 border-emerald-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials_all.html",
            "interactiveLabel": "محاكاة التعبير الجيني والحمض النووي DNA",
            "curriculumSummary": "علم الخلية ووظائفها والانسجة النباتية والحيوانية، التغذية العضوية والنقل والاصطناع الضوئي للنباتات المتنوعة."
          }
        ]
      },
      {
        "id": "sec-3",
        "name": "الصف الثاني عشر (الثالث ثانوي)",
        "subjects": [
          {
            "id": "sec3-physics",
            "name": "الشهادة الثانوية: فيزياء الإلكترونيات والنووية",
            "iconName": "Disc",
            "colorClass": "bg-violet-100 text-violet-900 border-violet-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/rutherford-scattering/latest/rutherford-scattering_all.html",
            "interactiveLabel": "محاكاة تشتت رذرفورد لفيزياء الذرة",
            "curriculumSummary": "فيزياء الحالة الصلبة، أشباه الموصلات والترانزستور والدوائر الإلكترونية، والفيزياء النووية والإشعاع الطبيعي والاندماج النووي."
          },
          {
            "id": "sec3-chemistry",
            "name": "الشهادة الثانوية: الكيمياء الكهربائية والعضوية المتقدمة",
            "iconName": "Activity",
            "colorClass": "bg-cyan-105 text-cyan-900 border-cyan-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/molarity/latest/molarity_all.html",
            "interactiveLabel": "محاكاة الموولارية وحساب التفاعلات",
            "curriculumSummary": "الكيمياء العضوية الشاملة وتسمية المركبات، الأغوال والألدهيدات والأحماض الكربوكسيلية، الخلايا الكلفانية والتحليل الكهربائي والطلاء المعدني."
          },
          {
            "id": "sec3-math",
            "name": "الشهادة الثانوية: التفاضل والتكامل والإحصاء المتقدم",
            "iconName": "Percent",
            "colorClass": "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
            "interactiveUrl": "https://phet.colorado.edu/sims/html/plinko-probability/latest/plinko-probability_all.html",
            "interactiveLabel": "محاكاة نظرية الاحتمالات الرياضية",
            "curriculumSummary": "النهايات والاتصال، قواعد الاشتقاق والتفاضل، وتطبيقات التفاضل (المماس والقيم القصوى)، والتكامل والتوزيعات الاحتمالية الكبيرة."
          }
        ]
      }
    ]
  }
];
