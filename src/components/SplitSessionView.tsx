import {
  Box,
  Grid,
  VStack,
  Text,
  Radio,
  RadioGroup,
  Image,
  Progress,
} from '@chakra-ui/react';
import { QuestionsSet, Question } from '@/types';

interface SplitSessionViewProps {
  questionSets: QuestionsSet[];
  timeLeft: number;
  onAnswerChange: (setId: number, questionId: string, answer: string) => void;
  answers: Record<string, string>;
  onSubmit: () => void;
}

export function SplitSessionView({
  questionSets,
  onAnswerChange,
  answers
}: SplitSessionViewProps) {
  const calculateProgress = (questions: Question[]): { answeredCount: number; progressValue: number } => {
    const answeredCount = questions.filter(q => answers[q.id]).length;
    return {
      answeredCount,
      progressValue: (answeredCount / questions.length) * 100,
    };
  };

  return (
    <Grid 
      templateColumns={questionSets.length === 1 ? "1fr" : "repeat(2, 1fr)"} 
      gap={6} 
      h="calc(100vh - 80px)"
      maxW={questionSets.length === 1 ? "800px" : "none"}
      mx={questionSets.length === 1 ? "auto" : "0"}
    >
      {questionSets.map((set, index) => (
        <Box
          key={set.id}
          borderRight={questionSets.length > 1 && index === 0 ? '1px solid' : 'none'}
          borderColor="gray.200"
          h="100%"
          overflowY="auto"
          px={4}
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'gray.200',
              borderRadius: '24px',
            },
          }}
        >
          <VStack spacing={4} align="stretch" py={4} minH="min-content">
            <Text fontSize="xl" fontWeight="bold">
              {set.set_name}
            </Text>
            
            {set.image && (
              <Box 
                borderRadius="lg" 
                overflow="hidden" 
                boxShadow="md"
                bg="gray.50"
                p={2}
                display="flex"
                justifyContent="center"
                alignItems="center"
                minH="40vh"
              >
                <Image
                  src={set.image}
                  alt={set.set_name}
                  maxH="100%"
                  maxW="100%"
                  objectFit="contain"
                  borderRadius="lg"
                  fallback={
                    <Box
                      w="full"
                      h="100%"
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

            {set.questions && (
              <>
                <Progress 
                  value={calculateProgress(set.questions).progressValue} 
                  colorScheme="blue" 
                  hasStripe 
                />
                <Text textAlign="right" color="gray.600" fontSize="sm">
                  {calculateProgress(set.questions).answeredCount} of {set.questions.length} questions answered
                </Text>
              </>
            )}

            {set.questions?.map((question, qIndex) => (
              <Box 
                key={question.id} 
                p={4} 
                borderWidth={1} 
                borderRadius="lg" 
                bg="white"
              >
                <VStack align="start" spacing={3}>
                  <Text fontWeight="bold">
                    Question {qIndex + 1}: {question.question}
                  </Text>
                  
                  <RadioGroup 
                    onChange={(value) => onAnswerChange(set.id, question.id, value)} 
                    value={answers[question.id] || ''}
                  >
                    <VStack align="start" spacing={2}>
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
          </VStack>
        </Box>
      ))}
    </Grid>
  );
} 