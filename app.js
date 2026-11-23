/* ================= Utilidades ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dinero = n => '$ ' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaISO = d => new Date(Date.now() + d * 864e5).toLocaleDateString('en-CA');
const IVA = 0.16;
const sigId = arr => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;

function insignia(v) {
  const c = ['Activo', 'Disponible', 'Suficiente', 'Pagado', 'Entregado'].includes(v) ? 'ok'
    : ['Inactivo', 'Agotado', 'Stock bajo', 'Cancelado'].includes(v) ? 'mal' : 'neutro';
  return `<span class="insignia ${c}">${esc(v)}</span>`;
}

/* ================= Datos (se guardan en el navegador con localStorage) ================= */
function semilla() {
  const hoy = fechaISO(0), ayer = fechaISO(-1);
  return {
    usuarios: [
      { usuario: 'berenice', clave: 'admin123', nombre: 'Berenice', rol: 'admin' },
      { usuario: 'emmanuel', clave: 'mesero123', nombre: 'Emmanuel', rol: 'empleado' }
    ],
    empleados: [{ id: 1, nombre: 'Emmanuel Ramírez Cerón', puesto: 'Mesero', turno: 'Vespertino', telefono: '5574672177', estado: 'Activo' }],
    proveedores: [{ id: 1, empresa: 'Mariscos Tsukiji', contacto: 'Sr. Tanaka', telefono: '55123456', categoria: 'Pescados y mariscos', frecuencia: 'Diaria', estado: 'Activo' }],
    insumos: [
      { id: 1, nombre: 'Salmón fresco', stock_actual: 8, unidad: 'kg', stock_minimo: 5, proveedor: 'Mariscos Tsukiji' },
      { id: 2, nombre: 'Aguacate', stock_actual: 4, unidad: 'kg', stock_minimo: 6, proveedor: 'Mariscos Tsukiji' }
    ],
    platillos: [
      { id: 1, imagen: '', nombre: 'Dragón Roll', descripcion: 'Anguila, aguacate, pepino, arroz', categoria: 'Sushi', precio: 195, estado: 'Disponible' },
      { id: 2, imagen: '', nombre: 'California Roll', descripcion: 'Surimi, aguacate, pepino, arroz', categoria: 'Sushi', precio: 185, estado: 'Disponible' },
      { id: 3, imagen: '', nombre: 'Miso Ramen', descripcion: 'Caldo de miso, fideos, huevo, cebollín', categoria: 'Ramen', precio: 160, estado: 'Disponible' },
      { id: 4, imagen: '', nombre: 'Té Verde', descripcion: 'Té verde caliente', categoria: 'Bebidas', precio: 45, estado: 'Disponible' }
    ],
    pedidos: [{ id: 101, cliente: 'Sofía Ramírez', direccion: 'Col. Centro', platillos: '2x California Roll', total: 370, estado: 'En preparación' }],
    mesas: [1, 2, 3, 4, 5].map(id => ({ id, estado: 'Disponible', personas: 0, nota: '' })).concat([{ id: 6, estado: 'Reservada', personas: 0, nota: '19:30' }]),
    comanda: [],
    ventas: [
      { id: 1024, fecha: hoy, hora: '13:15', tipo: 'Mesa 4', total: 450, metodo: 'Tarjeta', estado: 'Pagado' },
      { id: 1025, fecha: hoy, hora: '14:02', tipo: 'Domicilio', total: 370, metodo: 'Efectivo', estado: 'Pagado' },
      { id: 1026, fecha: hoy, hora: '14:40', tipo: 'Mesa 2', total: 640, metodo: 'Tarjeta', estado: 'Pagado' },
      { id: 1027, fecha: ayer, hora: '13:30', tipo: 'Mesa 1', total: 820, metodo: 'Efectivo', estado: 'Pagado' }
    ]
  };
}
let DB = JSON.parse(localStorage.getItem('sushi') || 'null');
if (!DB) { DB = semilla(); localStorage.setItem('sushi', JSON.stringify(DB)); }
const guardar = () => localStorage.setItem('sushi', JSON.stringify(DB));

