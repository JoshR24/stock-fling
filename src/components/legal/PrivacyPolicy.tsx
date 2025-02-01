import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyPolicy = ({ open, onOpenChange }: PrivacyPolicyProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90vw] max-h-[90vh]">
        <AlertDialogHeader>
          <AlertDialogTitle>Privacy Policy</AlertDialogTitle>
        </AlertDialogHeader>
        <ScrollArea className="h-[60vh] mt-4">
          <AlertDialogDescription className="text-foreground">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">1. Introduction</h2>
              <p>
                Welcome to Stock Fling. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
              </p>

              <h2 className="text-lg font-semibold">2. Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6">
                <li>Account information (email, name)</li>
                <li>Portfolio data and watchlists</li>
                <li>Usage data and preferences</li>
              </ul>

              <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6">
                <li>Provide and maintain our services</li>
                <li>Personalize your experience</li>
                <li>Send you important updates</li>
                <li>Improve our application</li>
              </ul>

              <h2 className="text-lg font-semibold">4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
              </p>

              <h2 className="text-lg font-semibold">5. Third-Party Services</h2>
              <p>
                We use third-party services for:
              </p>
              <ul className="list-disc pl-6">
                <li>Authentication (Google)</li>
                <li>Stock market data</li>
                <li>Analytics</li>
              </ul>

              <h2 className="text-lg font-semibold">6. Your Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc pl-6">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications</li>
              </ul>

              <h2 className="text-lg font-semibold">7. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at support@stockfling.com
              </p>

              <p className="text-sm text-muted-foreground mt-4">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </AlertDialogDescription>
        </ScrollArea>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PrivacyPolicy;