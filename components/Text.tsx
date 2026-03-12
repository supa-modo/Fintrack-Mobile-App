import React from "react";
import { Text as RNText, TextProps } from "react-native";

const defaultFontStyle = { fontFamily: "GoogleSansFlex" as const };

export function Text(props: TextProps & { allowFontScaling?: boolean }) {
  const { style, allowFontScaling, ...rest } = props;
  return (
    <RNText
      allowFontScaling={allowFontScaling ?? false}
      style={[style, defaultFontStyle]}
      {...rest}
    />
  );
}
