export default function Footer() {
  return (
    <footer className="border-t border-mega-border py-6 px-4 bg-white">
      <div className="max-w-7xl mx-auto text-center text-sm text-mega-text-muted">
        <p>
          &copy; {new Date().getFullYear()}{' '}
          <span className="font-semibold text-mega-navy">MEGA FEIRA</span> — Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
