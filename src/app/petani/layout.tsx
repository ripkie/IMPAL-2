import type { ReactNode } from 'react'
import PetaniNavbar from '@/components/navbar/PetaniNavbar'

export default function PetaniLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PetaniNavbar />
      {children}
    </>
  )
}
