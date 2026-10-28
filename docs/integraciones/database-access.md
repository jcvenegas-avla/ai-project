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

Editar [`mcp-postgres.config.json`](../../mcp-postgres.config.json) en la raíz del proyecto. Hay una entrada por proyecto y entorno:

```json
{
  "connections": [
    { "label": "siniestro-dev",  "host": "", "port": "5432", "user": "", "password": "", "database": "", "enabled": true, "readOnly": true },
    { "label": "siniestro-prod", "host": "", "port": "5432", "user": "", "password": "", "database": "", "enabled": true, "readOnly": true }
  ]
}
```

Completar por entorno:

| Campo | Significado |
| --- | --- |
| `label` | `<proyecto>-<entorno>` (p. ej. `kamui-prod`). Tiene que coincidir con la fila `Conexiones Postgres` del proyecto en `proyectos.md`, que es lo que usan `/db` y los agentes para elegir la conexión. |
| `host` | Host o IP del servidor Postgres de ese entorno. |
| `port` | Puerto (`5432` por defecto en Postgres). |
| `user` | Usuario de conexión. |
| `password` | Password del usuario. |
| `database` | Nombre de la base a la que conectar. |
| `enabled` | `true` para que el entorno quede disponible; `false` para desactivarlo sin borrar la entrada. |
| `readOnly` | `true` por defecto: el servidor ejecuta cada consulta dentro de `BEGIN TRANSACTION READ ONLY`. No ponerlo en `false`. |

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


# Acceso a Bases de Datos — Oracle vía SQLcl MCP

Guía para configurar y utilizar conexiones Oracle desde Claude Code mediante el servidor MCP incorporado en Oracle SQLcl.

Esta integración permite que Claude Code consulte bases de datos Oracle utilizando conexiones previamente configuradas y almacenadas localmente por SQLcl.

> ****Importante:**** esta integración está orientada principalmente a consultas, análisis y revisión de información. El acceso a Producción debe realizarse únicamente cuando sea solicitado explícitamente.

---

## 1. Arquitectura

Claude Code inicia Node.js con el código incluido en `.mcp.json`. Este código selecciona el ejecutable de SQLcl según el sistema operativo, configura `TNS_ADMIN` e inicia SQLcl con `-mcp`.

| Componente | Función |
|---|---|
| `.mcp.json` | Contiene toda la lógica de arranque multiplataforma |
| Node.js | Selecciona `sql.exe` en Windows o `sql` en Linux/macOS |
| Oracle SQLcl | Cliente Oracle y servidor MCP |
| `mcp/network/admin/tnsnames.ora` | Define alias, hosts, puertos y Service Name |
| SQLcl Connection Store | Mantiene las conexiones y credenciales locales |
| Oracle Database | Base de datos DEV, QA o PROD |

Las credenciales Oracle no se guardan en el repositorio, `.mcp.json` ni `tnsnames.ora`. Cada desarrollador registra sus propias conexiones localmente.

---

## 2. Estructura del proyecto

| Ruta desde la raíz del repositorio | Contenido |
|---|---|
| `.mcp.json` | Configuración MCP y código de arranque integrado |
| `docs/database_access.md` | Esta guía |
| `mcp/sqlcl/bin/sql` | Lanzador para Linux y macOS |
| `mcp/sqlcl/bin/sql.exe` | Lanzador para Windows |
| `mcp/sqlcl/` | Distribución completa de SQLcl, incluidas sus bibliotecas |
| `mcp/network/admin/tnsnames.ora` | Configuración Oracle Net |

No basta con copiar los lanzadores: conserva la distribución completa de SQLcl y verifica que incluya el ejecutable necesario para cada sistema. No se requiere un archivo JavaScript adicional.

---

## 3. Ubicación de `tnsnames.ora`

El archivo de configuración Oracle Net debe mantenerse en:

```text

<PROJECT_ROOT>/mcp/network/admin/tnsnames.ora

```

Ruta relativa al proyecto:

```text

mcp/network/admin/tnsnames.ora

```

La carpeta `network/admin` se mantiene separada de `sqlcl/bin`, ya que `bin` contiene únicamente los ejecutables y componentes propios de SQLcl.

