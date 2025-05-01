'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container,
  VStack,
  Text,
  Button,
  Heading,
  Progress,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Spinner,
} from '@chakra-ui/react'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { useQuestionStore } from '@/lib/stores/questionStore'
import { getSession } from '@/lib/api'

export default function BreakPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = Number(params.id)
  const [timeLeft, setTimeLeft] = useState(-1)
  const [hasStarted, setHasStarted] = useState(false)
  const [evaluationMinutes, setEvaluationMinutes] = useState(0)
  const [sessionScores, setSessionScores] = useState<boolean[]>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  const { getSessionScores, setTimeLeft: setStoreTimeLeft } = useSessionStore()
  const questionStore = useQuestionStore()

  useEffect(() => {
    const loadData = async () => {
      try {
        if (hasStarted) return
        // Get session data to get evaluation time
        const sessionData = await getSession(sessionId)
        if (sessionData && sessionData.evaluation_minutes) {
          setEvaluationMinutes(sessionData.evaluation_minutes)
          setTimeLeft(sessionData.evaluation_minutes * 60) // Convert minutes to seconds
          setHasStarted(true)
        }

        // Get all questions for this session
        const allQuestions = await questionStore.getQuestions()
        const sessionQuestions = allQuestions.filter(q => q.sessionId === sessionId)
        setTotalQuestions(sessionQuestions.length)

        // Get scores for this session
        const scores = await getSessionScores(sessionId)
        setSessionScores(scores)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setIsLoading(false)
      }
    }
    loadData()
  }, [sessionId, questionStore, getSessionScores, hasStarted])

  useEffect(() => {
    if (timeLeft == 0) {
      // Update store before navigation
      setStoreTimeLeft(sessionId, 0)
      // Navigate to next session when timer ends
      if (sessionId < 3) {
        router.push(`/session/${sessionId + 1}`)
      } else {
        router.push('/result')
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTimeLeft = prevTime <= 0 ? 0 : prevTime - 1
        // Update time left in store
        setStoreTimeLeft(sessionId, newTimeLeft)
        return newTimeLeft
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, sessionId, router, setStoreTimeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
      </Container>
    )
  }

  // Calculate correct answers for this session
  const correctAnswers = sessionScores.filter(Boolean).length

  const progress = timeLeft > 0 ? (timeLeft / (evaluationMinutes * 60)) * 100 : 0

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8}>
        <Heading>Session {sessionId} Complete!</Heading>
        
        <Box w="full">
          <Text mb={2}>Break Time Remaining</Text>
          <Progress
            value={progress}
            size="lg"
            colorScheme="blue"
          />
          <Text mt={2} textAlign="center" fontSize="2xl">
            {formatTime(timeLeft)}
          </Text>
        </Box>

        <StatGroup w="full">
          <Stat>
            <StatLabel>Session Score</StatLabel>
            <StatNumber>{correctAnswers}/{totalQuestions}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Questions Completed</StatLabel>
            <StatNumber>{totalQuestions}/{totalQuestions}</StatNumber>
          </Stat>
        </StatGroup>

        <Text fontSize="lg" textAlign="center">
          Take a moment to rest. The next session will start automatically.
        </Text>

        {sessionId === 3 && (
          <Button
            colorScheme="blue"
            onClick={() => router.push('/result')}
          >
            View Final Results
          </Button>
        )}
      </VStack>
    </Container>
  )
} 