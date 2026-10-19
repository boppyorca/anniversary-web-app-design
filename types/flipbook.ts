export interface FlipbookPageMeta {
  index: number
  src: string
  width: number
  height: number
  group: 'red' | 'beige' | 'green' | 'black' | 'blue' | string
  sizeKB: number
  blur: string
}

export interface FlipbookManifest {
  generatedAt: string
  sourceSha256: string
  total: number
  pages: FlipbookPageMeta[]
}
