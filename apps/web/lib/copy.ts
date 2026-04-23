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
        "Sign in to keep your month, memories, and editing state together. The screen stays light, but the auth boundary is explicit and ready for a provider swap later.",
      featureCards: [
        {
          body: "Your month view, day editing flow, and API boundary stay under Toda ownership.",
          title: "Route-first auth",
        },
        {
          body: "The login surface is server-led, mobile-first, and shaped around a fixed safe-area panel.",
          title: "Calm entry",
        },
        {
          body: "Supabase can be swapped later because the UI only knows Toda routes and provider enums.",
          title: "Swappable broker",
        },
      ],
      highlightsAriaLabel: "Login highlights",
      title: "Start your calm calendar",
    },
  },
  component: {
    calendarHeader: {
      previewModeAriaLabel:
        "Month preview mode control. Double tap to cycle visible previews.",
      weekdayRowAriaLabel: "Days of the week",
      signOut: "Sign out",
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
        "Toda owns the route contract and the API boundary. The provider only brokers the OAuth handshake.",
      defaultWaitingMessage:
        "OAuth wiring is pending. Add the public Supabase env vars first, then these same buttons will hand off to the real provider flow.",
      eyebrow: "Sign In",
      navAriaLabel: "Social sign in",
      title: "Three entry points, one calm timeline.",
    },
    textEditor: {
      placeholder: "Write",
      writeAriaLabel: "Write a note",
    },
  },
} as const
