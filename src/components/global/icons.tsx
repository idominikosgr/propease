import type { LucideProps } from 'lucide-react'
import Image from 'next/image'

const Icons = {
  // Icon-only version for mobile and compact spaces
  icon: (props: LucideProps & { variant?: 'light' | 'dark' }) => {
    const { variant = 'dark', className, ...rest } = props
    const isDark = variant === 'dark'
    
    return (
      <Image
        src={isDark ? '/icons/icon-logo-white.svg' : '/icons/icon-logo-black.svg'}
        alt="Realty Logo"
        width={34}
        height={34}
        className={className}
        {...rest}
      />
    )
  },
  
  // Full logo with text for desktop and headers
  logo: (props: LucideProps & { variant?: 'light' | 'dark' }) => {
    const { variant = 'dark', className, ...rest } = props
    const isDark = variant === 'dark'
    
    return (
      <Image
        src={isDark ? '/icons/logo-wide-white.svg' : '/icons/logo-wide-black.svg'}
        alt="Realty"
        width={162}
        height={34}
        className={className}
        {...rest}
      />
    )
  },
  
  // PNG versions for cases where SVG might not work
  iconPng: (props: LucideProps & { variant?: 'light' | 'dark' }) => {
    const { variant = 'dark', className, ...rest } = props
    const isDark = variant === 'dark'
    
    return (
      <Image
        src={isDark ? '/icons/icon-logo-white.png' : '/icons/icon-logo-black.png'}
        alt="Realty Logo"
        width={34}
        height={34}
        className={className}
        {...rest}
      />
    )
  },
  
  logoPng: (props: LucideProps & { variant?: 'light' | 'dark' }) => {
    const { variant = 'dark', className, ...rest } = props
    const isDark = variant === 'dark'
    
    return (
      <Image
        src={isDark ? '/icons/logo-wide-white.png' : '/icons/logo-wide-black.png'}
        alt="Realty"
        width={162}
        height={34}
        className={className}
        {...rest}
      />
    )
  },
}

export default Icons
