import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import LGPDConsentButton from '@/components/LGPDConsentButton'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-mega-bg">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-mega-navy leading-tight">
            Faça Parte da Nossa Equipe
          </h1>
          <p className="text-mega-text-secondary text-lg mb-10 leading-relaxed">
            Estamos sempre em busca de profissionais dedicados para fazer parte dos nossos eventos.
            Preencha seu cadastro e venha trabalhar conosco!
          </p>
          <LGPDConsentButton />
        </div>
      </main>
      <Footer />
    </div>
  )
}
