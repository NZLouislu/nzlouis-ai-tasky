import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import BlogHeader from "../components/blog/BlogHeader";
import IconSelector from "../components/blog/IconSelector";
import CoverOptions from "../components/blog/CoverOptions";

const meta: Meta = {
  title: "Blog/BlogHeaderActions",
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;

const iconOptions = ["📝", "💡", "🚀", "🎯", "📊", "🔥", "⭐", "🎨"];
const colorOptions = [
  "bg-red-500",
  "bg-blue-500", 
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-gray-500",
];

interface PostCover {
  type: "color" | "image";
  value: string;
}

interface ActivePost {
  id: string;
  title: string;
  content: unknown[];
  icon?: string;
  cover?: PostCover;
  parent_id?: string | null;
  children?: ActivePost[];
  [key: string]: unknown;
}

const BlogHeaderActionsDemo = () => {
  const [activePost, setActivePost] = useState<ActivePost>({
    id: "test-post-1",
    title: "Test Blog Post",
    content: [],
  });

  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [showDeleteDropdown, setShowDeleteDropdown] = useState(false);

  const setPostIcon = (postId: string, icon: string) => {
    console.log("Setting icon:", postId, icon);
    setActivePost(prev => ({ ...prev, icon }));
  };

  const removePostIcon = (postId: string) => {
    console.log("Removing icon:", postId);
    setActivePost(prev => ({ ...prev, icon: undefined }));
  };

  const setPostCover = (postId: string, cover: PostCover) => {
    console.log("Setting cover:", postId, cover);
    setActivePost(prev => ({ ...prev, cover }));
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPostCover(activePost.id, {
          type: "image",
          value: result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePost = () => {
    console.log("Delete post:", activePost.id);
    setShowDeleteDropdown(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Blog Header Actions Test</h1>
        
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Current Post State:</h3>
          <p><strong>Title:</strong> {activePost.title}</p>
          <p><strong>Icon:</strong> {activePost.icon || "None"}</p>
          <p><strong>Cover:</strong> {activePost.cover ? `${activePost.cover.type}: ${activePost.cover.value}` : "None"}</p>
        </div>

        <BlogHeader
          setShowDeleteDropdown={setShowDeleteDropdown}
          showDeleteDropdown={showDeleteDropdown}
          dropdownRef={{ current: null }}
          handleDeletePost={handleDeletePost}
        />

        {showIconSelector && (
          <IconSelector
            showIconSelector={showIconSelector}
            setShowIconSelector={setShowIconSelector}
            iconOptions={iconOptions}
            setPostIcon={setPostIcon}
            removePostIcon={removePostIcon}
            activePostId={activePost.id}
          />
        )}

        {showCoverOptions && (
          <CoverOptions
            showCoverOptions={showCoverOptions}
            setShowCoverOptions={setShowCoverOptions}
            colorOptions={colorOptions}
            setPostCover={setPostCover}
            activePostId={activePost.id}
            handleCoverFileSelect={handleCoverFileSelect}
          />
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Click "Add Icon" to open the icon selector</li>
            <li>Click "Add Cover" to open the cover options</li>
            <li>Select an icon or cover to see the post state update</li>
            <li>Once an icon or cover is added, the respective button will be hidden</li>
            <li>Use the "Remove" option in selectors to remove icon/cover</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export const Interactive: StoryObj = {
  render: () => <BlogHeaderActionsDemo />,
};

export const WithIcon: StoryObj = {
  render: () => {
    const [activePost] = useState<ActivePost>({
      id: "test-post-2",
      title: "Post with Icon",
      content: [],
      icon: "🚀",
    });

    return (
      <div className="p-6">
        <BlogHeader
          setShowDeleteDropdown={() => {}}
          showDeleteDropdown={false}
          dropdownRef={{ current: null }}
          handleDeletePost={() => {}}
        />
      </div>
    );
  },
};

export const WithCover: StoryObj = {
  render: () => {
    const [activePost] = useState<ActivePost>({
      id: "test-post-3",
      title: "Post with Cover",
      content: [],
      cover: {
        type: "color",
        value: "bg-blue-500",
      },
    });

    return (
      <div className="p-6">
        <BlogHeader
          setShowDeleteDropdown={() => {}}
          showDeleteDropdown={false}
          dropdownRef={{ current: null }}
          handleDeletePost={() => {}}
        />
      </div>
    );
  },
};