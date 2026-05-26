import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Cookies from 'js-cookie'

const resources = {
  en: {
    translation: {
      "nav.howItWorks": "How it works",
      "nav.startCall": "Start Call",
      "nav.startMeet": "Meetings",
      "hero.badge": "WebRTC v2.0 • Private Calls",
      "hero.title1": "Video calls",
      "hero.title2": "without extra steps",
      "hero.description": "Create an instant room with one click. No registrations, installations, or passwords. Just send the link and start chatting.",
      "hero.cta": "Create link",
      "features.private.title": "Private",
      "features.private.desc": "Your calls are protected by end-to-end WebRTC encryption. Data does not pass through our servers.",
      "features.instant.title": "Instant",
      "features.instant.desc": "No forms or email confirmations. One click and you're on air. The fastest way to call.",
      "features.anyDevice.title": "Any device",
      "features.anyDevice.desc": "Works in any modern browser on iOS, Android, macOS, and Windows. No installation required.",
      "how.title": "How TalkLink Works",
      "how.step1.title": "Create a link",
      "how.step1.desc": "Click \"Create link\" and instantly get a unique address for your video call.",
      "how.step2.title": "Send to participant",
      "how.step2.desc": "Copy the link and send it to anyone. They don't need to download anything or register.",
      "how.step3.title": "Start chatting",
      "how.step3.desc": "As soon as the participant opens the link, a direct secure connection will be established in your browser.",
      "footer.copy": "© 2026 TalkLink. Open Source • Privacy by Default",
      "call.title1": "Create your",
      "call.title2": "private room",
      "call.desc": "Click the button below to instantly generate a unique link. No data is stored on the server.",
      "call.generate": "Generate link",
      "call.protected": "Protected by WebRTC Encryption",
      "call.accessLink": "Access link",
      "call.copy": "Copy",
      "call.copied": "Copied!",
      "call.enter": "Enter room",
      "call.share": "Share link",
      "call.scan": "Scan to Join",
      "meet.title1": "Create your",
      "meet.title2": "group meeting",
      "meet.desc": "Up to 10 participants, duration 30 minutes. All connections are direct and private.",
      "meet.generate": "Create meeting",
      "call.steps.1.title": "Send the link",
      "call.steps.1.desc": "Copy the URL and send it to the participant via any messenger.",
      "call.steps.2.title": "Grant access",
      "call.steps.2.desc": "The browser will request permission to use the camera and microphone.",
      "call.steps.3.title": "Chat",
      "call.steps.3.desc": "The connection will be established automatically directly between you.",
      "room.status.init": "initializing",
      "room.status.devices": "requesting devices...",
      "room.status.pc": "creating peer connection...",
      "room.status.check": "checking link...",
      "room.status.signaling": "connecting to signaling...",
      "room.status.waiting": "waiting for participant...",
      "room.status.online": "online",
      "room.status.disconnected": "participant disconnected — waiting for reconnection...",
      "room.status.reconnecting": "signaling disconnected — reconnecting...",
      "room.status.roomFull": "room is full",
      "room.status.error": "Error",
      "room.settings": "Settings",
      "room.settings.language": "LANGUAGE",
      "room.settings.autoMute": "Disable media when focus changes",
      "room.settings.audioOutput": "AUDIO OUTPUT",
      "room.settings.default": "System default",
      "room.settings.outputDevice": "Output device",
      "room.mic.on": "Microphone on",
      "room.mic.off": "Microphone off",
      "room.mic.notFound": "Microphone not found",
      "room.cam.on": "Camera on",
      "room.cam.off": "Camera off",
      "room.cam.notFound": "Camera not found",
      "room.cam.switch": "Switch camera",
      "room.copyLink": "Copy link",
      "room.hangup": "Hang up",
      "room.error.full.title": "Room is full",
      "room.error.full.desc": "The maximum number of participants has already connected to this room. Create a new link.",
      "room.error.kicked.title": "Kicked by administrator",
      "room.error.kicked.desc": "Your connection was forcibly closed by the administrator.",
      "room.error.media.title": "Failed to establish media connection",
      "room.error.init.title": "Initialization Error",
      "room.error.connection.title": "Connection Problem",
      "room.error.connection.desc": "Failed to connect to the server after {{attempt}} attempts. Check your internet connection and try again.",
      "room.error.turn.required": "Relay (TURN) server is required but not configured. See README.",
      "room.error.turn.details": "Configured {{count}} TURN servers. Check ports {{ports}} and firewall.",
      "room.error.create.title": "Error creating room",
      "room.error.create.desc": "Failed to create a new room. Check your internet connection and try again.",
      "room.btn.newRoom": "Create new room",
      "room.btn.home": "Go home",
      "common.back": "Back"
    }
  },
  ru: {
    translation: {
      "nav.howItWorks": "Как это работает",
      "nav.startCall": "Начать звонок",
      "nav.startMeet": "Совещания",
      "hero.badge": "WebRTC v2.0 • Приватные звонки",
      "hero.title1": "Видеосвязь",
      "hero.title2": "без лишних шагов",
      "hero.description": "Создайте мгновенную комнату одним кликом. Никаких регистраций, установок и паролей. Просто отправьте ссылку и начните общение.",
      "hero.cta": "Создать ссылку",
      "features.private.title": "Приватно",
      "features.private.desc": "Ваши звонки защищены сквозным шифрованием WebRTC. Данные не проходят через наши серверы.",
      "features.instant.title": "Мгновенно",
      "features.instant.desc": "Никаких форм и подтверждений почты. Один клик и вы в эфире. Самый быстрый способ позвонить.",
      "features.anyDevice.title": "Любое устройство",
      "features.anyDevice.desc": "Работает в любом современном браузере на iOS, Android, macOS и Windows. Без установки.",
      "how.title": "Как работает TalkLink",
      "how.step1.title": "Создайте ссылку",
      "how.step1.desc": "Нажмите «Создать ссылку» и мгновенно получите уникальный адрес для вашего видеозвонка.",
      "how.step2.title": "Отправьте собеседнику",
      "how.step2.desc": "Скопируйте ссылку и отправьте её любому человеку. Ему не нужно ничего скачивать или регистрироваться.",
      "how.step3.title": "Начните общение",
      "how.step3.desc": "Как только собеседник откроет ссылку, установится прямое защищенное соединение в вашем браузере.",
      "footer.copy": "© 2026 TalkLink. Открытый исходный код • Приватность по умолчанию",
      "call.title1": "Создайте вашу",
      "call.title2": "приватную комнату",
      "call.desc": "Нажмите кнопку ниже, чтобы мгновенно сгенерировать уникальную ссылку. Никаких данных не сохраняется на сервере.",
      "call.generate": "Сгенерировать ссылку",
      "call.protected": "Защищено WebRTC Encryption",
      "call.accessLink": "Ссылка доступа",
      "call.copy": "Копировать",
      "call.copied": "Скопировано!",
      "call.enter": "Войти в комнату",
      "call.share": "Поделиться ссылкой",
      "call.scan": "Scan to Join",
      "meet.title1": "Создайте ваше",
      "meet.title2": "групповое совещание",
      "meet.desc": "До 10 участников, длительность 30 минут. Все соединения прямые и приватные.",
      "meet.generate": "Создать совещание",
      "call.steps.1.title": "Отправьте ссылку",
      "call.steps.1.desc": "Скопируйте URL и отправьте собеседнику через любой мессенджер.",
      "call.steps.2.title": "Дайте доступ",
      "call.steps.2.desc": "Браузер запросит разрешение на использование камеры и микрофона.",
      "call.steps.3.title": "Общайтесь",
      "call.steps.3.desc": "Соединение установится автоматически напрямую между вами.",
      "room.status.init": "инициализация",
      "room.status.devices": "запрос устройств…",
      "room.status.pc": "создание peer connection…",
      "room.status.check": "проверка ссылки…",
      "room.status.signaling": "подключение к сигнализации…",
      "room.status.waiting": "ожидание собеседника…",
      "room.status.online": "в сети",
      "room.status.disconnected": "собеседник отключился — ожидание переподключения…",
      "room.status.reconnecting": "сигнализация отключена — переподключение…",
      "room.status.roomFull": "комната заполнена",
      "room.status.error": "Ошибка",
      "room.settings": "Настройки",
      "room.settings.language": "ЯЗЫК",
      "room.settings.autoMute": "Отключать медиа при смене фокуса",
      "room.settings.audioOutput": "ВЫВОД ЗВУКА",
      "room.settings.default": "Системный по умолчанию",
      "room.settings.outputDevice": "Устройство вывода",
      "room.mic.on": "Микрофон включен",
      "room.mic.off": "Микрофон выключен",
      "room.mic.notFound": "Микрофон не найден",
      "room.cam.on": "Камера включена",
      "room.cam.off": "Камера выключена",
      "room.cam.notFound": "Камера не найдена",
      "room.cam.switch": "Переключить камеру",
      "room.copyLink": "Скопировать ссылку",
      "room.hangup": "Положить трубку",
      "room.error.full.title": "Комната заполнена",
      "room.error.full.desc": "В эту комнату уже подключены максимальное количество участников. Создайте новую ссылку.",
      "room.error.kicked.title": "Отключен администратором",
      "room.error.kicked.desc": "Ваше соединение было принудительно закрыто администратором.",
      "room.error.media.title": "Не удалось установить медиасоединение",
      "room.error.init.title": "Ошибка инициализации",
      "room.error.connection.title": "Проблема с подключением",
      "room.error.connection.desc": "Не удалось подключиться к серверу после {{attempt}} попыток. Проверьте интернет-соединение и попробуйте снова.",
      "room.error.turn.required": "Relay (TURN) сервер необходим, но не настроен. См. README.",
      "room.error.turn.details": "Настроено {{count}} TURN-серверов. Проверьте порты {{ports}} и фаервол.",
      "room.error.create.title": "Ошибка создания комнаты",
      "room.error.create.desc": "Не удалось создать новую комнату. Проверьте интернет-соединение и попробуйте снова.",
      "room.btn.newRoom": "Создать новую комнату",
      "room.btn.home": "На главную",
      "common.back": "Вернуться"
    }
  }
}

const detector = new LanguageDetector()
detector.addDetector({
  name: 'cookieLang',
  lookup() {
    return Cookies.get('lang')
  },
  cacheUserLanguage(lng) {
    Cookies.set('lang', lng, { expires: 365 })
  }
})

i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: (code) => {
      if (!code || code.startsWith('ru')) return 'ru'
      return 'en'
    },
    detection: {
      order: ['cookieLang', 'navigator'],
      caches: ['cookieLang'],
    },
    interpolation: {
      escapeValue: false
    }
  })

// Custom logic for initial set
const currentLang = Cookies.get('lang')
if (!currentLang) {
  const browserLang = navigator.language.toLowerCase()
  const langToSet = browserLang.startsWith('ru') ? 'ru' : 'en'
  i18n.changeLanguage(langToSet)
  Cookies.set('lang', langToSet, { expires: 365 })
}

export default i18n
