import React from 'react';
import { Language, Screen } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface TopHeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isPlayingMusic: boolean;
  onToggleMusic: () => void;
  onOpenMonogram: () => void;
  petalsEnabled: boolean;
  onTogglePetals: () => void;
  currentScreen?: Screen;
  onNavigate?: (screen: Screen) => void;
  isMobilePreview?: boolean;
  onToggleMobilePreview?: () => void;
  onOpenGiftModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  lang,
  onLanguageChange,
  isDark,
  onToggleTheme,
  isPlayingMusic,
  onToggleMusic,
  onOpenMonogram,
  petalsEnabled,
  onTogglePetals,
  currentScreen = 'home',
  onNavigate,
  isMobilePreview = false,
  onToggleMobilePreview,
  onOpenGiftModal,
}) => {
  const scrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navSections = [
    { targetId: 'hero-invitation', labelKm: 'ទំព័រដើម', labelEn: 'Home' },
    { targetId: 'ceremony-section', labelKm: 'កម្មវិធីមង្គល', labelEn: 'Ceremony' },
    { targetId: 'story-section', labelKm: 'រឿងរ៉ាវ', labelEn: 'Story' },
    { targetId: 'gallery-section', labelKm: 'រូបថត', labelEn: 'Gallery' },
    { targetId: 'gift-section', labelKm: 'អំណោយ', labelEn: 'Gift' },
    { targetId: 'rsvp-section', labelKm: 'ឆ្លើយតប (RSVP)', labelEn: 'RSVP' },
    { targetId: 'location-section', labelKm: 'ទីតាំង', labelEn: 'Venue' },
  ];

  return (
    <header className="w-full flex items-center justify-between px-2.5 sm:px-5 py-2 mb-2 text-xs tracking-wider z-30 transition-all sticky top-0 bg-[#F7F5F0]/90 dark:bg-[#122019]/90 backdrop-blur-md rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-2xs">
      {/* Left Zone: Brand Mark & Bilingual Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Brand Wordmark & Official Crest Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => scrollTo('hero-invitation')}
          title={lang === 'km' ? 'ទៅកាន់ទំព័រដើម' : 'Back to top'}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#C5A880] bg-[#FFF8ED] dark:bg-[#1A2E24] p-0.5 shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
            <img
              src="/assets/aistudio/LogoHR_99376cce.png"
              alt="Hong & ReakSmey Wedding Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="hidden sm:block">
            <span className="font-khmer font-bold text-xs tracking-wide text-[#295744] dark:text-[#C5A880] block leading-none">
              {lang === 'km' ? 'ម៉ៅ ហុង & ង៉ិក រស្មី' : 'Mao Hong & Ngek ReakSmey'}
            </span>
            <span className="text-[9px] text-stone-500 font-khmer block mt-0.5">
              17 មីនា 2027 • ពិធីអាពាហ៍ពិពាហ៍
            </span>
          </div>
        </div>

        {/* Bilingual Switcher */}
        <div className="inline-flex items-center p-0.5 bg-white/80 dark:bg-[#1A2E24]/80 backdrop-blur-md rounded-full shadow-2xs border border-stone-200/80 dark:border-stone-700">
          <button
            type="button"
            onClick={() => onLanguageChange('km')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-khmer font-semibold transition-all duration-200 cursor-pointer ${
              lang === 'km'
                ? 'bg-[#295744] text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            ខ្មែរ
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-0.5 rounded-full text-[10px] font-modern font-medium transition-all duration-200 cursor-pointer ${
              lang === 'en'
                ? 'bg-[#295744] text-white shadow-2xs font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Middle Zone: Desktop Anchor Links */}
      {!isMobilePreview && (
        <nav className="hidden md:flex items-center gap-1 p-0.5 bg-white/70 dark:bg-[#1A2E24]/70 backdrop-blur-md rounded-full border border-stone-200/70 dark:border-stone-700 shadow-2xs">
          {navSections.map((item) => (
            <button
              key={item.targetId}
              type="button"
              onClick={() => scrollTo(item.targetId)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:text-[#295744] dark:hover:text-[#C5A880] hover:bg-stone-100 dark:hover:bg-stone-800 transition-all font-khmer cursor-pointer"
            >
              {lang === 'km' ? item.labelKm : item.labelEn}
            </button>
          ))}
        </nav>
      )}

      {/* Right Zone: Control Buttons Cluster */}
      <div className="flex items-center space-x-1 sm:space-x-1.5">
        {/* Gift Button with QR Code & Bank Accounts */}
        <button
          type="button"
          onClick={() => scrollTo('gift-section')}
          aria-label={lang === 'km' ? 'អំណោយ & QR Code' : 'Wedding Gift & KHQR'}
          title={lang === 'km' ? 'អំណោយ (QR Code & លេខកុងធនាគារ)' : 'Wedding Gift & KHQR'}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-50 to-rose-50 dark:from-[#233F31] dark:to-[#1A2E24] border border-[#C5A880]/70 flex items-center justify-center text-[#c1121f] dark:text-[#E8B2B5] shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">redeem</span>
        </button>

        {/* Audio Melodies */}
        <AudioPlayer isPlaying={isPlayingMusic} onToggle={onToggleMusic} lang={lang} />

        {/* Theme Switcher (Light / Dark Mode) */}
        <div className="inline-flex items-center p-0.5 bg-white/80 dark:bg-[#1A2E24]/80 backdrop-blur-md rounded-full shadow-2xs border border-stone-200/80 dark:border-[#C5A880]/40">
          <button
            type="button"
            onClick={() => isDark && onToggleTheme()}
            aria-label={lang === 'km' ? 'ទម្រង់ពន្លឺ' : 'Light Mode'}
            title={lang === 'km' ? 'ទម្រង់ពន្លឺ (Light Mode)' : 'Light Mode'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-200 cursor-pointer ${
              !isDark
                ? 'bg-[#FFF8ED] text-[#295744] shadow-2xs border border-[#C5A880]/60'
                : 'text-stone-400 dark:text-[#E8F0DC] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] text-amber-500">light_mode</span>
            <span className="hidden sm:inline font-khmer text-[10px]">{lang === 'km' ? 'ពន្លឺ' : 'Light'}</span>
          </button>
          <button
            type="button"
            onClick={() => !isDark && onToggleTheme()}
            aria-label={lang === 'km' ? 'ទម្រង់រាត្រី' : 'Dark Mode'}
            title={lang === 'km' ? 'ទម្រង់រាត្រី (Dark Mode)' : 'Dark Mode'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-200 cursor-pointer ${
              isDark
                ? 'bg-[#233F31] text-[#C5A880] shadow-2xs border border-[#C5A880]/80'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="material-symbols-outlined text-[13px] text-[#C5A880]">dark_mode</span>
            <span className="hidden sm:inline font-khmer text-[10px] font-bold">{lang === 'km' ? 'រាត្រី' : 'Dark'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
