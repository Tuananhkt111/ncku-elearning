'use client'

import { Box, Button, Container, Heading, Text, VStack } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/lib/stores/userStore'
import { useSessionOrderStore } from '@/lib/stores/sessionOrderStore'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const { setUserId } = useUserStore()
  const { generateRandomOrder, getNextSession } = useSessionOrderStore()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleStartTest = async () => {
    try {
      setIsLoading(true)
      
      // Get the latest user ID from the database
      const { data: latestUser } = await supabase
        .from('users')
        .select('user_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Generate new user ID
      const nextUserNumber = latestUser ? parseInt(latestUser.user_id.replace('User', '')) + 1 : 1
      const newUserId = `User${nextUserNumber}`

      // Insert new user into database
      await supabase
        .from('users')
        .insert([{ user_id: newUserId }])

      // Store user ID in local state
      setUserId(newUserId)

      // Generate random session order
      generateRandomOrder()

      // Get first session from random order
      const firstSession = getNextSession(null)

      // Navigate to first session
      router.push(`/session/${firstSession}`)
    } catch (error) {
      console.error('Error starting test:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="center">
        <Heading size="2xl">NCKU E-Learning Platform</Heading>
        <Text fontSize="lg" textAlign="center">
          Welcome to the interactive learning platform. This test consists of 4 sessions,
          each with specific tasks and evaluations.
        </Text>
        <Box>
          <Button
            size="lg"
            colorScheme="blue"
            onClick={handleStartTest}
            isLoading={isLoading}
          >
            Start Test
          </Button>
        </Box>
      </VStack>
    </Container>
  )
}
