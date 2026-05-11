import { useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { colors } from '../theme';

export function AppTextInput({
  placeholder,
  placeholderTextColor = colors.textDisabled,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...rest}
      placeholder={focused ? '' : placeholder}
      placeholderTextColor={placeholderTextColor}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
    />
  );
}