/* ================= Sesión y plantilla ================= */
const sesion = () => JSON.parse(sessionStorage.getItem('sesion') || 'null');
function requerir(rol) {
  const u = sesion();
  if (!u) { location.href = 'index.html'; return null; }
  if (rol && u.rol !== rol) { location.href = 'panel.html'; return null; }
  return u;
}
function pagina(u, seccion, sub, volver, contenido, msg) {
  const rol = u.rol === 'admin' ? 'Administrador' : 'Empleado';
  $('#app').innerHTML = `
    <header class="barra-superior"><strong class="marca">Sushi Tokio</strong><span class="seccion">${esc(seccion)}</span>
      <div class="sesion"><span>${esc(u.nombre)} (${rol})</span><button class="btn claro" id="salir">Cerrar sesión</button></div></header>
    <main class="contenido">
      ${(volver || sub) ? `<div class="encabezado">${volver ? `<a class="btn" href="${volver}">&larr; Regresar</a>` : ''}<h1>${esc(sub || seccion)}</h1></div>` : ''}
      ${msg ? `<p class="aviso ${msg[1] || 'ok'}" role="status">${esc(msg[0])}</p>` : ''}
      ${contenido}
    </main>`;
  $('#salir').onclick = () => { sessionStorage.removeItem('sesion'); location.href = 'index.html'; };
}

/* ================= Login ================= */
function paginaLogin() {
  if (sesion()) { location.href = 'panel.html'; return; }
  $('#app').innerHTML = `
    <main class="tarjeta-acceso">
      <h1>Sushi Tokio</h1>
      <p class="suave">Ingresa con tu usuario para continuar.</p>
      <div id="err"></div>
      <form class="formulario" id="f">
        <label>Usuario<input name="usuario" autocomplete="username" required autofocus></label>
        <label>Contraseña
          <span class="con-boton"><input id="clave" type="password" name="clave" autocomplete="current-password" required>
          <button type="button" class="btn" id="ver" aria-pressed="false">Mostrar</button></span></label>
        <button class="btn primario ancho">Iniciar sesión</button>
      </form>
    </main>`;
  $('#ver').onclick = e => {
    const i = $('#clave'), ver = i.type === 'password';
    i.type = ver ? 'text' : 'password'; e.target.textContent = ver ? 'Ocultar' : 'Mostrar';
    e.target.setAttribute('aria-pressed', ver);
  };
  $('#f').onsubmit = e => {
    e.preventDefault();
    const f = e.target;
    const u = DB.usuarios.find(x => x.usuario === f.usuario.value.trim() && x.clave === f.clave.value);
    if (!u) { $('#err').innerHTML = '<p class="aviso error" role="alert">Usuario o contraseña incorrectos.</p>'; return; }
    sessionStorage.setItem('sesion', JSON.stringify({ nombre: u.nombre, rol: u.rol }));
    location.href = 'panel.html';
  };
}

/* ================= Panel ================= */
function paginaPanel() {
  const u = requerir(); if (!u) return;
  const opc = u.rol === 'admin'
    ? [['Empleados', 'modulo.html?m=empleados'], ['Inventario', 'modulo.html?m=inventario'], ['Platillos y bebidas', 'modulo.html?m=platillos'],
       ['Proveedores', 'modulo.html?m=proveedores'], ['Ventas del día', 'ventas.html']]
    : [['Mesas', 'mesas.html'], ['Pedidos a domicilio', 'modulo.html?m=domicilio']];
  pagina(u, 'Inicio', 'Bienvenido(a): ' + u.nombre, null,
    `<p class="suave">Selecciona una sección para continuar.</p>
     <nav class="mosaico">${opc.map(([t, h]) => `<a class="loseta" href="${h}">${esc(t)}</a>`).join('')}</nav>`);
}

