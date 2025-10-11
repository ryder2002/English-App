
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Info } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import Link from "next/link";
import { CNLogo } from "./cn-logo";


const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ." }),
});

type ForgotPasswordFormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast({
          title: "Đã gửi email!",
          description: `${data.message} Nếu không thấy, hãy kiểm tra spam/thư rác.`,
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Gửi email thất bại",
          description: data.error || "Có lỗi xảy ra khi gửi email.",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Có lỗi xảy ra. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-4">

      {/* Thông báo sau khi gửi email */}
      {emailSent && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <Mail className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Email đã được gửi!</strong>
            <br />
            Vui lòng kiểm tra hộp thư đến của bạn.
            <br />
            <span className="text-orange-600 font-medium">
              💡 Nếu không thấy, vui lòng kiểm tra spam/thư rác trong email
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full relative">
          <CardHeader className="text-center items-center">
              <div className="mb-2">
                <CNLogo />
              </div>
              <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
              <CardDescription>Nhập email của bạn để nhận liên kết đặt lại mật khẩu.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ten@email.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Gửi email đặt lại
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
              <Link href="/login" className="font-medium text-primary hover:underline">
                  Quay lại trang Đăng nhập
              </Link>
          </CardFooter>
        </Card>
    </div>
  );
}
