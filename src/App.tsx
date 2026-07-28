import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useCountUp } from 'react-countup'
import './App.css'

const rotatingWords = ['SPEAKING.', 'SINGING.', 'WARNING.', 'BECOMING.']

const makeSignal = (seed: number) =>
  Array.from({ length: 64 }, (_, index) => {
    const primary = Math.sin((index + seed) * 0.56) * 22
    const secondary = Math.cos((index + seed * 2) * 0.21) * 13
    const pulse = index % (8 + seed) === 0 ? 24 : 0
    return Math.max(10, Math.min(92, 42 + primary + secondary + pulse))
  })

const fieldRecords = [
  {
    id: 'CR-071',
    title: 'Cloud forest before dawn',
    location: 'Monteverde, Costa Rica',
    coordinates: '10.298° N / 84.795° W',
    habitat: 'Upper canopy / 1,440 m',
    duration: '06:18:42',
    band: '0.3—18.0 kHz',
    recorded: 'MAY 14 / 04:12',
    note: 'Rain recedes. A resplendent quetzal answers through the wet canopy.',
    bars: makeSignal(2),
  },
  {
    id: 'NO-204',
    title: 'Ice edge under pressure',
    location: 'Svalbard, Norway',
    coordinates: '78.223° N / 15.646° E',
    habitat: 'Glacial margin / −14 m',
    duration: '03:44:09',
    band: '0.1—9.4 kHz',
    recorded: 'MAR 03 / 22:40',
    note: 'Submerged hydrophones hold the fracture, drift, and deep blue movement.',
    bars: makeSignal(5),
  },
  {
    id: 'AU-118',
    title: 'Reef after the heat',
    location: 'Heron Island, Australia',
    coordinates: '23.442° S / 151.914° E',
    habitat: 'Coral shelf / −7 m',
    duration: '08:02:16',
    band: '0.6—24.0 kHz',
    recorded: 'FEB 18 / 19:06',
    note: 'The evening chorus returns in clicks, crackle, and low moving water.',
    bars: makeSignal(8),
  },
  {
    id: 'US-033',
    title: 'Marsh at first light',
    location: 'Atchafalaya, Louisiana',
    coordinates: '30.124° N / 91.618° W',
    habitat: 'Wetland edge / 2 m',
    duration: '05:27:31',
    band: '0.2—16.8 kHz',
    recorded: 'APR 29 / 05:31',
    note: 'Frogs yield to rails and insects as the water changes with the morning.',
    bars: makeSignal(11),
  },
]

const questions = [
  {
    question: 'Is this a live monitoring network?',
    answer:
      'No. This concept presents an editorial archive of field recordings. Every interface state is clearly framed as an archived sample, never as a live sensor feed.',
  },
  {
    question: 'Why preserve environmental sound?',
    answer:
      'Sound holds timing, density, behavior, and change. A long recording can reveal patterns that a single image misses—and give future researchers a way to hear what shifted.',
  },
  {
    question: 'Can a recording carry scientific context?',
    answer:
      'Yes. Each session can travel with coordinates, weather, habitat notes, equipment details, frequency range, and careful human observations from the field.',
  },
]

type AnimatedMetricProps = {
  end: number
  label: string
  reducedMotion: boolean
  decimals?: number
  duration?: number
  minimumIntegerDigits?: number
  scrollSpyDelay?: number
  suffix?: string
}

type CountingMetricProps = Pick<
  AnimatedMetricProps,
  'decimals' | 'duration' | 'end' | 'scrollSpyDelay'
> & {
  formatValue: (value: number) => string
}

function CountingMetric({
  decimals,
  duration,
  end,
  formatValue,
  scrollSpyDelay,
}: CountingMetricProps) {
  const countUpId = useId()

  useCountUp({
    ref: countUpId,
    decimals,
    end,
    duration,
    enableScrollSpy: true,
    formattingFn: formatValue,
    scrollSpyDelay,
    scrollSpyOnce: true,
    start: 0,
    useEasing: true,
  })

  return <span id={countUpId} />
}

