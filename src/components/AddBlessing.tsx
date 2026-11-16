import React, { useState, useRef } from 'react';
import { Language } from '../types';
import { compressImage } from '../utils/imageHelper';

export interface AddBlessingProps {
  onAddBlessing: (message: string, name?: string, photoUrl?: string) => Promise<boolean | void> | void;
  lang: Language;
  className?: string;
  isCompact?: boolean;
  placeholder?: string;
}

// Curated wedding-themed emojis categorized for guests
const WEDDING_EMOJI_CATEGORIES = [
  {
    id: 'wedding',
    titleKm: 'អាពាហ៍ពិពាហ៍',
    titleEn: 'Wedding',
    emojis: ['💍', '💒', '👰', '🤵', '🕊️', '💌', '🥂', '🍾', '🎂', '💐']
  },
  {
    id: 'love',
    titleKm: 'បេះដូង & ផ្កា',
    titleEn: 'Love & Flowers',
    emojis: ['💖', '❤️', '💕', '💓', '🪷', '🌹', '🌸', '🌺', '🌷', '✨']
  },
  {
    id: 'blessings',
    titleKm: 'សិរីសួស្តី & ពរជ័យ',
    titleEn: 'Blessings',
    emojis: ['🙏', '🎉', '🎊', '🥳', '🌟', '💫', '👑', '🧧', '🎁', '🎇']
  }
];

// Quick bar top emojis
const QUICK_EMOJIS = ['💍', '🪷', '💐', '🥂', '💖', '✨', '🙏', '💒', '🌹', '🕊️'];

// Predefined traditional Khmer & English wedding blessings
const QUICK_BLESSING_TEMPLATES = [
  {
    km: 'សូមជូនពរឱ្យមានសុភមង្គល និងស្រឡាញ់គ្នាដល់ចាស់កោងខ្នង! 💍❤️',
    en: 'Wishing you eternal happiness and everlasting love! 💍❤️'
  },
  {
    km: 'សូមឱ្យចំណងអាពាហ៍ពិពាហ៍នេះពោរពេញដោយសិរីសួស្តី និងភាពរុងរឿង! 🪷✨',
    en: 'May your sacred marriage be filled with endless peace and prosperity! 🪷✨'
  },
  {
    km: 'ជូនពរឱ្យស្រឡាញ់គ្នាជារៀងរហូត រួមសុខរួមទុក្ខជាមួយគ្នាពេញមួយជីវិត! 🥂💖',
    en: 'Wishing you a lifetime of joy, unity, and shared dreams! 🥂💖'
  },
  {
    km: 'អបអរសាទរថ្ងៃមង្គលការ ម៉ៅ ហុង & ង៉ិក រស្មី! សូមឱ្យគ្រួសារថ្មីមានសុខមាលភាពល្អ! 💐💒',
    en: 'Congratulations Hong & ReakSmey on your beautiful wedding day! 💐💒'
  }
];

