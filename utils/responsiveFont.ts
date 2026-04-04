import { Dimensions, PixelRatio } from "react-native";

export function RFPercentage(percent: number) {
  const { height, width } = Dimensions.get("window");
  const deviceHeight = Math.max(height, width);

  return PixelRatio.roundToNearestPixel((percent * deviceHeight) / 100);
}

export function RFValue(fontSize: number, standardScreenHeight = 680) {
  const { height, width } = Dimensions.get("window");
  const deviceHeight = Math.max(height, width);

  return PixelRatio.roundToNearestPixel(
    (fontSize * deviceHeight) / standardScreenHeight
  );
}
