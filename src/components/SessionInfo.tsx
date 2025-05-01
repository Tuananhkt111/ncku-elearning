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

        {session.popup_start_time !== null && (
          <>
            <Divider />
            <Box>
              <HStack mb={2}>
                <Heading size="sm">Popup Information</Heading>
                <Badge colorScheme="blue">
                  Starts at {formatTime(session.popup_start_time)}
                </Badge>
                {session.popup_remind_time && (
                  <Badge colorScheme="purple">
                    Reminder at {formatTime(session.popup_remind_time)}
                  </Badge>
                )}
              </HStack>
              {session.popup_name && (
                <Text fontWeight="medium">{session.popup_name}</Text>
              )}
              {session.popup_description && (
                <Text color="gray.600">{session.popup_description}</Text>
              )}
              <Text fontSize="sm" color="gray.500" mt={1}>
                Duration: {formatTime(session.popup_duration!)}
              </Text>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
} 