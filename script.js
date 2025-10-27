// =============================================
// VARIABLES GLOBALES
// =============================================
let encuestas = []; // Array para almacenar todas las encuestas
const TECNICOS = ['Roberto', 'Chantely', 'David']; // Lista fija de técnicos
let usuarioLogueado = false; // Estado de autenticación del usuario
const MAX_STORAGE_KB = 5120; // 5MB máximo de almacenamiento en localStorage
let charts = {}; // Objeto para almacenar las instancias de gráficas de Chart.js

// =============================================
// SISTEMA DE LOGIN Y NAVEGACIÓN
// =============================================

/**
 * Muestra el modal de login y oscurece el contenido principal
 */
function mostrarLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainContent').style.opacity = '0.3';
}

/**
 * Oculta el modal de login y restaura la opacidad del contenido
 */
function ocultarLogin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.opacity = '1';
    document.getElementById('loginError').style.display = 'none';
    // Limpiar campos de login
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

/**
 * Valida las credenciales de login
 * Usuario: SISTEMAS, Contraseña: SISTEMAS
 */
function validarLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorElement = document.getElementById('loginError');

    if (username === 'SISTEMAS' && password === 'SISTEMAS') {
        usuarioLogueado = true;
        ocultarLogin();
        mostrarPanelAdmin();
    } else {
        errorElement.textContent = 'Usuario o contraseña incorrectos';
        errorElement.style.display = 'block';
    }
}

/**
 * Muestra el panel de administración y carga los datos
 */
function mostrarPanelAdmin() {
    document.getElementById('adminPanel').style.display = 'block';
    cargarDatos();
    actualizarContadorAlmacenamiento();
    // Mostrar la pestaña de estadísticas por defecto
    abrirTab(null, 'tabEstadisticas');
}

/**
 * Cierra la sesión del administrador y oculta el panel
 */
function cerrarSesion() {
    usuarioLogueado = false;
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('mainContent').style.opacity = '1';
    // Destruir gráficas al cerrar sesión para liberar memoria
    destruirGraficas();
}

// Permitir login con Enter en el campo de contraseña
document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        validarLogin();
    }
});

// =============================================
// SISTEMA DE PESTAÑAS
// =============================================

/**
 * Controla la navegación entre pestañas del panel administrativo
 * @param {Event} evt - Evento del click
 * @param {string} tabName - ID de la pestaña a mostrar
 */
function abrirTab(evt, tabName) {
    // Ocultar todos los contenidos de pestañas
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    // Desactivar todos los botones de pestañas
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    
    // Mostrar la pestaña actual y activar el botón
    document.getElementById(tabName).classList.add('active');
    if (evt) {
        evt.currentTarget.classList.add('active');
    } else {
        // Si no hay evento (carga inicial), activar el primer botón
        document.querySelector('.tab-button').classList.add('active');
    }
    
    // Si se abre la pestaña de gráficas, generarlas con delay para asegurar renderizado
    if (tabName === 'tabGraficas') {
        setTimeout(() => {
            generarGraficas();
        }, 100);
    }
}

// =============================================
// FUNCIONES DE INICIALIZACIÓN
// =============================================

/**
 * Función principal de carga de datos al iniciar
 */
function cargarDatos() {
    encuestas = cargarEncuestas();
    actualizarEstadisticas();
    configurarValidacionTiempoReal();
}

// =============================================
// FUNCIONES DE GESTIÓN DE DATOS
// =============================================

/**
 * Carga las encuestas desde localStorage
 * @returns {Array} Array de encuestas o array vacío si no hay datos
 */
function cargarEncuestas() {
    const encuestasGuardadas = localStorage.getItem('encuestasSatisfaccionTI');
    return encuestasGuardadas ? JSON.parse(encuestasGuardadas) : [];
}

/**
 * Guarda las encuestas en localStorage y actualiza contadores
 */
function guardarEncuestas() {
    localStorage.setItem('encuestasSatisfaccionTI', JSON.stringify(encuestas));
    if (usuarioLogueado) {
        actualizarContadorAlmacenamiento();
    }
}

// =============================================
// CONTADOR DE ALMACENAMIENTO
// =============================================

/**
 * Calcula y muestra el uso actual de almacenamiento
 */