/* ================= Módulos con tabla (empleados, inventario, platillos, proveedores, domicilio) ================= */
const MODS = {
  empleados: { rol: 'admin', tabla: 'empleados', seccion: 'Empleados', titulo: 'Directorio de empleados', id: n => 'EMP-' + String(n).padStart(2, '0'),
    singular: 'empleado', nuevo: 'Agregar nuevo empleado', buscar: 'Buscar empleado', plural: 'empleados',
    busca: ['nombre', 'puesto', 'telefono'], filtro: 'puesto', campos: [
      { n: 'nombre', l: 'Nombre completo', t: 'text' },
      { n: 'puesto', l: 'Puesto / Rol', t: 'select', op: ['Mesero', 'Cocinero', 'Sushiman', 'Cajero', 'Repartidor', 'Gerente'] },
      { n: 'turno', l: 'Turno', t: 'select', op: ['Matutino', 'Vespertino', 'Nocturno'] },
      { n: 'telefono', l: 'Teléfono', t: 'tel' },
      { n: 'estado', l: 'Estado', t: 'select', op: ['Activo', 'Inactivo'] }] },
  inventario: { rol: 'admin', tabla: 'insumos', seccion: 'Inventario', titulo: 'Gestión de insumos e ingredientes', id: null,
    singular: 'insumo', nuevo: 'Agregar nuevo insumo', buscar: 'Buscar ingrediente', plural: 'insumos',
    busca: ['nombre', 'proveedor'], filtro: 'proveedor', campos: [
      { n: 'nombre', l: 'Insumo', t: 'text' },
      { n: 'stock_actual', l: 'Stock actual', t: 'number' },
      { n: 'unidad', l: 'Unidad', t: 'select', op: ['kg', 'g', 'L', 'pzas', 'cajas'] },
      { n: 'stock_minimo', l: 'Stock mínimo', t: 'number' },
      { n: 'estado', l: 'Estado', t: 'calc', fn: r => Number(r.stock_actual) <= Number(r.stock_minimo) ? 'Stock bajo' : 'Suficiente' },
      { n: 'proveedor', l: 'Proveedor', t: 'select', op: () => DB.proveedores.map(p => p.empresa) }] },
  platillos: { rol: 'admin', tabla: 'platillos', seccion: 'Platillos', titulo: 'Catálogo de menú', id: n => 'P-' + String(n).padStart(2, '0'),
    singular: 'platillo o bebida', nuevo: 'Agregar nuevo platillo/bebida', buscar: 'Buscar platillo/bebida', plural: 'platillos y bebidas',
    busca: ['nombre', 'descripcion'], filtro: 'categoria', campos: [
      { n: 'imagen', l: 'Imagen (enlace)', t: 'url', req: false },
      { n: 'nombre', l: 'Nombre', t: 'text' },
      { n: 'descripcion', l: 'Descripción', t: 'text' },
      { n: 'categoria', l: 'Categoría', t: 'select', op: ['Sushi', 'Ramen', 'Entradas', 'Bebidas', 'Postres'] },
      { n: 'precio', l: 'Precio (MXN)', t: 'money' },
      { n: 'estado', l: 'Estado', t: 'select', op: ['Disponible', 'Agotado'] }] },
  proveedores: { rol: 'admin', tabla: 'proveedores', seccion: 'Gestión de proveedores', titulo: 'Directorio de proveedores y alianzas', id: null,
    singular: 'proveedor', nuevo: 'Agregar nuevo proveedor', buscar: 'Buscar proveedor', plural: 'proveedores',
    busca: ['empresa', 'contacto', 'categoria'], filtro: 'estado', campos: [
      { n: 'empresa', l: 'Empresa proveedora', t: 'text' },
      { n: 'contacto', l: 'Contacto principal', t: 'text' },
      { n: 'telefono', l: 'Teléfono', t: 'tel' },
      { n: 'categoria', l: 'Categoría', t: 'text' },
      { n: 'frecuencia', l: 'Frecuencia', t: 'select', op: ['Diaria', 'Semanal', 'Quincenal', 'Mensual'] },
      { n: 'estado', l: 'Estado', t: 'select', op: ['Activo', 'Inactivo'] }] },
  domicilio: { rol: 'empleado', tabla: 'pedidos', seccion: 'Pedidos a domicilio', titulo: 'Gestión de pedidos a domicilio', id: n => 'D-' + n,
    singular: 'pedido', nuevo: 'Agregar nuevo pedido', buscar: 'Buscar pedido o cliente', plural: 'pedidos',
    busca: ['cliente', 'direccion', 'platillos'], filtro: 'estado', campos: [
      { n: 'cliente', l: 'Cliente', t: 'text' },
      { n: 'direccion', l: 'Dirección', t: 'text' },
      { n: 'platillos', l: 'Platillos', t: 'text' },
      { n: 'total', l: 'Total (MXN)', t: 'money' },
      { n: 'estado', l: 'Estado', t: 'select', op: ['En preparación', 'En camino', 'Entregado', 'Cancelado'] }] }
};
const opciones = c => typeof c.op === 'function' ? c.op() : c.op;

