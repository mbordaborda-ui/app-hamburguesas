/**
 * Tipos del backend ePayco para poder importarlo desde los tests de `src`.
 */

export interface EpaycoConfirmation {
  x_ref_payco: string
  x_transaction_id: number
  x_amount: string
  x_currency_code: string
  x_cod_response: number
  x_response: string
  x_transaction_state: string
  x_signature: string
}

export interface EpaycoSignatureFields {
  x_ref_payco: unknown
  x_transaction_id: unknown
  x_amount: unknown
  x_currency_code: unknown
  x_signature: unknown
}

export declare const MODE: string
export declare const P_CUST_ID_CLIENTE: string
export declare const P_KEY: string
export declare const PUBLIC_KEY: string

export declare function signConfirmation(input: {
  ref: string
  transactionId: number | string
  amount: string
  currency: string
}): string

export declare function verifyConfirmation(payload: EpaycoSignatureFields): boolean

export declare function buildConfirmation(
  reference: string,
  decision: 'approve' | 'reject',
  payment: { amount: number; currency?: string },
): EpaycoConfirmation

export declare function checkoutHtml(input: {
  reference: string
  payment: { amount: number; method: string }
  order?: { code?: string; customer_name?: string } | undefined
  mode: string
}): string