export const AddBlessing: React.FC<AddBlessingProps> = ({
  onAddBlessing,
  lang,
  className = '',
  isCompact = false,
  placeholder
}) => {
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Insert emoji at cursor position or append
  const handleInsertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart ?? message.length;
      const end = textarea.selectionEnd ?? message.length;
      const newText = message.substring(0, start) + emoji + message.substring(end);
      setMessage(newText);

      // Re-focus and set cursor position after inserted emoji
      setTimeout(() => {
        textarea.focus();
        const nextPos = start + emoji.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }, 10);
    } else {
      setMessage((prev) => prev + emoji);
    }
  };

  // Select predefined template
  const handleSelectTemplate = (template: { km: string; en: string }) => {
    const textToInsert = lang === 'km' ? template.km : template.en;
    setMessage(textToInsert);
    setShowTemplates(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Compress & upload photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImage(file, 900, 900, 0.78);
      setPhotoUrl(compressed);
    } catch (err) {
      console.error('Failed to attach blessing photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const finalName = senderName.trim() || (lang === 'km' ? 'ភ្ញៀវកិត្តិយស' : 'Honored Guest');
      const finalWish = message.trim();
      const finalPhoto = photoUrl.trim() || undefined;

      await onAddBlessing(finalWish, finalName, finalPhoto);

      setMessage('');
      setSenderName('');
      setPhotoUrl('');
      setShowEmojiPicker(false);
      setShowTemplates(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err) {
      console.error('Error submitting blessing:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultPlaceholder =
    placeholder ||
    (lang === 'km'
      ? 'សូមសរសេរពាក្យជូនពរដល់គូស្វាមីភរិយាថ្មី ម៉ៅ ហុង & ង៉ិក រស្មី...'
      : 'Write your blessings to Hong & ReakSmey...');

  return (
    <div
      className={`bg-white/95 dark:bg-[#1E2722]/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#C5A880]/40 dark:border-stone-700 shadow-sm relative ${className}`}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Guest Name input */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFF8ED] to-[#F5E6CC] dark:from-[#26322B] dark:to-[#1E2722] border border-[#C5A880]/50 flex items-center justify-center text-[#295744] dark:text-[#C5A880] shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-[16px]">person</span>
          </div>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder={lang === 'km' ? 'ឈ្មោះលោកអ្នក (Your Name)' : 'Your Name'}
            className="flex-1 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl py-1.5 px-3 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#295744] dark:focus:ring-[#C5A880] font-khmer transition-all"
          />
        </div>

        {/* Message Input Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            required
            rows={isCompact ? 2 : 3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={defaultPlaceholder}
            className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl py-2.5 px-3.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#295744] dark:focus:ring-[#C5A880] font-khmer resize-none leading-relaxed transition-all"
          />

          {/* Quick Emoji Bar (Row above controls) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
            <span className="text-[10px] text-stone-400 font-khmer shrink-0 mr-1 hidden sm:inline">
              {lang === 'km' ? 'ជ្រើស Emoji:' : 'Add Emoji:'}
            </span>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800/80 hover:bg-[#FFF8ED] dark:hover:bg-[#26322B] text-sm flex items-center justify-center transition-transform hover:scale-115 active:scale-95 shrink-0 shadow-2xs cursor-pointer border border-transparent hover:border-[#C5A880]/50"
                title={`Add ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Photo Attachment Preview if present */}
        {photoUrl && (
          <div className="flex items-center gap-2 p-2 bg-[#FFF8ED] dark:bg-[#26322B] rounded-xl border border-[#C5A880]/40">
            <img
              src={photoUrl}
              alt="Attached photo"
              className="w-10 h-10 rounded-lg object-cover border border-[#C5A880]/50 shadow-xs"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-khmer font-semibold text-[#295744] dark:text-[#C5A880] block truncate">
                {lang === 'km' ? '✓ បានភ្ជាប់រូបភាពជូនពរ' : '✓ Photo attached'}
              </span>
              <span className="text-[9px] text-stone-500 block truncate">
                {lang === 'km' ? 'រូបភាពនឹងត្រូវបង្ហាញជាមួយសារជូនពរ' : 'Will display with your blessing message'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPhotoUrl('')}
              className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 flex items-center justify-center hover:bg-rose-200 transition-colors cursor-pointer"
              title="Remove photo"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}

        {/* Wedding Emoji Picker Tray (Collapsible Popover) */}
        {showEmojiPicker && (
          <div className="p-3 bg-stone-50 dark:bg-stone-800/95 rounded-2xl border border-[#C5A880]/50 shadow-md space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-1.5">
              <span className="text-xs font-khmer font-bold text-[#295744] dark:text-[#C5A880] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">sentiment_satisfied</span>
                <span>{lang === 'km' ? 'ផ្ទាំង Emoji មង្គលការ' : 'Wedding Emoji Picker'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {WEDDING_EMOJI_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-1">
                <span className="text-[10px] font-khmer font-semibold text-stone-500 dark:text-stone-400 block">
                  {lang === 'km' ? category.titleKm : category.titleEn}
                </span>
                <div className="grid grid-cols-10 gap-1">
                  {category.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-stone-700 hover:bg-[#FFF8ED] dark:hover:bg-[#26322B] text-base flex items-center justify-center transition-transform hover:scale-120 active:scale-95 shadow-2xs cursor-pointer border border-stone-200/60 dark:border-stone-600"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Predefined Blessing Templates (Collapsible) */}
        {showTemplates && (
          <div className="p-3 bg-stone-50 dark:bg-stone-800/95 rounded-2xl border border-[#C5A880]/50 shadow-md space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-1.5">
              <span className="text-xs font-khmer font-bold text-[#295744] dark:text-[#C5A880] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">auto_stories</span>
                <span>{lang === 'km' ? 'ពាក្យជូនពរគំរូ' : 'Blessing Templates'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="space-y-1.5">
              {QUICK_BLESSING_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="w-full text-left p-2 rounded-xl bg-white dark:bg-stone-700/80 hover:bg-[#FFF8ED] dark:hover:bg-[#26322B] text-[11px] font-khmer text-stone-700 dark:text-stone-200 border border-stone-200/70 dark:border-stone-600 transition-colors cursor-pointer"
                >
                  {lang === 'km' ? tmpl.km : tmpl.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar & Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1">
            {/* Toggle Full Emoji Picker */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker((prev) => !prev);
                setShowTemplates(false);
              }}
              title={lang === 'km' ? 'បើកផ្ទាំង Emoji ជូនពរ' : 'Open Emoji Picker'}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1 cursor-pointer text-xs ${
                showEmojiPicker
                  ? 'bg-[#295744] text-white border-[#295744]'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">mood</span>
              <span className="text-[10px] font-khmer hidden sm:inline">
                {lang === 'km' ? 'Emoji' : 'Emojis'}
              </span>
            </button>

            {/* Template Presets */}
            <button
              type="button"
              onClick={() => {
                setShowTemplates((prev) => !prev);
                setShowEmojiPicker(false);
              }}
              title={lang === 'km' ? 'ជ្រើសរើសពាក្យជូនពរគំរូ' : 'Choose blessing preset'}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1 cursor-pointer text-xs ${
                showTemplates
                  ? 'bg-[#295744] text-white border-[#295744]'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">format_quote</span>
              <span className="text-[10px] font-khmer hidden sm:inline">
                {lang === 'km' ? 'ពាក្យគំរូ' : 'Presets'}
              </span>
            </button>

            {/* Photo Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto || isSubmitting}
              title={lang === 'km' ? 'ភ្ជាប់រូបថត ឬ Selfie' : 'Attach photo or selfie'}
              className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <span className="material-symbols-outlined text-[17px]">
                {isUploadingPhoto ? 'hourglass_top' : 'add_photo_alternate'}
              </span>
              <span className="text-[10px] font-khmer hidden sm:inline">
                {isUploadingPhoto ? 'កំពុងបញ្ចូល...' : lang === 'km' ? 'រូបថត' : 'Photo'}
              </span>
            </button>
          </div>

          {/* Submit Blessing Button */}
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#295744] to-[#3C735B] hover:from-[#3C735B] hover:to-[#295744] text-white font-khmer font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer border border-[#C5A880]/40"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>
              {isSubmitting
                ? lang === 'km' ? 'កំពុងផ្ញើ...' : 'Sending...'
                : lang === 'km' ? 'ផ្ញើពាក្យជូនពរ' : 'Send Blessing'}
            </span>
          </button>
        </div>

        {/* Success Alert */}
        {showSuccess && (
          <div className="py-2 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-[#295744] dark:text-emerald-300 font-khmer flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">
              check_circle
            </span>
            <span>
              {lang === 'km'
                ? 'សូមអរគុណយ៉ាងជ្រាលជ្រៅសម្រាប់ពាក្យជូនពរដ៏មានអត្ថន័យ!'
                : 'Thank you so much for your heartfelt blessing!'}
            </span>
          </div>
        )}
      </form>
    </div>
  );
};
