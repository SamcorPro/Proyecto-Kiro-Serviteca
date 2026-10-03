/* ============================================================
   SERVITECA ADSO - Sistema de Gestión Automotriz
   script.js - Lógica principal de la aplicación
   ============================================================ */

'use strict';

/* ============================================================
   CONSTANTES DE LOCALSTORE KEYS
   ============================================================ */
const LS_USUARIOS  = 'serviteca_usuarios';
const LS_CLIENTES  = 'serviteca_clientes';
const LS_CARROS    = 'serviteca_carros';
const LS_SERVICIOS = 'serviteca_servicios';
const LS_SESSION   = 'serviteca_session';

/* ============================================================
   INICIALIZACIÓN
   Cuando el DOM está listo, se inicializa la app
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  inicializarDatosPredeterminados();
  verificarSesion();
  configurarEnterLogin();
});

/* ============================================================
   DATOS PREDETERMINADOS
   Crea el usuario admin si no existe ningún usuario guardado
   ============================================================ */
function inicializarDatosPredeterminados() {
  const usuarios = lsGet(LS_USUARIOS);
  if (usuarios.length === 0) {
    // Usuario administrador por defecto
    lsSet(LS_USUARIOS, [
      { username: 'admin', password: 'admin123', nombre: 'Administrador' }
    ]);
  }
}

/* ============================================================
   LOCALSTORE HELPERS
   Encapsulan JSON.parse / JSON.stringify con manejo de errores
   ============================================================ */

/** Lee un array desde LocalStorage. Retorna [] si no existe o hay error. */
function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Guarda un array en LocalStorage. */
function lsSet(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ============================================================
   GESTIÓN DE SESIÓN
   ============================================================ */

/** Verifica si ya hay sesión activa al cargar la página. */
function verificarSesion() {
  const session = lsGet(LS_SESSION);
  if (session && session.username) {
    mostrarApp(session.username);
  } else {
    mostrarLogin();
  }
}

/** Muestra la pantalla de login. */
function mostrarLogin() {
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('screen-login').classList.remove('hidden');
  document.getElementById('screen-app').classList.add('hidden');
  document.getElementById('screen-app').classList.remove('active');
}

/** Muestra la aplicación principal con el usuario autenticado. */
function mostrarApp(username) {
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-login').classList.add('hidden');
  document.getElementById('screen-app').classList.remove('hidden');
  document.getElementById('screen-app').classList.add('active');

  // Mostrar el nombre del usuario en la interfaz
  document.getElementById('sidebar-username').textContent = username;
  document.getElementById('topbar-username').textContent = username;

  // Ir al dashboard y actualizar estadísticas
  navegarA('dashboard');
}

/** Permite usar Enter en los campos del login. */
function configurarEnterLogin() {
  ['login-username', 'login-password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') iniciarSesion();
    });
  });
}

