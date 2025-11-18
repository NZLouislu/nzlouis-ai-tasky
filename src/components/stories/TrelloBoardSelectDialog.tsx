"use client";
import React, { useState, useEffect } from "react";
import { X, Search, Plus, ExternalLink } from "lucide-react";
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

        <div className="p-6 border-b border-gray-200">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBoards.map((board) => {
                const isAdded = addedBoardIds.has(board.id);
                return (
                  <button
                    key={board.id}
                    onClick={() => handleSelectBoard(board)}
                    disabled={isSelecting || isAdded}
                    className={`p-4 border rounded-lg transition-colors text-left ${
                      isAdded 
                        ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                    style={{
                      backgroundColor: !isAdded && board.prefs?.backgroundColor
                        ? `${board.prefs.backgroundColor}20`
                        : undefined,
                    }}
                  >
                    <h3 className={`font-medium truncate mb-2 ${
                      isAdded ? 'text-gray-500' : 'text-gray-800'
                    }`}>
                      {board.name} {isAdded && '(Already Added)'}
                    </h3>
                    {board.desc && (
                      <p className={`text-sm line-clamp-2 ${
                        isAdded ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {board.desc}
                      </p>
                    )}
                    <a
                      href={board.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs hover:underline mt-2 inline-block ${
                        isAdded ? 'text-gray-400' : 'text-blue-600'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View in Trello →
                    </a>
                  </button>
                );
              })}
              
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center">
                <Plus className="w-8 h-8 text-gray-400 mb-2" />
                <h3 className="font-medium text-gray-700 mb-2">Add New Board</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Create a new board in Trello, then refresh this page to see it here.
                </p>
                <button
                  onClick={handleGoToTrello}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  <span>Go to Trello</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            disabled={isSelecting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
