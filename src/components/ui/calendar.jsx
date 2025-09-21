import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-black",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-none hover:bg-gray-100 dark:hover:bg-white/10"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex w-full mb-2",
        head_cell: "text-gray-400 rounded-md w-8 font-bold text-[9px] uppercase tracking-tighter text-center",
        row: "flex w-full mt-1",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-bold aria-selected:opacity-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500/20 hover:text-gray-600 dark:hover:text-gray-400 transition-all mx-auto text-[12px]"
        ),
        day_selected: "bg-gray-600 text-white hover:bg-gray-700 hover:text-white focus:bg-gray-600 focus:text-white",
        day_today: "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white",
        day_outside: "text-gray-300 dark:text-gray-600 opacity-50",
        day_disabled: "text-gray-300 dark:text-gray-600 opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
