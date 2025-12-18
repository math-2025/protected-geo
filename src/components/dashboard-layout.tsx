"use client";

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import MapPlaceholder from './map-placeholder';
import UnitsDashboard from './units-dashboard';
import { useAuth } from '@/hooks/use-auth-provider';
import MessagingView from './messaging-view';
import CommandersDashboard from './commanders-dashboard';
import SuspiciousActivityView from './suspicious-activity-view';

type View = 'map' | 'units' | 'commanders' | 'messages' | 'suspicious-activity';

export default function DashboardLayout() {
  const [activeView, setActiveView] = useState<View>('map');
  const { user } = useAuth();
  
  const isCommander = user?.role === 'commander';

  // We need to lift state up so the map can control the sidebar animation
  const mapComponent = (
    <MapPlaceholder />
  );


  return (
    <SidebarProvider>
        <DashboardSidebar 
            activeView={activeView} 
            setActiveView={setActiveView}
        />
        <main className="flex-1">
            {activeView === 'map' && mapComponent}
            {activeView === 'units' && isCommander && <UnitsDashboard />}
            {activeView === 'commanders' && isCommander && <CommandersDashboard />}
            {activeView === 'messages' && <MessagingView />}
            {activeView === 'suspicious-activity' && isCommander && <SuspiciousActivityView />}
        </main>
    </SidebarProvider>
  );
}

    