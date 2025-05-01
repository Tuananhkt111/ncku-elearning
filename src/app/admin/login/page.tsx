'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
} from '@chakra-ui/react'
import Cookies from 'js-cookie'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'admin123' // Replace with secure env variable

export default function AdminLogin() {
  const router = useRouter()
  const toast = useToast()
  const [secretKey, setSecretKey] = useState('')

  // Redirect to admin dashboard if already logged in
  useEffect(() => {
    if (Cookies.get('isAdmin') === 'true') {
      router.push('/admin/questions')
    }
  }, [router])

  const handleLogin = () => {
    if (secretKey === ADMIN_SECRET) {
      // Set admin cookie with secure and httpOnly flags
      Cookies.set('isAdmin', 'true', { 
        expires: 1, // Expires in 1 day
        sameSite: 'strict',
        secure: window.location.protocol === 'https:',
      })
      
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 2000,
      })

      // Small delay to show success message
      setTimeout(() => {
        router.push('/admin/questions')
        router.refresh() // Force a refresh to update layout state
      }, 500)
    } else {
      toast({
        title: 'Invalid secret key',
        status: 'error',
        duration: 3000,
      })
    }
  }

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>Admin Login</Heading>

        <FormControl>
          <FormLabel>Secret Key</FormLabel>
          <Input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Enter admin secret key"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleLogin()
              }
            }}
          />
        </FormControl>

        <Button
          colorScheme="blue"
          onClick={handleLogin}
          w="full"
        >
          Login
        </Button>
      </VStack>
    </Container>
  )
} 