import { useState, useRef } from 'react'
import {
  Box,
  Button,
  Image,
  Input,
  VStack,
  useToast,
} from '@chakra-ui/react'

interface ImageUploadProps {
  onUpload: (url: string) => void
  currentImage?: string
}

export default function ImageUpload({ onUpload, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Show preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      onUpload(data.url)
      toast({
        title: 'Upload successful',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
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
          "Click to select an image"
        )}
      </Box>
      <Button
        colorScheme="blue"
        onClick={handleUpload}
        isLoading={isUploading}
        isDisabled={!preview}
      >
        Upload Image
      </Button>
    </VStack>
  )
} 