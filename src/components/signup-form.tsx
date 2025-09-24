
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
import { Languages, Loader2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { CNLogo } from "./cn-logo";


const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ." }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự." }),
});

type SignupFormValues = z.infer<typeof formSchema>;

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Tạo tài khoản thành công-!",
        description: "Chào mừng bạn đến với CN.",
      });
      router.push("/");
    } catch (error: any) {
      console.error(error);
      const errorCode = error.code;
      let errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'Địa chỉ email này đã được sử dụng.';
      }
      toast({
        variant: "destructive",
        title: "Đăng ký thất bại",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-sm relative">
          <CardHeader className="text-center items-center">
              <div className="mb-2">
                <CNLogo />
              </div>
              <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
              <CardDescription>Bắt đầu hành trình học ngôn ngữ của bạn.</CardDescription>
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
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Ít nhất 6 ký tự"
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
                  Tạo tài khoản
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm">
              <p>Đã có tài khoản?&nbsp;</p>
              <Link href="/login" className="font-medium text-primary hover:underline">
                  Đăng nhập
              </Link>
          </CardFooter>
        </Card>
  );
}
