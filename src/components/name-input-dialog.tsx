"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface NameInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
  userEmail?: string;
}

export function NameInputDialog({ open, onOpenChange, onSubmit, userEmail }: NameInputDialogProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập tên của bạn",
      });
      return;
    }

    if (name.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Tên phải có ít nhất 2 ký tự",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(name.trim());
      setName("");
      onOpenChange(false);
      toast({
        title: "Thành công!",
        description: `Xin chào ${name.trim()}! 🎉`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật tên",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 border-2 border-purple-200 dark:border-purple-800">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-glow animate-pulse-slow">
              <span className="text-4xl">👋</span>
            </div>
          </div>
          <DialogTitle className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Chào mừng bạn!
          </DialogTitle>
          <DialogDescription className="text-center text-base md:text-lg pt-2">
            Để bắt đầu, vui lòng cho chúng tôi biết tên của bạn
            {userEmail && (
              <span className="block text-sm text-muted-foreground mt-2">
                ({userEmail})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tên của bạn
            </label>
            <Input
              id="name"
              placeholder="Nhập tên của bạn..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleSubmit();
                }
              }}
              disabled={isLoading}
              className="text-lg h-12 border-2 border-purple-200 dark:border-purple-800 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 bg-white dark:bg-gray-800"
              autoFocus
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim()}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 text-lg font-semibold rounded-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                Lưu tên và tiếp tục ✨
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

