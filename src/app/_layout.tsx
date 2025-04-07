// src/app/layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}> {/* Oculta o cabeçalho globalmente */}
      <Stack.Screen name="index" />
      <Stack.Screen name="Home" />
      <Stack.Screen name="OrderView" />
      <Stack.Screen name="Orders" />
      <Stack.Screen name="Quiz" />
    </Stack>
  );
}
