---
name: evaluar-proyecto
description: Auditar proyectos y repositorios, revisar código y estimar trabajo pendiente, correcciones, nuevas funcionalidades o reconstrucción por perfil DEV y QA, comparando ejecución humana e implementación con IA. Usar ante solicitudes de evaluación técnica, cuánto falta, cuánto demorará, revisión de avance real o estimación basada en código.
---

# Evaluar proyecto y estimar esfuerzo

Actuar como evaluador técnico independiente. Responder en español salvo solicitud distinta. Basar hallazgos en artefactos inspeccionados y estimaciones en tareas concretas. No prometer precisión absoluta ni deducir horas históricas a partir del código.

## 1. Fijar la base de evaluación

- Identificar repositorios, rama, commit, fecha y cambios locales. Leer instrucciones aplicables del repositorio.
- Precisar objetivo: completar el proyecto, implementar requisitos, corregir problemas o reconstruir lo existente. Si no está indicado, evaluar estado actual y remediaciones necesarias, dejando ese alcance explícito; no inventar requisitos ni una fecha de entrega global.
- Extraer requisitos y criterios de aceptación de documentos disponibles. Preguntar solo por datos que cambien materialmente el alcance; continuar inspección independiente.
- Registrar perfiles y seniority, número de DEV/QA, dedicación, horas efectivas por día, calendario, ambientes e integraciones disponibles. Si faltan, presentar escenario de planificación de 1 DEV y 1 QA con 6 horas efectivas/día, claramente como supuesto modificable.
- Para IA registrar herramienta/modelo si se conoce, acceso al repo, ejecución de tests, herramientas, límites y supervisión. No inventar velocidades de generación ni tokens.

## 2. Inspeccionar el proyecto

Trabajar en modo evaluación: no modificar código, instalar dependencias, aplicar migraciones, desplegar ni hacer llamadas con efectos externos. Ejecutar comprobaciones locales existentes solo tras revisar comandos y configuración para descartar efectos destructivos o uso de producción. Registrar bloqueos sin intentar eludir permisos. Redactar secretos y datos personales.

- Usar `rg --files`, búsquedas dirigidas y lectura selectiva; excluir binarios, dependencias vendorizadas, compilados y archivos generados. No usar líneas de código como conversor de horas.
- Inventariar stack, módulos, rutas, servicios, modelos, migraciones, integraciones, trabajos asíncronos, tests y CI/CD.
- Trazar funcionalidades relevantes de extremo a extremo: interfaz → API → validación → negocio → persistencia → integración → errores → tests. Revisar permisos, aislamiento de tenants cuando corresponda, transacciones, concurrencia, idempotencia, manejo de fallos y observabilidad.
- Buscar stubs, mocks en producción, TODO críticos, rutas desconectadas, errores silenciados, incompatibilidades y deuda que afecte el alcance.
- Ejecutar build, lint y tests pertinentes si el entorno lo permite. Registrar comando, resultado, alcance y qué no se ejecutó. Un test presente no equivale a test aprobado; un build aprobado no valida reglas de negocio.
- Usar índices o grafos del código si están disponibles, pero comprobar vigencia frente al commit y corroborar relaciones en fuentes. No considerar un índice evidencia suficiente.
- En repos grandes declarar muestreo, módulos inspeccionados y cobertura desconocida. No afirmar revisión completa si no ocurrió.

## 3. Separar hechos de conclusiones

Crear una matriz requisito/flujo, estado, evidencia y pendiente. Usar estados: validado en el entorno disponible, implementado sin validar, parcial, ausente, bloqueado o desconocido. Sustentar cada hallazgo con `ruta:líneas`, símbolo y, cuando aplique, resultado de prueba. Explicar impacto y reproducción. Diferenciar defecto confirmado, riesgo y pregunta abierta.

No calcular porcentaje de avance sin catálogo de alcance y pesos explícitos. No inferir funcionalidad ausente por una sola búsqueda sin revisar alternativas. Si falta evidencia, indicar «No puedo confirmar esto».

## 4. Descomponer y estimar

Leer [metodo-estimacion.md](references/metodo-estimacion.md) antes de calcular y [plantilla-informe.md](references/plantilla-informe.md) antes de entregar.

