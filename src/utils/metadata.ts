import type { Metadata } from 'next'

export const generateMetadata = ({
  title = `${process.env.NEXT_PUBLIC_APP_NAME} | Home`,
  description = `Manage your real estate properties with ease.`,
  image = '/thumbnail.png',
  icons = [
    {
      rel: 'apple-touch-icon',
      sizes: '32x32',
      url: '/icons/icon-logo-black.png',
    },
    {
      rel: 'icon',
      sizes: '32x32',
      url: '/icons/icon-logo-black.png',
    },
  ],
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string | null
  icons?: Metadata['icons']
  noIndex?: boolean
} = {}): Metadata => ({
  title,
  description,
  icons,
  ...(noIndex && { robots: { index: false, follow: false } }),
})
