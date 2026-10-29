import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { I, Icon } from '@/components/icons'
import { getLanguage, setLanguage } from '@/i18n/language'
import './landing.css'

const appointments = [
  { name: 'Мадина Юсуфова', service: 'Стрижка и укладка', time: '09:00–10:30', column: 0, top: 0, height: 87, tone: 'sage', initials: 'МЮ' },
  { name: 'Нигина Саидова', service: 'Окрашивание', time: '11:00–13:00', column: 0, top: 126, height: 110, tone: 'sand', initials: 'НС' },
  { name: 'Зарина Каримова', service: 'Маникюр', time: '09:30–11:00', column: 1, top: 32, height: 90, tone: 'lavender', initials: 'ЗК' },
  { name: 'Мехрона Азизова', service: 'Маникюр + покрытие', time: '11:30–13:00', column: 1, top: 159, height: 88, tone: 'sage', initials: 'МА' },
  { name: 'Ситора Рахимова', service: 'Уход за лицом', time: '09:00–10:00', column: 2, top: 0, height: 58, tone: 'sand', initials: 'СР' },
  { name: 'Фируза Набиева', service: 'Консультация', time: '10:30–11:30', column: 2, top: 95, height: 58, tone: 'sage', initials: 'ФН' },
  { name: 'Сабина Ахмедова', service: 'Уход за лицом', time: '12:00–13:30', column: 2, top: 191, height: 86, tone: 'lavender', initials: 'СА' },
]
type Appointment = (typeof appointments)[number]
const features = [
  { label: 'Запись и расписание', title: 'Каждой встрече — своё время.', description: 'Записи, свободные окна и загрузка команды в одном календаре. Вся картина дня понятна с первого взгляда.', icon: I.calendar },
  { label: 'Клиенты и общение', title: 'Помните людей, а не детали.', description: 'История визитов, предпочтения и переписка рядом. Личный подход к каждому клиенту, даже когда их становится больше.', icon: I.clients },
  { label: 'Деньги и команда', title: 'Вы знаете, как идут дела.', description: 'Выручка, расходы и расчёт зарплаты в одной системе. Видно, что приносит доход и кому сколько начислено.', icon: I.reports },
]
const faqs = [
  { question: 'Для какого бизнеса подходит NavCRM?', answer: 'Для бизнеса, где есть запись, клиенты и команда: салонов красоты, барбершопов, косметологических кабинетов, клиник, фитнес-студий и других сервисных компаний. При настройке вы выбираете нужные направления и модули.' },
  { question: 'Можно перенести клиентскую базу?', answer: 'В разделе «Клиенты» есть импорт базы из файла. Можно подготовить таблицу, сопоставить её столбцы с полями NavCRM и проверить данные перед добавлением.' },
  { question: 'Нужно ли подключать все модули сразу?', answer: 'Нет. Начните с расписания и клиентов, а кассу, склад, зарплату и другие разделы подключайте по мере необходимости. Доступность модулей зависит от тарифа.' },
  { question: 'Что входит в бесплатный тариф?', answer: 'Один филиал, два сотрудника, до 50 записей в месяц и два модуля. Можно познакомиться с NavCRM на задачах небольшой команды, а затем выбрать подходящий тариф.' },
  { question: 'Система работает на русском языке?', answer: 'Да, интерфейс доступен на русском и английском. NavCRM учитывает местный контекст: номера +992, расчёты в сомони и привычные способы связи с клиентами.' },
]

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function Brand({ footer = false }: { footer?: boolean }) {
  return <a href="#top" className={`lp-brand${footer ? ' lp-brand-footer' : ''}`} aria-label="NavCRM — в начало страницы"><svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor" /><path d="M10 22V10.6c0-.5.6-.8 1-.4l9.9 11.5c.4.5 1.1.2 1.1-.4V10" stroke="var(--lp-paper)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span>nav<span className="lp-brand-crm">crm</span></span></a>
}

function SignupLink({ className = '', children = 'Начать бесплатно' }: { className?: string; children?: React.ReactNode }) {
  return <Link to="/signup" className={`lp-button ${className}`} onClick={() => setLanguage('ru')}>{children}<Arrow /></Link>
}

