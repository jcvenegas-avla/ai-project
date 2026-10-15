# Estimación relativa con Fibonacci

Aplicar como segundo método junto con PERT, salvo que el usuario elija uno solo. Usar puntos 1, 2, 3, 5, 8, 13, 21. Tratar la siguiente escala como convención inicial del skill, no como estándar universal ni equivalencia temporal.

| Puntos | Referencia relativa inicial |
|---:|---|
| 1 | Cambio pequeño y conocido, con patrón existente y validación acotada |
| 2 | Cambio simple con algunas validaciones y dependencias conocidas |
| 3 | Cambio moderado que cruza componentes conocidos |
| 5 | Varias reglas o capas, con pruebas y dependencias relevantes |
| 8 | Cambio amplio con integración, concurrencia o incertidumbre significativa |
| 13 | Trabajo demasiado amplio o incierto: proponer división antes de comprometerlo |
| 21 | Épica o investigación insuficiente: descomponer y/o hacer spike |

## Procedimiento

1. Identificar unidad de puntuación: por defecto historia de extremo a extremo, incluyendo DEV, QA y definición de terminado. No sumar puntos de historia con puntos de subtareas ni volver a contar la misma historia en ambos perfiles.
2. Elegir historias de referencia comparables del mismo equipo, con evidencia. Si no existen, usar la escala inicial y marcar puntuación provisional propuesta por IA para validación del equipo. No afirmar consenso de Planning Poker si no ocurrió una sesión real.
3. Comparar volumen de trabajo, complejidad, riesgo e incertidumbre. Justificar el punto con evidencia del código y alcance. No calcular puntos a partir de horas PERT ni de líneas de código; mantener los métodos independientes para contrastarlos.
4. Crear tabla previa al cierre: ID/historia, evidencia, puntos, referencia comparada, justificación y confianza. Desglosar horas DEV y QA con PERT; los puntos integrales no equivalen a productividad individual.
5. Registrar historias no estimables o con bloqueo y qué investigación falta. Un 21 no sustituye conocimiento del alcance. Tras dividir una historia, reemplazar su puntuación por las hijas sin contar ambas.

## Conversión a plazo con datos reales

Sin velocidad histórica comparable, entregar puntos y declarar «Sin velocidad histórica no se puede convertir Fibonacci a días con fundamento». Mantener los días PERT disponibles identificando su método en Motivo. Nunca definir 1 punto = X horas/días ni inventar una velocidad para completar la tabla.

Con velocidad observada del mismo equipo y definición de terminado, usar solo puntos de historias terminadas por sprint. Registrar sprints, duración, capacidad, cambios de composición y representatividad de la muestra. No comparar puntos entre equipos. No usar velocidad DEV para inferir QA o IA.

Calcular un pronóstico de capacidad, no una fecha garantizada:
- Sprints equivalentes = puntos pendientes / velocidad media observada.
- Para compromisos al cierre de sprint, redondear hacia arriba el número de sprints.
- Plazo nominal = sprints completos × días hábiles por sprint.
- Mostrar escenarios con velocidades observadas baja/media/alta, explicando selección y variación, sin llamarlos percentiles. Considerar dependencias, capacidad futura y esperas antes de proponer fechas.

Ejemplo aritmético ficticio: 40 puntos pendientes, velocidad comparable de 20 puntos/sprint y sprint de 10 días hábiles → 40/20 = 2 sprints → 2×10 = 20 días hábiles nominales. No son 20 días-persona ni un dato de productividad aplicable a otro proyecto.

## IA y contraste con PERT

Conservar el alcance y criterios de aceptación. Pronosticar con velocidad IA solo si existe historial comparable que incluya revisión humana y QA; documentar modelo, herramientas y concurrencia. De otro modo, conservar el pronóstico por etapas del método IA y no convertir puntos humanos usando un factor de ahorro.

Contrastar PERT y Fibonacci calibrado: explicar diferencias de alcance, esperas, capacidad y supuestos. No promediar automáticamente resultados ni sumar plazos de métodos alternativos. Señalar método recomendado para planificación según la calidad de evidencia. Si solo hay puntos provisionales, no afirmar triangulación temporal independiente.

En las dos tablas finales separadas de siete columnas (Humano e IA), incluir puntos en Motivo de las tareas relacionadas. Mostrar la conversión válida y el contraste con PERT en el análisis previo, nunca como escenarios o totales globales adicionales. Sin historial, indicar que Fibonacci no es convertible a días. En la tabla final identificar el método principal elegido en Motivo y conservar exclusivamente un total global Humano y otro IA.
