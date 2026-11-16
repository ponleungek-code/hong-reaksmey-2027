import { GalleryPhoto, GuestBlessing } from '../types';

export const INITIAL_GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'photo-cover',
    titleKm: 'គូស្នេហ៍និស្ស័យ ហុង & រស្មី',
    titleEn: 'Mao Hong & Ngek ReakSmey',
    subtitleKm: 'រូបថតគម្របអាពាហ៍ពិពាហ៍ដ៏ប្រណិត និងសេចក្តីស្រឡាញ់អមតៈ',
    subtitleEn: 'Official wedding portrait filled with eternal grace and joy',
    category: 'traditional',
    locationKm: 'ខេត្តសៀមរាប, កម្ពុជា',
    locationEn: 'Siem Reap, Cambodia',
    imageUrl: '/assets/aistudio/cover.jpg',
    likes: 885,
    isLiked: true,
    aspect: 'portrait',
    badge: 'Cover Portrait'
  },
  {
    id: 'photo-1',
    titleKm: 'កិច្ចសន្យាស្នេហ៍ ហុង & រស្មី',
    titleEn: 'Forever Yours • Hong & ReakSmey',
    subtitleKm: 'ស្នាមញញឹមដ៏កក់ក្តៅ និងសេចក្តីស្រឡាញ់ដ៏ស្មោះស្ម័គ្រ',
    subtitleEn: 'Cherished pre-wedding moments filled with love and warmth',
    category: 'traditional',
    locationKm: 'ខេត្តសៀមរាប, កម្ពុជា',
    locationEn: 'Siem Reap, Cambodia',
    imageUrl: '/assets/aistudio/couple.jpg',
    likes: 528,
    isLiked: false,
    aspect: 'portrait',
    badge: 'Pre-Wedding'
  },
  {
    id: 'photo-2',
    titleKm: 'កូនក្រមុំដ៏ស្រស់សោភា',
    titleEn: 'The Radiant Bride',
    subtitleKm: 'សម្រស់កូនក្រមុំ រស្មី ក្នុងរ៉ូបអាពាហ៍ពិពាហ៍ពណ៌សបរិសុទ្ធ',
    subtitleEn: 'ReakSmey shining with grace in her white bridal gown',
    category: 'botanical',
    locationKm: 'សួនអនុស្សាវរីយ៍',
    locationEn: 'Botanical Garden',
    imageUrl: '/assets/aistudio/girl.jpg',
    likes: 462,
    isLiked: false,
    aspect: 'portrait',
    badge: 'Bride'
  },
  {
    id: 'photo-3',
    titleKm: 'ចិញ្ចៀនភ្ជាប់ពាក្យ និងក្តីសន្យា',
    titleEn: 'Eternal Promise & Rings',
    subtitleKm: 'ចិញ្ចៀនពេជ្រ និងដៃកាន់ដៃពោរពេញដោយសេចក្តីស្រឡាញ់',
    subtitleEn: 'Close-up of golden wedding bands and intertwined hands',
    category: 'rings',
    locationKm: 'ថ្ងៃភ្ជាប់ពាក្យ',
    locationEn: 'Engagement Ceremony',
    imageUrl: '/assets/aistudio/hand-and-ring.jpg',
    likes: 618,
    isLiked: true,
    aspect: 'portrait',
    badge: 'Gold Rings'
  },
  {
    id: 'photo-4',
    titleKm: 'ការថើបដ៏ផ្អែមល្ហែម',
    titleEn: 'A Sweet Kiss of Devotion',
    subtitleKm: 'ពេលវេលាដ៏មានអត្ថន័យ និងការចងចាំមិនអាចបំភ្លេចបាន',
    subtitleEn: 'A romantic embrace celebrating pure commitment and joy',
    category: 'traditional',
    locationKm: 'ស្ទូឌីយោរូបថត',
    locationEn: 'Siem Reap Portrait Studio',
    imageUrl: '/assets/aistudio/wide kiss.jpg',
    likes: 742,
    isLiked: false,
    aspect: 'portrait',
    badge: 'Romance'
  },
  {
    id: 'photo-5',
    titleKm: 'ស្នេហាដ៏រ៉ូមែនទិក',
    titleEn: 'Tender Embrace',
    subtitleKm: 'ក្តីស្រឡាញ់ដែលរំលេចតាមរយៈក្រសែភ្នែក និងបេះដូង',
    subtitleEn: 'An intimate portrait expressing timeless devotion',
    category: 'botanical',
    locationKm: 'ឆ្នេរសមុទ្រកែប',
    locationEn: 'Kep Seaside',
    imageUrl: '/assets/aistudio/kiss.jpg',
    likes: 389,
    isLiked: false,
    aspect: 'landscape',
    badge: 'Sweet Kiss'
  },
  {
    id: 'photo-6',
    titleKm: 'ចិញ្ចៀនអាពាហ៍ពិពាហ៍',
    titleEn: 'The Wedding Rings',
    subtitleKm: 'និមិត្តរូបនៃភាពស្មោះត្រង់ និងចំណងអាពាហ៍ពិពាហ៍អមតៈ',
    subtitleEn: 'Sacred rings symbolizing eternity and mutual devotion',
    category: 'rings',
    locationKm: 'ពិធីមង្គល',
    locationEn: 'Sacred Celebration',
    imageUrl: '/assets/aistudio/ring.jpg',
    likes: 495,
    isLiked: false,
    aspect: 'landscape',
    badge: 'Eternal Rings'
  }
];

