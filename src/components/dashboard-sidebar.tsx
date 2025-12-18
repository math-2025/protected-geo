"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth-provider";
import { LogOut, Map, MessageSquare, Shield, UserCircle, Users, Building2, AlertTriangle } from "lucide-react";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import type { Conversation, SuspiciousActivity } from "@/lib/types";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { useMemo } from "react";
import TacticalIconsPalette from "./tactical-icons-palette";

type View = 'map' | 'units' | 'commanders' | 'messages' | 'suspicious-activity';

interface DashboardSidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

export function DashboardSidebar({ activeView, setActiveView }: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const { firestore } = useFirebase();
  const isCommander = user?.role === 'commander';

  const conversationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'conversations'), where('participants', 'array-contains', user.id));
  }, [firestore, user]);

  const { data: conversations } = useCollection<Conversation>(conversationsQuery);
  
  const suspiciousActivityQuery = useMemoFirebase(() => {
    if (!firestore || !isCommander) return null;
    return query(
      collection(firestore, 'suspicious_activities'),
      where('seen', '==', false),
      limit(1)
    );
  }, [firestore, isCommander]);
  const { data: newSuspiciousActivities } = useCollection<SuspiciousActivity>(suspiciousActivityQuery);
  const hasNewSuspiciousActivity = (newSuspiciousActivities?.length ?? 0) > 0;

  const hasUnreadMessages = useMemo(() => {
    if (!conversations || !user) return false;
    return conversations.some(convo => convo.unreadCount && convo.unreadCount[user.id] > 0);
  }, [conversations, user]);

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-3">
                 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Shield className="h-6 w-6" />
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-foreground">GeoGuard</span>
                    <span className="text-xs text-muted-foreground">{isCommander ? 'Baş Komandir' : 'Sub-Komandir'}</span>
                </div>
            </div>
        </SidebarHeader>

        <SidebarContent className="p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={() => setActiveView('map')}
                        isActive={activeView === 'map'}
                        tooltip="Xəritə"
                    >
                        <Map />
                        <span>Xəritə Görünüşü</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={() => setActiveView('messages')}
                        isActive={activeView === 'messages'}
                        tooltip="Mesajlar"
                    >
                        <MessageSquare />
                        <span>Mesajlar</span>
                         {hasUnreadMessages && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-red-500" />
                        )}
                    </SidebarMenuButton>
                </SidebarMenuItem>
                {isCommander && (
                    <>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setActiveView('suspicious-activity')}
                                isActive={activeView === 'suspicious-activity'}
                                tooltip="Şübhəli Hərəkətlər"
                            >
                                <AlertTriangle className={hasNewSuspiciousActivity ? 'text-destructive' : ''} />
                                <span>Şübhəli Hərəkətlər</span>
                                {hasNewSuspiciousActivity && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-red-500" />
                                )}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setActiveView('units')}
                                isActive={activeView === 'units'}
                                tooltip="Bölüklər"
                            >
                                <Building2 />
                                <span>Bölüklər</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setActiveView('commanders')}
                                isActive={activeView === 'commanders'}
                                tooltip="Komandirlər"
                            >
                                <Users />
                                <span>Komandirlər</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </>
                )}
            </SidebarMenu>
            {isCommander && (
              <>
                <SidebarSeparator />
                <TacticalIconsPalette />
              </>
            )}
        </SidebarContent>

        <SidebarFooter>
            <div className="flex items-center gap-3 p-2">
                <Avatar>
                    <AvatarImage />
                    <AvatarFallback className="bg-muted-foreground text-background">
                       {user?.username ? getInitials(user.username) : <UserCircle/>}
                    </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground truncate">{user?.username}</span>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" />
                <span>Çıxış</span>
            </Button>
        </SidebarFooter>
    </Sidebar>
  );
}
