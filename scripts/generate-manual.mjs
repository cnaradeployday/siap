import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, VerticalAlign
} from 'docx'
import { writeFileSync } from 'fs'

const BLUE_DARK = '1B2A4A'
const BLUE_MED = '2B6CB0'
const BLUE_LIGHT = 'EBF8FF'
const GRAY = '718096'
const LIGHT_GRAY = 'F0F4F8'

// Helper: Heading 1
function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_MED, space: 4 } },
  })
}

// Helper: Heading 2
function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
  })
}

// Helper: Heading 3
function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
  })
}

// Helper: Normal paragraph
function p(text, { bold = false, italic = false, color = null, size = 22 } = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold, italics: italic, color: color ?? '2D3748', size })],
    spacing: { before: 80, after: 120 },
  })
}

// Helper: Bullet point
function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: '2D3748' })],
    bullet: { level },
    spacing: { before: 60, after: 60 },
  })
}

// Helper: Info box (blue background note)
function infoBox(text) {
  return new Paragraph({
    children: [new TextRun({ text: `ℹ  ${text}`, size: 20, color: BLUE_DARK, italics: true })],
    shading: { type: ShadingType.CLEAR, fill: 'EBF8FF' },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: BLUE_MED, space: 8 },
    },
    indent: { left: 360 },
    spacing: { before: 120, after: 120 },
  })
}

// Helper: Warning box
function warningBox(text) {
  return new Paragraph({
    children: [new TextRun({ text: `⚠  ${text}`, size: 20, color: '744210', italics: true })],
    shading: { type: ShadingType.CLEAR, fill: 'FEFCE8' },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: 'D97706', space: 8 },
    },
    indent: { left: 360 },
    spacing: { before: 120, after: 120 },
  })
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] })
}

function spacer() {
  return new Paragraph({ text: '', spacing: { before: 80, after: 80 } })
}

// Simple 2-col table for field descriptions
function fieldTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          cell('Campo', { bold: true, bg: BLUE_DARK, color: 'FFFFFF' }),
          cell('Descripción', { bold: true, bg: BLUE_DARK, color: 'FFFFFF' }),
        ],
      }),
      ...rows.map(([campo, desc], i) =>
        new TableRow({
          children: [
            cell(campo, { bold: true, bg: i % 2 === 0 ? 'FFFFFF' : 'F7FAFC', width: 30 }),
            cell(desc, { bg: i % 2 === 0 ? 'FFFFFF' : 'F7FAFC' }),
          ],
        })
      ),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    },
  })
}

function cell(text, { bold = false, bg = 'FFFFFF', color = '2D3748', width = null } = {}) {
  const colWidth = width ? { size: width, type: WidthType.PERCENTAGE } : undefined
  return new TableCell({
    width: colWidth,
    shading: { type: ShadingType.CLEAR, fill: bg },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 20, color })],
        spacing: { before: 40, after: 40 },
      }),
    ],
  })
}

