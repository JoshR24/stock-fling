import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface SearchFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
}

export const SearchForm = ({ prompt, setPrompt, onSubmit, isLoading }: SearchFormProps) => {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="E.g., Recommend stocks for renewable energy sector"
        className="flex-1"
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Recommendations"}
      </Button>
    </form>
  );
};