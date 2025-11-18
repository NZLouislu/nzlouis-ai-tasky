"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Image as ImageIcon, Palette } from "lucide-react";

interface PostCover {
  type: "color" | "image";
  value: string;
}

interface CoverPickerProps {
  currentCover?: PostCover | null;
  onSelect: (cover: PostCover) => void;
  onRemove: () => void;
  onClose: () => void;
}

const DEFAULT_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B739", // Orange
  "#52B788", // Green
];

export function CoverPicker({
  currentCover,
  onSelect,
  onRemove,
  onClose,
}: CoverPickerProps) {
  const [mode, setMode] = useState<"color" | "image">(
    currentCover?.type || "color"
  );
  const [imageUrl, setImageUrl] = useState(
    currentCover?.type === "image" ? currentCover.value : ""
  );
  const [isUploading, setIsUploading] = useState(false);

  const handleColorSelect = (color: string) => {
    onSelect({ type: "color", value: color });
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Upload to your API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const uploadedUrl = data.url;

      // Set the uploaded image URL
      setImageUrl(uploadedUrl);
      onSelect({ type: "image", value: uploadedUrl });
      onClose();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSubmit = () => {
    if (imageUrl.trim()) {
      onSelect({ type: "image", value: imageUrl.trim() });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Choose Cover</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("color")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded ${
              mode === "color"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
          >
            <Palette className="w-4 h-4" />
            Color
          </button>
          <button
            onClick={() => setMode("image")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded ${
              mode === "image"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Image
          </button>
        </div>

        {/* Color Mode */}
        {mode === "color" && (
          <div className="grid grid-cols-5 gap-3">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className="aspect-square rounded-lg hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Image Mode */}
        {mode === "image" && (
          <div className="space-y-4">
            {/* Upload from local */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Image
              </label>
              <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <ImageIcon className="w-5 h-5" />
                  <span>{isUploading ? "Uploading..." : "Choose from computer"}</span>
                </div>
              </label>
            </div>

            {/* Or use URL */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  Or use image URL
                </span>
              </div>
            </div>

            <div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                disabled={isUploading}
              />
            </div>

            {imageUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src={imageUrl}
                  alt="Preview"
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "";
                    e.currentTarget.alt = "Invalid image URL";
                  }}
                />
              </div>
            )}
            
            <button
              onClick={handleImageSubmit}
              disabled={!imageUrl.trim() || isUploading}
              className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Image
            </button>
          </div>
        )}

        {/* Remove Cover Button */}
        {currentCover && (
          <button
            onClick={() => {
              onRemove();
              onClose();
            }}
            className="w-full mt-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            Remove Cover
          </button>
        )}
      </div>
    </div>
  );
}
