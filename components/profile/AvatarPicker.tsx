'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { storage, db } from '@/lib/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';

// Types
export interface AvatarData {
  avatarType: 'emoji' | 'upload' | 'generated';
  avatarEmoji?: string;
  avatarColor?: string;
  avatarUrl?: string;
}

interface AvatarPickerProps {
  onSelect: (avatar: AvatarData) => void;
  currentAvatar?: AvatarData;
  onClose: () => void;
}

interface UserAvatarProps {
  user: any;
  size?: number;
  showStatus?: boolean;
  className?: string;
}

// Avatar Categories with Emojis
const AVATAR_CATEGORIES = {
  animals: {
    label: 'Animals',
    emojis: ['🐻', '🐼', '🦁', '🐯', '🐮', '🐷', '🐸', '🐰', '🐺', '🦊'],
  },
  space: {
    label: 'Space',
    emojis: ['🚀', '🛸', '🌙', '⭐', '🌟', '💫', '🪐', '☄️', '🌠', '👨‍🚀'],
  },
  food: {
    label: 'Food',
    emojis: ['🍕', '🍔', '🍟', '🌮', '🍜', '🍱', '🍰', '🍪', '🍩', '🍦'],
  },
  sports: {
    label: 'Sports',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏒', '🏑', '🏓', '🥊'],
  },
  nature: {
    label: 'Nature',
    emojis: ['🌲', '🌴', '🌵', '🌾', '💐', '🌻', '🌷', '🌹', '🥀', '🍀'],
  },
  tech: {
    label: 'Tech',
    emojis: ['💻', '📱', '⌨️', '🖥️', '📡', '💾', '🔌', '🔋', '⚡', '🎮'],
  },
};

// Gradient Colors for Generated Avatars
const GRADIENT_COLORS = [
  { from: '#FF6B6B', to: '#FFE66D' }, // Red to Yellow
  { from: '#4ECDC4', to: '#44A08D' }, // Teal to Green
  { from: '#A8E6CF', to: '#FFD3B6' }, // Mint to Peach
  { from: '#FF8B94', to: '#FF6B9D' }, // Pink
  { from: '#C44569', to: '#5F27CD' }, // Red to Purple
  { from: '#00D4FF', to: '#7928CA' }, // Cyan to Purple
  { from: '#FFB347', to: '#FFA500' }, // Orange
  { from: '#FF69B4', to: '#FF1493' }, // Hot Pink
  { from: '#32CD32', to: '#00FF7F' }, // Lime Green
  { from: '#FF4500', to: '#FF6347' }, // Red Orange
  { from: '#1E90FF', to: '#00BFFF' }, // Dodger Blue
  { from: '#FFD700', to: '#FFA500' }, // Gold Orange
  { from: '#9370DB', to: '#DDA0DD' }, // Purple Plum
  { from: '#20B2AA', to: '#48D1CC' }, // Teal Turquoise
  { from: '#FF7F50', to: '#FF6347' }, // Coral
];

// Utility function to generate consistent gradient from user ID
const getGradientForUser = (userId: string) => {
  const hash = userId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
};

// Utility function to generate initials
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

// Utility function to compress image
const compressImage = async (
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.8);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
};

// Generated Avatar Component
const GeneratedAvatar: React.FC<{
  initials: string;
  gradient: { from: string; to: string };
}> = ({ initials, gradient }) => (
  <div className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center">
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="avatarGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" style={{ stopColor: gradient.from }} />
          <stop offset="100%" style={{ stopColor: gradient.to }} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="100" fill="url(#avatarGradient)" />
    </svg>
    <span className="relative z-10 text-2xl font-bold text-white drop-shadow-md">
      {initials}
    </span>
  </div>
);

