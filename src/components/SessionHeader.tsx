import {
  Box,
  Flex,
  Text,
  HStack,
  Button,
} from '@chakra-ui/react'
import { useUserStore } from '@/lib/stores/userStore'

interface SessionHeaderProps {
  sessionName: string;
  timeLeft: number;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
}

export function SessionHeader({ 
  sessionName, 
  timeLeft,
  onSubmit,
  isSubmitDisabled
}: SessionHeaderProps) {
  const { userId } = useUserStore()
  
  // Convert seconds to minutes and seconds
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Format time as MM:SS
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Box 
      position="fixed"
      top={0}
      left={0}
      right={0}
      bg="white"
      boxShadow="sm"
      zIndex="sticky"
      py={4}
      px={6}
    >
      <Flex maxW="container.xl">
        <HStack spacing={6} align="center">
          <Button
            colorScheme="blue"
            size="md"
            borderRadius="md"
            px={4}
            py={2}
            cursor="default"
            _hover={{ bg: 'blue.500' }}
          >
            {userId || 'User1'}
          </Button>
          <Text fontSize="xl" fontWeight="bold">
            {sessionName}
          </Text>
          <HStack spacing={2}>
            <Text fontSize="lg" fontWeight="medium">Time Remaining:</Text>
            <Text 
              fontSize="lg" 
              fontWeight="bold"
              color={timeLeft < 60 ? "red.500" : "black"}
            >
              {formattedTime}
            </Text>
          </HStack>
          <Button 
            colorScheme="green" 
            size="lg" 
            onClick={onSubmit}
            isDisabled={isSubmitDisabled}
          >
            Submit All Answers
          </Button>
        </HStack>
      </Flex>
    </Box>
  )
} 