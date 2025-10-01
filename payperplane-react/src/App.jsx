import { useEffect, useState } from 'react'

function App() {
  const [components, setComponents] = useState({
    messageBox: '',
    header: '',
    hero: '',
    awards: '',
    bestSuited: '',
    solutions: '',
    stats: '',
    wallet: '',
    faq: '',
    footer: ''
  })

  useEffect(() => {
    // Define all component paths
    const componentPaths = {
      messageBox: '/src/components/message-box/message-box.html',
      header: '/src/components/header/header.html',
      hero: '/src/components/hero/hero.html',
      awards: '/src/components/awards/awards.html',
      bestSuited: '/src/components/best-suited/best-suited.html',
      solutions: '/src/components/solutions/solutions.html',
      stats: '/src/components/stats/stats.html',
      wallet: '/src/components/wallet/wallet.html',
      faq: '/src/components/faq/faq.html',
      footer: '/src/components/footer/footer.html'
    }

    // Load all components
    const loadComponents = async () => {
      const loadedComponents = {}

      for (const [key, path] of Object.entries(componentPaths)) {
        try {
          const response = await fetch(path)
          const html = await response.text()
          loadedComponents[key] = html
        } catch (error) {
          console.error(`Error loading ${key}:`, error)
          loadedComponents[key] = ''
        }
      }

      setComponents(loadedComponents)

      // Load the JavaScript after components are loaded
      setTimeout(() => {
        // Load example.js
        const script1 = document.createElement('script')
        script1.src = '/example.js'
        document.body.appendChild(script1)
        
        // Load modal handler
        const script2 = document.createElement('script')
        script2.src = '/modal-handler-v2.js'
        script2.onload = () => {
          console.log('Modal handler v2 loaded')
          // Manually initialize modals after a short delay
          setTimeout(() => {
            if (window.initializeModals) {
              window.initializeModals()
            }
          }, 100)
        }
        document.body.appendChild(script2)
        
        // Load solution modals handler
        const script3 = document.createElement('script')
        script3.src = '/solution-modals.js'
        script3.onload = () => {
          console.log('Solution modals loaded')
          // Initialize solution modals if needed
          setTimeout(() => {
            if (window.initializeSolutionModals) {
              window.initializeSolutionModals()
            }
          }, 200)
        }
        document.body.appendChild(script3)
      }, 500)
    }

    loadComponents()
  }, [])

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: components.messageBox }} />
      <div dangerouslySetInnerHTML={{ __html: components.header }} />
      <main className="main-new">
        <div className="js-transform-container" style={{ transform: 'translateY(0px)' }}>
          <div dangerouslySetInnerHTML={{ __html: components.hero }} />
          <div dangerouslySetInnerHTML={{ __html: components.awards }} />
          <div dangerouslySetInnerHTML={{ __html: components.bestSuited }} />
          <div dangerouslySetInnerHTML={{ __html: components.solutions }} />
          <div dangerouslySetInnerHTML={{ __html: components.stats }} />
        </div>
      </main>
      <div dangerouslySetInnerHTML={{ __html: components.footer }} />
    </>
  )
}

export default App