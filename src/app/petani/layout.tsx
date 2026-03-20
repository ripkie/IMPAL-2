import PetaniNavbar from '@/components/navbar/PetaniNavbar'

export default function PetaniLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PetaniNavbar />
      {children}
    </>
  )
}