// Main AvatarPicker Component
export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  onSelect,
  currentAvatar,
  onClose,
}) => {
  const { user } = useAuth();
  const { dark: isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<
    'emoji' | 'upload' | 'generated'
  >('emoji');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
    currentAvatar?.avatarEmoji || null
  );
  const [preview, setPreview] = useState<string | null>(
    currentAvatar?.avatarUrl || null
  );

  const handleEmojiSelect = async (emoji: string) => {
    setSelectedEmoji(emoji);
    const avatarData: AvatarData = {
      avatarType: 'emoji',
      avatarEmoji: emoji,
    };
    onSelect(avatarData);

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          avatar: avatarData,
        });
      } catch (error) {
        console.error('Failed to update avatar:', error);
      }
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Compress image
      const compressed = await compressImage(file);
      setUploadProgress(25);

      // Delete old avatar if exists
      if (currentAvatar?.avatarUrl && currentAvatar?.avatarType === 'upload') {
        try {
          const oldRef = ref(storage, currentAvatar.avatarUrl);
          await deleteObject(oldRef);
        } catch (err) {
          console.warn('Failed to delete old avatar:', err);
        }
      }

      // Upload new avatar
      const storageRef = ref(
        storage,
        `avatars/${user.uid}/${Date.now()}-${file.name}`
      );
      await uploadBytes(storageRef, compressed);
      setUploadProgress(75);

      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      setUploadProgress(100);

      const avatarData: AvatarData = {
        avatarType: 'upload',
        avatarUrl: downloadUrl,
      };

      setPreview(downloadUrl);
      onSelect(avatarData);

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        avatar: avatarData,
      });

      setTimeout(() => setUploading(false), 500);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!user) return;

    const initials = getInitials(user.displayName || user.email || 'User');
    const gradient = getGradientForUser(user.uid);

    const avatarData: AvatarData = {
      avatarType: 'generated',
      avatarColor: gradient.from,
    };

    onSelect(avatarData);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        avatar: avatarData,
      });
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  };

  const bgClass = isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const textClass = isDark ? 'text-slate-100' : 'text-slate-900';
  const tabActiveClass = isDark
    ? 'bg-blue-600 text-white'
    : 'bg-blue-500 text-white';
  const tabInactiveClass = isDark
    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200';

  return (
    <div className={`rounded-lg border ${bgClass} p-6 max-w-md w-full`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold ${textClass}`}>Choose Your Avatar</h2>
        <button
          onClick={onClose}
          className={`text-xl font-bold hover:opacity-70 transition-opacity ${textClass}`}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('emoji')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'emoji' ? tabActiveClass : tabInactiveClass
          }`}
        >
          Emoji
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'upload' ? tabActiveClass : tabInactiveClass
          }`}
        >
          Upload
        </button>
        <button
          onClick={() => setActiveTab('generated')}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
            activeTab === 'generated' ? tabActiveClass : tabInactiveClass
          }`}
        >
          Generate
        </button>
      </div>

      {/* Emoji Tab */}
      {activeTab === 'emoji' && (
        <div className="space-y-6">
          {Object.entries(AVATAR_CATEGORIES).map(([key, category]) => (
            <div key={key}>
              <h3 className={`text-sm font-semibold mb-3 ${textClass}`}>
                {category.label}
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
                      selectedEmoji === emoji
                        ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                        : 'hover:scale-105 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDark
                ? 'border-slate-600 hover:bg-slate-800'
                : 'border-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-2">📸</div>
            <p className={`font-medium ${textClass}`}>
              Click to upload or drag and drop
            </p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Max 200x200px (compressed automatically)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p
                className={`text-sm text-center ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {preview && !uploading && (
            <div className="flex justify-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500">
                <Image
                  src={preview}
                  alt="Avatar preview"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Tab */}
      {activeTab === 'generated' && (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <GeneratedAvatar
              initials={getInitials(user?.displayName || user?.email || 'U')}
              gradient={getGradientForUser(user?.uid || 'default')}
            />
          </div>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            A unique avatar based on your name initials and a vibrant gradient
            pattern.
          </p>
          <button
            onClick={handleGenerateAvatar}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all"
          >
            ✨ Generate My Avatar
          </button>
        </div>
      )}

      {/* Footer */}
      <div className={`text-xs text-center mt-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        Your avatar will be saved to your profile
      </div>
    </div>
  );
};

// UserAvatar Component (Reusable)
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 40,
  showStatus = false,
  className = '',
}) => {
  const [gradient, setGradient] = React.useState<{
    from: string;
    to: string;
  } | null>(null);

  React.useEffect(() => {
    if (user?.uid) {
      setGradient(getGradientForUser(user.uid));
    }
  }, [user?.uid]);

  if (!user) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`rounded-full bg-slate-300 ${className}`}
      />
    );
  }

  const avatar = user.avatar as AvatarData | undefined;
  const initials = getInitials(user.displayName || user.email || 'U');

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Avatar Content */}
      <div
        style={{ width: size, height: size }}
        className="rounded-full overflow-hidden flex items-center justify-center font-semibold text-white bg-slate-300 dark:bg-slate-700 flex-shrink-0"
      >
        {avatar?.avatarType === 'upload' && avatar.avatarUrl && (
          <Image
            src={avatar.avatarUrl}
            alt={user.displayName || 'User'}
            width={size}
            height={size}
            className="w-full h-full object-cover"
            priority={false}
          />
        )}

        {avatar?.avatarType === 'emoji' && avatar.avatarEmoji ? (
          <span style={{ fontSize: `${size * 0.5}px` }}>
            {avatar.avatarEmoji}
          </span>
        ) : avatar?.avatarType === 'generated' && gradient ? (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id={`gradient-${user.uid}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" style={{ stopColor: gradient.from }} />
                <stop offset="100%" style={{ stopColor: gradient.to }} />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="100"
              fill={`url(#gradient-${user.uid})`}
            />
          </svg>
        ) : null}

        {/* Fallback: Initials with colored background */}
        {!avatar && gradient && (
          <>
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id={`gradient-fallback-${user.uid}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" style={{ stopColor: gradient.from }} />
                  <stop offset="100%" style={{ stopColor: gradient.to }} />
                </linearGradient>
              </defs>
              <circle
                cx="100"
                cy="100"
                r="100"
                fill={`url(#gradient-fallback-${user.uid})`}
              />
            </svg>
            <span className="relative z-10" style={{ fontSize: `${size * 0.4}px` }}>
              {initials}
            </span>
          </>
        )}
      </div>

      {/* Online Status Indicator */}
      {showStatus && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
      )}
    </div>
  );
};

export default AvatarPicker;
