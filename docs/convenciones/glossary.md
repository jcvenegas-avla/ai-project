# Glossary

Diccionario de términos del dominio usados en este proyecto.

## Epic

Agrupador de alto nivel que representa una funcionalidad o iniciativa completa. Lo genera el `tech-lead` a partir de `requirements.md` (y `design.md`, si aplica). Formato: `EPIC-<Producto>` (ver `specs/naming-conventions.md`).

## Story (Historia de Usuario)

Unidad de valor de negocio independiente y priorizable por separado, con sus propios Criterios de Aceptación. Formato: `US-<Número>`.

## Task

Unidad de trabajo técnico derivada de una Story, implementable en menos de un día. Formato: `TASK-<Número>`.

## Subtask

Desglose técnico de una Task cuando esta requiere pasos independientes entre sí. Formato: `SUB-<Número>`.

## Specification (Spec)

Documento que define el alcance funcional y técnico de una funcionalidad antes de implementarla — el código nunca es la fuente de verdad, el Spec sí (ver [`docs/readme/principios.md`](../readme/principios.md)). Se compone de Requirements, Design, Epic/Stories/Tasks/Subtasks, Acceptance Criteria y Architectural Decisions (ADR).

## Design

Documento técnico (`design.md`) que produce el `tech-lead` a partir de los Requirements, solo cuando la funcionalidad lo amerita: arquitectura, componentes, modelo de datos, endpoints, diagramas, riesgos y decisiones.

## Acceptance Criteria (Criterios de Aceptación)

Condiciones verificables (Given/When/Then, escenarios negativos, edge cases) que determinan cuándo una Story se considera cumplida. Ninguna funcionalidad se implementa sin ellos (ver [`docs/readme/principios.md`](../readme/principios.md)).

## ADR (Architectural Decision Record)

Registro de una decisión de arquitectura relevante: contexto, decisión tomada, alternativas consideradas y consecuencias. Vive en `decisions.md`, o en `ADR-<Número>-<slug-decision>.md` si hay varias decisiones independientes, dentro de `specs/<slug-funcionalidad>/`.

## Release

Entrega a producción de una o más funcionalidades ya implementadas y con su Pull Request aprobado y mergeado. Se libera desde la rama `release/<correlativo>` (ver `docs/convenciones/branching-strategy.md`) solo cuando se cumple la Definition of Done completa (ver [`docs/readme/definition-of-done.md`](../readme/definition-of-done.md)).

## Sprint

Ventana de tiempo fija en la que el equipo trabaja un subconjunto priorizado del Backlog.
