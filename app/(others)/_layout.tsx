import { RequireAuth } from "@/components/RequireAuth";
import { Slot } from "expo-router";

export default function OthersLayout() {
  return (
    <RequireAuth>
      <Slot />
    </RequireAuth>
  );
}
