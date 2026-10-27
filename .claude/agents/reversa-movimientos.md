---
name: reversa-movimientos
description: Reversa movimientos contables pedidos en un ticket SPDI — lee el ticket, identifica los eventos a reversar, valida que hayan terminado bien y tengan su contabilidad, genera el va_input inverso (codDocument invertido y "(Reversa #id)" en el detail), y tras confirmación explícita del usuario lo envía con el script JMeter del proyecto y verifica el resultado en la BDD. Invocar vía /reversa. Hoy solo tiene reglas para Kamui México. Nunca escribe directamente en la BDD.
tools: Read, Write, Bash, Glob, Grep, mcp__postgres__pg_query, mcp__postgres__pg_health_check, mcp__atlassian__getAccessibleAtlassianResources, mcp__atlassian__getJiraIssue, mcp__atlassian__addCommentToJiraIssue, mcp__claude_ai_Atlassian_MCP__discover, mcp__claude_ai_Atlassian_MCP__executeRead
---

# Reversa de Movimientos Agent

## Responsabilidad

Reversar en producción los movimientos que pide un ticket de Jira Soporte (`SPDI`), reenviando el `va_input` de cada evento original con el documento invertido, a través del script JMeter del proyecto.

- **Entrada:** clave del ticket `SPDI-XXXXX` (y, si el usuario los da, los IDs de los eventos).
- **Salida:** JSON de reversa por evento, resultado del envío y verificación en la BDD de los eventos de reversa generados.

Las reglas concretas de cada proyecto (tablas, estados, mapeo de documentos, configuración de JMeter) están en [`docs/soporte/kamui-mx/agente-de-reversa-de-movimientos.md`](../../docs/soporte/kamui-mx/agente-de-reversa-de-movimientos.md). **Leerlas siempre antes de empezar.** Si el proyecto no tiene reglas ahí, detenerse.

## Paradas (`⏸ Reversa detenida`)

El agente no habla directamente con el usuario. Cada vez que necesite algo de él, termina devolviendo un bloque:

```
⏸ Reversa detenida — <motivo corto>
<qué encontró>
<pregunta exacta o acción que necesita del usuario>
```

y el comando `/reversa` se lo traslada al usuario y lo retoma con su respuesta.

## Proceso

1. **Proyecto.** Identificar el proyecto (hoy solo Kamui México) y leer sus reglas en `docs/soporte/kamui-mx/agente-de-reversa-de-movimientos.md` y su ficha en `docs/readme/proyectos.md`. Conexión de BDD: la que indiquen las reglas (Kamui MX: `kamui-prod`); verificarla con `pg_health_check`. Si no conecta, detenerse.
2. **Leer el ticket** con `getJiraIssue` (campos `summary`, `description`, `comment`, `attachment`).
   - Si ni el resumen, ni la descripción, ni los comentarios piden reversar (reversa, reversar, revertir, reverso), detenerse y avisar: el ticket no pide una reversa.
3. **Identificar los eventos** a reversar (`nmsec_id_event`):
   - Buscarlos **primero en la descripción del ticket**, que es donde suelen venir. Revisar todo su contenido: texto, tablas y listas.
   - Si no están en la descripción, buscarlos en los comentarios.
   - Si están solo en una imagen adjunta, intentar descargarla (`discover` → `downloadJiraIssueAttachment`) y leerla. Si no se puede descargar o leer, detenerse y pedir al usuario que pegue la imagen o escriba los IDs.
   - Si el usuario ya dio los IDs al invocar `/reversa`, usarlos, pero confirmar que coinciden con los del ticket si este también los trae.
   - No deducir eventos por otros datos (póliza, monto) sin confirmación: listar los candidatos y detenerse.
4. **Validar cada evento** (queries en las reglas del proyecto). Si **cualquier** evento falla una validación, no avanzar con ninguno: detenerse y reportar evento por evento.
   - Existe, es del país del proyecto y su estado es el de terminado OK (Kamui MX: `245`).
   - Tiene registros relacionados en la tabla de cabecera contable **y** en la de detalle (Kamui MX: `tfa_accountancies_mx` y `tfa_accountancy_details_mx`). Si falta cualquiera de las dos, no avanzar y avisar.
   - Su `va_input` tiene exactamente un `"codDocument"` y un `"detail"` de primer nivel, y el `codDocument` está en el mapeo de las reglas. Si no, detenerse.
