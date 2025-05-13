'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  Text,
  Button,
  useToast,
  Spinner,
  HStack,
} from '@chakra-ui/react'
import { useSessionStore } from '@/lib/stores/sessionStore'
import { Session } from '@/types'
import { getSession } from '@/lib/api'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useUserStore } from '@/lib/stores/userStore'
import { SplitSessionView } from '@/components/SplitSessionView'
import { SessionHeader } from '@/components/SessionHeader'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const supabase = createClientComponentClient()
  const { userId } = useUserStore()
  
  const sessionId = Number(params.id)
  
  interface SessionState {
    timeLeft: number;
    isLoading: boolean;
    error: string | null;
    sessionData: Session | null;
  }

  interface UserInteractionState {
    answers: Record<string, string>;
    hasInteracted: boolean;
    hasClosed: boolean;
  }

  interface PopupState {
    activePopups: Record<number, boolean>;
    popupTimers: Record<number, NodeJS.Timeout>;
    autoCloseTimers: Record<number, NodeJS.Timeout>;
    manuallyClosedPopups: Set<number>;
    shownPopups: Set<number>;
  }

  const [sessionState, setSessionState] = useState<SessionState>({
    timeLeft: 7 * 60,
    isLoading: true,
    error: null,
    sessionData: null
  })

  const [userInteraction, setUserInteraction] = useState<UserInteractionState>({
    answers: {},
    hasInteracted: false,
    hasClosed: false
  })

  const [popupState, setPopupState] = useState<PopupState>({
    activePopups: {},
    popupTimers: {},
    autoCloseTimers: {},
    manuallyClosedPopups: new Set<number>(),
    shownPopups: new Set<number>()
  })

  const hasInitializedTimer = useRef<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartTime = useRef<number | null>(null)
  const hasStartedTimer = useRef<boolean>(false)
  const elapsedTime = useRef<number>(0)
  const lastTickTime = useRef<number | null>(null)
  const totalDuration = useRef<number>(420)

  const { addAnswers, setTimeLeft: setStoreTimeLeft, setSessionDuration } = useSessionStore()

  const handleAnswerChange = useCallback((setId: number, questionId: string, answer: string): void => {
    setUserInteraction(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }))
  }, [])

  const handlePopupResponse = useCallback(async (popupId: number, reaction: 'yes' | 'no'): Promise<void> => {
    console.log('Handling popup response:', { popupId, reaction, userId, sessionId })
    
    try {
      if (!userId) {
        throw new Error('User ID not found')
      }

      // Save the reaction to the database
      const { data, error: reactionError } = await supabase
        .from('popup_reactions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          popup_id: popupId,
          reaction: reaction
        })
        .select()
        .single()

      if (reactionError) {
        console.error('Error saving popup reaction:', {
          error: reactionError,
          details: {
            userId,
            sessionId,
            popupId,
            reaction
          }
        })
        toast({
          title: 'Error saving response',
          description: reactionError.message || 'Your response could not be saved',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      console.log('Successfully saved popup reaction:', data)
    } catch (error) {
      console.error('Error in handlePopupResponse:', error)
      toast({
        title: 'Error saving response',
        description: error instanceof Error ? error.message : 'Your response could not be saved',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    setPopupState(prev => {
      const showTimer = prev.popupTimers[popupId]
      const closeTimer = prev.autoCloseTimers[popupId]
      
      if (showTimer) clearTimeout(showTimer)
      if (closeTimer) clearTimeout(closeTimer)
      
      const newPopupTimers = { ...prev.popupTimers }
      const newAutoCloseTimers = { ...prev.autoCloseTimers }
      delete newPopupTimers[popupId]
      delete newAutoCloseTimers[popupId]
      
      const newManuallyClosedPopups = new Set(prev.manuallyClosedPopups)
      newManuallyClosedPopups.add(popupId)
      
      return {
        ...prev,
        popupTimers: newPopupTimers,
        autoCloseTimers: newAutoCloseTimers,
        activePopups: {
          ...prev.activePopups,
          [popupId]: false
        },
        manuallyClosedPopups: newManuallyClosedPopups
      }
    })
  }, [sessionId, userId, supabase, toast])

  const handlePopupAutoClose = useCallback((popupId: number): void => {
    setPopupState(prev => ({
      ...prev,
      activePopups: {
        ...prev.activePopups,
        [popupId]: false
      }
    }))
  }, [])

  const handleSubmitAll = useCallback(async (isAutoSubmit = false): Promise<void> => {
    try {
      if (!sessionState.sessionData || !userId) return
      
      let finalTime = totalDuration.current
      if (sessionStartTime.current) {
        const rawElapsed = (Date.now() - sessionStartTime.current) / 1000
        finalTime = Math.min(Math.floor(rawElapsed), totalDuration.current)
      }

      // Save 'no_answer' reactions for popups that were shown but not responded to
      const unansweredPopups = Array.from(popupState.shownPopups).filter(
        popupId => !popupState.manuallyClosedPopups.has(popupId)
      )
      
      if (unansweredPopups.length > 0) {
        const noAnswerReactions = unansweredPopups.map(popupId => ({
          user_id: userId,
          session_id: sessionId,
          popup_id: popupId,
          reaction: 'no_answer'
        }))

        const { error: noAnswerError } = await supabase
          .from('popup_reactions')
          .insert(noAnswerReactions)

        if (noAnswerError) {
          console.error('Error saving no_answer reactions:', noAnswerError)
        }
      }

      const { data: userTestAnswer, error: answerError } = await supabase
        .from('user_test_answer')
        .insert({
          user_id: userId,
          session_id: sessionId,
          total_time: finalTime
        })
        .select()
        .single()

      if (answerError) throw answerError

      const answerDetails = sessionState.sessionData.question_sets?.flatMap(set => 
        set.questions?.map(question => {
          const userAnswer = userInteraction.answers[question.id] || ''
          const correctAnswer = question.correct_answer
          console.log('Answer check:', {
            questionId: question.id,
            userAnswer,
            correctAnswer,
            isCorrect: userAnswer === correctAnswer
          })
          return {
            user_test_answer_id: userTestAnswer.id,
            question_id: question.id,
            answer: userAnswer,
            is_correct: userAnswer === correctAnswer
          }
        }) || []
      ) || []

      const { error: detailsError } = await supabase
        .from('user_test_answer_detail')
        .insert(answerDetails)

      if (detailsError) throw detailsError
      
      await addAnswers(sessionId, userInteraction.answers)
      
      if (isAutoSubmit) {
        toast({
          title: 'Time is up!',
          description: 'Your answers have been automatically submitted.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        })
      }
      
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
  }, [sessionId, userInteraction.answers, router, toast, sessionState.sessionData, userId, supabase, addAnswers])

  useEffect(() => {
    // Clear existing timer if any
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Don't start timer if we're still loading or have errors
    if (!sessionState.sessionData || sessionState.error) {
      return
    }

    // Don't proceed if timer hasn't been initialized yet
    if (!hasInitializedTimer.current) {
      return
    }

    if (sessionState.timeLeft <= 0) {
      handleSubmitAll(true)
      return
    }

    // Initialize timer if not started
    if (!hasStartedTimer.current) {
      sessionStartTime.current = Date.now()
      lastTickTime.current = Date.now()
      hasStartedTimer.current = true
      elapsedTime.current = 0
      if (sessionState.sessionData.duration_minutes) {
        totalDuration.current = sessionState.sessionData.duration_minutes * 60
      }
    }

    const updateTimer = () => {
      const now = Date.now()
      
      if (sessionStartTime.current) {
        const rawElapsed = (now - sessionStartTime.current) / 1000
        elapsedTime.current = Math.min(Math.floor(rawElapsed), totalDuration.current)
      }

      setSessionState(prev => {
        const newTimeLeft = Math.max(0, totalDuration.current - elapsedTime.current)
        if (newTimeLeft === 0 && timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
          handleSubmitAll(true)
        }
        return {
          ...prev,
          timeLeft: newTimeLeft
        }
      })
    }

    timerRef.current = setInterval(updateTimer, 100)
    updateTimer()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (sessionStartTime.current) {
        const now = Date.now()
        const rawElapsed = (now - sessionStartTime.current) / 1000
        elapsedTime.current = Math.min(Math.floor(rawElapsed), totalDuration.current)
      }
    }
  }, [sessionState.sessionData, sessionState.error, handleSubmitAll])

  useEffect(() => {
    const loadData = async () => {
      if (hasInitializedTimer.current) {
        console.log('Timer already initialized, skipping data load')
        return
      }

      try {
        console.log('Starting to load session data for ID:', sessionId)
        setSessionState(prev => ({
          ...prev,
          isLoading: true,
          error: null
        }))

        hasStartedTimer.current = false
        sessionStartTime.current = null
        elapsedTime.current = 0
        lastTickTime.current = null

        if (isNaN(sessionId) || sessionId < 1 || sessionId > 4) {
          throw new Error('Invalid session ID')
        }

        const session = await getSession(sessionId)
        console.log('Loaded session data:', session)
        
        if (!session) {
          throw new Error('Session not found')
        }

        if (session.duration_minutes) {
          console.log('Initializing timer with duration:', session.duration_minutes, 'minutes')
          const durationInSeconds = session.duration_minutes * 60
          setSessionState(prev => ({
            ...prev,
            isLoading: false,
            timeLeft: durationInSeconds,
            sessionData: session
          }))
          setStoreTimeLeft(sessionId, durationInSeconds)
          setSessionDuration(sessionId, session.duration_minutes)
          hasInitializedTimer.current = true
        } else {
          // Handle case where duration_minutes is not set
          setSessionState(prev => ({
            ...prev,
            isLoading: false,
            sessionData: session
          }))
          hasInitializedTimer.current = true
        }
      } catch (error) {
        console.error('Error loading session data:', error)
        setSessionState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        }))
        toast({
          title: 'Error loading session',
          description: error instanceof Error ? error.message : 'Please try again',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }

    loadData()
  }, [sessionId, toast, setSessionDuration, setStoreTimeLeft])

  useEffect(() => {
    if (!sessionState.sessionData || sessionState.isLoading || sessionState.error) {
      return;
    }
    
    if (!sessionState.sessionData.popups || sessionState.sessionData.popups.length === 0) {
      return;
    }

    setPopupState(prev => ({
      ...prev,
      activePopups: {},
      popupTimers: {},
      autoCloseTimers: {},
      manuallyClosedPopups: prev.manuallyClosedPopups,
      shownPopups: prev.shownPopups
    }));
    
    Object.values(popupState.popupTimers).forEach(timer => clearTimeout(timer));
    Object.values(popupState.autoCloseTimers).forEach(timer => clearTimeout(timer));

    const totalSessionTime = sessionState.sessionData.duration_minutes * 60;
    const elapsedSeconds = totalSessionTime - sessionState.timeLeft;

    const newPopupTimers: Record<number, NodeJS.Timeout> = {};
    const newAutoCloseTimers: Record<number, NodeJS.Timeout> = {};

    try {
      sessionState.sessionData.popups.forEach(popup => {
        if (popupState.manuallyClosedPopups.has(popup.id)) {
          return;
        }

        const adjustedStartTime = Math.max(0, popup.start_time - elapsedSeconds);

        if (popup.start_time + popup.duration < elapsedSeconds) {
          return;
        }

        if (popup.start_time <= elapsedSeconds && 
            popup.start_time + popup.duration > elapsedSeconds) {
          setPopupState(prev => ({
            ...prev,
            activePopups: {
              ...prev.activePopups,
              [popup.id]: true
            },
            shownPopups: new Set([...prev.shownPopups, popup.id])
          }));

          const remainingDuration = (popup.start_time + popup.duration) - elapsedSeconds;
          const autoCloseTimer = setTimeout(() => {
            handlePopupAutoClose(popup.id);
          }, remainingDuration * 1000);
          
          newAutoCloseTimers[popup.id] = autoCloseTimer;
          return;
        }

        const showTimer = setTimeout(() => {
          setPopupState(prev => {
            if (prev.manuallyClosedPopups.has(popup.id)) {
              return prev;
            }
            return {
              ...prev,
              activePopups: {
                ...prev.activePopups,
                [popup.id]: true
              },
              shownPopups: new Set([...prev.shownPopups, popup.id])
            };
          });

          if (popup.duration) {
            const autoCloseTimer = setTimeout(() => {
              handlePopupAutoClose(popup.id);
            }, popup.duration * 1000);
            
            newAutoCloseTimers[popup.id] = autoCloseTimer;
          }
        }, adjustedStartTime * 1000);

        newPopupTimers[popup.id] = showTimer;
      });

      setPopupState(prev => ({
        ...prev,
        popupTimers: newPopupTimers,
        autoCloseTimers: newAutoCloseTimers
      }));
    } catch (error) {
      console.error('Error in popup logic:', error);
      toast({
        title: 'Error displaying popups',
        description: 'There was an error managing the popup notifications',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    return () => {
      Object.values(newPopupTimers).forEach(timer => clearTimeout(timer));
      Object.values(newAutoCloseTimers).forEach(timer => clearTimeout(timer));
      setPopupState(prev => ({
        ...prev,
        activePopups: {},
        popupTimers: {},
        autoCloseTimers: {}
      }));
    };
  }, [sessionState.sessionData, sessionState.isLoading, sessionState.error, sessionId, toast, sessionState.timeLeft, handlePopupAutoClose]);

  if (sessionState.isLoading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
      </Container>
    )
  }

  if (sessionState.error) {
    return (
      <Container centerContent py={10}>
        <Text color="red.500" fontSize="lg">{sessionState.error}</Text>
        <Button onClick={() => router.push('/')} colorScheme="blue">
          Return to Home
        </Button>
      </Container>
    )
  }

  if (!sessionState.sessionData?.question_sets || sessionState.sessionData.question_sets.length === 0) {
    return (
      <Container centerContent py={10}>
        <Text>No questions available for this session.</Text>
        <Button onClick={() => router.push('/')} colorScheme="blue">
          Return to Home
        </Button>
      </Container>
    )
  }

  return (
    <Box>
      <SessionHeader 
        sessionName={`Session ${sessionState.sessionData?.name || sessionId}`}
        timeLeft={sessionState.timeLeft}
        onSubmit={() => handleSubmitAll(false)}
        isSubmitDisabled={!sessionState.sessionData?.question_sets?.every(set => 
          set.questions?.every(q => userInteraction.answers[q.id])
        )}
      />
      <Box pt="80px"> {/* Add padding to account for fixed header */}
        <SplitSessionView
          questionSets={sessionState.sessionData.question_sets}
          timeLeft={sessionState.timeLeft}
          onAnswerChange={handleAnswerChange}
          answers={userInteraction.answers}
          onSubmit={() => handleSubmitAll(false)}
        />

        {sessionState.sessionData.popups?.map(popup => (
          popupState.activePopups[popup.id] && (
            <Box
              key={popup.id}
              position="fixed"
              top="4"
              right="4"
              p={8}
              bg="white"
              boxShadow="lg"
              borderRadius="lg"
              zIndex="toast"
              maxW="lg"
              width="500px"
              id={`popup-${popup.id}`}
            >
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold">{popup.name || 'Question'}</Text>
                <Text>{popup.description || 'Do you want to hang out with me?'}</Text>
                <HStack justifyContent="flex-end" spacing={2}>
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    onClick={() => {
                      console.log('Yes clicked for popup:', popup.id);
                      handlePopupResponse(popup.id, 'yes');
                    }}
                  >
                    Yes
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      console.log('No clicked for popup:', popup.id);
                      handlePopupResponse(popup.id, 'no');
                    }}
                  >
                    No
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )
        ))}
      </Box>
    </Box>
  )
}