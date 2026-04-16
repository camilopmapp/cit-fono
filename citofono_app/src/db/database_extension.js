// src/db/database_extension.js
// Extiende database.js con funciones para llamadas bidireccionales
// Importar y mezclar con DB en database.js

// Agregar estas funciones al objeto DB en database.js:

export const DB_EXTENSION = {

  // ── Buscar teléfono por número (para identificar quien llama) ──
  async buscarTelefonoPorNumero(sufijo10digitos) {
    // sufijo10digitos: últimos 10 dígitos del número, sin código de país
    const [res] = await db.executeSql(`
      SELECT
        t.id as tel_id,
        t.nombre as tel_nombre,
        t.numero as tel_numero,
        a.id as apto_id,
        a.numero as apto_numero,
        a.piso,
        a.residente,
        a.dnd,
        tr.id as torre_id,
        tr.nombre as torre_nombre
      FROM telefonos t
      JOIN apartamentos a ON a.id = t.apto_id
      JOIN torres tr ON tr.id = a.torre_id
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(t.numero,' ',''),'-',''),'(',''),')','')
            LIKE ?
        AND a.activo = 1
      LIMIT 1
    `, ['%' + sufijo10digitos])

    if (res.rows.length === 0) return [null]
    return [res.rows.item(0)]
  },

  // ── Insertar llamada perdida ───────────────────────────────────
  async insertarLlamadaPerdida(data) {
    // data: { numero, residente_info (puede ser null), torre, apto, nombre_tel }
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await db.executeSql(`
      INSERT INTO historial(
        timestamp, torre, numero_apto, residente,
        tel_llamado, nombre_tel, atendida, duracion_seg,
        tipo_llamada
      ) VALUES (?,?,?,?,?,?,0,0,'entrante_perdida')
    `, [
      ts,
      data.torre    || 'Desconocido',
      data.apto     || '—',
      data.residente || '',
      data.numero   || '',
      data.nombre_tel || '',
    ])
  },

  // ── Insertar llamada entrante atendida ────────────────────────
  async insertarLlamadaEntrante(data) {
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await db.executeSql(`
      INSERT INTO historial(
        timestamp, torre, numero_apto, residente,
        tel_llamado, nombre_tel, atendida, duracion_seg,
        tipo_llamada
      ) VALUES (?,?,?,?,?,?,1,?,  'entrante_atendida')
    `, [
      ts,
      data.torre    || 'Desconocido',
      data.apto     || '—',
      data.residente || '',
      data.numero   || '',
      data.nombre_tel || '',
      data.duracion_seg || 0,
    ])
  },

  // ── Obtener llamadas perdidas de hoy ──────────────────────────
  async getLlamadasPerdidasHoy() {
    const hoy = new Date().toISOString().substring(0, 10)
    const [res] = await db.executeSql(`
      SELECT * FROM historial
      WHERE timestamp LIKE ?
        AND tipo_llamada = 'entrante_perdida'
      ORDER BY timestamp DESC
    `, [hoy + '%'])
    const items = []
    for (let i = 0; i < res.rows.length; i++) items.push(res.rows.item(i))
    return items
  },

  // ── Stats ampliadas (incluye entrantes) ───────────────────────
  async getStatsCompletas() {
    const hoy = new Date().toISOString().substring(0, 10)
    const [res] = await db.executeSql(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN atendida=1 THEN 1 ELSE 0 END) as atendidas,
        SUM(CASE WHEN tipo_llamada='entrante_perdida' THEN 1 ELSE 0 END) as perdidas_entrantes,
        SUM(CASE WHEN tipo_llamada='entrante_atendida' THEN 1 ELSE 0 END) as atendidas_entrantes
      FROM historial
      WHERE timestamp LIKE ?
    `, [hoy + '%'])
    const r = res.rows.item(0)
    return {
      total:               r.total || 0,
      atendidas:           r.atendidas || 0,
      perdidasEntrantes:   r.perdidas_entrantes || 0,
      atendidasEntrantes:  r.atendidas_entrantes || 0,
    }
  },

  // ── Top residentes que más llaman ─────────────────────────────
  async getTopLlamantes(limit = 5) {
    const [res] = await db.executeSql(`
      SELECT torre, numero_apto, residente,
             COUNT(*) as total
      FROM historial
      WHERE tipo_llamada IN ('entrante_perdida','entrante_atendida')
        AND timestamp >= DATE('now','-30 days')
      GROUP BY torre, numero_apto
      ORDER BY total DESC
      LIMIT ?
    `, [limit])
    const items = []
    for (let i = 0; i < res.rows.length; i++) items.push(res.rows.item(i))
    return items
  },

  // ── Notas por residente ───────────────────────────────────────
  async getNota(apto_id) {
    const [res] = await db.executeSql(
      'SELECT nota FROM apartamentos WHERE id=?', [apto_id]
    )
    if (res.rows.length === 0) return ''
    return res.rows.item(0).nota || ''
  },

  async setNota(apto_id, nota) {
    await db.executeSql(
      'UPDATE apartamentos SET nota=? WHERE id=?',
      [nota, apto_id]
    )
  },
}
