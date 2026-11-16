import React, { useEffect, useRef, useState } from 'react';

interface AudioPlayerProps {
  isPlaying: boolean;
  onToggle: () => void;
  lang: 'km' | 'en';
}

const DEFAULT_SONG_URL = '/assets/aistudio/Stay_with_Me_V2_Phiti_x_All3gy_77e4a7a0.mp3';
const DEFAULT_SONG_NAME = 'Stay with Me V2 - Phiti x All3gy.mp3';

const DB_NAME = 'WeddingMainSongDB';
const STORE_NAME = 'mainSongStore';
const SONG_KEY = 'stay_with_me_v2_custom_audio';

// IndexedDB Helper to persist user's custom replacement MP3 if uploaded
const saveAudioToDB = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE_NAME);
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(file, SONG_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
};

const getAudioFromDB = (): Promise<{ file: Blob; name: string } | null> => {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE_NAME);
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(SONG_KEY);
        getReq.onsuccess = () => {
          if (getReq.result) {
            const blob = getReq.result as Blob;
            const name = (getReq.result as File).name || DEFAULT_SONG_NAME;
            resolve({ file: blob, name });
          } else {
            resolve(null);
          }
        };
        getReq.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};

const deleteAudioFromDB = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(SONG_KEY);
        tx.oncomplete = () => resolve();
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ isPlaying, onToggle, lang }) => {
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeAudioUrl = customAudioUrl || DEFAULT_SONG_URL;

  // Load any user-replaced audio from IndexedDB on initial mount
  useEffect(() => {
    getAudioFromDB().then((data) => {
      if (data) {
        const url = URL.createObjectURL(data.file);
        setCustomAudioUrl(url);
      }
    });
  }, []);

  // Main playback engine for full MP3 song
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.volume = 0.85;
      audio.play().catch((err) => {
        console.warn('Audio playback notice:', err);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, activeAudioUrl]);

  return (
    <>
      {/* HTML5 Audio Element for the entire built-in song */}
      <audio
        id="wedding-main-audio"
        ref={audioRef}
        src={activeAudioUrl}
        preload="auto"
        loop
      />

      {/* Single Sleek Top Header Button without Popup Modal */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-label={lang === 'km' ? 'ចាក់បទចម្រៀងមង្គលការ' : 'Toggle Wedding Song'}
          title={
            lang === 'km'
              ? (isPlaying ? 'ផ្អាកតន្ត្រី' : 'ចាក់តន្ត្រីមង្គលការ')
              : (isPlaying ? 'Pause Wedding Music' : 'Play Wedding Music')
          }
          className={`w-7 h-7 rounded-full bg-white/90 dark:bg-[#1E2722]/90 backdrop-blur-md border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center text-[#295744] dark:text-[#C5A880] shadow-2xs hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ${
            isPlaying ? 'ring-1.5 ring-[#295744] dark:ring-[#C5A880] shadow-xs' : ''
          }`}
        >
          {isPlaying ? (
            <div className="flex items-end gap-[1.5px] h-2.5 px-0.5">
              <span className="w-[2px] bg-[#295744] dark:bg-[#C5A880] rounded-full inline-block animate-soundwave-1"></span>
              <span className="w-[2px] bg-[#295744] dark:bg-[#C5A880] rounded-full inline-block animate-soundwave-2"></span>
              <span className="w-[2px] bg-[#295744] dark:bg-[#C5A880] rounded-full inline-block animate-soundwave-3"></span>
            </div>
          ) : (
            <span className="material-symbols-outlined text-[15px]">music_note</span>
          )}
        </button>
      </div>
    </>
  );
};


