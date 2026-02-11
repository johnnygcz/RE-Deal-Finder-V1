import { Box, Button, Text, VStack, HStack, Progress, Alert } from '@chakra-ui/react';
import { MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useWardAssignment } from '../hooks/useWardAssignment';

export default function WardAssignmentPanel({ properties }) {
  const { assignWardsToProperties, progress, isRunning, error, results } = useWardAssignment();

  const handleAssignWards = () => {
    assignWardsToProperties(properties);
  };

  // Count properties without wards
  const propertiesNeedingWards = properties.filter(p => 
    p.address?.lat && p.address?.lng && (!p.wards || p.wards.trim() === '')
  ).length;

  return (
    <Box
      p={6}
      bg="bg.subtle"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.muted"
      shadow="sm"
    >
      <VStack align="stretch" gap={4}>
        <HStack justify="space-between">
          <HStack gap={2}>
            <MapPin size={20} />
            <Text fontWeight="600" fontSize="lg">Ward Assignment</Text>
          </HStack>
          <Button
            colorPalette="blue"
            onClick={handleAssignWards}
            disabled={isRunning || propertiesNeedingWards === 0}
            size="sm"
          >
            {isRunning ? 'Assigning...' : `Assign Wards (${propertiesNeedingWards})`}
          </Button>
        </HStack>

        {error && (
          <Alert.Root colorPalette="red">
            <Alert.Indicator />
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        )}

        {isRunning && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="fg.muted">
                Processing {progress.current} of {progress.total} properties...
              </Text>
              <Text fontSize="sm" fontWeight="600">{progress.percent}%</Text>
            </HStack>
            <Progress.Root value={progress.percent} colorPalette="blue">
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
          </Box>
        )}

        {!isRunning && (results.updated > 0 || results.skipped > 0 || results.failed > 0) && (
          <VStack align="stretch" gap={2} p={4} bg="bg.muted" borderRadius="lg">
            <Text fontSize="sm" fontWeight="600" color="fg">Results:</Text>
            <HStack gap={4}>
              <HStack gap={1}>
                <CheckCircle size={16} color="green" />
                <Text fontSize="sm">{results.updated} updated</Text>
              </HStack>
              <HStack gap={1}>
                <AlertCircle size={16} color="orange" />
                <Text fontSize="sm">{results.skipped} skipped</Text>
              </HStack>
              <HStack gap={1}>
                <XCircle size={16} color="red" />
                <Text fontSize="sm">{results.failed} failed</Text>
              </HStack>
            </HStack>
          </VStack>
        )}

        <Text fontSize="xs" color="fg.muted">
          This will automatically detect and assign Windsor ward numbers to properties based on their coordinates.
          Properties already assigned or without coordinates will be skipped.
        </Text>
      </VStack>
    </Box>
  );
}
