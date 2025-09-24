
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Metadata } from "next";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Quên mật khẩu - CN",
};


export default function ForgotPasswordPage() {
    const bgImage = PlaceHolderImages.find(p => p.id === 'auth-background');

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-background p-4">
            {bgImage && (
                <>
                    <Image 
                        src={bgImage.imageUrl}
                        alt={bgImage.description}
                        fill
                        className="object-cover"
                        data-ai-hint={bgImage.imageHint}
                        priority
                    />
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
                </>
            )}
             <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                    <ForgotPasswordForm />
                </div>
            </div>
        </div>
    );
}
