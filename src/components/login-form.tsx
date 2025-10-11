
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
import { Languages, Loader2, Info } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { CNLogo } from "./cn-logo";


const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ." }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const authContext = useAuth();

  if (!authContext) {
    return null;
  }

  const { login } = authContext;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn quay trở lại.",
      });
      // Chuyển hướng về trang chủ
      router.push("/");
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Email hoặc mật khẩu không chính xác.";
      if (error.message) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Đăng nhập thất bại",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-4">
      {/* Database Update Notification */}
      <Alert className="border-blue-200 bg-blue-50 text-blue-800">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Hệ thống vừa cập nhật cơ sở dữ liệu</strong>
          <br />
          Hãy đăng nhập bằng <strong>email cũ</strong> và mật khẩu tạm thời: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">temp123456</code>
          <br />
          Sau đó vào <strong>Settings</strong> để đổi lại mật khẩu mới, hoặc ấn vào quên mật khẩu?.
        </AlertDescription>
      </Alert>

      <Card className="w-full relative">
          <CardHeader className="text-center items-center">
              <div className="mb-2">
                <CNLogo />
              </div>
              <CardTitle className="text-2xl">Đăng nhập</CardTitle>
              <CardDescription>Nhập email và mật khẩu để tiếp tục.</CardDescription>
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
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center justify-between">
                         <FormLabel>Mật khẩu</FormLabel>
                          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                            Quên mật khẩu?
                         </Link>
                        </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
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
                  Đăng nhập
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
              <p>Chưa có tài khoản?&nbsp;</p>
              <Link href="/signup" className="font-medium text-primary hover:underline">
                  Đăng ký
              </Link>
          </CardFooter>
        </Card>
    </div>
  );
}
