
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quên mật khẩu - CN",
};


export default function ForgotPasswordPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
             <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                    <ForgotPasswordForm />
                </div>
            </div>
        </div>
    );
}
