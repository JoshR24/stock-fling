
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AccountSettings from "@/components/profile/AccountSettings";
import PreferencesSettings from "@/components/profile/PreferencesSettings";
import LegalSettings from "@/components/profile/LegalSettings";
import FriendsSection from "@/components/profile/FriendsSection";
import { Support } from "@/components/portfolio/Support";
import { LogOut } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-16">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        
        <Card className="p-4">
          <AccountSettings />
        </Card>
        
        <FriendsSection />
        
        <Card className="p-4">
          <PreferencesSettings />
        </Card>
        
        <Card className="p-4">
          <LegalSettings />
        </Card>
        
        <Card className="p-4">
          <Button 
            variant="destructive" 
            className="w-full flex items-center gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </Card>

        <Card className="p-4">
          <Support supportEmail="support@stockfling.com" />
        </Card>
      </div>
    </div>
  );
};

export default Profile;
