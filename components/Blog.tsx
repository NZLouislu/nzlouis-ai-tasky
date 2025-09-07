"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PartialBlock } from "@blocknote/core";
import { Plus, Image, Trash2, Menu, MoreHorizontal, MessageCircle, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";
import ChatbotInput from "./ChatbotInput";
import { useAISettings } from "@/lib/useAISettings";

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Loading editor...</div>
});

interface Post {
  id: string;
  title: string;
  content: PartialBlock[];
  icon?: string;
  cover?: {
    type: "color" | "image";
    value: string;
  };
  children?: Post[];
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post-1",
      title: "My first blog post",
      content: [
        {
          type: "paragraph",
          content: "Welcome to your new blog post!",
        },
      ],
      children: [
        {
          id: "post-1-1",
          title: "Introduction",
          content: [],
        },
        {
          id: "post-1-2",
          title: "Conclusion",
          content: [],
        }
      ]
    },
  ]);

  const [activePostId, setActivePostId] = useState<string>("post-1");
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [showCoverActions, setShowCoverActions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatInputValue, setChatInputValue] = useState("");
  const [chatPreviewImage, setChatPreviewImage] = useState<string | null>(null);
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: number, text: string, sender: "user" | "bot", timestamp: Date, isLoading?: boolean}>>([]);

  const { getCurrentModel, getApiKey } = useAISettings();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setNavbarVisible(false);
      } else {
        setNavbarVisible(true);
      }
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activePost = posts.find((post) => post.id === activePostId) || posts[0];

  const addNewPost = () => {
    const newPost: Post = {
      id: `post-${Date.now()}`,
      title: `Post ${posts.length + 1}`,
      content: [],
    };
    setPosts([...posts, newPost]);
    setActivePostId(newPost.id);
  };

  const addNewSubPost = (parentId: string) => {
    const newSubPost: Post = {
      id: `${parentId}-sub-${Date.now()}`,
      title: `Sub post ${posts.find(p => p.id === parentId)?.children?.length || 0 + 1}`,
      content: [],
    };
    setPosts(prev => prev.map(post =>
      post.id === parentId
        ? { ...post, children: [...(post.children || []), newSubPost] }
        : post
    ));
    setActivePostId(newSubPost.id);
  };

  const updatePostTitle = (postId: string, newTitle: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, title: newTitle } : post
      )
    );
  };

  const updatePostContent = (newContent: PartialBlock[]) => {
    setPosts(
      posts.map((post) =>
        post.id === activePostId ? { ...post, content: newContent } : post
      )
    );
  };

  const setPostIcon = (postId: string, icon: string) => {
    setPosts(
      posts.map((post) => (post.id === postId ? { ...post, icon } : post))
    );
    setShowIconSelector(false);
  };

  const removePostIcon = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, icon: undefined } : post
      )
    );
    setShowIconSelector(false);
  };

  const setPostCover = (
    postId: string,
    cover: { type: "color" | "image"; value: string }
  ) => {
    setPosts(
      posts.map((post) => (post.id === postId ? { ...post, cover } : post))
    );
    setShowCoverOptions(false);
  };

  const removePostCover = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, cover: undefined } : post
      )
    );
  };

  const handleCoverFileUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPostCover(activePostId, {
          type: "image",
          value: result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleCoverFileUpload(e.target.files[0]);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInputValue.trim() === "" && !chatPreviewImage) return;

    const userMessage = {
      id: Date.now(),
      text: chatInputValue,
      sender: "user" as const,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInputValue("");
    setChatPreviewImage(null);
    setChatIsLoading(true);

    try {
      const currentBlogContent = activePost.content.map((block, index) => {
        if (block.type === "paragraph" && block.content) {
          const text = Array.isArray(block.content)
            ? block.content.map(item => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object" && "text" in item) return item.text;
                return "";
              }).join("")
            : String(block.content);
          return `Paragraph ${index + 1}: ${text}`;
        }
        if (block.type === "heading" && block.content) {
          const text = Array.isArray(block.content)
            ? block.content.map(item => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object" && "text" in item) return item.text;
                return "";
              }).join("")
            : String(block.content);
          return `Heading: ${text}`;
        }
        return "";
      }).filter(text => text.length > 0).join("\n\n");

      const systemPrompt = `You are a helpful AI assistant for blog writing. The user is currently writing a blog post with the following content:

${currentBlogContent}

Help them improve their blog by:
- Adding new content when they request it
- Modifying existing content
- Providing suggestions
- Answering questions about their blog

When they ask to add content, modify content, or make changes, respond with the updated content in a clear format.`;

      const chatMessagesForAPI = [
        { role: "system", content: systemPrompt },
        ...chatMessages.map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        })),
        {
          role: "user",
          content: userMessage.text,
          ...(chatPreviewImage && { image: chatPreviewImage })
        }
      ];

      const currentModel = getCurrentModel();
      if (!currentModel) {
        alert("Please select a model in settings");
        return;
      }
      const apiKey = getApiKey(currentModel.provider);
      if (currentModel.provider !== "google" && !apiKey) {
        alert(`Please set your ${currentModel.provider} API key in settings`);
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          modelId: currentModel.id,
          messages: chatMessagesForAPI,
          temperature: 0.7,
          maxTokens: 2000,
          apiKey
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();

      const aiMessage = {
        id: Date.now(),
        text: data.response,
        sender: "bot" as const,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);

      processBlogModification(data.response);

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: Date.now(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "bot" as const,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatIsLoading(false);
    }
  };

  const processBlogModification = (aiResponse: string) => {
    const newBlock: PartialBlock = {
      type: "paragraph",
      content: [{ type: "text", text: aiResponse, styles: {} }]
    };
    updatePostContent([...activePost.content, newBlock]);
  };

  const iconOptions = ["📝", "📄", "📑", "📊", "📋", "📌", "⭐", "💡"];

  const colorOptions = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-gray-500",
    "bg-red-500",
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        title="Blog"
        icon="📖"
        pages={posts.map(p => ({ id: p.id, title: p.title, icon: p.icon, children: p.children }))}
        activePageId={activePostId}
        onAddPage={addNewPost}
        onAddSubPage={addNewSubPost}
        onUpdatePageTitle={updatePostTitle}
        onSelectPage={setActivePostId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className={navbarVisible ? "top-16" : "top-0"}
      />

      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <div className={`fixed ${navbarVisible ? "top-16" : "top-0"} left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 md:left-64 transition-all duration-300`}>
          <div className="px-4 md:px-6 py-3">
            <Breadcrumb items={[
              { label: "Blog", icon: "📖" },
              { label: activePost.title || "Untitled", icon: activePost.icon }
            ]} />
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className={`flex-1 flex overflow-hidden transition-all duration-300 ${navbarVisible ? "pt-20" : "pt-4"}`}>
          <div className={`flex-1 overflow-auto ${showChatbot ? "lg:mr-0" : ""}`}>
            <div className="py-8">
              <div className="max-w-[900px] mx-auto pl-5 md:px-6 lg:px-8">
                <div className="flex justify-start">
                  <div className="w-full">
                    {activePost.cover && (
                      <div
                        className="relative mb-8 rounded-lg overflow-hidden"
                        onMouseEnter={() => setShowCoverActions(true)}
                        onMouseLeave={() => setShowCoverActions(false)}
                        style={{
                          height: "12rem",
                        }}
                      >
                        {activePost.cover.type === "color" ? (
                          <div className={`h-full ${activePost.cover.value}`}></div>
                        ) : (
                          <div
                            className="h-full bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${activePost.cover.value})`,
                            }}
                          ></div>
                        )}
                        <div
                          className={`absolute bottom-4 right-4 flex space-x-2 transition-opacity duration-200 ${
                            showCoverActions || (!activePost.icon && !activePost.cover)
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        >
                          <button
                            onClick={() => setShowCoverOptions(true)}
                            className="px-3 py-1 bg-white bg-opacity-80 text-sm rounded hover:bg-opacity-100"
                          >
                            Change Cover
                          </button>
                          <button
                            onClick={() => removePostCover(activePostId)}
                            className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mb-6 pl-[23px] md:pl-0">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          {!activePost.icon && !activePost.cover && (
                            <button
                              onClick={() => setShowIconSelector(!showIconSelector)}
                              className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                            >
                              <Plus size={16} className="mr-2" />
                              Add Icon
                            </button>
                          )}

                          {!activePost.cover && (
                            <button
                              onClick={() => setShowCoverOptions(!showCoverOptions)}
                              className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                            >
                              <Image size={16} className="mr-2" aria-hidden="true" />
                              Add Cover
                            </button>
                          )}
                        </div>

                        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>

                      {showIconSelector && (
                        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div className="grid grid-cols-8 gap-3">
                            {iconOptions.map((icon) => (
                              <button
                                key={icon}
                                onClick={() => setPostIcon(activePostId, icon)}
                                className="text-2xl p-3 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {icon}
                              </button>
                            ))}
                            <button
                              onClick={() => removePostIcon(activePostId)}
                              className="text-sm p-3 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}

                      {showCoverOptions && (
                        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                          <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                              Colors
                            </h3>
                            <div className="flex flex-wrap gap-3">
                              {colorOptions.map((color) => (
                                <button
                                  key={color}
                                  onClick={() =>
                                    setPostCover(activePostId, {
                                      type: "color",
                                      value: color,
                                    })
                                  }
                                  className={`w-10 h-10 rounded-lg ${color} hover:opacity-80 transition-opacity`}
                                ></button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                              Upload Image
                            </h3>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverFileSelect}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Or enter image URL below</p>
                            <input
                              type="text"
                              placeholder="Enter image URL"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                              onBlur={(e) => {
                                if (e.target.value) {
                                  setPostCover(activePostId, {
                                    type: "image",
                                    value: e.target.value,
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center">
                        {activePost.icon && (
                          <div className="relative mr-4">
                            <span
                              className="text-3xl cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                              onClick={() => setShowIconSelector(true)}
                            >
                              {activePost.icon}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            id={`title-input-${activePostId}`}
                            type="text"
                            value={activePost.title}
                            onChange={(e) =>
                              updatePostTitle(activePostId, e.target.value)
                            }
                            placeholder="Untitled"
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-4xl font-bold text-gray-800 placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="min-h-[400px] -ml-8 pl-[23px] md:pl-0 pr-2">
                      <Editor
                        initialContent={activePost.content}
                        onChange={updatePostContent}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showChatbot && (
            <div className="hidden lg:flex w-[48rem] border-l border-gray-200 bg-white flex-col">
              <div className="bg-blue-600 text-white p-4 border-b border-gray-200">
                <h3 className="font-semibold">AI Blog Assistant</h3>
                <p className="text-sm text-blue-100">Ask me to help with your blog content</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 text-sm">
                    <p>👋 Hi! I can help you with your blog by:</p>
                    <ul className="mt-2 text-left">
                      <li>• Adding new content</li>
                      <li>• Modifying existing text</li>
                      <li>• Providing suggestions</li>
                      <li>• Answering questions</li>
                    </ul>
                  </div>
                )}
                {chatMessages.map(message => (
                  <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                      {message.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 bg-white">
                <div className="p-4">
                  <ChatbotInput
                    inputValue={chatInputValue}
                    setInputValue={setChatInputValue}
                    previewImage={chatPreviewImage}
                    setPreviewImage={setChatPreviewImage}
                    onSubmit={handleChatSubmit}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-50"
        title="AI Assistant"
      >
        {showChatbot ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {showChatbot && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-blue-600 text-white p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">AI Blog Assistant</h3>
              <p className="text-sm text-blue-100">Ask me to help with your blog content</p>
            </div>
            <button
              onClick={() => setShowChatbot(false)}
              className="p-2 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 text-sm">
                <p>👋 Hi! I can help you with your blog by:</p>
                <ul className="mt-2 text-left">
                  <li>• Adding new content</li>
                  <li>• Modifying existing text</li>
                  <li>• Providing suggestions</li>
                  <li>• Answering questions</li>
                </ul>
              </div>
            )}
            {chatMessages.map(message => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 bg-white">
            <div className="p-4">
              <ChatbotInput
                inputValue={chatInputValue}
                setInputValue={setChatInputValue}
                previewImage={chatPreviewImage}
                setPreviewImage={setChatPreviewImage}
                onSubmit={handleChatSubmit}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}