// Estado table
function estadoTable() {
  const estados = [
    ['Pendiente de iniciar', 'FFF8E1', '795548', 'La tarea/proyecto aún no ha comenzado.'],
    ['En proceso', 'E3F2FD', '1565C0', 'Se está trabajando activamente.'],
    ['Bloqueado', 'FFEBEE', 'B71C1C', 'Existe un impedimento que frena el avance.'],
    ['Vencido', 'FCE4EC', '880E4F', 'La fecha límite fue superada sin completarse.'],
    ['Completado', 'E8F5E9', '1B5E20', 'El ítem fue finalizado exitosamente.'],
  ]
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          cell('Estado', { bold: true, bg: BLUE_DARK, color: 'FFFFFF' }),
          cell('Descripción', { bold: true, bg: BLUE_DARK, color: 'FFFFFF' }),
        ],
      }),
      ...estados.map(([nombre, bg, color, desc]) =>
        new TableRow({
          children: [
            cell(nombre, { bold: true, bg, color }),
            cell(desc, { bg: 'FFFFFF' }),
          ],
        })
      ),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    },
  })
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22, color: '2D3748' },
        paragraph: { spacing: { line: 276 } },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        run: { bold: true, size: 36, color: BLUE_DARK, font: 'Calibri' },
        paragraph: { spacing: { before: 480, after: 240 } },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        run: { bold: true, size: 28, color: BLUE_MED, font: 'Calibri' },
        paragraph: { spacing: { before: 360, after: 180 } },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        run: { bold: true, size: 24, color: '4A5568', font: 'Calibri' },
        paragraph: { spacing: { before: 280, after: 120 } },
      },
    ],
  },

  sections: [
    {
      // ─── PORTADA ────────────────────────────────────────────────────────
      properties: {},
      children: [
        spacer(), spacer(), spacer(), spacer(),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'SIAP', bold: true, size: 96, color: BLUE_DARK, font: 'Calibri' })],
          spacing: { after: 160 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Sistema de Administración de Proyectos', size: 36, color: BLUE_MED, font: 'Calibri' })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Ministerio de Economía', size: 26, color: GRAY, italics: true, font: 'Calibri' })],
          spacing: { after: 800 },
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0', space: 1 } },
          children: [new TextRun({ text: '', size: 4 })],
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Manual de Usuario', bold: true, size: 40, color: BLUE_DARK, font: 'Calibri' })],
          spacing: { after: 160 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Versión 2.1', size: 24, color: GRAY, font: 'Calibri' })],
          spacing: { after: 800 },
        }),

        spacer(), spacer(),

        pageBreak(),

        // ─── ÍNDICE ─────────────────────────────────────────────────────
        h1('Índice de Contenidos'),

        ...[
          ['1.', 'Introducción al Sistema'],
          ['2.', 'Acceso al Sistema'],
          ['3.', 'Estructura del Sistema — Jerarquía de Datos'],
          ['4.', 'Navegación General'],
          ['5.', 'Dashboard Directivo'],
          ['6.', 'Dashboard Ejecutivo'],
          ['7.', 'Flujograma'],
          ['8.', 'Proyectos'],
          ['9.', 'Líneas de Acción'],
          ['10.', 'Tareas y Subtareas'],
          ['11.', 'Alertas'],
          ['12.', 'Gestión de Usuarios'],
          ['13.', 'Roles y Permisos'],
          ['14.', 'Logs de Auditoría'],
          ['15.', 'Configuración del Sistema'],
          ['16.', 'Perfil de Usuario'],
          ['17.', 'Glosario'],
        ].map(([num, title]) =>
          new Paragraph({
            children: [
              new TextRun({ text: `${num}  `, bold: true, size: 22, color: BLUE_MED }),
              new TextRun({ text: title, size: 22, color: '2D3748' }),
            ],
            spacing: { before: 80, after: 80 },
            indent: { left: 360 },
          })
        ),

        pageBreak(),

        // ─── 1. INTRODUCCIÓN ────────────────────────────────────────────
        h1('1. Introducción al Sistema'),
        p('SIAP (Sistema de Administración de Proyectos) es una plataforma web desarrollada para el Ministerio de Economía que permite planificar, ejecutar y hacer seguimiento de proyectos institucionales de manera organizada y colaborativa.'),
        spacer(),
        h2('Objetivos del sistema'),
        bullet('Centralizar la gestión de proyectos en una única plataforma.'),
        bullet('Proveer visibilidad del estado de avance a todos los niveles de la organización.'),
        bullet('Facilitar la asignación de responsables y el seguimiento de plazos.'),
        bullet('Generar alertas automáticas sobre tareas vencidas o próximas a vencer.'),
        bullet('Mantener un registro de auditoría completo de todas las acciones realizadas.'),
        spacer(),
        h2('Características principales'),
        bullet('Estructura jerárquica: Proyectos → Líneas de Acción → Tareas → Subtareas.'),
        bullet('Control de acceso por roles con permisos por sección.'),
        bullet('Restricción de proyectos visibles por usuario.'),
        bullet('Dashboards directivo y ejecutivo con métricas e indicadores.'),
        bullet('Flujograma visual del estado de proyectos.'),
        bullet('Sistema de alertas para tareas vencidas y por vencer.'),
        bullet('Exportación de datos a Excel.'),
        bullet('Logo y manual del sistema configurables.'),
        spacer(),
        infoBox('El sistema es accesible desde cualquier navegador moderno (Chrome, Firefox, Edge, Safari). Se recomienda una resolución mínima de 1280×720 px.'),

        pageBreak(),

        // ─── 2. ACCESO ──────────────────────────────────────────────────
        h1('2. Acceso al Sistema'),
        h2('Inicio de sesión'),
        p('Para ingresar al sistema, el administrador le asignará un correo electrónico y una contraseña provisoria. Ingresá a la URL del sistema y completá el formulario de acceso.'),
        spacer(),
        fieldTable([
          ['Email', 'Correo electrónico institucional asignado por el administrador.'],
          ['Contraseña', 'Contraseña provisoria proporcionada. Se recomienda cambiarla en el primer ingreso.'],
        ]),
        spacer(),
        warningBox('Si tu cuenta está marcada como inactiva, el sistema no permitirá el acceso. Contactá al administrador del sistema.'),
        spacer(),
        h2('Cambio de contraseña'),
        p('Al ingresar por primera vez, se recomienda cambiar la contraseña provisoria:'),
        bullet('Hacé clic en tu nombre en la esquina superior derecha.'),
        bullet('Seleccioná "Cambiar contraseña".'),
        bullet('Ingresá la nueva contraseña (mínimo 6 caracteres) y confirmala.'),
        bullet('Hacé clic en "Guardar".'),
        spacer(),
        h2('Cierre de sesión'),
        p('Para cerrar la sesión de forma segura, hacé clic en tu nombre en el encabezado y seleccioná "Cerrar sesión". Esto eliminará tu sesión activa.'),

        pageBreak(),

        // ─── 3. JERARQUÍA ───────────────────────────────────────────────
        h1('3. Estructura del Sistema — Jerarquía de Datos'),
        p('El sistema organiza la información en cuatro niveles jerárquicos:'),
        spacer(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                cell('Nivel', { bold: true, bg: BLUE_DARK, color: 'FFFFFF' }),
                cell('Entidad', { bold: true, bg: BLUE_DARK, color: 'FFFFFF' }),
                cell('Descripción', { bold: true, bg: BLUE_DARK, color: 'FFFFFF' }),
              ],
            }),
            new TableRow({ children: [cell('1°', { bold: true, bg: 'EBF8FF', color: BLUE_DARK }), cell('Proyecto', { bold: true }), cell('Unidad principal de planificación. Agrupa líneas de acción relacionadas.')]}),
            new TableRow({ children: [cell('2°', { bold: true, bg: 'F0FFF4', color: '276749' }), cell('Línea de Acción', { bold: true }), cell('Eje temático o componente del proyecto. Cada proyecto puede tener múltiples líneas.')]}),
            new TableRow({ children: [cell('3°', { bold: true, bg: 'FFFAF0', color: '744210' }), cell('Tarea', { bold: true }), cell('Actividad concreta dentro de una línea de acción. Máximo 3 tareas por línea.')]}),
            new TableRow({ children: [cell('4°', { bold: true, bg: 'FFF5F5', color: '742A2A' }), cell('Subtarea', { bold: true }), cell('Actividad de detalle dentro de una tarea. Permite granularidad adicional.')]}),
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
            insideH: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
            insideV: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
          },
        }),

        spacer(),
        h2('Estados posibles'),
        p('Proyectos, líneas de acción, tareas y subtareas comparten el mismo sistema de estados:'),
        spacer(),
        estadoTable(),
        spacer(),
        infoBox('El estado "Vencido" se determina automáticamente cuando la fecha de fin fue superada y el ítem no fue marcado como Completado.'),

        pageBreak(),

        // ─── 4. NAVEGACIÓN ──────────────────────────────────────────────
        h1('4. Navegación General'),
        h2('Barra lateral (menú principal)'),
        p('El menú lateral izquierdo contiene todas las secciones del sistema. Solo aparecen las secciones a las que tu rol tiene permiso de acceso.'),
        spacer(),
        fieldTable([
          ['Dashboard Directivo', 'Resumen ejecutivo del estado de todos los proyectos.'],
          ['Dashboard Ejecutivo', 'Vista detallada con expansión de líneas y tareas.'],
          ['Flujograma', 'Visualización gráfica del avance de proyectos y líneas.'],
          ['Proyectos', 'Gestión completa de proyectos.'],
          ['Líneas de Acción', 'Gestión de líneas de acción por proyecto.'],
          ['Tareas', 'Gestión de tareas y subtareas.'],
          ['Alertas', 'Panel de tareas vencidas y próximas a vencer.'],
          ['Usuarios', 'Administración de usuarios del sistema (solo admin).'],
          ['Roles', 'Configuración de roles y permisos (solo admin).'],
          ['Logs', 'Registro de auditoría de todas las acciones.'],
          ['Configuración', 'Logo y manual del sistema (solo admin).'],
        ]),
        spacer(),
        h2('Encabezado'),
        p('El encabezado superior contiene:'),
        bullet('Botón "Manual" — descarga el manual del sistema (si fue cargado por el administrador).'),
        bullet('Menú de usuario — muestra tu nombre, permite cambiar contraseña y cerrar sesión.'),
        spacer(),
        h2('Colapsar el menú lateral'),
        p('Hacé clic en el ícono de flecha (< >) ubicado en la parte superior del menú lateral para contraerlo y ganar espacio en pantalla. Para expandirlo, hacé clic nuevamente en el ícono de flecha.'),

        pageBreak(),

        // ─── 5. DASHBOARD DIRECTIVO ─────────────────────────────────────
        h1('5. Dashboard Directivo'),
        p('El Dashboard Directivo ofrece una vista de alto nivel del estado de todos los proyectos. Está diseñado para la toma de decisiones ejecutivas.'),
        spacer(),
        h2('Indicadores KPI'),
        p('En la parte superior se muestran tarjetas con los siguientes indicadores:'),
        bullet('Total de proyectos activos en el sistema.'),
        bullet('Cantidad de proyectos En proceso.'),
        bullet('Cantidad de proyectos Bloqueados.'),
        bullet('Cantidad de proyectos Vencidos.'),
        bullet('Cantidad de proyectos Completados.'),
        bullet('Cantidad de proyectos Pendientes de iniciar.'),
        spacer(),
        h2('Tabla de proyectos'),
        p('La tabla principal muestra todos los proyectos con las siguientes columnas:'),
        fieldTable([
          ['Proyecto', 'Nombre del proyecto.'],
          ['Patrocinador', 'Usuario responsable del patrocinio del proyecto.'],
          ['Inicio', 'Fecha de inicio planificada.'],
          ['Fin', 'Fecha de finalización planificada.'],
          ['Líneas', 'Cantidad de líneas de acción asociadas.'],
          ['Estado', 'Estado calculado automáticamente según el avance de las líneas.'],
        ]),
        spacer(),
        h2('Filtros disponibles'),
        bullet('Búsqueda por nombre de proyecto.'),
        bullet('Filtro por estado.'),
        bullet('Filtro por patrocinador.'),
        bullet('Filtro por proyecto específico.'),
        bullet('Ordenamiento por cualquier columna (clic en el encabezado).'),
        spacer(),
        infoBox('Los usuarios con proyectos restringidos solo verán en el dashboard los proyectos habilitados por el administrador.'),

        pageBreak(),

        // ─── 6. DASHBOARD EJECUTIVO ─────────────────────────────────────
        h1('6. Dashboard Ejecutivo'),
        p('El Dashboard Ejecutivo permite un análisis más profundo, con la capacidad de expandir cada proyecto para ver sus líneas de acción y las tareas asociadas.'),
        spacer(),
        h2('Funcionalidades'),
        bullet('Mismos KPI y filtros que el Dashboard Directivo.'),
        bullet('Expansión de proyecto: clic en la fila del proyecto para ver sus líneas de acción.'),
        bullet('Expansión de línea: clic en la fila de la línea para ver sus tareas.'),
        bullet('Indicación visual del estado de cada nivel (íconos de color).'),
        bullet('Filtros adicionales: por responsable de línea y por proyecto.'),
        spacer(),
        h2('Exportación'),
        p('El botón "Exportar" permite descargar la vista actual en formato Excel (.xlsx) para su análisis externo.'),

        pageBreak(),

        // ─── 7. FLUJOGRAMA ──────────────────────────────────────────────
        h1('7. Flujograma'),
        p('El Flujograma ofrece una vista visual del estado de proyectos y sus líneas de acción, presentando la información de forma gráfica y de fácil interpretación.'),
        spacer(),
        h2('Cómo usar el Flujograma'),
        bullet('Al ingresar, ningún proyecto está seleccionado por defecto.'),
        bullet('Seleccioná uno o más proyectos del panel izquierdo para visualizarlos.'),
        bullet('El gráfico muestra las líneas de acción de cada proyecto seleccionado con barras de progreso de fechas.'),
        bullet('Los colores de las barras corresponden al estado de cada línea.'),
        bullet('Expandí una línea para ver las tareas asociadas y su estado.'),
        spacer(),
        infoBox('Si tenés proyectos restringidos, solo podrás seleccionar y visualizar los proyectos habilitados para tu usuario.'),

        pageBreak(),

        // ─── 8. PROYECTOS ───────────────────────────────────────────────
        h1('8. Proyectos'),
        p('La sección de Proyectos permite crear, editar y administrar los proyectos institucionales.'),
        spacer(),
        h2('Crear un nuevo proyecto'),
        p('Hacé clic en "Nuevo Proyecto". Completá el formulario con los siguientes datos:'),
        spacer(),
        fieldTable([
          ['Nombre (*)', 'Nombre descriptivo del proyecto. Campo obligatorio.'],
          ['Descripción', 'Detalle adicional del proyecto.'],
          ['Métrica de éxito', 'Indicador que define el éxito del proyecto.'],
          ['Patrocinador', 'Usuario responsable del patrocinio (seleccionable de la lista de usuarios).'],
          ['Fecha de inicio (*)', 'Fecha en que inicia el proyecto. Campo obligatorio.'],
          ['Fecha de fin (*)', 'Fecha límite del proyecto. Campo obligatorio.'],
          ['Estado', 'Estado actual del proyecto (pendiente, en proceso, etc.).'],
        ]),
        spacer(),
        h2('Editar un proyecto'),
        p('En la tabla de proyectos, hacé clic en el ícono de lápiz (✏) de la fila correspondiente. Se abrirá el mismo formulario con los datos actuales para modificarlos.'),
        spacer(),
        h2('Eliminar un proyecto'),
        p('Hacé clic en el ícono de papelera (🗑) de la fila correspondiente. El sistema pedirá confirmación antes de proceder. La eliminación es lógica (el registro queda en la base de datos como eliminado).'),
        spacer(),
        h2('Filtros y búsqueda'),
        bullet('Búsqueda por nombre.'),
        bullet('Filtro por estado.'),
        bullet('Filtro por patrocinador.'),
        bullet('Ordenamiento por cualquier columna.'),

        pageBreak(),

        // ─── 9. LÍNEAS DE ACCIÓN ────────────────────────────────────────
        h1('9. Líneas de Acción'),
        p('Las Líneas de Acción son los ejes temáticos o componentes de un proyecto. Cada proyecto puede tener múltiples líneas de acción.'),
        spacer(),
        h2('Crear una nueva Línea de Acción'),
        p('Hacé clic en "Nueva Línea de Acción". Completá el formulario:'),
        spacer(),
        fieldTable([
          ['Proyecto (*)', 'Proyecto al que pertenece la línea. Campo obligatorio.'],
          ['Nombre (*)', 'Nombre descriptivo de la línea. Campo obligatorio.'],
          ['Descripción', 'Detalle adicional de la línea.'],
          ['Métrica de éxito', 'Indicador que define el éxito de esta línea.'],
          ['Responsable', 'Usuario a cargo de la línea.'],
          ['Patrocinador', 'Usuario que patrocina esta línea.'],
          ['Fecha de inicio (*)', 'Fecha de inicio de la línea.'],
          ['Fecha de fin (*)', 'Fecha límite de la línea.'],
          ['Estado', 'Estado actual de la línea.'],
          ['Orden', 'Número de orden dentro del proyecto (I, II, III, etc.).'],
        ]),
        spacer(),
        h2('Editar y eliminar'),
        p('Igual que en Proyectos: el ícono de lápiz abre el formulario de edición; el ícono de papelera elimina la línea (con confirmación).'),
        spacer(),
        h2('Filtros y búsqueda'),
        bullet('Búsqueda por nombre.'),
        bullet('Filtro por proyecto.'),
        bullet('Filtro por estado.'),
        bullet('Ordenamiento por columnas.'),

        pageBreak(),

        // ─── 10. TAREAS ─────────────────────────────────────────────────
        h1('10. Tareas y Subtareas'),
        h2('10.1 Tareas'),
        p('Las tareas son las actividades concretas dentro de cada línea de acción. Cada línea puede tener un máximo de 3 tareas.'),
        spacer(),
        h2('Crear una nueva Tarea'),
        p('Hacé clic en "Nueva Tarea". Completá el formulario:'),
        spacer(),
        fieldTable([
          ['Proyecto (*)', 'Proyecto al que pertenece. Filtra las líneas disponibles.'],
          ['Línea de Acción (*)', 'Línea a la que pertenece la tarea.'],
          ['Nombre (*)', 'Nombre descriptivo de la tarea.'],
          ['Descripción', 'Detalle de la tarea.'],
          ['Métrica de éxito', 'Indicador de cumplimiento.'],
          ['Responsable', 'Usuario a cargo de la tarea.'],
          ['Fecha de inicio (*)', 'Cuándo comienza la tarea.'],
          ['Duración (días) (*)', 'Duración estimada en días hábiles. La fecha de fin se calcula automáticamente.'],
          ['Estado', 'Estado actual de la tarea.'],
          ['Dependencias', 'Tareas que deben completarse antes de iniciar esta.'],
        ]),
        spacer(),
        warningBox('Cada línea de acción admite un máximo de 3 tareas. Si se intenta crear una cuarta, el sistema mostrará un error.'),
        spacer(),
        h2('Cambio rápido de estado'),
        p('En la tabla de tareas, podés cambiar el estado directamente desde el menú desplegable en la columna "Estado", sin necesidad de abrir el formulario de edición.'),
        spacer(),
        h2('Exportar tareas'),
        p('El botón "Exportar" descarga la lista de tareas visible (con los filtros activos) en formato Excel, incluyendo proyecto, línea, fechas, responsable y estado.'),
        spacer(),

        h2('10.2 Subtareas'),
        p('Las subtareas permiten dividir una tarea en actividades más pequeñas para un seguimiento más detallado.'),
        spacer(),
        p('Para agregar una subtarea, expandí una tarea en la tabla (hacé clic en el ícono ▶) y luego hacé clic en el botón "+ Subtarea".'),
        spacer(),
        fieldTable([
          ['Nombre (*)', 'Nombre de la subtarea.'],
          ['Descripción', 'Detalle de la subtarea.'],
          ['Métrica de éxito', 'Indicador de cumplimiento.'],
          ['Responsable', 'Usuario a cargo.'],
          ['Fecha de inicio (*)', 'Fecha de inicio.'],
          ['Duración (días) (*)', 'Duración estimada. La fecha de fin se calcula automáticamente.'],
          ['Estado', 'Estado actual.'],
          ['Depende de', 'Subtarea predecesora (dependencia).'],
        ]),
        spacer(),
        h2('Filtros de Tareas'),
        bullet('Búsqueda por nombre.'),
        bullet('Filtro por línea de acción.'),
        bullet('Filtro por estado.'),
        bullet('Filtro por responsable.'),
        bullet('Ordenamiento por columnas.'),

        pageBreak(),

        // ─── 11. ALERTAS ────────────────────────────────────────────────
        h1('11. Alertas'),
        p('El módulo de Alertas centraliza las notificaciones sobre el estado de las tareas que requieren atención inmediata.'),
        spacer(),
        h2('Tareas Vencidas'),
        p('Muestra todas las tareas cuya fecha de vencimiento ya fue superada y que aún no están marcadas como "Completado".'),
        bullet('Se resaltan en rojo.'),
        bullet('Se indica cuántos días llevan vencidas.'),
        bullet('Se muestra el proyecto, línea de acción y responsable de cada tarea.'),
        spacer(),
        h2('Tareas por Vencer'),
        p('Muestra las tareas que vencen en los próximos 15 días y que aún no están completadas.'),
        bullet('Se resaltan en amarillo/naranja.'),
        bullet('Se indica la cantidad de días restantes.'),
        bullet('Las tareas que vencen en 5 días o menos se muestran con mayor urgencia (naranja).'),
        spacer(),
        infoBox('Las alertas se actualizan cada vez que ingresás a la sección. Usá el botón "Actualizar" para refrescar los datos sin recargar la página.'),
        spacer(),
        warningBox('Un usuario con proyectos restringidos solo verá alertas correspondientes a los proyectos que tiene habilitados.'),

        pageBreak(),

        // ─── 12. USUARIOS ───────────────────────────────────────────────
        h1('12. Gestión de Usuarios'),
        p('La sección de Usuarios permite al administrador gestionar las cuentas de acceso al sistema.'),
        spacer(),
        infoBox('Esta sección solo está disponible para usuarios con perfil Administrador o con permiso de escritura en la sección "usuarios".'),
        spacer(),
        h2('Crear un nuevo usuario'),
        p('Hacé clic en "Nuevo Usuario" y completá el formulario:'),
        spacer(),
        fieldTable([
          ['Nombre (*)', 'Nombre del usuario.'],
          ['Apellido (*)', 'Apellido del usuario.'],
          ['Email (*)', 'Correo electrónico. Será el usuario de acceso al sistema.'],
          ['Contraseña provisoria (*)', 'Contraseña inicial (mínimo 6 caracteres). El usuario puede cambiarla desde su perfil.'],
          ['Rol', 'Rol asignado (determina los permisos de acceso a secciones).'],
          ['Es administrador', 'Si se activa, el usuario tendrá acceso completo a todas las secciones.'],
          ['Usuario activo', 'Si se desactiva, el usuario no podrá ingresar al sistema.'],
        ]),
        spacer(),
        h2('Editar un usuario'),
        p('Hacé clic en el ícono de lápiz (✏) en la fila del usuario. Podés modificar nombre, apellido, rol, estado de administrador y si está activo. No se puede cambiar el email desde este formulario.'),
        spacer(),
        h2('Proyectos habilitados por usuario'),
        p('Hacé clic en el ícono de carpeta (🗂) en la fila del usuario. Se abrirá un modal con la lista de todos los proyectos del sistema. Tildá los proyectos que ese usuario puede ver.'),
        bullet('Si no se selecciona ningún proyecto → el usuario verá todos los proyectos (sin restricción).'),
        bullet('Si se seleccionan proyectos específicos → el usuario solo verá esos proyectos en todas las secciones del sistema (dashboards, proyectos, líneas, tareas, flujograma y alertas).'),
        spacer(),
        h2('Cambiar contraseña de un usuario'),
        p('Hacé clic en el ícono de llave (🔑) en la fila del usuario (solo disponible si el usuario tiene acceso al sistema). Ingresá la nueva contraseña y confirmá.'),
        spacer(),
        h2('Activar / Desactivar usuario'),
        p('Hacé clic en el ícono de usuario con X o con ✓ para cambiar el estado activo/inactivo del usuario. Un usuario inactivo no puede ingresar al sistema.'),
        spacer(),
        h2('Enlazar con cuenta de acceso'),
        p('El ícono de enlace (🔗) permite vincular un usuario del sistema con una cuenta de autenticación externa (Google u otra). Esto es para casos en que la cuenta de autenticación fue creada por separado.'),

        pageBreak(),

        // ─── 13. ROLES ──────────────────────────────────────────────────
        h1('13. Roles y Permisos'),
        p('Los Roles definen qué secciones del sistema puede ver y modificar cada usuario.'),
        spacer(),
        infoBox('Un usuario marcado como "Administrador" tiene acceso completo independientemente del rol asignado.'),
        spacer(),
        h2('Crear un Rol'),
        p('Hacé clic en "Nuevo Rol" e ingresá un nombre y descripción. Luego configurá los permisos para cada sección.'),
        spacer(),
        h2('Configurar permisos'),
        p('Para cada sección del sistema podés habilitar:'),
        fieldTable([
          ['Puede leer', 'El usuario puede ver la sección y su contenido, pero no puede crear, editar ni eliminar registros.'],
          ['Puede escribir', 'El usuario puede crear, editar y eliminar registros en la sección. Al activar escritura, la lectura se habilita automáticamente.'],
        ]),
        spacer(),
        h2('Secciones con control de permisos'),
        fieldTable([
          ['dashboard_directivo', 'Acceso al Dashboard Directivo.'],
          ['dashboard_ejecutivo', 'Acceso al Dashboard Ejecutivo.'],
          ['flujograma', 'Acceso al Flujograma.'],
          ['proyectos', 'Gestión de proyectos.'],
          ['lineas_accion', 'Gestión de líneas de acción.'],
          ['tareas', 'Gestión de tareas y subtareas.'],
          ['usuarios', 'Gestión de usuarios.'],
          ['roles', 'Gestión de roles y permisos.'],
        ]),
        spacer(),
        h2('Asignar un Rol a un usuario'),
        p('Desde la sección Usuarios, editá el usuario y seleccioná el rol en el campo correspondiente. Los cambios de permisos aplican de forma inmediata en el próximo inicio de sesión del usuario.'),

        pageBreak(),

        // ─── 14. LOGS ───────────────────────────────────────────────────
        h1('14. Logs de Auditoría'),
        p('El módulo de Logs registra automáticamente todas las operaciones realizadas en el sistema, permitiendo rastrear quién realizó cada acción y cuándo.'),
        spacer(),
        h2('Información registrada'),
        fieldTable([
          ['Fecha y hora', 'Momento exacto en que se realizó la acción.'],
          ['Usuario', 'Nombre del usuario que realizó la acción (o "Sistema" para acciones automáticas).'],
          ['Sección', 'Tabla o módulo donde se realizó la acción.'],
          ['Acción', 'Tipo de operación: INSERT (creación), UPDATE (modificación) o DELETE (eliminación).'],
          ['Cambios', 'Detalle de los campos modificados con los valores anteriores y nuevos.'],
        ]),
        spacer(),
        h2('Filtros de Logs'),
        bullet('Filtro por tabla/sección.'),
        bullet('Filtro por tipo de acción (INSERT / UPDATE / DELETE).'),
        bullet('Los registros se muestran de más reciente a más antiguo.'),
        bullet('Se muestran 50 registros por página.'),
        spacer(),
        infoBox('Los logs son de solo lectura. No es posible eliminar ni modificar el historial de auditoría.'),

        pageBreak(),

        // ─── 15. CONFIGURACIÓN ──────────────────────────────────────────
        h1('15. Configuración del Sistema'),
        p('La sección de Configuración permite al administrador personalizar aspectos visuales y de recursos del sistema.'),
        spacer(),
        infoBox('Esta sección solo está disponible para usuarios Administradores.'),
        spacer(),
        h2('Logo del Sistema'),
        p('Permite reemplazar el logo que se muestra en la barra lateral del sistema.'),
        bullet('Hacé clic en "Subir nuevo logo".'),
        bullet('Seleccioná una imagen (JPG, PNG, SVG, etc.).'),
        bullet('El logo se actualizará automáticamente. Podés previsualizar el resultado antes de que se aplique al sistema.'),
        bullet('Para que todos los usuarios vean el nuevo logo, deben recargar la página.'),
        spacer(),
        h2('Manual del Sistema'),
        p('Permite subir el manual de usuario en formato PDF o Word para que esté disponible para su descarga.'),
        bullet('Hacé clic en "Subir manual (PDF/Word)".'),
        bullet('Seleccioná el archivo del manual.'),
        bullet('Una vez subido, aparecerá el botón "Manual" en el encabezado de todas las páginas del sistema.'),
        bullet('Cualquier usuario puede descargar el manual haciendo clic en ese botón.'),
        spacer(),
        warningBox('Al subir un nuevo logo o manual, el archivo anterior es reemplazado permanentemente.'),

        pageBreak(),

        // ─── 16. PERFIL ─────────────────────────────────────────────────
        h1('16. Perfil de Usuario'),
        p('Cada usuario puede acceder a su perfil desde el menú en la esquina superior derecha del sistema.'),
        spacer(),
        h2('Cambiar contraseña'),
        bullet('Hacé clic en tu nombre en el encabezado.'),
        bullet('Seleccioná "Cambiar contraseña".'),
        bullet('Ingresá la nueva contraseña (mínimo 6 caracteres).'),
        bullet('Confirmá la contraseña ingresándola nuevamente.'),
        bullet('Hacé clic en "Guardar".'),
        spacer(),
        infoBox('Se recomienda usar contraseñas de al menos 8 caracteres con combinación de letras y números.'),

        pageBreak(),

        // ─── 17. GLOSARIO ───────────────────────────────────────────────
        h1('17. Glosario'),
        spacer(),
        fieldTable([
          ['Admin / Administrador', 'Usuario con acceso completo a todas las secciones y funciones del sistema.'],
          ['Dependencia', 'Relación entre tareas que indica que una tarea no puede iniciar hasta que la predecesora esté completada.'],
          ['Estado', 'Indicador del progreso de un proyecto, línea, tarea o subtarea.'],
          ['Fecha de fin calculada', 'Fecha resultante de sumar la duración en días a la fecha de inicio.'],
          ['KPI', 'Key Performance Indicator — indicador clave de desempeño que resume el estado general.'],
          ['Línea de Acción', 'Eje temático dentro de un proyecto. Agrupa tareas relacionadas.'],
          ['Log de auditoría', 'Registro cronológico de todas las operaciones realizadas en el sistema.'],
          ['Métrica de éxito', 'Indicador definido para determinar si el proyecto/línea/tarea fue exitoso.'],
          ['Patrocinador', 'Usuario institucional responsable del proyecto o línea, generalmente de nivel directivo.'],
          ['Permiso de lectura', 'Capacidad de ver una sección sin poder modificarla.'],
          ['Permiso de escritura', 'Capacidad de crear, editar y eliminar en una sección.'],
          ['Proyecto restringido', 'Proyecto habilitado específicamente para un usuario en la configuración de su perfil.'],
          ['Responsable', 'Usuario a cargo de la ejecución de una línea, tarea o subtarea.'],
          ['Rol', 'Conjunto de permisos por sección asignado a un grupo de usuarios.'],
          ['SIAP', 'Sistema de Administración de Proyectos — nombre oficial de la plataforma.'],
          ['Subtarea', 'Actividad de detalle dentro de una tarea, para seguimiento granular.'],
          ['Tarea', 'Actividad concreta dentro de una línea de acción. Máximo 3 por línea.'],
        ]),

        spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '— Fin del Manual —', size: 20, color: GRAY, italics: true })],
          spacing: { before: 400 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'SIAP v2.1 · Ministerio de Economía', size: 18, color: GRAY })],
          spacing: { before: 80 },
        }),
      ],
    },
  ],
})

Packer.toBuffer(doc).then(buffer => {
  writeFileSync('/home/user/siap/SIAP-Manual-de-Usuario.docx', buffer)
  console.log('✓ Manual generado: SIAP-Manual-de-Usuario.docx')
})
