import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, PlusCircle } from "lucide-react";

interface Recommendation {
  symbol: string;
  name: string;
  reason: string;
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
  onViewStock: (symbol: string) => Promise<void>;
  onAddToPortfolio: (symbol: string) => Promise<void>;
}

export const RecommendationsList = ({ 
  recommendations, 
  onViewStock, 
  onAddToPortfolio 
}: RecommendationsListProps) => {
  return (
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <Card key={index} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{rec.symbol} - {rec.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewStock(rec.symbol)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddToPortfolio(rec.symbol)}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};