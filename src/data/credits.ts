// Third-party asset attributions. Surfaced via the Credits modal on the
// Welcome screen. Add new entries here — the modal renders the list verbatim.

export interface Credit {
  asset: string
  author: string
  source_url: string
  license: string
  license_url: string
}

export const CREDITS: readonly Credit[] = [
  {
    asset: 'Long-eared Owl',
    author: 'Poly by Google',
    source_url: 'https://poly.pizza/m/dVPHzmMmXlg',
    license: 'CC-BY 3.0',
    license_url: 'https://creativecommons.org/licenses/by/3.0/',
  },
]
