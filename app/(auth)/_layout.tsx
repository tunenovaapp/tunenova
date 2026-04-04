import { RequireAuth } from "@/components/RequireAuth";
import { Slot, usePathname } from "expo-router";

const protectedAuthPaths = new Set(["/music-platform", "/genre-screen"]);

export default function AuthLayout() {
  const pathname = usePathname();

  if (!protectedAuthPaths.has(pathname)) {
    return <Slot />;
  }

  return (
    <RequireAuth>
      <Slot />
    </RequireAuth>
  );
}
