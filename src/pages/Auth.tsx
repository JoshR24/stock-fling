
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [errorMsg, setErrorMsg] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Get the URL hash
        const access_token = window.location.hash.replace('#', '');
        const query = new URLSearchParams(window.location.search);
        
        // Check if this is a password reset flow
        if (query.get('type') === 'recovery' && access_token) {
          // Use updateUser instead of verifyOtp
          const { error } = await supabase.auth.updateUser({ password: 'new-password' });

          if (error) throw error;

          toast({
            title: "Success",
            description: "Your password has been reset. Please sign in with your new password.",
          });
        }
      } catch (error: any) {
        console.error('Password reset error:', error);
        setErrorMsg(error.message);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    handlePasswordReset();
  }, [toast]);

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-md p-6">
        {showResetPassword ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center">Reset Password</h2>
            <ResetPasswordForm onBack={() => setShowResetPassword(false)} />
          </div>
        ) : (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {errorMsg && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="signin">
              <SignInForm onForgotPassword={() => setShowResetPassword(true)} />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        )}
      </Card>
    </div>
  );
};

export default Auth;
