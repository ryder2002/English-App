"use client";

import { useAuth } from "@/contexts/auth-context";
import { useVocabulary } from "@/contexts/vocabulary-context";
import type { Invitation } from "@/lib/types";
import { useEffect, useState } from "react";
import { getInvitationsAction, respondToInvitationAction } from "@/app/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Check, Loader2, Mail, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";

export function InvitationsList() {
    const { user } = useAuth();
    const { refetchData } = useVocabulary();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResponding, setIsResponding] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!user) return;
        const fetchInvitations = async () => {
            setIsLoading(true);
            try {
                const fetchedInvitations = await getInvitationsAction(user.uid);
                setInvitations(fetchedInvitations);
            } catch (error) {
                console.error("Failed to fetch invitations", error);
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: "Không thể tải lời mời.",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvitations();
    }, [user, toast]);

    const handleResponse = async (invitationId: string, status: 'accepted' | 'declined') => {
        setIsResponding(invitationId);
        try {
            await respondToInvitationAction(invitationId, status);
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
            
            if (status === 'accepted') {
                toast({
                    title: "Đã chấp nhận lời mời!",
                    description: "Bạn đã có thể truy cập thư mục được chia sẻ.",
                });
                await refetchData(); // refetch folders and vocab
            } else {
                 toast({
                    title: "Đã từ chối lời mời.",
                });
            }

        } catch (error) {
            console.error("Failed to respond to invitation", error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể phản hồi lời mời.",
            });
        } finally {
            setIsResponding(null);
        }
    };
    
    if (isLoading) {
        return (
             <div className="max-w-2xl mx-auto space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
             </div>
        )
    }

    if (invitations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-card mt-6">
                 <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Bạn không có lời mời nào.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {invitations.map(inv => (
                <Card key={inv.id}>
                    <CardHeader>
                        <CardTitle>Lời mời vào thư mục "{inv.folderName}"</CardTitle>
                        <CardDescription>
                            Từ: {inv.fromUserEmail}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-end gap-2">
                        {isResponding === inv.id ? (
                            <Button disabled size="lg">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                            </Button>
                        ) : (
                           <>
                             <Button variant="outline" onClick={() => handleResponse(inv.id, 'declined')}>
                                <X className="mr-2 h-4 w-4"/> Từ chối
                            </Button>
                            <Button onClick={() => handleResponse(inv.id, 'accepted')}>
                                <Check className="mr-2 h-4 w-4"/> Chấp nhận
                            </Button>
                           </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
