// src/db/database.js — v2 completo
// Incluye: llamadas bidireccionales, notas por residente,
//          búsqueda por número, estadísticas completas
import SQLite from 'react-native-sqlite-storage'
import logger from '../utils/logger'

SQLite.enablePromise(true)

let db = null

export const DB = {

  // ════════════════════════════════════════════════════════════
  //  INICIALIZACIÓN
  // ════════════════════════════════════════════════════════════
  async init() {
    try {
      db = await SQLite.openDatabase({ name: 'citofonia.db', location: 'default' })
    } catch (e) {
      logger.error('[DB] No se pudo abrir la base de datos:', e)
      throw e
    }

    // Config del sistema
    await db.executeSql(`CREATE TABLE IF NOT EXISTS config (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )`)

    // Torres
    await db.executeSql(`CREATE TABLE IF NOT EXISTS torres (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre   TEXT NOT NULL,
      pisos    INTEGER DEFAULT 5,
      orden_ui INTEGER DEFAULT 0
    )`)

    // Apartamentos — con campo nota
    await db.executeSql(`CREATE TABLE IF NOT EXISTS apartamentos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      torre_id   INTEGER REFERENCES torres(id) ON DELETE CASCADE,
      numero     TEXT NOT NULL,
      piso       INTEGER DEFAULT 1,
      residente  TEXT DEFAULT '',
      dnd        INTEGER DEFAULT 0,
      dnd_inicio TEXT DEFAULT '22:00',
      dnd_fin    TEXT DEFAULT '07:00',
      activo     INTEGER DEFAULT 1,
      nota       TEXT DEFAULT ''
    )`)

    // Teléfonos — N por apartamento
    await db.executeSql(`CREATE TABLE IF NOT EXISTS telefonos (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      apto_id INTEGER REFERENCES apartamentos(id) ON DELETE CASCADE,
      nombre  TEXT NOT NULL DEFAULT 'Principal',
      numero  TEXT NOT NULL,
      orden   INTEGER DEFAULT 1
    )`)

    // Historial — salientes y entrantes
    await db.executeSql(`CREATE TABLE IF NOT EXISTS historial (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp    TEXT NOT NULL,
      torre        TEXT DEFAULT '',
      numero_apto  TEXT DEFAULT '',
      residente    TEXT DEFAULT '',
      tel_llamado  TEXT DEFAULT '',
      nombre_tel   TEXT DEFAULT '',
      atendida     INTEGER DEFAULT 0,
      duracion_seg INTEGER DEFAULT 0,
      tipo_llamada TEXT DEFAULT 'saliente'
      -- tipos: 'saliente' | 'entrante_atendida' | 'entrante_perdida'
    )`)

    // Índices para búsqueda rápida
    await db.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_tel_numero ON telefonos(numero)`
    )
    await db.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_hist_ts ON historial(timestamp DESC)`
    )
    await db.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_hist_tipo ON historial(tipo_llamada)`
    )

    // Valores por defecto en config
    const defaults = {
      nombre_conjunto: 'Conjunto Residencial',
      admin_pin:       '000000',
      theme_mode:      'dark',
      porteria_nombre: 'Portería Principal',
    }
    for (const [k, v] of Object.entries(defaults)) {
      await db.executeSql(
        `INSERT OR IGNORE INTO config(clave,valor) VALUES(?,?)`, [k, v]
      )
    }

    logger.log('[DB] v2 inicializada OK')
    return true
  },

  // ════════════════════════════════════════════════════════════
  //  CONFIG
  // ════════════════════════════════════════════════════════════
  async getConfig() {
    const [res] = await db.executeSql('SELECT clave,valor FROM config')
    const cfg = {}
    for (let i = 0; i < res.rows.length; i++) {
      const r = res.rows.item(i)
      cfg[r.clave] = r.valor
    }
    return cfg
  },

  async setConfig(clave, valor) {
    await db.executeSql(
      'INSERT OR REPLACE INTO config(clave,valor) VALUES(?,?)',
      [clave, String(valor)]
    )
  },

  // ════════════════════════════════════════════════════════════
  //  TORRES
  // ════════════════════════════════════════════════════════════
  async getTorres() {
    const [res] = await db.executeSql(`
      SELECT t.id, t.nombre, t.pisos, t.orden_ui,
             COUNT(a.id) as total_aptos
      FROM torres t
      LEFT JOIN apartamentos a ON a.torre_id=t.id AND a.activo=1
      GROUP BY t.id ORDER BY t.orden_ui, t.nombre
    `)
    const items = []
    for (let i = 0; i < res.rows.length; i++) items.push(res.rows.item(i))
    return items
  },

  async insertTorre(nombre, pisos = 8, orden = 0) {
    const [res] = await db.executeSql(
      'INSERT INTO torres(nombre,pisos,orden_ui) VALUES(?,?,?)',
      [nombre, pisos, orden]
    )
    return res.insertId
  },

  async updateTorre(id, nombre, pisos, orden) {
    await db.executeSql(
      'UPDATE torres SET nombre=?,pisos=?,orden_ui=? WHERE id=?',
      [nombre, pisos, orden, id]
    )
  },

  async deleteTorre(id) {
    await db.executeSql('DELETE FROM torres WHERE id=?', [id])
  },

  // ════════════════════════════════════════════════════════════
  //  APARTAMENTOS
  // ════════════════════════════════════════════════════════════
  async getApartamentos(torre_id = null) {
    const where = torre_id
      ? 'WHERE a.torre_id=? AND a.activo=1'
      : 'WHERE a.activo=1'
    const params = torre_id ? [torre_id] : []
    const [res] = await db.executeSql(`
      SELECT a.id, a.torre_id, a.numero, a.piso, a.residente,
             a.dnd, a.dnd_inicio, a.dnd_fin, a.activo, a.nota,
             t.nombre as torre_nombre
      FROM apartamentos a
      JOIN torres t ON t.id=a.torre_id
      ${where}
      ORDER BY t.orden_ui, a.piso,
               CAST(a.numero AS INTEGER), a.numero
    `, params)
    const items = []
    for (let i = 0; i < res.rows.length; i++) {
      const row = res.rows.item(i)
      row.dnd    = !!row.dnd
      row.activo = !!row.activo
      items.push(row)
    }
    return items
  },

  async getApartamento(id) {
    const [res] = await db.executeSql(`
      SELECT a.*, t.nombre as torre_nombre
      FROM apartamentos a JOIN torres t ON t.id=a.torre_id
      WHERE a.id=? LIMIT 1
    `, [id])
    if (res.rows.length === 0) return null
    const apto = res.rows.item(0)
    apto.telefonos = await DB.getTelefonos(id)
    apto.dnd = !!apto.dnd
    return apto
  },

  async insertApartamento(data) {
    const [res] = await db.executeSql(
      `INSERT INTO apartamentos
       (torre_id,numero,piso,residente,dnd,dnd_inicio,dnd_fin,nota)
       VALUES(?,?,?,?,?,?,?,?)`,
      [data.torre_id, data.numero, data.piso || 1,
       data.residente || '', data.dnd ? 1 : 0,
       data.dnd_inicio || '22:00', data.dnd_fin || '07:00',
       data.nota || '']
    )
    const aptoId = res.insertId
    for (const tel of (data.telefonos || [])) {
      if (tel.numero?.trim()) {
        await DB.insertTelefono(aptoId, tel.nombre, tel.numero, tel.orden)
      }
    }
    return aptoId
  },

  async updateApartamento(data) {
    await db.executeSql(
      `UPDATE apartamentos SET torre_id=?,numero=?,piso=?,residente=?,
       dnd=?,dnd_inicio=?,dnd_fin=?,nota=? WHERE id=?`,
      [data.torre_id, data.numero, data.piso || 1,
       data.residente || '', data.dnd ? 1 : 0,
       data.dnd_inicio || '22:00', data.dnd_fin || '07:00',
       data.nota || '', data.id]
    )
    await db.executeSql('DELETE FROM telefonos WHERE apto_id=?', [data.id])
    for (const tel of (data.telefonos || [])) {
      if (tel.numero?.trim()) {
        await DB.insertTelefono(data.id, tel.nombre, tel.numero, tel.orden)
      }
    }
  },

  async deleteApartamento(id) {
    await db.executeSql(
      'UPDATE apartamentos SET activo=0 WHERE id=?', [id]
    )
  },

  // ════════════════════════════════════════════════════════════
  //  TELÉFONOS
  // ════════════════════════════════════════════════════════════
  async getTelefonos(apto_id) {
    const [res] = await db.executeSql(
      'SELECT * FROM telefonos WHERE apto_id=? ORDER BY orden',
      [apto_id]
    )
    const items = []
    for (let i = 0; i < res.rows.length; i++) items.push(res.rows.item(i))
    return items
  },

  async insertTelefono(apto_id, nombre, numero, orden = 1) {
    await db.executeSql(
      'INSERT INTO telefonos(apto_id,nombre,numero,orden) VALUES(?,?,?,?)',
      [apto_id, nombre || 'Principal', numero, orden]
    )
  },

  // ════════════════════════════════════════════════════════════
  //  BÚSQUEDA POR NÚMERO — para identificar llamadas entrantes
  // ════════════════════════════════════════════════════════════
  async buscarTelefonoPorNumero(sufijo) {
    // sufijo = últimos 10 dígitos del número entrante
    const [res] = await db.executeSql(`
      SELECT
        t.id        as tel_id,
        t.nombre    as tel_nombre,
        t.numero    as tel_numero,
        a.id        as apto_id,
        a.numero    as apto_numero,
        a.piso,
        a.residente,
        a.dnd,
        a.nota,
        tr.id       as torre_id,
        tr.nombre   as torre_nombre
      FROM telefonos t
      JOIN apartamentos a  ON a.id  = t.apto_id
      JOIN torres       tr ON tr.id = a.torre_id
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(
              REPLACE(t.numero,' ',''),'-',''),'(',''),')',''),'+','')
            LIKE ?
        AND a.activo = 1
      LIMIT 1
    `, ['%' + sufijo])

    if (res.rows.length === 0) return null
    const r = res.rows.item(0)
    r.dnd = !!r.dnd
    return r
  },

  // ════════════════════════════════════════════════════════════
  //  HISTORIAL — saliente y entrante
  // ════════════════════════════════════════════════════════════
  async insertHistorial(data) {
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await db.executeSql(
      `INSERT INTO historial
       (timestamp,torre,numero_apto,residente,
        tel_llamado,nombre_tel,atendida,duracion_seg,tipo_llamada)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [ts,
       data.torre        || '',
       data.numero_apto  || '',
       data.residente    || '',
       data.tel_llamado  || '',
       data.nombre_tel   || '',
       data.atendida ? 1 : 0,
       data.duracion_seg || 0,
       data.tipo_llamada || 'saliente']
    )
  },

  async getHistorial({ limit = 100, desde = null, hasta = null,
                        torre = null, tipo = null } = {}) {
    let where = '1=1'
    const params = []
    if (desde) { where += ' AND timestamp>=?';  params.push(desde) }
    if (hasta) { where += ' AND timestamp<=?';  params.push(hasta + ' 23:59:59') }
    if (torre) { where += ' AND torre=?';       params.push(torre) }
    if (tipo)  { where += ' AND tipo_llamada=?';params.push(tipo) }
    params.push(limit)
    const [res] = await db.executeSql(
      `SELECT * FROM historial WHERE ${where}
       ORDER BY timestamp DESC LIMIT ?`, params
    )
    const items = []
    for (let i = 0; i < res.rows.length; i++) {
      const row = res.rows.item(i)
      row.atendida = !!row.atendida
      items.push(row)
    }
    return items
  },

  // ════════════════════════════════════════════════════════════
  //  ESTADÍSTICAS
  // ════════════════════════════════════════════════════════════
  async getStatsHoy() {
    const hoy = new Date().toISOString().substring(0, 10)
    const [res] = await db.executeSql(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN atendida=1 THEN 1 ELSE 0 END) as atendidas,
        SUM(CASE WHEN tipo_llamada='entrante_perdida'   THEN 1 ELSE 0 END) as entrantes_perdidas,
        SUM(CASE WHEN tipo_llamada='entrante_atendida'  THEN 1 ELSE 0 END) as entrantes_atendidas,
        SUM(CASE WHEN tipo_llamada='saliente'
                  AND atendida=1               THEN 1 ELSE 0 END) as salientes_atendidas
      FROM historial WHERE timestamp LIKE ?
    `, [hoy + '%'])
    const r = res.rows.item(0)
    return {
      total:               r.total              || 0,
      atendidas:           r.atendidas           || 0,
      entrantesPerdidas:   r.entrantes_perdidas  || 0,
      entrantesAtendidas:  r.entrantes_atendidas || 0,
      salientesAtendidas:  r.salientes_atendidas || 0,
    }
  },

  // Llamadas perdidas de hoy (entrantes no atendidas)
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

  // Top residentes que más llaman (últimos 30 días)
  async getTopLlamantes(limit = 5) {
    const [res] = await db.executeSql(`
      SELECT torre, numero_apto, residente, COUNT(*) as total
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

  // ════════════════════════════════════════════════════════════
  //  NOTAS POR RESIDENTE
  // ════════════════════════════════════════════════════════════
  async getNota(apto_id) {
    const [res] = await db.executeSql(
      'SELECT nota FROM apartamentos WHERE id=?', [apto_id]
    )
    if (res.rows.length === 0) return ''
    return res.rows.item(0).nota || ''
  },

  async setNota(apto_id, nota) {
    await db.executeSql(
      'UPDATE apartamentos SET nota=? WHERE id=?', [nota, apto_id]
    )
  },

  // ════════════════════════════════════════════════════════════
  //  IMPORTACIÓN MASIVA DESDE EXCEL
  // ════════════════════════════════════════════════════════════
  async importarResidentes(rows, modo = 'merge') {
    const errores  = []
    let  importados = 0

    const torresExistentes = await DB.getTorres()
    const torresMap = {}
    torresExistentes.forEach(t => {
      torresMap[t.nombre.toLowerCase().trim()] = t.id
    })

    for (const row of rows) {
      try {
        if (!row.torre || !row.numero) {
          errores.push({ row, motivo: 'Torre y número son requeridos' })
          continue
        }

        // Obtener o crear torre
        const torreKey = row.torre.toString().trim().toLowerCase()
        let torre_id = torresMap[torreKey]
        if (!torre_id) {
          torre_id = await DB.insertTorre(
            row.torre.toString().trim(),
            row.pisos || 8,
            Object.keys(torresMap).length + 1
          )
          torresMap[torreKey] = torre_id
        }

        // Construir teléfonos
        const telefonos = []
        if (row.tel1?.toString().trim()) {
          telefonos.push({
            nombre: row.nombre_tel1 || 'Principal',
            numero: row.tel1.toString().trim(), orden: 1,
          })
        }
        if (row.tel2?.toString().trim()) {
          telefonos.push({
            nombre: row.nombre_tel2 || 'Alternativo',
            numero: row.tel2.toString().trim(), orden: 2,
          })
        }
        if (row.tel3?.toString().trim()) {
          telefonos.push({
            nombre: row.nombre_tel3 || 'Otro',
            numero: row.tel3.toString().trim(), orden: 3,
          })
        }

        if (telefonos.length === 0) {
          errores.push({ row, motivo: 'Al menos un teléfono es requerido' })
          continue
        }

        // Verificar si ya existe
        const [existe] = await db.executeSql(
          `SELECT id FROM apartamentos
           WHERE torre_id=? AND numero=? AND activo=1`,
          [torre_id, row.numero.toString().trim()]
        )

        if (existe.rows.length > 0 && modo === 'merge') {
          await DB.updateApartamento({
            id: existe.rows.item(0).id,
            torre_id,
            numero:    row.numero.toString().trim(),
            piso:      row.piso || 1,
            residente: row.residente || '',
            dnd: false, dnd_inicio: '22:00', dnd_fin: '07:00',
            telefonos,
          })
        } else if (existe.rows.length === 0) {
          await DB.insertApartamento({
            torre_id,
            numero:    row.numero.toString().trim(),
            piso:      row.piso || 1,
            residente: row.residente || '',
            dnd: false, dnd_inicio: '22:00', dnd_fin: '07:00',
            telefonos,
          })
        }
        importados++
      } catch (e) {
        errores.push({ row, motivo: e.message })
      }
    }

    return { importados, errores }
  },
}
