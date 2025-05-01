'use client';

import {
  Box,
  VStack,
  Link,
  Icon,
  Text,
  Flex,
} from '@chakra-ui/react';
import { FiSettings, FiHelpCircle } from 'react-icons/fi';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    label: 'Sessions',
    href: '/admin/sessions',
    icon: FiSettings,
  },
  {
    label: 'Questions',
    href: '/admin/questions',
    icon: FiHelpCircle,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Box
      as="nav"
      pos="fixed"
      left={0}
      h="100vh"
      w="240px"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      py={8}
    >
      <VStack spacing={2} align="stretch">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            as={NextLink}
            href={item.href}
            textDecoration="none"
            _hover={{ textDecoration: 'none' }}
          >
            <Flex
              align="center"
              px={8}
              py={3}
              cursor="pointer"
              bg={pathname === item.href ? 'blue.50' : 'transparent'}
              color={pathname === item.href ? 'blue.500' : 'gray.700'}
              _hover={{
                bg: pathname === item.href ? 'blue.50' : 'gray.50',
              }}
              transition="all 0.2s"
            >
              <Icon as={item.icon} boxSize={5} mr={3} />
              <Text fontWeight="medium">{item.label}</Text>
            </Flex>
          </Link>
        ))}
      </VStack>
    </Box>
  );
} 