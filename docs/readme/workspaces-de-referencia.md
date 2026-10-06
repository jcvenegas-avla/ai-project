# Workspaces de Referencia

Algunos proyectos abarcan varios repositorios a la vez (frontend, backend, etc.). En esos casos, el contexto no vive solo en este repositorio: se declara explícitamente en un archivo `.code-workspace` (VSCode) que agrupa las carpetas relevantes (ver tabla en [`docs/readme/proyectos.md`](./proyectos.md)). Cada entrada de `folders` que representa un repo real también trae una propiedad `repo` (URL de git, VSCode la ignora) — documenta de dónde clonar ese repo (`git clone <repo> workspace/<path>`).