Oracle localizará este archivo mediante la variable de entorno:

```text

TNS_ADMIN

```

`TNS_ADMIN` debe apuntar al ****directorio que contiene `tnsnames.ora`****, no al archivo directamente.

Correcto:

```text

<PROJECT_ROOT>/mcp/network/admin

```

Incorrecto:

```text

<PROJECT_ROOT>/mcp/network/admin/tnsnames.ora

```

---

## 4. Requisitos

- Node.js disponible como `node` en el PATH del proceso que inicia Claude Code.
- Oracle SQLcl con soporte para `-mcp`.
- Java compatible con la versión de SQLcl incluida en el repositorio. Consulta los requisitos de esa versión; esta actualización no valida una versión concreta.
- Claude Code con soporte MCP.
- Acceso de red a Oracle y VPN corporativa cuando corresponda.

Validar desde la raíz del repositorio:

```bash
node --version
java -version
```

En Linux y macOS:

```bash
./mcp/sqlcl/bin/sql -v
```

En Windows PowerShell:

```powershell
.\mcp\sqlcl\bin\sql.exe -v
```

---

## 5. Ambientes Oracle disponibles

Amaru MX dispone de tres ambientes Oracle:

| Ambiente | Host | Puerto | Service Name | Conexión SQLcl |
|---|---|---:|---|---|
| Desarrollo | `amaru_mx_dev_new-db.avla.com` | `1521` | `ORCL` | `AMARU_MX_DEV` |
| QA | `amaru_mx_qa_new-db.avla.com` | `1521` | `ORCL` | `AMARU_MX_QA` |
| Producción | `amaru-prod-db-mx.avla.com` | `1521` | `ORCL` | `AMARU_MX_PROD` |

Cada ambiente utiliza un ****usuario y contraseña distintos****.

```text

AMARU_MX_DEV
    └── usuario/password DEV
AMARU_MX_QA
    └── usuario/password QA
AMARU_MX_PROD
    └── usuario/password PROD

```

Estas credenciales no deben formar parte del repositorio.

---

## 6. Configuración de `tnsnames.ora`

Crear:

```text

mcp/network/admin/tnsnames.ora

```

con el siguiente contenido:

```text

AMARU_MX_DEV =
  (DESCRIPTION =
    (ADDRESS =
      (PROTOCOL = TCP)
      (HOST = amaru_mx_dev_new-db.avla.com)
      (PORT = 1521)
    )
    (CONNECT_DATA =
      (SERVICE_NAME = ORCL)
    )
  )
AMARU_MX_QA =
  (DESCRIPTION =
    (ADDRESS =
      (PROTOCOL = TCP)
      (HOST = amaru_mx_qa_new-db.avla.com)
      (PORT = 1521)
    )
    (CONNECT_DATA =
      (SERVICE_NAME = ORCL)
    )
  )
AMARU_MX_PROD =
  (DESCRIPTION =
    (ADDRESS =
      (PROTOCOL = TCP)
      (HOST = amaru-prod-db-mx.avla.com)
      (PORT = 1521)
    )
    (CONNECT_DATA =
      (SERVICE_NAME = ORCL)
    )
  )

```

Este archivo contiene únicamente información de conectividad:

- alias;

- host;

- puerto;

- Service Name.

No contiene:

- usuarios;

- contraseñas;

- tokens;

- credenciales.

---

## 7. Configuración multiplataforma

Se utiliza un único `.mcp.json` para Linux, macOS y Windows. No se configura `SQLCL_BIN` ni se necesitan variables persistentes por desarrollador para el arranque MCP.

El código integrado detecta Windows mediante `process.platform === 'win32'`, selecciona el ejecutable y calcula rutas absolutas a partir del directorio actual.

**Claude Code debe iniciarse desde la raíz del repositorio.** Las rutas se calculan desde `process.cwd()`, no desde la ubicación del archivo `.mcp.json`.

`TNS_ADMIN` se establece automáticamente para el proceso SQLcl hijo y prevalece sobre cualquier valor heredado. No modifica las variables permanentes del equipo.

---

## 8. Preparación en Linux y macOS

Desde la raíz del proyecto:

