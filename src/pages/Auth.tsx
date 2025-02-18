
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
      // Get URL parameters only once at component mount
      const query = new URLSearchParams(window.location.search);
      const type = query.get('type');
      
      // Only proceed if this is actually a recovery attempt
      if (type !== 'recovery') return;

      try {
        const access_token = window.location.hash.replace('#', '');
        
        if (!access_token) {
          throw new Error('No access token found');
        }

        const { error } = await supabase.auth.updateUser({ 
          password: 'new-password' 
        });

        if (error) throw error;

        // Clear URL parameters after successful reset - do this only once
        const cleanUrl = window.location.pathname;
        if (window.location.href !== cleanUrl) {
          window.history.replaceState({}, document.title, cleanUrl);
        }

        toast({
          title: "Success",
          description: "Password reset successful. Please sign in with your new password.",
        });
      } catch (error: any) {
        console.error('Password reset error:', error);
        setErrorMsg(error.message);
      }
    };

    // Run once on mount
    handlePasswordReset();
  }, []); // Empty dependency array - only run once on mount

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
