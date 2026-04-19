export function ListPets() {
  const href = '/pets'

  return (
    <>
      <a href={href}>Open GET</a>
    </>
  )
}

export function CreatePets() {
  const href = '/pets'

  return (
    <>
      <a href={href}>Open POST</a>
    </>
  )
}

export function ShowPetById() {
  const href = '/pets/:petId'

  return (
    <>
      <a href={href}>Open GET</a>
    </>
  )
}
