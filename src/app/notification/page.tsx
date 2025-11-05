"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, Wrench, RefreshCw, AlertCircle, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CNLogo } from "@/components/cn-logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Notification {
  id: number;
  title: string;
  content: string;
  type: "info" | "warning" | "maintenance" | "update" | "important";
  createdAt: string;
  updatedAt: string;
}

const typeConfig = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    titleColor: "text-blue-700 dark:text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    titleColor: "text-yellow-700 dark:text-yellow-400",
  },
  maintenance: {
    icon: Wrench,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    titleColor: "text-orange-700 dark:text-orange-400",
  },
  update: {
    icon: RefreshCw,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    titleColor: "text-green-700 dark:text-green-400",
  },
  important: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    titleColor: "text-red-700 dark:text-red-400",
  },
};

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/notifications");
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Link href="/">
              <CNLogo />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Thông báo hệ thống
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Các thông báo quan trọng về cập nhật và bảo trì hệ thống
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <span>←</span> Về trang chủ
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="w-full">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-700 dark:text-red-400">Lỗi</AlertTitle>
            <AlertDescription className="text-red-600 dark:text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && notifications.length === 0 && (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Chưa có thông báo nào
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Hiện tại không có thông báo hệ thống nào được đăng tải.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        {!isLoading && !error && notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const config = typeConfig[notification.type];
              const Icon = config.icon;

              return (
                <Card
                  key={notification.id}
                  className={`${config.bgColor} ${config.borderColor} border-2 shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className={`${config.color} flex-shrink-0 mt-1`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className={`${config.titleColor} mb-2`}>
                          {notification.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatDate(notification.createdAt)}
                          {notification.updatedAt !== notification.createdAt && (
                            <span className="ml-2">(Đã cập nhật)</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div
                        className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: notification.content.replace(/\n/g, "<br />"),
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} CN English. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

