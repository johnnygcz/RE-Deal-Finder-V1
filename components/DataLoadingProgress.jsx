import React from 'react';
import { Box, Text } from '@chakra-ui/react';

export default function DataLoadingProgress({ progress, isVisible }) {
  if (!isVisible) return null;

  // Show progress percentage in top-right corner
  const displayText = progress?.status || `Downloading... ${progress?.percent || 0}%`;

  return (
    <Box
      position="fixed"
      top="8px"
      right="12px"
      zIndex={9999}
      pointerEvents="none"
      bg="bg.panel"
      px={3}
      py={1.5}
      borderRadius="md"
      boxShadow="sm"
      border="1px solid"
      borderColor="border.muted"
    >
      <Text fontSize="xs" color="fg" fontWeight="bold" whiteSpace="nowrap">
        {displayText}
      </Text>
    </Box>
  );
}
