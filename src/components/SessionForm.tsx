'use client';

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
  Switch,
  Text,
} from '@chakra-ui/react';
import { Session } from '@/types';
import { useState } from 'react';

interface SessionFormProps {
  initialData?: Partial<Session>;
  onSubmit: (data: Omit<Session, 'id' | 'created_at'>) => Promise<void>;
  isLoading?: boolean;
}

export function SessionForm({ initialData, onSubmit, isLoading }: SessionFormProps) {
  const [hasPopup, setHasPopup] = useState(
    Boolean(initialData?.popup_start_time !== null)
  );

  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    duration_minutes: initialData?.duration_minutes || 7,
    evaluation_minutes: initialData?.evaluation_minutes || 3,
    popup_name: initialData?.popup_name || '',
    popup_description: initialData?.popup_description || '',
    popup_start_time: initialData?.popup_start_time || 0,
    popup_duration: initialData?.popup_duration || 60,
    popup_remind_time: initialData?.popup_remind_time || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      popup_name: hasPopup ? formData.popup_name : '',
      popup_description: hasPopup ? formData.popup_description : '',
      popup_start_time: hasPopup ? formData.popup_start_time : null,
      popup_duration: hasPopup ? formData.popup_duration : null,
      popup_remind_time: hasPopup ? formData.popup_remind_time : null,
    });
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

        <FormControl display="flex" alignItems="center">
          <FormLabel mb={0}>Include Popup</FormLabel>
          <Switch
            isChecked={hasPopup}
            onChange={(e) => setHasPopup(e.target.checked)}
          />
        </FormControl>

        {hasPopup && (
          <>
            <FormControl>
              <FormLabel>Popup Name</FormLabel>
              <Input
                value={formData.popup_name}
                onChange={(e) => setFormData({ ...formData, popup_name: e.target.value })}
                placeholder="Enter popup name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Popup Description</FormLabel>
              <Textarea
                value={formData.popup_description}
                onChange={(e) => setFormData({ ...formData, popup_description: e.target.value })}
                placeholder="Enter popup description"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Start Time (seconds from session start)</FormLabel>
              <NumberInput
                value={formData.popup_start_time}
                onChange={(_, value) => setFormData({ ...formData, popup_start_time: value })}
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
                value={formData.popup_duration}
                onChange={(_, value) => setFormData({ ...formData, popup_duration: value })}
                min={1}
                max={maxSeconds}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Reminder Time (seconds from session start)</FormLabel>
              <NumberInput
                value={formData.popup_remind_time ?? ''}
                onChange={(_, value) => setFormData({ ...formData, popup_remind_time: value || null })}
                min={0}
                max={maxSeconds}
              >
                <NumberInputField placeholder="Leave empty for no reminder" />
              </NumberInput>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Optional. When to show a reminder during the session.
              </Text>
            </FormControl>
          </>
        )}

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