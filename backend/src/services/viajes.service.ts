// services/viajes.service.ts
import { viajesRepository } from '../repositories/viajes.repository';
import * as facturasRepository from '../repositories/facturas.repository';
import { Viaje, CreateViajeDTO } from '../types';
import { pool } from '../config/db';

export const viajesService = {
  async getAll(): Promise<Viaje[]> {
    return viajesRepository.getAll();
  },

  async getById(id: number): Promise<Viaje | null> {
    return viajesRepository.getById(id);
  },

  async crear(datos: CreateViajeDTO): Promise<Viaje> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const viaje = await viajesRepository.crear(datos, client);

      await client.query(
        `INSERT INTO facturas (tipo, cliente_id, fletero_id, viaje_id, monto, vencimiento, estado)
        VALUES ($1, $2, $3, $4, $5, $6, 'sin_facturar')`,
        ['cobranza', datos.clienteId, null, viaje.id, datos.valorCliente, null]
      );

      await client.query(
        `INSERT INTO facturas (tipo, cliente_id, fletero_id, viaje_id, monto, vencimiento, estado)
        VALUES ($1, $2, $3, $4, $5, $6, 'sin_facturar')`,
        ['pago_fletero', null, datos.fleteroId, viaje.id, datos.costoFletero, null]
      );

      await client.query('COMMIT');
      console.log(`[viajes] crear — transacción completada | id: ${viaje.id}`);
      return viaje;

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async actualizar(id: number, datos: Partial<CreateViajeDTO>): Promise<Viaje | null> {
    console.log(`[viajes] actualizar — request recibido | id: ${id}`);

    // 1. Cargar el viaje actual con sus facturas
    const viajeActual = await viajesRepository.getById(id);
    if (!viajeActual) return null;

    // 2. Detectar qué cambia y obtener IDs de facturas asociadas
    //    Un campo "cambia" si viene en el dto (no es undefined) y es distinto al actual.
    const cambiaValorCliente = datos.valorCliente !== undefined && datos.valorCliente !== viajeActual.valorCliente;
    const cambiaClienteId    = datos.clienteId    !== undefined && datos.clienteId    !== viajeActual.clienteId;
    const cambiaCostoFletero = datos.costoFletero !== undefined && datos.costoFletero !== viajeActual.costoFletero;
    const cambiaFleteroId    = datos.fleteroId    !== undefined && datos.fleteroId    !== viajeActual.fleteroId;

    const afectaCobranza    = cambiaValorCliente || cambiaClienteId;
    const afectaPagoFletero = cambiaCostoFletero || cambiaFleteroId;

    // 3. Validar reglas: si afecta una factura, esa factura debe estar en sin_facturar
    if (afectaCobranza && viajeActual.estadoFacturaCobranza !== 'sin_facturar') {
      throw new Error(
        `No se puede modificar el cliente o el valor del viaje porque la factura cobranza está en estado '${viajeActual.estadoFacturaCobranza}'. Revertí la factura primero desde el módulo de Facturas.`
      );
    }

    if (afectaPagoFletero && viajeActual.estadoFacturaPagoFletero !== 'sin_facturar') {
      throw new Error(
        `No se puede modificar el fletero o el costo del viaje porque la factura pago_fletero está en estado '${viajeActual.estadoFacturaPagoFletero}'. Revertí la factura primero desde el módulo de Facturas.`
      );
    }

    // 4. Si nada afecta facturas, hacemos solo el UPDATE del viaje (sin transacción explícita)
    if (!afectaCobranza && !afectaPagoFletero) {
      await viajesRepository.actualizar(id, datos);
      const viajeFresco = await viajesRepository.getById(id);
      console.log(`[viajes] actualizar — completado sin cascada | id: ${id}`);
      return viajeFresco;
    }

    // 5. Hay cambios que afectan facturas: necesitamos buscar los IDs de las facturas
    //    asociadas al viaje y aplicar todo en una transacción atómica.
    const facturasDelViaje = await facturasRepository.getAll({ viaje_id: id });
    const facturaCobranza    = facturasDelViaje.find(f => f.tipo === 'cobranza');
    const facturaPagoFletero = facturasDelViaje.find(f => f.tipo === 'pago_fletero');

    if (afectaCobranza && !facturaCobranza) {
      throw new Error(`Inconsistencia: el viaje ${id} no tiene factura cobranza asociada`);
    }
    if (afectaPagoFletero && !facturaPagoFletero) {
      throw new Error(`Inconsistencia: el viaje ${id} no tiene factura pago_fletero asociada`);
    }

    // 6. Transacción: viaje + facturas afectadas
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await viajesRepository.actualizar(id, datos, client);

      if (afectaCobranza) {
        const updateCobranza = await facturasRepository.actualizarDesdeViaje(
          facturaCobranza!.id,
          {
            monto:     cambiaValorCliente ? datos.valorCliente : undefined,
            clienteId: cambiaClienteId    ? datos.clienteId    : undefined,
          },
          client
        );
        if (!updateCobranza) {
          throw new Error('La factura cobranza cambió de estado durante la edición. Recargá y volvé a intentar.');
        }
      }

      if (afectaPagoFletero) {
        const updatePagoFletero = await facturasRepository.actualizarDesdeViaje(
          facturaPagoFletero!.id,
          {
            monto:     cambiaCostoFletero ? datos.costoFletero : undefined,
            fleteroId: cambiaFleteroId    ? datos.fleteroId    : undefined,
          },
          client
        );
        if (!updatePagoFletero) {
          throw new Error('La factura pago_fletero cambió de estado durante la edición. Recargá y volvé a intentar.');
        }
      }

      await client.query('COMMIT');
      console.log(`[viajes] actualizar — transacción completada | id: ${id} | afectaCobranza: ${afectaCobranza} | afectaPagoFletero: ${afectaPagoFletero}`);

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // 7. Devolver el viaje fresco con los datos actualizados de facturas
    return viajesRepository.getById(id);
  },

  async eliminar(id: number): Promise<Viaje | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await facturasRepository.eliminarPorViajeId(id, client);
      const viaje = await viajesRepository.eliminar(id, client);
      await client.query('COMMIT');
      return viaje;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};