'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  useToast,
  VStack,
  Button,
  Grid,
  GridItem,
  Text,
  Link,
  Spinner,
  Center,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { Session } from '@/types';
import { getSessions } from '@/lib/api';

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSessions();
      setSessions(data);
    } catch (error) {
      toast({
        title: 'Error loading sessions',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <Box>
      <Heading size="lg" mb={6}>Sessions Management</Heading>

      {isLoading ? (
        <Center py={10}>
          <Spinner size="xl" />
        </Center>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
          {sessions.map((session) => (
            <GridItem key={session.id} p={6} borderWidth={1} borderRadius="lg" bg="white">
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Session {session.id}</Heading>
                
                <Box>
                  <Text fontWeight="bold">Duration:</Text>
                  <Text>{session.duration_minutes} minutes</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Question Sets:</Text>
                  <Text>{session.question_sets?.length || 0} sets</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Total Questions:</Text>
                  <Text>
                    {session.question_sets?.reduce((total, set) => total + (set.questions?.length || 0), 0) || 0} questions
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Popups:</Text>
                  <Text>{session.popups?.length || 0} popups</Text>
                </Box>

                <Link
                  as={NextLink}
                  href={`/admin/session/${session.id}`}
                  passHref
                >
                  <Button colorScheme="blue" width="full">
                    Manage Session
                  </Button>
                </Link>
              </VStack>
            </GridItem>
          ))}
        </Grid>
      )}
    </Box>
  );
} 