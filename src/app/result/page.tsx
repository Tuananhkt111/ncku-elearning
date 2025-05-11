'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Box,
  Spinner,
} from '@chakra-ui/react'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { UserID } from '@/components/UserID'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/lib/stores/userStore'

interface ResultData {
  scores: boolean[][]
  totalQuestions: number[]
  sessionTimes: number[]
  totalTime: number
}

export default function ResultPage() {
  const router = useRouter()
  const { getAllScores } = useSessionStore()
  const { userId } = useUserStore()
  const [resultData, setResultData] = useState<ResultData | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadResults = async () => {
      const scores = await getAllScores()
      
      if (!scores || scores.length === 0 || !userId) {
        router.push('/')
        return
      }

      // Get time data from user_test_answer table
      const { data: testAnswers } = await supabase
        .from('user_test_answer')
        .select(`
          *,
          user_test_answer_detail (
            id,
            question_id,
            answer,
            is_correct
          )
        `)
        .eq('user_id', userId)
        .order('session_id', { ascending: true })

      if (!testAnswers) {
        router.push('/')
        return
      }

      // Calculate total questions per session
      const totalQuestions = scores.map(sessionScores => sessionScores.length)
      
      // Get time data from database (in seconds)
      const sessionTimes = testAnswers.map(answer => answer.total_time)
      const totalTime = sessionTimes.reduce((sum, time) => sum + time, 0)

      setResultData({
        scores,
        totalQuestions,
        sessionTimes,
        totalTime
      })
    }
    loadResults()
  }, [getAllScores, router, userId, supabase])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (!resultData) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
      </Container>
    )
  }

  return (
    <Container maxW="container.md" py={10}>
      <UserID />
      <VStack spacing={8}>
        <Heading>Test Results</Heading>

        <StatGroup w="full">
          <Stat>
            <StatLabel>Total Score</StatLabel>
            <StatNumber>
              {resultData.scores.reduce((total, sessionScores) => 
                total + sessionScores.filter(Boolean).length, 0)}/
              {resultData.totalQuestions.reduce((a, b) => a + b, 0)}
            </StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Time</StatLabel>
            <StatNumber>{formatTime(resultData.totalTime)}</StatNumber>
          </Stat>
        </StatGroup>

        <Box w="full">
          <Text fontSize="xl" mb={4}>Session Breakdown</Text>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Session</Th>
                  <Th>Score</Th>
                  <Th>Time</Th>
                </Tr>
              </Thead>
              <Tbody>
                {[1, 2, 3].map((sessionId) => (
                  <Tr key={sessionId}>
                    <Td>Session {sessionId}</Td>
                    <Td>
                      {resultData.scores[sessionId - 1].filter(Boolean).length}/
                      {resultData.totalQuestions[sessionId - 1]}
                    </Td>
                    <Td>{formatTime(resultData.sessionTimes[sessionId - 1])}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        <Text fontSize="lg" textAlign="center">
          Thank you for completing the test! Your results have been recorded.
        </Text>

        <Button
          colorScheme="blue"
          onClick={() => {
            useSessionStore.getState().resetSession()
            router.push('/')
          }}
        >
          Start New Test
        </Button>
      </VStack>
    </Container>
  )
} 