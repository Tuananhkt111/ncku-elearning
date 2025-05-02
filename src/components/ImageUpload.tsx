import { useState, useRef } from 'react'
import {
  Box,
  Button,
  Image,
  Input,
  VStack,
  useToast,
  Text,
  Progress,
} from '@chakra-ui/react'

interface ImageUploadProps {
  onUpload: (url: string) => void
  currentImage?: string
}

export default function ImageUpload({ onUpload, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSelectedFile, setHasSelectedFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setHasSelectedFile(!!file)
    setPreview(null)
    setError(null)
    
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Please select an image first')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')

      onUpload(data.url)
      toast({
        title: 'Upload successful',
        status: 'success',
        duration: 3000,
      })
      
      // Reset states after successful upload
      setPreview(null)
      setHasSelectedFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again'
      setError(errorMessage)
      toast({
        title: 'Upload failed',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <VStack spacing={4} align="stretch">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        hidden
      />
      <Box
        borderWidth={2}
        borderStyle="dashed"
        borderRadius="md"
        p={4}
        textAlign="center"
        cursor="pointer"
        onClick={() => fileInputRef.current?.click()}
        bg={error ? 'red.50' : 'transparent'}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Preview"
            maxH="200px"
            mx="auto"
            objectFit="contain"
          />
        ) : (
          <Text color="gray.500">
            {hasSelectedFile ? 'Invalid image selected' : 'Click to select an image'}
          </Text>
        )}
      </Box>
      {error && (
        <Text color="red.500" fontSize="sm">
          {error}
        </Text>
      )}
      {isUploading && <Progress size="xs" isIndeterminate />}
      <Button
        colorScheme="blue"
        onClick={handleUpload}
        isLoading={isUploading}
        isDisabled={!hasSelectedFile || !preview || !!error}
      >
        Upload Image
      </Button>
    </VStack>
  )
} 