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
  Radio,
  RadioGroup,
  Stack,
  Divider,
} from '@chakra-ui/react'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { useQuestionStore } from '@/lib/stores/questionStore'
import { getSession } from '@/lib/api'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { EvaluationQuestion } from '@/types/evaluation'

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
  const [evaluationSetup, setEvaluationSetup] = useState<EvaluationQuestion | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  
  const { getSessionScores, setTimeLeft: setStoreTimeLeft } = useSessionStore()
  const questionStore = useQuestionStore()
  const supabase = createClientComponentClient<Database>()

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

        // Fetch evaluation setup
        const { data: evaluationData, error: evaluationError } = await supabase
          .from('evaluation_questions')
          .select(`
            *,
            evaluation_variables:evaluation_variables (
              *,
              evaluation_suggested_answers:evaluation_suggested_answers (*)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (evaluationError) {
          console.error('Error fetching evaluation setup:', evaluationError)
        } else {
          setEvaluationSetup(evaluationData)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setIsLoading(false)
      }
    }
    loadData()
  }, [sessionId, questionStore, getSessionScores, hasStarted, supabase])

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

        <Divider />

        {evaluationSetup && (
          <VStack spacing={6} align="stretch" w="full">
            <Heading size="md">Evaluation Setup</Heading>
            
            <Text fontSize="lg" fontWeight="medium">
              {evaluationSetup.description}
            </Text>

            {evaluationSetup.evaluation_variables?.map((variable) => (
              <Box key={variable.id} p={4} borderWidth={1} borderRadius="md">
                <Text fontSize="md" fontWeight="bold" mb={3}>
                  {variable.variable_name}
                </Text>
                
                <RadioGroup
                  value={selectedAnswers[variable.id] || ''}
                  onChange={(value) => setSelectedAnswers(prev => ({
                    ...prev,
                    [variable.id]: value
                  }))}
                >
                  <Stack>
                    {variable.evaluation_suggested_answers
                      ?.sort((a, b) => a.order_number - b.order_number)
                      .map((answer) => (
                        <Radio key={answer.id} value={answer.id}>
                          {answer.answer_text}
                        </Radio>
                      ))
                    }
                  </Stack>
                </RadioGroup>
              </Box>
            ))}
          </VStack>
        )}

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