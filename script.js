// =============================================
// VARIABLES GLOBALES
// =============================================
let encuestas = [];
const TECNICOS = ['Roberto', 'Chantely', 'David'];
let usuarioLogueado = false;
const MAX_STORAGE_KB = 5120; // 5MB máximo de almacenamiento
let charts = {}; // Objeto para almacenar las instancias de gráficas

// =============================================
// SISTEMA DE LOGIN Y NAVEGACIÓN
// =============================================
function mostrarLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainContent').style.opacity = '0.3';
}

function ocultarLogin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.opacity = '1';
    document.getElementById('loginError').style.display = 'none';
    // Limpiar campos de login
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

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

function mostrarPanelAdmin() {
    document.getElementById('adminPanel').style.display = 'block';
    cargarDatos();
    actualizarContadorAlmacenamiento();
    // Mostrar la pestaña de estadísticas por defecto
    abrirTab(null, 'tabEstadisticas');
}

function cerrarSesion() {
    usuarioLogueado = false;
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('mainContent').style.opacity = '1';
    // Destruir gráficas al cerrar sesión
    destruirGraficas();
}

// Permitir login con Enter
document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        validarLogin();
    }
});

// =============================================
// SISTEMA DE PESTAÑAS
// =============================================
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
    
    // Si se abre la pestaña de gráficas, generarlas
    if (tabName === 'tabGraficas') {
        setTimeout(() => {
            generarGraficas();
        }, 100);
    }
}

// =============================================
// FUNCIONES DE INICIALIZACIÓN
// =============================================
function cargarDatos() {
    encuestas = cargarEncuestas();
    actualizarEstadisticas();
    configurarValidacionTiempoReal();
}

// =============================================
// FUNCIONES DE GESTIÓN DE DATOS
// =============================================
function cargarEncuestas() {
    const encuestasGuardadas = localStorage.getItem('encuestasSatisfaccionTI');
    return encuestasGuardadas ? JSON.parse(encuestasGuardadas) : [];
}

function guardarEncuestas() {
    localStorage.setItem('encuestasSatisfaccionTI', JSON.stringify(encuestas));
    if (usuarioLogueado) {
        actualizarContadorAlmacenamiento();
    }
}

// =============================================
// CONTADOR DE ALMACENAMIENTO
// =============================================
function actualizarContadorAlmacenamiento() {
    if (!usuarioLogueado) return;
    
    // Calcular tamaño actual de almacenamiento
    const encuestasData = JSON.stringify(encuestas);
    const tamañoBytes = new Blob([encuestasData]).size;
    const tamañoKB = (tamañoBytes / 1024).toFixed(2);
    const porcentajeUso = (tamañoBytes / (MAX_STORAGE_KB * 1024)) * 100;
    
    // Estimar cuántas encuestas más caben
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
function actualizarEstadisticas() {
    if (!usuarioLogueado) return;

    // Estadísticas generales
    document.getElementById('totalEncuestas').textContent = encuestas.length;
    
    if (encuestas.length > 0) {
        const sumaSoporte = encuestas.reduce((total, encuesta) => 
            total + parseInt(encuesta.calificacion_soporte), 0);
        const promedioSoporte = (sumaSoporte / encuestas.length).toFixed(1);
        document.getElementById('promedioSoporte').textContent = promedioSoporte;
        
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

function insertSuggestion(texto) {
    document.getElementById('falla').value = texto;
}

function mostrarError(elementoId, mostrar) {
    const errorElement = document.getElementById(elementoId + 'Error');
    if (errorElement) {
        errorElement.style.display = mostrar ? 'block' : 'none';
    }
}

// =============================================
// GRÁFICAS
// =============================================
function generarGraficas() {
    if (encuestas.length === 0) {
        // Mostrar mensaje si no hay datos
        document.getElementById('tabGraficas').innerHTML = '<p style="text-align: center; color: #7f8c8d;">No hay datos suficientes para generar gráficas</p>';
        return;
    }
    
    // Destruir gráficas existentes
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

function calcularDatosGraficas() {
    const datos = {
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
    
    document.querySelectorAll('input[name="soporte"], input[name="tiempo"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const name = this.getAttribute('name');
            const seleccionado = document.querySelector(`input[name="${name}"]:checked`);
            mostrarError(name, !seleccionado);
        });
    });
}

function validarFormulario() {
    const camposRequeridos = [
        {id: 'nombre', valor: document.getElementById('nombre').value.trim()},
        {id: 'atendio', valor: document.getElementById('atendio').value},
        {id: 'falla', valor: document.getElementById('falla').value.trim()},
        {id: 'resuelto', valor: document.getElementById('resuelto').value}
    ];
    
    let valido = true;
    
    camposRequeridos.forEach(campo => {
        if (campo.valor === '') {
            mostrarError(campo.id, true);
            valido = false;
        } else {
            mostrarError(campo.id, false);
        }
    });
    
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

function crearHojaResumenGeneral(datos) {
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
document.getElementById('encuestaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validarFormulario()) {
        alert('Por favor completa todos los campos obligatorios correctamente.');
        return;
    }
    
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
    
    encuestas.push(nuevaEncuesta);
    guardarEncuestas();
    
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