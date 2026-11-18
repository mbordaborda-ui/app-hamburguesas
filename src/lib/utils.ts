import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const uid = (prefix = 'id') =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const groupBy = <T, K extends string>(items: T[], key: (item: T) => K) =>
  items.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    ;(acc[k] ||= []).push(item)
    return acc
  }, {})

export const sum = (items: number[]) => items.reduce((a, b) => a + b, 0)

export const orderCode = () => {
  const n = Math.floor(1000 + Math.random() * 8999)
  return `EP-${n}`
}
