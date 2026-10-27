---
description: Consulta una base de datos PostgreSQL (dev/qa/prod) vía el servidor MCP `postgres`, preguntando el entorno si no se especifica.
argument-hint: "[dev|qa|prod] <consulta o instrucción>"
---

# /db

## Entrada

`$ARGUMENTS` — el primer token, si es `dev`, `qa` o `prod`, es el **entorno objetivo**; el resto es la consulta o instrucción a resolver contra esa base de datos (SQL directo o una petición en lenguaje natural, p. ej. "cuántas pólizas activas hay").

## Proceso

1. Si el primer token de `$ARGUMENTS` es `dev`, `qa` o `prod`, usar ese entorno; el resto de `$ARGUMENTS` es la consulta.
2. Si no viene un entorno reconocible al inicio de `$ARGUMENTS`, **detenerse** y preguntar explícitamente al usuario cuál de los tres entornos (`dev`, `qa`, `prod`) quiere consultar (ver `docs/integraciones/database-access.md`). No asumir un entorno por defecto bajo ninguna circunstancia — las tres bases son independientes y `prod` es especialmente sensible.
3. Determinar el **schema** dentro de esa base para el proyecto en contexto: buscar el valor en las filas `Schemas Postgres DEV`/`QA`/`PROD` de la tabla del proyecto en [`docs/readme/proyectos.md`](../../docs/readme/proyectos.md). Si el proyecto o el entorno no tienen valor ahí, **detenerse**, ejecutar `pg_list_schemas` contra ese entorno y preguntar al usuario cuál corresponde antes de seguir (ver `docs/integraciones/database-access.md`, sección "Esquema (schema) dentro de cada base") — no asumir `public` sin confirmarlo.
4. Localizar las tools expuestas por el servidor MCP `postgres` (definido en `.mcp.json`, respaldado por `multi-postgres-mcp-server` + `mcp-postgres.config.json`) con `ToolSearch` si no están cargadas todavía.
5. Si la consulta o instrucción es de **solo lectura** (`SELECT` o equivalente), ejecutarla contra la conexión del proyecto y del entorno elegidos. Su `label` en `mcp-postgres.config.json` tiene la forma `<proyecto>-<entorno>` (p. ej. `kamui-prod`, `siniestro-dev`) y está en la fila `Conexiones Postgres` de la ficha del proyecto en `proyectos.md`. Si no está claro de qué proyecto es la consulta, preguntar. Si el proyecto no tiene conexión configurada para ese entorno, detenerse y avisar. Pasar ese `label` y el `schema` determinado en el paso 3 en los parámetros de conexión que exponga la tool (revisar su schema exacto antes de llamar).
6. Si la consulta o instrucción implica **escritura** (`INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`/DDL, o "arregla este dato", "corrige el registro", etc.), **no ejecutarla nunca**, aunque la conexión configurada tenga permisos de escritura y aunque la persona insista explícitamente: en su lugar, explicar la causa/solución y entregar la query exacta para que la persona la ejecute por sus propios medios (ver `docs/integraciones/database-access.md`, sección "Regla de solo lectura").
7. Cada invocación de `/db` es independiente: se puede alternar de entorno en llamadas sucesivas (p. ej. `/db dev SELECT ...` y luego `/db qa SELECT ...`) sin reconfigurar nada, para comparar datos entre entornos.

## Salida

Resultado de la consulta, indicando siempre de forma explícita contra qué conexión (`label`, p. ej. `siniestro-qa`) y schema se ejecutó.

## Cuándo usarlo

- Cualquier vez que se necesiten datos reales de Postgres durante desarrollo, soporte o QA.
- Regla general para cualquier agente (`developer`, `soporte`, etc.): si en medio de su trabajo necesita datos de base de datos y no se indicó el entorno o el schema no está confirmado, debe aplicar los pasos 2 y 3 de este comando (preguntar) antes de consultar — ver `docs/integraciones/database-access.md`.
