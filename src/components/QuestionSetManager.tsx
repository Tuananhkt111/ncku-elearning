import { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Grid,
  GridItem,
  Image,
  IconButton,
  HStack,
  Heading,
  Editable,
  EditableInput,
  EditablePreview,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { QuestionsSet, Question } from '@/types';
import { createQuestionSet, updateQuestionSet, createQuestionSetLink, deleteQuestionSetLink, createSessionSetLink, deleteSessionSetLink } from '@/lib/api';
import { uploadImage, deleteImage } from '@/lib/storage';

interface QuestionSetManagerProps {
  sessionId: number;
  questionSets: QuestionsSet[];
  allQuestions: Question[];
  onUpdate: () => void;
}

export function QuestionSetManager({
  sessionId,
  questionSets,
  allQuestions,
  onUpdate,
}: QuestionSetManagerProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [setToDelete, setSetToDelete] = useState<QuestionsSet | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleImageUpload = useCallback(async (setId: number, file: File) => {
    try {
      setIsLoading(true);
      
      // Get the current set to check if we need to delete an existing image
      const currentSet = questionSets.find(s => s.id === setId);
      if (currentSet?.image) {
        await deleteImage(currentSet.image);
      }
      
      // Upload the new image
      const imageUrl = await uploadImage(file);
      
      // Update the question set with the new image URL
      await updateQuestionSet(setId, { image: imageUrl });
      onUpdate();
      
      toast({
        title: 'Image uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error uploading image',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate, toast, questionSets]);

  const handleCreateSet = useCallback(async (name: string) => {
    try {
      setIsLoading(true);
      // Create the question set
      const newSet = await createQuestionSet({
        set_name: name,
        image: '',
      });

      // Create the link between session and question set
      await createSessionSetLink({
        session_id: sessionId,
        set_id: newSet.id
      });

      onUpdate();
      
      toast({
        title: 'Question set created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating question set:', error);
      toast({
        title: 'Error creating question set',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate, toast, sessionId]);

  const handleAddQuestion = useCallback(async (setId: number, questionId: string) => {
    try {
      setIsLoading(true);
      await createQuestionSetLink({
        set_id: setId,
        question_id: questionId,
      });
      onUpdate();
      
      toast({
        title: 'Question added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: 'Error adding question',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate, toast]);

  const handleRemoveQuestion = useCallback(async (setId: number, questionId: string) => {
    try {
      setIsLoading(true);
      await deleteQuestionSetLink(setId, questionId);
      onUpdate();
      
      toast({
        title: 'Question removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing question:', error);
      toast({
        title: 'Error removing question',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate, toast]);

  const handleSetNameChange = useCallback(async (setId: number, newName: string) => {
    try {
      setIsLoading(true);
      await updateQuestionSet(setId, { set_name: newName });
      onUpdate();
      
      toast({
        title: 'Set name updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating set name:', error);
      toast({
        title: 'Error updating set name',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate, toast]);

  const handleDeleteSet = useCallback(async (set: QuestionsSet) => {
    try {
      setIsLoading(true);

      // Delete all question links first
      if (set.questions) {
        for (const question of set.questions) {
          await deleteQuestionSetLink(set.id, question.id);
        }
      }

      // Delete the session link
      await deleteSessionSetLink(sessionId, set.id);

      // Delete the image if exists
      if (set.image) {
        await deleteImage(set.image);
      }

      toast({
        title: 'Question set deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onUpdate();
    } catch (error) {
      console.error('Error deleting question set:', error);
      toast({
        title: 'Error deleting question set',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setSetToDelete(null);
      onClose();
    }
  }, [sessionId, onUpdate, toast, onClose]);

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="md" mb={4}>Question Sets</Heading>
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          {questionSets.map((set) => (
            <GridItem key={set.id} p={4} borderWidth={1} borderRadius="lg">
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <Editable
                    defaultValue={set.set_name}
                    onSubmit={(newName) => handleSetNameChange(set.id, newName)}
                    fontSize="lg"
                    fontWeight="bold"
                    isPreviewFocusable={true}
                    selectAllOnFocus={true}
                  >
                    <EditablePreview />
                    <EditableInput />
                  </Editable>
                  <IconButton
                    aria-label="Delete set"
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSetToDelete(set);
                      onOpen();
                    }}
                  />
                </HStack>
                
                <FormControl>
                  <FormLabel>Image</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(set.id, file);
                      }
                    }}
                  />
                </FormControl>

                {set.image && (
                  <Image
                    src={set.image}
                    alt={set.set_name}
                    maxH="200px"
                    objectFit="contain"
                  />
                )}

                <Box>
                  <Text fontWeight="bold" mb={2}>Questions</Text>
                  <VStack spacing={2} align="stretch">
                    {set.questions?.map((question) => (
                      <HStack key={question.id} justify="space-between">
                        <Text noOfLines={1}>{question.question}</Text>
                        <IconButton
                          aria-label="Remove question"
                          icon={<DeleteIcon />}
                          size="sm"
                          onClick={() => handleRemoveQuestion(set.id, question.id)}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>Add Questions</Text>
                  <VStack spacing={2} align="stretch">
                    {allQuestions
                      .filter(q => !set.questions?.some(sq => sq.id === q.id))
                      .map((question) => (
                        <HStack key={question.id} justify="space-between">
                          <Text noOfLines={1}>{question.question}</Text>
                          <IconButton
                            aria-label="Add question"
                            icon={<AddIcon />}
                            size="sm"
                            onClick={() => handleAddQuestion(set.id, question.id)}
                          />
                        </HStack>
                      ))}
                  </VStack>
                </Box>
              </VStack>
            </GridItem>
          ))}
        </Grid>
      </Box>

      <Box>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => handleCreateSet(`Set ${questionSets.length + 1}`)}
          isLoading={isLoading}
          isDisabled={questionSets.length >= 2}
          title={questionSets.length >= 2 ? "Maximum of 2 sets allowed" : undefined}
        >
          Create New Question Set
        </Button>
      </Box>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Question Set
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this question set? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => setToDelete && handleDeleteSet(setToDelete)}
                ml={3}
                isLoading={isLoading}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
} 