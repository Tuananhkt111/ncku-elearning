'use client'

import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="center">
        <Heading size="2xl">NCKU E-Learning Platform</Heading>
        <Text fontSize="lg" textAlign="center">
          Welcome to the interactive learning platform. This test consists of 3 sessions,
          each with specific tasks and evaluations.
        </Text>
        <Box>
          <Button
            size="lg"
            colorScheme="blue"
            onClick={() => router.push('/session/1')}
          >
            Start Test
          </Button>
        </Box>
      </VStack>
    </Container>
  )
}
