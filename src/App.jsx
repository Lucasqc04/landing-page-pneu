import BenefitsSection from './components/sections/BenefitsSection'
import FinalCtaSection from './components/sections/FinalCtaSection'
import HeroScrollVideo from './components/sections/HeroScrollVideo'
import ProcessSection from './components/sections/ProcessSection'
import TransformationSection from './components/sections/TransformationSection'

const heroVideoPath = '/videos/hero-tire-restoration.mp4'

function App() {
  return (
    <main className="overflow-x-clip bg-white text-ink">
      <HeroScrollVideo videoSrc={heroVideoPath} />
      <TransformationSection />
      <ProcessSection />
      <BenefitsSection />
      <FinalCtaSection />
    </main>
  )
}

export default App