```bash
node --version
java -version
chmod +x ./mcp/sqlcl/bin/sql
./mcp/sqlcl/bin/sql -v
```

Para conservar en Git el permiso de ejecución:

```bash
git update-index --chmod=+x mcp/sqlcl/bin/sql
```

Para crear o probar conexiones manualmente, configura `TNS_ADMIN` únicamente en la sesión actual:

```bash
export TNS_ADMIN="$PWD/mcp/network/admin"
./mcp/sqlcl/bin/sql /nolog
```

Este `export` es para el uso manual de SQLcl. El MCP configura su propia variable automáticamente.

---

## 9. Preparación en Windows

Desde PowerShell, ubicado en la raíz del proyecto:

```powershell
node --version
java -version
.\mcp\sqlcl\bin\sql.exe -v
```

Para crear o probar conexiones manualmente:

```powershell
$env:TNS_ADMIN = Join-Path (Get-Location).Path "mcp\network\admin"
& .\mcp\sqlcl\bin\sql.exe /nolog
```

La variable se configura solo para la sesión actual. No es necesario crear variables persistentes de usuario para iniciar el MCP.

---

## 10. Configuración de `.mcp.json`

En la raíz del repositorio:

```json
{
  "mcpServers": {
    "oracle-sqlcl": {
      "type": "stdio",
      "command": "node",
      "args": [
        "-e",
        "const {spawn}=require('node:child_process');const path=require('node:path');const root=process.cwd();const exe=process.platform==='win32'?'sql.exe':'sql';const child=spawn(path.join(root,'mcp','sqlcl','bin',exe),['-mcp'],{stdio:'inherit',env:{...process.env,TNS_ADMIN:path.join(root,'mcp','network','admin')}});child.on('error',e=>{console.error(e.message);process.exit(1)});child.on('exit',code=>process.exit(code??1));"
      ],
      "env": {}
    }
  }
}
```

Si ya hay otros servidores MCP, incorpora únicamente la entrada `oracle-sqlcl` dentro de `mcpServers` y conserva las demás.

El código integrado:

1. Obtiene la raíz desde el directorio actual.
2. Selecciona `sql.exe` en Windows o `sql` en Linux/macOS.
3. Configura `TNS_ADMIN` con la ruta absoluta de `mcp/network/admin`.
4. Inicia SQLcl en modo MCP y hereda entrada, salida y errores estándar.
5. Informa errores de arranque por stderr y propaga el código de salida.

No agregues mensajes de diagnóstico a stdout: ese canal se utiliza para el protocolo MCP.

---

## 11. Validar `tnsnames.ora`

Desde la raíz del repositorio, en Linux/macOS:

```bash
ls -l ./mcp/network/admin/tnsnames.ora
```

En Windows PowerShell:

```powershell
Test-Path .\mcp\network\admin\tnsnames.ora
```

En Windows debe retornar `True`. Para utilizar SQLcl manualmente, configura también `TNS_ADMIN` como se indica en las secciones 8 y 9.

---

## 12. Credenciales Oracle

Las credenciales de Oracle son distintas para cada ambiente:

| Ambiente | Conexión | Credencial |
|---|---|---|
| Desarrollo | `AMARU_MX_DEV` | Usuario/password DEV |
| QA | `AMARU_MX_QA` | Usuario/password QA |
| Producción | `AMARU_MX_PROD` | Usuario/password PROD |

Las credenciales ****no deben almacenarse en****:

```text

.mcp.json
tnsnames.ora
README.md
database_access.md
CLAUDE.md
application.yml
application.properties
.env versionado
archivos JSON/YAML versionados

```

SQLcl administra localmente las conexiones mediante su Connection Store.

El Connection Store se encuentra bajo el home del usuario:

### Linux y macOS

```text

~/.dbtools

```

Ejemplo:

```text

/home/usuario/.dbtools

```

### Windows

Conceptualmente:

```text

%USERPROFILE%\.dbtools

```

Cada desarrollador registra sus propias credenciales.

El contenido de `.dbtools` ****no debe copiarse ni versionarse dentro del proyecto****.

---

## 13. Crear las conexiones SQLcl

Las conexiones deben registrarse una sola vez en cada computador.

