'use client';

import { Box, Radio, RadioGroup, Stack, Text } from '@chakra-ui/react';
import { Question } from '@/types';
import { useState } from 'react';

interface QuestionCardProps {
  question: Question;
  onAnswer?: (answer: string) => void;
  showCorrectAnswer?: boolean;
}

export function QuestionCard({ question, onAnswer, showCorrectAnswer }: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const handleAnswerChange = (value: string) => {
    setSelectedAnswer(value);
    onAnswer?.(value);
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" mb={4}>
      <Text fontSize="lg" mb={4}>
        {question.question}
      </Text>
      <RadioGroup onChange={handleAnswerChange} value={selectedAnswer}>
        <Stack>
          {question.choices.map((choice, index) => (
            <Radio
              key={index}
              value={choice}
              colorScheme={showCorrectAnswer
                ? choice === question.correct_answer
                  ? 'green'
                  : selectedAnswer === choice
                  ? 'red'
                  : 'gray'
                : 'blue'
              }
              isDisabled={showCorrectAnswer}
            >
              {choice}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
      {showCorrectAnswer && (
        <Text
          mt={4}
          color={selectedAnswer === question.correct_answer ? 'green.500' : 'red.500'}
        >
          {selectedAnswer === question.correct_answer
            ? 'Correct!'
            : `Incorrect. The correct answer is: ${question.correct_answer}`}
        </Text>
      )}
    </Box>
  );
} 