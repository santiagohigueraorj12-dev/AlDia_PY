// =====================================================================
// ASISTENTE DE PREGUNTAS  (RF-21, RN-17)
// El usuario elige un vehículo y una de estas preguntas prefabricadas.
// Cada pregunta es una función que lee los datos que AlDía ya calculó
// (desgaste, documentos, costos, kilometraje) y arma la respuesta.
// No usa internet ni inventa nada: todo sale de los datos del vehículo.
//
// Cada respuesta tiene la forma:
//   { texto: 'frase principal', items: [{ texto, estado }], nota: 'frase final opcional' }
//   estado: 'bien' | 'proxima' | 'vencida' (para pintar el color)
// =====================================================================
const { diasEntre, finMes, formatoColombia } = require('../utils/fechas');
const { NOMBRES } = require('./documentos');

const PREGUNTAS = [
  { id: 'que-cambiar', texto: '¿Qué le toca cambiar?' },
  { id: 'puedo-circular', texto: '¿Puedo circular?' },
  { id: 'documentos', texto: '¿Cuándo vencen mis documentos?' },
  { id: 'este-mes', texto: '¿Qué viene este mes?' },
  { id: 'gastado', texto: '¿Cuánto he gastado?' },
  { id: 'proximo-mantenimiento', texto: '¿Cuánto me costará el próximo mantenimiento?' },
  { id: 'kilometraje', texto: '¿Cuántos km lleva y cuánto recorre al día?' },
];

