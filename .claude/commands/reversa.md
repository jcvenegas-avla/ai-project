---
description: Reversa los movimientos contables que pide un ticket SPDI (codDocument invertido + "(Reversa #id)"), validando en la BDD y enviándolos con JMeter tras confirmación, invocando al agente reversa-movimientos.
argument-hint: "<SPDI-XXXXX> [ids de eventos]"
---

# /reversa

## Entrada

`$ARGUMENTS` — clave del ticket de soporte (`SPDI-XXXXX`) y, opcionalmente, los IDs de los eventos a reversar si no vienen en texto en el ticket (por ejemplo, cuando están en una imagen).

## Proceso

1. Invocar el subagente `reversa-movimientos` (tool Agent, `subagent_type: reversa-movimientos`) pasando `$ARGUMENTS`.
2. Cada vez que el agente devuelva un bloque `⏸ Reversa detenida`, mostrárselo al usuario tal cual y continuar **el mismo agente** (SendMessage con su id) pasándole la respuesta literal. No responder por el usuario.
3. La confirmación del envío debe ser explícita del usuario: sin ella no se envía nada.
4. Al terminar, mostrar la tabla de resultados que devolvió el agente.

## Salida

JSON de reversa por evento, resultado del envío con JMeter, verificación en la BDD y, si todas las reversas terminaron bien, comentario en el ticket con los eventos reversados (ver `.claude/agents/reversa-movimientos.md` y `docs/soporte/kamui-mx/agente-de-reversa-de-movimientos.md`).

## Cuándo usarlo

- Cuando un ticket `SPDI` pida reversar movimientos de un proyecto con reglas de reversa (hoy: Kamui México).
