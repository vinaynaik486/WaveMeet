import * as React from "react";
import { format, setHours, setMinutes, startOfDay } from "date-fns";
import { Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DateTimePicker({ date, setDate }) {
  const [selectedTime, setSelectedTime] = React.useState(
    date ? format(date, "HH:mm") : null
  );

  const timePresets = React.useMemo(() => {
    const times = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 30) {
        times.push(format(setMinutes(setHours(new Date(), i), j), "HH:mm"));
      }
    }
    return times;
  }, []);

  const handleDateSelect = (newDate) => {
    if (!newDate) return;
    const current = newDate;
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      setDate(setMinutes(setHours(current, hours), minutes));
    } else {
      setDate(current);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    const [hours, minutes] = time.split(":").map(Number);
    const current = date || new Date();
    setDate(setMinutes(setHours(current, hours), minutes));
  };

  return (
    <div className="flex flex-col sm:flex-row bg-white dark:bg-[#121222] rounded-[1.5rem] overflow-hidden border border-gray-100 dark:border-white/10 shadow-2xl max-w-fit mx-auto">
      <div className="p-1 border-r border-gray-100 dark:border-white/5 flex items-center justify-center w-full sm:w-[260px]">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          disabled={(d) => d < startOfDay(new Date())}
          className="rounded-xl"
        />
      </div>
      <div className="flex flex-col w-full sm:w-[150px] bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="p-2.5 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
          <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Times</span>
        </div>
        <ScrollArea className="h-[240px]">
          <div className="p-2 grid grid-cols-2 sm:grid-cols-1 gap-1">
            {timePresets.map((time) => (
              <Button
                key={time}
                variant="ghost"
                className={cn(
                  "justify-center sm:justify-start font-bold text-[12px] h-8 rounded-lg transition-all",
                  selectedTime === time 
                    ? "bg-gray-600 text-white hover:bg-gray-700 shadow-md shadow-gray-500/10" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-500/10 text-gray-600 dark:text-gray-400"
                )}
                onClick={() => handleTimeSelect(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
