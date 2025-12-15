import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Logo from '../ui/Logo';
import {
  PanelLeftOpen,
  PanelLeftClose,
  LayoutDashboard,
  Bell,
  Video,
  Calendar,
  Settings,
  User,
  Sun,
  Moon
} from "lucide-react";

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const { theme, setTheme } = useTheme();

  let tooltipTimer = null;

  const handleMouseEnter = (itemId) => {
    setHoveredItem(itemId);
    tooltipTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 1500);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
    setShowTooltip(false);
    if (tooltipTimer) clearTimeout(tooltipTimer);
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'notification', icon: Bell, label: 'Notifications' },
    { id: 'video', icon: Video, label: 'Meetings' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-screen p-2">
      <nav
        className={cn(
          "h-full transition-all duration-300 rounded-2xl",
          "dark:bg-[#121212] bg-white border dark:border-gray-800 border-gray-100",
          isExpanded ? "w-64" : "w-16"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "flex h-14 items-center px-3",
            isExpanded ? "justify-between" : "justify-center"
          )}>
            {isExpanded && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Logo className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-medium dark:text-white text-gray-900">
                    Wavemeet
                  </span>
                  <span className="text-xs text-gray-400">
                    Free
                  </span>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-lg dark:text-gray-400 text-gray-600 dark:hover:bg-[#1e1e1e] hover:bg-gray-100 dark:hover:text-white hover:text-gray-900"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Platform Label */}
          {isExpanded && (
            <div className="px-3 pt-6 pb-2">
              <span className="text-xs font-medium text-gray-400">
                Platform
              </span>
            </div>
          )}

          {/* Nav Items */}
          <div className="px-2 py-2">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className="relative">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full rounded-lg",
                        isExpanded ? "justify-start px-3" : "justify-center px-2",
                        "h-9 dark:text-gray-300 text-gray-600 dark:hover:bg-[#1e1e1e] hover:bg-gray-100 dark:hover:text-white hover:text-gray-900",
                        activeItem === item.id && "dark:bg-[#1e1e1e] bg-gray-100 dark:text-white text-gray-900"
                      )}
                      onClick={() => setActiveItem(item.id)}
                      onMouseEnter={() => handleMouseEnter(item.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Icon className="h-4 w-4 min-w-[16px]" />
                      {isExpanded && (
                        <span className="ml-3 text-[14px] font-medium">
                          {item.label}
                        </span>
                      )}
                    </Button>

                    {!isExpanded && hoveredItem === item.id && showTooltip && (
                      <div className="absolute left-full top-1/2 ml-2 -translate-y-1/2 px-2 py-1 rounded-md dark:bg-[#1e1e1e] bg-gray-100 dark:text-white text-gray-900 text-xs">
                        {item.label}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Footer Section */}
          <div className="p-2 mt-auto">
            <div className={cn(
              "flex items-center gap-2 rounded-lg p-2",
              "dark:bg-[#1e1e1e] bg-gray-50"
            )}>
              {/* Profile Button */}
              <div className={cn(
                "flex items-center",
                isExpanded ? "flex-1 gap-3" : "justify-center w-full"
              )}>
                <div className="h-8 w-8 rounded-full dark:bg-gray-700 bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                {isExpanded && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium dark:text-white text-gray-900">
                      John Doe
                    </span>
                  </div>
                )}
              </div>

              {isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-lg dark:text-gray-400 text-gray-600 dark:hover:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:text-white hover:text-gray-900"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
