import { Joyride, STATUS } from 'react-joyride'
import { useEffect, useMemo, useState } from 'react'

function TourTooltip({ index, isLastStep, primaryProps, skipProps, step, tooltipProps }) {
  return <div {...tooltipProps} className="w-[min(22rem,calc(100vw-2rem))] border border-neutral-800 bg-black p-5 text-left text-neutral-400 shadow-[0_18px_44px_rgba(0,0,0,0.65)]">
    <p className="mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Folester // {String(index + 1).padStart(2, '0')}</p>
    <div className="mt-3 text-sm leading-6 text-neutral-300">{step.content}</div>
    <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-800 pt-4">
      <button {...skipProps} type="button" className="min-h-9 min-w-0 px-2 text-xs font-bold text-neutral-400 transition hover:text-white">Skip</button>
      <button {...primaryProps} type="button" className="min-h-9 min-w-0 border border-neutral-700 bg-neutral-900 px-3 text-xs font-bold text-white transition hover:border-neutral-500 hover:bg-neutral-800">{isLastStep ? 'Finish' : 'Next'}</button>
    </div>
  </div>
}

export default function OnboardingTour({ userId }) {
  const [run, setRun] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const storageKey = `folester_tour_completed:${userId}`

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 768px)')
    const updateLayout = () => setIsDesktop(desktopQuery.matches)
    updateLayout()
    desktopQuery.addEventListener('change', updateLayout)
    if (!window.localStorage.getItem(storageKey)) setRun(true)
    return () => desktopQuery.removeEventListener('change', updateLayout)
  }, [storageKey])

  const steps = useMemo(() => [
    { target: 'body', placement: 'center', content: 'Welcome to Folester. The institutional research terminal for the Nimiq ecosystem.' },
    { target: isDesktop ? '#tour-feed-nav' : '#tour-feed-nav-mobile', content: 'The Alpha Feed. View high signal market research and callouts from verified analysts.' },
    { target: isDesktop ? '#tour-leaderboard-nav' : '#tour-leaderboard-nav-mobile', content: 'The Leaderboard. Track top earners and network supporters based on on-chain tip volume.' },
    { target: isDesktop ? '#tour-docs-nav' : '#tour-docs-nav-mobile', content: 'Documentation. Review our system architecture and Nimiq Hub API integration specs.' },
    { target: '#tour-connect-wallet', content: 'Connect & Tip. Connect your Nimiq wallet to publish research and tip creators natively.' },
  ], [isDesktop])

  function handleCallback({ status }) {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      window.localStorage.setItem(storageKey, 'true')
      setRun(false)
    }
  }

  return <Joyride
    callback={handleCallback}
    continuous
    disableCloseOnEsc
    disableOverlayClose
    disableScrolling={false}
    floaterProps={{ disableAnimation: true }}
    hideBackButton
    hideCloseButton
    locale={{ last: 'Finish', next: 'Next', skip: 'Skip' }}
    run={run}
    scrollOffset={88}
    scrollToFirstStep={false}
    showProgress={false}
    showSkipButton
    spotlightPadding={8}
    steps={steps}
    tooltipComponent={TourTooltip}
    styles={{
      options: { arrowColor: '#000000', backgroundColor: '#000000', overlayColor: 'rgba(0, 0, 0, 0.74)', primaryColor: '#ffffff', textColor: '#d4d4d4', zIndex: 100 },
      spotlight: { borderRadius: 0 },
      tooltip: { borderRadius: 0 },
    }}
  />
}
