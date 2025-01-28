import { Button } from "@/components/ui/button";
import { Lock, HelpCircle } from "lucide-react";

const LegalSettings = () => {
  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default LegalSettings;