function AnimatedMetric({
  end,
  label,
  reducedMotion,
  decimals = 0,
  duration = 2,
  minimumIntegerDigits = 1,
  scrollSpyDelay = 0,
  suffix = '',
}: AnimatedMetricProps) {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        minimumIntegerDigits,
      }),
    [decimals, minimumIntegerDigits],
  )
  const formatValue = useCallback(
    (value: number) => `${formatter.format(value)}${suffix}`,
    [formatter, suffix],
  )

  return (
    <span className="countup-number">
      <span aria-hidden="true">
        {reducedMotion ? (
          formatValue(end)
        ) : (
          <CountingMetric
            decimals={decimals}
            end={end}
            duration={duration}
            formatValue={formatValue}
            scrollSpyDelay={scrollSpyDelay}
          />
        )}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(media.matches)

    updatePreference()
    media.addEventListener('change', updatePreference)
    return () => media.removeEventListener('change', updatePreference)
  }, [])

  return reducedMotion
}

function App() {
  const reducedMotion = usePrefersReducedMotion()
  const [wordIndex, setWordIndex] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState(0)
  const [openQuestion, setOpenQuestion] = useState<number | null>(0)

  useEffect(() => {
    if (reducedMotion) return

    const timer = window.setInterval(
      () => setWordIndex((current) => (current + 1) % rotatingWords.length),
      3800,
    )
    return () => window.clearInterval(timer)
  }, [reducedMotion])

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    )

    if (reducedMotion) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16, rootMargin: '0px 0px -7% 0px' },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [reducedMotion])

  useEffect(() => {
    let frame = 0
    const updateProgress = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight
        const progress = scrollable > 0 ? window.scrollY / scrollable : 0
        document.documentElement.style.setProperty(
          '--scroll-progress',
          String(Math.min(1, Math.max(0, progress))),
        )
      })
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen])

  const selected = fieldRecords[activeRecord]

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <div className="scroll-progress" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" onClick={() => setMenuOpen(false)}>
          <strong>ECHO//EARTH</strong>
          <span>FIELD ARCHIVE / VOL. 01</span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span>{menuOpen ? 'CLOSE' : 'INDEX'}</span>
          <i aria-hidden="true" />
        </button>

        <nav
          id="site-navigation"
          className={menuOpen ? 'site-nav is-open' : 'site-nav'}
          aria-label="Primary navigation"
        >
          <a href="#archive" onClick={() => setMenuOpen(false)}>
            Archive
          </a>
          <a href="#method" onClick={() => setMenuOpen(false)}>
            Method
          </a>
          <a href="#dispatch" onClick={() => setMenuOpen(false)}>
            Dispatch
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero-section" id="top">
          <div className="content-frame hero-grid">
            <div className="hero-copy">
              <p className="eyebrow hero-eyebrow">
                INDEPENDENT BIOACOUSTIC ARCHIVE / EST. 2026
              </p>
              <h1
                className="display-heading hero-title"
                aria-label="The world is still speaking."
              >
                <span aria-hidden="true">THE WORLD</span>
                <span aria-hidden="true">IS STILL</span>
                <span className="outcome-window" aria-hidden="true">
                  <em key={rotatingWords[wordIndex]}>
                    {rotatingWords[wordIndex]}
                  </em>
                </span>
              </h1>
              <p className="hero-lead">
                A field archive for the sounds a changing planet may not make
                twice. Recorded with care. Preserved with context. Kept within
                earshot.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#archive">
                  EXPLORE FIELD RECORDS <span aria-hidden="true">↘</span>
                </a>
                <a className="text-link" href="#method">
                  READ THE METHOD <span aria-hidden="true">↓</span>
                </a>
              </div>
              <div className="hero-coordinates" aria-label="Archive statistics">
                <span>
                  <small>HABITATS</small>
                  <strong>
                    <AnimatedMetric
                      end={47}
                      label="47 habitats"
                      reducedMotion={reducedMotion}
                    />
                  </strong>
                </span>
                <span>
                  <small>HOURS HELD</small>
                  <strong>
                    <AnimatedMetric
                      end={12840}
                      label="12,840 hours held"
                      reducedMotion={reducedMotion}
                      scrollSpyDelay={120}
                    />
                  </strong>
                </span>
                <span>
                  <small>FIELD YEARS</small>
                  <strong>
                    <AnimatedMetric
                      end={9}
                      label="9 field years"
                      minimumIntegerDigits={2}
                      reducedMotion={reducedMotion}
                      scrollSpyDelay={240}
                    />
                  </strong>
                </span>
              </div>
            </div>

            <div
              className="field-system"
              aria-label="Illustrative archived field recording from Monteverde, Costa Rica"
            >
              <div className="system-bar">
                <span>FIELD UNIT / 07</span>
                <span className="status">
                  <i aria-hidden="true" /> ARCHIVE READY
                </span>
              </div>
              <div className="system-canvas">
                <div className="canvas-heading">
                  <div>
                    <span className="eyebrow">RECORD / CR-071</span>
                    <strong>MONTEVERDE</strong>
                  </div>
                  <span className="capture-time">04:12:08</span>
                </div>

                <div className="waveform" aria-hidden="true">
                  {fieldRecords[0].bars.map((bar, index) => (
                    <i key={index} style={{ height: `${bar}%` }} />
                  ))}
                  <span className="waveform-axis axis-top">18.0 KHZ</span>
                  <span className="waveform-axis axis-bottom">0.3 KHZ</span>
                </div>

                <div className="capture-chain" aria-hidden="true">
                  <article className="chain-card chain-primary">
                    <span>01 / CAPTURE</span>
                    <strong>Canopy chorus isolated</strong>
                    <div className="micro-progress">
                      <i />
                    </div>
                  </article>
                  <i className="connector connector-one" />
                  <article className="chain-card chain-secondary">
                    <span>02 / CONTEXT</span>
                    <strong>Coordinates attached</strong>
                  </article>
                  <i className="connector connector-two" />
                  <article className="chain-card chain-tertiary">
                    <span>03 / PRESERVE</span>
                    <strong>Field master secured</strong>
                  </article>
                </div>
              </div>
              <div className="system-footer">
                <span>ARCHIVE SAMPLE / NOT A LIVE FEED</span>
                <span>10.298° N / 84.795° W</span>
              </div>
            </div>
          </div>
          <a className="scroll-cue" href="#purpose" aria-label="Scroll to purpose">
            <span>KEEP LISTENING</span>
            <i aria-hidden="true" />
          </a>
        </section>

        <section className="purpose-section" id="purpose">
          <div className="content-frame purpose-grid">
            <div className="section-index" data-reveal>
              <span className="eyebrow accent-on-light">01 / WHY LISTEN</span>
              <p>THE CASE FOR KEEPING WHAT CANNOT BE RECREATED.</p>
            </div>
            <div className="purpose-statement" data-reveal>
              <h2 className="display-heading">
                SILENCE ISN’T EMPTY.
                <br />
                SOMETIMES, IT’S EVIDENCE.
              </h2>
              <div className="purpose-copy-grid">
                <p>
                  Habitats change first in small ways: a call moves, a chorus
                  thins, an expected rhythm arrives late. Sound makes those
                  changes possible to revisit.
                </p>
                <p className="belief">
                  An archive does more than remember a place. It gives change a
                  before.
                </p>
              </div>
              <div className="purpose-metrics">
                <span>
                  <strong>
                    <AnimatedMetric
                      decimals={1}
                      duration={2.2}
                      end={4.8}
                      label="4.8 terabytes of uncompressed field audio"
                      reducedMotion={reducedMotion}
                      suffix=" TB"
                    />
                  </strong>
                  <small>UNCOMPRESSED FIELD AUDIO</small>
                </span>
                <span>
                  <strong>
                    <AnimatedMetric
                      duration={2.2}
                      end={23}
                      label="23 long-term listening sites"
                      reducedMotion={reducedMotion}
                      scrollSpyDelay={120}
                    />
                  </strong>
                  <small>LONG-TERM LISTENING SITES</small>
                </span>
                <span>
                  <strong>
                    <AnimatedMetric
                      duration={2.2}
                      end={11}
                      label="11 local recording partners"
                      reducedMotion={reducedMotion}
                      scrollSpyDelay={240}
                    />
                  </strong>
                  <small>LOCAL RECORDING PARTNERS</small>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="archive-section" id="archive">
          <div className="content-frame">
            <div className="section-heading" data-reveal>
              <div>
                <span className="eyebrow">02 / FIELD RECORDS</span>
                <h2 className="display-heading">ENTER THE ARCHIVE.</h2>
              </div>
              <p>
                Four listening posts. Four kinds of change. Select a record to
                inspect the signal and the field context carried beside it.
              </p>
            </div>

            <div className="archive-interface" data-reveal>
              <div className="record-list" role="list" aria-label="Field records">
                {fieldRecords.map((record, index) => (
                  <button
                    type="button"
                    className={
                      activeRecord === index
                        ? 'record-button is-active'
                        : 'record-button'
                    }
                    key={record.id}
                    onClick={() => setActiveRecord(index)}
                    aria-pressed={activeRecord === index}
                  >
                    <span className="record-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <strong>{record.title}</strong>
                      <small>{record.location}</small>
                    </span>
                    <i aria-hidden="true">↗</i>
                  </button>
                ))}
              </div>

              <article className="record-detail" aria-live="polite">
                <div className="detail-topline">
                  <span>{selected.id} / ARCHIVED SAMPLE</span>
                  <span>{selected.recorded}</span>
                </div>
                <div className="detail-title">
                  <div>
                    <span className="eyebrow">{selected.habitat}</span>
                    <h3 className="display-heading">{selected.title}</h3>
                  </div>
                  <span className="detail-index">
                    {String(activeRecord + 1).padStart(2, '0')} / 04
                  </span>
                </div>
                <div className="detail-wave" aria-hidden="true">
                  {selected.bars.map((bar, index) => (
                    <i key={`${selected.id}-${index}`} style={{ height: `${bar}%` }} />
                  ))}
                  <span className="scan-line" />
                </div>
                <p className="record-note">{selected.note}</p>
                <div className="record-metadata">
                  <span>
                    <small>COORDINATES</small>
                    {selected.coordinates}
                  </span>
                  <span>
                    <small>DURATION</small>
                    {selected.duration}
                  </span>
                  <span>
                    <small>FREQUENCY BAND</small>
                    {selected.band}
                  </span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="method-section" id="method">
          <div className="content-frame">
            <div className="method-intro" data-reveal>
              <span className="eyebrow">03 / HOW IT TRAVELS</span>
              <h2 className="display-heading">
                FROM OPEN AIR
                <br />
                TO OPEN MEMORY.
              </h2>
              <p>
                The recording is only half the work. A useful archive keeps the
                conditions, choices, and people around every signal intact.
              </p>
            </div>

            <div className="method-grid" data-reveal>
              <article className="method-card">
                <div className="method-card-top">
                  <span>01</span>
                  <i aria-hidden="true" />
                </div>
                <h3 className="display-heading">CAPTURE</h3>
                <p>
                  Field partners record full habitats—not isolated spectacle—
                  across weather, seasons, and quiet hours.
                </p>
                <ul>
                  <li>Calibrated source audio</li>
                  <li>Low-interference placement</li>
                  <li>Repeatable listening windows</li>
                </ul>
              </article>
              <article className="method-card">
                <div className="method-card-top">
                  <span>02</span>
                  <i aria-hidden="true" />
                </div>
                <h3 className="display-heading">CONTEXT</h3>
                <p>
                  Every session is paired with a field log that makes the sound
                  legible beyond the day it was recorded.
                </p>
                <ul>
                  <li>Coordinates and conditions</li>
                  <li>Habitat observations</li>
                  <li>Equipment and gain notes</li>
                </ul>
              </article>
              <article className="method-card">
                <div className="method-card-top">
                  <span>03</span>
                  <i aria-hidden="true" />
                </div>
                <h3 className="display-heading">PRESERVE</h3>
                <p>
                  Lossless masters and public listening copies are checked,
                  mirrored, and carried forward.
                </p>
                <ul>
                  <li>Open preservation formats</li>
                  <li>Verified redundant copies</li>
                  <li>Community-held metadata</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="dispatch-section" id="dispatch">
          <div className="content-frame dispatch-grid">
            <div className="dispatch-copy" data-reveal>
              <span className="eyebrow">04 / FIELD DISPATCH</span>
              <h2 className="display-heading">
                THE NEXT RECORDING STARTS BEFORE SUNRISE.
              </h2>
              <p>
                Follow one listening site through a full field session—from the
                first equipment check to the final archive note.
              </p>
              <a className="button button-primary" href="#archive">
                OPEN THE FIRST RECORD <span aria-hidden="true">↑</span>
              </a>
            </div>
            <div className="dispatch-log" data-reveal>
              <div className="log-heading">
                <span>FIELD LOG / 0051</span>
                <span>MONTEVERDE / CR</span>
              </div>
              <ol>
                <li>
                  <time>03:46</time>
                  <span>
                    <strong>ARRAY PLACED</strong>
                    Wind low. Canopy drip continuing.
                  </span>
                </li>
                <li>
                  <time>04:12</time>
                  <span>
                    <strong>FIRST CHORUS</strong>
                    Broad activity above 2.8 kHz.
                  </span>
                </li>
                <li>
                  <time>05:03</time>
                  <span>
                    <strong>WEATHER SHIFT</strong>
                    Eastern rain line reaches the ridge.
                  </span>
                </li>
                <li>
                  <time>06:28</time>
                  <span>
                    <strong>MASTER CHECKED</strong>
                    Session secured with complete notes.
                  </span>
                </li>
              </ol>
              <p>ILLUSTRATIVE FIELD LOG / PART OF THE ECHO//EARTH CONCEPT</p>
            </div>
          </div>
        </section>

        <section className="questions-section">
          <div className="content-frame questions-grid">
            <div data-reveal>
              <span className="eyebrow">05 / CLEAR SIGNAL</span>
              <h2 className="display-heading">A FEW THINGS WORTH ASKING.</h2>
            </div>
            <div className="questions" data-reveal>
              {questions.map((item, index) => {
                const isOpen = openQuestion === index
                const answerId = `answer-${index}`
                return (
                  <article className="question" key={item.question}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setOpenQuestion(isOpen ? null : index)}
                    >
                      <span>{item.question}</span>
                      <i aria-hidden="true" />
                    </button>
                    <div
                      className={isOpen ? 'answer is-open' : 'answer'}
                      id={answerId}
                    >
                      <div>
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-signal" aria-hidden="true">
          {makeSignal(3)
            .slice(0, 42)
            .map((bar, index) => (
              <i key={index} style={{ height: `${bar}%` }} />
            ))}
        </div>
        <div className="content-frame footer-grid">
          <a className="brand footer-brand" href="#top">
            <strong>ECHO//EARTH</strong>
            <span>KEEP THE WORLD WITHIN EARSHOT.</span>
          </a>
          <p>
            A speculative digital field archive, designed and built as an
            experiment in attentive interfaces.
          </p>
          <div>
            <a href="#archive">Archive</a>
            <a href="#method">Method</a>
            <a href="#top">Return to top ↑</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