function actualizarContadorAlmacenamiento() {
    if (!usuarioLogueado) return;
    
    // Calcular tamaño actual de almacenamiento
    const encuestasData = JSON.stringify(encuestas);
    const tamañoBytes = new Blob([encuestasData]).size;
    const tamañoKB = (tamañoBytes / 1024).toFixed(2);
    const porcentajeUso = (tamañoBytes / (MAX_STORAGE_KB * 1024)) * 100;
    
    // Estimar cuántas encuestas más caben basado en el tamaño promedio
    const tamañoPromedioEncuesta = encuestas.length > 0 ? tamañoBytes / encuestas.length : 300;
    const encuestasRestantes = Math.floor(((MAX_STORAGE_KB * 1024) - tamañoBytes) / tamañoPromedioEncuesta);
    
    // Actualizar la interfaz
    document.getElementById('storageFill').style.width = `${Math.min(porcentajeUso, 100)}%`;
    document.getElementById('storageUsed').textContent = `${tamañoKB} KB usados`;
    document.getElementById('storageRemaining').textContent = `Restan: ${encuestasRestantes} encuestas aprox.`;
    
    // Cambiar color según el nivel de uso
    const storageFill = document.getElementById('storageFill');
    if (porcentajeUso > 90) {
        storageFill.style.background = 'linear-gradient(to right, #e74c3c, #c0392b)';
    } else if (porcentajeUso > 70) {
        storageFill.style.background = 'linear-gradient(to right, #f39c12, #e67e22)';
    } else {
        storageFill.style.background = 'linear-gradient(to right, #2ecc71, #27ae60)';
    }
}

// =============================================
// FUNCIONES DE INTERFAZ
// =============================================

/**
 * Actualiza todas las estadísticas mostradas en el panel administrativo
 */
function actualizarEstadisticas() {
    if (!usuarioLogueado) return;

    // Estadísticas generales
    document.getElementById('totalEncuestas').textContent = encuestas.length;
    
    if (encuestas.length > 0) {
        // Calcular promedio de soporte técnico
        const sumaSoporte = encuestas.reduce((total, encuesta) => 
            total + parseInt(encuesta.calificacion_soporte), 0);
        const promedioSoporte = (sumaSoporte / encuestas.length).toFixed(1);
        document.getElementById('promedioSoporte').textContent = promedioSoporte;
        
        // Calcular porcentaje de problemas resueltos
        const problemasResueltos = encuestas.filter(encuesta => 
            encuesta.problema_resuelto === 'Sí').length;
        const porcentajeResueltos = ((problemasResueltos / encuestas.length) * 100).toFixed(0);
        document.getElementById('problemasResueltos').textContent = porcentajeResueltos + '%';
    } else {
        document.getElementById('promedioSoporte').textContent = '0';
        document.getElementById('problemasResueltos').textContent = '0%';
    }
    
    // Estadísticas por técnico
    TECNICOS.forEach(tecnico => {
        const count = encuestas.filter(encuesta => encuesta.quien_atendio === tecnico).length;
        document.getElementById(`encuestas${tecnico}`).textContent = count;
    });
}

/**
 * Inserta texto de sugerencia en el campo de falla
 * @param {string} texto - Texto a insertar
 */
function insertSuggestion(texto) {
    document.getElementById('falla').value = texto;
}

/**
 * Muestra u oculta mensajes de error en los campos del formulario
 * @param {string} elementoId - ID del elemento
 * @param {boolean} mostrar - True para mostrar, false para ocultar
 */
function mostrarError(elementoId, mostrar) {
    const errorElement = document.getElementById(elementoId + 'Error');
    if (errorElement) {
        errorElement.style.display = mostrar ? 'block' : 'none';
    }
}

// =============================================
// GRÁFICAS
// =============================================

/**
 * Genera todas las gráficas del sistema
 */
