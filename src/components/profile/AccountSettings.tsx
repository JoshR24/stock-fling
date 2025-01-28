import { Button } from "@/components/ui/button";
import { Settings, CreditCard } from "lucide-react";

const AccountSettings = () => {
  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default AccountSettings;