import { Box, Text } from '@chakra-ui/react'
import { useUserStore } from '@/lib/stores/userStore'

export function UserID() {
  const { userId } = useUserStore()

  if (!userId) return null

  return (
    <Box
      position="fixed"
      top={4}
      left={4}
      bg="blue.500"
      color="white"
      px={3}
      py={2}
      borderRadius="md"
      boxShadow="md"
    >
      <Text fontWeight="bold">{userId}</Text>
    </Box>
  )
} 