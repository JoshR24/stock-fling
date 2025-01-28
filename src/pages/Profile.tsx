import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Settings, CreditCard, HelpCircle, Lock, Bell, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
        
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              <span>Account Settings</span>
            </div>
            <Button variant="ghost" size="sm">Edit</Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5" />
              <span>Subscription</span>
            </div>
            <Button variant="ghost" size="sm">Manage</Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5" />
              <span>Dark Mode</span>
            </div>
            <Switch />
          </div>
        </Card>
        
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5" />
              <span>Privacy Policy</span>
            </div>
            <Button variant="ghost" size="sm">View</Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5" />
              <span>Terms of Service</span>
            </div>
            <Button variant="ghost" size="sm">View</Button>
          </div>
        </Card>
        
        <Card className="p-4">
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Profile;