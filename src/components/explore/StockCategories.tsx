import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const stockCategories = [
  {
    title: "Small-Cap",
    description: "Companies with market capitalization under $2 billion",
    bgColor: "bg-[#F2FCE2]",
    textColor: "text-[#1A1F2C]"
  },
  {
    title: "Mid-Cap",
    description: "Companies with market capitalization between $2-10 billion",
    bgColor: "bg-[#D3E4FD]",
    textColor: "text-[#1A1F2C]"
  },
  {
    title: "Tech Stocks",
    description: "Leading technology companies",
    bgColor: "bg-[#8B5CF6]",
    textColor: "text-white"
  },
  {
    title: "AI Stocks",
    description: "Companies focused on artificial intelligence",
    bgColor: "bg-[#0FA0CE]",
    textColor: "text-white"
  }
];

export const StockCategories = () => {
  const { toast } = useToast();

  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      {stockCategories.map((category, index) => (
        <Card
          key={index}
          className={`p-4 cursor-pointer transition-transform hover:scale-105 ${category.bgColor} ${category.textColor}`}
          onClick={() => {
            toast({
              title: "Coming Soon",
              description: `${category.title} filtering will be available soon!`,
            });
          }}
        >
          <h3 className="font-semibold text-lg">{category.title}</h3>
          <p className="text-sm mt-1 opacity-90">{category.description}</p>
        </Card>
      ))}
    </div>
  );
};