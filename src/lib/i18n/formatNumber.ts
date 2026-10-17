import type { Locale } from "../../types/i18n"

const decimal = {
  en: new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  "pt-BR": new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
}
/** Cached presentation formatters; never change the underlying performance values. */
export const formatDecimal = (value: number, locale: Locale): string => decimal[locale].format(value)
