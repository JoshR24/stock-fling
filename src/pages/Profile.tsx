import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

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
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
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