import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPickerReact from 'emoji-picker-react';
import { Smile, X } from 'lucide-react';

const EmojiPicker = ({ onEmojiSelect, isOpen, onToggle, position = 'top' }) => {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onToggle(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const handleEmojiClick = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    onToggle(false);
  };

  return (
    <div className="relative">
      {/* Emoji Button */}
      <button
        type="button"
        onClick={() => onToggle(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          isOpen 
            ? 'bg-rose-100 text-rose-600' 
            : 'hover:bg-gray-100 text-gray-500'
        }`}
      >
        <Smile className="w-5 h-5" />
      </button>

      {/* Emoji Picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 ${
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
            } right-0`}
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Choose an emoji</h3>
                <button
                  onClick={() => onToggle(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <EmojiPickerReact
                onEmojiClick={handleEmojiClick}
                width={320}
                height={400}
                previewConfig={{ showPreview: false }}
                searchPlaceHolder="Search emojis..."
                skinTonesDisabled={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmojiPicker;
      
