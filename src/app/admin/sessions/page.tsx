'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
  IconButton,
  VStack,
  Image,
  Button,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { Session } from '@/types';
import { SessionInfo } from '@/components/SessionInfo';
import { SessionForm } from '@/components/SessionForm';
import ImageUpload from '@/components/ImageUpload';
import {
  getSessions,
  updateSession,
} from '@/lib/api';

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadSessions = useCallback(async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      toast({
        title: 'Error loading sessions',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
      });
    }
  }, [toast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleUpdateSession = async (data: Omit<Session, 'id' | 'created_at'>) => {
    if (!selectedSession) return;
    try {
      setIsLoading(true);
      await updateSession(selectedSession.id, data);
      await loadSessions();
      onClose();
      toast({
        title: 'Session updated',
        status: 'success',
        duration: 3000,
      });
    } catch {
      toast({
        title: 'Error updating session',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (session: Session) => {
    setSelectedSession(session);
    setShowImageUpload(false);
    onOpen();
  };

  const handleImageUpload = async (imageUrl: string) => {
    if (!selectedSession) return;
    
    try {
      setIsLoading(true);
      await updateSession(selectedSession.id, {
        ...selectedSession,
        description: imageUrl,
      });

      // Update both the sessions list and selected session
      const updatedSessions = await getSessions();
      setSessions(updatedSessions);
      
      // Update the selected session with new image URL
      const updatedSession = updatedSessions.find(s => s.id === selectedSession.id);
      if (updatedSession) {
        setSelectedSession(updatedSession);
      }

      setShowImageUpload(false);
      toast({
        title: 'Image uploaded successfully',
        status: 'success',
        duration: 3000,
      });
    } catch {
      toast({
        title: 'Error uploading image',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>Sessions Management</Heading>

      <VStack spacing={4} align="stretch">
        {sessions.map((session) => (
          <Box key={session.id} position="relative">
            <SessionInfo session={session} />
            {session.description?.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) && (
              <Box mt={2} p={4} borderWidth={1} borderRadius="md">
                <Image
                  src={session.description}
                  alt={`Session ${session.id}`}
                  maxH="200px"
                  objectFit="contain"
                  mx="auto"
                />
              </Box>
            )}
            <IconButton
              aria-label="Edit session"
              icon={<EditIcon />}
              size="sm"
              position="absolute"
              top={4}
              right={4}
              onClick={() => handleEdit(session)}
            />
          </Box>
        ))}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Session</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {showImageUpload ? (
              <VStack spacing={4}>
                <ImageUpload
                  onUpload={handleImageUpload}
                  currentImage={selectedSession?.description}
                />
                <Button size="sm" onClick={() => setShowImageUpload(false)}>
                  Cancel Image Upload
                </Button>
              </VStack>
            ) : (
              <>
                <Button
                  size="sm"
                  colorScheme="blue"
                  mb={4}
                  onClick={() => setShowImageUpload(true)}
                >
                  Upload Session Image
                </Button>
                <SessionForm
                  initialData={selectedSession || undefined}
                  onSubmit={handleUpdateSession}
                  isLoading={isLoading}
                />
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
} 