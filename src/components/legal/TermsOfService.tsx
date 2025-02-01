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

interface TermsOfServiceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsOfService = ({ open, onOpenChange }: TermsOfServiceProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90vw] max-h-[90vh]">
        <AlertDialogHeader>
          <AlertDialogTitle>Terms of Service</AlertDialogTitle>
        </AlertDialogHeader>
        <ScrollArea className="h-[60vh] mt-4">
          <AlertDialogDescription className="text-foreground">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Stock Fling, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              </p>

              <h2 className="text-lg font-semibold">2. Description of Service</h2>
              <p>
                Stock Fling is a stock market tracking and portfolio management application that provides users with market data, analysis tools, and portfolio management capabilities.
              </p>

              <h2 className="text-lg font-semibold">3. User Accounts</h2>
              <p>
                To use certain features of our service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6">
                <li>Provide accurate information</li>
                <li>Maintain the security of your account</li>
                <li>Promptly update any changes to your information</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h2 className="text-lg font-semibold">4. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6">
                <li>Violate any laws or regulations</li>
                <li>Interfere with the operation of the service</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Use the service for any illegal purpose</li>
              </ul>

              <h2 className="text-lg font-semibold">5. Financial Disclaimer</h2>
              <p>
                Stock Fling is not a financial advisor. All information provided is for informational purposes only. You should consult with qualified professionals before making any investment decisions.
              </p>

              <h2 className="text-lg font-semibold">6. Intellectual Property</h2>
              <p>
                All content, features, and functionality are owned by Stock Fling and are protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h2 className="text-lg font-semibold">7. Limitation of Liability</h2>
              <p>
                Stock Fling shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
              </p>

              <h2 className="text-lg font-semibold">8. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the service after any modifications indicates acceptance of the new terms.
              </p>

              <h2 className="text-lg font-semibold">9. Termination</h2>
              <p>
                We reserve the right to terminate or suspend access to our service immediately, without prior notice, for any reason whatsoever.
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

export default TermsOfService;