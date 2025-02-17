// src/app/layout.tsx
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="Home" options={{ title: "Lançamento de Pedido" }} />
      <Stack.Screen name="OrderView" options={{ title: "Visualização do Pedido" }} />
      <Stack.Screen name="Orders" options={{ title: "Pedidos Anteriores" }} />
      <Stack.Screen name="Quiz" options={{ title: "Quiz" }} /> {/* Adicione esta linha */}
    </Stack>
  );
}