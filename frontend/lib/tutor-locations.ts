/** Canonical location ids for tutor registration (labels via i18n). */
export const CITY_OTHER_ID = "other" as const

export type CountryId = "kz" | "ru" | "uz" | "kg" | "other"

export type CityId = string

export type CountryLocation = {
  id: CountryId
  cities: readonly CityId[]
}

export const TUTOR_LOCATION_COUNTRIES: readonly CountryLocation[] = [
  {
    id: "kz",
    cities: [
      "almaty",
      "astana",
      "shymkent",
      "karaganda",
      "aktobe",
      "pavlodar",
      "ust_kamenogorsk",
      "atyrau",
      "kostanay",
      "kyzylorda",
      "taraz",
      "oral",
      "semey",
      "petropavl",
      CITY_OTHER_ID,
    ],
  },
  {
    id: "ru",
    cities: [
      "moscow",
      "saint_petersburg",
      "novosibirsk",
      "yekaterinburg",
      "kazan",
      CITY_OTHER_ID,
    ],
  },
  {
    id: "uz",
    cities: ["tashkent", "samarkand", "bukhara", CITY_OTHER_ID],
  },
  {
    id: "kg",
    cities: ["bishkek", "osh", CITY_OTHER_ID],
  },
  {
    id: "other",
    cities: [CITY_OTHER_ID],
  },
] as const

export function getCountryLocation(
  countryId: CountryId | null,
): CountryLocation | undefined {
  if (!countryId) return undefined
  return TUTOR_LOCATION_COUNTRIES.find((c) => c.id === countryId)
}

/** English labels stored in the database (locale-independent). */
export const LOCATION_LABELS_EN: Record<
  CountryId | CityId,
  string
> = {
  kz: "Kazakhstan",
  ru: "Russia",
  uz: "Uzbekistan",
  kg: "Kyrgyzstan",
  other: "Other country",
  almaty: "Almaty",
  astana: "Astana",
  shymkent: "Shymkent",
  karaganda: "Karaganda",
  aktobe: "Aktobe",
  pavlodar: "Pavlodar",
  ust_kamenogorsk: "Ust-Kamenogorsk",
  atyrau: "Atyrau",
  kostanay: "Kostanay",
  kyzylorda: "Kyzylorda",
  taraz: "Taraz",
  oral: "Oral",
  semey: "Semey",
  petropavl: "Petropavl",
  moscow: "Moscow",
  saint_petersburg: "Saint Petersburg",
  novosibirsk: "Novosibirsk",
  yekaterinburg: "Yekaterinburg",
  kazan: "Kazan",
  tashkent: "Tashkent",
  samarkand: "Samarkand",
  bukhara: "Bukhara",
  bishkek: "Bishkek",
  osh: "Osh",
}

export function resolveLocationLabels(
  countryId: CountryId,
  cityId: CityId,
  customCity: string,
  customCountry = "",
): { country: string; city: string } {
  const country =
    countryId === "other" && customCountry.trim()
      ? customCountry.trim()
      : (LOCATION_LABELS_EN[countryId] ?? countryId)
  if (cityId === CITY_OTHER_ID) {
    return { country, city: customCity.trim() }
  }
  return { country, city: LOCATION_LABELS_EN[cityId] ?? cityId }
}

export function resolveLocationSelection(
  country: string | null | undefined,
  city: string | null | undefined,
): {
  countryId: CountryId | ""
  cityId: CityId | ""
  customCountry: string
  customCity: string
} {
  const storedCountry = country?.trim() ?? ""
  const storedCity = city?.trim() ?? ""
  if (!storedCountry && !storedCity) {
    return { countryId: "", cityId: "", customCountry: "", customCity: "" }
  }

  const countryMatch = TUTOR_LOCATION_COUNTRIES.find(
    ({ id }) =>
      LOCATION_LABELS_EN[id]?.toLocaleLowerCase() ===
      storedCountry.toLocaleLowerCase(),
  )
  const countryId: CountryId = countryMatch?.id ?? "other"
  const cityMatch = countryMatch?.cities.find(
    (id) =>
      id !== CITY_OTHER_ID &&
      LOCATION_LABELS_EN[id]?.toLocaleLowerCase() === storedCity.toLocaleLowerCase(),
  )

  return {
    countryId,
    cityId: cityMatch ?? (storedCity ? CITY_OTHER_ID : ""),
    customCountry: countryId === "other" ? storedCountry : "",
    customCity: !cityMatch ? storedCity : "",
  }
}
