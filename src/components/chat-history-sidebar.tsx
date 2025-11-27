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
import { cn } from '@/lib/utils';

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
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex flex-col h-full bg-background/50 backdrop-blur-xl border-r border-border/40",
        isMobile ? "fixed inset-y-0 right-0 z-50 w-80 shadow-2xl" : "relative w-full",
        isMobile && !isOpen ? 'translate-x-full' : 'translate-x-0',
        "transition-transform duration-300 ease-in-out"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Lịch sử chat
            </h2>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* New Chat Button */}
          <Button
            onClick={onCreateConversation}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm mb-3"
            disabled={isLoading}
          >
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Cuộc trò chuyện mới
          </Button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 nice-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                  currentConversationId === conv.id
                    ? "bg-primary/10 border-primary/20 shadow-sm"
                    : "bg-card/50 hover:bg-accent/50 border-transparent hover:border-border/50"
                )}
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
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="flex-1 h-7 text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Lưu
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="flex-1 h-7 text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={cn(
                        "font-medium text-sm line-clamp-1 flex-1",
                        currentConversationId === conv.id ? "text-primary" : "text-foreground"
                      )}>
                        {conv.title}
                      </h3>
                      <div className={cn(
                        "flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                        isMobile && "opacity-100" // Always show on mobile
                      )} onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEdit(conv)}
                          className="h-6 w-6 hover:text-primary"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(conv.id)}
                          className="h-6 w-6 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                        {conv.lastMessage}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
                      <span>{formatDate(conv.updatedAt)}</span>
                      {conv.messageCount !== undefined && (
                        <span>{conv.messageCount} tin nhắn</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/40 bg-muted/20">
          <p className="text-xs text-center text-muted-foreground">
            {conversations.length} cuộc trò chuyện
          </p>
        </div>
      </div>
    </>
  );
}
