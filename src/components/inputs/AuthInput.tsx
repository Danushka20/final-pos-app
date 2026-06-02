import React, { useState } from 'react';
import { TextInputProps } from 'react-native';
import { Eye, EyeOff, LucideProps } from 'lucide-react-native';
import type { ComponentType } from 'react';
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
  InputSlot,
  Pressable,
} from '@gluestack-ui/themed';
import { colors, fontStyle } from '@/theme';

interface AuthInputProps extends TextInputProps {
  label: string;
  icon?: ComponentType<LucideProps>;
  error?: string;
  isPassword?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  icon: Icon,
  error,
  isPassword,
  ...inputProps
}) => {
  const [hidden, setHidden] = useState(!!isPassword);

  return (
    <FormControl isInvalid={!!error} mb="$4">
      <FormControlLabel mb="$1.5">
        <FormControlLabelText
          color={colors.text}
          fontSize="$sm"
          fontWeight="$bold"
          style={fontStyle.label}>
          {label}
        </FormControlLabelText>
      </FormControlLabel>

      <Input
        variant="outline"
        size="lg"
        h={54}
        borderRadius="$xl"
        borderWidth={1.5}
        borderColor={error ? colors.error : colors.border}
        bg={colors.white}
        alignItems="center"
        $focus-borderColor={colors.primary}
        $focus-borderWidth={2}>
        {Icon ? (
          <InputSlot pl="$4">
            <Icon size={20} color={colors.primaryLight} />
          </InputSlot>
        ) : null}

        <InputField
          {...inputProps}
          flex={1}
          color={colors.text}
          placeholderTextColor={colors.textMuted}
          fontSize="$md"
          style={fontStyle.input}
          secureTextEntry={isPassword ? hidden : inputProps.secureTextEntry}
        />

        {isPassword ? (
          <InputSlot pr="$4">
            <Pressable onPress={() => setHidden(v => !v)} hitSlop={12}>
              {hidden ? (
                <Eye size={20} color={colors.textMuted} />
              ) : (
                <EyeOff size={20} color={colors.textMuted} />
              )}
            </Pressable>
          </InputSlot>
        ) : null}
      </Input>

      {error ? (
        <FormControlError mt="$1">
          <FormControlErrorText color={colors.error} fontSize="$xs">
            {error}
          </FormControlErrorText>
        </FormControlError>
      ) : null}
    </FormControl>
  );
};