function generarGraficas() {
    if (encuestas.length === 0) {
        // Mostrar mensaje si no hay datos
        document.getElementById('tabGraficas').innerHTML = '<p style="text-align: center; color: #7f8c8d;">No hay datos suficientes para generar gráficas</p>';
        return;
    }
    
    // Destruir gráficas existentes para evitar memory leaks
    destruirGraficas();
    
    // Generar datos para las gráficas
    const datosGraficas = calcularDatosGraficas();
    
    // Crear gráfica de calificación de soporte
    crearGraficaBarras('chartSoporte', 'Calificación del Soporte Técnico', 
        ['1', '2', '3', '4', '5'], 
        datosGraficas.soporte,
        ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60']
    );
    
    // Crear gráfica de tiempo de respuesta
    crearGraficaBarras('chartTiempo', 'Tiempo de Respuesta', 
        ['1', '2', '3', '4', '5'], 
        datosGraficas.tiempo,
        ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60']
    );
    
    // Crear gráfica de resolución de problemas
    crearGraficaDona('chartResolucion', 'Resolución de Problemas', 
        ['Sí', 'Parcialmente', 'No'], 
        [datosGraficas.resolucion.Sí, datosGraficas.resolucion.Parcialmente, datosGraficas.resolucion.No],
        ['#27ae60', '#f39c12', '#e74c3c']
    );
    
    // Crear gráfica de distribución por técnico
    crearGraficaDona('chartTecnicos', 'Distribución por Técnico', 
        TECNICOS, 
        TECNICOS.map(tecnico => datosGraficas.porTecnico[tecnico] || 0),
        ['#3498db', '#9b59b6', '#1abc9c']
    );
}

/**
 * Calcula los datos necesarios para generar las gráficas
 * @returns {Object} Objeto con datos organizados para gráficas
 */
function calcularDatosGraficas() {
    const datos = {
        porTecnico: {},
        soporte: [0,0,0,0,0],
        tiempo: [0,0,0,0,0],
        resolucion: {Sí:0, Parcialmente:0, No:0}
    };
    
    // Inicializar contadores para cada técnico
    TECNICOS.forEach(tecnico => datos.porTecnico[tecnico] = 0);
    
    // Contar todas las respuestas de las encuestas
    encuestas.forEach(encuesta => {
        // Por técnico
        datos.porTecnico[encuesta.quien_atendio]++;
        
        // Calificaciones (convertir a índice 0-based)
        const soporteIdx = parseInt(encuesta.calificacion_soporte) - 1;
        const tiempoIdx = parseInt(encuesta.tiempo_respuesta) - 1;
        
        if (soporteIdx >= 0) datos.soporte[soporteIdx]++;
        if (tiempoIdx >= 0) datos.tiempo[tiempoIdx]++;
        
        // Resolución
        if (datos.resolucion.hasOwnProperty(encuesta.problema_resuelto)) {
            datos.resolucion[encuesta.problema_resuelto]++;
        }
    });
    
    return datos;
}

/**
 * Crea una gráfica de barras
 * @param {string} canvasId - ID del elemento canvas
 * @param {string} titulo - Título de la gráfica
 * @param {Array} etiquetas - Etiquetas del eje X
 * @param {Array} datos - Datos a graficar
 * @param {Array} colores - Colores para las barras
 */
function crearGraficaBarras(canvasId, titulo, etiquetas, datos, colores) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: etiquetas,
            datasets: [{
                label: titulo,
                data: datos,
                backgroundColor: colores,
                borderColor: colores.map(color => color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * Crea una gráfica de dona
 * @param {string} canvasId - ID del elemento canvas
 * @param {string} titulo - Título de la gráfica
 * @param {Array} etiquetas - Etiquetas para cada segmento
 * @param {Array} datos - Datos a graficar
 * @param {Array} colores - Colores para los segmentos
 */
function crearGraficaDona(canvasId, titulo, etiquetas, datos, colores) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: etiquetas,
            datasets: [{
                label: titulo,
                data: datos,
                backgroundColor: colores,
                borderColor: colores.map(color => color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Destruye todas las gráficas existentes para liberar memoria
 */
function destruirGraficas() {
    // Destruir todas las gráficas existentes
    Object.values(charts).forEach(chart => {
        chart.destroy();
    });
    charts = {};
}

// =============================================
// VALIDACIÓN DEL FORMULARIO
// =============================================

/**
 * Configura la validación en tiempo real para todos los campos del formulario
 */
function configurarValidacionTiempoReal() {
    const campos = ['nombre', 'atendio', 'falla', 'resuelto'];
    
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            elemento.addEventListener('input', function() {
                mostrarError(campo, this.value === '');
            });
        }
    });
    
    // Validación para radio buttons
    document.querySelectorAll('input[name="soporte"], input[name="tiempo"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const name = this.getAttribute('name');
            const seleccionado = document.querySelector(`input[name="${name}"]:checked`);
            mostrarError(name, !seleccionado);
        });
    });
}

/**
 * Valida todo el formulario antes del envío
 * @returns {boolean} True si el formulario es válido
 */
