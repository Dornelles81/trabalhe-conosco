import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function Confirmacao() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-mega-navy mb-4">
            Cadastro Enviado com Sucesso!
          </h1>
          <p className="text-mega-text-secondary mb-8">
            Obrigado por se cadastrar! Seus dados foram recebidos e serão analisados pela nossa equipe.
            Entraremos em contato caso seu perfil seja selecionado.
          </p>
          <Link
            href="/"
            className="inline-block bg-mega-teal hover:bg-mega-teal-hover text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-md"
          >
            Voltar ao Início
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