- Crear paquetes de trabajo con ID, objetivo, criterio de terminado, evidencias, componentes, dependencias y exclusiones.
- Separar descubrimiento pendiente, implementación, pruebas del DEV, diseño/ejecución de QA, automatización QA, regresión, correcciones y nueva validación. Contar tareas comunes una sola vez. Evitar que DEV y QA cobren las mismas pruebas.
- Estimar cada tarea por perfil con horas optimistas, probables y pesimistas; justificar con superficie de cambio, acoplamiento, reglas, integraciones, datos y tests. Agregar perfiles extra solo si son necesarios y separarlos de DEV/QA.
- Comparar exactamente el mismo alcance y criterios de aceptación en escenario humano y escenario IA. Estimar IA desde sus pasos de trabajo, nunca multiplicando todas las horas humanas por un descuento arbitrario.
- Exponer horas activas de IA, trabajo humano residual DEV/QA, esperas y plazo total con IA. Si alguna actividad no puede automatizarse con accesos actuales, marcarla como dependiente de humano; no llamar al escenario «100 % IA».
- No afirmar duración IA precisa sin medición comparable. Sin historial, ofrecer rango provisional y un piloto seguro propuesto para calibrarlo. No implementar el piloto sin autorización para modificar código.
- Calcular esfuerzo, capacidad y ruta crítica sin confundir horas-persona con calendario. Mostrar operaciones y supuestos; no sumar horas de roles concurrentes para derivar automáticamente días.

## 5. Entregar y recalibrar

Entregar informe siguiendo la plantilla, con resumen de horas DEV/QA, duración humana, ejecución IA y supervisión residual. Incluir riesgos, límites, escenarios y pasos para reducir incertidumbre. No presentar rangos como intervalos probabilísticos calibrados. Redondear según incertidumbre, evitando decimales engañosos.

Si hay histórico real de tareas comparables, registrar diferencia estimado/real por perfil y tipo de tarea. Ajustar siguientes estimaciones con esos datos, sin trasladar automáticamente factores entre tecnologías o equipos. Al reevaluar otra rama o commit, revisar cambios y dependencias afectadas y explicar la variación. Guardar el informe solo en la ubicación autorizada y mantener la evaluación separada de implementación.

## Tabla final obligatoria

Cerrar cada informe con la tabla de cuatro columnas definida en `references/plantilla-informe.md`: Bloque, Tarea, Días y Motivo. Separar escenarios humano e IA y perfiles en Bloque. No omitirla, aun con información incompleta; usar «No estimable» cuando corresponda. Explicar unidades y supuestos inmediatamente antes de la tabla.

## Segundo método: Fibonacci

Leer [fibonacci.md](references/fibonacci.md) y aplicar estimación relativa Fibonacci junto con PERT por defecto. Presentar puntos por historia completa y horas DEV/QA por PERT sin duplicar unidades. Convertir puntos a plazo únicamente con velocidad histórica comparable; contrastar ambos resultados sin promediarlos. Mantener la tabla final de cuatro columnas e identificar el método y puntos en Motivo.

## Clasificación obligatoria de tareas

Clasificar cada tarea como Backend, Frontend o QA según el trabajo concreto y evidencia del código. Backend incluye APIs, servicios, reglas de negocio del servidor, persistencia, migraciones e integraciones del servidor. Frontend incluye interfaces, navegación, estado, accesibilidad, validaciones de cliente e integración de la interfaz con APIs. QA incluye diseño y ejecución de pruebas independientes, automatización QA, regresión y revalidación. Mantener pruebas unitarias del desarrollador dentro de Backend o Frontend para evitar duplicación.

Dividir cambios que atraviesan Backend, Frontend y QA en tareas enlazadas con IDs y dependencias. No usar «Full stack» como sustituto de este desglose. Si el trabajo no pertenece a esas categorías (por ejemplo DevOps o análisis), indicarlo como bloque adicional justificado; no forzarlo a Backend.

Distinguir área técnica, perfil y escenario: área Backend/Frontend/QA; perfil DEV/QA u otro; escenario humano/IA. En la tabla final, escribir Bloque como «Humano · Backend», «Humano · Frontend», «Humano · QA», «IA · Backend», «IA · Frontend» o «IA · QA», añadiendo «revisión humana» cuando aplique. Automatizar una prueba QA con IA no la convierte en tarea Backend. Reportar subtotales Backend DEV, Frontend DEV y QA, y conservar DEV total = Backend DEV + Frontend DEV + otros DEV justificados, sin sumar nuevamente los subtotales al esfuerzo.

## Dos escenarios de estimación, exclusivamente

