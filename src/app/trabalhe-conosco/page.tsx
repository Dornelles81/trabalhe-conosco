import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import FormWizard from '@/components/form/FormWizard'

export default function TrabalheConosco() {
  return (
    <div className="min-h-screen flex flex-col bg-mega-bg">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-mega-navy">
            Cadastro de <span className="text-mega-teal">Candidato</span>
          </h1>
          <p className="text-mega-text-secondary mt-2">
            Preencha todas as etapas para completar seu cadastro
          </p>
        </div>
        <FormWizard />
      </main>
      <Footer />
    </div>
  )
}