/** Alterna visibilidad de la contraseña en el login. */
function togglePassword() {
  const input = document.getElementById('login-password');
  const icon  = document.getElementById('toggle-pass-icon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

/** Procesa el inicio de sesión validando credenciales. */
function iniciarSesion() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');

  // Ocultar error previo
  errorEl.classList.add('hidden');
  errorEl.textContent = '';

  // Validar campos vacíos
  if (!username || !password) {
    mostrarAlertaLogin('⚠️ Por favor complete todos los campos.', 'danger');
    return;
  }

  // Buscar usuario en LocalStorage
  const usuarios = lsGet(LS_USUARIOS);
  const usuario = usuarios.find(
    u => u.username === username && u.password === password
  );

  if (!usuario) {
    mostrarAlertaLogin('❌ Usuario o contraseña incorrectos. Verifique sus datos.', 'danger');
    // Sacudir el formulario para dar feedback visual
    const card = document.querySelector('.login-card');
    card.style.animation = 'none';
    card.offsetHeight; // reflow
    card.style.animation = '';
    return;
  }

  // Guardar sesión
  lsSet(LS_SESSION, [{ username: usuario.username, nombre: usuario.nombre }]);
  mostrarApp(usuario.nombre || usuario.username);
}

/** Muestra un mensaje de error/éxito en la pantalla de login. */
function mostrarAlertaLogin(mensaje, tipo) {
  const el = document.getElementById('login-error');
  el.className = `alert alert-${tipo}`;
  el.innerHTML = `<i class="fas fa-${tipo === 'danger' ? 'exclamation-circle' : 'check-circle'}"></i> ${mensaje}`;
  el.classList.remove('hidden');
}

/** Cierra la sesión y regresa al login. */
function cerrarSesion() {
  lsSet(LS_SESSION, []);
  // Limpiar campos del login para seguridad
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').classList.add('hidden');
  mostrarLogin();
  mostrarToast('Sesión cerrada correctamente.', 'info');
}

/* ============================================================
   NAVEGACIÓN ENTRE MÓDULOS
   ============================================================ */

/** Navega a un módulo de la aplicación. */
function navegarA(modulo) {
  // Ocultar todos los módulos
  document.querySelectorAll('.module').forEach(m => {
    m.classList.remove('active');
    m.classList.add('hidden');
  });

  // Mostrar el módulo solicitado
  const target = document.getElementById(`mod-${modulo}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }

  // Actualizar menú activo en el sidebar
  document.querySelectorAll('.menu-item[data-module]').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.module === modulo) item.classList.add('active');
  });

  // Actualizar título del topbar
  const titulos = {
    dashboard: 'Dashboard',
    clientes:  'Módulo Clientes',
    carros:    'Módulo Carros',
    servicios: 'Módulo Servicios',
    ayuda:     'Ayuda'
  };
  document.getElementById('topbar-title').textContent = titulos[modulo] || modulo;

  // Acciones específicas al entrar a un módulo
  if (modulo === 'dashboard') actualizarDashboard();
  if (modulo === 'clientes')  cargarTablaClientes();
  if (modulo === 'carros')    cargarTablaCarros();
  if (modulo === 'servicios') cargarTablaServicios();

  // Cerrar sidebar en móvil
  cerrarSidebarMovil();

  // Scroll al inicio del contenido
  document.getElementById('main-content').scrollTop = 0;
}

/* ============================================================
   SIDEBAR (responsive)
   ============================================================ */

function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const isOpen   = sidebar.classList.contains('open');

  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  }
}

function cerrarSidebarMovil() {
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
  }
}

/* ============================================================
   TABS (submenús dentro de módulos)
   ============================================================ */

/**
 * Cambia el tab activo dentro de un módulo.
 * @param {HTMLElement} btn   - Botón clickeado
 * @param {string}      tabId - ID del contenido a mostrar
 */
function cambiarTab(btn, tabId) {
  // Desactivar todos los botones del mismo grupo
  const parent = btn.closest('.submenu-tabs');
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Obtener el módulo padre para buscar solo sus tabs
  const modulo = btn.closest('.module');
  modulo.querySelectorAll('.tab-content').forEach(tc => {
    tc.classList.add('hidden');
    tc.classList.remove('active');
  });

  const content = document.getElementById(tabId);
  if (content) {
    content.classList.remove('hidden');
    content.classList.add('active');
  }

  // Actualizar listas cuando se cambia a listar
  if (tabId === 'cli-listar')  cargarTablaClientes();
  if (tabId === 'car-listar')  cargarTablaCarros();
  if (tabId === 'srv-listar')  cargarTablaServicios();
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function actualizarDashboard() {
  const clientes  = lsGet(LS_CLIENTES);
  const carros    = lsGet(LS_CARROS);
  const servicios = lsGet(LS_SERVICIOS);

  // Estadísticas
  document.getElementById('stat-clientes').textContent  = clientes.length;
  document.getElementById('stat-carros').textContent    = carros.length;
  document.getElementById('stat-servicios').textContent = servicios.length;

  // Servicios de hoy
  const hoy = new Date().toISOString().split('T')[0];
  const hoyCount = servicios.filter(s => s.fecha === hoy).length;
  document.getElementById('stat-hoy').textContent = hoyCount;

  // Últimos servicios (máximo 5)
  const contenedor = document.getElementById('dashboard-ultimos-servicios');
  const ultimos = [...servicios].reverse().slice(0, 5);

  if (ultimos.length === 0) {
    contenedor.innerHTML = '<p class="text-muted text-center"><i class="fas fa-info-circle"></i> No hay servicios registrados aún.</p>';
    return;
  }

  const iconosServicio = {
    'Cambio de Aceite': 'fas fa-oil-can',
    'Sincronización':   'fas fa-cogs',
    'Alineación':       'fas fa-car-alt',
    'Lavado':           'fas fa-shower'
  };

  contenedor.innerHTML = ultimos.map(srv => {
    const cliente = lsGet(LS_CLIENTES).find(c => c.id === srv.clienteId);
    const nombreCliente = cliente ? `${cliente.nombres} ${cliente.apellidos}` : srv.clienteId;
    const icono = iconosServicio[srv.tipo] || 'fas fa-wrench';
    return `
      <div class="recent-service-item">
        <div class="recent-service-icon"><i class="${icono}"></i></div>
        <div class="recent-service-info">
          <div class="recent-service-title">${srv.tipo} — Placa: ${srv.placa}</div>
          <div class="recent-service-sub">Cliente: ${nombreCliente}</div>
        </div>
        <div class="recent-service-date">${formatearFecha(srv.fecha)}</div>
      </div>`;
  }).join('');
}

/* ============================================================
   MÓDULO CLIENTES
   ============================================================ */

/** Guarda un nuevo cliente después de validar el formulario. */
function guardarCliente(e) {
  e.preventDefault();

  // Recoger valores
  const id        = document.getElementById('cli-id').value.trim();
  const nombres   = document.getElementById('cli-nombres').value.trim();
  const apellidos = document.getElementById('cli-apellidos').value.trim();
  const correo    = document.getElementById('cli-correo').value.trim();
  const celular   = document.getElementById('cli-celular').value.trim();

  // Limpiar errores previos
  limpiarErroresCliente();

  // Validar campos
  let hayError = false;

  if (!id) {
    mostrarErrorCampo('err-cli-id', 'cli-id', 'La identificación es obligatoria.');
    hayError = true;
  } else if (!/^\d{5,20}$/.test(id)) {
    mostrarErrorCampo('err-cli-id', 'cli-id', 'Solo números, entre 5 y 20 dígitos.');
    hayError = true;
  }

  if (!nombres) {
    mostrarErrorCampo('err-cli-nombres', 'cli-nombres', 'Los nombres son obligatorios.');
    hayError = true;
  } else if (nombres.length < 2) {
    mostrarErrorCampo('err-cli-nombres', 'cli-nombres', 'El nombre debe tener al menos 2 caracteres.');
    hayError = true;
  }

  if (!apellidos) {
    mostrarErrorCampo('err-cli-apellidos', 'cli-apellidos', 'Los apellidos son obligatorios.');
    hayError = true;
  } else if (apellidos.length < 2) {
    mostrarErrorCampo('err-cli-apellidos', 'cli-apellidos', 'El apellido debe tener al menos 2 caracteres.');
    hayError = true;
  }

  if (!correo) {
    mostrarErrorCampo('err-cli-correo', 'cli-correo', 'El correo es obligatorio.');
    hayError = true;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    mostrarErrorCampo('err-cli-correo', 'cli-correo', 'Formato de correo inválido.');
    hayError = true;
  }

  if (!celular) {
    mostrarErrorCampo('err-cli-celular', 'cli-celular', 'El celular es obligatorio.');
    hayError = true;
  } else if (!/^[0-9]{7,15}$/.test(celular)) {
    mostrarErrorCampo('err-cli-celular', 'cli-celular', 'Solo números, entre 7 y 15 dígitos.');
    hayError = true;
  }

  if (hayError) return;

  // Verificar duplicado
  const clientes = lsGet(LS_CLIENTES);
  if (clientes.find(c => c.id === id)) {
    mostrarAlertaModulo('cli-agregar-alert', `⚠️ Ya existe un cliente con la identificación <strong>${id}</strong>.`, 'warning');
    mostrarErrorCampo('err-cli-id', 'cli-id', 'Identificación ya registrada.');
    return;
  }

  // Guardar
  clientes.push({ id, nombres, apellidos, correo, celular });
  lsSet(LS_CLIENTES, clientes);

  // Feedback
  mostrarAlertaModulo('cli-agregar-alert', `✅ Cliente <strong>${nombres} ${apellidos}</strong> registrado correctamente.`, 'success');
  mostrarToast(`Cliente ${nombres} ${apellidos} registrado correctamente.`, 'success');
  limpiarFormCliente();
}

/** Busca un cliente por su identificación y muestra el resultado. */
function consultarCliente() {
  const idBuscar  = document.getElementById('cli-buscar-id').value.trim();
  const resultado = document.getElementById('cli-resultado-busqueda');

  if (!idBuscar) {
    resultado.innerHTML = `<div class="alert alert-warning"><i class="fas fa-exclamation-circle"></i> Ingrese una identificación para buscar.</div>`;
    return;
  }

  const clientes = lsGet(LS_CLIENTES);
  const cliente  = clientes.find(c => c.id === idBuscar);

  if (!cliente) {
    resultado.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-times-circle"></i>
        Cliente no encontrado con la identificación <strong>${idBuscar}</strong>.
      </div>`;
    return;
  }

  // Contar carros y servicios asociados
  const carrosCliente    = lsGet(LS_CARROS).filter(/* No tenemos relación directa cliente-carro */() => false);
  const serviciosCliente = lsGet(LS_SERVICIOS).filter(s => s.clienteId === cliente.id);

  resultado.innerHTML = `
    <div class="result-card">
      <div class="result-card-header">
        <i class="fas fa-user-check"></i> Cliente Encontrado
      </div>
      <div class="result-card-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label"><i class="fas fa-id-card"></i> Identificación</span>
            <span class="info-value">${cliente.id}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="fas fa-user"></i> Nombres</span>
            <span class="info-value">${cliente.nombres}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="fas fa-user"></i> Apellidos</span>
            <span class="info-value">${cliente.apellidos}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="fas fa-envelope"></i> Correo</span>
            <span class="info-value">${cliente.correo}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="fas fa-mobile-alt"></i> Celular</span>
            <span class="info-value">${cliente.celular}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="fas fa-wrench"></i> Servicios Tomados</span>
            <span class="info-value">${serviciosCliente.length}</span>
          </div>
        </div>
      </div>
      ${serviciosCliente.length > 0 ? `
      <div class="result-card-actions">
        <button class="btn btn-primary btn-sm" onclick="verServiciosCliente('${cliente.id}')">
          <i class="fas fa-history"></i> Ver servicios del cliente
        </button>
      </div>` : ''}
    </div>`;
}

/** Muestra en el módulo de servicios los servicios de un cliente específico. */
function verServiciosCliente(clienteId) {
  navegarA('servicios');
  setTimeout(() => {
    // Activar tab consultar y buscar por cliente
    const btnConsultar = document.querySelector('[data-tab="srv-consultar"]');
    if (btnConsultar) {
      cambiarTab(btnConsultar, 'srv-consultar');
    }
    mostrarToast('Use la placa del vehículo para consultar los servicios.', 'info');
  }, 300);
}

/** Carga la tabla de clientes. */
function cargarTablaClientes() {
  const clientes = lsGet(LS_CLIENTES);
  document.getElementById('badge-clientes').textContent = `${clientes.length} registro${clientes.length !== 1 ? 's' : ''}`;
  renderTablaClientes(clientes);
}

/** Renderiza filas en la tabla de clientes. */
function renderTablaClientes(lista) {
  const tbody = document.getElementById('tbody-clientes');

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay clientes registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><strong>${c.id}</strong></td>
      <td>${c.nombres}</td>
      <td>${c.apellidos}</td>
      <td>${c.correo}</td>
      <td>${c.celular}</td>
      <td>
        <button class="btn btn-danger btn-icon btn-sm" title="Eliminar cliente"
          onclick="confirmarEliminarCliente('${c.id}', '${c.nombres} ${c.apellidos}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`).join('');
}

/** Filtra la tabla de clientes en tiempo real. */
function filtrarClientes() {
  const filtro   = document.getElementById('cli-filtro').value.toLowerCase();
  const clientes = lsGet(LS_CLIENTES);
  const filtrados = clientes.filter(c =>
    c.id.includes(filtro) ||
    c.nombres.toLowerCase().includes(filtro) ||
    c.apellidos.toLowerCase().includes(filtro) ||
    c.correo.toLowerCase().includes(filtro)
  );
  renderTablaClientes(filtrados);
}

/** Limpia el formulario de clientes y sus errores. */
function limpiarFormCliente() {
  document.getElementById('form-cliente').reset();
  limpiarErroresCliente();
}

function limpiarErroresCliente() {
  ['cli-id','cli-nombres','cli-apellidos','cli-correo','cli-celular'].forEach(id => {
    const input = document.getElementById(id);
    if (input) { input.classList.remove('error', 'success'); }
  });
  ['err-cli-id','err-cli-nombres','err-cli-apellidos','err-cli-correo','err-cli-celular'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  ocultarAlerta('cli-agregar-alert');
}

/** Solicita confirmación antes de eliminar un cliente. */
function confirmarEliminarCliente(id, nombre) {
  abrirModal(
    '¿Eliminar cliente?',
    `¿Está seguro de que desea eliminar al cliente <strong>${nombre}</strong>? Esta acción no se puede deshacer.`,
    () => eliminarCliente(id)
  );
}

/** Elimina un cliente y sus servicios asociados. */
function eliminarCliente(id) {
  // Verificar si tiene servicios registrados
  const servicios = lsGet(LS_SERVICIOS);
  const conServicios = servicios.filter(s => s.clienteId === id);
  if (conServicios.length > 0) {
    mostrarToast(`No se puede eliminar: el cliente tiene ${conServicios.length} servicio(s) registrado(s).`, 'danger');
    return;
  }

  const clientes = lsGet(LS_CLIENTES).filter(c => c.id !== id);
  lsSet(LS_CLIENTES, clientes);
  cargarTablaClientes();
  mostrarToast('Cliente eliminado correctamente.', 'success');
}

/* ============================================================
   MÓDULO CARROS
   ============================================================ */

/** Guarda un nuevo carro después de validar el formulario. */
function guardarCarro(e) {
  e.preventDefault();

  const placa  = document.getElementById('car-placa').value.trim().toUpperCase();
  const marca  = document.getElementById('car-marca').value.trim();
  const modelo = document.getElementById('car-modelo').value.trim();

  limpiarErroresCarro();
  let hayError = false;

  if (!placa) {
    mostrarErrorCampo('err-car-placa', 'car-placa', 'La placa es obligatoria.');
    hayError = true;
  } else if (!/^[A-Z0-9]{3,8}$/.test(placa)) {
    mostrarErrorCampo('err-car-placa', 'car-placa', 'Placa inválida (letras y números, 3-8 caracteres).');
    hayError = true;
  }

  if (!marca) {
    mostrarErrorCampo('err-car-marca', 'car-marca', 'La marca es obligatoria.');
    hayError = true;
  } else if (marca.length < 2) {
    mostrarErrorCampo('err-car-marca', 'car-marca', 'La marca debe tener al menos 2 caracteres.');
    hayError = true;
  }

  const modeloNum = parseInt(modelo);
  if (!modelo) {
    mostrarErrorCampo('err-car-modelo', 'car-modelo', 'El modelo (año) es obligatorio.');
    hayError = true;
  } else if (isNaN(modeloNum) || modeloNum < 1950 || modeloNum > 2030) {
    mostrarErrorCampo('err-car-modelo', 'car-modelo', 'Año inválido (entre 1950 y 2030).');
    hayError = true;
  }

  if (hayError) return;

  // Verificar duplicado de placa
  const carros = lsGet(LS_CARROS);
  if (carros.find(c => c.placa === placa)) {
    mostrarAlertaModulo('car-agregar-alert', `⚠️ Ya existe un vehículo con la placa <strong>${placa}</strong>.`, 'warning');
    mostrarErrorCampo('err-car-placa', 'car-placa', 'Placa ya registrada.');
    return;
  }

  // Guardar
  carros.push({ placa, marca, modelo: modeloNum });
  lsSet(LS_CARROS, carros);

  mostrarAlertaModulo('car-agregar-alert', `✅ Vehículo <strong>${marca}</strong> con placa <strong>${placa}</strong> registrado correctamente.`, 'success');
  mostrarToast(`Carro ${marca} (${placa}) registrado correctamente.`, 'success');
  limpiarFormCarro();
}

/** Busca un carro por placa y muestra el resultado. */
function consultarCarro() {
  const placaBuscar = document.getElementById('car-buscar-placa').value.trim().toUpperCase();
  const resultado   = document.getElementById('car-resultado-busqueda');

  if (!placaBuscar) {
    resultado.innerHTML = `<div class="alert alert-warning"><i class="fas fa-exclamation-circle"></i> Ingrese una placa para buscar.</div>`;
    return;
  }

  const carros = lsGet(LS_CARROS);
  const carro  = carros.find(c => c.placa === placaBuscar);

  if (!carro) {
    resultado.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-times-circle"></i>
        Carro no encontrado con la placa <strong>${placaBuscar}</strong>.
      </div>`;
    return;
  }

  const serviciosCarro = lsGet(LS_SERVICIOS).filter(s => s.placa === carro.placa);

  resultado.innerHTML = `
    <div class="result-card">
      <div class="result-card-header">
        <i class="fas fa-car-side"></i> Vehículo Encontrado
      </div>
      <div class="result-card-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label"><i class="fas fa-id-badge"></i> Placa</span>
            <span class="info-value">${carro.placa}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="fas fa-industry"></i> Marca</span>
            <span class="info-value">${carro.marca}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="fas fa-calendar-alt"></i> Modelo</span>
            <span class="info-value">${carro.modelo}</span>
          </div>
          <div class="info-item">
            <span class="info-label"><i class="fas fa-wrench"></i> Servicios</span>
            <span class="info-value">${serviciosCarro.length}</span>
          </div>
        </div>
      </div>
      <div class="result-card-actions">
        <button class="btn btn-primary btn-sm" onclick="verServiciosDeCarro('${carro.placa}')">
          <i class="fas fa-history"></i> Ver historial de servicios
        </button>
      </div>
    </div>`;
}

/** Navega a consulta de servicios de un carro específico. */
function verServiciosDeCarro(placa) {
  navegarA('servicios');
  setTimeout(() => {
    const btnConsultar = document.querySelector('#mod-servicios [data-tab="srv-consultar"]');
    if (btnConsultar) cambiarTab(btnConsultar, 'srv-consultar');
    document.getElementById('srv-buscar-placa').value = placa;
    consultarServiciosPorPlaca();
  }, 300);
}

/** Carga la tabla de carros. */
function cargarTablaCarros() {
  const carros = lsGet(LS_CARROS);
  document.getElementById('badge-carros').textContent = `${carros.length} registro${carros.length !== 1 ? 's' : ''}`;
  renderTablaCarros(carros);
}

/** Renderiza filas en la tabla de carros. */
function renderTablaCarros(lista) {
  const tbody = document.getElementById('tbody-carros');

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay vehículos registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(c => `
    <tr>
      <td><strong>${c.placa}</strong></td>
      <td>${c.marca}</td>
      <td>${c.modelo}</td>
      <td>
        <button class="btn btn-primary btn-icon btn-sm" title="Ver servicios" style="margin-right:.3rem"
          onclick="verServiciosDeCarro('${c.placa}')">
          <i class="fas fa-history"></i>
        </button>
        <button class="btn btn-danger btn-icon btn-sm" title="Eliminar vehículo"
          onclick="confirmarEliminarCarro('${c.placa}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>`).join('');
}

/** Filtra la tabla de carros en tiempo real. */
function filtrarCarros() {
  const filtro = document.getElementById('car-filtro').value.toLowerCase();
  const carros = lsGet(LS_CARROS);
  const filtrados = carros.filter(c =>
    c.placa.toLowerCase().includes(filtro) ||
    c.marca.toLowerCase().includes(filtro) ||
    String(c.modelo).includes(filtro)
  );
  renderTablaCarros(filtrados);
}

/** Limpia el formulario de carros. */
function limpiarFormCarro() {
  document.getElementById('form-carro').reset();
  limpiarErroresCarro();
}

function limpiarErroresCarro() {
  ['car-placa','car-marca','car-modelo'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.classList.remove('error', 'success');
  });
  ['err-car-placa','err-car-marca','err-car-modelo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  ocultarAlerta('car-agregar-alert');
}

/** Confirma eliminación de un carro. */
function confirmarEliminarCarro(placa) {
  abrirModal(
    '¿Eliminar vehículo?',
    `¿Está seguro de que desea eliminar el vehículo con placa <strong>${placa}</strong>? Esta acción no se puede deshacer.`,
    () => eliminarCarro(placa)
  );
}

/** Elimina un carro (solo si no tiene servicios). */
function eliminarCarro(placa) {
  const servicios = lsGet(LS_SERVICIOS);
  const conServicios = servicios.filter(s => s.placa === placa);
  if (conServicios.length > 0) {
    mostrarToast(`No se puede eliminar: la placa ${placa} tiene ${conServicios.length} servicio(s) registrado(s).`, 'danger');
    return;
  }

  const carros = lsGet(LS_CARROS).filter(c => c.placa !== placa);
  lsSet(LS_CARROS, carros);
  cargarTablaCarros();
  mostrarToast(`Vehículo con placa ${placa} eliminado correctamente.`, 'success');
}

/* ============================================================
   MÓDULO SERVICIOS
   ============================================================ */

/**
 * Verifica en tiempo real si el carro existe al escribir en el campo de placa
 * del formulario de servicios.
 */
function verificarCarroEnServicio() {
  const placa  = document.getElementById('srv-placa').value.trim().toUpperCase();
  const errEl  = document.getElementById('err-srv-placa');
  const okEl   = document.getElementById('ok-srv-placa');
  errEl.textContent = '';
  okEl.textContent  = '';

  if (!placa) return;

  const carros = lsGet(LS_CARROS);
  const existe = carros.find(c => c.placa === placa);

  if (existe) {
    okEl.innerHTML = `<i class="fas fa-check-circle"></i> Vehículo encontrado: ${existe.marca} ${existe.modelo}`;
    document.getElementById('srv-placa').classList.remove('error');
    document.getElementById('srv-placa').classList.add('success');
  } else if (placa.length >= 3) {
    errEl.innerHTML = `<i class="fas fa-times-circle"></i> Placa no encontrada en el sistema.`;
    document.getElementById('srv-placa').classList.add('error');
    document.getElementById('srv-placa').classList.remove('success');
  }
}

/**
 * Verifica en tiempo real si el cliente existe al escribir su identificación.
 */
function verificarClienteEnServicio() {
  const idCliente = document.getElementById('srv-cliente-id').value.trim();
  const errEl     = document.getElementById('err-srv-cliente-id');
  const okEl      = document.getElementById('ok-srv-cliente-id');
  errEl.textContent = '';
  okEl.textContent  = '';

  if (!idCliente) return;

  const clientes = lsGet(LS_CLIENTES);
  const cliente  = clientes.find(c => c.id === idCliente);

  if (cliente) {
    okEl.innerHTML = `<i class="fas fa-check-circle"></i> Cliente: ${cliente.nombres} ${cliente.apellidos}`;
    document.getElementById('srv-cliente-id').classList.remove('error');
    document.getElementById('srv-cliente-id').classList.add('success');
  } else if (idCliente.length >= 5) {
    errEl.innerHTML = `<i class="fas fa-times-circle"></i> Cliente no encontrado.`;
    document.getElementById('srv-cliente-id').classList.add('error');
    document.getElementById('srv-cliente-id').classList.remove('success');
  }
}

/** Guarda un nuevo servicio después de validar el formulario. */
function guardarServicio(e) {
  e.preventDefault();

  const placa     = document.getElementById('srv-placa').value.trim().toUpperCase();
  const clienteId = document.getElementById('srv-cliente-id').value.trim();
  const fecha     = document.getElementById('srv-fecha').value;
  const tipo      = document.getElementById('srv-tipo').value;

  limpiarErroresServicio();
  let hayError = false;

  // Validar placa
  if (!placa) {
    mostrarErrorCampo('err-srv-placa', 'srv-placa', 'La placa del carro es obligatoria.');
    hayError = true;
  } else {
    const carro = lsGet(LS_CARROS).find(c => c.placa === placa);
    if (!carro) {
      mostrarErrorCampo('err-srv-placa', 'srv-placa', `La placa "${placa}" no está registrada en el sistema.`);
      hayError = true;
    }
  }

  // Validar cliente
  if (!clienteId) {
    mostrarErrorCampo('err-srv-cliente-id', 'srv-cliente-id', 'La identificación del cliente es obligatoria.');
    hayError = true;
  } else {
    const cliente = lsGet(LS_CLIENTES).find(c => c.id === clienteId);
    if (!cliente) {
      mostrarErrorCampo('err-srv-cliente-id', 'srv-cliente-id', `El cliente con ID "${clienteId}" no está registrado.`);
      hayError = true;
    }
  }

  // Validar fecha
  if (!fecha) {
    mostrarErrorCampo('err-srv-fecha', 'srv-fecha', 'La fecha del servicio es obligatoria.');
    hayError = true;
  }

  // Validar tipo
  if (!tipo) {
    mostrarErrorCampo('err-srv-tipo', 'srv-tipo', 'Seleccione un tipo de servicio.');
    hayError = true;
  }

  if (hayError) return;

  // Verificar duplicado exacto (misma placa + mismo tipo + misma fecha)
  const servicios = lsGet(LS_SERVICIOS);
  const duplicado = servicios.find(s => s.placa === placa && s.tipo === tipo && s.fecha === fecha && s.clienteId === clienteId);
  if (duplicado) {
    mostrarAlertaModulo('srv-agregar-alert', `⚠️ Ya existe un servicio idéntico registrado para esta placa, cliente, tipo y fecha.`, 'warning');
    return;
  }

  // Crear nuevo servicio con ID único
  const nuevoServicio = {
    id:        `SRV-${Date.now()}`,
    placa,
    clienteId,
    fecha,
    tipo
  };

  servicios.push(nuevoServicio);
  lsSet(LS_SERVICIOS, servicios);

  const cliente = lsGet(LS_CLIENTES).find(c => c.id === clienteId);
  const nombreCliente = cliente ? `${cliente.nombres} ${cliente.apellidos}` : clienteId;

  mostrarAlertaModulo('srv-agregar-alert', `✅ Servicio <strong>${tipo}</strong> para placa <strong>${placa}</strong> registrado correctamente.`, 'success');
  mostrarToast(`Servicio "${tipo}" registrado para ${placa}.`, 'success');
  limpiarFormServicio();
}

/** Consulta los servicios prestados a un vehículo por su placa. */
function consultarServiciosPorPlaca() {
  const placa     = document.getElementById('srv-buscar-placa').value.trim().toUpperCase();
  const resultado = document.getElementById('srv-resultado-busqueda');

  if (!placa) {
    resultado.innerHTML = `<div class="alert alert-warning"><i class="fas fa-exclamation-circle"></i> Ingrese una placa para buscar.</div>`;
    return;
  }

  const servicios = lsGet(LS_SERVICIOS).filter(s => s.placa === placa);
  const carros    = lsGet(LS_CARROS);
  const carro     = carros.find(c => c.placa === placa);

  if (!carro) {
    resultado.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-times-circle"></i>
        Carro no encontrado — la placa <strong>${placa}</strong> no está registrada en el sistema.
      </div>`;
    return;
  }

  if (servicios.length === 0) {
    resultado.innerHTML = `
      <div class="result-card">
        <div class="result-card-header"><i class="fas fa-car-side"></i> ${placa} — ${carro.marca} ${carro.modelo}</div>
        <div class="result-card-body">
          <div class="alert alert-info" style="margin:0">
            <i class="fas fa-info-circle"></i> No existen servicios para este vehículo.
          </div>
        </div>
      </div>`;
    return;
  }

  const filas = servicios.map(s => {
    const cliente = lsGet(LS_CLIENTES).find(c => c.id === s.clienteId);
    const nombreCliente = cliente ? `${cliente.nombres} ${cliente.apellidos}` : s.clienteId;
    return `
      <tr>
        <td>${s.placa}</td>
        <td>${badgeServicio(s.tipo)}</td>
        <td>${formatearFecha(s.fecha)}</td>
        <td>${nombreCliente}</td>
        <td>
          <button class="btn btn-danger btn-icon btn-sm" title="Eliminar servicio"
            onclick="confirmarEliminarServicio('${s.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
  }).join('');

  resultado.innerHTML = `
    <div class="result-card">
      <div class="result-card-header">
        <i class="fas fa-car-side"></i> ${placa} — ${carro.marca} ${carro.modelo}
        <span class="badge badge-warning" style="margin-left:auto">${servicios.length} servicio(s)</span>
      </div>
      <div class="result-card-body" style="padding:0">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Servicio</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

/** Carga la tabla de servicios. */
function cargarTablaServicios() {
  const servicios = lsGet(LS_SERVICIOS);
  document.getElementById('badge-servicios').textContent = `${servicios.length} registro${servicios.length !== 1 ? 's' : ''}`;
  renderTablaServicios(servicios);
}

/** Renderiza filas en la tabla de servicios. */
function renderTablaServicios(lista) {
  const tbody = document.getElementById('tbody-servicios');

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay servicios registrados.</td></tr>';
    return;
  }

  const clientes = lsGet(LS_CLIENTES);

  tbody.innerHTML = lista.map((s, i) => {
    const cliente = clientes.find(c => c.id === s.clienteId);
    const nombreCliente = cliente ? `${cliente.nombres} ${cliente.apellidos}` : s.clienteId;
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${s.placa}</strong></td>
        <td>${nombreCliente}</td>
        <td>${formatearFecha(s.fecha)}</td>
        <td>${badgeServicio(s.tipo)}</td>
        <td>
          <button class="btn btn-danger btn-icon btn-sm" title="Eliminar servicio"
            onclick="confirmarEliminarServicio('${s.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
  }).join('');
}

/** Filtra la tabla de servicios en tiempo real. */
function filtrarServicios() {
  const filtro    = document.getElementById('srv-filtro').value.toLowerCase();
  const servicios = lsGet(LS_SERVICIOS);
  const filtrados = servicios.filter(s =>
    s.placa.toLowerCase().includes(filtro) ||
    s.tipo.toLowerCase().includes(filtro) ||
    s.fecha.includes(filtro) ||
    s.clienteId.includes(filtro)
  );
  renderTablaServicios(filtrados);
}

/** Limpia el formulario de servicios. */
function limpiarFormServicio() {
  document.getElementById('form-servicio').reset();
  limpiarErroresServicio();
}

function limpiarErroresServicio() {
  ['srv-placa','srv-cliente-id','srv-fecha','srv-tipo'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.classList.remove('error', 'success');
  });
  ['err-srv-placa','err-srv-cliente-id','err-srv-fecha','err-srv-tipo',
   'ok-srv-placa','ok-srv-cliente-id'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  ocultarAlerta('srv-agregar-alert');
}

/** Confirma eliminación de un servicio. */
function confirmarEliminarServicio(id) {
  abrirModal(
    '¿Eliminar servicio?',
    '¿Está seguro de que desea eliminar este servicio? Esta acción no se puede deshacer.',
    () => eliminarServicio(id)
  );
}

/** Elimina un servicio del LocalStorage. */
function eliminarServicio(id) {
  const servicios = lsGet(LS_SERVICIOS).filter(s => s.id !== id);
  lsSet(LS_SERVICIOS, servicios);
  cargarTablaServicios();
  // Si la consulta por placa está visible, actualizarla
  const placa = document.getElementById('srv-buscar-placa')?.value;
  if (placa) consultarServiciosPorPlaca();
  mostrarToast('Servicio eliminado correctamente.', 'success');
}

/* ============================================================
   MODAL DE CONFIRMACIÓN
   ============================================================ */

let _modalCallback = null;

/** Abre el modal de confirmación y registra el callback. */
function abrirModal(titulo, mensaje, callback) {
  document.getElementById('modal-title').textContent   = titulo;
  document.getElementById('modal-message').innerHTML   = mensaje;
  _modalCallback = callback;
  const modal = document.getElementById('modal-confirm');
  modal.classList.remove('hidden');
  modal.classList.add('active');
}

/** Ejecuta el callback y cierra el modal. */
function modalConfirmar() {
  if (typeof _modalCallback === 'function') _modalCallback();
  _modalCallback = null;
  cerrarModal();
}

/** Cierra el modal sin ejecutar nada. */
function cerrarModal() {
  const modal = document.getElementById('modal-confirm');
  modal.classList.add('hidden');
  modal.classList.remove('active');
  _modalCallback = null;
}

// Cerrar modal al hacer clic fuera del box
document.addEventListener('click', e => {
  const modal = document.getElementById('modal-confirm');
  if (e.target === modal) cerrarModal();
});

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */

/**
 * Muestra una notificación tipo toast.
 * @param {string} mensaje  - Texto del mensaje
 * @param {string} tipo     - 'success' | 'danger' | 'warning' | 'info'
 * @param {number} duracion - Milisegundos (default 3500)
 */
function mostrarToast(mensaje, tipo = 'info', duracion = 3500) {
  const iconos = {
    success: 'fa-check-circle',
    danger:  'fa-times-circle',
    warning: 'fa-exclamation-circle',
    info:    'fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    <i class="fas ${iconos[tipo] || iconos.info}"></i>
    <span>${mensaje}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>`;

  document.getElementById('toast-container').appendChild(toast);

  // Auto-remover
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duracion);
}

/* ============================================================
   ALERTAS DENTRO DE MÓDULOS
   ============================================================ */

function mostrarAlertaModulo(id, html, tipo) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${tipo}`;
  el.innerHTML = html;
  el.classList.remove('hidden');

  // Auto-ocultar después de 5 segundos para éxito
  if (tipo === 'success') {
    setTimeout(() => ocultarAlerta(id), 5000);
  }
}

function ocultarAlerta(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('hidden');
    el.textContent = '';
  }
}

/* ============================================================
   ERRORES EN CAMPOS DE FORMULARIO
   ============================================================ */

function mostrarErrorCampo(errId, inputId, mensaje) {
  const errEl   = document.getElementById(errId);
  const inputEl = document.getElementById(inputId);
  if (errEl)   { errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`; }
  if (inputEl) { inputEl.classList.add('error'); inputEl.classList.remove('success'); }
}