Primero iniciar SQLcl sin conexión.

### Linux y macOS

Desde la raíz del proyecto:

```bash

./mcp/sqlcl/bin/sql /nolog

```

### Windows

```powershell

& .\mcp\sqlcl\bin\sql.exe /nolog

```

Se mostrará:

```text

SQL>

```

---

### 13.1 Desarrollo

Registrar:

```sql

conn -save AMARU_MX_DEV -savepwd <usuario_dev>/<password_dev>@AMARU_MX_DEV

```

Ejemplo conceptual:

```text

AMARU_MX_DEV
    │
    ├── TNS: AMARU_MX_DEV
    ├── usuario: credencial DEV
    └── password: credencial DEV

```

No utilizar los placeholders literalmente.

---

### 13.2 QA

Registrar:

```sql

conn -save AMARU_MX_QA -savepwd <usuario_qa>/<password_qa>@AMARU_MX_QA

```

---

### 13.3 Producción

Registrar:

```sql

conn -save AMARU_MX_PROD -savepwd <usuario_prod>/<password_prod>@AMARU_MX_PROD

```

La opción:

```text

-savepwd

```

es necesaria para que la conexión guardada pueda ser utilizada posteriormente por el servidor MCP sin solicitar interactivamente la contraseña.

---

## 14. Listar conexiones guardadas

Desde SQLcl:

```sql

connmgr list

```

El resultado debería incluir:

```text

AMARU_MX_DEV
AMARU_MX_QA
AMARU_MX_PROD

```

También puede revisarse una conexión específica:

```sql

connmgr show AMARU_MX_DEV

```

---

## 15. Probar las conexiones

### Desarrollo

```sql

connect -name AMARU_MX_DEV

```

### QA

```sql

connect -name AMARU_MX_QA

```

### Producción

```sql

connect -name AMARU_MX_PROD

```

Para validar la conexión actual:

```sql

SELECT
    SYS_CONTEXT('USERENV', 'DB_NAME') AS DB_NAME,
    SYS_CONTEXT('USERENV', 'SERVICE_NAME') AS SERVICE_NAME,
    SYS_CONTEXT('USERENV', 'SESSION_USER') AS SESSION_USER,
    SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') AS CURRENT_SCHEMA
FROM DUAL;

```

Al finalizar:

```sql

disconnect

```

---

## 16. Iniciar Claude Code

Desde la raíz del repositorio, en Linux, macOS o Windows:

```bash
claude
```

Node.js y Java deben estar disponibles en el entorno de ese proceso. El arranque MCP no requiere exportar `SQLCL_BIN` ni `TNS_ADMIN`.

Si utilizas una extensión o un cliente que inicia desde otro directorio, verifica su directorio de trabajo antes de usar esta configuración.

---

## 17. Validar el servidor MCP

Desde una terminal:

```bash

claude mcp list

```

Debe aparecer el servidor:

```text

oracle-sqlcl

```

También puede consultarse:

```bash

claude mcp get oracle-sqlcl

```

Dentro de Claude Code puede utilizarse:

```text

/mcp

```

para verificar el estado de los servidores MCP.

---

## 18. Funcionamiento del MCP Oracle

Una vez iniciado Claude Code:

```text

Usuario
    │
    │ "consulta en QA..."
    ▼
Claude Code
    │
    │ selecciona oracle-sqlcl
    ▼
SQLcl MCP
    │
    │ selecciona conexión
    ▼
AMARU_MX_QA
    │
    │ credencial guardada localmente
    ▼
amaru_mx_qa_new-db.avla.com:1521/ORCL

```

Claude no necesita recibir directamente el password.

SQLcl utiliza las conexiones previamente almacenadas en el Connection Store del desarrollador.

---

## 19. Tools principales disponibles

SQLcl MCP expone herramientas para operar sobre las conexiones Oracle.

Entre las principales:

| Tool | Función |
|---|---|
| `list-connections` | Lista las conexiones Oracle guardadas |
| `connect` | Se conecta utilizando una conexión guardada |
| `disconnect` | Cierra la conexión actual |
| `run-sql` | Ejecuta SQL o PL/SQL |
| `run-sqlcl` | Ejecuta comandos propios de SQLcl |
| `schema-information` | Obtiene información del schema conectado |

