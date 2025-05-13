'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
  IconButton,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import type {
  EvaluationQuestion,
  EvaluationVariable,
  EvaluationSuggestedAnswer,
} from '@/types/evaluation';

export default function EvaluationSetup() {
  const [description, setDescription] = useState('');
  const [variables, setVariables] = useState<Array<{
    name: string;
    answers: string[];
  }>>([{ name: '', answers: [''] }]);
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<EvaluationQuestion | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const supabase = createClientComponentClient<Database>();

  const fetchQuestions = useCallback(async () => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('evaluation_questions')
        .select(`
          *,
          evaluation_variables:evaluation_variables (
            *,
            evaluation_suggested_answers:evaluation_suggested_answers (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      // Sort suggested answers by order_number
      const sortedQuestionsData = questionsData?.map(question => ({
        ...question,
        evaluation_variables: question.evaluation_variables?.map((variable: EvaluationVariable) => ({
          ...variable,
          evaluation_suggested_answers: variable.evaluation_suggested_answers?.sort(
            (a: EvaluationSuggestedAnswer, b: EvaluationSuggestedAnswer) => a.order_number - b.order_number
          )
        }))
      }));

      setQuestions(sortedQuestionsData || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch questions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleEdit = (question: EvaluationQuestion) => {
    setEditingQuestion(question);
    setDescription(question.description);
    const variables = question.evaluation_variables || [];
    setVariables(
      variables.map((v: EvaluationVariable) => ({
        name: v.variable_name,
        answers: (v.evaluation_suggested_answers || []).map((a: EvaluationSuggestedAnswer) => a.answer_text),
      }))
    );
    onOpen();
  };

  const handleDelete = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('evaluation_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Question deleted successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAddVariable = () => {
    setVariables([...variables, { name: '', answers: [''] }]);
  };

  const handleRemoveVariable = async (index: number) => {
    if (editingQuestion) {
      try {
        const variableToDelete = editingQuestion.evaluation_variables?.[index];
        if (variableToDelete) {
          const { error } = await supabase
            .from('evaluation_variables')
            .delete()
            .eq('id', variableToDelete.id);

          if (error) throw error;
        }
      } catch (error) {
        console.error('Error deleting variable:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete variable',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }
    
    const newVariables = variables.filter((_, i) => i !== index);
    setVariables(newVariables);
  };

  const handleAddAnswer = (variableIndex: number) => {
    const newVariables = [...variables];
    newVariables[variableIndex].answers.push('');
    setVariables(newVariables);
  };

  const handleRemoveAnswer = (variableIndex: number, answerIndex: number) => {
    const newVariables = [...variables];
    newVariables[variableIndex].answers = newVariables[variableIndex].answers.filter(
      (_, i) => i !== answerIndex
    );
    setVariables(newVariables);
  };

  const handleVariableNameChange = (index: number, value: string) => {
    const newVariables = [...variables];
    newVariables[index].name = value;
    setVariables(newVariables);
  };

  const handleAnswerChange = (variableIndex: number, answerIndex: number, value: string) => {
    const newVariables = [...variables];
    newVariables[variableIndex].answers[answerIndex] = value;
    setVariables(newVariables);
  };

  const resetForm = () => {
    setDescription('');
    setVariables([{ name: '', answers: [''] }]);
    setEditingQuestion(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingQuestion) {
        // Update existing question
        const { error: questionError } = await supabase
          .from('evaluation_questions')
          .update({ description })
          .eq('id', editingQuestion.id);

        if (questionError) throw questionError;

        // Get existing variables
        const { data: existingVariables, error: fetchError } = await supabase
          .from('evaluation_variables')
          .select('*')
          .eq('question_id', editingQuestion.id);

        if (fetchError) throw fetchError;

        // Create or update variables and their answers
        for (const variable of variables) {
          if (!variable.name.trim()) continue;

          const existingVariable = existingVariables?.find(v => 
            v.variable_name === variable.name
          );

          let variableId;

          if (existingVariable) {
            // Update existing variable
            const { error: updateError } = await supabase
              .from('evaluation_variables')
              .update({ variable_name: variable.name })
              .eq('id', existingVariable.id);

            if (updateError) throw updateError;
            variableId = existingVariable.id;
          } else {
            // Create new variable
            const { data: newVariable, error: createError } = await supabase
              .from('evaluation_variables')
              .insert({
                question_id: editingQuestion.id,
                variable_name: variable.name,
              })
              .select()
              .single();

            if (createError) throw createError;
            variableId = newVariable.id;
          }

          // Delete existing answers for this variable
          const { error: deleteAnswersError } = await supabase
            .from('evaluation_suggested_answers')
            .delete()
            .eq('variable_id', variableId);

          if (deleteAnswersError) throw deleteAnswersError;

          // Create new answers
          const answers = variable.answers.filter((answer) => answer.trim());
          for (const [answerIndex, answer] of answers.entries()) {
            const { error: answerError } = await supabase
              .from('evaluation_suggested_answers')
              .insert({
                variable_id: variableId,
                answer_text: answer,
                order_number: answerIndex + 1,
              });

            if (answerError) throw answerError;
          }
        }

        // Delete variables that are no longer in the form
        const variableNames = variables.map(v => v.name.trim()).filter(Boolean);
        const variablesToDelete = existingVariables?.filter(
          v => !variableNames.includes(v.variable_name)
        ) || [];

        for (const variable of variablesToDelete) {
          const { error: deleteError } = await supabase
            .from('evaluation_variables')
            .delete()
            .eq('id', variable.id);

          if (deleteError) throw deleteError;
        }
      } else {
        // Create new question
        const { data: questionData, error: questionError } = await supabase
          .from('evaluation_questions')
          .insert({ description })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create variables and answers
        for (const variable of variables) {
          if (!variable.name.trim()) continue;

          const { data: variableData, error: variableError } = await supabase
            .from('evaluation_variables')
            .insert({
              question_id: questionData.id,
              variable_name: variable.name,
            })
            .select()
            .single();

          if (variableError) throw variableError;

          const answers = variable.answers.filter((answer) => answer.trim());
          for (const [index, answer] of answers.entries()) {
            const { error: answerError } = await supabase
              .from('evaluation_suggested_answers')
              .insert({
                variable_id: variableData.id,
                answer_text: answer,
                order_number: index + 1,
              });

            if (answerError) throw answerError;
          }
        }
      }

      toast({
        title: 'Success',
        description: `Question ${editingQuestion ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      resetForm();
      onClose();
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingQuestion ? 'update' : 'create'} question`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <HStack justify="space-between" mb={6}>
        <Heading>Evaluation Questions</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
          Add Question
        </Button>
      </HStack>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Description</Th>
            <Th>Variables</Th>
            <Th>Created At</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {questions.map((question) => (
            <Tr key={question.id}>
              <Td>{question.description}</Td>
              <Td>{question.evaluation_variables?.length || 0} variables</Td>
              <Td>{new Date(question.created_at).toLocaleDateString()}</Td>
              <Td>
                <HStack spacing={2}>
                  <IconButton
                    aria-label="Edit question"
                    icon={<EditIcon />}
                    size="sm"
                    onClick={() => handleEdit(question)}
                  />
                  <IconButton
                    aria-label="Delete question"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(question.id)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter question description"
                />
              </FormControl>

              {variables.map((variable, varIndex) => (
                <Box key={varIndex} p={4} borderWidth={1} borderRadius="md">
                  <HStack justify="space-between" mb={4}>
                    <FormControl isRequired>
                      <FormLabel>Variable Name</FormLabel>
                      <Input
                        value={variable.name}
                        onChange={(e) => handleVariableNameChange(varIndex, e.target.value)}
                        placeholder="Enter variable name"
                      />
                    </FormControl>
                    <IconButton
                      aria-label="Remove variable"
                      icon={<DeleteIcon />}
                      onClick={() => handleRemoveVariable(varIndex)}
                      colorScheme="red"
                      alignSelf="flex-end"
                    />
                  </HStack>

                  <Text mb={2}>Suggested Answers:</Text>
                  <VStack spacing={2} align="stretch">
                    {variable.answers.map((answer, answerIndex) => (
                      <HStack key={answerIndex}>
                        <Input
                          value={answer}
                          onChange={(e) =>
                            handleAnswerChange(varIndex, answerIndex, e.target.value)
                          }
                          placeholder={`Answer ${answerIndex + 1}`}
                        />
                        <IconButton
                          aria-label="Remove answer"
                          icon={<DeleteIcon />}
                          onClick={() => handleRemoveAnswer(varIndex, answerIndex)}
                          colorScheme="red"
                          size="sm"
                        />
                      </HStack>
                    ))}
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={() => handleAddAnswer(varIndex)}
                      size="sm"
                      variant="outline"
                    >
                      Add Answer
                    </Button>
                  </VStack>
                </Box>
              ))}

              <Button leftIcon={<AddIcon />} onClick={handleAddVariable} variant="outline">
                Add Variable
              </Button>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {editingQuestion ? 'Update' : 'Save'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 