function CalendarPreview() {
  const [day, setDay] = useState(0)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const dialogTitle = useId()
  const date = new Date(2026, 9, 22 + day)
  const dateLabel = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  const openVisit = (visit: Appointment) => { setSelected(visit); dialog.current?.showModal() }
  return <div className="lp-calendar" aria-label="Интерактивный пример расписания NavCRM">
    <aside className="lp-mini-sidebar" aria-hidden="true"><span className="lp-mini-logo">n</span>{[I.home, I.calendar, I.clients, I.register, I.inbox, I.reports].map((icon, i) => <span key={i} className={i === 1 ? 'is-active' : ''}><Icon icon={icon} size={17} /></span>)}<span className="lp-mini-sidebar-bottom"><Icon icon={I.settings} size={17} /></span></aside>
    <div className="lp-calendar-main">
      <div className="lp-preview-business"><span><span className="lp-business-avatar">S</span>Sitora Beauty<Icon icon={I.chevronDown} size={12} /></span><span className="lp-preview-example">Пример рабочего дня</span></div>
      <div className="lp-calendar-toolbar"><strong>Расписание</strong><div className="lp-date-control"><button aria-label="Предыдущий день" onClick={() => setDay(day - 1)}><Icon icon={I.chevronLeft} size={15} /></button><span aria-live="polite">{dateLabel}</span><button aria-label="Следующий день" onClick={() => setDay(day + 1)}><Icon icon={I.chevronRight} size={15} /></button></div><Link to="/signup" onClick={() => setLanguage('ru')} className="lp-new-visit" aria-label="Новая запись"><Icon icon={I.add} size={13} /><span>Новая запись</span></Link></div>
      <div className="lp-staff"><span />{['Малика', 'Фарангис', 'Шахло'].map((name, i) => <div key={name}><span className={`lp-staff-avatar lp-staff-${i}`}>{name.slice(0, 1)}</span><span>{name}<small>{['Стилист', 'Мастер маникюра', 'Косметолог'][i]}</small></span></div>)}</div>
      <div className="lp-time-grid"><div className="lp-time-labels">{['09:00', '10:00', '11:00', '12:00', '13:00'].map(t => <span key={t}>{t}</span>)}</div><div className="lp-appointments">{[0, 1, 2].map(column => <div className="lp-grid-column" key={column}>{appointments.filter(a => a.column === column).map(visit => <button key={visit.name} style={{ top: visit.top, height: visit.height }} className={`lp-appointment lp-${visit.tone}`} onClick={() => openVisit(visit)}><span>{visit.time}</span><strong>{visit.name}</strong><span>{visit.service}</span></button>)}</div>)}<div className="lp-now-line"><span /> <small>11:15</small></div></div></div>
      <div className="lp-calendar-bottom"><span><span className="lp-status-dot" />Всё сохранено</span><span>Нажмите на запись, чтобы посмотреть детали <Arrow diagonal /></span></div>
    </div>
    <dialog ref={dialog} aria-labelledby={dialogTitle} className="lp-visit-dialog" onClick={e => { if (e.target === e.currentTarget) dialog.current?.close() }}>
      <div className="lp-visit-content"><button className="lp-dialog-close" aria-label="Закрыть детали записи" onClick={() => dialog.current?.close()}><Icon icon={I.close} size={20} /></button><span className="lp-eyebrow">ПРИМЕР ЗАПИСИ</span><h3 id={dialogTitle}>{selected?.name}</h3><p>{selected?.service}</p><dl><div><dt>Дата</dt><dd>{dateLabel}</dd></div><div><dt>Время</dt><dd>{selected?.time}</dd></div><div><dt>Специалист</dt><dd>{selected && ['Малика', 'Фарангис', 'Шахло'][selected.column]}</dd></div><div><dt>Статус</dt><dd><span className="lp-confirmed">Подтверждено</span></dd></div></dl><SignupLink>Попробовать NavCRM</SignupLink></div>
    </dialog>
  </div>
}

function ClientPreview() {
  return <div className="lp-client-preview"><div className="lp-client-top"><span className="lp-client-avatar">МЮ</span><span className="lp-client-label">КАРТОЧКА КЛИЕНТА</span><Icon icon={I.more} size={20} /></div><h3>Мадина Юсуфова</h3><p>С нами с марта 2025</p><div className="lp-client-stats"><div><strong>12</strong><span>визитов</span></div><div><strong>2 850 <small>с.</small></strong><span>за всё время</span></div><div><strong>24 окт.</strong><span>следующий визит</span></div></div><div className="lp-client-note"><Icon icon={I.edit} size={17} /><p>Предпочитает утренние записи.<br />Любимый мастер — Малика.</p></div><div className="lp-client-history"><strong>Последние визиты</strong>{[['15 октября', 'Стрижка и укладка', '250 с.'], ['23 сентября', 'Окрашивание', '600 с.'], ['2 сентября', 'Стрижка и укладка', '250 с.']].map(row => <div key={row[0]}><span>{row[0]}</span><span>{row[1]}</span><strong>{row[2]}</strong></div>)}</div><div className="lp-preview-footnote">Пример данных в системе</div></div>
}

