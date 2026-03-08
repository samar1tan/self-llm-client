import { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Download,
  MoreHorizontal,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { Chat } from '../types';
import { exportAsJson, exportAsMarkdown } from '../utils/export';

interface SidebarProps {
  onOpenSettings: () => void;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const { chats, activeChatId, createChat, setActiveChat, deleteChat, renameChat } =
    useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleNewChat = () => {
    createChat();
  };

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    setMenuOpenId(null);
  };

  const handleDelete = (id: string) => {
    deleteChat(id);
    setMenuOpenId(null);
  };

  const startRename = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
    setMenuOpenId(null);
  };

  const saveRename = () => {
    if (editingId && editTitle.trim()) {
      renameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleExport = (chat: Chat, format: 'json' | 'markdown') => {
    if (format === 'json') {
      exportAsJson(chat);
    } else {
      exportAsMarkdown(chat);
    }
    setMenuOpenId(null);
  };

  return (
    <div className="w-64 bg-sidebar-light dark:bg-sidebar-dark flex flex-col h-full border-r border-zinc-200 dark:border-zinc-700">
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-700 dark:text-zinc-200"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg mb-1 cursor-pointer transition-colors ${
              activeChatId === chat.id
                ? 'bg-zinc-200 dark:bg-zinc-700'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            onClick={() => handleSelectChat(chat.id)}
          >
            <MessageSquare size={16} className="flex-shrink-0 text-zinc-500" />

            {editingId === chat.id ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveRename();
                  }}
                  className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(null);
                  }}
                  className="p-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">
                  {chat.title}
                </span>

                {/* Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded transition-opacity"
                >
                  <MoreHorizontal size={14} />
                </button>

                {/* Dropdown Menu */}
                {menuOpenId === chat.id && (
                  <div
                    className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[150px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => startRename(chat)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <Edit2 size={14} />
                      Rename
                    </button>
                    <button
                      onClick={() => handleExport(chat, 'markdown')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <Download size={14} />
                      Export MD
                    </button>
                    <button
                      onClick={() => handleExport(chat, 'json')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <Download size={14} />
                      Export JSON
                    </button>
                    <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
                    <button
                      onClick={() => handleDelete(chat.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Settings Button */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-zinc-700 dark:text-zinc-200"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
