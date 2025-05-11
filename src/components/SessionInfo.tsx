'use client';

import { Box, Heading, Text, VStack, Badge, Divider, HStack } from '@chakra-ui/react';
import { Session } from '@/types';

interface SessionInfoProps {
  session: Session;
}

export function SessionInfo({ session }: SessionInfoProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg">
      <VStack align="start" spacing={4}>
        <Heading size="md">Session {session.id}</Heading>
        <Text>{session.description}</Text>
        
        <Box>
          <Text>Duration: {session.duration_minutes} minutes</Text>
          <Text>Evaluation: {session.evaluation_minutes} minutes</Text>
        </Box>

        {session.popups && session.popups.length > 0 && (
          <>
            <Divider />
            <Box w="100%">
              <Heading size="sm" mb={4}>Popups ({session.popups.length})</Heading>
              <VStack spacing={4} align="stretch">
                {session.popups.map((popup) => (
                  <Box 
                    key={popup.id} 
                    p={4} 
                    borderWidth={1} 
                    borderRadius="md" 
                    bg="gray.50"
                  >
                    <HStack mb={2} spacing={2}>
                      <Badge colorScheme="blue">
                        Starts at {formatTime(popup.start_time)}
                      </Badge>
                      <Badge colorScheme="green">
                        Duration: {formatTime(popup.duration)}
                      </Badge>
                    </HStack>
                    {popup.name && (
                      <Text fontWeight="medium">{popup.name}</Text>
                    )}
                    {popup.description && (
                      <Text color="gray.600" mt={1}>{popup.description}</Text>
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
} 