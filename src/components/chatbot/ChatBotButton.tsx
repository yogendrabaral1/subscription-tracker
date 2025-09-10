import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ChatBotButtonProps {
  onPress: () => void;
}

const ChatBotButton: React.FC<ChatBotButtonProps> = ({ onPress }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }, theme.shadows.md]} onPress={onPress}>
      <Text style={styles.icon}>🤖</Text>
      <Text style={styles.text}>Ask Assistant</Text>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatBotButton;
