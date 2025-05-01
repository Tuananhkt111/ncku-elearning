'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, Button, useToast } from '@chakra-ui/react';
import { AdminSidebar } from '@/components/AdminSidebar';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  useEffect(() => {
    const adminStatus = Cookies.get('isAdmin') === 'true';
    setIsAdmin(adminStatus);
    setIsLoading(false);

    // Don't redirect on the login page
    if (!adminStatus && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    Cookies.remove('isAdmin');
    toast({
      title: 'Logged out successfully',
      status: 'success',
      duration: 2000,
    });
    router.push('/admin/login');
  };

  // Show nothing while checking auth status
  if (isLoading) {
    return null;
  }

  return (
    <Flex minH="100vh">
      {isAdmin && <AdminSidebar />}
      <Box
        as="main"
        flex={1}
        ml={isAdmin ? "240px" : "0"} // Only add margin if sidebar is shown
        bg="gray.50"
        minH="100vh"
        position="relative"
      >
        {isAdmin && (
          <Button
            position="absolute"
            top={4}
            right={4}
            colorScheme="red"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        )}
        <Box p={8}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
} 