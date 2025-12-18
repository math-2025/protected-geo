"use client";

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, doc, writeBatch } from 'firebase/firestore';
import type { SuspiciousActivity } from '@/lib/types';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';

export default function SuspiciousActivityView() {
  const { firestore } = useFirebase();

  const activitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'suspicious_activities'), orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: activities, isLoading } = useCollection<SuspiciousActivity>(activitiesQuery);

  // Mark activities as seen
  useEffect(() => {
    if (activities && firestore) {
      const unseenActivities = activities.filter(a => !a.seen);
      if (unseenActivities.length > 0) {
        const batch = writeBatch(firestore);
        unseenActivities.forEach(activity => {
          const activityRef = doc(firestore, 'suspicious_activities', activity.id);
          batch.update(activityRef, { seen: true });
        });
        // Non-blocking commit
        batch.commit().catch(console.error);
      }
    }
  }, [activities, firestore]);

  return (
    <div className="h-screen w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>Şübhəli Hərəkətlər Jurnalı</CardTitle>
            <CardDescription>
              Sistemə daxil olan hesablara eyni anda bir neçə fərqli yerdən edilən giriş cəhdləri burada qeydə alınır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hədəf Hesab</TableHead>
                  <TableHead>IP Ünvan</TableHead>
                  <TableHead>Konum</TableHead>
                  <TableHead>Tarix və Saat</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        </TableRow>
                    ))
                ) : activities && activities.length > 0 ? (
                  activities.map((activity) => (
                    <TableRow key={activity.id} className={!activity.seen ? 'bg-destructive/10' : ''}>
                      <TableCell className="font-medium">{activity.username}</TableCell>
                      <TableCell className="font-mono">{activity.ipAddress}</TableCell>
                      <TableCell>{activity.location}</TableCell>
                      <TableCell>
                        {activity.timestamp ? format(activity.timestamp.toDate(), 'd MMMM yyyy, HH:mm:ss', { locale: az }) : 'Naməlum'}
                      </TableCell>
                       <TableCell>
                        {!activity.seen ? (
                            <Badge variant="destructive">Yeni</Badge>
                        ) : (
                            <Badge variant="secondary">Baxılıb</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            Heç bir şübhəli hərəkət qeydə alınmayıb.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
