# Comandos Disponibles

| Comando              | Descripción                                        |
| -------------------- | -------------------------------------------------- |
| `/add-project`       | Agrega un nuevo proyecto al framework (Workspace, Jira, Jira Soporte, Schemas Postgres) |
| `/setup-connections` | Conecta y verifica Jira (guiado) |
| `/create-spec`   | Genera los Requirements              |
| `/create-jira`   | Genera Design (si es necesario) y Epic, Stories, Tasks y Subtasks |
| `/implement`     | Implementa una Task                  |
| `/release`       | Genera la Release (documentación manual previa) |
| `/soporte`       | Diagnostica una incidencia y propone un plan + borrador de ticket SPDI |
| `/pase`          | Gestiona un pase de producción con ticket CDA (ramas, versiones, PRs, descripción) |
| `/reversa`       | Reversa los movimientos que pide un ticket SPDI (codDocument inverso, envío con JMeter tras confirmación) — hoy solo Kamui México |
| `/db`            | Consulta una base de datos Postgres (dev/qa/prod), preguntando el entorno si no se especifica |
