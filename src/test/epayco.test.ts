import { describe, expect, it } from 'vitest'
import { buildConfirmation, signConfirmation, verifyConfirmation } from '../../server/epayco.mjs'

describe('firma ePayco', () => {
  it('valida una firma generada correctamente', () => {
    const signature = signConfirmation({
      ref: 'EP-1',
      transactionId: 123456,
      amount: '32900',
      currency: 'COP',
    })
    expect(
      verifyConfirmation({
        x_ref_payco: 'EP-1',
        x_transaction_id: 123456,
        x_amount: '32900',
        x_currency_code: 'COP',
        x_signature: signature,
      }),
    ).toBe(true)
  })

  it('rechaza una firma manipulada', () => {
    const signature = signConfirmation({
      ref: 'EP-1',
      transactionId: 123456,
      amount: '32900',
      currency: 'COP',
    })
    expect(
      verifyConfirmation({
        x_ref_payco: 'EP-1',
        x_transaction_id: 123456,
        x_amount: '99999',
        x_currency_code: 'COP',
        x_signature: signature,
      }),
    ).toBe(false)
  })

  it('buildConfirmation marca aprobado o rechazado', () => {
    const approved = buildConfirmation('EP-1', 'approve', { amount: 32900, currency: 'COP' })
    expect(approved.x_cod_response).toBe(1)
    expect(verifyConfirmation(approved)).toBe(true)

    const rejected = buildConfirmation('EP-1', 'reject', { amount: 32900, currency: 'COP' })
    expect(rejected.x_cod_response).toBe(2)
  })
})