function validarFormulario() {
    const camposRequeridos = [
        {id: 'nombre', valor: document.getElementById('nombre').value.trim()},
        {id: 'atendio', valor: document.getElementById('atendio').value},
        {id: 'falla', valor: document.getElementById('falla').value.trim()},
        {id: 'resuelto', valor: document.getElementById('resuelto').value}
    ];
    
    let valido = true;
    
    // Validar campos de texto/select
    camposRequeridos.forEach(campo => {
        if (campo.valor === '') {
            mostrarError(campo.id, true);
            valido = false;
        } else {
            mostrarError(campo.id, false);
        }
    });
    
    // Validar radio buttons
    if (!document.querySelector('input[name="soporte"]:checked')) {
        mostrarError('soporte', true);
        valido = false;
    }
    
    if (!document.querySelector('input[name="tiempo"]:checked')) {
        mostrarError('tiempo', true);
        valido = false;
    }
    
    return valido;
}

// =============================================
// GENERACIÓN DE EXCEL
// =============================================

/**
 * Descarga un archivo Excel con todas las encuestas organizadas
 */
function descargarExcelCompleto() {
    if (!usuarioLogueado) {
        alert('Debe iniciar sesión para descargar las encuestas.');
        return;
    }
    
    if (encuestas.length === 0) {
        alert('No hay encuestas guardadas para descargar.');
        return;
    }
    
    try {
        const workbook = crearExcelCompleto();
        const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, ''); // Solo fecha
        XLSX.writeFile(workbook, `Encuesta_Satisfaccion_TI_${fecha}.xlsx`);
        alert('✅ Excel descargado exitosamente!\n\nEl archivo contiene todas las encuestas organizadas por técnico.');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al generar el archivo.');
    }
}

/**
 * Crea la estructura completa del libro de Excel
 * @returns {Object} Workbook de SheetJS
 */
function crearExcelCompleto() {
    const workbook = XLSX.utils.book_new();
    
    // Hoja 1: Todas las encuestas
    const wsTodas = XLSX.utils.json_to_sheet(encuestas);
    XLSX.utils.book_append_sheet(workbook, wsTodas, "Todas las Encuestas");
    
    // Hojas por técnico
    TECNICOS.forEach(tecnico => {
        const encuestasTecnico = encuestas.filter(encuesta => encuesta.quien_atendio === tecnico);
        if (encuestasTecnico.length > 0) {
            const wsTecnico = XLSX.utils.json_to_sheet(encuestasTecnico);
            XLSX.utils.book_append_sheet(workbook, wsTecnico, `Encuestas ${tecnico}`);
        }
    });
    
    // Hoja de resumen general
    const datosResumen = calcularDatosResumen();
    const wsResumen = crearHojaResumenGeneral(datosResumen);
    XLSX.utils.book_append_sheet(workbook, wsResumen, "Resumen General");
    
    return workbook;
}

/**
 * Calcula datos resumidos para la hoja de resumen del Excel
 * @returns {Object} Datos organizados para el resumen
 */
function calcularDatosResumen() {
    if (encuestas.length === 0) {
        return {
            total: 0,
            porTecnico: {},
            soporte: [0,0,0,0,0],
            tiempo: [0,0,0,0,0],
            resolucion: {Sí:0, Parcialmente:0, No:0}
        };
    }
    
    const datos = {
        total: encuestas.length,
        porTecnico: {},
        soporte: [0,0,0,0,0],
        tiempo: [0,0,0,0,0],
        resolucion: {Sí:0, Parcialmente:0, No:0}
    };
    
    // Inicializar contadores
    TECNICOS.forEach(tecnico => datos.porTecnico[tecnico] = 0);
    
    // Contar todas las respuestas
    encuestas.forEach(encuesta => {
        // Por técnico
        datos.porTecnico[encuesta.quien_atendio]++;
        
        // Calificaciones
        const soporteIdx = parseInt(encuesta.calificacion_soporte) - 1;
        const tiempoIdx = parseInt(encuesta.tiempo_respuesta) - 1;
        
        if (soporteIdx >= 0) datos.soporte[soporteIdx]++;
        if (tiempoIdx >= 0) datos.tiempo[tiempoIdx]++;
        
        // Resolución
        if (datos.resolucion.hasOwnProperty(encuesta.problema_resuelto)) {
            datos.resolucion[encuesta.problema_resuelto]++;
        }
    });
    
    return datos;
}

