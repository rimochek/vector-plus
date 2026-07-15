"use client"

import { useMemo } from "react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import {
  CITY_OTHER_ID,
  TUTOR_LOCATION_COUNTRIES,
  type CityId,
  type CountryId,
} from "@/lib/tutor-locations"
import { FormField } from "@/app/components/onboarding/form-field"

const selectClass =
  "min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-[var(--primary-from)] transition focus:border-[var(--primary-from)] focus:ring-2 dark:border-[var(--border)] dark:bg-[var(--surface)]"

type CountryCityPickerProps = {
  countryId: CountryId | ""
  cityId: CityId | ""
  customCountry: string
  customCity: string
  onCountryChange: (countryId: CountryId) => void
  onCityChange: (cityId: CityId) => void
  onCustomCountryChange: (value: string) => void
  onCustomCityChange: (value: string) => void
}

function countryLabelId(id: CountryId): MessageId {
  return `register.location.country.${id}` as MessageId
}

function cityLabelId(id: CityId): MessageId {
  return `register.location.city.${id}` as MessageId
}

export function CountryCityPicker({
  countryId,
  cityId,
  customCountry,
  customCity,
  onCountryChange,
  onCityChange,
  onCustomCountryChange,
  onCustomCityChange,
}: CountryCityPickerProps) {
  const { t } = useTranslations()

  const cities = useMemo(() => {
    if (!countryId) return []
    return TUTOR_LOCATION_COUNTRIES.find((c) => c.id === countryId)?.cities ?? []
  }, [countryId])

  const showCustomCountry = countryId === "other"
  const showCustomCity = cityId === CITY_OTHER_ID

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="signup-country" className="text-sm font-semibold text-[var(--text-primary)]">
          {t("register.step4.countryLabel")}
        </label>
        <select
          id="signup-country"
          className={selectClass}
          value={countryId}
          onChange={(event) => {
            const next = event.target.value as CountryId
            onCountryChange(next)
            onCityChange("")
            onCustomCityChange("")
            if (next !== "other") onCustomCountryChange("")
          }}
        >
          <option value="">{t("register.step4.countryPlaceholder")}</option>
          {TUTOR_LOCATION_COUNTRIES.map((country) => (
            <option key={country.id} value={country.id}>
              {t(countryLabelId(country.id))}
            </option>
          ))}
        </select>
      </div>

      {showCustomCountry ? (
        <FormField
          label={t("register.step4.customCountryLabel")}
          inputProps={{
            id: "signup-custom-country",
            value: customCountry,
            onChange: (event) => onCustomCountryChange(event.target.value),
            placeholder: t("register.step4.customCountryPlaceholder"),
          }}
        />
      ) : null}

      <div className="space-y-2">
        <label htmlFor="signup-city" className="text-sm font-semibold text-[var(--text-primary)]">
          {t("register.step4.cityLabel")}
        </label>
        <select
          id="signup-city"
          className={selectClass}
          value={cityId}
          disabled={!countryId}
          onChange={(event) => onCityChange(event.target.value as CityId)}
        >
          <option value="">
            {countryId
              ? t("register.step4.cityPlaceholder")
              : t("register.step4.selectCountryFirst")}
          </option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {t(cityLabelId(city))}
            </option>
          ))}
        </select>
      </div>

      {showCustomCity ? (
        <FormField
          label={t("register.step4.customCityLabel")}
          inputProps={{
            id: "signup-custom-city",
            value: customCity,
            onChange: (event) => onCustomCityChange(event.target.value),
            placeholder: t("register.step4.customCityPlaceholder"),
          }}
        />
      ) : null}
    </div>
  )
}

export function isLocationComplete(
  countryId: CountryId | "",
  cityId: CityId | "",
  customCountry: string,
  customCity: string,
): boolean {
  if (!countryId || !cityId) return false
  if (countryId === "other" && !customCountry.trim()) return false
  if (cityId === CITY_OTHER_ID && !customCity.trim()) return false
  return true
}
