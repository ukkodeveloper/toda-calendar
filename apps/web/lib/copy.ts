export const appCopy = {
  meta: {
    description: "A calm, Apple-like month journaling calendar.",
    title: "Toda Calendar",
  },
  common: {
    locale: "en-US",
    photoFallbackAlt: "Photo",
    previewModes: {
      doodle: "Sketch",
      photo: "Photo",
      text: "Text",
    },
    selectedPhotoAlt: "Selected photo",
    weekdays: ["S", "M", "T", "W", "T", "F", "S"],
  },
  auth: {
    errors: {
      AUTH_NOT_CONFIGURED: {
        description:
          "The OAuth flow is wired, but the public Supabase keys are not configured in this environment yet.",
        title: "Auth setup is still pending",
      },
      AUTH_PROVIDER_NOT_SUPPORTED: {
        description:
          "That social sign-in entry does not exist in this build. Head back and choose Kakao, Apple, or Google.",
        title: "Unsupported provider",
      },
      AUTH_SIGN_IN_START_FAILED: {
        description:
          "Toda could not hand off to the social provider. Please try the same button again in a moment.",
        title: "The provider handoff did not start",
      },
      OAUTH_CODE_MISSING: {
        description:
          "The callback returned without a valid authorization code, so the session could not be finished.",
        title: "The callback came back incomplete",
      },
      SESSION_EXCHANGE_FAILED: {
        description:
          "The provider returned, but Toda could not exchange the callback for a web session cookie.",
        title: "The session could not be completed",
      },
    },
    providers: {
      apple: {
        actionLabel: "Continue with Apple",
        description: "A private, low-friction path for calm journaling.",
        mark: "A",
      },
      google: {
        actionLabel: "Continue with Google",
        description: "A familiar fallback for cross-device continuity.",
        mark: "G",
      },
      kakao: {
        actionLabel: "Continue with Kakao",
        description: "The fastest entry for Korea-first usage.",
        mark: "K",
      },
    },
  },
  page: {
    authError: {
      backToLogin: "Back to login",
      codeLabel: "Code",
      eyebrow: "Auth Error",
      fallbackDescription:
        "The auth flow stopped on an unexpected edge. Head back to login and try again.",
      fallbackTitle: "Authentication ran into a rough edge",
      returnHome: "Return home",
    },
    calendar: {
      authRequired: {
        cta: "로그인하기",
        description:
          "Supabase 로그인이 켜진 환경에서는 계정 연결 후 캘린더를 불러올 수 있어요.",
        eyebrow: "Sign In Required",
        title: "로그인이 필요해요",
      },
      backupPrompt: {
        description:
          "로그인하면 재설치해도 지금 달력을 다시 가져오고, 다른 기기에서도 바로 이어서 쓸 수 있어요.",
        later: "나중에",
        title: "이제 이 달력을 백업해둘까요?",
      },
      dockPrompts: [
        "Give today one small memory.",
        "Catch one quiet moment before the day fades.",
        "Leave a photo, sketch, or sentence for tonight.",
        "Keep today in a softer way.",
        "Write down the part you want to remember.",
      ],
      error: {
        eyebrow: "API Unavailable",
        fallbackDescription: "The calendar could not connect to the API.",
        retry: "Retry connection",
        title: "The calendar could not reach the backend.",
      },
      loading: {
        description:
          "The web surface now reads month records from `apps/api` instead of the local seed.",
        eyebrow: "Connecting",
        title: "Pulling your calendar from the API.",
      },
      sessionFallbackLabel: "Signed in",
    },
    login: {
      badge: "Toda Calendar",
      description:
        "로그인하면 캘린더를 잃지 않고, 재설치 뒤에도 다시 가져오고, 다른 기기에서도 그대로 이어서 쓸 수 있어요.",
      featureCards: [
        {
          body: "앱을 먼저 써보다가, 필요할 때만 계정을 연결할 수 있어요.",
          title: "늦은 로그인",
        },
        {
          body: "로그인 뒤에는 서버를 기준으로 백업과 복구 흐름을 가져가요.",
          title: "안전한 복구",
        },
        {
          body: "Google, Apple 같은 provider가 늘어나도 Toda user 기준 구조는 그대로 유지돼요.",
          title: "확장 가능한 계정 구조",
        },
      ],
      highlightsAriaLabel: "Login highlights",
      title: "내 캘린더를 안전하게 이어 쓰기",
    },
    settings: {
      accountGuestBody:
        "로그인하면 이 기기에 있는 일정 흐름을 백업하고, 새 기기에서도 그대로 이어서 볼 수 있어요.",
      accountGuestCta: "로그인하고 백업 시작",
      accountGuestTitle: "아직 백업이 연결되지 않았어요",
      accountLoggedInBody:
        "이 기기 로그아웃 후에도 로컬 일정과 캐시는 남고, 서버 동기화만 멈춰요.",
      accountLoggedInTitle: "이 기기에서 계정 연결됨",
      backToCalendar: "캘린더로 돌아가기",
      backupBody:
        "Toda는 서버를 기준 원본으로 두고, 이 기기에는 캐시와 오프라인 대응 데이터를 남겨둬요.",
      backupTitle: "백업 및 동기화",
      logoutConfirmDescription:
        "이 기기에서 로그인 상태가 해제돼요. 저장된 일정은 그대로 볼 수 있어요.",
      logoutConfirmTitle: "로그아웃하시겠어요?",
      logoutCta: "로그아웃",
      runtimePending:
        "이 빌드는 OAuth 연결 준비 전 상태예요. 설정 화면만 먼저 확인할 수 있어요.",
      title: "설정",
    },
  },
  component: {
    calendarHeader: {
      previewModeAriaLabel:
        "Month preview mode control. Double tap to cycle visible previews.",
      settingsAriaLabel: "Open settings",
      weekdayRowAriaLabel: "Days of the week",
    },
    settingsPage: {
      closeConfirm: "취소",
    },
    dayCell: {
      noteFallback: "Note",
      openDayAriaSuffix: "Open the day editor.",
    },
    dayEditorSheet: {
      closeEditorAriaLabel: "Close editor",
      dragEditorAriaLabel: "Drag editor",
      emptyTitle: "Edit day",
      tabs: {
        doodle: "Sketch",
        photo: "Photo",
        text: "Text",
      },
    },
    doodleCanvas: {
      buttons: {
        clear: "Clear",
        done: "Done",
        edit: "Edit",
        start: "Draw",
      },
      clearAriaLabel: "Clear sketch",
      editAriaLabel: "Edit sketch",
      finishAriaLabel: "Finish sketch editing",
      startAriaLabel: "Start sketching",
    },
    photoEditor: {
      addAriaLabel: "Add photo",
      replaceAriaLabel: "Replace photo",
      tapToAdd: "Add",
      tapToReplace: "Change",
    },
    socialLoginButton: {
      disabledTrailingMark: "...",
      readyTrailingMark: "->",
    },
    socialLoginPanel: {
      agreement:
        "By continuing, you agree to the Toda Calendar terms and privacy policy.",
      badge: "MVP",
      defaultReadyMessage:
        "Google이나 Apple로 연결하면 지금 기기 데이터 백업과 새 기기 복구를 바로 시작할 수 있어요.",
      defaultWaitingMessage:
        "OAuth wiring is pending. Add the public Supabase env vars first, then these same buttons will hand off to the real provider flow.",
      eyebrow: "Sign In",
      navAriaLabel: "Social sign in",
      title: "백업과 복구를 연결해둘까요?",
    },
    textEditor: {
      placeholder: "Write",
      writeAriaLabel: "Write a note",
    },
  },
} as const
