---
description: Genera los Requirements (requirements.md) a partir de una idea, invocando al agente product-owner.
argument-hint: [idea o descripción de la funcionalidad]
---

# /create-spec

## Entrada

`$ARGUMENTS` — la idea o solicitud del usuario para la nueva funcionalidad.

## Proceso

1. Invocar el subagente `product-owner` (tool Task) pasando `$ARGUMENTS` como la Idea de entrada.
2. El agente produce Objetivo, Alcance, Requisitos Funcionales/No Funcionales, Casos de Uso y Criterios de Aceptación (ver `.claude/agents/product-owner.md`).
3. Guardar el resultado como `specs/<slug-funcionalidad>/requirements.md` (ver `specs/naming-conventions.md`).

## Salida

Nuevo `requirements.md` — un Specification listo para pasar a diseño técnico.

## Siguiente paso

Ejecutar `/create-jira` sobre el `requirements.md` generado.
