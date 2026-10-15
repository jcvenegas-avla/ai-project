# Plantilla de informe

## Resumen ejecutivo
Objetivo, alcance evaluado, estado observable, principales bloqueos y conclusión provisional.

| Escenario | DEV humano (h) | QA humano (h) | Otros humanos (h) | IA activa (h-agente) | Plazo hábil/rango | Confianza |
|---|---:|---:|---:|---:|---|---|
| Equipo humano | | | | No aplica | | |
| IA con supervisión | | | | | | |

Indicar supuestos de capacidad, qué incluyen los rangos y actividades externas. Si no hay base, usar «No estimable con evidencia actual» y explicar qué falta.

## Base y cobertura
Repos/rama/commit/fecha/cambios locales; documentos de alcance; módulos leídos; muestreo/exclusiones; comandos ejecutados y resultados; accesos faltantes. No incluir secretos.

## Inventario de apps y workspaces

Leer primero el README raíz y los README específicos. Presentar:

| App | Workspace | Ruta | Propósito | Evidencia README | Estado de corroboración |
|---|---|---|---|---|---|

Indicar rutas documentadas y verificadas, discrepancias, apps no inspeccionadas y dependencias compartidas. Identificar app y workspace en todas las tareas y hallazgos (mediante columnas internas o IDs enlazados al inventario).

## Estado funcional
| Requisito/flujo | Estado | Evidencia código/test | Pendiente o incertidumbre |
|---|---|---|---|

## Hallazgos
| ID | Defecto confirmado/riesgo | Severidad e impacto | Ruta:líneas/símbolo | Reproducción o validación faltante |
|---|---|---|---|---|

## Desglose humano
Una fila por tarea y perfil para facilitar suma sin duplicar. Identificar también el área Backend, Frontend o QA. Dividir las tareas transversales y enlazar sus dependencias.
| ID tarea | Área | Resultado y criterio de terminado | Perfil | O/M/P (h) | E (h) | Justificación/evidencia | Dependencias | Confianza |
|---|---|---|---|---|---|---|---|---|

## Desglose IA del mismo alcance
| ID tarea | Área | Etapas automatizables | IA O/M/P (h activas) | DEV residual O/M/P (h) | QA residual O/M/P (h) | Esperas/bloqueos | Base de estimación |
|---|---|---|---|---|---|---|---|

## Calendario y cálculos
Mostrar sumas por perfil, capacidades, precedencias, concurrencia, ruta crítica y esperas. Distinguir rango favorable/probable/adverso de intervalos estadísticos. Usar la misma definición de terminado en ambos escenarios.

## Riesgos y decisiones
| Riesgo o supuesto | Evidencia | Impacto en estimación | Acción para verificar | Responsable sugerido |
|---|---|---|---|---|

## Plan para mejorar precisión
Priorizar aclaraciones, pruebas o spikes que más reduzcan incertidumbre. Proponer piloto IA y actualización con reales. Indicar explícitamente lo no confirmado y condiciones que obligarían a reestimar.

## Contraste PERT y Fibonacci

Antes de la tabla final, presentar el desglose de historias y puntos siguiendo `fibonacci.md`, la base histórica de velocidad si existe y el contraste de pronósticos. Sin histórico, conservar los días calculados por PERT y declarar que Fibonacci solo expresa tamaño relativo. En la tabla final conservar las cuatro columnas; añadir puntos y método en Motivo, y filas separadas para pronósticos alternativos sin sumarlos.

## Tablas finales obligatorias

Sustituir cualquier formato previo de cierre por dos tablas separadas de siete columnas. Explicar antes las horas por jornada, capacidad, concurrencia, unidades de esfuerzo y cálculo de plazo. Los siguientes marcadores se sustituyen por datos fundamentados; no son estimaciones reales.

### Estimación humana

| Escenario | App | Workspace | Área | Tarea | Días | Motivo |
|---|---|---|---|---|---:|---|
| Humano | [app del README] | `[workspace]` | Backend | [ID y tarea] | [esfuerzo] | [evidencia y método] |
| Humano | [app del README] | `[workspace]` | Frontend | [ID y tarea] | [esfuerzo] | [evidencia y método] |
| Humano | [apps afectadas] | [workspaces afectados] | QA | [ID y tarea] | [esfuerzo] | [cobertura y riesgos] |
| **Humano** | **Todas** | **Todos** | **Todas** | **Total del escenario** | **[plazo hábil y rango]** | **[ruta crítica, capacidad y esperas]** |

### Estimación IA

| Escenario | App | Workspace | Área | Tarea | Días | Motivo |
|---|---|---|---|---|---:|---|
| IA | [app del README] | `[workspace]` | Backend | [ID y tarea] | [esfuerzo] | [ejecución IA y revisión necesaria] |
| IA | [app del README] | `[workspace]` | Frontend | [ID y tarea] | [esfuerzo] | [ejecución IA y revisión necesaria] |
| IA | [apps afectadas] | [workspaces afectados] | QA | [ID y tarea] | [esfuerzo] | [automatización y validación humana residual] |
| **IA** | **Todas** | **Todos** | **Todas** | **Total del escenario** | **[plazo hábil y rango]** | **[ruta crítica IA, intervención humana y esperas]** |

Agregar filas para todas las tareas y subtotales útiles por app/workspace/área, sin duplicar componentes compartidos. Separar áreas en tareas enlazadas. Identificar unidades en Días: días-persona o días-agente para esfuerzo, días hábiles para plazo. Mantener solo dos escenarios y un total de plazo por cada uno. No convertir puntos sin velocidad histórica ni crear totales globales por método. Registrar incertidumbre en Motivo y declarar áreas no inspeccionadas. No concatenar Escenario, App, Workspace y Área en una celda.
