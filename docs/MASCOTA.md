# Nuri, la mascota

**Nuri** (de «neurona») es una criatura azul, redondeada y amable con dos antenas con una chispa dorada: las ramas de una neurona. Acompaña, no aconseja.

- **Dónde aparece**: bienvenida (con una entrada suave de 300 ms), listas vacías, «¡Todo al día!» cuando ya anotó todas las medicinas de hoy, «Acerca de», iconos y pantalla de inicio.
- **Estados**: `hola` (ojos abiertos, sonrisa), `contento` (ojos felices, sonrisa grande), `descanso` (ojos cerrados, calma).
- **Nunca** aparece en errores, confirmaciones de borrado, avisos ni mensajes médicos, y no da consejos de salud.
- **Accesibilidad**: es decorativa, se oculta a los lectores de pantalla; todo lo que dice Nuri también está en texto. Con «reducir movimiento» no se anima.
- **Fuentes**: `src/components/Mascot.tsx` (react-native-svg) y `assets/mascot/nuri.svg`. Los iconos (`assets/*.png`) se regeneran con `node scripts/make-icons.mjs`.
- **Paleta**: cuerpo `#8CC1EE`, contorno `#2F5D8A`, vientre `#DCEEFB`, chispa `#F2B84B`, mejillas `#F7A8B8`.
