'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Spinner,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { getSession, updateSession } from '@/lib/api'
import { Session, Question as UIQuestion } from '@/types'
import { PopupManager } from '@/components/PopupManager'
import { QuestionSetManager } from '@/components/QuestionSetManager'
import { Question as StoreQuestion, useQuestionStore } from '@/lib/stores/questionStore'

// Convert store question to UI question format
const toUIQuestion = (q: StoreQuestion): UIQuestion => ({
  id: q.id,
  question: q.question,
  choices: q.choices,
  correct_answer: q.correctAnswer,
  created_at: new Date().toISOString(),
})

export default function AdminSessionPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const questionStore = useQuestionStore()
  
  const sessionId = Number(params.id)
  
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [allQuestions, setAllQuestions] = useState<UIQuestion[]>([])
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [sessionData, questions] = await Promise.all([
        getSession(sessionId),
        questionStore.getQuestions(),
      ])
      setSession(sessionData)
      setAllQuestions(questions.map(toUIQuestion))
    } catch (error) {
      console.error('Error loading data:', error)
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
  }, [sessionId, toast, questionStore])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = useCallback(async () => {
    if (!session) return

    try {
      setIsSaving(true)
      await updateSession(sessionId, session)
      toast({
        title: 'Session updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error saving session:', error)
      toast({
        title: 'Error saving session',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSaving(false)
    }
  }, [session, sessionId, toast])

  if (isLoading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
      </Container>
    )
  }

  if (!session) {
    return (
      <Container centerContent py={10}>
        <Text>Session not found</Text>
        <Button onClick={() => router.push('/admin')} colorScheme="blue">
          Return to Admin
        </Button>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>Session {sessionId} Settings</Heading>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Duration (minutes)</FormLabel>
              <NumberInput
                value={session.duration_minutes}
                onChange={(_, value) => setSession(prev => prev ? {
                  ...prev,
                  duration_minutes: value
                } : null)}
                min={1}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Evaluation Time (minutes)</FormLabel>
              <NumberInput
                value={session.evaluation_minutes}
                onChange={(_, value) => setSession(prev => prev ? {
                  ...prev,
                  evaluation_minutes: value
                } : null)}
                min={1}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </VStack>
        </Box>

        <Tabs index={activeTabIndex} onChange={setActiveTabIndex}>
          <TabList>
            <Tab>Question Sets</Tab>
            <Tab>Popups</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <QuestionSetManager
                sessionId={sessionId}
                questionSets={session.question_sets || []}
                allQuestions={allQuestions}
                onUpdate={loadData}
              />
            </TabPanel>
            <TabPanel>
              <PopupManager
                sessionId={sessionId}
                popups={session.popups || []}
                onUpdate={loadData}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleSave}
          isLoading={isSaving}
        >
          Save Changes
        </Button>
      </VStack>
    </Container>
  )
} 