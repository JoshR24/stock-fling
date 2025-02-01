import { Button } from "@/components/ui/button";
import { Lock, HelpCircle } from "lucide-react";
import { useState } from "react";
import PrivacyPolicy from "../legal/PrivacyPolicy";
import TermsOfService from "../legal/TermsOfService";

const LegalSettings = () => {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5" />
          <span>Privacy Policy</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowPrivacyPolicy(true)}
        >
          View
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-5 w-5" />
          <span>Terms of Service</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setShowTermsOfService(true)}
        >
          View
        </Button>
      </div>

      <PrivacyPolicy 
        open={showPrivacyPolicy} 
        onOpenChange={setShowPrivacyPolicy} 
      />
      
      <TermsOfService 
        open={showTermsOfService} 
        onOpenChange={setShowTermsOfService} 
      />
    </div>
  );
};

export default LegalSettings;