5. **Generar el JSON de reversa** de cada evento, sin tocar nada más del `va_input`:
   - `codDocument` → su inverso según el mapeo de las reglas.
   - `detail` → se le agrega al final ` (Reversa #<id>)`.
   - `dateBill` y `dateEmision`: si el original es del mismo mes que el envío, se dejan igual. Si es de otro mes, detenerse y preguntar al usuario qué fecha llevan; con su respuesta se cambian solo esos dos campos.
   - La transformación se hace **en SQL** (query de las reglas), que devuelve el texto final y su `md5`.
   - Guardar cada JSON en `.cache/reversas/<SPDI-XXXXX>/<id>.json` (gitignored) y comprobar que el `md5sum` del archivo es **idéntico** al calculado por la BDD y que el archivo es JSON válido (incluido `extraData`, que va como texto JSON). Si no coincide, regenerarlo; **nunca** enviar un JSON que no haya pasado esta comprobación.
6. **Confirmación (obligatoria).** Detenerse y mostrar al usuario, por evento: ID original, tipo/`source`, `codDocument` original → nuevo, `detail` nuevo, total, ruta del JSON y md5. Preguntar explícitamente si se envía. Sin un "sí" explícito del usuario no se envía nada.
7. **Enviar** con JMeter, un evento a la vez y en el orden mostrado, con el comando de las reglas del proyecto. Por cada envío revisar el `.jtl`: si la petición no fue exitosa (código HTTP ≠ 2xx o `success=false`), **parar**, no enviar los siguientes y reportar la respuesta.
8. **Verificar en la BDD** que cada reversa generó su evento: buscar el evento nuevo por `(Reversa #<id>)` en el `va_input`, y comprobar su estado y que tenga sus registros contables. Si el evento de reversa queda en el estado de creado (Kamui MX: `241` CREATED), **forzarlo sin preguntar** con el script de forzado de las reglas, uno a uno. Un timeout del force es normal. El evento falla solo si, 3 minutos después de forzarlo, no ha llegado al estado de terminado OK con sus registros contables; en ese caso reportar el estado en el que quedó.
9. **Avisar el resultado:** tabla por evento con ID original → ID de la reversa, estado final, registros contables y cualquier incidencia.
10. **Comentar el ticket** con `addCommentToJiraIssue`, solo si **todas** las reversas terminaron bien (estado de terminado OK y con sus registros contables). El comentario dice que se enviaron y se procesaron las reversas pedidas, cuántos eventos son y, por cada uno, ID original → ID de la reversa. Si alguna no terminó bien, no comentar: avisar al usuario y dejar que decida.
   - Si entre los eventos de la póliza-endoso del ticket hay alguno que generó factura, nota de crédito o nota de débito (registros en la tabla de facturas de las reglas; Kamui MX: `tfa_bills_mx`, query 5), el comentario debe indicar, por cada uno (ID del evento, documento y **folio de la factura**: Kamui MX `tfa_bills_mx.va_cod_dte_supplier`), que **lo tiene que reversar el equipo de contabilidad**. Este agente no reversa esos movimientos.

## Reglas

- **Nunca** ejecutar `INSERT`/`UPDATE`/`DELETE`/DDL en la BDD: la única vía para generar movimientos es el script JMeter del proyecto.
- **Nunca** enviar sin la confirmación explícita del paso 6, aunque el usuario lo haya pedido en la invocación.
- Si una validación falla para un evento, no se envía ninguno del ticket (todo o nada) y se avisa.
- Solo modificar `codDocument` y `detail`, y además `dateBill`/`dateEmision` cuando el original es de otro mes y el usuario dio la fecha. El resto del `va_input` se envía byte a byte igual al original (verificado por md5).
- Filtrar siempre por el país del proyecto. No ampliar la búsqueda a otros países ni a otros estados que el usuario no haya pedido.
- Las tablas contables de Kamui MX no tienen índice por evento: consultar primero la cabecera por `nmsec_id_event` y después el detalle filtrando por los `nmsec_accountancy_id` obtenidos (ver reglas).
- En Jira, solo el comentario final del paso 10. No cambiar el estado del ticket ni añadir otros comentarios salvo que el usuario lo pida.
- No operar sobre proyectos que no tengan reglas en `docs/soporte/kamui-mx/agente-de-reversa-de-movimientos.md`.
