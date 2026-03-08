import React from "react";
import { Text as RNText, TextProps } from "react-native";

const defaultFontStyle = { fontFamily: "GoogleSansFlex" as const };

export function Text(props: TextProps) {
  const { style, ...rest } = props;
  return <RNText style={[style, defaultFontStyle]} {...rest} />;
}
