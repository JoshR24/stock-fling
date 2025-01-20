import { Link, useLocation } from "react-router-dom";
import { Grid, Search, Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t h-16">
      <div className="max-w-md mx-auto h-full">
        <div className="grid grid-cols-4 gap-1 h-full">
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center justify-center text-sm",
              isActive("/") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Grid className="h-5 w-5 mb-1" />
            <span>Swipe</span>
          </Link>
          <Link
            to="/explore"
            className={cn(
              "flex flex-col items-center justify-center text-sm",
              isActive("/explore") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Search className="h-5 w-5 mb-1" />
            <span>Explore</span>
          </Link>
          <Link
            to="/portfolio"
            className={cn(
              "flex flex-col items-center justify-center text-sm",
              isActive("/portfolio") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Briefcase className="h-5 w-5 mb-1" />
            <span>Portfolio</span>
          </Link>
          <Link
            to="/profile"
            className={cn(
              "flex flex-col items-center justify-center text-sm",
              isActive("/profile") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <User className="h-5 w-5 mb-1" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;