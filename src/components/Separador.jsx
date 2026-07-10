// Marca propia: 7 trazos diagonales tipo "corte de navaja"
export default function Separador() {
  return (
    <div className="separador" aria-hidden="true">
      {Array.from({ length: 7 }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  )
}
