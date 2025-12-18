
"use client";

import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";
import type { TacticalIconType } from "@/lib/types";
import { Home } from "lucide-react";

// SVG icons for military symbols
const TankIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="14" width="22" height="6" rx="2"></rect>
        <path d="M6 14L6 8h12v6"></path>
        <path d="M12 8V4h-4v4"></path>
        <path d="M8 4h8"></path>
    </svg>
);

const HqIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
    </svg>
);

const JetIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12l10-10 4 4-3.5 3.5 3.5 3.5-4 4-10-10z"></path>
        <path d="M16 16l6 6"></path>
    </svg>
);

const InfantryIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5c-3.33 0-5 2-5 4 0 2 1.67 4 5 4s5-2 5-4c0-2-1.67-4-5-4z"></path>
        <path d="M12 9v10"></path>
        <path d="M5 14h14"></path>
    </svg>
);

const ArtilleryIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 3v18"></path>
        <path d="M3 12h18"></path>
        <path d="m5 7 14 10"></path>
        <path d="m5 17 14-10"></path>
    </svg>
);

const HelicopterIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8l18-4"></path>
        <path d="M3 16l18 4"></path>
        <path d="M12 2v20"></path>
        <path d="M12 2L6 4"></path>
        <path d="M12 2l6 2"></path>
    </svg>
);

const ObjectiveIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


const icons: { type: TacticalIconType; label: string; icon: React.FC<{className?: string}> }[] = [
    { type: 'tank', label: 'Tank', icon: TankIcon },
    { type: 'hq', label: 'Qərargah', icon: HqIcon },
    { type: 'jet', label: 'Qırıcı', icon: JetIcon },
    { type: 'infantry', label: 'Piyada', icon: InfantryIcon },
    { type: 'artillery', label: 'Artilleriya', icon: ArtilleryIcon },
    { type: 'helicopter', label: 'Helikopter', icon: HelicopterIcon },
    { type: 'objective', label: 'Hədəf', icon: ObjectiveIcon },
    { type: 'home', label: 'Sivil', icon: Home },
];

export const TacticalIcon = ({ type, label, isDraggable, isOnMap }: { type: TacticalIconType, label: string, isDraggable?: boolean, isOnMap?: boolean }) => {
    const IconComponent = icons.find(i => i.type === type)?.icon || 'div';
    const handleDragStart = (e: React.DragEvent) => {
        if (!isDraggable) return;
        const data = JSON.stringify({ type, label });
        e.dataTransfer.setData('application/json', data);
        e.dataTransfer.effectAllowed = 'copy';
    }

    const iconWrapperClasses = cn(
        "flex items-center justify-center rounded-md border-2 border-dashed bg-background/50 group",
        isDraggable && "cursor-grab",
        isOnMap ? "w-7 h-7 border-accent/80 bg-background/80 shadow-lg" : "w-11 h-11 border-sidebar-border hover:border-sidebar-ring hover:bg-sidebar-accent"
    );

    const iconClasses = cn(
        "transition-colors",
        isOnMap ? "w-4 h-4 text-accent" : "w-6 h-6 text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground"
    );

    const iconElement = (
        <div
            className={iconWrapperClasses}
            draggable={isDraggable}
            onDragStart={handleDragStart}
        >
            <IconComponent className={iconClasses} />
        </div>
    );
    
    if (isOnMap) return iconElement;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{iconElement}</TooltipTrigger>
            <TooltipContent side="right" align="center">
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
};


export default function TacticalIconsPalette() {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Taktiki Nişanlar</SidebarGroupLabel>
            <SidebarGroupContent>
                <TooltipProvider>
                    <div className="grid grid-cols-4 gap-1 group-data-[collapsible=icon]:grid-cols-1">
                        {icons.map(iconInfo => (
                            <TacticalIcon key={iconInfo.type} type={iconInfo.type} label={iconInfo.label} isDraggable />
                        ))}
                    </div>
                </TooltipProvider>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
