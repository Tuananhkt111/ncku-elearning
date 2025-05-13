'use client'

import { useEffect, useState, useRef } from 'react'
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
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { useQuestionStore } from '@/lib/stores/questionStore'
import { useSessionOrderStore } from '@/lib/stores/sessionOrderStore'
import { getSession } from '@/lib/api'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { EvaluationQuestion } from '@/types/evaluation'
import { UserID } from '@/components/UserID'
import { useUserStore } from '@/lib/stores/userStore'

interface UserTestAnswerDetail {
  id: string
  user_test_answer_id: string
  question_id: string
  answer: string
  is_correct: boolean
  created_at: string
}

interface UserTestAnswer {
  id: string
  user_id: string
  session_id: number
  total_time: number
  created_at: string
  user_test_answer_detail: UserTestAnswerDetail[]
}

export default function BreakPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = Number(params.id)
  const { getNextSession } = useSessionOrderStore()
  const [timeLeft, setTimeLeft] = useState(-1)
  const [hasStarted, setHasStarted] = useState(false)
  const [evaluationMinutes, setEvaluationMinutes] = useState(0)
  const [sessionScores, setSessionScores] = useState<UserTestAnswerDetail[]>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasAnswersSaved, setHasAnswersSaved] = useState(false)
  const [evaluationSetup, setEvaluationSetup] = useState<EvaluationQuestion | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [sessionName, setSessionName] = useState<string>('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [isTimeOut, setIsTimeOut] = useState(false)
  
  const { getSessionScores, setTimeLeft: setStoreTimeLeft } = useSessionStore()
  const { userId } = useUserStore()
  const questionStore = useQuestionStore()
  const supabase = createClientComponentClient<Database>()
  const toast = useToast()

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
          setSessionName(sessionData.name || `Session ${sessionId}`)
          
          // Set total questions from session data
          const totalQuestionsCount = sessionData.question_sets?.reduce((acc, set) => 
            acc + (set.questions?.length || 0), 0) || 0
          setTotalQuestions(totalQuestionsCount)
        }

        // Get scores from database
        const { data: testAnswer } = await supabase
          .from('user_test_answer')
          .select(`
            *,
            user_test_answer_detail:user_test_answer_detail (
              *
            )
          `)
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single() as { data: UserTestAnswer | null }

        if (testAnswer && testAnswer.user_test_answer_detail) {
          setSessionScores(testAnswer.user_test_answer_detail)
        }

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
  }, [sessionId, questionStore, getSessionScores, hasStarted, supabase, userId])

  useEffect(() => {
    if (timeLeft == 0) {
      setIsTimeOut(true)
      if (evaluationSetup?.evaluation_variables) {
        const unansweredCount = evaluationSetup.evaluation_variables.length - Object.keys(selectedAnswers).length;
        if (unansweredCount > 0) {
          toast({
            title: 'Time is up!',
            description: `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Please complete all questions.`,
            status: 'warning',
            duration: null,
            isClosable: true,
          });
        }
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
  }, [timeLeft, sessionId, setStoreTimeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDone = async () => {
    try {
      if (hasAnswersSaved) {
        console.log('Answers already saved, preventing duplicate submission');
        return;
      }
      setIsSaving(true)

      if (!userId) {
        throw new Error('User ID not found')
      }

      // Create evaluation answer record
      const { data: evaluationAnswer, error: evaluationError } = await supabase
        .from('evaluation_answers')
        .insert({
          user_id: userId,
          session_id: sessionId,
          completion_type: 'active'
        })
        .select()
        .single()

      if (evaluationError || !evaluationAnswer) {
        throw evaluationError || new Error('Failed to create evaluation answer')
      }

      // Create evaluation answer details
      const detailPromises = Object.entries(selectedAnswers).map(([variableId, answerId]) => {
        return supabase
          .from('evaluation_answer_details')
          .insert({
            evaluation_answer_id: evaluationAnswer.id,
            evaluation_variable_id: variableId,
            evaluation_suggested_answer_id: answerId
          })
      })

      await Promise.all(detailPromises)
      setHasAnswersSaved(true)

      // Stop timer and get next session
      setTimeLeft(0)
      setStoreTimeLeft(sessionId, 0)

      // Get next session from random order
      const nextSession = getNextSession(sessionId)

      // Navigate to next session or results based on session order
      if (nextSession) {
        router.push(`/session/${nextSession}`)
      } else {
        router.push('/result')
      }
    } catch (error) {
      console.error('Error saving evaluation answers:', error)
      toast({
        title: 'Error saving answers',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
      </Container>
    )
  }

  // Calculate correct answers for this session
  const correctAnswers = sessionScores.filter(detail => detail.is_correct).length
  const answeredQuestions = sessionScores.length

  const progress = timeLeft > 0 ? (timeLeft / (evaluationMinutes * 60)) * 100 : 0

  return (
    <Container maxW="container.md" py={10}>
      <UserID />
      <VStack spacing={8}>
        <Heading>Session {sessionName} Complete!</Heading>
        
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
            <StatNumber>{answeredQuestions}/{totalQuestions}</StatNumber>
          </Stat>
        </StatGroup>

        <Divider />

        {evaluationSetup && (
          <VStack spacing={6} align="stretch" w="full">
            <Heading size="md">Evaluation Setup</Heading>
            
            {isTimeOut && evaluationSetup.evaluation_variables && 
              evaluationSetup.evaluation_variables.length > Object.keys(selectedAnswers).length && (
              <Alert status="warning">
                <AlertIcon />
                Please complete all remaining questions highlighted in red.
              </Alert>
            )}

            <Text fontSize="lg" fontWeight="medium">
              {evaluationSetup.description}
            </Text>

            {evaluationSetup.evaluation_variables?.map((variable) => (
              <Box 
                key={variable.id} 
                p={4} 
                borderWidth={1} 
                borderRadius="md"
                bg={isTimeOut && !selectedAnswers[variable.id] ? 'red.50' : 'white'}
                borderColor={isTimeOut && !selectedAnswers[variable.id] ? 'red.300' : 'inherit'}
              >
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

            <Button
              colorScheme="green"
              size="lg"
              w="full"
              mt={4}
              onClick={onOpen}
              isLoading={isSaving}
              isDisabled={Object.keys(selectedAnswers).length !== evaluationSetup.evaluation_variables?.length || hasAnswersSaved}
            >
              Done
            </Button>
          </VStack>
        )}

        <Text fontSize="lg" textAlign="center">
          Take a moment to rest. Click Done when you&apos;re ready to continue.
        </Text>
      </VStack>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              End Session
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to end this evaluation session? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="green" 
                onClick={handleDone} 
                ml={3} 
                isLoading={isSaving}
                isDisabled={hasAnswersSaved}
              >
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
} 