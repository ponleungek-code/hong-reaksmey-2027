import React, { useState, useEffect, useMemo } from 'react';
import { Language, Screen, GuestBlessing, GalleryPhoto, RSVPRecord } from '../types';
import { TopLeftFloral, TopRightFloral, BottomLeftFloral, BottomRightFloral, FloralLineDivider, SmallCornerFlowerLeft, SmallCornerFlowerRight } from '../components/FloralMotifs';
import { INITIAL_GALLERY_PHOTOS, WEDDING_SCHEDULE, LOVE_STORY_CHAPTERS } from '../data/mockData';
import { compressImage, downloadPhoto } from '../utils/imageHelper';
import { GuestPhotoModal } from '../components/GuestPhotoModal';
import { GoogleSheetRsvpModal } from '../components/GoogleSheetRsvpModal';
import { fetchSheetBlessings, postSheetBlessing, postSheetRSVP, fetchSheetRSVPs } from '../utils/sheetdb';
import { triggerWeddingConfetti } from '../utils/confetti';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { AddBlessing } from '../components/AddBlessing';
import coverHeroPhoto from '../assets/images/regenerated_image_1793879920913.jpg';

interface HomeScreenProps {
  lang: Language;
  onSaveToCalendar: () => void;
  onOpenMonogramModal?: () => void;
  photos: GalleryPhoto[];
  onTogglePhotoLike: (photoId: string) => void;
  onUploadPhoto: (newPhoto: Partial<GalleryPhoto>) => void;
  onDeletePhoto?: (photoId: string) => Promise<void>;
  currentUserEmail?: string | null;
  isAdmin?: boolean;
  onAdminSignIn?: () => Promise<void>;
  onAdminSignOut?: () => Promise<void>;
  blessings: GuestBlessing[];
  onAddBlessing: (text: string, name?: string, photoUrl?: string) => void;
  onToggleBlessingLike: (id: string) => void;
  rsvpList: RSVPRecord[];
  onAddRSVP: (record: RSVPRecord) => void;
  onPlayMusic?: () => void;
  isMobilePreview?: boolean;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  lang,
  onSaveToCalendar,
  onOpenMonogramModal,
  photos,
  onTogglePhotoLike,
  onUploadPhoto,
  onDeletePhoto,
  currentUserEmail = null,
  isAdmin = false,
  onAdminSignIn,
  onAdminSignOut,
  blessings,
  onAddBlessing,
  onToggleBlessingLike,
  rsvpList,
  onAddRSVP,
  onPlayMusic,
  isMobilePreview = false,
  isDark = false,
  onToggleTheme,
}) => {
  // Live Countdown to March 17, 2027, 07:00:00 (Cambodia Time / UTC+7)
  const targetDate = useMemo(() => new Date('2027-03-17T07:00:00').getTime(), []);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Smooth scroll to section helper
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Back-to-top floating button visibility
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Copy bank account feedback
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(id);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  // SheetDB Live Blessings State
  const [sheetBlessings, setSheetBlessings] = useState<GuestBlessing[]>([]);
  const [isSyncingBlessings, setIsSyncingBlessings] = useState(false);
  const [viewingPhotoBlessing, setViewingPhotoBlessing] = useState<GuestBlessing | null>(null);

  const loadBlessings = async () => {
    try {
      setIsSyncingBlessings(true);
      const items = await fetchSheetBlessings();
      if (items && items.length > 0) {
        setSheetBlessings(items);
      }
    } catch (err) {
      console.warn('SheetDB blessings sync notice:', err);
    } finally {
      setIsSyncingBlessings(false);
    }
  };

  useEffect(() => {
    loadBlessings();
  }, []);

  // Merge and deduplicate blessings
  const combinedBlessings = useMemo(() => {
    const list: GuestBlessing[] = [];
    const seen = new Set<string>();

    for (const item of sheetBlessings) {
      const key = `${(item.name || '').trim().toLowerCase()}|||${(item.message || '').trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }

    for (const item of blessings) {
      const key = `${(item.name || '').trim().toLowerCase()}|||${(item.message || '').trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }

    return list;
  }, [sheetBlessings, blessings]);

  // Wish Input Form Handler
  const handleSendWish = async (message: string, name?: string, photoUrl?: string) => {
    const finalName = name?.trim() || (lang === 'km' ? 'ភ្ញៀវកិត្តិយស' : 'Honored Guest');
    const finalWish = message.trim();
    const finalPhoto = photoUrl?.trim() || undefined;

    postSheetBlessing(finalName, finalWish, 'Yes', finalPhoto).then((ok) => {
      if (ok) {
        setTimeout(loadBlessings, 1200);
      }
    });

    onAddBlessing(finalWish, finalName, finalPhoto);
  };

  // Google Sheet RSVPs & Attendees Counter
  const [sheetRSVPs, setSheetRSVPs] = useState<RSVPRecord[]>([]);
  const [isSheetRsvpModalOpen, setIsSheetRsvpModalOpen] = useState(false);

  const loadRSVPs = async () => {
    try {
      const records = await fetchSheetRSVPs();
      if (records) {
        setSheetRSVPs(records);
      }
    } catch (err) {
      console.warn('Failed to fetch RSVPs:', err);
    }
  };

  useEffect(() => {
    loadRSVPs();
  }, []);

  const confirmedAttendeeCount = useMemo(() => {
    if (sheetRSVPs.length > 0) {
      return sheetRSVPs
        .filter((r) => r.attending === 'yes')
        .reduce((sum, r) => sum + (r.guestCount || 1), 0);
    }
    return rsvpList
      .filter((r) => r.attending === 'yes')
      .reduce((sum, r) => sum + (r.guestCount || 1), 0);
  }, [sheetRSVPs, rsvpList]);

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpGuestCount, setRsvpGuestCount] = useState(1);
  const [rsvpAttending, setRsvpAttending] = useState<'yes' | 'no'>('yes');
  const [rsvpDiet, setRsvpDiet] = useState<'none' | 'vegetarian' | 'halal'>('none');
  const [rsvpBlessing, setRsvpBlessing] = useState('');
  const [rsvpPhotoUrl, setRsvpPhotoUrl] = useState('');
  const [isUploadingRsvpPhoto, setIsUploadingRsvpPhoto] = useState(false);
  const [rsvpSubmittedSuccess, setRsvpSubmittedSuccess] = useState(false);

  const handleRsvpPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingRsvpPhoto(true);
      const compressed = await compressImage(file, 900, 900, 0.78);
      setRsvpPhotoUrl(compressed);
    } catch (err) {
      console.error('Error compressing RSVP photo:', err);
    } finally {
      setIsUploadingRsvpPhoto(false);
    }
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;

    const newRecord: RSVPRecord = {
      id: `rsvp-${Date.now()}`,
      name: rsvpName.trim(),
      phone: rsvpPhone.trim() || '012 345 678',
      guestCount: rsvpGuestCount,
      attending: rsvpAttending,
      diet: rsvpDiet,
      blessing: rsvpBlessing.trim(),
      photoUrl: rsvpPhotoUrl.trim() || undefined,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onAddRSVP(newRecord);
    triggerWeddingConfetti();
    setRsvpSubmittedSuccess(true);
    setTimeout(loadRSVPs, 1500);

    setRsvpName('');
    setRsvpPhone('');
    setRsvpBlessing('');
    setRsvpPhotoUrl('');
    setTimeout(() => setRsvpSubmittedSuccess(false), 5000);
  };

  // Gallery Filter & Lightbox State
  const [galleryCategory, setGalleryCategory] = useState<'all' | 'traditional' | 'botanical' | 'rings' | 'guest'>('all');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpen] = useState(false);
  const [guestUploaderName, setGuestUploaderName] = useState('');
  const [guestPhotoTitle, setGuestPhotoTitle] = useState('');
  const [guestImageFilePreview, setGuestImageFilePreview] = useState<string | null>(null);
  const [isUploadingGalleryPhoto, setIsUploadingGalleryPhoto] = useState(false);

  const [guestUploadSuccess, setGuestUploadSuccess] = useState(false);

  // Admin Photo Deletion State (inside #gallery-section)
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [photoPendingDelete, setPhotoPendingDelete] = useState<GalleryPhoto | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState(false);

  const handleAdminAuthClick = async () => {
    if (!onAdminSignIn) return;
    setAdminActionError(null);
    setIsAdminAuthLoading(true);
    try {
      await onAdminSignIn();
    } catch (err) {
      setAdminActionError(
        lang === 'km'
          ? 'ការចូលគណនី Google ត្រូវបានបោះបង់ ឬមានបញ្ហា។'
          : 'Google sign-in was cancelled or failed.'
      );
    } finally {
      setIsAdminAuthLoading(false);
    }
  };

  const handleAdminLogoutClick = async () => {
    if (!onAdminSignOut) return;
    setAdminActionError(null);
    setIsAdminAuthLoading(true);
    try {
      await onAdminSignOut();
      setPhotoPendingDelete(null);
    } catch {
      setAdminActionError(
        lang === 'km' ? 'មិនអាចចាកចេញពីគណនីបានទេ។' : 'Could not sign out.'
      );
    } finally {
      setIsAdminAuthLoading(false);
    }
  };

  const handleConfirmDeletePhoto = async () => {
    if (!photoPendingDelete || !onDeletePhoto) return;
    setAdminActionError(null);
    setIsDeletingPhoto(true);
    try {
      const targetId = photoPendingDelete.id;
      await onDeletePhoto(targetId);
      if (lightboxPhoto?.id === targetId) {
        setLightboxPhoto(null);
      }
      setPhotoPendingDelete(null);
      setDeleteSuccessToast(true);
      setTimeout(() => setDeleteSuccessToast(false), 3500);
    } catch (err) {
      setAdminActionError(
        lang === 'km'
          ? 'មិនអាចលុបរូបភាពបានទេ! សូមប្រាកដថាអ្នកបានចូលជា Admin ត្រឹមត្រូវ។'
          : 'Failed to delete photo. Please ensure you are signed in as the authorized Admin.'
      );
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const guestPhotosCount = useMemo(() => {
    return photos.filter((p) => p.category === 'guest').length;
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    if (galleryCategory === 'all') return photos;
    return photos.filter((p) => p.category === galleryCategory);
  }, [photos, galleryCategory]);

  const handleGuestGalleryPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingGalleryPhoto(true);
      const compressed = await compressImage(file, 1400, 1400, 0.82);
      setGuestImageFilePreview(compressed);
    } catch (err) {
      console.error('Error compressing guest gallery photo:', err);
    } finally {
      setIsUploadingGalleryPhoto(false);
    }
  };

  const handleGuestGallerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestImageFilePreview) return;
    const author = guestUploaderName.trim() || (lang === 'km' ? 'ភ្ញៀវកិត្តិយស' : 'Honored Guest');
    const title = guestPhotoTitle.trim() || (lang === 'km' ? `រូបថតពី ${author}` : `Photo by ${author}`);

    onUploadPhoto({
      titleKm: title,
      titleEn: title,
      subtitleKm: `បានចែករំលែកដោយ ${author}`,
      subtitleEn: `Shared by ${author}`,
      category: 'guest',
      locationKm: 'គេហដ្ឋានខាងកូនក្រមុំ (ភូមិពាក់ស្នែងថ្មី)',
      locationEn: 'Bride Residence (Peaksneng Tmey)',
      imageUrl: guestImageFilePreview,
      uploadedBy: author,
      badge: 'Guest Upload'
    });

    setGuestUploaderName('');
    setGuestPhotoTitle('');
    setGuestImageFilePreview(null);
    setGuestUploadSuccess(true);
    triggerWeddingConfetti();
    setGalleryCategory('guest');
    setTimeout(() => {
      setGuestUploadSuccess(false);
      setIsUploadPhotoModalOpen(false);
    }, 1200);
  };

  // Traditional Ceremonial Rituals Definition
  const rituals = [
    {
      step: '01',
      time: '07:00 AM',
      nameKm: 'ពិធីហែកំណត់ (Hai Goan Gomlaw)',
      nameEn: 'Groom Procession & Fruit Offerings',
      descKm: 'ក្បួនកូនកំលោះ និងញាតិមិត្តហែផ្លែឈើ នំចំណីបុរាណ ជំនូនមាសប្រាក់មកកាន់គេហដ្ឋានកូនក្រមុំ។ ផ្លែឈើជាគូៗតំណាងឱ្យភាពសម្បូរសប្បាយ និងការគោរពដល់គ្រួសារខាងស្រី។',
      descEn: 'The groom, families, and friends parade holding pairs of decorated fruits, traditional cakes, and offerings symbolizing abundance and deep respect.',
      icon: 'local_florist',
      badge: 'Morning Tradition'
    },
    {
      step: '02',
      time: '08:30 AM',
      nameKm: 'ពិធីសែនដូនតា & សូត្រមន្ត',
      nameEn: 'Ancestral Homage & Monk Chants',
      descKm: 'អុជធូបសែនដូនតាដើម្បីសុំការអនុញ្ញាត និងប្រសិទ្ធិពរ។ បន្ទាប់មក ព្រះសង្ឃចម្រើនព្រះបរិត្ត ប្រោះព្រំទឹកមន្តសិរីសួស្តីដល់គូស្វាមីភរិយាថ្មី។',
      descEn: 'Lighting incense to honor departed ancestors, followed by venerable Buddhist monks chanting Pali stanzas and sprinkling blessed lustral water.',
      icon: 'self_improvement',
      badge: 'Spiritual Blessing'
    },
    {
      step: '03',
      time: '10:00 AM',
      nameKm: 'ពិធីកាត់សក់បង្កក់សិរី (Gaat Sahk)',
      nameEn: 'Ceremonial Hair Cutting & Cleansing',
      descKm: 'ពិធីកាត់សក់ជានិមិត្តរូបដើម្បីកម្ចាត់ភាពសៅហ្មងពីអតីតកាល។ មាតាបិតា និងចាស់ទុំប្រោះទឹកអប់ កាត់សក់ជានិមិត្តរូប និងជូនពរឱ្យមានសុខភាពល្អ និងសុភមង្គល។',
      descEn: 'A symbolic cleansing ritual where parents and honored elders lightly snip locks of hair and spray fragrant perfume to purify the couple for a harmonious future.',
      icon: 'content_cut',
      badge: 'Purification'
    },
    {
      step: '04',
      time: '11:00 AM',
      nameKm: 'ពិធីបង្វិលពពិល (Bangvel Popil)',
      nameEn: 'Passing of the Sacred Candles',
      descKm: 'គូស្វាមីភរិយាអង្គុយទន្ទឹមគ្នា។ គូស្វាមីភរិយាចាស់ទុំដែលរៀបការហើយបង្វិលទៀនពពិលចំនួន ៣ ជុំវិញគូថ្មីចំនួន ៧ ឬ ៩ ជុំ បង្កើតជាបរិយាកាសពិសិដ្ឋ។',
      descEn: 'Happily married elder couples circulate 3 sacred beeswax candles 7 to 9 times clockwise around the couple, imparting harmony and long-lasting devotion.',
      icon: 'flare',
      badge: 'Sacred Ritual'
    },
    {
      step: '05',
      time: '11:30 AM',
      nameKm: 'ពិធីចងដៃសំពះផ្ទឹម (Sompeas Ptem)',
      nameEn: 'Sacred Knot Tying & Sword Blessing',
      descKm: 'ពិធីដ៏ពិសិដ្ឋបំផុត! កូនកំលោះ និងកូនក្រមុំកាន់ដាវជ័យមាស។ មាតាបិតា និងភ្ញៀវកិត្តិយសទាំងអស់ឡើងចងខ្សែអំបោះក្រហមលើកដៃ និងប្រសិទ្ធិពរជ័យ។',
      descEn: 'The defining ceremony: the couple holds the sacred ancient gold sword while loved ones tie blessing red and white cotton threads onto their wrists.',
      icon: 'favorite',
      badge: 'Core Vows'
    },
    {
      step: '06',
      time: '12:00 PM',
      nameKm: 'ពិធីព្រួសផ្កាស្លា (Prouh Pka Sla)',
      nameEn: 'Shower of Fragrant Areca Blossoms',
      descKm: 'ភ្ញៀវកិត្តិយសព្រួសផ្កាស្លាពណ៌សក្រអូបលើគូស្វាមីភរិយា តំណាងឱ្យភាពបរិសុទ្ធ ភាពមានកូនពូនជាចៅ និងសេចក្តីសុខក្សេមក្សាន្ត។',
      descEn: 'Guests shower the smiling couple with fragrant white areca palm blossoms, representing fertile new beginnings, peace, and eternal joy.',
      icon: 'spa',
      badge: 'Celebration'
    },
    {
      step: '07',
      time: '06:30 PM',
      nameKm: 'ពិធីពិសាភោជនាហារពេលល្ងាច (Grand Banquet)',
      nameEn: 'Grand Banquet Dinner & Celebration',
      descKm: 'ពិធីជប់លៀងដ៏ធំអធិកអធមនៅគេហដ្ឋានខាងកូនក្រមុំ (ភូមិពាក់ស្នែងថ្មី) ជាមួយម្ហូបខ្មែរឆ្ងាញ់ពិសា ៧មុខ ការកាត់នំខួបស្នេហា លើកកែវស្រាជូនពរ និងតន្ត្រីរាំកម្សាន្ត។',
      descEn: 'An opulent evening reception featuring a gourmet 7-course feast, champagne toast, cake cutting ceremony, live acoustic performance, and dancing.',
      icon: 'dinner_dining',
      badge: 'Evening Feast'
    }
  ];

  const dressCodeColors = [
    { nameKm: 'បៃតងព្រៃធម្មជាតិ', nameEn: 'Botanical Forest Green', hex: '#295744' },
    { nameKm: 'ពណ៌មាសឆើតឆាយ', nameEn: 'Champagne Gold', hex: '#C5A880' },
    { nameKm: 'ផ្កាឈូកស្រាល', nameEn: 'Blush Peony Pink', hex: '#E8B2B5' },
    { nameKm: 'ផ្ទៃមេឃស្រទន់', nameEn: 'Cornflower Blue Silk', hex: '#9BB4C7' }
  ];

  return (
    <div className="w-full flex flex-col items-center space-y-8 sm:space-y-12 transition-all">
      
      {/* ======================================================== */}
      {/* SECTION 1: HERO TORN-PAPER BOTANICAL INVITATION (COVER) */}
      {/* ======================================================== */}
      <RevealOnScroll>
        <section
          id="hero-invitation"
          onClick={() => onPlayMusic?.()}
          className="w-full flex flex-col items-center pt-1"
        >
        <main
          id="wedding-invitation-card"
          className="w-full max-w-[390px] sm:max-w-[430px] relative bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-[28px] sm:rounded-[34px] shadow-2xl overflow-hidden border border-stone-200/80 dark:border-stone-700/80 transition-all duration-300"
        >
          {/* Top Torn-Paper Photo Section matching User's Reference Template */}
          <div className="w-full relative overflow-hidden bg-[#FAF7F0] dark:bg-[#1A221E]">
            <img
              src={coverHeroPhoto}
              alt="Hong & ReakSmey Wedding - Save The Date"
              className="w-full h-auto object-cover object-top select-none pointer-events-none block"
            />

            {/* Jagged / Deckle Torn-Paper Bottom Edge Transition */}
            <div className="absolute -bottom-0.5 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
              <svg
                viewBox="0 0 1200 70"
                preserveAspectRatio="none"
                className="w-full h-8 sm:h-10 text-[#FCFBF7] dark:text-[#1A2E24] fill-current drop-shadow-xs"
              >
                {/* Secondary translucent torn edge layer for realistic paper depth */}
                <path
                  d="M0,25 Q40,15 80,30 T160,20 T240,32 T320,18 T400,28 T480,15 T560,30 T640,18 T720,32 T800,20 T880,30 T960,18 T1040,28 T1120,16 T1200,28 L1200,70 L0,70 Z"
                  fillOpacity="0.4"
                />
                {/* Primary sharp ripped deckle paper edge */}
                <path
                  d="M0,32 L25,20 L50,35 L78,22 L105,33 L135,18 L168,34 L200,21 L235,36 L270,19 L308,35 L345,18 L385,34 L425,19 L465,36 L505,18 L545,35 L585,19 L625,36 L665,18 L705,35 L745,20 L785,36 L825,19 L865,35 L905,18 L945,34 L985,20 L1025,36 L1065,19 L1105,34 L1145,21 L1175,32 L1200,24 L1200,70 L0,70 Z"
                />
              </svg>
            </div>
          </div>

          {/* Delicate Mini Corner Flowers (Subtle, strictly in corner so it never covers text) */}
          <SmallCornerFlowerLeft className="absolute bottom-1.5 left-2 w-10 h-10 sm:w-12 sm:h-12 z-0 pointer-events-none opacity-80" />
          <SmallCornerFlowerRight className="absolute bottom-1.5 right-2 w-10 h-10 sm:w-12 sm:h-12 z-0 pointer-events-none opacity-80" />

          {/* Main Card Typography & Event Block */}
          <div className="relative z-10 px-4 pt-2.5 pb-6 sm:px-6 sm:pt-3.5 sm:pb-7 flex flex-col items-center text-center">

            {/* Traditional Khmer Sacred Header Title: សិរីមង្គលអាពាហ៍ពិពាហ៍ */}
            <div className="flex items-center justify-center gap-2 mb-1 -mt-2.5 sm:-mt-3">
              <span className="text-[10px] text-[#C5A880]">❖</span>
              <h2 className="font-khmer-title text-base sm:text-lg font-normal text-[#295744] dark:text-[#67AA8E] tracking-wider leading-relaxed drop-shadow-2xs -translate-y-0.5">
                សិរីមង្គលអាពាហ៍ពិពាហ៍
              </h2>
              <span className="text-[10px] text-[#C5A880]">❖</span>
            </div>

            {/* Couple Script Calligraphy Names matching "James & Jessica" */}
            <div className="w-full flex flex-col items-center justify-center -mt-0.5 sm:-mt-1 mb-2">
              <div className="flex items-center justify-center space-x-2 text-[#1B3B2E] dark:text-[#88CDB0]">
                <span className="font-script text-4xl sm:text-5xl leading-none drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]">
                  Hong
                </span>
                <span className="font-script text-3xl sm:text-4xl text-[#C5A880] mx-1 leading-none drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
                  &amp;
                </span>
                <span className="font-script text-4xl sm:text-5xl leading-none drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]">
                  ReakSmey
                </span>
              </div>
            </div>

            {/* "YOU ARE INVITED" & Khmer « សូមគោរពអញ្ជើញ » Badge */}
            <div className="flex flex-col items-center justify-center mt-1 mb-3">
              <span className="font-display tracking-[0.28em] text-[11px] sm:text-[12px] font-semibold text-stone-700 dark:text-stone-300 uppercase">
                YOU ARE INVITED
              </span>
              <div className="mt-1.5 py-1 px-4 rounded-full bg-gradient-to-r from-[#FAF6EE] via-[#F3ECE0] to-[#FAF6EE] dark:from-[#233F31] dark:via-[#2D3932] dark:to-[#233F31] border border-[#C5A880]/60 shadow-xs flex items-center space-x-1.5 text-[#295744] dark:text-[#C5A880]">
                <span className="text-[9px] text-[#C5A880]">❖</span>
                <span className="font-khmer font-bold text-xs sm:text-[13px] tracking-wider">
                  {lang === 'km' ? 'សូមគោរពអញ្ជើញ' : 'Cordially Inviting You'}
                </span>
                <span className="text-[9px] text-[#C5A880]">❖</span>
              </div>
            </div>

            {/* 3-Column Structured Schedule Block matching Reference Template */}
            <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto grid grid-cols-[1fr_auto_1.15fr_auto_1fr] items-center gap-1 sm:gap-2 my-2 py-2">
              
              {/* Column 1: Ceremony */}
              <div className="flex flex-col items-center justify-center text-center px-1">
                <span className="font-display text-xs sm:text-[13px] font-semibold text-stone-800 dark:text-stone-100 uppercase tracking-wide">
                  Ceremony
                </span>
                <span className="font-khmer text-[11px] font-medium text-stone-600 dark:text-stone-300 mt-0.5">
                  ពិធីសិរីមង្គល
                </span>
                <span className="font-modern text-[11px] font-semibold text-[#295744] dark:text-[#88CDB0] mt-1">
                  17 March
                </span>
                <span className="font-modern text-[10px] text-stone-500 dark:text-stone-400">
                  07:00 AM
                </span>
              </div>

              {/* Vertical Bracket/Diamond Divider 1 */}
              <div className="flex flex-col items-center justify-center h-full py-0.5">
                <span className="text-[8px] text-[#C5A880] leading-none">◆</span>
                <div className="w-[1px] h-12 sm:h-14 bg-gradient-to-b from-[#C5A880]/70 via-stone-300 dark:via-stone-600 to-[#C5A880]/70 my-0.5" />
                <span className="text-[8px] text-[#C5A880] leading-none">◆</span>
              </div>

              {/* Column 2: Location (Bride's Residence) */}
              <div className="flex flex-col items-center justify-center text-center px-1">
                <span className="font-display text-xs sm:text-[13px] font-semibold text-stone-800 dark:text-stone-100 uppercase tracking-wide">
                  Bride&apos;s Home
                </span>
                <span className="font-khmer text-[11px] font-medium text-stone-600 dark:text-stone-300 mt-0.5">
                  គេហដ្ឋានកូនក្រមុំ
                </span>
                <span className="font-modern text-[10.5px] font-semibold text-[#295744] dark:text-[#88CDB0] mt-1 leading-tight">
                  Peaksneng Tmey
                </span>
                <span className="font-modern text-[9.5px] text-stone-500 dark:text-stone-400 leading-tight">
                  Angkor Thom, SR
                </span>
              </div>

              {/* Vertical Bracket/Diamond Divider 2 */}
              <div className="flex flex-col items-center justify-center h-full py-0.5">
                <span className="text-[8px] text-[#C5A880] leading-none">◆</span>
                <div className="w-[1px] h-12 sm:h-14 bg-gradient-to-b from-[#C5A880]/70 via-stone-300 dark:via-stone-600 to-[#C5A880]/70 my-0.5" />
                <span className="text-[8px] text-[#C5A880] leading-none">◆</span>
              </div>

              {/* Column 3: Dinner Reception */}
              <div className="flex flex-col items-center justify-center text-center px-1">
                <span className="font-display text-xs sm:text-[13px] font-semibold text-stone-800 dark:text-stone-100 uppercase tracking-wide">
                  Dinner
                </span>
                <span className="font-khmer text-[11px] font-medium text-stone-600 dark:text-stone-300 mt-0.5">
                  ពិសាភោជនាហារ
                </span>
                <span className="font-modern text-[11px] font-semibold text-[#295744] dark:text-[#88CDB0] mt-1">
                  Grand Banquet
                </span>
                <span className="font-modern text-[10px] text-stone-500 dark:text-stone-400">
                  06:30 PM
                </span>
              </div>

            </div>

          </div>
        </main>

        {/* ======================================================== */}
        {/* INTERACTIVE COMPANION BLOCK (COUNTDOWN & QUICK JUMP)    */}
        {/* ======================================================== */}
        <div className="w-full max-w-[390px] sm:max-w-[430px] flex flex-col items-center mt-5 px-3">
          
          {/* Gratitude Statement */}
          <div className="text-center max-w-[320px] px-2 mb-4 space-y-1">
            <p className="font-khmer text-xs sm:text-[13px] leading-relaxed text-stone-700 dark:text-stone-300 font-normal">
              «វត្តមានដ៏ថ្លៃថ្លារបស់លោកអ្នក គឺជាកិត្តិយសដ៏ខ្ពង់ខ្ពស់សម្រាប់គ្រួសារយើងខ្ញុំ»
            </p>
            <p className="font-display italic text-[12px] text-stone-500 dark:text-stone-400 leading-tight">
              We are truly grateful for your presence on this joyous occasion.
            </p>
          </div>

          {/* Live Countdown Section */}
          <div className="w-full bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-2xl p-3 sm:p-4 border border-[#C5A880]/30 shadow-md">
            <div className="text-center mb-2.5 flex items-center justify-center gap-2">
              <span className="text-[#C5A880] text-xs">❦</span>
              <span className="text-[11px] font-modern uppercase tracking-widest text-stone-600 dark:text-stone-300 font-semibold">
                Countdown to Celebration
              </span>
              <span className="text-[#C5A880] text-xs">❦</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#FFF8ED] dark:bg-[#233F31] p-2 rounded-xl border border-[#C5A880]/25 shadow-xs">
                <span className="font-display text-xl font-bold text-[#295744] dark:text-[#C5A880] block leading-tight">
                  {timeLeft.days}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
                  Days
                </span>
              </div>
              <div className="bg-[#FFF8ED] dark:bg-[#233F31] p-2 rounded-xl border border-[#C5A880]/25 shadow-xs">
                <span className="font-display text-xl font-bold text-[#295744] dark:text-[#C5A880] block leading-tight">
                  {timeLeft.hours < 10 ? `0${timeLeft.hours}` : timeLeft.hours}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
                  Hours
                </span>
              </div>
              <div className="bg-[#FFF8ED] dark:bg-[#233F31] p-2 rounded-xl border border-[#C5A880]/25 shadow-xs">
                <span className="font-display text-xl font-bold text-[#295744] dark:text-[#C5A880] block leading-tight">
                  {timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
                  Mins
                </span>
              </div>
              <div className="bg-[#FFF8ED] dark:bg-[#233F31] p-2 rounded-xl border border-[#C5A880]/25 shadow-xs">
                <span className="font-display text-xl font-bold text-[#295744] dark:text-[#C5A880] block leading-tight">
                  {timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
                  Secs
                </span>
              </div>
            </div>
          </div>

          {/* Quick In-Page Smooth Scroll Links */}
          <div className="w-full mt-3 space-y-2">
            <button
              type="button"
              onClick={() => scrollTo('rsvp-section')}
              className="w-full bg-[#295744] hover:bg-[#3C735B] text-white py-3 px-4 rounded-xl font-khmer text-xs tracking-wider flex items-center justify-between shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
                <span className="font-bold">ឆ្លើយតបការចូលរួម (RSVP)</span>
              </div>
              <span className="text-[10px] text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Google Sheet</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => scrollTo('gift-section')}
              className="w-full bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-700 hover:to-rose-700 text-white py-2.5 px-4 rounded-xl font-khmer text-xs tracking-wider flex items-center justify-center space-x-2 shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
                redeem
              </span>
              <span className="font-bold">
                {lang === 'km' ? 'អំណោយ (QR Code & លេខកុងធនាគារ)' : 'Wedding Gift (QR Code & Bank Accounts)'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => scrollTo('ceremony-section')}
                className="py-2.5 px-2 rounded-xl border border-[#295744]/30 dark:border-[#C5A880]/40 bg-white dark:bg-[#1A2E24] text-stone-700 dark:text-stone-200 text-[11px] font-modern flex items-center justify-center space-x-1.5 hover:bg-stone-50 dark:hover:bg-[#233F31] transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px] text-[#295744] dark:text-[#C5A880]">
                  temple_buddhist
                </span>
                <span className="font-khmer truncate">កម្មវិធីមង្គល (Program)</span>
              </button>

              <button
                type="button"
                onClick={() => scrollTo('location-section')}
                className="py-2.5 px-2 rounded-xl border border-[#295744]/30 dark:border-[#C5A880]/40 bg-white dark:bg-[#1A2E24] text-stone-700 dark:text-stone-200 text-[11px] font-modern flex items-center justify-center space-x-1.5 hover:bg-stone-50 dark:hover:bg-[#233F31] transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px] text-[#295744] dark:text-[#C5A880]">
                  directions
                </span>
                <span className="font-khmer truncate">មើលទីតាំង (Map)</span>
              </button>
            </div>
          </div>

          {/* Seamless Continuous Scroll Cue Indicator */}
          <div
            onClick={() => scrollTo('ceremony-section')}
            className="mt-5 flex flex-col items-center justify-center text-center cursor-pointer group animate-bounce py-1"
          >
            <span className="text-[11px] font-khmer font-medium text-stone-500 dark:text-stone-400 group-hover:text-[#295744] dark:group-hover:text-[#C5A880] transition-colors flex items-center gap-1">
              <span>{lang === 'km' ? 'អូសឡើងលើដើម្បីទស្សនាបន្ត' : 'Swipe up to explore further'}</span>
            </span>
            <span className="material-symbols-outlined text-[20px] text-[#C5A880] dark:text-[#C5A880] leading-none mt-0.5">
              keyboard_arrow_down
            </span>
          </div>

        </div>
      </section>
      </RevealOnScroll>

      {/* Decorative Floral Line Divider */}
      <FloralLineDivider />

      {/* ======================================================== */}
      {/* SECTION 2: CEREMONY SCHEDULE & PARENTS LINEAGE           */}
      {/* ======================================================== */}
      <RevealOnScroll>
        <section
          id="ceremony-section"
          className="w-full max-w-[420px] sm:max-w-2xl bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl p-5 sm:p-7 border border-[#C5A880]/60 dark:border-[#C5A880]/40 ring-1 ring-[#C5A880]/30 ring-offset-2 ring-offset-[#FCFBF7] dark:ring-offset-[#1A2E24] transition-all duration-300 ease-out hover:scale-[1.02] relative gold-ceremony-shimmer"
        >
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8ED] dark:bg-[#233F31] border border-[#C5A880]/50 text-[#86513d] dark:text-[#C5A880] text-xs font-khmer font-bold mb-2">
            <span className="material-symbols-outlined text-[16px]">temple_buddhist</span>
            <span>{lang === 'km' ? 'កម្មវិធីមង្គលការ និងពិធីសែនព្រេន' : 'Wedding Itinerary & Sacred Rituals'}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-khmer text-[#0d402e] dark:text-[#67AA8E]">
            {lang === 'km' ? 'ព័ត៌មានលម្អិតនៃពិធីមង្គលការ' : 'Sacred Ceremony Timeline'}
          </h2>
          <p className="text-xs text-stone-500 font-khmer mt-1">
            {lang === 'km' ? 'ថ្ងៃពុធ ទី ១៧ ខែមីនា ឆ្នាំ២០២៧' : 'Wednesday, 17 March 2027'}
          </p>
        </div>

        {/* Parents & Family Lineage Honor Card */}
        <div className="p-4 rounded-2xl bg-[#FFF8ED] dark:bg-[#233F31] border border-[#C5A880]/40 shadow-xs mb-5">
          <div className="flex items-center gap-2 border-b border-[#C5A880]/30 pb-2 mb-3">
            <span className="material-symbols-outlined text-[#86513d] dark:text-[#C5A880] text-[20px]">
              diversity_1
            </span>
            <span className="text-xs font-bold text-[#86513d] dark:text-[#C5A880] font-khmer">
              {lang === 'km' ? 'មាតាបិតា និងគ្រួសារទាំងសងខាង' : 'With Blessings from Both Families'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-khmer">
            <div className="p-3 bg-white/80 dark:bg-stone-900/70 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
              <span className="text-[10px] text-stone-400 block mb-0.5">{lang === 'km' ? 'មាតាបិតាខាងកូនកំលោះ' : "Groom's Parents"}</span>
              <p className="font-bold text-stone-800 dark:text-stone-200">លោក ហុង វឌ្ឍនា</p>
              <p className="font-bold text-stone-800 dark:text-stone-200">លោកស្រី កែវ ចរិយា</p>
              <div className="mt-1.5 pt-1.5 border-t border-stone-100 dark:border-stone-800 text-[10.5px] text-stone-500">
                កូនកំលោះ: <strong className="text-[#295744] dark:text-[#C5A880]">ម៉ៅ ហុង</strong>
              </div>
            </div>

            <div className="p-3 bg-white/80 dark:bg-stone-900/70 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
              <span className="text-[10px] text-stone-400 block mb-0.5">{lang === 'km' ? 'មាតាបិតាខាងកូនក្រមុំ' : "Bride's Parents"}</span>
              <p className="font-bold text-stone-800 dark:text-stone-200">លោក ព្រឿង ង៉ិក</p>
              <p className="font-bold text-stone-800 dark:text-stone-200">លោកស្រី ឡូយ លី</p>
              <div className="mt-1.5 pt-1.5 border-t border-stone-100 dark:border-stone-800 text-[10.5px] text-stone-500">
                កូនក្រមុំ: <strong className="text-[#295744] dark:text-[#C5A880]">ង៉ិក រស្មី</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 7 Sacred Rituals Cards */}
        <div className="space-y-3">
          {rituals.map((ritual, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#233F31] border border-stone-200/80 dark:border-stone-700 shadow-2xs flex items-start gap-3 hover:border-[#C5A880]/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFF8ED] dark:bg-[#1A2E24] border border-[#C5A880]/40 flex items-center justify-center text-[#295744] dark:text-[#C5A880] shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">{ritual.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-mono font-bold text-[#86513d] dark:text-[#C5A880]">
                    {ritual.time}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-khmer">
                    {ritual.badge}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0d402e] dark:text-stone-100 font-khmer mt-0.5">
                  {lang === 'km' ? ritual.nameKm : ritual.nameEn}
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 font-khmer mt-1 leading-relaxed">
                  {lang === 'km' ? ritual.descKm : ritual.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </RevealOnScroll>

      {/* Decorative Floral Line Divider */}
      <FloralLineDivider />

      {/* ======================================================== */}
      {/* SECTION 3: LOVE STORY & DRESS CODE                       */}
      {/* ======================================================== */}
      <RevealOnScroll>
        <section
          id="story-section"
          className="w-full max-w-[420px] sm:max-w-2xl bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl p-5 sm:p-7 shadow-xl border border-stone-200/80 dark:border-stone-700/80 transition-all"
        >
        <div className="text-center mb-6">
          <span className="font-display italic text-xs tracking-widest text-[#C5A880] uppercase">
            {lang === 'km' ? 'ដំណើរនៃក្តីស្រឡាញ់' : 'The Journey of Love'}
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-khmer text-[#0d402e] dark:text-[#67AA8E] mt-0.5">
            {lang === 'km' ? 'រឿងរ៉ាវស្នេហា ម៉ៅ ហុង & ង៉ិក រស្មី' : 'Mao Hong & Ngek ReakSmey'}
          </h2>
          <p className="text-xs text-stone-500 font-khmer mt-1 max-w-sm mx-auto">
            {lang === 'km'
              ? 'រាល់ការចងចាំទាំងអស់ គឺជាគ្រាប់ពេជ្រដ៏មានតម្លៃដែលបានត្បាញក្លាយជាចំណងអាពាហ៍ពិពាហ៍'
              : 'Every cherished memory paved the path to our lifelong sacred vow'}
          </p>
        </div>

        {/* Timeline Chapters */}
        <div className="relative border-l-2 border-[#C5A880]/40 ml-3 sm:ml-4 space-y-6 pl-4 sm:pl-5 mb-8">
          {LOVE_STORY_CHAPTERS.map((ch, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[23px] sm:-left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-[#295744] dark:bg-[#C5A880] border-2 border-white dark:border-[#1A2E24] shadow-xs"></div>

              <span className="text-[11px] font-mono font-bold text-[#86513d] dark:text-[#C5A880] tracking-wider">
                {ch.year}
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-[#0d402e] dark:text-stone-100 font-khmer leading-snug mt-0.5">
                {lang === 'km' ? ch.titleKm : ch.titleEn}
              </h3>

              <div className="mt-2.5 rounded-2xl overflow-hidden aspect-[4/5] max-h-[440px] bg-stone-100 dark:bg-stone-800/80 shadow-md border border-[#C5A880]/30 relative group/img">
                <img
                  src={ch.image}
                  alt={ch.titleEn}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top group-hover/img:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 font-khmer mt-2 leading-relaxed">
                {lang === 'km' ? ch.descKm : ch.descEn}
              </p>
            </div>
          ))}
        </div>

        {/* Dress Code & Attire Palette */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#233F31] border border-stone-200 dark:border-stone-700 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#86513d] dark:text-[#C5A880] text-[20px]">
              styler
            </span>
            <h4 className="text-xs sm:text-sm font-bold font-khmer text-stone-800 dark:text-stone-200">
              {lang === 'km' ? 'ការណែនាំអំពីការស្លៀកពាក់ (Dress Code)' : 'Guest Dress Code & Attire'}
            </h4>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 font-khmer leading-relaxed mb-3">
            {lang === 'km'
              ? 'សម្រាប់ពិធីពេលព្រឹក សូមគោរពអញ្ជើញលោកអ្នកស្លៀកឈុតប្រពៃណីខ្មែរ (សំពត់ចងក្បិន ហូល ផាមួង)។ សម្រាប់ពិធីជប់លៀងពេលល្ងាច សូមស្លៀកឈុតរាត្រីស្រមោលស ឬអាវធំផ្លូវការ។'
              : 'For the morning ceremonies, guests are welcome to wear traditional Khmer silk attire. For the evening grand banquet, elegant cocktail dresses and formal suits are warmly encouraged.'}
          </p>

          <span className="text-[10.5px] font-semibold text-stone-500 uppercase tracking-wider block mb-2 font-khmer">
            {lang === 'km' ? 'កូដពណ៌ដែលសក្តិសម (Wedding Palette)' : 'Celebration Color Palette'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {dressCodeColors.map((color, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl border border-stone-200/80 dark:border-stone-700 flex items-center gap-2 bg-[#FCFBF7] dark:bg-[#1A2E24]"
              >
                <div
                  className="w-6 h-6 rounded-lg shadow-inner shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="truncate">
                  <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 block truncate font-khmer">
                    {lang === 'km' ? color.nameKm : color.nameEn}
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono">{color.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </RevealOnScroll>

      {/* Decorative Floral Line Divider */}
      <FloralLineDivider />

      {/* ======================================================== */}
      {/* SECTION 4: PRE-WEDDING PHOTO GALLERY                     */}
      {/* ======================================================== */}
      <RevealOnScroll>
        <section
          id="gallery-section"
          className="w-full max-w-[420px] sm:max-w-2xl bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl p-5 sm:p-7 shadow-xl border border-stone-200/80 dark:border-stone-700/80 transition-all"
        >
        <div className="text-center mb-4">
          <span className="font-display italic text-xs tracking-widest text-[#C5A880] uppercase">
            {lang === 'km' ? 'អាល់ប៊ុមរូបថត' : 'Wedding Gallery'}
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-khmer text-[#0d402e] dark:text-[#67AA8E] mt-0.5">
            {lang === 'km' ? 'កម្រងរូបភាពស្នេហា (Pre-Wedding Journey)' : 'Pre-Wedding Highlights'}
          </h2>
          <p className="text-xs text-stone-500 font-khmer mt-1">
            {lang === 'km' ? 'ចុចលើរូបភាពដើម្បីមើលទំហំធំ & ទាញយក' : 'Tap any photo to view full size & download'}
          </p>
        </div>

        {/* Category Filter Chips & Upload Button */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', labelKm: 'ទាំងអស់', labelEn: 'All' },
              { id: 'traditional', labelKm: 'ពិធីបុរាណ', labelEn: 'Traditional' },
              { id: 'botanical', labelKm: 'ធម្មជាតិ', labelEn: 'Botanical' },
              { id: 'rings', labelKm: 'ចិញ្ចៀន & ផ្កា', labelEn: 'Rings & Details' },
              { id: 'guest', labelKm: 'រូបថតភ្ញៀវ', labelEn: 'Guest Photos' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setGalleryCategory(cat.id as any)}
                className={`px-3 py-1 rounded-full text-[11px] font-khmer font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  galleryCategory === cat.id
                    ? 'bg-[#295744] text-white shadow-xs'
                    : 'bg-white dark:bg-[#233F31] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                }`}
              >
                <span>{lang === 'km' ? cat.labelKm : cat.labelEn}</span>
                {cat.id === 'guest' && guestPhotosCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    galleryCategory === 'guest'
                      ? 'bg-[#C5A880] text-[#1B3B2E]'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}>
                    {guestPhotosCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => setIsUploadPhotoModalOpen(true)}
              className="w-8 h-8 rounded-full bg-[#FFF8ED] dark:bg-[#233F31] border border-[#C5A880]/60 text-[#295744] dark:text-[#C5A880] hover:bg-[#F5DFD0]/60 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
              title={lang === 'km' ? 'ផ្ញើរូបភាព' : 'Upload Photo'}
              aria-label={lang === 'km' ? 'ផ្ញើរូបភាព' : 'Upload Photo'}
            >
              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
            </button>

            <button
              type="button"
              disabled={isAdminAuthLoading}
              onClick={() => {
                if (!isAdmin) {
                  setShowAdminPanel(true);
                  handleAdminAuthClick();
                } else {
                  setShowAdminPanel((prev) => !prev);
                }
              }}
              className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center shadow-2xs cursor-pointer disabled:opacity-60 ${
                showAdminPanel && isAdmin
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                  : 'bg-white dark:bg-[#233F31] border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#2a4a3a]'
              }`}
              title={
                !isAdmin
                  ? lang === 'km'
                    ? 'ចូលគណនី Admin (Google Login)'
                    : 'Admin Google Sign-In'
                  : showAdminPanel
                  ? lang === 'km'
                    ? 'បិទប៊ូតុងលុបរូបភាព'
                    : 'Hide Delete Controls'
                  : lang === 'km'
                  ? 'បើកប៊ូតុងលុបរូបភាព (Admin)'
                  : 'Show Delete Controls (Admin)'
              }
              aria-label={
                !isAdmin
                  ? lang === 'km'
                    ? 'ចូលគណនី Admin (Google Login)'
                    : 'Admin Google Sign-In'
                  : lang === 'km'
                  ? 'គ្រប់គ្រង និងលុបរូបភាព (Admin)'
                  : 'Admin Photo Management'
              }
            >
              <span className="material-symbols-outlined text-[16px]">
                {isAdmin ? 'verified_user' : 'admin_panel_settings'}
              </span>
            </button>
          </div>
        </div>

        {/* Dedicated Guest Memories Storage Vault Banner when viewing 'guest' category */}
        {galleryCategory === 'guest' && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#FFF8ED] via-[#F7F2E7] to-[#FFF8ED] dark:from-[#233F31] dark:via-[#1A2E24] dark:to-[#233F31] border border-[#C5A880]/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1A2E24] border border-[#C5A880]/60 flex items-center justify-center text-[#295744] dark:text-[#C5A880] shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <h3 className="font-khmer font-bold text-sm text-[#0d402e] dark:text-[#88CDB0]">
                    {lang === 'km' ? 'កន្លែងរក្សាទុករូបភាពពីភ្ញៀវកិត្តិយស' : 'Guest Photo Memories Storage'}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#295744] text-white font-mono font-bold">
                    {guestPhotosCount} {lang === 'km' ? 'សន្លឹក' : 'photos'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 font-khmer mt-0.5">
                  {lang === 'km'
                    ? 'រូបថតទាំងអស់ដែលភ្ញៀវផ្ញើមក ត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិក្នងអាល់ប៊ុម Cloud នេះ'
                    : 'All guest photos and memories are automatically stored and preserved here.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsUploadPhotoModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#295744] hover:bg-[#3C735B] text-white text-xs font-khmer font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
              <span>{lang === 'km' ? 'ផ្ញើរូបភាពបន្ថែម' : 'Upload Your Photo'}</span>
            </button>
          </div>
        )}

        {/* Empty State for Guest Photos */}
        {galleryCategory === 'guest' && filteredPhotos.length === 0 && (
          <div className="py-10 px-4 text-center rounded-2xl bg-white/70 dark:bg-[#233F31]/70 border border-dashed border-[#C5A880]/60 flex flex-col items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-[#FFF8ED] dark:bg-[#1A2E24] border border-[#C5A880]/50 flex items-center justify-center text-[#C5A880] mb-2">
              <span className="material-symbols-outlined text-[24px]">collections</span>
            </div>
            <h4 className="font-khmer font-bold text-sm text-stone-800 dark:text-stone-200">
              {lang === 'km' ? 'មិនទាន់មានរូបថតពីភ្ញៀវនៅឡើយទេ' : 'No Guest Photos Yet'}
            </h4>
            <p className="text-xs text-stone-500 font-khmer mt-1 max-w-xs">
              {lang === 'km'
                ? 'សូមក្លាយជាអ្នកដំបូងដែលផ្ញើរូបភាពអនុស្សាវរីយ៍ជូនគូស្វាមីភរិយាថ្មី!'
                : 'Be the first guest to share your memorable photo with the newlyweds!'}
            </p>
            <button
              type="button"
              onClick={() => setIsUploadPhotoModalOpen(true)}
              className="mt-3 px-4 py-1.5 rounded-full bg-[#295744] text-white text-xs font-khmer font-bold flex items-center gap-1 shadow-xs hover:bg-[#3C735B] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">add_a_photo</span>
              <span>{lang === 'km' ? 'ផ្ញើរូបថតឥឡូវនេះ' : 'Upload First Photo'}</span>
            </button>
          </div>
        )}

        {/* Photo Grid with Arch Geometry */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-stone-200 dark:bg-stone-800 cursor-pointer shadow-xs border border-stone-200/60 dark:border-stone-700/60"
            >
              <img
                src={photo.imageUrl}
                alt={photo.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              {showAdminPanel && isAdmin && onDeletePhoto && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminActionError(null);
                    setPhotoPendingDelete(photo);
                  }}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center shadow-md backdrop-blur-xs transition-all cursor-pointer active:scale-95"
                  title={lang === 'km' ? 'លុបរូបភាពនេះ (Admin)' : 'Delete this photo (Admin)'}
                  aria-label={lang === 'km' ? 'លុបរូបភាព' : 'Delete photo'}
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-2.5">
                <span className="text-[11px] text-white font-khmer font-semibold leading-tight line-clamp-1">
                  {lang === 'km' ? photo.titleKm : photo.titleEn}
                </span>
                <div className="flex items-center justify-between mt-1 text-[9px] text-stone-300">
                  <span className="truncate">{photo.badge || 'Hong & Smey'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      </RevealOnScroll>

      {/* Decorative Floral Line Divider */}
      <FloralLineDivider />

      {/* ======================================================== */}
      {/* SECTION 5: WEDDING GIFT & KHQR BANK ACCOUNTS             */}
      {/* ======================================================== */}
      <RevealOnScroll>
        <section
          id="gift-section"
          className="w-full max-w-[420px] sm:max-w-2xl bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl p-5 sm:p-7 shadow-xl border border-stone-200/80 dark:border-stone-700/80 transition-all"
        >
        <div className="text-center mb-5">
          <div className="w-11 h-11 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[24px]">redeem</span>
          </div>
          <span className="text-[11px] font-display uppercase tracking-widest text-[#C5A880] font-bold block">
            Wedding Gift &amp; Ang Pao
          </span>
          <h2 className="font-khmer font-bold text-lg sm:text-xl text-[#0d402e] dark:text-[#67AA8E] mt-0.5">
            {lang === 'km' ? 'ចំណងដៃ & អំណោយអាពាហ៍ពិពាហ៍' : 'Wedding Gift & KHQR'}
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-300 font-khmer mt-1 max-w-sm mx-auto leading-relaxed">
            {lang === 'km'
              ? 'សូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅចំពោះទឹកចិត្ត និងចំណងដៃដ៏មានតម្លៃរបស់លោកអ្នក ជូនចំពោះគូស្វាមីភរិយាថ្មី'
              : 'Thank you sincerely for blessing Hong & ReakSmey with your love and wedding gift.'}
          </p>
        </div>

        {/* Authentic High-Contrast KHQR Card Container */}
        <div className="bg-white dark:bg-[#233F31] rounded-3xl p-4 sm:p-5 border border-stone-200/80 dark:border-stone-700 shadow-sm flex flex-col items-center text-center">
          
          {/* Top KHQR Standard Red Header */}
          <div className="w-full bg-[#E1251B] text-white py-2 px-3 rounded-2xl flex items-center justify-between shadow-xs mb-3">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm tracking-wider">KHQR</span>
              <span className="text-[10px] opacity-85 font-mono">• BAKONG</span>
            </div>
            <span className="text-[11px] font-khmer font-medium">
              ធនាគារ អេប៊ីអេ (ABA Bank)
            </span>
          </div>

          {/* Authentic High-Contrast QR Code Artwork */}
          <div className="p-3 bg-white rounded-2xl border-2 border-stone-200 shadow-xs relative mb-3">
            <svg
              className="w-48 h-48 sm:w-56 sm:h-56"
              viewBox="0 0 180 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="180" height="180" fill="#FFFFFF" rx="10" />
              <rect x="15" y="15" width="42" height="42" rx="6" fill="#1C1917" />
              <rect x="22" y="22" width="28" height="28" rx="3" fill="#FFFFFF" />
              <rect x="29" y="29" width="14" height="14" rx="2" fill="#1C1917" />

              <rect x="123" y="15" width="42" height="42" rx="6" fill="#1C1917" />
              <rect x="130" y="22" width="28" height="28" rx="3" fill="#FFFFFF" />
              <rect x="137" y="29" width="14" height="14" rx="2" fill="#1C1917" />

              <rect x="15" y="123" width="42" height="42" rx="6" fill="#1C1917" />
              <rect x="22" y="130" width="28" height="28" rx="3" fill="#FFFFFF" />
              <rect x="29" y="137" width="14" height="14" rx="2" fill="#1C1917" />

              {/* Data matrix dots */}
              <rect x="66" y="20" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="80" y="20" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="94" y="20" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="108" y="20" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="66" y="34" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="94" y="34" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="20" y="66" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="34" y="66" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="48" y="66" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="66" y="66" width="14" height="14" rx="2" fill="#1C1917" />
              <rect x="86" y="66" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="100" y="66" width="14" height="14" rx="2" fill="#1C1917" />
              <rect x="120" y="66" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="134" y="66" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="148" y="66" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="66" y="86" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="80" y="86" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="94" y="86" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="108" y="86" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="66" y="100" width="14" height="14" rx="2" fill="#1C1917" />
              <rect x="86" y="100" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="100" y="100" width="14" height="14" rx="2" fill="#1C1917" />
              <rect x="120" y="100" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="66" y="120" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="80" y="120" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="94" y="120" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="108" y="120" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="122" y="120" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="136" y="120" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="150" y="120" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="66" y="134" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="94" y="134" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="122" y="134" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="150" y="134" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="66" y="148" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="80" y="148" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="108" y="148" width="8" height="8" rx="1" fill="#1C1917" />
              <rect x="136" y="148" width="8" height="8" rx="1" fill="#1C1917" />

              {/* Center Heart Emblem */}
              <circle cx="90" cy="90" r="16" fill="#FFFFFF" />
              <circle cx="90" cy="90" r="14" fill="#E1251B" />
              <path
                d="M90 96.5l-1.1-.98C84.5 91.5 81.5 88.8 81.5 85.5c0-2.6 2-4.5 4.5-4.5 1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8 2.5 0 4.5 1.9 4.5 4.5 0 3.3-3 6-7.4 10l-1.2 1z"
                fill="#FFFFFF"
              />
            </svg>
          </div>

          <div className="text-center mb-3">
            <span className="text-[11px] font-khmer text-stone-500">ឈ្មោះគណនី (Account Name):</span>
            <p className="font-display font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 tracking-wider">
              HONG &amp; REAKSMEY
            </p>
          </div>

          {/* Bank Accounts Grid with One-Tap Copy */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* USD Account */}
            <div className="p-3 bg-stone-50 dark:bg-[#1A2E24] rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-mono text-stone-400 block font-semibold">USD ACCOUNT</span>
                <span className="font-mono text-sm font-bold text-[#005f73] dark:text-[#56cfe1]">001 888 999</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText('001 888 999', 'usd')}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 text-xs font-khmer font-semibold hover:bg-stone-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copiedBank === 'usd' ? 'check' : 'content_copy'}
                </span>
                <span>{copiedBank === 'usd' ? (lang === 'km' ? 'បានចម្លង ✓' : 'Copied ✓') : (lang === 'km' ? 'ចម្លង' : 'Copy')}</span>
              </button>
            </div>

            {/* KHR Account */}
            <div className="p-3 bg-stone-50 dark:bg-[#1A2E24] rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-mono text-stone-400 block font-semibold">KHR (រៀល) ACCOUNT</span>
                <span className="font-mono text-sm font-bold text-[#005f73] dark:text-[#56cfe1]">001 888 998</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyText('001 888 998', 'khr')}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 text-xs font-khmer font-semibold hover:bg-stone-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copiedBank === 'khr' ? 'check' : 'content_copy'}
                </span>
                <span>{copiedBank === 'khr' ? (lang === 'km' ? 'បានចម្លង ✓' : 'Copied ✓') : (lang === 'km' ? 'ចម្លង' : 'Copy')}</span>
              </button>
            </div>
          </div>

        </div>
      </section>
      </RevealOnScroll>

      {/* Decorative Floral Line Divider */}
      <FloralLineDivider />

      {/* ======================================================== */}
      {/* SECTION 6: RSVP ATTENDANCE CONFIRMATION FORM             */}
      {/* ======================================================== */}
      <RevealOnScroll>
        <section
          id="rsvp-section"
          className="w-full max-w-[420px] sm:max-w-2xl bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl p-5 sm:p-7 shadow-xl border border-stone-200/80 dark:border-stone-700/80 transition-all"
        >
        <div className="text-center mb-5">
          <h2 className="text-lg sm:text-xl font-bold font-khmer text-[#0d402e] dark:text-[#67AA8E]">
            {lang === 'km' ? 'ឆ្លើយតបការចូលរួម (RSVP Confirmation)' : 'RSVP Attendance Confirmation'}
          </h2>
          <p className="text-xs text-stone-500 font-khmer mt-1">
            {lang === 'km'
              ? 'សូមមេត្តាឆ្លើយតបមុនថ្ងៃទី ១០ ខែមីនា ឆ្នាំ២០២៧ ដើម្បីភាពងាយស្រួលក្នុងការរៀបចំកន្លែងទទួលបដិសណ្ឋារកិច្ច'
              : 'Please RSVP by March 10, 2027 to help us arrange your banquet table'}
          </p>
        </div>

        {/* RSVP Form Card */}
        <form onSubmit={handleRsvpSubmit} className="p-4 sm:p-5 bg-white dark:bg-[#233F31] rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs space-y-3.5">
          <div>
            <label className="block text-xs font-khmer font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {lang === 'km' ? 'ឈ្មោះភ្ញៀវកិត្តិយស (Full Name) *' : 'Guest Full Name *'}
            </label>
            <input
              type="text"
              required
              value={rsvpName}
              onChange={(e) => setRsvpName(e.target.value)}
              placeholder={lang === 'km' ? 'ឧ. លោក វណ្ណៈ ឬ កញ្ញា សុខា' : 'e.g. Mr. Sovann / Ms. Sokha'}
              className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-[#FCFBF7] dark:bg-[#1A2E24] py-2.5 px-3 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#295744]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-khmer font-semibold text-stone-700 dark:text-stone-300 mb-1">
                {lang === 'km' ? 'លេខទូរស័ព្ទ / Telegram' : 'Phone or Telegram'}
              </label>
              <input
                type="tel"
                value={rsvpPhone}
                onChange={(e) => setRsvpPhone(e.target.value)}
                placeholder="012 345 678"
                className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-[#FCFBF7] dark:bg-[#1A2E24] py-2.5 px-3 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#295744]"
              />
            </div>

            <div>
              <label className="block text-xs font-khmer font-semibold text-stone-700 dark:text-stone-300 mb-1">
                {lang === 'km' ? 'ចំនួនភ្ញៀវ (Number of Guests)' : 'Number of Guests'}
              </label>
              <select
                value={rsvpGuestCount}
                onChange={(e) => setRsvpGuestCount(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-[#FCFBF7] dark:bg-[#1A2E24] py-2.5 px-3 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#295744]"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {lang === 'km' ? 'នាក់' : 'Guest(s)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendance Radio */}
          <div>
            <label className="block text-xs font-khmer font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              {lang === 'km' ? 'តើលោកអ្នកអាចចូលរួមបានទេ? *' : 'Will you attend? *'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRsvpAttending('yes')}
                className={`py-2 px-3 rounded-xl text-xs font-khmer font-semibold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                  rsvpAttending === 'yes'
                    ? 'bg-[#295744] text-white border-[#295744] shadow-xs'
                    : 'bg-[#FCFBF7] dark:bg-[#1A2E24] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>{lang === 'km' ? 'រីករាយនឹងចូលរួម (Yes)' : 'Yes, I will attend'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRsvpAttending('no')}
                className={`py-2 px-3 rounded-xl text-xs font-khmer font-semibold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                  rsvpAttending === 'no'
                    ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                    : 'bg-[#FCFBF7] dark:bg-[#1A2E24] text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">cancel</span>
                <span>{lang === 'km' ? 'សូមអភ័យទោស (No)' : 'Regretfully decline'}</span>
              </button>
            </div>
          </div>

          {/* Blessing Message */}
          <div>
            <label className="block text-xs font-khmer font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {lang === 'km' ? 'ពាក្យជូនពរដល់គូស្វាមីភរិយា (Wedding Blessing)' : 'Blessing for the Newlyweds'}
            </label>
            <textarea
              rows={2}
              value={rsvpBlessing}
              onChange={(e) => setRsvpBlessing(e.target.value)}
              placeholder={lang === 'km' ? 'សូមជូនពរឱ្យអ្នកទាំងពីរមានសុភមង្គល និងស្រឡាញ់គ្នាជារៀងរហូត...' : 'Wishing Hong & ReakSmey eternal joy and love...'}
              className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-[#FCFBF7] dark:bg-[#1A2E24] py-2 px-3 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#295744]"
            />
          </div>

          {/* Guest Photo Attachment Option */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#295744] dark:text-[#C5A880] font-khmer font-semibold hover:opacity-85">
              <span className="material-symbols-outlined text-[17px]">add_photo_alternate</span>
              <span>{lang === 'km' ? 'ភ្ជាប់រូបថតអនុស្សាវរីយ៍ (Attach Guest Photo)' : 'Attach Guest Photo (Optional)'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleRsvpPhotoUpload}
                className="hidden"
              />
            </label>

            {isUploadingRsvpPhoto && (
              <span className="text-[11px] text-stone-500 font-khmer block mt-1">
                {lang === 'km' ? 'កំពុងដំណើរការរូបភាព...' : 'Processing photo...'}
              </span>
            )}

            {rsvpPhotoUrl && (
              <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700 mt-1.5">
                <img
                  src={rsvpPhotoUrl}
                  alt="RSVP Preview"
                  className="w-10 h-10 rounded-lg object-cover border border-stone-300"
                />
                <span className="text-[11px] font-khmer text-stone-700 dark:text-stone-300 flex-1">
                  {lang === 'km' ? '✓ បានភ្ជាប់រូបភាពរួចរាល់' : '✓ Photo attached'}
                </span>
                <button
                  type="button"
                  onClick={() => setRsvpPhotoUrl('')}
                  className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#295744] hover:bg-[#3C735B] text-white text-xs font-khmer font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>{lang === 'km' ? 'បញ្ជូនការឆ្លើយតប (Submit RSVP)' : 'Submit RSVP Confirmation'}</span>
          </button>

          {rsvpSubmittedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-center text-xs text-emerald-800 dark:text-emerald-200 font-khmer animate-in fade-in">
              ✓ សូមអរគុណយ៉ាងជ្រាលជ្រៅ! ការឆ្លើយតបរបស់លោកអ្នកត្រូវបានរក្សាទុកក្នុង Google Sheet ដោយជោគជ័យ។
            </div>
          )}
        </form>
      </section>
      </RevealOnScroll>

      {/* Decorative Floral Line Divider */}
      <FloralLineDivider />

      {/* ======================================================== */}
      {/* SECTION 7: GUEST BLESSINGS & WISHES WALL                 */}
      {/* ======================================================== */}
      <RevealOnScroll>
        <section
          id="blessings-section"
          className="w-full max-w-[420px] sm:max-w-2xl bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl p-5 sm:p-7 shadow-xl border border-stone-200/80 dark:border-stone-700/80 transition-all"
        >
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-200/80 dark:border-stone-700/80">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#FFF8ED] dark:bg-[#233F31] border border-[#C5A880]/50 flex items-center justify-center text-[#86513d] dark:text-[#C5A880] shadow-2xs">
              <span className="material-symbols-outlined text-[19px]">rate_review</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-khmer text-stone-900 dark:text-stone-100">
                {lang === 'km' ? 'ពាក្យជូនពរពីភ្ញៀវកិត្តិយស' : 'Guest Blessings Wall'}
              </h3>
              <p className="text-[10px] text-stone-500 font-khmer">
                {combinedBlessings.length} {lang === 'km' ? 'សារជូនពរ' : 'Blessings'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Send Blessing Input with Wedding Emoji & Icon Picker */}
        <AddBlessing
          onAddBlessing={handleSendWish}
          lang={lang}
          className="mb-4"
        />

        {/* Blessings List */}
        {combinedBlessings.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar pr-0.5">
            {combinedBlessings.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-white dark:bg-[#233F31] border border-stone-200/70 dark:border-stone-700 text-xs flex justify-between items-center gap-2 shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-[10.5px]">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="font-bold text-stone-900 dark:text-stone-100 font-khmer shrink-0 text-[11px]">
                        {item.name}
                      </span>
                      {item.photoUrl && (
                        <span className="material-symbols-outlined text-[13px] text-[#295744] dark:text-[#C5A880] shrink-0" title="Has Guest Photo">
                          photo_camera
                        </span>
                      )}
                      <span className="text-stone-400 dark:text-stone-500 shrink-0">:</span>
                      <p className="text-[10px] text-stone-600 dark:text-stone-300 font-khmer leading-snug truncate" title={item.message}>
                        {item.message}
                      </p>
                    </div>
                    <span className="text-[8.5px] text-stone-500 dark:text-stone-400 font-khmer px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800/70 shrink-0 whitespace-nowrap">
                      {item.timestamp}
                    </span>
                  </div>

                  {item.photoUrl && (
                    <div
                      onClick={() => setViewingPhotoBlessing(item)}
                      className="mt-2 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 max-w-[90px] cursor-pointer"
                    >
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="w-full h-14 object-cover"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onToggleBlessingLike(item.id)}
                  className="flex flex-col items-center pt-0.5 text-stone-400 hover:text-rose-500 transition-colors shrink-0 ml-1 cursor-pointer"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      item.isLiked ? 'text-rose-500 fill-1' : ''
                    }`}
                  >
                    favorite
                  </span>
                  <span className="text-[9px] font-mono">{item.likes}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center rounded-2xl bg-white/40 dark:bg-[#233F31]/40 border border-dashed border-stone-200 dark:border-stone-700">
            <p className="text-xs text-stone-500 font-khmer">
              {lang === 'km' ? 'សូមសរសេរពាក្យជូនពរដំបូងគេជូនគូស្វាមីភរិយាថ្មី!' : 'Be the first to share a blessing!'}
            </p>
          </div>
        )}
      </section>
      </RevealOnScroll>

      {/* Decorative Floral Line Divider */}
      <FloralLineDivider />

      {/* ======================================================== */}
      {/* SECTION 8: WEDDING VENUE & GOOGLE MAPS                   */}
      {/* ======================================================== */}
      <RevealOnScroll>
        <section
          id="location-section"
          className="w-full max-w-[420px] sm:max-w-2xl bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl p-5 sm:p-7 shadow-xl border border-stone-200/80 dark:border-stone-700/80 transition-all"
        >
        <div className="text-center mb-5">
          <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-[#FFF8ED] dark:bg-[#233F31] border border-[#C5A880]/50 text-[#295744] dark:text-[#C5A880] flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-[22px]">location_on</span>
          </div>
          <span className="text-[11px] font-display uppercase tracking-widest text-[#C5A880] font-bold block">
            Celebration Venue
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-khmer text-[#0d402e] dark:text-[#67AA8E] mt-0.5">
            {lang === 'km' ? 'ទីតាំងរៀបចំពិធីមង្គលការ (ទីតាំងផ្ទះការ)' : 'Wedding Venue & Directions'}
          </h2>
          <p className="text-xs text-stone-700 dark:text-stone-300 font-khmer font-semibold mt-1">
            គេហដ្ឋានខាងកូនក្រមុំ (ភូមិពាក់ស្នែងថ្មី)
          </p>
          <p className="text-[11px] text-stone-500 font-modern">
            Peaksneng Tmey Village Angkor Thom Distict Siemreap Province
          </p>
        </div>

        {/* Map Preview Embed & Graphic */}
        <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 relative aspect-video bg-[#E8ECE9] dark:bg-[#1A2E24] shadow-inner mb-4">
          <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 dark:bg-[#1A2E24]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200/90 dark:border-stone-600 shadow-md flex items-center gap-1.5 pointer-events-none">
            <span className="material-symbols-outlined text-[#295744] dark:text-[#C5A880] text-[16px]">
              home_pin
            </span>
            <span className="font-khmer font-bold text-xs text-stone-900 dark:text-stone-100">
              ទីតាំងផ្ទះការ
            </span>
          </div>

          <iframe
            title="Wedding Venue Location Map"
            src="https://maps.google.com/maps?q=13.5792595,103.8804069&hl=km&z=14&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Navigation Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => window.open('https://maps.google.com/?q=13.5792595,103.8804069', '_blank', 'noopener,noreferrer')}
            className="w-full py-3 px-4 rounded-xl bg-[#295744] hover:bg-[#3C735B] text-white text-xs font-khmer font-bold shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">directions</span>
            <span>{lang === 'km' ? 'បើកក្នុង Google Maps (Directions)' : 'Open in Google Maps'}</span>
          </button>

          <button
            type="button"
            onClick={onSaveToCalendar}
            className="w-full py-3 px-4 rounded-xl bg-[#FFF8ED] dark:bg-[#233F31] border border-[#C5A880]/60 text-[#295744] dark:text-[#C5A880] text-xs font-khmer font-bold shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            <span>{lang === 'km' ? 'ដាក់ក្នុងប្រតិទិន (Save to Calendar)' : 'Add to Calendar (.ics)'}</span>
          </button>
        </div>
      </section>
      </RevealOnScroll>

      {/* Decorative Floral Line Divider */}
      <FloralLineDivider />

      {/* ======================================================== */}
      {/* SECTION 9: CLOSING GRATITUDE & MONOGRAM FOOTER           */}
      {/* ======================================================== */}
      <RevealOnScroll>
        <section className="w-full max-w-[420px] sm:max-w-2xl text-center py-6 pb-12 space-y-3">
          <div
            onClick={onOpenMonogramModal}
            className="w-14 h-14 mx-auto rounded-full bg-[#FFF8ED] dark:bg-[#1A2E24] border-2 border-[#C5A880] p-1 shadow-md cursor-pointer hover:scale-105 transition-transform overflow-hidden flex items-center justify-center"
            title={lang === 'km' ? 'ចុចដើម្បីមើលត្រាមង្គល' : 'View Official Wedding Monogram'}
          >
            <img
              src="/assets/aistudio/LogoHR_99376cce.png"
              alt="Official Wedding Monogram"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div className="space-y-1">
            <p className="font-khmer font-bold text-stone-800 dark:text-stone-200 text-sm">
              ម៉ៅ ហុង &amp; ង៉ិក រស្មី • 17 មីនា 2027
            </p>
            <p className="font-khmer text-xs text-stone-600 dark:text-stone-400">
              «សូមអរគុណយ៉ាងជ្រាលជ្រៅចំពោះវត្តមានដ៏ថ្លៃថ្លា និងពាក្យជូនពររបស់លោកអ្នក»
            </p>
            <p className="text-[11px] text-stone-400 font-modern">
              Siem Reap, Kingdom of Cambodia
            </p>
          </div>
        </section>
      </RevealOnScroll>

      {/* Lightbox Photo Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="w-full max-w-lg bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-700 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[3/4] max-h-[70vh] bg-stone-900">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.titleEn}
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-khmer font-bold text-sm text-stone-900 dark:text-stone-100">
                  {lang === 'km' ? lightboxPhoto.titleKm : lightboxPhoto.titleEn}
                </h4>
                <p className="text-xs text-stone-500 font-khmer">
                  {lang === 'km' ? lightboxPhoto.locationKm : lightboxPhoto.locationEn}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadPhoto(lightboxPhoto.imageUrl, `${lightboxPhoto.titleEn}.jpg`)}
                  className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-[#295744] dark:hover:text-[#C5A880] transition-colors"
                  title="Download Photo"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>

                {showAdminPanel && isAdmin && onDeletePhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminActionError(null);
                      setPhotoPendingDelete(lightboxPhoto);
                    }}
                    className="p-2 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/70 transition-colors cursor-pointer"
                    title={lang === 'km' ? 'លុបរូបភាពនេះ (Admin)' : 'Delete Photo (Admin)'}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delete Photo Confirmation Modal */}
      {photoPendingDelete && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !isDeletingPhoto && setPhotoPendingDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-stone-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div>
                <h3 className="font-khmer font-bold text-sm text-stone-900 dark:text-stone-100">
                  {lang === 'km' ? 'បញ្ជាក់ការលុបរូបភាព' : 'Confirm Photo Deletion'}
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-khmer">
                  {lang === 'km'
                    ? 'រូបភាពនេះនឹងត្រូវលុបចេញពីអាល់ប៊ុម។'
                    : 'This photo will be removed from the wedding gallery.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-[#233F31] border border-stone-200 dark:border-stone-700 mb-4">
              <img
                src={photoPendingDelete.imageUrl}
                alt={photoPendingDelete.titleEn}
                className="w-14 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="font-khmer font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                  {lang === 'km' ? photoPendingDelete.titleKm : photoPendingDelete.titleEn}
                </p>
                <p className="font-khmer text-[11px] text-stone-500 dark:text-stone-300 truncate">
                  {lang === 'km' ? photoPendingDelete.subtitleKm : photoPendingDelete.subtitleEn}
                </p>
              </div>
            </div>

            {adminActionError && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-khmer">
                {adminActionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeletingPhoto}
                onClick={() => setPhotoPendingDelete(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-[#233F31] hover:bg-stone-200 dark:hover:bg-[#2d4e3d] text-stone-700 dark:text-stone-200 text-xs font-khmer font-semibold transition-colors cursor-pointer"
              >
                {lang === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeletingPhoto}
                onClick={handleConfirmDeletePhoto}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-khmer font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span>
                  {isDeletingPhoto
                    ? lang === 'km'
                      ? 'កំពុងលុប...'
                      : 'Deleting...'
                    : lang === 'km'
                    ? 'លុបរូបភាព'
                    : 'Delete Photo'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Upload Photo Modal */}
      {isUploadPhotoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setIsUploadPhotoModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#FCFBF7] dark:bg-[#1A2E24] rounded-3xl p-5 shadow-2xl border border-stone-200 dark:border-stone-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-700">
              <span className="font-khmer font-bold text-sm text-stone-900 dark:text-stone-100">
                {lang === 'km' ? 'ផ្ញើរូបភាពចូលរួមអបអរសាទរ' : 'Upload Celebratory Photo'}
              </span>
              <button
                type="button"
                onClick={() => setIsUploadPhotoModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleGuestGallerySubmit} className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-khmer text-stone-600 dark:text-stone-300 mb-1">
                  {lang === 'km' ? 'ឈ្មោះលោកអ្នក (Your Name)' : 'Your Name'}
                </label>
                <input
                  type="text"
                  required
                  value={guestUploaderName}
                  onChange={(e) => setGuestUploaderName(e.target.value)}
                  placeholder="ឧ. សុខា"
                  className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-[#233F31] py-2 px-3 text-stone-800 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-khmer text-stone-600 dark:text-stone-300 mb-1">
                  {lang === 'km' ? 'ចំណងជើងរូបភាព (Photo Caption)' : 'Photo Caption'}
                </label>
                <input
                  type="text"
                  value={guestPhotoTitle}
                  onChange={(e) => setGuestPhotoTitle(e.target.value)}
                  placeholder="ឧ. រូបថតអនុស្សាវរីយ៍"
                  className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-[#233F31] py-2 px-3 text-stone-800 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-khmer text-stone-600 dark:text-stone-300 mb-1">
                  {lang === 'km' ? 'ជ្រើសរើសរូបថត (Select Photo) *' : 'Select Photo *'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleGuestGalleryPhotoChange}
                  className="w-full text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-[#295744] file:text-white file:text-xs"
                />
                {isUploadingGalleryPhoto && (
                  <span className="text-[10px] text-stone-500 font-khmer block mt-1">
                    {lang === 'km' ? 'កំពុងដំណើរការរូបភាព...' : 'Processing...'}
                  </span>
                )}
                {guestImageFilePreview && (
                  <div className="mt-2 rounded-xl overflow-hidden aspect-video border border-stone-300">
                    <img src={guestImageFilePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {guestUploadSuccess && (
                <div className="text-center py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-[#295744] dark:text-emerald-300 font-khmer font-bold animate-in fade-in">
                  ✓ {lang === 'km' ? 'រូបភាពត្រូវបានរក្សាទុកដោយជោគជ័យ!' : 'Photo successfully saved to wedding album!'}
                </div>
              )}

              <button
                type="submit"
                disabled={!guestImageFilePreview || guestUploadSuccess}
                className="w-full py-2.5 rounded-xl bg-[#295744] disabled:opacity-50 text-white text-xs font-khmer font-bold shadow-xs hover:bg-[#3C735B] transition-colors"
              >
                {lang === 'km' ? 'បង្ហោះ និងរក្សាទុកក្នុងអាល់ប៊ុម' : 'Upload & Preserve in Album'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Guest Wish Photo Lightbox */}
      {viewingPhotoBlessing && viewingPhotoBlessing.photoUrl && (
        <GuestPhotoModal
          isOpen={Boolean(viewingPhotoBlessing)}
          onClose={() => setViewingPhotoBlessing(null)}
          photoUrl={viewingPhotoBlessing.photoUrl}
          guestName={viewingPhotoBlessing.name}
          blessing={viewingPhotoBlessing.message}
          submittedAt={viewingPhotoBlessing.timestamp}
          lang={lang}
        />
      )}

      {/* Google Sheet RSVPs Modal */}
      <GoogleSheetRsvpModal
        isOpen={isSheetRsvpModalOpen}
        onClose={() => setIsSheetRsvpModalOpen(false)}
        lang={lang}
        onViewPhoto={(url, name) =>
          setViewingPhotoBlessing({
            id: 'guest-photo',
            name,
            message: '',
            timestamp: '',
            likes: 0,
            isLiked: false,
            photoUrl: url
          })
        }
      />
    </div>
  );
};
