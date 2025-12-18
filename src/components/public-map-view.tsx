'use client';

import { useState, useEffect } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Decoy } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export default function PublicMapView() {
  const { firestore } = useFirebase();
  
  const decoysQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'decoys');
  }, [firestore]);

  const { data: decoys, isLoading } = useCollection<Decoy>(decoysQuery);

  const mapImage = PlaceHolderImages.find((img) => img.id === 'azerbaijan-map');

  return (
    <div className="w-screen h-screen relative bg-background text-foreground flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <h1 className="text-2xl font-headline text-white drop-shadow-md">
          Komandir paneli
        </h1>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-sm font-medium text-red-400 uppercase tracking-wider drop-shadow-md">
            aktiv bölüklər
          </span>
        </div>
      </header>
      
      <main className="flex-grow relative">
        <TooltipProvider>
          <div className="absolute inset-0 bg-muted">
            {mapImage ? (
              <Image
                src={mapImage.imageUrl}
                alt={mapImage.description}
                fill
                className="object-cover"
                data-ai-hint={mapImage.imageHint}
                priority
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p>Xəritə yüklənir...</p>
              </div>
            )}

            {isLoading ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center space-y-4">
                      <p className="text-white">Məlumatlar yoxlanılır...</p>
                      <Skeleton className='w-48 h-4 mx-auto' />
                  </div>
              </div>
            ) : !decoys || decoys.length === 0 ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <p className="text-white">Hal-hazırda izlənilən mövqe yoxdur.</p>
              </div>
            ) : (
              decoys.map((decoy) => (
                <Tooltip key={decoy.id}>
                    <TooltipTrigger asChild>
                    <div
                        className="absolute transition-all duration-1000"
                        style={{ top: `${decoy.latitude}%`, left: `${decoy.longitude}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        <div className="relative w-6 h-6">
                            <div className="absolute inset-0 bg-red-600 rounded-full pulse-anim"></div>
                            <div className="absolute inset-1 bg-red-400 rounded-full"></div>
                        </div>
                    </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className='font-bold text-red-400'>{decoy.publicName || 'Yem Hədəf'}</p>
                    </TooltipContent>
                </Tooltip>
              ))
            )}
          </div>
        </TooltipProvider>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-center text-gray-300 drop-shadow-md text-sm">
          Komandir panelinə xoş gəlmisiniz burada mövcud bölkülərin koordinatlarını görə bilərsiniz
        </p>
      </footer>
    </div>
  );
}
