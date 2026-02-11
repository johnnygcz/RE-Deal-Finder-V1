import { useState } from 'react';
import { Box, Input, Button, VStack, Text, Card, Stack } from '@chakra-ui/react';
import { LogIn } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Preview login - accepting any credentials');
      console.log('Username:', username);

      // Validate non-empty fields
      if (!username || !username.trim()) {
        setError('Please enter a username');
        setLoading(false);
        return;
      }

      if (!password || !password.trim()) {
        setError('Please enter a password');
        setLoading(false);
        return;
      }

      console.log('✓ Login successful for user:', username);
      
      // Pass simplified user object with only username
      onLogin({
        username: username.trim()
      });
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="bg.canvas"
      fontFamily="Figtree, sans-serif"
    >
      <Card.Root maxW="400px" w="full" mx={4}>
        <Card.Header>
          <VStack gap={2}>
            <Box
              w="12"
              h="12"
              bg="blue.500"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <LogIn size={28} color="white" />
            </Box>
            <Text fontSize="2xl" fontWeight="bold" color="fg">
              RE Deal Finder
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Sign in to your account
            </Text>
          </VStack>
        </Card.Header>

        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={4}>
              <VStack gap={2} align="stretch">
                <Text fontSize="sm" fontWeight="medium" color="fg">
                  Username
                </Text>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  size="lg"
                  required
                />
              </VStack>

              <VStack gap={2} align="stretch">
                <Text fontSize="sm" fontWeight="medium" color="fg">
                  Password
                </Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  size="lg"
                  required
                />
              </VStack>

              {error && (
                <Box
                  bg="red.50"
                  borderWidth="1px"
                  borderColor="red.200"
                  borderRadius="md"
                  p={3}
                >
                  <Text color="red.700" fontSize="sm">
                    {error}
                  </Text>
                </Box>
              )}

              <Button
                type="submit"
                colorPalette="blue"
                size="lg"
                w="full"
                loading={loading}
                disabled={loading}
              >
                Sign In
              </Button>
            </Stack>
          </form>
        </Card.Body>

        <Card.Footer>
          <Text fontSize="xs" color="fg.muted" textAlign="center" w="full">
            Instant authentication • No files required
          </Text>
        </Card.Footer>
      </Card.Root>
    </Box>
  );
}