El cliente MCP puede mostrar estos nombres con prefijos adicionales.

---

## 20. Convención de selección de ambientes

Cuando se solicite consultar Oracle desde Claude Code se utilizará la siguiente convención:

| El usuario indica | Conexión |
|---|---|
| `desarrollo` | `AMARU_MX_DEV` |
| `develop` | `AMARU_MX_DEV` |
| `dev` | `AMARU_MX_DEV` |
| `qa` | `AMARU_MX_QA` |
| `producción` | `AMARU_MX_PROD` |
| `production` | `AMARU_MX_PROD` |
| `prod` | `AMARU_MX_PROD` |

Ejemplo:

```text

Consulta en desarrollo las pólizas emitidas hoy.

```

Debe utilizar:

```text

AMARU_MX_DEV

```

Ejemplo:

```text

Consulta en QA la solicitud 12345.

```

Debe utilizar:

```text

AMARU_MX_QA

```

Ejemplo:

```text

Consulta en producción la póliza 12345.

```

Debe utilizar:

```text

AMARU_MX_PROD

```

---

## 21. Regla obligatoria para Producción

**Nunca se debe asumir Producción.**

La conexión:

```text

AMARU_MX_PROD

```

solo debe utilizarse cuando el usuario indique explícitamente:

```text

producción
prod
production
AMARU_MX_PROD

```

Una solicitud como:

```text

consulta la póliza 12345

```

no autoriza por sí sola el uso de Producción.

Si el ambiente no puede determinarse inequívocamente por el contexto, se debe solicitar:

```text

DEV
QA
PROD

```

antes de realizar la operación.

---

## 22. Operaciones de escritura

El acceso Oracle vía MCP está pensado principalmente para:

- consultas;

- análisis;

- revisión de información;

- revisión de estructuras;

- troubleshooting;

- generación de SQL.

Claude no debe ejecutar directamente operaciones que modifiquen información salvo que exista una instrucción explícita y las políticas del proyecto lo permitan.

Esto incluye:

```sql

INSERT
UPDATE
DELETE
MERGE
CREATE
ALTER
DROP
TRUNCATE
GRANT
REVOKE

```

Para estos casos, la práctica recomendada es:

```text

Claude genera SQL
       │
       ▼
Desarrollador revisa
       │
       ▼
Desarrollador ejecuta

```

Especialmente en Producción.

---

## 23. Seguridad de Producción

Las instrucciones entregadas a Claude son una protección operacional, pero no reemplazan los controles propios de Oracle.

El usuario Oracle utilizado para Producción debería poseer únicamente los privilegios necesarios.

Cuando el uso del MCP sea exclusivamente de consulta, se recomienda utilizar un usuario de Producción con permisos de solo lectura.

Esto proporciona una barrera adicional ante una operación SQL incorrecta.

---

## 24. No compartir credenciales con Claude

No enviar passwords reales en conversaciones con Claude.

Evitar solicitudes como:

```text

conéctate con usuario X y password Y

```

Las credenciales deben configurarse previamente mediante SQLcl.

Una vez almacenadas:

```text

AMARU_MX_DEV
AMARU_MX_QA
AMARU_MX_PROD

```

Claude solamente necesita conocer el nombre de la conexión.

---

## 25. Resumen de almacenamiento

| Ubicación | Contenido |
|---|---|
| Repositorio: `.mcp.json` | Arranque multiplataforma integrado |
| Repositorio: `mcp/sqlcl/` | Distribución SQLcl |
| Repositorio: `mcp/network/admin/tnsnames.ora` | Alias y destinos Oracle |
| Repositorio: `docs/database_access.md` | Documentación |
| Perfil local del desarrollador | Connection Store y credenciales SQLcl |

No copies el Connection Store al repositorio.

---

## 26. Resumen de conexión por ambiente

| Conexión local | Alias TNS | Destino |
|---|---|---|
| `AMARU_MX_DEV` | `AMARU_MX_DEV` | `amaru_mx_dev_new-db.avla.com:1521/ORCL` |
| `AMARU_MX_QA` | `AMARU_MX_QA` | `avladb-mexico-qa-new.avla.com:1521/ORCL` |
| `AMARU_MX_PROD` | `AMARU_MX_PROD` | `amaru-prod-db-mx.avla.com:1521/ORCL` |

