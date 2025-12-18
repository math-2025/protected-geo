"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase/provider';
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { v4 as uuidv4 } from 'uuid';
import type { MilitaryUnit, UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { encryptCoordinates } from '@/lib/encryption';

interface UnitManagementProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const SINGLE_MAP_ID = 'main';

export default function UnitManagement({ isOpen, onOpenChange }: UnitManagementProps) {
  const { firestore } = useFirebase();
  const [unitName, setUnitName] = useState('');
  const [commanderUsername, setCommanderUsername] = useState('');
  const [commanderPassword, setCommanderPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateUnit = async () => {
    if (!unitName || !commanderUsername || !commanderPassword) {
      toast({
        variant: "destructive",
        title: "Xəta",
        description: "Bütün xanaları doldurun.",
      });
      return;
    }

    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Xəta",
            description: "Database bağlantısı yoxdur.",
          });
        return;
    }

    setLoading(true);

    try {
      const unitsRef = collection(firestore, 'military_units');
      const unitQuery = query(unitsRef, where('name', '==', unitName));
      const unitQuerySnapshot = await getDocs(unitQuery);

      if (!unitQuerySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Xəta",
          description: `"${unitName}" adlı bölük artıq mövcuddur. Fərqli ad seçin.`,
        });
        setLoading(false);
        return;
      }

      const usersRef = collection(firestore, 'users');
      const userQuery = query(usersRef, where('username', '==', commanderUsername));
      const userQuerySnapshot = await getDocs(userQuery);

      if (!userQuerySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Xəta",
          description: `"${commanderUsername}" adlı komandir adı artıq mövcuddur. Fərqli ad seçin.`,
        });
        setLoading(false);
        return;
      }

      const rawLatitude = 40.32077032371874;
      const rawLongitude = 49.82721853510493;
      
      const { encryptedLat, encryptedLng } = encryptCoordinates(rawLatitude, rawLongitude, commanderPassword);

      const newUnitId = uuidv4();
      const newUserId = uuidv4();

      const userDocRef = doc(firestore, 'users', newUserId);
      const newUser: UserProfile = {
          id: newUserId,
          username: commanderUsername,
          password: commanderPassword,
          role: 'sub-commander',
          canSeeAllUnits: false,
          assignedUnitId: newUnitId,
      };
      setDocumentNonBlocking(userDocRef, newUser);

      const unitDocRef = doc(firestore, 'military_units', newUnitId);
      const newUnit: MilitaryUnit = {
          id: newUnitId,
          name: unitName,
          status: 'offline',
          commanderId: newUserId,
          latitude: encryptedLat, // Save encrypted coordinate
          longitude: encryptedLng, // Save encrypted coordinate
          mapId: SINGLE_MAP_ID,
          encryptionKey: commanderPassword, // Save key for decryption
      };
      setDocumentNonBlocking(unitDocRef, newUnit);

      toast({
          title: "Uğurlu Əməliyyat",
          description: `Bölük "${unitName}" və komandiri "${commanderUsername}" yaradıldı. Koordinatlar şifrələndi.`
      });

      onOpenChange(false);
      setUnitName('');
      setCommanderUsername('');
      setCommanderPassword('');

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Xəta",
            description: "Bölük yaradılarkən xəta baş verdi: " + error.message,
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Bölük Yarat</DialogTitle>
          <DialogDescription>
            Yeni bir hərbi vahid və ona təyin olunmuş komandir hesabı yaradın.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit-name" className="text-right">
              Bölük Adı
            </Label>
            <Input id="unit-name" value={unitName} onChange={(e) => setUnitName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Komandir Adı
            </Label>
            <Input id="username" value={commanderUsername} onChange={(e) => setCommanderUsername(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Şifrə
            </Label>
            <Input id="password" type="password" value={commanderPassword} onChange={(e) => setCommanderPassword(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Ləğv et</Button>
          <Button type="submit" onClick={handleCreateUnit} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gözləyin...</> : 'Yarat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
