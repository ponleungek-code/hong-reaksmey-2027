/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, Screen, GalleryPhoto, GuestBlessing, RSVPRecord } from './types';
import { INITIAL_GALLERY_PHOTOS } from './data/mockData';
import { TopHeader } from './components/TopHeader';
import { FallingPetals } from './components/FallingPetals';
import { ScrollProgress } from './components/ScrollProgress';
import { MonogramSealModal } from './components/MonogramSealModal';
import { HomeScreen } from './screens/HomeScreen';
import {
  saveRSVPToFirestore,
  sendWeddingMessage,
  uploadGuestPhotoToFirestore,
  subscribeToGuestPhotos,
  likeGuestPhotoInFirestore,
  deleteGuestPhotoFromFirestore,
  subscribeToAuth,
  signInWithGoogle,
  logoutUser,
  checkAdminAccess,
  FirebaseUser
} from './lib/firebase';
import { postSheetRSVP } from './utils/sheetdb';

export default function App() {
  // Language State: 'km' (Khmer) or 'en' (English)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('wedding_lang') as Language) || 'km';
  });

  // Dark Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('wedding_theme') === 'dark';
  });

  // Audio Melody Playing State
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);

  // Ambient Flower Petals Shower State
  const [petalsEnabled, setPetalsEnabled] = useState<boolean>(true);

  // Modals
  const [isMonogramModalOpen, setIsMonogramModalOpen] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // Admin & Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const adminStatus = await checkAdminAccess(user);
      setIsAdmin(adminStatus);
    });
    return () => unsubscribe();
  }, []);

  // Photos State - Purge obsolete unsplash cache to ensure all assets are loaded
  const [photos, setPhotos] = useState<GalleryPhoto[]>(() => {
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem('wedding_deleted_photos_v1') || '[]');
    } catch {}
    const deletedSet = new Set(deletedIds);

    try {
      localStorage.removeItem('wedding_photos');
      localStorage.removeItem('wedding_photos_v2');
      const saved = localStorage.getItem('wedding_photos_v4');
      if (saved) {
        const parsed: GalleryPhoto[] = JSON.parse(saved);
        // Only use if none are external unsplash links
        if (parsed.length > 0 && !parsed.some((p) => p.imageUrl.includes('unsplash.com'))) {
          return parsed.filter((p) => !deletedSet.has(p.id));
        }
      }
    } catch {}
    return INITIAL_GALLERY_PHOTOS.filter((p) => !deletedSet.has(p.id));
  });

  // Blessings State
  const [blessings, setBlessings] = useState<GuestBlessing[]>(() => {
    try {
      localStorage.removeItem('wedding_blessings');
      const saved = localStorage.getItem('wedding_blessings_v2');
      if (saved) {
        const parsed: GuestBlessing[] = JSON.parse(saved);
        return parsed.filter((b) => !['b-1', 'b-2', 'b-3'].includes(b.id));
      }
    } catch {}
    return [];
  });

  // RSVP Submissions
  const [rsvpList, setRsvpList] = useState<RSVPRecord[]>(() => {
    try {
      localStorage.removeItem('wedding_rsvp_list');
      const saved = localStorage.getItem('wedding_rsvp_list_v2');
      if (saved) {
        const parsed: RSVPRecord[] = JSON.parse(saved);
        return parsed.filter((r) => !['rsvp-seed-1', 'rsvp-seed-2'].includes(r.id));
      }
    } catch {}
    return [];
  });

  // Sync Theme with HTML Document Class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wedding_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wedding_theme', 'light');
    }
  }, [isDark]);

  // Sync Language
  useEffect(() => {
    localStorage.setItem('wedding_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Sync Photos & ensure stale unsplash cache is purged
  useEffect(() => {
    if (photos.some((p) => p.imageUrl.includes('unsplash.com'))) {
      setPhotos(INITIAL_GALLERY_PHOTOS);
      localStorage.setItem('wedding_photos_v4', JSON.stringify(INITIAL_GALLERY_PHOTOS));
    } else {
      localStorage.setItem('wedding_photos_v4', JSON.stringify(photos));
    }
  }, [photos]);

  // Real-time Guest Photos subscription from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToGuestPhotos((firestorePhotos) => {
      setPhotos((prev) => {
        const guestGalleryItems: GalleryPhoto[] = (firestorePhotos || []).map((fp) => ({
          id: fp.id,
          titleKm: fp.caption ? `«${fp.caption}»` : `រូបថតពី ${fp.uploadedBy}`,
          titleEn: fp.caption ? `"${fp.caption}"` : `Photo by ${fp.uploadedBy}`,
          subtitleKm: `បានចែករំលែកដោយ ${fp.uploadedBy}`,
          subtitleEn: `Shared by ${fp.uploadedBy}`,
          category: 'guest',
          locationKm: 'គេហដ្ឋានខាងកូនក្រមុំ (ភូមិពាក់ស្នែងថ្មី)',
          locationEn: 'Bride Residence (Peaksneng Tmey)',
          imageUrl: fp.imageUrl,
          likes: fp.likes || 1,
          isLiked: false,
          badge: 'Guest Memory',
          uploadedBy: fp.uploadedBy
        }));

        const officialPhotos = prev.filter((p) => p.category !== 'guest');
        const firestoreIds = new Set(guestGalleryItems.map((g) => g.id));
        const localOnlyGuestPhotos = prev.filter(
          (p) =>
            p.category === 'guest' &&
            (p.id.startsWith('local-') || p.id.startsWith('photo-')) &&
            !firestoreIds.has(p.id)
        );

        return [...officialPhotos, ...guestGalleryItems, ...localOnlyGuestPhotos];
      });
    });

    return () => unsubscribe();
  }, []);

  // Sync Blessings
  useEffect(() => {
    localStorage.setItem('wedding_blessings_v2', JSON.stringify(blessings));
  }, [blessings]);

  // Sync RSVP
  useEffect(() => {
    localStorage.setItem('wedding_rsvp_list_v2', JSON.stringify(rsvpList));
  }, [rsvpList]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleToggleMusic = () => {
    setIsPlayingMusic((prev) => {
      const next = !prev;
      const audioEl = document.getElementById('wedding-main-audio') as HTMLAudioElement | null;
      if (audioEl) {
        if (next) {
          audioEl.play().catch(() => {});
        } else {
          audioEl.pause();
        }
      }
      return next;
    });
  };

  const handlePlayMusic = () => {
    setIsPlayingMusic(true);
    const audioEl = document.getElementById('wedding-main-audio') as HTMLAudioElement | null;
    if (audioEl && audioEl.paused) {
      audioEl.play().catch(() => {});
    }
  };

  const handleTogglePetals = () => {
    setPetalsEnabled((prev) => !prev);
  };

  // Add new blessing
  const handleAddBlessing = (message: string, name?: string, photoUrl?: string) => {
    const authorName = name?.trim() || (lang === 'km' ? 'ភ្ញៀវកិត្តិយស (Honored Guest)' : 'Honored Guest');
    const newBlessing: GuestBlessing = {
      id: `blessing-${Date.now()}`,
      name: authorName,
      message,
      timestamp: lang === 'km' ? 'ទើបតែផ្ញើ' : 'Just now',
      likes: 1,
      isLiked: true,
      photoUrl
    };
    setBlessings((prev) => [newBlessing, ...prev]);

    // Live persistence to Firestore Messages
    sendWeddingMessage({
      senderName: newBlessing.name,
      message: newBlessing.message,
      photoUrl: newBlessing.photoUrl
    }).catch((err) => console.warn('Firestore message sync note:', err));

    // Also store attached photo into Guest Photos Collection
    if (photoUrl) {
      uploadGuestPhotoToFirestore({
        imageUrl: photoUrl,
        uploadedBy: authorName,
        caption: message
      }).catch((err) => console.warn('Guest photo sync note:', err));
    }
  };

  // Like a blessing
  const handleToggleBlessingLike = (id: string) => {
    setBlessings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isLiked = !item.isLiked;
          return {
            ...item,
            isLiked,
            likes: isLiked ? item.likes + 1 : Math.max(0, item.likes - 1)
          };
        }
        return item;
      })
    );
  };

  // Like a gallery photo
  const handleTogglePhotoLike = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((photo) => {
        if (photo.id === photoId) {
          const isLiked = !photo.isLiked;
          if (isLiked) {
            likeGuestPhotoInFirestore(photoId);
          }
          return {
            ...photo,
            isLiked,
            likes: isLiked ? photo.likes + 1 : Math.max(0, photo.likes - 1)
          };
        }
        return photo;
      })
    );
  };

  // Upload a photo
  const handleUploadPhoto = (newPhotoData: Partial<GalleryPhoto>) => {
    const author = newPhotoData.uploadedBy || (lang === 'km' ? 'ភ្ញៀវកិត្តិយស' : 'Honored Guest');
    const tempId = `local-${Date.now()}`;
    const newPhoto: GalleryPhoto = {
      id: tempId,
      titleKm: newPhotoData.titleKm || 'រូបថតពីភ្ញៀវ',
      titleEn: newPhotoData.titleEn || 'Guest Photo',
      subtitleKm: newPhotoData.subtitleKm || `បានចែករំលែកដោយ ${author}`,
      subtitleEn: newPhotoData.subtitleEn || `Shared by ${author}`,
      category: 'guest',
      locationKm: newPhotoData.locationKm || 'គេហដ្ឋានខាងកូនក្រមុំ (ភូមិពាក់ស្នែងថ្មី)',
      locationEn: newPhotoData.locationEn || 'Bride Residence (Peaksneng Tmey)',
      imageUrl: newPhotoData.imageUrl || '',
      likes: 1,
      isLiked: true,
      badge: newPhotoData.badge || 'Guest Memory',
      uploadedBy: author,
      filter: newPhotoData.filter
    };
    setPhotos((prev) => [newPhoto, ...prev]);

    // Save to Firestore Storage Collection for Guest Photos
    if (newPhoto.imageUrl) {
      uploadGuestPhotoToFirestore({
        imageUrl: newPhoto.imageUrl,
        uploadedBy: author,
        caption: newPhotoData.titleKm || ''
      })
        .then((savedId) => {
          if (savedId && !savedId.startsWith('local-')) {
            setPhotos((prev) => {
              const alreadySynced = prev.some((p) => p.id === savedId);
              if (alreadySynced) {
                return prev.filter((p) => p.id !== tempId);
              }
              return prev.map((p) => (p.id === tempId ? { ...p, id: savedId } : p));
            });
          }
        })
        .catch((err) => console.warn('Guest photo sync note:', err));
    }
  };

  // Admin: Delete a gallery photo (Firestore + local state)
  const handleDeletePhoto = async (photoId: string) => {
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }
    await deleteGuestPhotoFromFirestore(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    if (photoId.startsWith('prewed-') || photoId.startsWith('local-') || photoId.startsWith('photo-')) {
      try {
        const existingDeleted = JSON.parse(localStorage.getItem('wedding_deleted_photos_v1') || '[]') as string[];
        if (!existingDeleted.includes(photoId)) {
          localStorage.setItem('wedding_deleted_photos_v1', JSON.stringify([...existingDeleted, photoId]));
        }
      } catch {}
    }
  };

  const handleAdminSignIn = async () => {
    await signInWithGoogle();
  };

  const handleAdminSignOut = async () => {
    await logoutUser();
  };

  // Add RSVP submission
  const handleAddRSVP = (record: RSVPRecord) => {
    setRsvpList((prev) => [record, ...prev]);
    // Save to Firestore
    saveRSVPToFirestore(record);

    // Save to SheetDB (Google Sheet)
    postSheetRSVP({
      name: record.name,
      phone: record.phone,
      attendance: record.attending,
      guestCount: record.guestCount,
      diet: record.diet,
      blessing: record.blessing,
      photoUrl: record.photoUrl
    }).catch((err) => console.warn('SheetDB RSVP sync notice:', err));

    // Also add to guest blessings
    if (record.blessing || record.photoUrl) {
      handleAddBlessing(
        record.blessing || (lang === 'km' ? 'សូមជូនពរឱ្យមានសុភមង្គល និងស្រឡាញ់គ្នាជារៀងរហូត!' : 'Wishing you eternal happiness and unconditional love!'),
        record.name,
        record.photoUrl
      );
    }
    // Also add to Gallery under 'guest' category
    if (record.photoUrl) {
      handleUploadPhoto({
        titleKm: `រូបថតពីភ្ញៀវ៖ ${record.name}`,
        titleEn: `Guest Photo: ${record.name}`,
        subtitleKm: record.blessing || 'ឆ្លើយតបការចូលរួម (RSVP Confirmation)',
        subtitleEn: record.blessing || 'Wedding RSVP Confirmation',
        category: 'guest',
        locationKm: 'គេហដ្ឋានខាងកូនក្រមុំ (ភូមិពាក់ស្នែងថ្មី)',
        locationEn: 'Bride Residence (Peaksneng Tmey)',
        imageUrl: record.photoUrl,
        uploadedBy: record.name,
        badge: 'Guest Reply'
      });
    }
  };

  // Add to Calendar (.ics export + Google Calendar)
  const handleSaveToCalendar = () => {
    const title = 'ពិធីអាពាហ៍ពិពាហ៍ ម៉ៅ ហុង & ង៉ិក រស្មី | Wedding of Mao Hong & Ngek ReakSmey';
    const description = 'We cordially invite you to celebrate our sacred wedding union at គេហដ្ឋានខាងកូនក្រមុំ (ភូមិពាក់ស្នែងថ្មី) Peaksneng Tmey Village Angkor Thom Distict Siemreap Province.';
    const location = 'គេហដ្ឋានខាងកូនក្រមុំ (ភូមិពាក់ស្នែងថ្មី), Peaksneng Tmey Village Angkor Thom Distict Siemreap Province';
    const startDate = '20270317T000000Z'; // 17 March 2027
    const endDate = '20270317T160000Z';   // 17 March 2027

    // Google Calendar URL
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(
      location
    )}`;

    // Generate iCal (.ics) file
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mao Hong & Ngek ReakSmey Wedding//KH',
      'BEGIN:VEVENT',
      `UID:wedding-hong-reaksmey-${Date.now()}@hongreaksmey2027.com`,
      `DTSTAMP:${startDate}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Mao_Hong_Ngek_ReakSmey_Wedding_2027.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also open Google Calendar in new tab
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#122019] py-2 px-2 sm:px-4 flex flex-col items-center justify-between transition-colors duration-300">
      {/* Thin Fixed Scroll Progress Indicator at Top */}
      <ScrollProgress />

      {/* Falling Flower Petals Shower Effect */}
      <FallingPetals enabled={petalsEnabled} />

      {/* Main Responsive Frame: Continuous seamless scroll with no bottom nav buttons */}
      <div
        className={`w-full flex flex-col items-center flex-1 relative transition-all duration-300 ${
          isMobilePreview
            ? 'max-w-[420px] shadow-2xl rounded-[44px] border-8 border-stone-800 dark:border-stone-700 p-2 sm:p-3 my-4 bg-[#FCFBF7] dark:bg-[#1A2E24]'
            : 'max-w-[440px] md:max-w-3xl lg:max-w-4xl'
        }`}
      >
        {isMobilePreview && (
          <div className="w-28 h-4 bg-stone-800 rounded-full mb-2 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-700"></div>
          </div>
        )}

        {/* Top Control & Navigation Bar */}
        <TopHeader
          lang={lang}
          onLanguageChange={setLang}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          isPlayingMusic={isPlayingMusic}
          onToggleMusic={handleToggleMusic}
          onOpenMonogram={() => setIsMonogramModalOpen(true)}
          petalsEnabled={petalsEnabled}
          onTogglePetals={handleTogglePetals}
          isMobilePreview={isMobilePreview}
          onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        />

        {/* Continuous Flowing Wedding Invitation (All sections stacked vertically) */}
        <div className="w-full flex-1 mb-2">
          <HomeScreen
            lang={lang}
            onSaveToCalendar={handleSaveToCalendar}
            onOpenMonogramModal={() => setIsMonogramModalOpen(true)}
            photos={photos}
            onTogglePhotoLike={handleTogglePhotoLike}
            onUploadPhoto={handleUploadPhoto}
            onDeletePhoto={handleDeletePhoto}
            currentUserEmail={currentUser?.email || null}
            isAdmin={isAdmin}
            onAdminSignIn={handleAdminSignIn}
            onAdminSignOut={handleAdminSignOut}
            blessings={blessings}
            onAddBlessing={handleAddBlessing}
            onToggleBlessingLike={handleToggleBlessingLike}
            rsvpList={rsvpList}
            onAddRSVP={handleAddRSVP}
            onPlayMusic={handlePlayMusic}
            isMobilePreview={isMobilePreview}
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
          />
        </div>
      </div>

      {/* Monogram Seal Modal */}
      <MonogramSealModal
        isOpen={isMonogramModalOpen}
        onClose={() => setIsMonogramModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
