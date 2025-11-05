"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Plus, Send, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Notification {
  id: number;
  title: string;
  content: string;
  type: "info" | "warning" | "maintenance" | "update" | "important";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const typeOptions = [
  { value: "info", label: "ℹ️ Thông tin", color: "text-blue-600" },
  { value: "warning", label: "⚠️ Cảnh báo", color: "text-yellow-600" },
  { value: "maintenance", label: "🔧 Bảo trì", color: "text-orange-600" },
  { value: "update", label: "🔄 Cập nhật", color: "text-green-600" },
  { value: "important", label: "🚨 Quan trọng", color: "text-red-600" },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [emailProgress, setEmailProgress] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"info" | "warning" | "maintenance" | "update" | "important">("info");
  const [isActive, setIsActive] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/notifications");
      if (!response.ok) {
        throw new Error("Không thể tải thông báo");
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Đã xảy ra lỗi khi tải thông báo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setEmailProgress(sendEmail ? "Đang gửi email đến tất cả người dùng, vui lòng đợi..." : null);

    try {
      const url = editingId
        ? "/api/admin/notifications"
        : "/api/admin/notifications";
      const method = editingId ? "PUT" : "POST";

      const body = editingId
        ? { id: editingId, title, content, type, isActive }
        : { title, content, type, isActive, sendEmail };

      // Tăng timeout cho request gửi email (có thể mất vài phút nếu có nhiều users)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 phút timeout

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Đã xảy ra lỗi");
      }

      const data = await response.json();
      
      // Hiển thị thông báo chi tiết về kết quả gửi email
      if (sendEmail && data.emailResults) {
        const { sent, failed, total } = data.emailResults;
        if (sent > 0) {
          setSuccess(
            `✅ Tạo thông báo thành công! Đã gửi email đến ${sent}/${total} người dùng${failed > 0 ? ` (${failed} thất bại)` : ''}`
          );
        } else if (total === 0) {
          setSuccess("✅ Tạo thông báo thành công! Không có người dùng nào để gửi email.");
        } else {
          setError(`⚠️ Tạo thông báo thành công nhưng không thể gửi email (${failed}/${total} thất bại). Vui lòng kiểm tra console logs.`);
        }
      } else {
        setSuccess(
          editingId
            ? "Cập nhật thông báo thành công!"
            : "Tạo thông báo thành công!"
        );
      }

      // Reset form
      setTitle("");
      setContent("");
      setType("info");
      setIsActive(true);
      setSendEmail(false);
      setEditingId(null);

      // Refresh list
      await fetchNotifications();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error("Error saving notification:", err);
      if (err.name === 'AbortError') {
        setError("Request timeout. Quá trình gửi email có thể vẫn đang tiếp tục. Vui lòng kiểm tra console logs.");
      } else {
        setError(err.message || "Đã xảy ra lỗi khi lưu thông báo");
      }
    } finally {
      setIsSubmitting(false);
      setEmailProgress(null);
    }
  };

  const handleEdit = (notification: Notification) => {
    setTitle(notification.title);
    setContent(notification.content);
    setType(notification.type);
    setIsActive(notification.isActive);
    setSendEmail(false);
    setEditingId(notification.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Không thể xóa thông báo");
      }

      setSuccess("Xóa thông báo thành công!");
      await fetchNotifications();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error("Error deleting notification:", err);
      setError(err.message || "Đã xảy ra lỗi khi xóa thông báo");
    }
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setType("info");
    setIsActive(true);
    setSendEmail(false);
    setEditingId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-soft p-4 md:p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-glow">
            <Bell className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Quản lý thông báo hệ thống
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Tạo và gửi thông báo đến tất cả người dùng
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {emailProgress && (
        <Alert className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-600 dark:text-blue-300">{emailProgress}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600 dark:text-green-300">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit className="h-5 w-5" />
                  Chỉnh sửa thông báo
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Tạo thông báo mới
                </>
              )}
            </CardTitle>
            <CardDescription>
              {editingId
                ? "Cập nhật thông tin thông báo"
                : "Tạo thông báo mới và gửi email đến tất cả người dùng"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề thông báo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Nội dung *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                  rows={8}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Loại thông báo</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Hiển thị công khai</Label>
                  <p className="text-sm text-muted-foreground">
                    Thông báo sẽ hiển thị trên trang /notification
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              {!editingId && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sendEmail" className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Gửi email đến tất cả người dùng
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Gửi email thông báo đến tất cả người dùng đã đăng ký
                    </p>
                  </div>
                  <Switch
                    id="sendEmail"
                    checked={sendEmail}
                    onCheckedChange={setSendEmail}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {sendEmail ? "Đang gửi email..." : "Đang xử lý..."}
                    </>
                  ) : editingId ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {sendEmail ? "Tạo và gửi email" : "Tạo thông báo"}
                    </>
                  )}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Hủy
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Danh sách thông báo</CardTitle>
            <CardDescription>
              {notifications.length} thông báo đã tạo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {notifications.map((notification) => {
                  const typeOption = typeOptions.find((opt) => opt.value === notification.type);
                  return (
                    <div
                      key={notification.id}
                      className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={typeOption?.color || "text-gray-600"}>
                              {typeOption?.label.split(" ")[0]}
                            </span>
                            <h3 className="font-semibold truncate">{notification.title}</h3>
                            {notification.isActive ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {notification.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(notification)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

