"use client";
import React, { useState, useEffect } from "react";
import { X, Search, Plus, ExternalLink, CheckCircle2 } from "lucide-react";
import { useStoriesStore } from "@/lib/stores/stories-store";

interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  url: string;
  shortUrl: string;
  prefs?: {
    background?: string;
    backgroundColor?: string;
  };
}

interface TrelloBoardSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBoard: (boardId: string, boardName: string) => Promise<void>;
}

export default function TrelloBoardSelectDialog({
  isOpen,
  onClose,
  onSelectBoard,
}: TrelloBoardSelectDialogProps) {
  const { platforms } = useStoriesStore();
  const [boards, setBoards] = useState<TrelloBoard[]>([]);
  const [filteredBoards, setFilteredBoards] = useState<TrelloBoard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState("");
  
  // Get already added board IDs
  const addedBoardIds = new Set(
    platforms
      .find(p => p.name === 'trello')?.projects
      .map(project => project.platformProjectId) || []
  );

  useEffect(() => {
    if (isOpen) {
      loadBoards();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = boards.filter((board) =>
        board.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBoards(filtered);
    } else {
      setFilteredBoards(boards);
    }
  }, [searchQuery, boards]);

  const loadBoards = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stories/trello/boards");
      const result = await response.json();

      if (result.success) {
        const activeBoards = (result.boards || []).filter((b: TrelloBoard) => !b.closed);
        setBoards(activeBoards);
        setFilteredBoards(activeBoards);
      } else {
        setError(result.error || "Failed to load boards");
      }
    } catch (err) {
      setError("Failed to load Trello boards");
      console.error("Load boards error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBoard = async (board: TrelloBoard) => {
    if (addedBoardIds.has(board.id)) return;
    
    setIsSelecting(true);
    setError("");
    try {
      await onSelectBoard(board.id, board.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add board");
    } finally {
      setIsSelecting(false);
    }
  };

  const handleGoToTrello = () => {
    window.open('https://trello.com/', '_blank');
  };

  const getBoardIconColor = (boardName: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
      '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
      '#E67E22', '#16A085', '#27AE60', '#2980B9', '#8E44AD'
    ];
    const index = boardName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getBoardInitial = (boardName: string): string => {
    return boardName.charAt(0).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Select Trello Board
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boards..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleGoToTrello}
            className="w-full flex items-center justify-center space-x-2 p-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Board</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading boards...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={loadBoards}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery
                  ? "No boards found matching your search"
                  : "No boards available"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBoards
                .filter(board => !addedBoardIds.has(board.id))
                .map((board) => (
                  <button
                    key={board.id}
                    onClick={() => handleSelectBoard(board)}
                    disabled={isSelecting}
                    className="w-full p-4 border border-gray-200 rounded-lg text-left transition-colors hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: getBoardIconColor(board.name) }}
                      >
                        {getBoardInitial(board.name)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">
                          {board.name}
                        </h3>
                        {board.desc && (
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {board.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

              {filteredBoards
                .filter(board => addedBoardIds.has(board.id))
                .map((board) => (
                  <div
                    key={board.id}
                    className="w-full p-4 border border-gray-200 rounded-lg bg-gray-100 opacity-60 cursor-not-allowed"
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center text-white font-bold text-lg grayscale"
                        style={{ backgroundColor: getBoardIconColor(board.name) }}
                      >
                        {getBoardInitial(board.name)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-500 truncate">
                            {board.name}
                          </h3>
                          <span className="flex items-center text-xs text-green-600">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Connected
                          </span>
                        </div>
                        {board.desc && (
                          <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                            {board.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={handleGoToTrello}
            className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Trello</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            disabled={isSelecting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
