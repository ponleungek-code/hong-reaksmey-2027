import React from 'react';
import { Language } from '../types';

interface MonogramSealModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const MonogramSealModal: React.FC<MonogramSealModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-[#C5A880]/40 bg-[#0d402e] text-[#C5A880] p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-stone-200 hover:text-white flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Ambient Golden Glitter Dust */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Subtitle */}
        <div className="relative z-10 pt-2 mb-4">
          <p className="font-display tracking-[0.25em] text-xs uppercase text-[#C5A880]/80">
            {lang === 'km' ? 'ត្រាមង្គលអាពាហ៍ពិពាហ៍' : 'Official Wedding Monogram'}
          </p>
          <h3 className="font-khmer text-lg text-white font-semibold mt-1">
            {lang === 'km' ? 'ម៉ៅ ហុង & ង៉ិក រស្មី' : 'Mao Hong & Ngek ReakSmey'}
          </h3>
        </div>

        {/* Central Official Monogram Artwork */}
        <div className="relative z-10 mx-auto my-6 w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-[#FFF8ED] dark:bg-[#1A2E24] border-2 border-[#C5A880]/60 shadow-2xl flex items-center justify-center p-3 overflow-hidden">
          <img
            src="/assets/aistudio/LogoHR_99376cce.png"
            alt="Official Golden Monogram Mao Hong & Ngek ReakSmey"
            className="w-full h-full object-contain rounded-2xl drop-shadow-[0_8px_20px_rgba(197,168,128,0.35)]"
          />
        </div>

        {/* Description & Action */}
        <p className="relative z-10 text-xs font-body-sm text-[#C5A880]/90 leading-relaxed px-2 font-khmer">
          {lang === 'km'
            ? 'ត្រាអក្សរកាត់តំណាងឱ្យចំណងស្នេហាអមតៈរវាង ម៉ៅ ហុង និង ង៉ិក រស្មី ផ្កាកុលាប និងផ្កាឈូកមាសតំណាងឱ្យភាពបរិសុទ្ធ និងភាពរីកចម្រើន។'
            : 'The official golden monogram symbolizes the sacred eternal union of Mao Hong & Ngek ReakSmey, adorned with white roses and golden florals.'}
        </p>

        <div className="relative z-10 mt-5 pt-3 border-t border-[#C5A880]/30 flex items-center justify-center gap-3">
          <a
            href="/assets/aistudio/LogoHR_99376cce.png"
            download="Hong_ReakSmey_Wedding_Logo.png"
            className="px-5 py-2.5 rounded-xl bg-[#C5A880] text-[#0d402e] font-semibold text-xs flex items-center gap-2 hover:bg-[#d4af37] transition-colors shadow-md cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>{lang === 'km' ? 'ទាញយកត្រាមង្គល' : 'Download Logo Keepsake'}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
