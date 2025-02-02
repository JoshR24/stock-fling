import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../ui/use-toast";

export const Support = ({ supportEmail }: { supportEmail: string }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const requestAccountDeletion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('account_deletion_requests')
      .insert([{ user_id: user.id }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit account deletion request. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Account deletion request submitted. We'll process it within 30 days.",
      });
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="mt-8 space-y-4 border-t pt-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-medium">Support</h3>
        <p className="text-sm text-muted-foreground">
          Need help? Contact us at{" "}
          <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
            {supportEmail}
          </a>
        </p>
      </div>

      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-medium">Account Management</h3>
        <Button 
          variant="destructive" 
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete Account
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
              All your data will be permanently removed within 30 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={requestAccountDeletion}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};