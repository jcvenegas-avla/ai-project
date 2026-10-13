# Flujo de los Agentes

```mermaid
flowchart TD

A[Idea] --> C[Product Owner]
C --> D[Requirements]

D --> G[Tech Lead]
G --> F["Design (si es necesario)"]
G --> H[Generar Jira]

H --> I[Epic]
H --> J[Stories]
H --> K[Tasks]
H --> L[Subtasks]

K --> M[Developer]

M --> Q["Documentación manual + Release"]
```

## Flujo del Developer

```mermaid
flowchart TD

A[Jira Task]

A --> B[Developer]

B --> C[Implementación]

C --> D[Tests]

D --> E[Pull Request]

E --> H[Merge]
```

## Flujo de Soporte

```mermaid
flowchart TD

A[Descripción de la incidencia] --> B[Soporte]
B --> C{Existe ticket igual en SPDI?}
C -- Sí --> D[Mostrar ticket existente]
C -- No / Relacionado --> E[Sugerir relacionados + investigar Jira/Workspace]
E --> F[Plan de solución + borrador ticket SPDI]
F --> G{Usuario confirma crear?}
G -- Sí --> H[Crear ticket en Jira SPDI]
G -- No --> I[Guardar borrador local]
```

> Flujo independiente y paralelo al pipeline principal (Idea→Release): se invoca vía `/soporte` en cualquier momento, sin depender de las etapas de Requirements/Design/Implementation.

## Agente de Pases de Producción

Flujo independiente (vía `/pase`), documentado con sus diagramas en [`docs/readme/agente-de-pases-de-produccion.md`](./agente-de-pases-de-produccion.md).
