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
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import type { Folder } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { sendInvitationAction } from "@/app/actions";

const formSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ." }),
});

type ShareFormValues = z.infer<typeof formSchema>;

interface ShareFolderFormProps {
    folder: Folder;
    onInvitationSent: () => void;
}

export function ShareFolderForm({ folder, onInvitationSent }: ShareFolderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ShareFormValues) => {
    if (!user || !user.email) {
        toast({ variant: "destructive", title: "Lỗi", description: "Bạn phải đăng nhập để chia sẻ." });
        return;
    }
     if (values.email.toLowerCase() === user.email.toLowerCase()) {
      toast({ variant: "destructive", title: "Lỗi", description: "Bạn không thể tự mời chính mình." });
      return;
    }

    setIsSubmitting(true);
    try {
      await sendInvitationAction(folder.id, folder.name, user.email, values.email);
      toast({
        title: "Đã gửi lời mời!",
        description: `Lời mời chia sẻ thư mục "${folder.name}" đã được gửi tới ${values.email}.`,
      });
      onInvitationSent();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gửi lời mời thất bại",
        description: error.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email của người nhận</FormLabel>
              <FormControl>
                <Input
                  placeholder="ten@email.com"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                  <Send className="mr-2 h-4 w-4" />
              )}
              Gửi lời mời
            </Button>
        </div>
      </form>
    </Form>
  );
}
