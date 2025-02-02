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
              <h2 className="text-lg font-semibold">Important Notice - Paper Trading Only</h2>
              <p className="text-red-500 font-medium">
                Stock Fling is a paper trading simulation platform only. We are NOT a licensed broker-dealer or investment advisor. All trading activities on this platform are simulated and do not involve real money, real securities, or real market transactions. This platform is designed strictly for educational and entertainment purposes.
              </p>

              <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Stock Fling ("Platform"), you agree to be bound by these Terms of Service, our Privacy Policy, and all applicable laws and regulations. If you do not agree with these terms, you must not use our Platform.
              </p>

              <h2 className="text-lg font-semibold">2. Platform Description</h2>
              <p>
                Stock Fling is a paper trading simulation platform that provides:
              </p>
              <ul className="list-disc pl-6">
                <li>Simulated stock trading with virtual currency</li>
                <li>Market data and analysis tools for educational purposes</li>
                <li>Portfolio tracking and management features</li>
                <li>Educational resources about trading and investing</li>
              </ul>

              <h2 className="text-lg font-semibold">3. Not a Real Trading Platform</h2>
              <p>
                You explicitly acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6">
                <li>This is NOT a real trading platform</li>
                <li>No real money is involved in any transaction</li>
                <li>No real securities are bought or sold</li>
                <li>Trading results are simulated and do not reflect real market outcomes</li>
                <li>We are NOT a registered broker-dealer, investment advisor, or financial institution</li>
              </ul>

              <h2 className="text-lg font-semibold">4. User Accounts</h2>
              <p>
                To use our Platform, you must:
              </p>
              <ul className="list-disc pl-6">
                <li>Be at least 18 years old</li>
                <li>Provide accurate registration information</li>
                <li>Maintain the security of your account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Not share your account credentials</li>
              </ul>

              <h2 className="text-lg font-semibold">5. Prohibited Activities</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6">
                <li>Use the Platform for real trading or investment decisions</li>
                <li>Misrepresent the Platform as a real trading service</li>
                <li>Attempt to manipulate simulated trading data</li>
                <li>Interfere with Platform operations</li>
                <li>Use automated systems or bots</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>

              <h2 className="text-lg font-semibold">6. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Platform are owned by Stock Fling and protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h2 className="text-lg font-semibold">7. Disclaimer of Warranties</h2>
              <p>
                The Platform is provided "as is" without any warranties. We do not guarantee:
              </p>
              <ul className="list-disc pl-6">
                <li>Accuracy of market data or simulated trading results</li>
                <li>Uninterrupted or error-free service</li>
                <li>Suitability for any particular purpose</li>
                <li>That simulated results will match real market conditions</li>
              </ul>

              <h2 className="text-lg font-semibold">8. Limitation of Liability</h2>
              <p>
                Stock Fling shall not be liable for any damages resulting from:
              </p>
              <ul className="list-disc pl-6">
                <li>Use or inability to use the Platform</li>
                <li>Decisions made based on Platform information</li>
                <li>Technical issues or data inaccuracies</li>
                <li>Any trading or investment decisions</li>
              </ul>

              <h2 className="text-lg font-semibold">9. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the Platform after modifications indicates acceptance of the updated terms.
              </p>

              <h2 className="text-lg font-semibold">10. Termination</h2>
              <p>
                We reserve the right to terminate or suspend access to our Platform immediately, without prior notice, for any reason including violations of these Terms.
              </p>

              <h2 className="text-lg font-semibold">11. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
              </p>

              <h2 className="text-lg font-semibold">12. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us at legal@stockfling.com
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