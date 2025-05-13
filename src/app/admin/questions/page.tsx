'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  HStack,
  Spinner,
} from '@chakra-ui/react'
import { FaEdit, FaTrash } from 'react-icons/fa'
import { Question as UIQuestion } from '@/types'
import { Question as StoreQuestion, useQuestionStore } from '@/lib/stores/questionStore'

// Convert store question to UI question format
const toUIQuestion = (q: StoreQuestion): UIQuestion => ({
  id: q.id,
  question: q.question,
  choices: q.choices,
  correct_answer: q.correctAnswer,
  created_at: new Date().toISOString(),
})

// Convert UI question to store question format
const toStoreQuestion = (q: Partial<UIQuestion>): Partial<StoreQuestion> => ({
  id: q.id,
  question: q.question,
  choices: q.choices,
  correctAnswer: q.correct_answer,
})

export default function AdminQuestionsPage() {
  const toast = useToast()
  const { questions: storeQuestions, isLoading: storeLoading, getQuestions, addQuestion, updateQuestion, deleteQuestion } = useQuestionStore()
  
  const [questions, setQuestions] = useState<UIQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Partial<UIQuestion>>({
    question: '',
    choices: ['', '', '', ''],
    correct_answer: '',
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await getQuestions()
      } catch (error) {
        toast({
          title: 'Error loading questions',
          description: 'Please try again later',
          status: 'error',
          duration: 3000,
        })
      }
    }
    init()
  }, [getQuestions, toast])

  // Update local questions when store questions change
  useEffect(() => {
    setQuestions(storeQuestions.map(toUIQuestion))
  }, [storeQuestions])

  const handleSubmit = async () => {
    if (!currentQuestion.question || !currentQuestion.correct_answer) {
      toast({
        title: 'Please fill all required fields',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    try {
      const storeQuestion = toStoreQuestion(currentQuestion)
      
      if (isEditing && currentQuestion.id) {
        await updateQuestion(storeQuestion as StoreQuestion)
        toast({
          title: 'Question updated successfully',
          status: 'success',
          duration: 2000,
        })
      } else {
        const newQuestion = {
          ...storeQuestion,
          id: Date.now().toString(),
        } as StoreQuestion
        
        await addQuestion(newQuestion)
        toast({
          title: 'Question added successfully',
          status: 'success',
          duration: 2000,
        })
      }

      // Reset form
      setCurrentQuestion({
        question: '',
        choices: ['', '', '', ''],
        correct_answer: '',
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Error saving question',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleEdit = (question: UIQuestion) => {
    setCurrentQuestion(question)
    setIsEditing(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestion(id)
      toast({
        title: 'Question deleted successfully',
        status: 'success',
        duration: 2000,
      })
    } catch (error) {
      toast({
        title: 'Error deleting question',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...(currentQuestion.choices || [])]
    newChoices[index] = value
    setCurrentQuestion({ ...currentQuestion, choices: newChoices })
  }

  if (storeLoading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
      </Container>
    )
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>Questions Management</Heading>
      <Container maxW="container.lg" py={10}>
        <VStack spacing={8} align="stretch">
          <Heading size="md">{isEditing ? 'Edit Question' : 'Add New Question'}</Heading>

          <FormControl isRequired>
            <FormLabel>Question</FormLabel>
            <Input
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
              placeholder="Enter question text"
            />
          </FormControl>

          <VStack spacing={4}>
            <FormLabel>Answer Choices</FormLabel>
            {currentQuestion.choices?.map((choice: string, index: number) => (
              <Input
                key={index}
                value={choice}
                onChange={(e) => handleChoiceChange(index, e.target.value)}
                placeholder={`Choice ${index + 1}`}
                isRequired
              />
            ))}
          </VStack>

          <FormControl isRequired>
            <FormLabel>Correct Answer</FormLabel>
            <Select
              value={currentQuestion.correct_answer}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
            >
              <option value="">Select correct answer</option>
              {currentQuestion.choices?.map((choice: string, index: number) => (
                choice && (
                  <option key={index} value={choice}>
                    {choice}
                  </option>
                )
              ))}
            </Select>
          </FormControl>

          <Button colorScheme="blue" onClick={handleSubmit}>
            {isEditing ? 'Update Question' : 'Add Question'}
          </Button>

          <Heading size="md">Questions List</Heading>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Question</Th>
                <Th>Choices</Th>
                <Th>Correct Answer</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {questions.map((q: UIQuestion) => (
                <Tr key={q.id}>
                  <Td>{q.question}</Td>
                  <Td>{q.choices.join(', ')}</Td>
                  <Td>{q.correct_answer}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit question"
                        icon={<FaEdit />}
                        onClick={() => handleEdit(q)}
                      />
                      <IconButton
                        aria-label="Delete question"
                        icon={<FaTrash />}
                        colorScheme="red"
                        onClick={() => handleDelete(q.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </VStack>
      </Container>
    </Box>
  )
} 