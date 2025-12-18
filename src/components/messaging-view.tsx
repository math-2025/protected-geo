

"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth-provider';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import {
    collection, query, where, orderBy, addDoc, serverTimestamp, doc, setDoc, getDocs, limit, writeBatch, increment, deleteDoc, getDoc
} from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Send, UserCircle, MessageSquarePlus, Trash2, KeyRound } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';
import type { Conversation, Message, UserProfile } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
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
import { useToast } from '@/hooks/use-toast';
import { encryptMessage, decryptMessage } from '@/lib/encryption';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


function ConversationList({ conversations, onSelect, selectedConversationId, currentUser, onDeleteConversation }) {
    const getOtherParticipant = (convo) => {
        if (!convo.participantDetails) return { username: "Naməlum" };
        return convo.participantDetails.find(p => p.id !== currentUser.id) || { username: "Naməlum" };
    };
    
    const getDecryptedLastMessage = (convo) => {
        if (!convo.lastMessage?.encryptedText) return "";

        try {
            // Since decryptMessage now returns the text directly, no extra properties needed
            return decryptMessage(convo.lastMessage.encryptedText);
        } catch (e) {
            return "Şifrəli mesaj...";
        }
    }


    return (
        <div className="flex flex-col gap-1">
            {conversations.map(convo => {
                const otherUser = getOtherParticipant(convo);
                const unreadCount = convo.unreadCount?.[currentUser.id] || 0;
                const lastMessageText = getDecryptedLastMessage(convo);

                return (
                    <button
                        key={convo.id}
                        onClick={() => onSelect(convo)}
                        className={`group/convo-item relative w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors ${selectedConversationId === convo.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{otherUser.username}</p>
                            {lastMessageText ? <p className="text-sm text-muted-foreground truncate">{lastMessageText}</p> : <p className="text-sm text-muted-foreground italic">Söhbət yoxdur</p>}
                        </div>
                         <div className="flex flex-col items-end self-start">
                            {convo.lastMessage?.timestamp && <span className="text-xs text-muted-foreground">{formatDistanceToNow(convo.lastMessage.timestamp.toDate(), { addSuffix: true, locale: az })}</span>}
                            {unreadCount > 0 && (
                                <span className="mt-1 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover/convo-item:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(convo);
                            }}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </button>
                )
            })}
        </div>
    );
}

function ChatWindow({ conversation, users }) {
    const { firestore } = useFirebase();
    const { user: currentUser } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // State for delete confirmation
    const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !conversation) return null;
        return query(collection(firestore, 'conversations', conversation.id, 'messages'), orderBy('timestamp', 'asc'));
    }, [firestore, conversation]);

    const { data: messages, isLoading } = useCollection<Message>(messagesQuery);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !firestore || !currentUser || !conversation) return;

        const otherParticipantId = conversation.participants.find(p => p !== currentUser.id);
        if (!otherParticipantId) return;

        const batch = writeBatch(firestore);

        const messagesRef = collection(firestore, 'conversations', conversation.id, 'messages');
        const newMessageRef = doc(messagesRef);
        
        // Use the new encryption function which returns an object with encryptedText
        const { encryptedText } = encryptMessage(newMessage);

        // The message object no longer contains asciiSum or encryptedAsciiSum
        batch.set(newMessageRef, {
            id: newMessageRef.id,
            conversationId: conversation.id,
            senderId: currentUser.id,
            encryptedText: encryptedText,
            timestamp: serverTimestamp()
        });
        
        const convoRef = doc(firestore, 'conversations', conversation.id);
        // The lastMessage object also no longer contains asciiSum or encryptedAsciiSum
        batch.set(convoRef, {
            lastMessage: {
                encryptedText: encryptedText,
                senderId: currentUser.id,
                timestamp: serverTimestamp()
            },
            [`unreadCount.${otherParticipantId}`]: increment(1)
        }, { merge: true });

        await batch.commit();
        setNewMessage('');
    };

    const handleDeleteMessage = async () => {
        if (!messageToDelete || !firestore || !conversation) return;

        const messageRef = doc(firestore, 'conversations', conversation.id, 'messages', messageToDelete.id);
        
        try {
            await deleteDoc(messageRef);
            toast({
                title: "Mesaj Silindi",
                description: "Mesajınız söhbətdən uğurla silindi.",
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Xəta",
                description: "Mesaj silinərkən bir problem yarandı.",
            });
        } finally {
            setMessageToDelete(null);
        }
    };
    
    const getDecryptedMessage = (msg: Message) => {
        if (!msg.encryptedText) return "";
        try {
            // Decryption function now only needs the encrypted text
            return decryptMessage(msg.encryptedText);
        } catch (e) {
            console.error("Decryption failed in getDecryptedMessage:", e);
            return "Mesaj deşifrə edilə bilmədi.";
        }
    }

    if (!conversation) {
        return <div className="h-full flex items-center justify-center text-muted-foreground">Söhbət seçin və ya yeni söhbətə başlayın</div>;
    }

    const otherParticipant = conversation.participantDetails.find(p => p.id !== currentUser?.id);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">{otherParticipant?.username || "Naməlum İstifadəçi"}</h2>
                <p className="text-sm text-muted-foreground">{otherParticipant?.role === 'commander' ? 'Baş Komandir' : 'Sub-Komandir'}</p>
            </div>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                {isLoading && <p>Mesajlar yüklənir...</p>}
                <div className="space-y-4">
                    {messages?.map(msg => {
                        const isSender = msg.senderId === currentUser?.id;
                        const senderDetails = isSender ? currentUser : otherParticipant;
                        const messageText = getDecryptedMessage(msg);
                        return (
                            <div key={msg.id} className={`group flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
                                {!isSender && (
                                    <Avatar className='h-8 w-8'>
                                        <AvatarFallback>{senderDetails?.username.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                )}
                                
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl relative ${isSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                                    <p>{messageText}</p>
                                    {msg.timestamp && (
                                        <p className={`text-xs mt-1 ${isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true, locale: az })}
                                        </p>
                                    )}
                                </div>

                                {isSender && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => setMessageToDelete(msg)}
                                        >
                                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Avatar className='h-8 w-8'>
                                            <AvatarFallback>{senderDetails?.username.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesajınızı yazın..."
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
            
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Mesajı Sil</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu mesajı silmək istədiyinizdən əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setMessageToDelete(null)}>Ləğv Et</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Bəli, Sil
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function NewConversationPopover({ users, currentUser, onSelectUser, existingConversationIds }) {
    const [open, setOpen] = useState(false);

    let availableUsers = [];
    if (!users || !currentUser) {
        availableUsers = [];
    } else if (currentUser.role === 'commander') {
        const usersInConversation = new Set(existingConversationIds);
        // Ensure we only deal with sub-commanders
        availableUsers = users.filter(u => u.role === 'sub-commander' && u.id !== currentUser.id && !usersInConversation.has(u.id));
    } else if (currentUser.role === 'sub-commander') {
        const commander = users.find(u => u.role === 'commander');
        if (commander && !existingConversationIds.has(commander.id)) {
            availableUsers = [commander];
        }
    }


    if (availableUsers.length === 0) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Button variant="ghost" size="icon" disabled>
                            <MessageSquarePlus className="h-5 w-5"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Yeni söhbət üçün komandir yoxdur</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MessageSquarePlus className="h-5 w-5"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-64">
                 <h3 className="p-2 text-sm font-semibold text-muted-foreground border-b">Yeni Söhbət</h3>
                <ScrollArea className="h-auto max-h-72">
                    {availableUsers.map(user => (
                         <button
                            key={user.id}
                            onClick={() => {
                                onSelectUser(user);
                                setOpen(false);
                            }}
                            className="w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors hover:bg-muted/50"
                        >
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate text-sm">{user.username}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user.role === 'commander' ? 'Baş Komandir' : user.role}</p>
                            </div>
                        </button>
                    ))}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}


export default function MessagingView() {
    const { firestore } = useFirebase();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);


    const conversationsQuery = useMemoFirebase(() => {
        if (!currentUser || !firestore) return null;
        return query(collection(firestore, 'conversations'), where('participants', 'array-contains', currentUser.id));
    }, [firestore, currentUser]);

    const { data: conversations, isLoading: isLoadingConversations } = useCollection<Conversation>(conversationsQuery);
    
    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

    const handleSelectUser = async (targetUser: UserProfile) => {
        if (!currentUser || !firestore || !users) return;
        
        const participantIds = [currentUser.id, targetUser.id].sort();
        
        const q = query(
            collection(firestore, 'conversations'), 
            where('participants', '==', participantIds),
            limit(1)
        );

        const existingConvoSnap = await getDocs(q);
        
        let convoToSelect: Conversation;

        if (!existingConvoSnap.empty) {
            const convoDoc = existingConvoSnap.docs[0];
            convoToSelect = { id: convoDoc.id, ...convoDoc.data() } as Conversation;
        } else {
            const newConvoRef = doc(collection(firestore, 'conversations'));
            const initialUnreadCount = { [currentUser.id]: 0, [targetUser.id]: 0 };

            convoToSelect = {
                id: newConvoRef.id,
                participants: participantIds,
                unreadCount: initialUnreadCount,
                participantDetails: [], // will be populated by augmentedConversations
            };
            await setDoc(newConvoRef, { 
                participants: participantIds,
                unreadCount: initialUnreadCount,
            });
        }
        
        // Find the full details from the 'users' collection to populate participantDetails
         const fullParticipantDetails = users
            .filter(u => convoToSelect.participants.includes(u.id))
            .map(({ id, username, role }) => ({ id, username, role }));
        
        convoToSelect.participantDetails = fullParticipantDetails;
        setSelectedConversation(convoToSelect);
    }
    
    const augmentedConversations = useMemo(() => {
        if (!conversations || !users) return [];
        return conversations.map(convo => {
            const participantDetails = users
                .filter(u => convo.participants.includes(u.id))
                .map(({ id, username, role }) => ({ id, username, role }));
            return { ...convo, participantDetails };
        }).sort((a,b) => (b.lastMessage?.timestamp?.toDate()?.getTime() || 0) - (a.lastMessage?.timestamp?.toDate()?.getTime() || 0));
    }, [conversations, users]);

    // This effect marks messages as read when a conversation is opened.
    useEffect(() => {
        if (selectedConversation && currentUser && firestore) {
            const unreadCount = selectedConversation.unreadCount?.[currentUser.id];
            if (unreadCount && unreadCount > 0) {
                const convoRef = doc(firestore, 'conversations', selectedConversation.id);
                setDoc(convoRef, {
                    unreadCount: {
                        [currentUser.id]: 0
                    }
                }, { merge: true });
            }
        }
    }, [selectedConversation, currentUser, firestore]);

     // This effect deselects conversation if it gets deleted from another action
    useEffect(() => {
        if (selectedConversation && conversations) {
            if (!conversations.find(c => c.id === selectedConversation.id)) {
                setSelectedConversation(null);
            }
        }
    }, [conversations, selectedConversation]);
    
    const existingParticipantIds = useMemo(() => {
        if (!augmentedConversations || !currentUser) return new Set<string>();
        const participantIds = new Set<string>();
        augmentedConversations.forEach(c => {
            c.participants.forEach(p => {
                if (p !== currentUser.id) {
                    participantIds.add(p);
                }
            })
        });
        return participantIds;
    }, [augmentedConversations, currentUser]);
    
    const handleConfirmDeleteConversation = async () => {
        if (!conversationToDelete || !firestore) return;

        const batch = writeBatch(firestore);
        const convoRef = doc(firestore, 'conversations', conversationToDelete.id);
        const messagesRef = collection(convoRef, 'messages');

        try {
            // Delete all messages in the subcollection
            const messagesSnapshot = await getDocs(messagesRef);
            messagesSnapshot.forEach(messageDoc => {
                batch.delete(messageDoc.ref);
            });

            // Delete the conversation document itself
            batch.delete(convoRef);

            await batch.commit();

            toast({
                title: "Söhbət Silindi",
                description: "Seçilmiş söhbət və bütün mesajlar silindi.",
            });

        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Xəta",
                description: "Söhbət silinərkən bir problem yarandı.",
            });
            console.error("Error deleting conversation:", error);
        } finally {
            setConversationToDelete(null);
        }
    };


    return (
        <div className="h-screen w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
            <Card className="md:col-span-1 lg:col-span-1 rounded-none border-t-0 border-l-0 border-b-0 h-full flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between p-2">
                        <h2 className="text-xl font-semibold">Söhbətlər</h2>
                        {!isLoadingUsers && currentUser && (
                            <NewConversationPopover 
                                users={users || []}
                                currentUser={currentUser}
                                onSelectUser={handleSelectUser}
                                existingConversationIds={existingParticipantIds}
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-2 flex-1">
                    {isLoadingConversations || isLoadingUsers ? (
                        <p className='p-2 text-sm text-muted-foreground'>Söhbətlər yüklənir...</p>
                    ) : (
                        <ScrollArea className="h-full">
                           <ConversationList 
                                conversations={augmentedConversations}
                                onSelect={setSelectedConversation} 
                                selectedConversationId={selectedConversation?.id}
                                currentUser={currentUser}
                                onDeleteConversation={setConversationToDelete}
                            />
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
            <div className="md:col-span-2 lg:col-span-3 h-full">
                <ChatWindow conversation={selectedConversation} users={users || []} />
            </div>

            {/* Delete Conversation Dialog */}
            <AlertDialog open={!!conversationToDelete} onOpenChange={(open) => !open && setConversationToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Söhbəti Sil</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu söhbəti və içindəki bütün mesajları silmək istədiyinizdən əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConversationToDelete(null)}>Ləğv Et</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Bəli, Sil
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    
  
    
