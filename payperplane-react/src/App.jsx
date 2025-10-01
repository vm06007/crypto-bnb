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
        const script = document.createElement('script')
        script.src = '/example.js'
        document.body.appendChild(script)
      }, 100)
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
        </div>
      </main>
      <div dangerouslySetInnerHTML={{ __html: components.footer }} />
    </>
  )
}

export default App