export const INITIAL_BLESSINGS: GuestBlessing[] = [];

export const WEDDING_SCHEDULE = [
  {
    timeKm: '០៧:០០ ព្រឹក',
    timeEn: '07:00 AM',
    titleKm: 'ពិធីហែកំណត់ (Fruit & Gift Procession)',
    titleEn: 'Groom Procession & Fruit Offerings',
    descKm: 'ក្បួនកូនកំលោះហែជំនូនផ្លែឈើ និងគ្រឿងអលង្ការមកកាន់គេហដ្ឋានកូនក្រមុំ',
    descEn: 'The festive procession carrying decorated fruit trays, traditional pastries, and gifts to the bride’s home.',
    icon: 'local_florist'
  },
  {
    timeKm: '០៨:៣០ ព្រឹក',
    timeEn: '08:30 AM',
    titleKm: 'ពិធីសែនដូនតា & សូត្រមន្តចម្រើនព្រះបរិត្ត',
    titleEn: 'Ancestral Honor & Monk Blessings',
    descKm: 'គោរពដូនតា និងព្រះសង្ឃចម្រើនព្រះបរិត្តប្រសិទ្ធិពរជ័យសិរីសួស្តី',
    descEn: 'Honoring ancestors and receiving sacred Pali chants from respected Buddhist monks for lifelong peace.',
    icon: 'self_improvement'
  },
  {
    timeKm: '១០:០០ ព្រឹក',
    timeEn: '10:00 AM',
    titleKm: 'ពិធីកាត់សក់បង្កក់សិរី (Gaat Sahk Cleansing)',
    titleEn: 'Ceremonial Hair Cutting & Cleansing',
    descKm: 'ពិធីកាត់សក់កាត់កម្ចាត់ឧបទ្រព្យចង្រៃ និងប្រសិទ្ធិពរជ័យពីមាតាបិតា',
    descEn: 'Symbolic cleansing ritual where parents and elders symbolically cut hair to welcome prosperity.',
    icon: 'content_cut'
  },
  {
    timeKm: '១១:៣០ ព្រឹក',
    timeEn: '11:30 AM',
    titleKm: 'ពិធីសំពះផ្ទឹម និងចងដៃ (Sompeas Ptem)',
    titleEn: 'Sacred Knot Tying & Sword Blessing',
    descKm: 'ពិធីបង្វិលពពិល ចងខ្សែអំបោះក្រហម និងកាន់ដាវជ័យផ្សំផ្គុំជាគូជីវិត',
    descEn: 'The core vow ceremony with candlelight rotation, holding the ancient gold sword, and sacred cotton wrist ties.',
    icon: 'favorite'
  },
  {
    timeKm: '០៥:៣០ ល្ងាច',
    timeEn: '05:30 PM',
    titleKm: 'ទទួលភ្ញៀវកិត្តិយស & ថតរូបអនុស្សាវរីយ៍',
    titleEn: 'Welcome Cocktail & Photo Booth',
    descKm: 'ស្វាគមន៍ភ្ញៀវកិត្តិយស និងកត់ត្រាពាក្យជូនពរនៅមុខសាលមហោស្រព',
    descEn: 'Greeting esteemed guests at the Grand Lotus Palace foyer with welcome beverages and memory wall.',
    icon: 'photo_camera'
  },
  {
    timeKm: '០៦:៣០ ល្ងាច',
    timeEn: '06:30 PM',
    titleKm: 'ពិធីពិសាភោជនាហារពេលល្ងាច & កាត់នំមង្គល',
    titleEn: 'Grand Banquet Dinner & Celebration',
    descKm: 'ពិសារអាហារ ៧មុខ កាត់នំខួបស្នេហា លើកកែវជូនពរ និងរាំកម្សាន្ត',
    descEn: 'A lavish 7-course Khmer gourmet dinner, cake cutting, toasts, acoustic melodies, and joyous celebration.',
    icon: 'dinner_dining'
  }
];