function FinancePreview() {
  return <div className="lp-finance-preview"><div className="lp-finance-heading"><span>Выручка за неделю</span><span>19–25 октября <Icon icon={I.chevronDown} size={12} /></span></div><div className="lp-finance-total">18 450 <span>с.</span></div><p><span>↗ 12,8%</span> к прошлой неделе</p><div className="lp-finance-bars">{[42, 65, 52, 88, 72, 96, 57].map((height, i) => <div key={i}><div style={{ height: `${height}%` }} className={i === 5 ? 'is-current' : ''}><span>{[1850, 2620, 2180, 3460, 2840, 3650, 1850][i]} с.</span></div><small>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]}</small></div>)}</div><div className="lp-finance-summary"><div><span>Завершено визитов</span><strong>48</strong></div><div><span>Средний чек</span><strong>384 с.</strong></div><div><span>Загрузка команды</span><strong>76%</strong></div></div><div className="lp-preview-footnote">Пример данных в системе</div></div>
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState(1)
  const [showPlans, setShowPlans] = useState(false)
  const featureButtons = useRef<(HTMLButtonElement | null)[]>([])
  useEffect(() => {
    const title = document.title
    document.title = 'NavCRM — ваш бизнес в хорошем ритме'
    document.documentElement.lang = 'ru'
    const description = document.createElement('meta')
    description.name = 'description'
    description.content = 'NavCRM — расписание, клиенты, финансы и команда в одной системе для бизнеса в сфере услуг. Начните с бесплатного тарифа.'
    document.head.append(description)
    return () => { document.title = title; document.documentElement.lang = getLanguage(); description.remove() }
  }, [])
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % features.length
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + features.length - 1) % features.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = features.length - 1
    else return
    event.preventDefault(); setActiveFeature(next); featureButtons.current[next]?.focus()
  }
  return <div className="lp" id="top" translate="no">
    <a href="#main" className="lp-skip">Перейти к содержимому</a>
    <header className="lp-header lp-container" onKeyDown={e => { if (e.key === 'Escape' && menuOpen) { setMenuOpen(false); e.currentTarget.querySelector<HTMLButtonElement>('.lp-menu-toggle')?.focus() } }}><Brand /><nav className="lp-desktop-nav" aria-label="Основная навигация"><a href="#features">Возможности</a><a href="#business">Для кого</a><a href="#pricing">Тарифы</a></nav><div className="lp-header-actions"><Link className="lp-login" to="/signin" onClick={() => setLanguage('ru')}>Войти<Arrow diagonal /></Link><SignupLink className="lp-header-cta">Попробовать</SignupLink><button className="lp-menu-toggle" aria-expanded={menuOpen} aria-controls="lp-mobile-nav" aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} onClick={() => setMenuOpen(!menuOpen)}><Icon icon={menuOpen ? I.close : I.menu} size={23} /></button></div>{menuOpen && <nav id="lp-mobile-nav" className="lp-mobile-nav" aria-label="Мобильная навигация" onClick={() => setMenuOpen(false)} onKeyDown={e => { if (e.key === 'Escape') { setMenuOpen(false); e.currentTarget.parentElement?.querySelector<HTMLButtonElement>('.lp-menu-toggle')?.focus() } }}><a href="#features">Возможности</a><a href="#business">Для кого</a><a href="#pricing">Тарифы</a><Link to="/signin" onClick={() => setLanguage('ru')}>Войти в NavCRM<Arrow diagonal /></Link></nav>}</header>
    <main id="main">
      <section className="lp-hero lp-container" aria-labelledby="lp-title"><div className="lp-hero-copy"><div className="lp-eyebrow"><span className="lp-small-mark" />НАВОДИМ ПОРЯДОК В ДЕЛАХ</div><h1 id="lp-title">Ваш бизнес.<br />В хорошем ритме<span className="lp-period">.</span></h1></div><div className="lp-hero-aside"><p>Записи, клиенты, деньги и команда — в одной системе. Чтобы у вас оставалось время на то, что вы любите.</p><SignupLink /><span className="lp-hero-note">Бесплатно до 50 записей в месяц</span></div></section>
      <section className="lp-showcase lp-container" aria-label="Ваше дело и NavCRM"><div className="lp-salon-photo"><img src="/landing/salon-editorial.webp" alt="Мастер заботится о клиентке в светлом салоне" width="1536" height="1024" fetchPriority="high" /><div className="lp-photo-caption"><span className="lp-photo-index">01 / ВАШЕ ДЕЛО</span><p>Людям —<br />ваше внимание.</p></div></div><div className="lp-calendar-stage"><div className="lp-stage-caption"><span>02 / ВСЁ ОСТАЛЬНОЕ — В NAVCRM</span><span className="lp-live-label"><span />Порядок каждый день</span></div><CalendarPreview /></div></section>
      <div className="lp-audience-strip lp-container"><span>Для тех, кто работает с людьми</span><div><span>Салоны красоты</span><span>Клиники</span><span>Барбершопы</span><span>Студии</span><span>И не только <Arrow diagonal /></span></div></div>

      <section className="lp-features lp-container" id="features"><div className="lp-section-heading"><span className="lp-eyebrow">ОДНА СИСТЕМА. ЦЕЛЫЙ РАБОЧИЙ ДЕНЬ.</span><h2>Всё связано.<br /><span>Всё под рукой.</span></h2><p>От первой записи до закрытия кассы.<br />NavCRM собирает ежедневные дела в понятную картину.</p></div><div className="lp-feature-layout"><div className="lp-feature-tabs" role="tablist" aria-label="Возможности NavCRM" aria-orientation="vertical">{features.map((feature, i) => <button key={feature.label} id={`lp-feature-tab-${i}`} role="tab" aria-selected={activeFeature === i} aria-controls={`lp-feature-panel-${i}`} tabIndex={activeFeature === i ? 0 : -1} ref={el => { featureButtons.current[i] = el }} className={activeFeature === i ? 'is-active' : ''} onClick={() => setActiveFeature(i)} onKeyDown={e => onTabKey(e, i)}><span className="lp-feature-tab-title"><span className="lp-feature-number">0{i + 1}</span>{feature.label}<Arrow diagonal /></span>{activeFeature === i && <span className="lp-feature-tab-detail"><strong>{feature.title}</strong><span>{feature.description}</span></span>}</button>)}</div>{features.map((feature, i) => <div key={feature.label} id={`lp-feature-panel-${i}`} role="tabpanel" aria-labelledby={`lp-feature-tab-${i}`} className={`lp-feature-visual lp-feature-visual-${i}`} hidden={activeFeature !== i} tabIndex={0}>{i === 0 ? <CalendarPreview /> : i === 1 ? <ClientPreview /> : <FinancePreview />}</div>)}</div><div className="lp-modules">{[{ icon: I.inbox, title: 'Единая переписка', text: 'Переписки рядом с клиентом' }, { icon: I.inventory, title: 'Склад и материалы', text: 'Остатки и расходники под контролем' }, { icon: I.payroll, title: 'Расчёт зарплаты', text: 'Начисления по вашим правилам' }, { icon: I.campaigns, title: 'Возвращение клиентов', text: 'Рассылки, бонусы и предложения' }].map(item => <div key={item.title}><Icon icon={item.icon} size={22} strokeWidth={1.5} /><h3>{item.title}</h3><p>{item.text}</p></div>)}</div></section>

      <section className="lp-manifesto" id="business"><div className="lp-container lp-manifesto-inner"><span className="lp-eyebrow">БИЗНЕС — ЭТО ЛЮДИ</span><h2>Вы знаете своё дело.<br />Мы помогаем<br /><span>держать его в порядке.</span></h2><div className="lp-manifesto-bottom"><svg className="lp-asterisk" width="82" height="82" viewBox="0 0 82 82" fill="none" aria-hidden="true"><path d="M41 4v74M4 41h74M15 15l52 52M15 67l52-52" stroke="currentColor" strokeWidth="10" /></svg><p>Первый салон или уже сеть. Два мастера или целая команда. Выберите нужные инструменты — и работайте в своём ритме.</p><a href="#pricing" className="lp-text-link">Найдите свой тариф<Arrow diagonal /></a></div><div className="lp-business-types"><span>Красота и уход</span><span>Медицина</span><span>Спорт и студии</span><span>Обучение</span><span>Сервис и ремонт</span></div></div></section>

      <section className="lp-start lp-container"><div><span className="lp-eyebrow">БЕЗ ЛИШНИХ СЛОЖНОСТЕЙ</span><h2>Новый порядок.<br />Привычный рабочий день.</h2></div><div className="lp-start-steps">{[{ title: 'Добавьте своё дело', text: 'Расскажите о бизнесе, выберите направления и нужные модули.' }, { title: 'Соберите команду', text: 'Добавьте услуги, пригласите сотрудников и перенесите клиентов.' }, { title: 'Откройте расписание', text: 'Создайте первую запись. Всё остальное постепенно встанет на свои места.' }].map((step, i) => <div key={step.title}><span>0{i + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div></section>

      <section className="lp-pricing lp-container" id="pricing"><div className="lp-pricing-intro"><span className="lp-eyebrow">РАСТЁТ БИЗНЕС — РАСТЁТ NAVCRM</span><h2>Начните с малого.<br />Планы — любые.</h2><p>Попробуйте систему на своём рабочем дне.<br />Выберите тариф, когда будете готовы.</p><button className="lp-text-link lp-plans-toggle" aria-expanded={showPlans} aria-controls="lp-all-plans" onClick={() => setShowPlans(!showPlans)}>{showPlans ? 'Скрыть тарифы' : 'Посмотреть все тарифы'}<Icon icon={showPlans ? I.close : I.add} size={17} /></button></div><div className="lp-price-card"><div className="lp-price-card-top"><span>Для первого знакомства</span><span className="lp-price-tag">БЕСПЛАТНО</span></div><div className="lp-price">0 <span>сомони / месяц</span></div><p>Всё начинается с первой записи.</p><div className="lp-price-includes">{['До 50 записей в месяц', '1 филиал и 2 сотрудника', '2 модуля на ваш выбор'].map(item => <span key={item}><Icon icon={I.check} size={17} />{item}</span>)}</div><SignupLink>Создать своё пространство</SignupLink></div>{showPlans && <div className="lp-all-plans" id="lp-all-plans"><div className="lp-plans-heading"><h3>Выберите свой ритм.</h3><span>Тариф для каждого этапа вашего бизнеса</span></div>{[{ name: 'За визит', price: '1,50 с.', unit: 'за завершённый визит', detail: '3 филиала · 15 сотрудников · все модули' }, { name: 'Старт', price: '150 с.', unit: 'в месяц', detail: '1 филиал · 5 сотрудников · 500 записей' }, { name: 'Бизнес', price: '350 с.', unit: 'в месяц', detail: '3 филиала · 20 сотрудников · безлимитные записи' }, { name: 'Сеть', price: '900 с.', unit: 'в месяц', detail: 'Без ограничений по филиалам и сотрудникам' }].map(plan => <div className="lp-plan-row" key={plan.name}><div><h4>{plan.name}</h4><p>{plan.detail}</p></div><div><strong>{plan.price}</strong><span>{plan.unit}</span></div><SignupLink>Выбрать</SignupLink></div>)}</div>}</section>

      <section className="lp-faq lp-container" aria-labelledby="lp-faq-title"><div><span className="lp-eyebrow">ЕЩЁ ПАРА ДЕТАЛЕЙ</span><h2 id="lp-faq-title">Хорошие вопросы.</h2></div><div className="lp-faq-list">{faqs.map(item => <details key={item.question}><summary>{item.question}<span className="lp-faq-icon"><Icon icon={I.add} size={20} /></span></summary><p>{item.answer}</p></details>)}</div></section>
      <section className="lp-final"><div className="lp-container"><span className="lp-eyebrow">МЕНЬШЕ РУТИНЫ. БОЛЬШЕ ВАШЕГО ДЕЛА.</span><h2>Пусть всё<br />идёт своим ритмом.</h2><SignupLink /><p>Ваш первый шаг к порядку — бесплатно.</p></div></section>
    </main>
    <footer className="lp-footer lp-container"><div className="lp-footer-top"><Brand footer /><p>Ближе к людям.<br />Внимательнее к делу.</p><nav aria-label="Навигация в подвале"><a href="#features">Возможности</a><a href="#pricing">Тарифы</a><a href="#lp-faq-title">Вопросы и ответы</a><Link to="/signin" onClick={() => setLanguage('ru')}>Войти<Arrow diagonal /></Link></nav></div><div className="lp-footer-bottom"><span>© {new Date().getFullYear()} NavCRM</span><span>Создано для вашего рабочего дня.</span><a href="#top">Наверх ↑</a></div></footer>
  </div>
}
