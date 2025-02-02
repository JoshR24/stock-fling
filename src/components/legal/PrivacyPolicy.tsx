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
              <h2 className="text-lg font-semibold">Important Notice - Paper Trading Platform</h2>
              <p className="text-red-500 font-medium">
                Stock Fling is a paper trading platform only. All trading activities performed on this platform are simulated and do not involve real money or real securities transactions. This platform is designed for educational and entertainment purposes only.
              </p>

              <h2 className="text-lg font-semibold">1. Introduction</h2>
              <p>
                Welcome to Stock Fling ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our paper trading simulation platform.
              </p>

              <h2 className="text-lg font-semibold">2. Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6">
                <li>Registration information (email, name, password)</li>
                <li>Profile information</li>
                <li>Simulated portfolio data and watchlists</li>
                <li>Usage data and preferences</li>
                <li>Communication preferences</li>
                <li>Device and browser information</li>
              </ul>

              <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul className="list-disc pl-6">
                <li>Provide and maintain our paper trading simulation service</li>
                <li>Personalize your experience</li>
                <li>Send important service updates and alerts</li>
                <li>Analyze and improve our platform</li>
                <li>Prevent fraud and ensure platform security</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2 className="text-lg font-semibold">4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>

              <h2 className="text-lg font-semibold">5. Third-Party Services</h2>
              <p>
                We use third-party services for:
              </p>
              <ul className="list-disc pl-6">
                <li>Authentication (Google)</li>
                <li>Market data providers (for simulated trading)</li>
                <li>Analytics and performance monitoring</li>
                <li>Cloud infrastructure and hosting</li>
              </ul>

              <h2 className="text-lg font-semibold">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.
              </p>

              <h2 className="text-lg font-semibold">7. Your Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc pl-6">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Data portability</li>
                <li>Withdraw consent</li>
              </ul>

              <h2 className="text-lg font-semibold">8. Children's Privacy</h2>
              <p>
                Our service is not intended for users under 18 years of age. We do not knowingly collect information from children under 18.
              </p>

              <h2 className="text-lg font-semibold">9. International Users</h2>
              <p>
                By using our service, you consent to the transfer of your information to the United States and its processing there.
              </p>

              <h2 className="text-lg font-semibold">10. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of any material changes via email or through the platform.
              </p>

              <h2 className="text-lg font-semibold">11. Contact Us</h2>
              <p>
                For questions about this Privacy Policy or our practices, please contact us at privacy@stockfling.com
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