import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";

export const PaperTradingDisclaimer = () => {
  return (
    <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        This is a paper trading platform for educational purposes only. No real money or securities are involved.
        All trades are simulated and do not reflect real market transactions.
      </AlertDescription>
    </Alert>
  );
};