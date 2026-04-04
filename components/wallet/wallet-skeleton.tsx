import React from "react";
import { Animated as RNAnimated, ViewStyle } from "react-native";

type WalletSkeletonProps = {
  style?: ViewStyle | ViewStyle[];
};

export function WalletSkeleton({ style }: WalletSkeletonProps) {
  const shimmerAnim = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    const animation = RNAnimated.loop(
      RNAnimated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 320],
  });

  return (
    <RNAnimated.View
      style={[
        {
          backgroundColor: "#14171C",
          borderRadius: 18,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <RNAnimated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 120,
          opacity: 0.3,
          backgroundColor: "#2A2F38",
          transform: [{ translateX }],
        }}
      />
    </RNAnimated.View>
  );
}