// --- Formatos (pesos, km, días) ---
const pesos = (v) => `$${Math.round(Number(v) || 0).toLocaleString('es-CO')}`;
const km = (v) => `${Number(v).toLocaleString('es-CO')} km`;
const porcentaje = (v) => `${Number(v).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
const dias = (n) => `${n} día${n === 1 ? '' : 's'}`;

/** "Tu moto ABC12D" / "Tu carro JKL345" */
const nombreVehiculo = (v) => `tu ${String(v.tipo).toLowerCase()} ${v.placa}`;

/** Explica cuánto le falta a una parte o si ya está vencida. */
function situacionParte(p) {
  if (!p.ultimo_cambio_conocido) return 'no sabemos cuándo se cambió: revísala en tu próximo servicio';
  const d = p.desgaste;
  if (d.estado === 'vencida') return `${porcentaje(d.porcentaje)}: ya está vencida, cámbiala lo antes posible`;
  const falta = d.kmRestantes !== null ? `${km(d.kmRestantes)} o ${dias(d.diasRestantes)}` : dias(d.diasRestantes);
  return `${porcentaje(d.porcentaje)}: faltan ${falta}`;
}

// =====================================================================
// Las 7 preguntas
// =====================================================================

/** 1. ¿Qué le toca cambiar?  Partes próximas o vencidas, de la más urgente a la menos. */
function queCambiar(v) {
  const urgentes = v.partes.filter((p) => p.desgaste.estado !== 'bien');  // ya vienen ordenadas por urgencia
  if (urgentes.length === 0) {
    const siguiente = v.partes[0];
    return {
      texto: `¡Buenas noticias! Todas las partes de ${nombreVehiculo(v)} están bien.`,
      nota: siguiente ? `La que más se acerca al cambio es ${siguiente.nombre.toLowerCase()} (${situacionParte(siguiente)}).` : undefined,
    };
  }
  return {
    texto: `A ${nombreVehiculo(v)} le toca cambiar ${urgentes.length === 1 ? 'esta parte' : `estas ${urgentes.length} partes`}:`,
    items: urgentes.map((p) => ({ texto: `${p.nombre}: ${situacionParte(p)}`, estado: p.desgaste.estado })),
    nota: 'Cuando las cambies, regístralo con "Registrar cambio" y su desgaste vuelve a 0 %.',
  };
}

/** 2. ¿Puedo circular?  Según RN-11: documentos obligatorios, frenos y llantas. */
function puedoCircular(v, hoy) {
  const items = [];
  for (const tipo of ['soat', 'rtm']) {
    const doc = v.documentos.find((d) => d.tipo === tipo);
    if (!doc) items.push({ texto: `${NOMBRES[tipo]}: no lo has registrado en AlDía. Asegúrate de tenerlo vigente.`, estado: 'proxima' });
    else if (doc.estado === 'vencido') items.push({ texto: `${NOMBRES[tipo]}: venció hace ${dias(diasEntre(doc.fecha_vencimiento, hoy))}.`, estado: 'vencida' });
    else items.push({ texto: `${NOMBRES[tipo]}: vigente hasta el ${formatoColombia(doc.fecha_vencimiento)}.`, estado: 'bien' });
  }
  for (const codigo of ['pastillas_freno', 'llantas']) {
    const parte = v.partes.find((p) => p.codigo === codigo);
    if (parte && parte.desgaste.estado === 'vencida') items.push({ texto: `${parte.nombre}: ${situacionParte(parte)}.`, estado: 'vencida' });
  }

  const textos = {
    no_apto: `No. ${mayuscula(nombreVehiculo(v))} no está apto para circular porque tiene documentos obligatorios vencidos:`,
    requiere_atencion: `Sí, pero con cuidado: ${nombreVehiculo(v)} requiere atención en partes de seguridad:`,
    al_dia: `Sí. ${mayuscula(nombreVehiculo(v))} está al día:`,
  };
  return { texto: textos[v.estado], items };
}

/** 3. ¿Cuándo vencen mis documentos?  SOAT, técnico-mecánica e impuesto. */
function documentos(v, hoy) {
  const items = ['soat', 'rtm', 'impuesto'].map((tipo) => {
    const doc = v.documentos.find((d) => d.tipo === tipo);
    if (!doc) return { texto: `${NOMBRES[tipo]}: sin registrar.` };
    const faltan = diasEntre(hoy, doc.fecha_vencimiento);
    if (faltan < 0) return { texto: `${NOMBRES[tipo]}: venció el ${formatoColombia(doc.fecha_vencimiento)} (hace ${dias(-faltan)}).`, estado: 'vencida' };
    if (faltan === 0) return { texto: `${NOMBRES[tipo]}: vence HOY.`, estado: 'vencida' };
    return {
      texto: `${NOMBRES[tipo]}: vence el ${formatoColombia(doc.fecha_vencimiento)} (faltan ${dias(faltan)}).`,
      estado: doc.estado === 'por_vencer' ? 'proxima' : 'bien',
    };
  });
  const sinRegistrar = items.some((i) => i.texto.endsWith('sin registrar.'));
  return {
    texto: `Estos son los documentos de ${nombreVehiculo(v)}:`,
    items,
    nota: sinRegistrar ? 'Puedes registrar los que faltan en la sección Documentos del vehículo.' : undefined,
  };
}

/** 4. ¿Qué viene este mes?  Cambios estimados y vencimientos hasta fin de mes. */
function esteMes(v, hoy) {
  const fin = finMes(hoy);
  const items = [];
  for (const p of v.partes) {
    if (p.desgaste.estado === 'vencida') items.push({ texto: `${p.nombre}: ya está vencida, pendiente de cambio.`, estado: 'vencida', fecha: hoy });
    else if (p.desgaste.fechaEstimada <= fin) {
      items.push({ texto: `${p.nombre}: cambio estimado alrededor del ${formatoColombia(p.desgaste.fechaEstimada)}.`, estado: 'proxima', fecha: p.desgaste.fechaEstimada });
    }
  }
  for (const d of v.documentos) {
    if (d.fecha_vencimiento >= hoy && d.fecha_vencimiento <= fin) {
      items.push({ texto: `${NOMBRES[d.tipo]}: vence el ${formatoColombia(d.fecha_vencimiento)}.`, estado: 'proxima', fecha: d.fecha_vencimiento });
    }
  }
  if (items.length === 0) return { texto: `Este mes no hay cambios ni vencimientos pendientes para ${nombreVehiculo(v)}. 👍` };
  items.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return {
    texto: `Esto es lo que viene para ${nombreVehiculo(v)} de aquí a fin de mes:`,
    items: items.map(({ texto, estado }) => ({ texto, estado })),
  };
}

/** 5. ¿Cuánto he gastado?  Mantenimiento, documentos y costo por km (RN-12). */
function gastado(v) {
  const { mantenimiento, documentos: enDocumentos, cambios, porKm } = v.costos;
  return {
    texto: `En ${nombreVehiculo(v)} has gastado ${pesos(mantenimiento + enDocumentos)} desde que lo registraste en AlDía:`,
    items: [
      { texto: `Mantenimiento: ${pesos(mantenimiento)} en ${cambios} cambio${cambios === 1 ? '' : 's'} de partes.` },
      { texto: `Documentos (SOAT, técnico-mecánica, impuesto): ${pesos(enDocumentos)}.` },
      { texto: porKm === null ? 'Costo por kilómetro: todavía no hay kilómetros recorridos para calcularlo.' : `Costo por kilómetro: ${pesos(porKm)} por cada km recorrido.` },
    ],
  };
}

/** 6. ¿Cuánto me costará el próximo mantenimiento?  Suma lo que costó la última vez cada parte urgente. */
function proximoMantenimiento(v) {
  const urgentes = v.partes.filter((p) => p.desgaste.estado !== 'bien');
  if (urgentes.length === 0) return { texto: `Por ahora ${nombreVehiculo(v)} no tiene partes próximas a cambio, así que no hay mantenimiento pendiente.` };

  const conCosto = urgentes.filter((p) => p.costoEstimado !== null);
  const sinCosto = urgentes.filter((p) => p.costoEstimado === null);
  const total = conCosto.reduce((s, p) => s + Number(p.costoEstimado), 0);
  return {
    texto: conCosto.length
      ? `Según lo que pagaste la última vez, el próximo mantenimiento costaría unos ${pesos(total)}:`
      : 'Todavía no tengo precios de referencia: estas partes no tienen cambios registrados en AlDía.',
    items: [
      ...conCosto.map((p) => ({ texto: `${p.nombre}: ${pesos(p.costoEstimado)}`, estado: p.desgaste.estado })),
      ...sinCosto.map((p) => ({ texto: `${p.nombre}: sin precio de referencia`, estado: p.desgaste.estado })),
    ],
    nota: sinCosto.length && conCosto.length ? 'Las partes sin precio de referencia no están incluidas en el total.' : undefined,
  };
}

/** 7. ¿Cuántos km lleva y cuánto recorre al día?  (RN-04) */
function kilometraje(v) {
  const items = [
    { texto: `Último kilometraje registrado: ${km(v.km_actual)} (el ${formatoColombia(String(v.km_actualizado_en))}).` },
    { texto: v.promedioDiarioKm === null ? 'Promedio diario: todavía no hay suficientes registros para calcularlo.' : `Recorre en promedio ${km(v.promedioDiarioKm)} por día.` },
  ];
  if (v.kmEstimado) {
    items.push({
      texto: `Llevas ${dias(v.diasSinActualizarKm)} sin actualizarlo; según tu uso diario ya debe ir por unos ${km(v.kmCalculo)}.`,
      estado: 'proxima',
    });
  }
  return {
    texto: `Así va el kilometraje de ${nombreVehiculo(v)}:`,
    items,
    nota: v.kmEstimado ? 'Actualízalo con el botón "Kilometraje" para que los cálculos sean exactos.' : undefined,
  };
}

const RESPONDEDORES = {
  'que-cambiar': queCambiar,
  'puedo-circular': puedoCircular,
  documentos,
  'este-mes': esteMes,
  gastado,
  'proximo-mantenimiento': proximoMantenimiento,
  kilometraje,
};

function mayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Responde una pregunta sobre un vehículo.
 * @param {string} preguntaId uno de los id de PREGUNTAS
 * @param {object} vehiculo   vehículo armado por vehiculos.service.armarVehiculo()
 * @param {string} hoy        'AAAA-MM-DD'
 * @returns {object|null} la respuesta, o null si la pregunta no existe
 */
function responder(preguntaId, vehiculo, hoy) {
  const funcion = RESPONDEDORES[preguntaId];
  if (!funcion) return null;
  const pregunta = PREGUNTAS.find((p) => p.id === preguntaId);
  return { pregunta: pregunta.texto, ...funcion(vehiculo, hoy) };
}

module.exports = { PREGUNTAS, responder };
