# Acceso a Bases de Datos (PostgreSQL)

Guía práctica para configurar y usar el acceso a las bases de datos PostgreSQL de **dev**, **qa** y **prod** desde Claude Code.

---

## 1. Cómo está armado

| Pieza | Rol |
| --- | --- |
| [`.mcp.json`](../../.mcp.json) | Registra el servidor MCP `postgres` (stdio, `multi-postgres-mcp-server`) que expone las bases como tools de Claude Code. |
| [`mcp-postgres.config.json`](../../mcp-postgres.config.json) | Credenciales de conexión, una entrada por entorno (`dev`, `qa`, `prod`), identificadas por `label`. |
| `/db` ([`.claude/commands/db.md`](../../.claude/commands/db.md)) | Comando para consultar un entorno explícito, o preguntar cuál usar si no se indicó. |

El servidor `postgres` lee `mcp-postgres.config.json` al iniciar y expone cada conexión habilitada (`enabled: true`) como una base disponible para consultar por su `label`.

---

## 2. Configurar las credenciales

Editar [`mcp-postgres.config.json`](../../mcp-postgres.config.json) en la raíz del proyecto. Ya trae la estructura de los 3 entornos con los campos vacíos:

```json
{
  "connections": [
    { "label": "dev",  "host": "", "port": "", "user": "", "password": "", "database": "", "enabled": true },
    { "label": "qa",   "host": "", "port": "", "user": "", "password": "", "database": "", "enabled": true },
    { "label": "prod", "host": "", "port": "", "user": "", "password": "", "database": "", "enabled": true }
  ]
}
```

Completar por entorno:

| Campo | Significado |
| --- | --- |
| `label` | Nombre del entorno (`dev` / `qa` / `prod`) — no cambiarlo, es lo que usa `/db` para elegir la conexión. |
| `host` | Host o IP del servidor Postgres de ese entorno. |
| `port` | Puerto (`5432` por defecto en Postgres). |
| `user` | Usuario de conexión. |
| `password` | Password del usuario. |
| `database` | Nombre de la base a la que conectar. |
| `enabled` | `true` para que el entorno quede disponible; `false` para desactivarlo sin borrar la entrada. |

Después de editar el archivo, reiniciar Claude Code (o recargar los servidores MCP) para que el servidor `postgres` tome las credenciales nuevas.

> ⚠️ **Seguridad:** este archivo contiene credenciales en texto plano y hoy está trackeado en git. No commitear valores reales de `prod` (ni de ningún entorno) — si necesitas versionar una plantilla, usa un archivo `.example` con placeholders y agrega el real a `.gitignore`. Este repositorio ya tuvo una contraseña real expuesta en un commit previo (`2cd59c3`); si esa credencial sigue vigente, rotarla es responsabilidad de quien administra esa base.

---

## 3. Uso del comando `/db`

```text
/db <dev|qa|prod> <consulta>
```

- **Con entorno explícito:** ejecuta la consulta directamente contra ese entorno.

  ```text
  /db dev SELECT * FROM policy LIMIT 10;
  /db qa ¿cuántas pólizas activas hay?
  /db prod SELECT count(*) FROM policy_quote_movement WHERE nm_premium_new = 0;
  ```

- **Sin entorno:** Claude se detiene y pregunta explícitamente cuál de los tres entornos usar antes de consultar nada. Nunca asume un entorno por defecto — `prod` es información real y sensible.

- **Alternar entre entornos:** cada llamada a `/db` es independiente. Se puede pedir un dato en `dev`, comparar el mismo dato en `qa`, y validar en `prod`, sin reconfigurar nada entre medio:

  ```text
  /db dev SELECT count(*) FROM policy;
  /db qa  SELECT count(*) FROM policy;
  /db prod SELECT count(*) FROM policy;
  ```

- **Fuera de `/db`:** si en medio de una Task (`developer`), un diagnóstico (`soporte`) o cualquier otra tarea se necesitan datos reales de Postgres y no quedó claro el entorno, el agente debe aplicar la misma regla — detenerse y preguntar cuál de los tres usar antes de consultar.

---

## 4. Esquema (schema) dentro de cada base

Además del entorno (`dev`/`qa`/`prod`, resuelto por `mcp-postgres.config.json`), cada base Postgres puede tener varios schemas reales además de los de sistema (`information_schema`, `pg_catalog`). Las tools del servidor `postgres` (`pg_list_tables`, `pg_describe_table`, y `pg_query` cuando la consulta no califica la tabla) usan `public` por defecto si no se indica otro — ese default puede no ser correcto para todos los proyectos.

**Determinación del schema, por proyecto y entorno:**

1. Consultar las filas `Schemas Postgres DEV`/`QA`/`PROD` de la tabla del proyecto en [`docs/readme/proyectos.md`](../readme/proyectos.md). Si el proyecto y el entorno elegido tienen un valor ahí, usar ese schema directamente.
2. Si la celda está vacía o el proyecto no aparece en la tabla, **detenerse**: ejecutar `pg_list_schemas` (tool MCP, parámetro `database` = label del entorno) para listar los schemas disponibles, y preguntar explícitamente al usuario cuál corresponde a ese proyecto — misma regla que para elegir entorno, nunca asumir `public` por defecto.
3. Una vez confirmado, documentarlo en la tabla de `docs/readme/proyectos.md` para no repetir la pregunta en la siguiente sesión.

> Hoy Artico México es el único proyecto de la tabla y `public` es el único schema con datos de negocio en `dev`/`qa` (`information_schema` y `pg_catalog` son del sistema, sin tablas de negocio). Si se agrega un nuevo proyecto sobre el mismo servidor Postgres, puede vivir en un schema distinto dentro de la misma base, o en una base distinta — el entorno resuelve la base (vía `/db`), esta tabla resuelve el schema dentro de ella.

