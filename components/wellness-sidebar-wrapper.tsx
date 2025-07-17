"use client";

import { WellnessSidebar } from "@/components/wellness-sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function WellnessSidebarWrapper() {
  const { open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const [isOpen, setIsOpen] = useState(open);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setIsOpen(openMobile);
    } else {
      setIsOpen(open);
    }
  }, [open, openMobile, isMobile]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (isMobile) {
      setOpenMobile(newState);
    } else {
      setOpen(newState);
    }
  };

  return <WellnessSidebar isOpen={isOpen} onToggle={handleToggle} />;
}