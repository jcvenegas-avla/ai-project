# Flujo de Trabajo

```text
Idea
    │
    ▼
Requirements
    │
    ▼
Epic (Design incluido, si es necesario)
    │
    ▼
Stories
    │
    ▼
Tasks
    │
    ▼
Subtasks
    │
    ▼
Implementation
    │
    ▼
Release (Documentation manual)
```

> No existe un agente coordinador (`orchestrator`): cada etapa se invoca manualmente, en este orden, mediante su comando (ver [`docs/readme/comandos-disponibles.md`](./comandos-disponibles.md)). La documentación se actualiza manualmente antes de `/release`, sin un agente dedicado.
