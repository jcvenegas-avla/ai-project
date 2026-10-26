# Acceso a Bases de Datos

La integración con Postgres está **versionada en [`.mcp.json`](../../.mcp.json)** (servidor MCP `postgres`, stdio). Las credenciales de conexión viven por separado en [`mcp-postgres.config.json`](../../mcp-postgres.config.json), local a cada máquina.

Cada proyecto tiene su propia base por entorno. La conexión se identifica con un `label` de la forma **`<proyecto>-<entorno>`** (p. ej. `kamui-prod`, `siniestro-dev`), y las de cada proyecto están en la fila `Conexiones Postgres` de su ficha en [`proyectos.md`](./proyectos.md).

| Entorno | Sufijo del `label` | Uso previsto |
| --- | --- | --- |
| Desarrollo | `-dev` | Exploración y pruebas sin restricciones. |
| QA | `-qa` | Pruebas y validación previas a producción. |
| Producción | `-prod` | Solo cuando sea estrictamente necesario — datos reales. |

Consultar una base con el comando **`/db <dev|qa|prod> <consulta>`**. Si se omite el entorno, Claude **debe detenerse y preguntar** cuál de los tres usar antes de ejecutar cualquier consulta — nunca asume un entorno por defecto. La misma regla aplica a cualquier agente (`developer`, `soporte`, etc.) que necesite datos reales de Postgres en medio de su trabajo sin que el entorno haya quedado explícito.

Dentro de cada entorno, las tablas viven en un **schema** de Postgres (no necesariamente `public`). El schema a usar por proyecto y entorno está en las filas `Schemas Postgres DEV`/`QA`/`PROD` de la tabla de cada proyecto en [`docs/readme/proyectos.md`](./proyectos.md); si falta, se determina consultando `pg_list_schemas` y confirmando con el usuario — misma regla que para el entorno, nunca asumir.

> **Regla de solo lectura, sin excepciones:** aunque la conexión configurada tenga permisos de escritura, Claude **nunca** ejecuta directamente un `INSERT`/`UPDATE`/`DELETE`/DDL sobre ninguna base — ni en `dev`, `qa` ni `prod` —, ni siquiera si la persona lo pide explícitamente o insiste. Cuando la solución requiere modificar datos, Claude entrega la explicación y la query exacta para que la persona la ejecute por sus propios medios.

Guía completa de configuración de credenciales, uso del comando, conexión directa (`psql` / cliente gráfico) y la regla de solo lectura: [`docs/integraciones/database-access.md`](../integraciones/database-access.md).
