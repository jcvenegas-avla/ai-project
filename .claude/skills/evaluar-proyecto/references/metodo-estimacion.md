# Método de estimación

## Horas por tarea y perfil

Definir O ≤ M ≤ P, en horas, donde O es escenario favorable plausible, M el más probable bajo supuestos declarados y P el adverso plausible. Justificar cada terna: actividades, número de componentes afectados, reglas, familiaridad, entorno, complejidad y evidencia. No usar tablas universales de horas por endpoint ni QA como porcentaje automático de DEV.

Usar como resumen ponderado E = (O + 4M + P) / 6. Etiquetar E como estimación de planificación, no medición. Sumar E por perfil y escenario. Presentar también suma O/M/P como escenarios de esfuerzo: no atribuirles percentiles, ni asumir independencia estadística entre tareas. Un riesgo común de integración puede afectar varias tareas simultáneamente.

Asignar preparación compartida una vez. Incluir retrabajo explícito si hay evidencia de riesgo; no incluirlo simultáneamente en tareas y en una contingencia general. Registrar riesgos no acotables como bloqueos y estimar un spike de investigación antes del compromiso.

## Calendario humano

Capacidad del perfil p = cantidad de personas × horas efectivas/día × fracción de dedicación. Si las horas efectivas ya incorporan dedicación, no aplicarla de nuevo.

E_p / capacidad_p es una cota de días de esfuerzo de ese perfil; NO es por sí sola el plazo del proyecto. Construir cronograma por tareas y dependencias, permitiendo QA sobre entregas parciales y limitando trabajo concurrente a recursos disponibles. Identificar ruta crítica, esperas externas y calendario laboral. Si no se puede programar, dar cota inferior `max(E_DEV/C_DEV, E_QA/C_QA)` y aproximación secuencial explícita, sin llamarlas fecha comprometida.

## Escenario IA

Descomponer por tarea: lectura/contexto, diseño, edición/generación, ejecución de build/tests, inspección de resultados, ciclos de corrección e integración. Estimar tiempo transcurrido activo de la IA para esas etapas, con O/M/P. Separar humano residual: aclaraciones, revisión DEV, QA exploratorio, aceptación de negocio, credenciales y aprobaciones necesarias.

Registrar número de sesiones/agentes y restricciones de concurrencia. Por defecto usar una sesión IA; no suponer escalado lineal. Reportar horas-agente como consumo de esfuerzo, y duración según dependencias y concurrencia. Sumar etapas secuenciales y contar las solapadas una sola vez en el calendario. Añadir esperas explícitas por CI, acceso, servicios y revisión.

Si faltan mediciones, usar hipótesis por tarea y confianza baja; no inventar benchmarks. Proponer medir 2–3 tareas representativas autorizadas, registrando commit, modelo, herramientas, tiempos activos, esperas, iteraciones, intervención humana y tests de aceptación. No extrapolar una tarea trivial a integraciones desconocidas.

Comparar plazos y esfuerzo humano por separado. Solo calcular ahorro de calendario si ambos escenarios tienen capacidad y calendario comparables:
`ahorro = (plazo_humano - plazo_IA) / plazo_humano × 100`.
Si no son comparables, no calcularlo. IA puede reducir esfuerzo humano sin reducir esperas externas.

## Confianza y presentación

- Alta: alcance delimitado, flujo inspeccionado y validado, histórico comparable y dependencias conocidas.
- Media: código inspeccionado pero validación o histórico incompletos.
- Baja: requisitos ambiguos, acceso parcial, integraciones/ambiente sin validar o duración IA sin medición.

Aplicar confianza por tarea y a la conclusión global; son etiquetas cualitativas, no probabilidades. No prometer exactitud ni P80/P90 sin modelo calibrado. Usar horas para tareas pequeñas y medias jornadas/días para totales inciertos.

Ejemplo exclusivamente aritmético, no referencia de productividad: DEV O=8, M=12, P=20 → E=(8+48+20)/6=12,67 h. QA O=3, M=5, P=9 → E=5,33 h. Con 6 h/día, las cargas equivalen a 2,11 y 0,89 días; si QA depende de terminar DEV y no hay solapamiento ni esperas, plazo≈3 días hábiles. No trasladar estos valores a proyectos reales.
