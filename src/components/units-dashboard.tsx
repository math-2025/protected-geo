
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MoreVertical, PlusCircle, Trash2, LogOut } from 'lucide-react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import UnitManagement from './unit-management';
import type { MilitaryUnit, UserProfile } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, getDocs, where, writeBatch } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';


export default function UnitsDashboard() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isNewUnitDialogOpen, setIsNewUnitDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<MilitaryUnit | null>(null);

  const unitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'military_units');
  }, [firestore]);
  const { data: units, isLoading: isLoadingUnits } = useCollection<MilitaryUnit>(unitsQuery);

  const usersQuery = useMemoFirebase(() => {
    if(!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const [selectedUnit, setSelectedUnit] = useState<MilitaryUnit | null>(null);

  const handleDeleteClick = (unit: MilitaryUnit) => {
    setUnitToDelete(unit);
  };

  const confirmDelete = async () => {
    if (!unitToDelete || !firestore) return;

    const batch = writeBatch(firestore);

    try {
        // 1. Delete the military unit document
        const unitDocRef = doc(firestore, 'military_units', unitToDelete.id);
        batch.delete(unitDocRef);

        // 2. Delete the associated commander user and their conversations
        if (unitToDelete.commanderId) {
            const userDocRef = doc(firestore, 'users', unitToDelete.commanderId);
            batch.delete(userDocRef);

            // Delete conversations involving this user
            const conversationsQuery = query(collection(firestore, 'conversations'), where('participants', 'array-contains', unitToDelete.commanderId));
            const conversationsSnapshot = await getDocs(conversationsQuery);
            conversationsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
        }

        // 3. Query for and delete all operation targets assigned to this unit
        const targetsQuery = query(collection(firestore, 'operation_targets'), where('assignedUnitId', '==', unitToDelete.id));
        const targetsSnapshot = await getDocs(targetsQuery);
        targetsSnapshot.forEach(targetDoc => {
            batch.delete(targetDoc.ref);
        });
        
        // Commit all batched writes
        await batch.commit();

        toast({
            title: "Bölük Silindi",
            description: `${unitToDelete.name}, əlaqəli komandir, söhbətlər və bütün təyin edilmiş hədəflər sistemdən silindi.`,
        });

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Xəta",
            description: "Silmə əməliyyatı zamanı xəta baş verdi: " + error.message,
        });
    } finally {
        setUnitToDelete(null);
        setSelectedUnit(null); // Deselect the unit from the detail view
    }
  };
  
  const handlePermissionChange = (unit: MilitaryUnit | null, canSeeAllUnits: boolean) => {
      if (!firestore || !unit?.commanderId) return;

      const userDocRef = doc(firestore, 'users', unit.commanderId);
      updateDocumentNonBlocking(userDocRef, { canSeeAllUnits });

      toast({
          title: "İcazə Dəyişdirildi",
          description: `Komandirin xəritə görmə icazəsi yeniləndi.`
      });
  }

  const handleResetSession = (unit: MilitaryUnit | null) => {
    if (!firestore || !unit?.commanderId) {
        toast({
            variant: "destructive",
            title: "Xəta",
            description: "Komandir tapılmadı.",
        });
        return;
    }
    const sessionDocRef = doc(firestore, 'active_sessions', unit.commanderId);
    deleteDocumentNonBlocking(sessionDocRef);

    toast({
        title: "Sessiya Sıfırlandı",
        description: `"${getCommanderUsername(unit.commanderId)}" adlı komandirin aktiv sessiyası ləğv edildi. Artıq yeni cihazdan daxil ola bilər.`,
    });
  }

  const getCommanderForUnit = (unit: MilitaryUnit | null): UserProfile | undefined => {
      if (!unit || !users) return undefined;
      return users.find(u => u.id === unit.commanderId);
  }

  const commanderForSelectedUnit = useMemo(() => getCommanderForUnit(selectedUnit), [selectedUnit, users]);


  const getStatusVariant = (status: MilitaryUnit['status']) => {
    switch (status) {
      case 'operational':
        return 'default';
      case 'alert':
        return 'destructive';
      case 'offline':
      default:
        return 'secondary';
    }
  };

  const getCommanderUsername = (commanderId: string | undefined) => {
    if (isLoadingUsers) return 'Yüklənir...';
    if (!users || !commanderId) return 'Təyin edilməyib';
    return users.find(u => u.id === commanderId)?.username || 'Naməlum';
  }

  return (
    <div className="h-screen w-full grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      <div className="lg:col-span-1 flex flex-col">
        <Card className="flex-grow">
          <CardHeader className='flex-row items-center justify-between'>
            <div>
                <CardTitle>Bölüklər</CardTitle>
                <CardDescription>{units?.length ?? 0} bölük mövcuddur</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsNewUnitDialogOpen(true)}>
                <PlusCircle className='mr-2 h-4 w-4' />
                Yeni Bölük
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Əməliyyatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUnits ? (
                    <TableRow><TableCell colSpan={3}>Yüklənir...</TableCell></TableRow>
                ) : units?.map((unit) => (
                  <TableRow key={unit.id} onClick={() => setSelectedUnit(unit)} className={`cursor-pointer ${selectedUnit?.id === unit.id ? 'bg-muted/50' : ''}`}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(unit.status)}>{unit.status}</Badge></TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedUnit(unit); }}>
                                    <MoreVertical className='h-4 w-4' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                                <DropdownMenuItem onClick={() => handleDeleteClick(unit)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className='mr-2 h-4 w-4' />
                                    Sil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 flex flex-col">
        {selectedUnit ? (
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>Bölük Məlumatı: {selectedUnit.name}</CardTitle>
              <CardDescription>ID: {selectedUnit.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className='space-y-2'>
                    <h3 className='font-semibold'>Status</h3>
                    <p><Badge variant={getStatusVariant(selectedUnit.status)}>{selectedUnit.status}</Badge></p>
                </div>
                 <div className='space-y-2'>
                    <h3 className='font-semibold'>Xəritə</h3>
                    <p className='capitalize'>{selectedUnit.mapId}</p>
                </div>
                <div className='space-y-2'>
                    <h3 className='font-semibold'>Koordinatlar</h3>
                    {selectedUnit.latitude !== undefined && selectedUnit.longitude !== undefined ? (
                        <p className='font-mono'>{selectedUnit.latitude.toFixed(4)}, {selectedUnit.longitude.toFixed(4)}</p>
                    ) : (
                        <p className='text-muted-foreground'>Koordinatlar təyin edilməyib.</p>
                    )}
                </div>
                <div className='space-y-2'>
                    <h3 className='font-semibold'>Komandir</h3>
                    <p>{getCommanderUsername(selectedUnit.commanderId)}</p>
                </div>
                
                {commanderForSelectedUnit && (
                  <>
                  <div className='space-y-4 rounded-lg border p-4'>
                      <h3 className='font-semibold'>İcazələr</h3>
                      <div className="flex items-center justify-between">
                          <Label htmlFor="can-see-all-units" className='flex-grow pr-4'>
                              Bütün bölükləri və hədəfləri görə bilər
                              <p className='text-xs text-muted-foreground'>Aktiv olduqda, bu komandir xəritədəki bütün bölükləri və hədəfləri görə biləcək.</p>
                          </Label>
                          <Switch 
                            id="can-see-all-units"
                            checked={!!commanderForSelectedUnit.canSeeAllUnits}
                            onCheckedChange={(checked) => handlePermissionChange(selectedUnit, checked)}
                            disabled={isLoadingUsers}
                          />
                      </div>
                  </div>
                  <div className='space-y-4 rounded-lg border p-4'>
                      <h3 className='font-semibold'>Sessiya İdarəetməsi</h3>
                      <div className="flex items-center justify-between">
                          <Label htmlFor="reset-session" className='flex-grow pr-4'>
                              Aktiv Sessiyanı Sıfırla
                              <p className='text-xs text-muted-foreground'>Komandir sistemə başqa cihazdan daxil ola bilmirsə, bu düymə ilə onun mövcud sessiyasını ləğv edin.</p>
                          </Label>
                          <Button id="reset-session" variant="secondary" onClick={() => handleResetSession(selectedUnit)}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sıfırla
                          </Button>
                      </div>
                  </div>
                  </>
                )}
            </CardContent>
          </Card>
        ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground rounded-lg border-dashed border-2">
                Məlumat üçün bölük seçin.
            </div>
        )}
      </div>
      <UnitManagement isOpen={isNewUnitDialogOpen} onOpenChange={setIsNewUnitDialogOpen} />

      <AlertDialog open={!!unitToDelete} onOpenChange={(open) => !open && setUnitToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silməni Təsdiqlə</AlertDialogTitle>
            <AlertDialogDescription>
              "{unitToDelete?.name}" bölüyünü, ona bağlı komandir hesabını və bütün təyin edilmiş hədəfləri silmək istədiyinizdən əminsinizmi? Bu əməliyyat geri qaytarıla bilməz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUnitToDelete(null)}>Ləğv Et</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Bəli, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
