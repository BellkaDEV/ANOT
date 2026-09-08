import React from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppTheme } from "../types";

interface Props {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  th: AppTheme;
  dismissKeyboardOnTap?: boolean;
}

export default function KeyboardAwareScreen({
  children,
  header,
  footer,
  style,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  th,
  dismissKeyboardOnTap = true,
}: Props) {
  const insets = useSafeAreaInsets();

  const defaultOffset = Platform.OS === "ios" ? Math.max(insets.top, 20) : 0;
  const offset = keyboardVerticalOffset || defaultOffset;

  const content = (
    <View style={[S.container, { backgroundColor: th.bg }, style]}>
      {header}
      <KeyboardAvoidingView
        style={S.avoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={offset}
      >
        <ScrollView
          style={S.scroll}
          contentContainerStyle={[
            S.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 20 },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </View>
  );

  if (dismissKeyboardOnTap) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
}

const S = StyleSheet.create({
  container: {
    flex: 1,
  },
  avoidingView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
