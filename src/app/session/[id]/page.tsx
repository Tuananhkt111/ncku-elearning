'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  Text,
  Radio,
  RadioGroup,
  Button,
  useToast,
  useDisclosure,
  Spinner,
  Progress,
  HStack,
  Image,
} from '@chakra-ui/react'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { useQuestionStore, Question } from '@/lib/stores/questionStore'
import { Session } from '@/types'
import { getSession } from '@/lib/api'
import { UserID } from '@/components/UserID'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const sessionId = Number(params.id)
  const [timeLeft, setTimeLeft] = useState(7 * 60) // Default 7 minutes
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [hasInteracted, setHasInteracted] = useState(false)
  const [hasClosed, setHasClosed] = useState(false)
  const [hasBlink, setHasBlink] = useState(false)
  const [hasBlinkSetup, setHasBlinkSetup] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionData, setSessionData] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitializedTimer = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [popupBg, setPopupBg] = useState<string | undefined>(undefined)
  
  const { addAnswers, setTimeLeft: setStoreTimeLeft, setSessionDuration } = useSessionStore()
  const questionStore = useQuestionStore()

  // Handle submitting all answers
  const handleSubmitAll = useCallback(async (isAutoSubmit = false) => {
    try {
      if (!sessionData) return
      
      // Store final answers
      const finalAnswers = answers
      await addAnswers(sessionId, finalAnswers)
      
      // Add a toast message for auto-submit
      if (isAutoSubmit) {
        toast({
          title: 'Time is up!',
          description: 'Your answers have been automatically submitted.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        })
      }
      
      // Navigate to break page
      router.push(`/break/${sessionId}`)
    } catch (error) {
      console.error('Error submitting answers:', error)
      toast({
        title: 'Error submitting answers',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }, [sessionId, answers, addAnswers, router, toast, sessionData])

  // Timer effect
  useEffect(() => {
    // Clear existing timer if any
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    console.log('Timer effect triggered:', {
      isLoading,
      error,
      sessionData: !!sessionData,
      timeLeft,
      hasInitializedTimer: hasInitializedTimer.current
    })
    
    // Don't start timer if conditions aren't met
    if (isLoading || error || !sessionData || !hasInitializedTimer.current) {
      console.log('Timer not starting due to conditions not met')
      return
    }

    // Don't start timer if time is already 0
    if (timeLeft <= 0) {
      console.log('Timer not starting because timeLeft is 0')
      handleSubmitAll(true)
      return
    }

    console.log('Starting timer with initial timeLeft:', timeLeft)
    
    // Start new timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTimeLeft = Math.max(0, prev - 1)
        console.log('Timer tick - new time left:', newTimeLeft)
        
        // Store time left in session store
        setStoreTimeLeft(sessionId, newTimeLeft)
        
        if (newTimeLeft === 0) {
          console.log('Timer reached zero - clearing interval')
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          handleSubmitAll(true)
        }
        return newTimeLeft
      })
    }, 1000)

    // Cleanup function
    return () => {
      console.log('Cleaning up timer effect')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isLoading, error, sessionData, handleSubmitAll, sessionId, setStoreTimeLeft, timeLeft])

  // Load session data and questions
  useEffect(() => {
    const loadData = async () => {
      if (hasInitializedTimer.current) {
        console.log('Timer already initialized, skipping data load')
        return
      }

      try {
        console.log('Starting to load session data for ID:', sessionId)
        setIsLoading(true)
        setError(null)

        // Validate session ID
        if (isNaN(sessionId) || sessionId < 1 || sessionId > 3) {
          throw new Error('Invalid session ID')
        }

        // Load session data
        const session = await getSession(sessionId)
        console.log('Loaded session data:', session)
        
        if (!session) {
          throw new Error('Session not found')
        }

        // Initialize timer before setting session data
        if (session.duration_minutes) {
          console.log('Initializing timer with duration:', session.duration_minutes, 'minutes')
          const durationInSeconds = session.duration_minutes * 60
          setTimeLeft(durationInSeconds)
          setSessionDuration(sessionId, session.duration_minutes)
          setStoreTimeLeft(sessionId, durationInSeconds)
          hasInitializedTimer.current = true
        }

        setSessionData(session)

        // Load questions
        const allQuestions = await questionStore.getQuestions()
        const sessionQuestions = allQuestions.filter(q => q.sessionId === sessionId)
        if (sessionQuestions.length === 0) {
          throw new Error('No questions found for this session')
        }
        setQuestions(sessionQuestions)
      } catch (error) {
        console.error('Error loading session data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
        toast({
          title: 'Error loading session',
          description: error instanceof Error ? error.message : 'Please try again',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [sessionId, questionStore, toast, setSessionDuration, setStoreTimeLeft])

  // Popup effect
  useEffect(() => {
    if (!sessionData || hasInteracted || isLoading || error) return

    let popupTimer: NodeJS.Timeout | undefined

    try {
      // Popup logic based on session configuration
      if (sessionData.popup_start_time !== null) {
        // Initial popup
        popupTimer = setTimeout(() => {
          if (hasClosed)
            return
          
          onOpen()
          
          // Auto close after duration if specified
          if (sessionData.popup_duration) {
            setTimeout(() => {
              if (!hasInteracted) {
                onClose()
                setHasClosed(true)
              }
            }, sessionData.popup_duration * 1000)
          }

          // Reminder popup if configured
          if (sessionData.popup_remind_time && !hasBlink) {
            setHasBlinkSetup(true)
            setHasBlink(true)
            setTimeout(() => {
              if (!hasInteracted && !hasClosed) {
                setPopupBg('gray.200')
                setTimeout(() => {
                  setPopupBg(undefined)
                  setHasBlink(false)
                }, 1000)
              }
            }, !hasBlinkSetup ? sessionData.popup_remind_time * 1000 : 1000)
          }
        }, sessionData.popup_start_time * 1000)
      }
    } catch (error) {
      console.error('Error in popup logic:', error)
    }

    return () => {
      if (popupTimer) clearTimeout(popupTimer)
    }
  }, [sessionData, hasInteracted, hasClosed, onOpen, onClose, isLoading, error, hasBlink, hasBlinkSetup])

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handlePopupResponse = () => {
    setHasInteracted(true)
    onClose()
  }

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

  if (error) {
    return (
      <Container centerContent py={10}>
        <VStack spacing={4}>
          <Text color="red.500" fontSize="lg">{error}</Text>
          <Button onClick={() => router.push('/')} colorScheme="blue">
            Return to Home
          </Button>
        </VStack>
      </Container>
    )
  }

  if (questions.length === 0) {
    return (
      <Container centerContent py={10}>
        <VStack spacing={4}>
          <Text>No questions available for this session.</Text>
          <Button onClick={() => router.push('/')} colorScheme="blue">
            Return to Home
          </Button>
        </VStack>
      </Container>
    )
  }

  const answeredCount = Object.keys(answers).length
  const progressValue = (answeredCount / questions.length) * 100

  return (
    <Container maxW="container.md" py={10}>
      <UserID />
      <VStack spacing={6}>
        <Box w="full">
          <Text fontSize="xl" fontWeight="bold" mb={2}>
            Session {sessionId} - Time Remaining: {formatTime(timeLeft)}
          </Text>
          {sessionData?.description && (
            <Box 
              mb={4} 
              borderRadius="lg" 
              overflow="hidden" 
              boxShadow="md"
              bg="gray.50"
              p={4}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Image
                src={sessionData.description}
                alt={`Session ${sessionId}`}
                maxH="700px"
                maxW="100%"
                objectFit="contain"
                borderRadius="lg"
                fallback={
                  <Box
                    w="full"
                    h="700px"
                    bg="gray.100"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.500">No image available</Text>
                  </Box>
                }
              />
            </Box>
          )}
          <Progress value={progressValue} colorScheme="blue" hasStripe mb={4} />
          <Text textAlign="right" color="gray.600">
            {answeredCount} of {questions.length} questions answered
          </Text>
        </Box>
        
        {questions.map((question, index) => (
          <Box key={question.id} w="full" p={6} borderWidth={1} borderRadius="lg">
            <VStack align="start" spacing={4}>
              <Text fontWeight="bold">
                Question {index + 1}: {question.question}
              </Text>
              
              <RadioGroup 
                onChange={(value) => handleAnswerChange(question.id, value)} 
                value={answers[question.id] || ''}
              >
                <VStack align="start" spacing={3}>
                  {question.choices.map((choice: string, choiceIndex: number) => (
                    <Radio key={choiceIndex} value={choice}>
                      {choice}
                    </Radio>
                  ))}
                </VStack>
              </RadioGroup>
            </VStack>
          </Box>
        ))}

        <Button 
          colorScheme="blue" 
          size="lg" 
          w="full" 
          onClick={() => handleSubmitAll(false)}
          isDisabled={Object.keys(answers).length !== questions.length}
        >
          Submit All Answers
        </Button>

        {isOpen && (
          <Box
            position="fixed"
            top="4"
            right="4"
            p={8}
            bg={popupBg || "white"}
            color={popupBg ? "white" : "black"}
            boxShadow="lg"
            borderRadius="lg"
            zIndex="toast"
            maxW="lg"
            width="500px"
            id="popup-container"
          >
            <VStack align="stretch" spacing={3}>
              <Text fontWeight="bold">{sessionData?.popup_name || 'Question'}</Text>
              <Text>{sessionData?.popup_description || 'Do you want to hang out with me?'}</Text>
              <HStack justifyContent="flex-end" spacing={2}>
                <Button size="sm" colorScheme="blue" onClick={() => handlePopupResponse()}>
                  Yes
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handlePopupResponse()}>
                  No
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  )
}