/**
 * Crea la hoja de resumen general para el Excel
 * @param {Object} datos - Datos calculados para el resumen
 * @returns {Object} Worksheet de SheetJS
 */
function crearHojaResumenGeneral(datosResumen) {
    return XLSX.utils.aoa_to_sheet([
        ["RESUMEN GENERAL - ENCUESTAS DE SATISFACCIÓN TI"],
        [`Generado el: ${new Date().toLocaleDateString('es-ES')}`],
        [""],
        ["ESTADÍSTICAS GENERALES", "Valor", "Porcentaje"],
        ["Total de encuestas", datos.total, "100%"],
        ["Promedio calificación soporte", datos.total > 0 ? (datos.soporte.reduce((s,v,i)=>s+v*(i+1),0)/datos.total).toFixed(2) : 0, ""],
        ["Promedio calificación tiempo", datos.total > 0 ? (datos.tiempo.reduce((s,v,i)=>s+v*(i+1),0)/datos.total).toFixed(2) : 0, ""],
        ["Problemas resueltos", datos.resolucion.Sí, datos.total > 0 ? `${((datos.resolucion.Sí/datos.total)*100).toFixed(1)}%` : "0%"],
        [""],
        ["DISTRIBUCIÓN POR TÉCNICO", "Cantidad", "Porcentaje"],
        ...TECNICOS.map(tecnico => [
            tecnico, 
            datos.porTecnico[tecnico] || 0, 
            datos.total > 0 ? `${(((datos.porTecnico[tecnico] || 0)/datos.total)*100).toFixed(1)}%` : "0%"
        ])
    ]);
}

// =============================================
// REINICIO DE ENCUESTAS
// =============================================

/**
 * Reinicia todas las encuestas (elimina todos los datos)
 */
function reiniciarEncuestas() {
    if (!usuarioLogueado) {
        alert('Debe iniciar sesión para reiniciar las encuestas.');
        return;
    }
    
    if (encuestas.length === 0) {
        alert('No hay encuestas para reiniciar.');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres reiniciar todas las encuestas?\n\nEsta acción eliminará permanentemente todas las encuestas guardadas y no se puede deshacer.')) {
        encuestas = [];
        guardarEncuestas();
        actualizarEstadisticas();
        actualizarContadorAlmacenamiento();
        // Si está en la pestaña de gráficas, actualizarlas
        if (document.getElementById('tabGraficas').classList.contains('active')) {
            generarGraficas();
        }
        alert('Todas las encuestas han sido reiniciadas correctamente.');
    }
}

// =============================================
// MANEJADOR DEL FORMULARIO
// =============================================

/**
 * Event listener principal para el envío del formulario
 */
document.getElementById('encuestaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validarFormulario()) {
        alert('Por favor completa todos los campos obligatorios correctamente.');
        return;
    }
    
    // Crear nueva encuesta con los datos del formulario
    const nuevaEncuesta = {
        fecha: new Date().toLocaleDateString('es-ES'), // Solo fecha, sin hora
        nombre_usuario: document.getElementById('nombre').value.trim(),
        quien_atendio: document.getElementById('atendio').value,
        falla_reportada: document.getElementById('falla').value.trim(),
        calificacion_soporte: document.querySelector('input[name="soporte"]:checked').value,
        problema_resuelto: document.getElementById('resuelto').value,
        tiempo_respuesta: document.querySelector('input[name="tiempo"]:checked').value,
        comentarios: document.getElementById('comentarios').value
    };
    
    // Agregar encuesta y guardar
    encuestas.push(nuevaEncuesta);
    guardarEncuestas();
    
    // Actualizar interfaz si hay sesión activa
    if (usuarioLogueado) {
        actualizarEstadisticas();
        actualizarContadorAlmacenamiento();
        // Si está en la pestaña de gráficas, actualizarlas
        if (document.getElementById('tabGraficas').classList.contains('active')) {
            generarGraficas();
        }
    }
    
    // Mostrar mensaje de éxito
    document.getElementById('successMessage').style.display = 'block';
    
    // Limpiar formulario
    this.reset();
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        document.getElementById('successMessage').style.display = 'none';
    }, 5000);
});

// Cargar datos al iniciar (solo para estadísticas si hay sesión activa)
document.addEventListener('DOMContentLoaded', function() {
    encuestas = cargarEncuestas();
    configurarValidacionTiempoReal();
});
