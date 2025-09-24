
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quên mật khẩu - CN",
};


export default function ForgotPasswordPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <ForgotPasswordForm />
        </div>
    );
}