Entregar exactamente dos escenarios para el mismo alcance y definición de terminado:
1. Humano: implementación y validación realizadas por personas, sin asistencia de IA para ejecutar esas tareas. Mantener herramientas convencionales y automatización de pruebas existentes.
2. IA: ejecución de las tareas automatizables con IA. Contabilizar dentro de este escenario toda intervención humana indispensable, QA humano residual y esperas; declararlas sin presentar un tercer escenario híbrido ni afirmar autonomía completa sin evidencia.

Desglosar cada escenario por Backend, Frontend y QA, con un único plazo total por escenario. PERT y Fibonacci son métodos de apoyo, nunca escenarios adicionales. Contrastar sus cálculos en el análisis y elegir un pronóstico principal justificado por escenario, sin promediarlos ni sumarlos. En la tabla final incluir tareas y subtotales dentro de Humano e IA y terminar con exactamente dos filas de plazo global: «Total · Humano» y «Total · IA». No añadir filas globales por método. Si faltan datos, mantener esas dos filas con «No estimable». Esta regla sustituye cualquier ejemplo anterior que sugiera totales adicionales por método.

## Inventario obligatorio de apps y workspaces desde README

Antes de analizar código o estimar, localizar y leer el  Workspaces de Referencia | [`docs/readme/workspaces-de-referencia.md`](./docs/readme/workspaces-de-referencia.md) y los README específicos referenciados para cada app/workspace. Extraer nombres exactos de apps, workspaces, rutas, propósito, dependencias y comandos documentados. Usar ese mapa para determinar qué código corresponde a cada aplicación. Corroborar las rutas y límites con el árbol real y la configuración de workspaces/build disponible; no asumir npm ni una herramienta particular. No ejecutar comandos del README sin revisar sus efectos.

Presentar un inventario «App | Workspace | Ruta | Propósito | Evidencia Workspace | Estado de corroboración». Si el Workspace falta, está incompleto o contradice la configuración, declarar la diferencia, citar ambas fuentes y marcar lo no confirmado. No inventar asociaciones ni inferir automáticamente que cada directorio es una app. Inspeccionar código disponible aun si hay vacíos, delimitando el alcance.

Asociar cada hallazgo y tarea con app, workspace y área Backend/Frontend/QA, además de escenario Humano/IA. Desglosar por app/workspace; mantener bibliotecas y servicios compartidos en un bloque Compartido con consumidores identificados para no duplicar esfuerzo. Registrar dependencias entre apps/workspaces para calcular el plazo.

Conservar exactamente las cuatro columnas finales: Bloque, Tarea, Días, Motivo. Usar Bloque = «Humano o IA · App · Workspace · Backend/Frontend/QA», con nombres exactos del inventario; acortar mediante una leyenda inequívoca si es demasiado largo. Para trabajo compartido usar «Humano o IA · Compartido · Workspace · Área». Mostrar subtotales por app/workspace y área sin contarlos dos veces, y mantener exclusivamente los dos totales globales Humano e IA.

## Formato final vigente: dos tablas y columnas independientes

Esta instrucción reemplaza todas las instrucciones y ejemplos anteriores que exigían cuatro columnas o concatenar escenario/app/workspace/área dentro de Bloque. Entregar exactamente dos tablas finales separadas: primero «Estimación humana» y luego «Estimación IA». En ambas usar exactamente estas siete columnas: Escenario | App | Workspace | Área | Tarea | Días | Motivo.

Mantener cada dato en su propia celda: por ejemplo «IA | API Clientes | `clientes-api` | Backend | [tarea] | [días] | [motivo]». No usar puntos medios para concatenar esos campos. Usar Área = Backend, Frontend, QA u otra área justificada. En la primera tabla usar Escenario = Humano; en la segunda Escenario = IA. La intervención humana necesaria en el escenario IA se identifica en Tarea/Motivo y permanece dentro de la tabla IA.

Mantener nombres de app y workspace según inventario del  Workspaces de Referencia | [`docs/readme/workspaces-de-referencia.md`](./docs/readme/workspaces-de-referencia.md) , tareas compartidas sin duplicar, métodos PERT/Fibonacci como apoyo y unidades/supuestos explícitos antes de las tablas. Incluir subtotales si ayudan, claramente como esfuerzo. Cerrar cada tabla con un único total de plazo hábil de su escenario, sin sumar escenarios entre sí. En celdas App/Workspace/Área de la fila total usar «Todas»/«Todos»/«Todas». Si faltan datos usar «No estimable». No agregar otra tabla de cierre que vuelva a mezclar Humano e IA.