/* ============================================================
   UTILIDADES
   ============================================================ */

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a formato legible en español.
 * @param {string} isoDate
 * @returns {string}
 */
function formatearFecha(isoDate) {
  if (!isoDate) return '—';
  try {
    const [y, m, d] = isoDate.split('-');
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d} ${meses[parseInt(m,10)-1]} ${y}`;
  } catch {
    return isoDate;
  }
}

/**
 * Genera el HTML del badge de tipo de servicio con color según el tipo.
 * @param {string} tipo
 * @returns {string}
 */
function badgeServicio(tipo) {
  const clases = {
    'Cambio de Aceite': 'svc-aceite',
    'Sincronización':   'svc-sync',
    'Alineación':       'svc-alineacion',
    'Lavado':           'svc-lavado'
  };
  const iconos = {
    'Cambio de Aceite': 'fa-oil-can',
    'Sincronización':   'fa-cogs',
    'Alineación':       'fa-car-alt',
    'Lavado':           'fa-shower'
  };
  const cls   = clases[tipo]  || 'badge-info';
  const icono = iconos[tipo]  || 'fa-wrench';
  return `<span class="svc-badge ${cls}"><i class="fas ${icono}"></i> ${tipo}</span>`;
}

/* ============================================================
   ACCESIBILIDAD - Escape cierra el modal
   ============================================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-confirm');
    if (!modal.classList.contains('hidden')) cerrarModal();
  }
});

/* ============================================================
   FIN DEL SCRIPT
   ============================================================ */
