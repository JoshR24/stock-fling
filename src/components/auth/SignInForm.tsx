
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const SignInForm = ({ 
  onForgotPassword 
}: { 
  onForgotPassword: () => void 
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle specific error for unconfirmed email
        if (error.message.toLowerCase().includes('email not confirmed')) {
          toast({
            title: "Email not confirmed",
            description: "Please check your email and click the confirmation link before signing in.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      if (data?.user) {
        toast({
          title: "Success",
          description: "Successfully signed in!",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="signin-password">Password</Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="signin-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
};
