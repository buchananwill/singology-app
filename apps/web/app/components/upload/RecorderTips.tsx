import { Box, List, Text } from "@mantine/core";

export function RecorderTips() {
  return (
    <Box c="dimmed" fz="sm">
      <Text size="sm" fw={600} c="dimmed">
        Recommended recorder
      </Text>
      <List size="sm">
        <List.Item>iPhone: Voice Memos with Lossless turned on, or the Camera app.</List.Item>
        <List.Item>Android: the built-in voice recorder.</List.Item>
      </List>
    </Box>
  );
}
