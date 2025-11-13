'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  MessageSquarePlus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Search,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  messageCount?: number;
}

interface ChatHistorySidebarProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onCreateConversation: () => void;
  onRenameConversation: (id: number, newTitle: string) => void;
  onDeleteConversation: (id: number) => void;
  isLoading?: boolean;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ChatHistorySidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  isLoading = false,
  isMobile = false,
  isOpen = true,
  onClose
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) {
      onDeleteConversation(id);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true, 
        locale: vi 
      });
    } catch {
      return 'vừa xong';
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 right-0 z-50' : 'relative h-full rounded-xl'}
        w-80 bg-gradient-to-br from-blue-50 to-indigo-100 border-l-2 border-blue-200
        flex flex-col shadow-xl overflow-hidden
        ${isMobile && !isOpen ? 'translate-x-full' : 'translate-x-0'}
        transition-transform duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="p-4 border-b-2 border-blue-200 bg-white/80">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Lịch sử chat
            </h2>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-blue-100"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* New Chat Button */}
          <Button
            onClick={onCreateConversation}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
            disabled={isLoading}
          >
            <MessageSquarePlus className="w-5 h-5 mr-2" />
            Cuộc trò chuyện mới
          </Button>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <Card
                key={conv.id}
                className={`
                  p-3 cursor-pointer transition-all duration-200
                  ${currentConversationId === conv.id 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg border-2 border-blue-600' 
                    : 'bg-white hover:bg-blue-50 border-2 border-transparent hover:border-blue-300'
                  }
                `}
                onClick={() => {
                  if (editingId !== conv.id) {
                    onSelectConversation(conv.id);
                    if (isMobile && onClose) onClose();
                  }
                }}
              >
                {editingId === conv.id ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="text-sm bg-white text-gray-900 border-2 border-blue-400 focus:border-blue-600"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Lưu
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-semibold text-sm line-clamp-1 flex-1 ${
                        currentConversationId === conv.id ? 'text-white' : 'text-gray-900'
                      }`}>
                        {conv.title}
                      </h3>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEdit(conv)}
                          className={`h-7 w-7 ${
                            currentConversationId === conv.id 
                              ? 'hover:bg-blue-600 text-white' 
                              : 'hover:bg-blue-100 text-gray-600'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(conv.id)}
                          className={`h-7 w-7 ${
                            currentConversationId === conv.id 
                              ? 'hover:bg-red-600 text-white' 
                              : 'hover:bg-red-100 text-red-600'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {conv.lastMessage && (
                      <p className={`text-xs line-clamp-1 mb-1 ${
                        currentConversationId === conv.id ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {conv.lastMessage}
                      </p>
                    )}

                    <div className={`flex items-center justify-between text-xs ${
                      currentConversationId === conv.id ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      <span>{formatDate(conv.updatedAt)}</span>
                      {conv.messageCount !== undefined && (
                        <span>{conv.messageCount} tin nhắn</span>
                      )}
                    </div>
                  </>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t-2 border-blue-200 bg-white/80">
          <p className="text-xs text-center text-gray-600">
            {conversations.length} cuộc trò chuyện
          </p>
        </div>
      </div>
    </>
  );
}
