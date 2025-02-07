
import { Stock } from "@/lib/mockStocks";
import { StockCard } from "@/components/StockCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface StockSwiperProps {
  stocks: Stock[];
  onSwipe: (direction: "left" | "right") => void;
}

export const StockSwiper = ({ stocks, onSwipe }: StockSwiperProps) => {
  return (
    <motion.div
      key="swiper"
      initial={{ opacity: 0, x: -300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="relative h-[calc(100%-4rem)]"
    >
      {stocks.length === 0 ? (
        <div className="w-full h-full">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      ) : (
        <AnimatePresence>
          {stocks.slice(0, 1).map((stock) => (
            <StockCard
              key={stock.id}
              stock={stock}
              onSwipe={onSwipe}
            />
          ))}
        </AnimatePresence>
      )}
    </motion.div>
  );
};
