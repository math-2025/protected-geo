import PublicMapView from '@/components/public-map-view';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Home() {
  return (
    <SidebarProvider>
      <main className="min-h-screen bg-background">
        <div className="w-full h-full">
          <PublicMapView />
        </div>
      </main>
    </SidebarProvider>
  );
}
