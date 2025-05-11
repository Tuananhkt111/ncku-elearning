'use client';

import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Textarea,
  VStack,
  Divider,
  Box,
  IconButton,
  HStack,
  Text,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { Session, Popup } from '@/types';

interface SessionFormProps {
  initialData?: Session;
  onSubmit: (data: Omit<Session, 'id' | 'created_at'>) => Promise<void>;
  isLoading: boolean;
}

export function SessionForm({ initialData, onSubmit, isLoading }: SessionFormProps) {
  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    duration_minutes: initialData?.duration_minutes || 7,
    evaluation_minutes: initialData?.evaluation_minutes || 3,
  });

  const [popups, setPopups] = useState<Omit<Popup, 'id' | 'session_id' | 'created_at'>[]>(
    initialData?.popups?.map(popup => ({
      name: popup.name,
      description: popup.description,
      start_time: popup.start_time,
      duration: popup.duration,
    })) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      popups: popups.map(popup => ({
        name: popup.name,
        description: popup.description,
        start_time: popup.start_time,
        duration: popup.duration,
        id: undefined as any,
        session_id: undefined as any,
        created_at: undefined as any,
      })),
    });
  };

  const addPopup = () => {
    setPopups([
      ...popups,
      {
        name: '',
        description: '',
        start_time: 0,
        duration: 60,
      },
    ]);
  };

  const removePopup = (index: number) => {
    setPopups(popups.filter((_, i) => i !== index));
  };

  const updatePopup = (index: number, field: keyof Omit<Popup, 'id' | 'session_id' | 'created_at'>, value: any) => {
    const newPopups = [...popups];
    newPopups[index] = {
      ...newPopups[index],
      [field]: value,
    };
    setPopups(newPopups);
  };

  const maxSeconds = formData.duration_minutes * 60;

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter session description"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Duration (minutes)</FormLabel>
          <NumberInput
            value={formData.duration_minutes}
            onChange={(_, value) => setFormData({ ...formData, duration_minutes: value })}
            min={1}
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Evaluation Time (minutes)</FormLabel>
          <NumberInput
            value={formData.evaluation_minutes}
            onChange={(_, value) => setFormData({ ...formData, evaluation_minutes: value })}
            min={1}
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>

        <Divider my={2} />

        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="medium">Popups</Text>
            <Button
              leftIcon={<AddIcon />}
              size="sm"
              onClick={addPopup}
              colorScheme="blue"
            >
              Add Popup
            </Button>
          </HStack>

          <VStack spacing={4} align="stretch">
            {popups.map((popup, index) => (
              <Box key={index} p={4} borderWidth={1} borderRadius="md" position="relative">
                <IconButton
                  aria-label="Remove popup"
                  icon={<DeleteIcon />}
                  size="sm"
                  position="absolute"
                  top={2}
                  right={2}
                  onClick={() => removePopup(index)}
                  colorScheme="red"
                />

                <VStack spacing={3} align="stretch" mt={2}>
                  <FormControl>
                    <FormLabel>Name</FormLabel>
                    <Input
                      value={popup.name}
                      onChange={(e) => updatePopup(index, 'name', e.target.value)}
                      placeholder="Enter popup name"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={popup.description}
                      onChange={(e) => updatePopup(index, 'description', e.target.value)}
                      placeholder="Enter popup description"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Start Time (seconds from session start)</FormLabel>
                    <NumberInput
                      value={popup.start_time}
                      onChange={(_, value) => updatePopup(index, 'start_time', value)}
                      min={0}
                      max={maxSeconds}
                    >
                      <NumberInputField />
                    </NumberInput>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Must be between 0 and {maxSeconds} seconds
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Duration (seconds)</FormLabel>
                    <NumberInput
                      value={popup.duration}
                      onChange={(_, value) => updatePopup(index, 'duration', value)}
                      min={1}
                      max={maxSeconds}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </VStack>
              </Box>
            ))}
          </VStack>
        </Box>

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isLoading}
          mt={4}
        >
          {initialData?.id ? 'Update Session' : 'Create Session'}
        </Button>
      </VStack>
    </form>
  );
} 