function validar(mod, datos) {
  for (const c of mod.campos.filter(c => c.t !== 'calc')) {
    const v = datos[c.n];
    if (v === '') { if (c.req === false) continue; return `Completa el campo «${c.l}».`; }
    if (c.t === 'select' && !opciones(c).includes(v)) return `Elige una opción válida en «${c.l}».`;
    if (['number', 'money'].includes(c.t) && (isNaN(v) || Number(v) < 0)) return `«${c.l}» debe ser un número mayor o igual a 0.`;
    if (c.t === 'tel' && !/^[0-9+\s-]{7,15}$/.test(v)) return `«${c.l}» no es un teléfono válido.`;
    if (c.t === 'url' && !/^https?:\/\//i.test(v)) return `«${c.l}» debe empezar con http:// o https://.`;
  }
  return '';
}

function paginaModulo() {
  const mod = MODS[new URLSearchParams(location.search).get('m')];
  if (!mod) { location.href = 'panel.html'; return; }
  const u = requerir(mod.rol); if (!u) return;
  const est = { q: '', f: '', p: 1 }, POR = 8;
  const campoFiltro = mod.campos.find(c => c.n === mod.filtro);

  function dibujar(msg) {
    const todas = DB[mod.tabla].filter(r =>
      (!est.q || mod.busca.some(k => String(r[k]).toLowerCase().includes(est.q.toLowerCase()))) && (!est.f || r[mod.filtro] === est.f));
    const paginas = Math.max(1, Math.ceil(todas.length / POR));
    est.p = Math.min(est.p, paginas);
    const filas = todas.slice((est.p - 1) * POR, est.p * POR);
    const celda = (c, r) => {
      const v = c.t === 'calc' ? c.fn(r) : r[c.n];
      if (c.n === 'estado') return insignia(v);
      if (c.t === 'url') return v ? `<img class="miniatura" src="${esc(v)}" alt="${esc(r.nombre)}">` : '<span class="suave">Sin imagen</span>';
      if (c.t === 'money') return esc(dinero(v));
      return esc(v);
    };
    const campos = mod.campos.filter(c => c.t !== 'calc');
    const contenido = `
      <form class="barra-herramientas" id="busqueda">
        <input type="search" id="q" value="${esc(est.q)}" placeholder="${esc(mod.buscar)}" aria-label="${esc(mod.buscar)}">
        <select id="f" aria-label="Filtrar por ${esc(campoFiltro.l)}">
          <option value="">Filtrar por ${esc(campoFiltro.l.toLowerCase())}: todos</option>
          ${opciones(campoFiltro).map(o => `<option ${o === est.f ? 'selected' : ''}>${esc(o)}</option>`).join('')}
        </select>
        <button class="btn">Buscar</button>
        <button type="button" class="btn primario" data-nuevo>+ ${esc(mod.nuevo)}</button>
      </form>
      <div class="tabla-caja"><table>
        <thead><tr>${mod.id ? '<th>ID</th>' : ''}${mod.campos.map(c => `<th>${esc(c.l)}</th>`).join('')}<th class="acciones-col">Acciones</th></tr></thead>
        <tbody>${filas.map(r => `<tr>${mod.id ? `<td>${esc(mod.id(r.id))}</td>` : ''}
          ${mod.campos.map(c => `<td>${celda(c, r)}</td>`).join('')}
          <td class="acciones-col"><button class="btn" data-editar="${r.id}">Editar</button> <button class="btn peligro" data-eliminar="${r.id}">Eliminar</button></td></tr>`).join('')
          || `<tr><td colspan="20" class="vacio">No hay resultados. Usa «${esc(mod.nuevo)}» para crear el primero.</td></tr>`}</tbody>
      </table></div>
      <div class="pie-tabla">
        <nav class="paginacion" aria-label="Páginas">${Array.from({ length: paginas }, (_, i) =>
          `<a href="#" data-pag="${i + 1}" ${i + 1 === est.p ? 'aria-current="page"' : ''}>${i + 1}</a>`).join('')}</nav>
        <span class="suave">Mostrando ${filas.length} de ${todas.length} ${esc(mod.plural)}</span>
      </div>
      <dialog id="dlg"><form class="formulario" id="form">
        <h2 id="dlg-titulo"></h2>
        ${campos.map(c => `<label>${esc(c.l)}${
          c.t === 'select' ? `<select name="${c.n}" required><option value="">Selecciona…</option>${opciones(c).map(o => `<option>${esc(o)}</option>`).join('')}</select>`
          : ['number', 'money'].includes(c.t) ? `<input type="number" name="${c.n}" min="0" step="${c.t === 'money' ? '0.01' : 'any'}" required>`
          : `<input type="${c.t === 'tel' ? 'tel' : c.t === 'url' ? 'url' : 'text'}" name="${c.n}" ${c.req === false ? '' : 'required'}>`}</label>`).join('')}
        <div class="acciones"><button type="button" class="btn" data-cerrar>Cancelar</button><button class="btn primario">Guardar</button></div>
      </form></dialog>`;
    pagina(u, mod.seccion, mod.titulo, 'panel.html', contenido, msg);

    $('#busqueda').onsubmit = e => { e.preventDefault(); est.q = $('#q').value.trim(); est.p = 1; dibujar(); };
    $('#f').onchange = () => { est.f = $('#f').value; est.p = 1; dibujar(); };
    $$('[data-pag]').forEach(a => a.onclick = e => { e.preventDefault(); est.p = +a.dataset.pag; dibujar(); });

    const dlg = $('#dlg'), form = $('#form');
    const abrir = (titulo, r) => {
      form.reset(); form.dataset.id = r ? r.id : '';
      if (r) campos.forEach(c => form.elements[c.n].value = r[c.n] ?? '');
      $('#dlg-titulo').textContent = titulo; dlg.showModal();
    };
    $('[data-nuevo]').onclick = () => abrir('Nuevo: ' + mod.singular);
    $$('[data-editar]').forEach(b => b.onclick = () => abrir('Editar: ' + mod.singular, DB[mod.tabla].find(x => x.id == b.dataset.editar)));
    $$('[data-eliminar]').forEach(b => b.onclick = () => {
      if (!confirm('¿Eliminar este registro?')) return;
      DB[mod.tabla] = DB[mod.tabla].filter(x => x.id != b.dataset.eliminar); guardar(); dibujar(['Registro eliminado.']);
    });
    $('[data-cerrar]').onclick = () => dlg.close();
    form.onsubmit = e => {
      e.preventDefault();
      const datos = Object.fromEntries(campos.map(c => [c.n, form.elements[c.n].value.trim()]));
      const err = validar(mod, datos);
      if (err) { alert(err); return; }
      campos.forEach(c => { if (['number', 'money'].includes(c.t)) datos[c.n] = Number(datos[c.n]); });
      const editando = form.dataset.id;
      if (editando) Object.assign(DB[mod.tabla].find(x => x.id == editando), datos);
      else DB[mod.tabla].push({ id: sigId(DB[mod.tabla]), ...datos });
      guardar(); dlg.close(); dibujar([editando ? 'Cambios guardados.' : 'Registro agregado.']);
    };
  }
  dibujar();
}

/* ================= Ventas del día ================= */
function paginaVentas() {
  const u = requerir('admin'); if (!u) return;
  let fecha = fechaISO(0), p = 1;
  const POR = 8;
  function dibujar() {
    const dia = d => DB.ventas.filter(v => v.fecha === d && v.estado === 'Pagado');
    const suma = l => l.reduce((s, v) => s + v.total, 0);
    const hoy = dia(fecha), total = suma(hoy);
    const ayer = new Date(fecha + 'T12:00').getTime() - 864e5;
    const prev = suma(dia(new Date(ayer).toLocaleDateString('en-CA')));
    const cambio = prev > 0 ? Math.round((total - prev) / prev * 1000) / 10 : null;
    const metodos = {}; hoy.forEach(v => metodos[v.metodo] = (metodos[v.metodo] || 0) + v.total);
    const todas = DB.ventas.filter(v => v.fecha === fecha).sort((a, b) => a.hora.localeCompare(b.hora));
    const paginas = Math.max(1, Math.ceil(todas.length / POR)); p = Math.min(p, paginas);
    const filas = todas.slice((p - 1) * POR, p * POR);
    pagina(u, 'Ventas del día', 'Resumen de operaciones diarias', 'panel.html', `
      <div class="barra-herramientas fecha"><label>Fecha <input type="date" id="fecha" value="${fecha}"></label></div>
      <section class="indicadores">
        <div class="indicador"><span class="suave">Total de ventas</span><strong>${esc(dinero(total))}</strong>
          <small class="${cambio !== null && cambio < 0 ? 'baja' : 'sube'}">${cambio === null ? 'Sin datos del día anterior' : (cambio >= 0 ? '+' : '') + cambio + '% vs día anterior'}</small></div>
        <div class="indicador"><span class="suave">Órdenes totales</span><strong>${hoy.length}</strong><small>Tickets de servicio</small></div>
        <div class="indicador"><span class="suave">Ticket promedio</span><strong>${esc(dinero(hoy.length ? total / hoy.length : 0))}</strong><small>Por orden</small></div>
        <div class="indicador"><span class="suave">Métodos de pago</span><canvas id="grafica" width="160" height="160" role="img" aria-label="Ventas por método de pago"></canvas><ul id="leyenda" class="leyenda"></ul></div>
      </section>
      <h2 class="subtitulo">Detalle de transacciones del día</h2>
      <div class="tabla-caja"><table>
        <thead><tr><th>ID orden</th><th>Hora</th><th>Tipo</th><th>Total</th><th>Método de pago</th><th>Estado</th></tr></thead>
        <tbody>${filas.map(v => `<tr><td>${v.id}</td><td>${esc(v.hora)}</td><td>${esc(v.tipo)}</td><td>${esc(dinero(v.total))}</td><td>${esc(v.metodo)}</td><td>${insignia(v.estado)}</td></tr>`).join('')
          || '<tr><td colspan="6" class="vacio">No hay ventas registradas en esta fecha.</td></tr>'}</tbody>
      </table></div>
      <div class="pie-tabla"><nav class="paginacion">${Array.from({ length: paginas }, (_, i) =>
        `<a href="#" data-pag="${i + 1}" ${i + 1 === p ? 'aria-current="page"' : ''}>${i + 1}</a>`).join('')}</nav>
        <span class="suave">Mostrando ${filas.length} de ${todas.length} órdenes</span></div>`);
    $('#fecha').onchange = e => { if (e.target.value) { fecha = e.target.value; p = 1; dibujar(); } };
    $$('[data-pag]').forEach(a => a.onclick = e => { e.preventDefault(); p = +a.dataset.pag; dibujar(); });

    // Gráfica de dona
    const cv = $('#grafica'), ctx = cv.getContext('2d'), c = cv.width / 2, colores = ['#1f2430', '#a3202d', '#8b93a5', '#d8a0a5'];
    ctx.lineWidth = 24;
    if (!total) { ctx.strokeStyle = '#d8dbe1'; ctx.beginPath(); ctx.arc(c, c, 56, 0, 7); ctx.stroke(); }
    let ang = -Math.PI / 2;
    Object.entries(metodos).forEach(([m, val], i) => {
      const paso = val / total * Math.PI * 2;
      ctx.strokeStyle = colores[i % 4]; ctx.beginPath(); ctx.arc(c, c, 56, ang, ang + paso); ctx.stroke(); ang += paso;
      $('#leyenda').insertAdjacentHTML('beforeend', `<li><i style="background:${colores[i % 4]}"></i>${esc(m)} ${Math.round(val / total * 100)}%</li>`);
    });
  }
  dibujar();
}

/* ================= Mesas y comandas ================= */
function paginaMesas() {
  const u = requerir('empleado'); if (!u) return;
  let sel = 0, msg = null;
  const precio = id => (DB.platillos.find(p => p.id === id) || { precio: 0 }).precio;
  const nombre = id => (DB.platillos.find(p => p.id === id) || { nombre: '(eliminado)' }).nombre;
  const items = m => DB.comanda.filter(c => c.mesa === m);
  const totalMesa = m => items(m).reduce((s, c) => s + c.cantidad * precio(c.platillo), 0);
  const aviso = (t, tipo) => { msg = [t, tipo]; dibujar(); };

  function dibujar() {
    const m = DB.mesas.find(x => x.id === sel);
    const plano = DB.mesas.map(x => {
      const t = x.estado === 'Ocupada' ? totalMesa(x.id) : 0;
      const txt = x.estado === 'Ocupada' ? `Ocupada (${x.personas} pers.)${t ? ' · ' + dinero(t) : ''}` : x.estado === 'Reservada' ? `Reservada (${x.nota})` : 'Disponible';
      return `<button class="mesa ${x.estado.toLowerCase()}" data-mesa="${x.id}" ${x.id === sel ? 'aria-current="true"' : ''}><strong>Mesa ${x.id}</strong><span>${esc(txt)}</span></button>`;
    }).join('');
    let detalle;
    if (!m) detalle = '<p class="vacio">Elige una mesa del plano para ver o abrir su comanda.</p>';
    else if (m.estado !== 'Ocupada') detalle = `<h2>Mesa ${m.id} (${m.estado.toLowerCase()})</h2>
      <form class="formulario" id="f-abrir"><label>Número de personas<input type="number" name="personas" min="1" max="20" required></label><button class="btn primario">Abrir mesa</button></form>`;
    else {
      const total = totalMesa(m.id), sub = total / (1 + IVA), lista = items(m.id);
      detalle = `<h2>Mesa ${m.id} (ocupada, ${m.personas} personas)</h2><p class="suave">Mesero: ${esc(u.nombre)}</p>
        <ul class="lineas">${lista.map(c => `<li><span>${c.cantidad}x ${esc(nombre(c.platillo))} ${c.enviado ? '<span class="insignia neutro">En cocina</span>' : ''}</span>
          <span>${esc(dinero(c.cantidad * precio(c.platillo)))}</span><button class="btn peligro" data-quitar="${c.id}" aria-label="Quitar ${esc(nombre(c.platillo))}">Quitar</button></li>`).join('')
          || '<li class="vacio">Aún no hay platillos en esta mesa.</li>'}</ul>
        <dl class="totales"><dt>Subtotal</dt><dd>${esc(dinero(sub))}</dd><dt>IVA (16%)</dt><dd>${esc(dinero(total - sub))}</dd>
          <dt class="gran">Total</dt><dd class="gran">${esc(dinero(total))}</dd></dl>
        <form class="formulario fila" id="f-agregar">
          <select name="platillo" aria-label="Platillo" required><option value="">Platillo…</option>
            ${DB.platillos.filter(p => p.estado === 'Disponible').map(p => `<option value="${p.id}">${esc(p.nombre)} — ${esc(dinero(p.precio))}</option>`).join('')}</select>
          <input type="number" name="cantidad" value="1" min="1" max="20" aria-label="Cantidad" class="corto"><button class="btn">Agregar platillo</button></form>
        <button class="btn" id="b-cocina" ${lista.length ? '' : 'disabled'}>Enviar a cocina</button>
        <form class="formulario fila" id="f-cerrar"><select name="metodo" aria-label="Método de pago" required><option value="">Método de pago…</option><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select>
          <button class="btn primario" ${lista.length ? '' : 'disabled'}>Cerrar cuenta</button></form>`;
    }
    pagina(u, 'Mesas', 'Control de mesas y toma de órdenes', 'panel.html',
      `<div class="dos-columnas"><section class="plano" aria-label="Plano de mesas">${plano}</section><aside class="comanda" aria-label="Detalle de comanda">${detalle}</aside></div>`, msg);
    msg = null;

    $$('[data-mesa]').forEach(b => b.onclick = () => { sel = +b.dataset.mesa; dibujar(); });
    if (!m) return;
    if ($('#f-abrir')) $('#f-abrir').onsubmit = e => {
      e.preventDefault(); const n = +e.target.personas.value;
      if (n < 1 || n > 20) return aviso('Indica cuántas personas ocupan la mesa (1 a 20).', 'error');
      Object.assign(m, { estado: 'Ocupada', personas: n, nota: '' }); guardar(); dibujar();
    };
    if ($('#f-agregar')) {
      $('#f-agregar').onsubmit = e => {
        e.preventDefault(); const pid = +e.target.platillo.value, n = +e.target.cantidad.value;
        if (!pid || n < 1 || n > 20) return aviso('Elige un platillo y una cantidad de 1 a 20.', 'error');
        const ex = DB.comanda.find(c => c.mesa === m.id && c.platillo === pid && !c.enviado);
        if (ex) ex.cantidad += n; else DB.comanda.push({ id: sigId(DB.comanda), mesa: m.id, platillo: pid, cantidad: n, enviado: 0 });
        guardar(); dibujar();
      };
      $$('[data-quitar]').forEach(b => b.onclick = () => { DB.comanda = DB.comanda.filter(c => c.id != b.dataset.quitar); guardar(); dibujar(); });
      $('#b-cocina').onclick = () => { items(m.id).forEach(c => c.enviado = 1); guardar(); aviso('Comanda enviada a cocina.'); };
      $('#f-cerrar').onsubmit = e => {
        e.preventDefault(); const t = totalMesa(m.id), metodo = e.target.metodo.value;
        if (!metodo || t <= 0 || !confirm('¿Cerrar la cuenta de esta mesa?')) return;
        DB.ventas.push({ id: sigId(DB.ventas), fecha: fechaISO(0), hora: new Date().toTimeString().slice(0, 5), tipo: 'Mesa ' + m.id, total: t, metodo, estado: 'Pagado' });
        DB.comanda = DB.comanda.filter(c => c.mesa !== m.id);
        Object.assign(m, { estado: 'Disponible', personas: 0, nota: '' }); guardar();
        aviso(`Cuenta cerrada: ${dinero(t)} (${metodo}).`);
      };
    }
  }
  dibujar();
}

/* ================= Arranque ================= */
({ login: paginaLogin, panel: paginaPanel, modulo: paginaModulo, ventas: paginaVentas, mesas: paginaMesas })[document.body.dataset.pagina]();