export const LOVE_STORY_CHAPTERS = [
  {
    year: '2024',
    titleKm: 'និស្ស័យនៅសាកលវិទ្យាល័យ',
    titleEn: 'Destiny at the Royal University',
    descKm: 'យើងបានជួបគ្នានៅបណ្ណាល័យសាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ។ សៀវភៅមួយក្បាលដែលយើងទាំងពីរចង់ខ្ចីក្នុងពេលតែមួយ បានក្លាយជាការចាប់ផ្តើមនៃការសន្ទនាមិនចេះចប់។',
    descEn: 'We met in the quiet hall of the Royal University library. Reaching for the same architecture monograph started a conversation that has never stopped.',
    image: '/assets/aistudio/couple.jpg'
  },
  {
    year: '2025',
    titleKm: 'ស្នាមញញឹមនៃក្តីស្រឡាញ់',
    titleEn: 'The Smile That Won My Heart',
    descKm: 'ភាពទន់ភ្លន់ និងស្នាមញញឹមដ៏បរិសុទ្ធរបស់ រស្មី គឺជាពន្លឺបំភ្លឺគ្រប់ពេលវេលារបស់ ហុង។',
    descEn: 'ReakSmey’s warmth and gentle spirit brought endless light into Hong’s life each passing day.',
    image: '/assets/aistudio/girl.jpg'
  },
  {
    year: '2026',
    titleKm: 'ការសន្យា និងចិញ្ចៀនភ្ជាប់ពាក្យ',
    titleEn: 'Sacred Promise & Engagement Ring',
    descKm: 'ហុង បានលុតជង្គង់សុំ រស្មី រៀបការ ជាមួយចិញ្ចៀនដែលបង្កប់នូវក្តីស្រឡាញ់ និងការតាំងចិត្តពេញមួយជីវិត។',
    descEn: 'Hong knelt with the ring, sealing a pledge of everlasting commitment and lifelong friendship.',
    image: '/assets/aistudio/hand-and-ring.jpg'
  },
  {
    year: '2027',
    titleKm: 'ថ្ងៃសិរីមង្គល អាពាហ៍ពិពាហ៍',
    titleEn: 'A Sacred New Chapter Begins',
    descKm: 'ថ្ងៃទី ១៧ ខែមីនា ឆ្នាំ២០២៧ គឺជាថ្ងៃដែលយើងខ្ញុំទាំងពីរ (ម៉ៅ ហុង & ង៉ិក រស្មី) ទទួលបានពរជ័យពីមាតាបិតា ញាតិមិត្ត និងចាស់ទុំ ដើម្បីចាប់ផ្តើមគ្រួសារថ្មីដ៏កក់ក្តៅ។',
    descEn: 'March 17, 2027. Together with our cherished families and dearest friends, Mao Hong & Ngek ReakSmey officially unite their hearts under ancestral blessings.',
    image: '/assets/aistudio/cover.jpg'
  }
];