### Estructura de tablas (snapshot)

El snapshot de tablas, columnas, primary keys y foreign keys **no vive en este repositorio** — cada proyecto es responsable de su propia documentación (mismo criterio que `docs/convenciones/architecture.md`/`docs/convenciones/coding-standards.md`/`docs/convenciones/api-guidelines.md`). Vive en el repositorio del proyecto correspondiente, en `doc/IA/db-schema-<schema>-<entorno>.md` (ver [`docs/readme/proyectos.md`](../readme/proyectos.md) para la ruta del Workspace/repo). Si un proyecto no lo tiene, `developer`/`soporte` deben señalarlo antes de explorar la base a ciegas, en vez de asumir una estructura no documentada.

Se genera consultando `information_schema.columns` y `pg_constraint` (para PK/FK — usar `pg_catalog.pg_constraint` en vez de `information_schema.table_constraints`, que en este servidor oculta foreign keys por permisos del rol de conexión) directamente contra cada entorno. Es una **foto fija** (snapshot), no se actualiza sola — si el esquema cambia (migraciones, tablas nuevas), regenerarla re-ejecutando esas queries.

### Cómo usar el snapshot en el análisis

Cualquier agente con acceso a Postgres (`developer`, `soporte`) debe usar el snapshot del repo del proyecto como **mapa de referencia antes de explorar en vivo**:

1. Antes de llamar `pg_describe_table` o `pg_list_tables` de forma exploratoria ("¿qué tablas hay?", "¿qué columnas tiene X?"), revisar primero `doc/IA/db-schema-*.md` del proyecto correspondiente. Evita gastar consultas contra la base para algo que ya está documentado, y da de entrada las relaciones (FK) entre tablas para armar queries certeras en un solo intento.
2. Usar `pg_query` (datos reales) solo para lo que el snapshot no puede resolver: valores actuales, conteos, validar un caso concreto, o cuando la consulta falla porque el snapshot quedó desactualizado (tabla/columna que ya no existe o es nueva) — en ese caso, avisar que conviene regenerar el snapshot en el repo del proyecto, en vez de seguir explorando a mano indefinidamente.
3. Si el proyecto no tiene snapshot (ver sección anterior), aplicar la misma regla que para el entorno: detenerse y preguntar antes de asumir estructura.

### Generar el snapshot de un proyecto

1. Confirmar el schema del proyecto por entorno en la tabla del proyecto en [`docs/readme/proyectos.md`](../readme/proyectos.md) (si no está, `pg_list_schemas` + preguntar, ver sección 4).
2. Ejecutar las queries de la sección anterior contra `table_schema = '<schema del proyecto>'`, para cada entorno relevante.
3. Guardar el resultado como `doc/IA/db-schema-<schema>-<entorno>.md` **en el repositorio del proyecto** (no en `ai-project`) — el sufijo de schema es necesario en el nombre en cuanto exista más de un schema para el mismo proyecto.

## 5. Conexión directa (fuera de Claude Code)

Para conectarse con `psql` o un cliente gráfico (DBeaver, TablePlus, pgAdmin), usar los valores de la entrada correspondiente en `mcp-postgres.config.json`:

```bash
psql -h <host> -p <port> -U <user> -d <database>
# pedirá el password de forma interactiva
```

O en una sola línea (queda en el historial de la shell, evitar en máquinas compartidas):

```bash
PGPASSWORD=<password> psql -h <host> -p <port> -U <user> -d <database>
```

Para un cliente gráfico, usar los mismos cinco valores (`host`, `port`, `user`, `password`, `database`) como parámetros de la conexión nueva, seleccionando el entorno (`dev`/`qa`/`prod`) que corresponda.

---

## 6. Regla de solo lectura — sin excepciones

Si la conexión configurada para un entorno tiene permisos de escritura además de lectura, **Claude nunca ejecuta cambios directamente en la base** (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, DDL, etc.), sin importar el entorno (`dev`, `qa` o `prod`).

Cuando la solución a un problema implica modificar datos, Claude debe:

1. Explicar la causa y la solución propuesta.
2. Entregar la query exacta que resuelve el problema.
3. Dejar que la persona consultante (desarrollador, soporte, o cualquier otro rol) la ejecute por sus propios medios (`psql`, cliente gráfico, etc. — ver sección 5).

Esta regla **no tiene excepción, ni siquiera si la persona insiste explícitamente** o confirma varias veces que quiere que Claude ejecute el cambio directamente. Claude debe rechazar la ejecución y reiterar que la query queda para que la ejecute la persona.

## 7. Quién puede consultarla

Acceso restringido a **2 roles**: `developer` y `soporte`. Son los únicos agentes cuyo `tools:` (`.claude/agents/*.md`) incluye las tools del servidor MCP `postgres` — `product-owner` y `tech-lead` no las tienen y no deben consultar datos reales (su fuente de verdad es Jira o Código/Tests, ver [`docs/readme/fuentes-de-verdad.md`](../readme/fuentes-de-verdad.md)).

## 8. Buenas prácticas

- Preferir `dev`/`qa` para exploración y diagnóstico; usar `prod` solo cuando sea estrictamente necesario.
- No pegar passwords reales en la conversación con Claude — las credenciales viven únicamente en `mcp-postgres.config.json`, local a cada máquina.
- Antes de proponer una query de escritura, confirmar explícitamente contra qué entorno aplica — el costo de preguntar es mínimo comparado con el de escribir en la base equivocada.
- No asumir `public` solo porque es el default de las tools — confirmarlo contra la tabla de schemas por proyecto (o con `pg_list_schemas`) antes de dar por buena una consulta sin resultados o con tablas "faltantes".