Los destinos y credenciales por ambiente provienen de la guía original. No se ha verificado la conectividad con esos servidores en esta actualización.

---

## 27. Instalación rápida

1. Ubícate en la raíz del repositorio.
2. Valida `node --version`, `java -version` y SQLcl como indican las secciones 4, 8 y 9.
3. Comprueba `mcp/network/admin/tnsnames.ora`.
4. Incorpora el bloque de la sección 10 en `.mcp.json`.
5. Inicia SQLcl manualmente con `TNS_ADMIN` para registrar tus conexiones según la sección 13.
6. Verifica las conexiones con `connmgr list`.
7. Inicia `claude` desde la raíz del repositorio y revisa `/mcp`.

Registra Producción únicamente si corresponde a tus accesos y necesidades autorizadas.

---

## 28. Checklist de instalación

- [ ] Node.js y Java están disponibles.
- [ ] La versión de Java es compatible con SQLcl.
- [ ] SQLcl tiene soporte MCP y ejecuta correctamente.
- [ ] Existe el ejecutable correspondiente al sistema en `mcp/sqlcl/bin`.
- [ ] En Linux/macOS, `sql` tiene permiso de ejecución.
- [ ] Existe `mcp/network/admin/tnsnames.ora`.
- [ ] `.mcp.json` contiene el arranque integrado de `oracle-sqlcl`.
- [ ] Claude Code se inicia desde la raíz del repositorio.
- [ ] Las conexiones requeridas están guardadas localmente con su credencial.
- [ ] `claude mcp list` reconoce el servidor.
- [ ] No hay credenciales Oracle versionadas en Git.
- [ ] Producción solo se utiliza cuando se solicita explícitamente.

---

## 29. Troubleshooting

### No encuentra `node`

Valida `node --version` en el mismo entorno que inicia Claude Code. Si instalaste Node.js después de abrir el cliente, reinícialo para que reciba el PATH actualizado.

### No encuentra SQLcl o aparece `ENOENT`

Comprueba que el directorio actual sea la raíz del repositorio y que exista `mcp/sqlcl/bin/sql` o `mcp/sqlcl/bin/sql.exe`, según el sistema. No uses la ruta antigua `script/mcp-oracle`.

### Permiso denegado en Linux/macOS

```bash
chmod +x ./mcp/sqlcl/bin/sql
```

### SQLcl falla por Java

Valida `java -version` y los requisitos de la versión de SQLcl incluida. Prueba el lanzador directamente con `-v`.

### No encuentra un alias TNS

Comprueba el alias en `mcp/network/admin/tnsnames.ora`. El MCP fija `TNS_ADMIN` automáticamente; para una sesión manual debes establecerlo antes de abrir SQLcl, según las secciones 8 y 9.

### La conexión aparece pero MCP no puede utilizarla

Comprueba que se registró con `-savepwd`, que el proceso utiliza el mismo usuario del sistema que creó las conexiones y que hay acceso de red o VPN al ambiente.

### Cambiaste `.mcp.json` y no se aplica

Reinicia la sesión de Claude Code y revisa `claude mcp list`, `claude mcp get oracle-sqlcl` o `/mcp`.

### El servidor inicia y se desconecta

Revisa stderr del servidor y prueba el lanzador SQLcl directamente. No imprimas mensajes en stdout desde el código de arranque.

---

## 30. Regla final

Toda la lógica de arranque se mantiene dentro de `.mcp.json`: Node.js detecta el sistema, inicia el ejecutable situado en `mcp/sqlcl/bin` y establece `TNS_ADMIN` para SQLcl. No se utilizan scripts adicionales ni `SQLCL_BIN`.

`tnsnames.ora` define los destinos y el Connection Store local mantiene las credenciales. Oracle determina los permisos efectivos del usuario.

Esta actualización valida la estructura JSON y las rutas de la documentación. No constituye una prueba real de conexión a Oracle ni una ejecución de SQLcl en los tres sistemas.

---
