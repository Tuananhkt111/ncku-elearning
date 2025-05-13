import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  IconButton,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Popup } from '@/types';

interface PopupManagerProps {
  sessionId: number;
  popups: Popup[];
  onUpdate: () => void;
}

export function PopupManager({ sessionId, popups, onUpdate }: PopupManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<Partial<Popup>>({
    name: '',
    description: '',
    start_time: 0,
    duration: 10,
  });
  const [isEditing, setIsEditing] = useState(false);
  const toast = useToast();
  const supabase = createClientComponentClient();

  const handleSubmit = async () => {
    if (!currentPopup.name || !currentPopup.description) {
      toast({
        title: 'Please fill all required fields',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);

      if (isEditing && currentPopup.id) {
        const { error } = await supabase
          .from('popups')
          .update({
            name: currentPopup.name,
            description: currentPopup.description,
            start_time: currentPopup.start_time,
            duration: currentPopup.duration,
          })
          .eq('id', currentPopup.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('popups')
          .insert([{
            session_id: sessionId,
            name: currentPopup.name,
            description: currentPopup.description,
            start_time: currentPopup.start_time,
            duration: currentPopup.duration,
          }]);

        if (error) throw error;
      }

      toast({
        title: `Popup ${isEditing ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 2000,
      });

      setCurrentPopup({
        name: '',
        description: '',
        start_time: 0,
        duration: 10,
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving popup:', error);
      toast({
        title: 'Error saving popup',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (popup: Popup) => {
    setCurrentPopup(popup);
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Popup deleted successfully',
        status: 'success',
        duration: 2000,
      });

      onUpdate();
    } catch (error) {
      console.error('Error deleting popup:', error);
      toast({
        title: 'Error deleting popup',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold">
            {isEditing ? 'Edit Popup' : 'Add New Popup'}
          </Text>

          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              value={currentPopup.name}
              onChange={(e) => setCurrentPopup({ ...currentPopup, name: e.target.value })}
              placeholder="Enter popup name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Input
              value={currentPopup.description}
              onChange={(e) => setCurrentPopup({ ...currentPopup, description: e.target.value })}
              placeholder="Enter popup description"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Start Time (seconds from session start)</FormLabel>
            <NumberInput
              value={currentPopup.start_time}
              onChange={(_, value) => setCurrentPopup({ ...currentPopup, start_time: value })}
              min={0}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Duration (seconds)</FormLabel>
            <NumberInput
              value={currentPopup.duration}
              onChange={(_, value) => setCurrentPopup({ ...currentPopup, duration: value })}
              min={1}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {isEditing ? 'Update Popup' : 'Add Popup'}
          </Button>
        </VStack>
      </Box>

      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>Popups List</Text>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th>Start Time</Th>
              <Th>Duration</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {popups.map((popup) => (
              <Tr key={popup.id}>
                <Td>{popup.name}</Td>
                <Td>{popup.description}</Td>
                <Td>{popup.start_time}s</Td>
                <Td>{popup.duration}s</Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Edit popup"
                      icon={<EditIcon />}
                      size="sm"
                      onClick={() => handleEdit(popup)}
                    />
                    <IconButton
                      aria-label="Delete popup"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(popup.id)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
} 