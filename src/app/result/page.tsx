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

interface ResultData {
  scores: boolean[][]
  totalQuestions: number[]
  sessionTimes: number[]
  totalTime: number
}

export default function ResultPage() {
  const router = useRouter()
  const { getAllScores, getTotalScore, sessionDurations, timeLeftPerSession } = useSessionStore()
  const [resultData, setResultData] = useState<ResultData | null>(null)

  useEffect(() => {
    const loadResults = async () => {
      const scores = await getAllScores()
      
      if (!scores || scores.length === 0) {
        router.push('/')
        return
      }

      // Calculate total questions per session
      const totalQuestions = scores.map(sessionScores => sessionScores.length)
      
      // Calculate actual time taken for each session
      const sessionTimes = sessionDurations.map((duration: number, index: number) => {
        const initialTimeInSeconds = duration * 60 // Convert minutes to seconds
        const timeLeft = timeLeftPerSession[index] || 0
        return initialTimeInSeconds - timeLeft // Time spent = initial time - time left
      })

      // Calculate total time from all sessions
      const totalTime = sessionTimes.reduce((sum: number, time: number) => sum + time, 0)

      setResultData({
        scores,
        totalQuestions,
        sessionTimes,
        totalTime
      })
    }
    loadResults()
  }, [getAllScores, getTotalScore, sessionDurations, timeLeftPerSession, router])

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