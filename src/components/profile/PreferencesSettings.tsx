import { Switch } from "@/components/ui/switch";
import { Bell, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const PreferencesSettings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5" />
          <span>Notifications</span>
        </div>
        <Switch />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon className="h-5 w-5" />
          <span>Dark Mode</span>
        </div>
        <Switch 
          checked={theme === "dark"}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        />
      </div>
    </div>
  );
};

export default PreferencesSettings;