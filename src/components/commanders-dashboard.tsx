
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDoc, query, where, getDocs } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { MilitaryUnit, UserProfile } from '@/lib/types';


export default function CommandersDashboard() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  // Edit dialog state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [assignedUnitId, setAssignedUnitId] = useState<string | undefined>('');
  const [canSeeAllUnits, setCanSeeAllUnits] = useState(false);
  
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

  const subCommanders = useMemo(() => {
    return users?.filter(u => u.role === 'sub-commander');
  }, [users]);
  
  const handleEditClick = (user: UserProfile) => {
    setUserToEdit(user);
    setUsername(user.username);
    setPassword(''); // Don't pre-fill password
    setAssignedUnitId(user.assignedUnitId);
    setCanSeeAllUnits(!!user.canSeeAllUnits);
  };
  
  const handleSaveEdit = () => {
    if (!firestore || !userToEdit) return;

    const updatedData: Partial<UserProfile> = {
      username: username,
      assignedUnitId: assignedUnitId === 'unassigned' ? undefined : assignedUnitId,
      canSeeAllUnits: canSeeAllUnits
    };

    if (password) {
        updatedData.password = password;
    }
    
    const userDocRef = doc(firestore, 'users', userToEdit.id);
    updateDocumentNonBlocking(userDocRef, updatedData);

    toast({
        title: "Komandir Yeniləndi",
        description: `"${username}" adlı komandirin məlumatları yeniləndi.`
    });

    setUserToEdit(null);
  };


  const handleDeleteClick = (user: UserProfile) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete || !firestore) return;

    try {
        const batch = writeBatch(firestore);
        
        // 1. Delete the user document
        const userDocRef = doc(firestore, 'users', userToDelete.id);
        batch.delete(userDocRef);

        // 2. Unassign the commander from their unit, if it exists
        if (userToDelete.assignedUnitId) {
            const unitDocRef = doc(firestore, 'military_units', userToDelete.assignedUnitId);
            const unitDocSnap = await getDoc(unitDocRef);
            if (unitDocSnap.exists()) {
                batch.update(unitDocRef, { commanderId: null });
            }
        }

        // 3. Delete all conversations involving this user
        const conversationsQuery = query(collection(firestore, 'conversations'), where('participants', 'array-contains', userToDelete.id));
        const conversationsSnapshot = await getDocs(conversationsQuery);
        conversationsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
            // Note: Subcollection 'messages' will be deleted automatically by Firestore Functions extension (if configured) or needs manual cleanup.
            // For this app, we assume they are cleaned up or it's acceptable for them to become orphaned.
        });
        
        await batch.commit();

        toast({
            title: "Komandir Silindi",
            description: `"${userToDelete.username}" adlı komandir və əlaqəli söhbətləri sistemdən silindi.`,
        });

    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Xəta",
            description: "Silmə əməliyyatı zamanı xəta baş verdi: " + error.message,
        });
    } finally {
        setUserToDelete(null);
    }
  };
  
  const getUnitName = (unitId: string | undefined) => {
    if (isLoadingUnits) return 'Yüklənir...';
    if (!units || !unitId) return 'Təyin edilməyib';
    return units.find(u => u.id === unitId)?.name || 'Naməlum Bölük';
  };

  return (
    <div className="h-screen w-full p-4">
        <Card>
          <CardHeader className='flex-row items-center justify-between'>
            <div>
                <CardTitle>Komandirlərin İdarəsi</CardTitle>
                <CardDescription>{subCommanders?.length ?? 0} sub-komandir mövcuddur</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İstifadəçi Adı</TableHead>
                  <TableHead>Təyin Edilmiş Bölük</TableHead>
                  <TableHead>Bütün Bölükləri Görür</TableHead>
                  <TableHead className='text-right'>Əməliyyatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                    <TableRow><TableCell colSpan={4}>Yüklənir...</TableCell></TableRow>
                ) : subCommanders?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{getUnitName(user.assignedUnitId)}</TableCell>
                    <TableCell>{user.canSeeAllUnits ? 'Bəli' : 'Xeyr'}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className='h-4 w-4' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                                 <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                    <Edit className='mr-2 h-4 w-4' />
                                    Redaktə Et
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Silməni Təsdiqlə</AlertDialogTitle>
                <AlertDialogDescription>
                "{userToDelete?.username}" adlı komandiri silmək istədiyinizdən əminsinizmi? Bu əməliyyat geri qaytarıla bilməz.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Ləğv Et</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Bəli, Sil
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <Dialog open={!!userToEdit} onOpenChange={(open) => !open && setUserToEdit(null)}>
             <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Komandiri Redaktə Et</DialogTitle>
                    <DialogDescription>
                        "{userToEdit?.username}" adlı komandirin məlumatlarını yeniləyin.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-username" className="text-right">İstifadəçi Adı</Label>
                        <Input id="edit-username" value={username} onChange={(e) => setUsername(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-password" className="text-right">Yeni Şifrə</Label>
                        <Input id="edit-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" placeholder="Dəyişmirsə boş buraxın" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-unit-select" className="text-right">Bölük</Label>
                        <Select onValueChange={setAssignedUnitId} value={assignedUnitId}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Bölük seçin..." /></SelectTrigger>
                            <SelectContent>
                            {isLoadingUnits ? (<SelectItem value="loading" disabled>Yüklənir...</SelectItem>) : (
                                <>
                                <SelectItem value="unassigned">Təyin Edilməyib</SelectItem>
                                {units?.map((unit) => (<SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>))}
                                </>
                            )}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="edit-can-see-all" className="text-right">Geniş Səlahiyyət</Label>
                         <div className='col-span-3 flex items-center'>
                            <Switch 
                                id="edit-can-see-all"
                                checked={canSeeAllUnits}
                                onCheckedChange={setCanSeeAllUnits}
                            />
                         </div>
                    </div>

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setUserToEdit(null)}>Ləğv Et</Button>
                    <Button onClick={handleSaveEdit}>Yadda Saxla</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
