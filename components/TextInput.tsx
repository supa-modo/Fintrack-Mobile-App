import React from "react";
import { TextInput as RNTextInput, TextInputProps } from "react-native";

const defaultFontStyle = { fontFamily: "GoogleSansFlex" as const };

export function TextInput(props: TextInputProps) {
  const { style, ...rest } = props;
  return (
    <RNTextInput
      allowFontScaling={false}
      style={[style, defaultFontStyle]}
      {...rest}
    />
  );
}
