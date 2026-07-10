import {defineTheme} from '@astryxdesign/core/theme';

export const the_court_themeTheme = defineTheme({
  name: 'the_court_theme',
  tokens: {
    '--color-accent': 'light-dark(#DCCA04, #FDEE8C)',
    '--color-accent-muted': 'light-dark(color-mix(in srgb, var(--color-accent) 20%, transparent), color-mix(in srgb, var(--color-accent) 25%, transparent))',
    '--color-on-accent': 'light-dark(#FFFFFF, #002592)',
    '--color-neutral': 'light-dark(#D1D4164D, #E3E1EB33)',
    '--color-background-surface': 'light-dark(#FFFFFF, #1C1B21)',
    '--color-background-body': 'light-dark(#F1F0F9, #111018)',
    '--color-overlay': 'light-dark(#1C1B2166, #1C1B2199)',
    '--color-overlay-hover': 'light-dark(#1C1B210D, #FFFFFF0D)',
    '--color-overlay-pressed': 'light-dark(#1C1B211A, #FFFFFF1A)',
    '--color-background-muted': 'light-dark(#1C1B210D, #1C1B2180)',
    '--color-text-primary': 'light-dark(#1C1B21, #E3E1EB)',
    '--color-text-secondary': 'light-dark(#474552, #ACA9B8)',
    '--color-text-disabled': 'light-dark(#918F9D, #5F5D6A)',
    '--color-text-accent': 'var(--color-accent)',
    '--color-on-dark': '#ffffff',
    '--color-on-light': '#1d1c11',
    '--color-icon-accent': 'var(--color-accent)',
    '--color-icon-primary': 'light-dark(#1C1B21, #E3E1EB)',
    '--color-icon-secondary': 'light-dark(#474552, #ACA9B8)',
    '--color-icon-disabled': 'light-dark(#918F9D, #5F5D6A)',
    '--color-background-card': 'light-dark(#FFFFFF, #1C1B21)',
    '--color-background-popover': 'light-dark(#FCFBFF, #313037)',
    '--color-background-inverted': 'light-dark(#1C1B21, #FCFBFF)',
    '--color-success': 'light-dark(#004700, #99d94b)',
    '--color-success-muted': 'light-dark(#00470033, #99d94b40)',
    '--color-on-success': 'light-dark(#ccff88, #0b2e00)',
    '--color-error': 'light-dark(#771210, #ffb4a6)',
    '--color-error-muted': 'light-dark(#77121033, #ffb4a640)',
    '--color-on-error': 'light-dark(#ffe3de, #600000)',
    '--color-warning': 'light-dark(#543700, #f7be00)',
    '--color-warning-muted': 'light-dark(#54370033, #f7be0040)',
    '--color-on-warning': 'light-dark(#ffeec3, #3b2200)',
    '--color-border': 'light-dark(#1C1B211A, #F1F0F91A)',
    '--color-border-emphasized': 'light-dark(#ACA9B8, #474552)',
    '--color-skeleton': 'light-dark(#ACA9B8, #474552)',
    '--color-track': 'light-dark(#ACA9B8, #474552)',
    '--color-shadow': 'light-dark(#0000001A, #0000004D)',
    '--color-background-blue': 'light-dark(#dbe1ff, #dbe1ff)',
    '--color-border-blue': 'light-dark(#bdc5eb, #bdc5eb)',
    '--color-icon-blue': 'light-dark(#203a6c, #203a6c)',
    '--color-text-blue': 'light-dark(#203a6c, #203a6c)',
    '--color-background-cyan': 'light-dark(#a9eff0, #a9eff0)',
    '--color-border-cyan': 'light-dark(#8dd2d3, #8dd2d3)',
    '--color-icon-cyan': 'light-dark(#004649, #004649)',
    '--color-text-cyan': 'light-dark(#004649, #004649)',
    '--color-background-gray': 'light-dark(#f0edd4, #f0edd4)',
    '--color-border-gray': 'light-dark(#d6d3b8, #d6d3b8)',
    '--color-icon-gray': 'light-dark(#4a4732, #4a4732)',
    '--color-text-gray': 'light-dark(#4a4732, #4a4732)',
    '--color-background-green': 'light-dark(#c1efb8, #c1efb8)',
    '--color-border-green': 'light-dark(#a5d29d, #a5d29d)',
    '--color-icon-green': 'light-dark(#004800, #004800)',
    '--color-text-green': 'light-dark(#004800, #004800)',
    '--color-background-orange': 'light-dark(#ffdcb6, #ffdcb6)',
    '--color-border-orange': 'light-dark(#f2bd81, #f2bd81)',
    '--color-icon-orange': 'light-dark(#622e00, #622e00)',
    '--color-text-orange': 'light-dark(#622e00, #622e00)',
    '--color-background-pink': 'light-dark(#ffd5fb, #ffd5fb)',
    '--color-border-pink': 'light-dark(#f0b3e8, #f0b3e8)',
    '--color-icon-pink': 'light-dark(#6c0a68, #6c0a68)',
    '--color-text-pink': 'light-dark(#6c0a68, #6c0a68)',
    '--color-background-purple': 'light-dark(#f2daff, #f2daff)',
    '--color-border-purple': 'light-dark(#ddb9f6, #ddb9f6)',
    '--color-icon-purple': 'light-dark(#52237b, #52237b)',
    '--color-text-purple': 'light-dark(#52237b, #52237b)',
    '--color-background-red': 'light-dark(#ffdad3, #ffdad3)',
    '--color-border-red': 'light-dark(#f4b8ae, #f4b8ae)',
    '--color-icon-red': 'light-dark(#6d211c, #6d211c)',
    '--color-text-red': 'light-dark(#6d211c, #6d211c)',
    '--color-background-teal': 'light-dark(#b0f0d7, #b0f0d7)',
    '--color-border-teal': 'light-dark(#94d3bb, #94d3bb)',
    '--color-icon-teal': 'light-dark(#00482d, #00482d)',
    '--color-text-teal': 'light-dark(#00482d, #00482d)',
    '--color-background-yellow': 'light-dark(#feee7b, #feee7b)',
    '--color-border-yellow': 'light-dark(#d6c957, #d6c957)',
    '--color-icon-yellow': 'light-dark(#413e00, #413e00)',
    '--color-text-yellow': 'light-dark(#413e00, #413e00)',
    '--spacing-0-5': '1px',
    '--spacing-1': '2px',
    '--spacing-1-5': '3px',
    '--spacing-2': '4px',
    '--spacing-3': '6px',
    '--spacing-4': '8px',
    '--spacing-5': '10px',
    '--spacing-6': '12px',
    '--spacing-7': '14px',
    '--spacing-8': '16px',
    '--spacing-9': '18px',
    '--spacing-10': '20px',
    '--spacing-11': '22px',
    '--spacing-12': '24px',
    '--radius-inner': '2px',
    '--radius-element': '4px',
    '--radius-container': '6px',
    '--radius-page': '14px',
    '--radius-chat': '14px',
    '--font-family-body': 'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    '--font-family-code': '"JetBrains Mono", "SF Mono", Monaco, Consolas, monospace',
    '--font-family-heading': 'Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    '--font-size-4xs': '0.4375rem',
    '--font-size-xs': '0.5625rem',
    '--font-size-sm': '0.6875rem',
    '--font-size-base': '0.75rem',
    '--font-size-lg': '0.875rem',
    '--font-size-xl': '0.9375rem',
    '--font-size-2xl': '1.0625rem',
    '--font-size-3xl': '1.1875rem',
    '--font-size-4xl': '1.375rem',
    '--font-size-5xl': '1.5rem',
    '--text-heading-1-leading': '1.4118',
    '--text-heading-2-leading': '1.6',
    '--text-heading-3-leading': '1.4286',
    '--text-heading-4-leading': '1.6667',
    '--text-heading-5-leading': '1.4545',
    '--text-heading-6-leading': '1.7778',
    '--text-body-leading': '1.6667',
    '--text-large-leading': '1.4286',
    '--text-label-leading': '1.6667',
    '--text-code-leading': '1.6667',
    '--text-supporting-leading': '1.4545',
    '--text-display-1-leading': '1.3333',
    '--text-display-2-leading': '1.4545',
    '--text-display-3-leading': '1.4737',
    '--size-element-sm': '26px',
    '--size-element-md': '28px',
    '--size-element-lg': '30px',
    '--shadow-low': '0 2px 4px #1d1c110D, 0 4px 8px #1d1c111A',
    '--shadow-med': '0 2px 4px #1d1c110D, 0 4px 12px #1d1c111A',
    '--shadow-high': '0 4px 6px #1d1c111A, 0 12px 24px #1d1c1126',
    '--shadow-inset-hover': 'inset 0px 0px 0px 2px rgba(34, 91, 255, 0.3)',
    '--shadow-inset-selected': 'inset 0px 0px 0px 2px rgba(34, 91, 255, 0.5)',
    '--shadow-inset-success': 'inset 0px 0px 0px 2px #00470030',
    '--shadow-inset-warning': 'inset 0px 0px 0px 2px #54370030',
    '--shadow-inset-error': 'inset 0px 0px 0px 2px #77121030',
    '--duration-fast-min': '95ms',
    '--duration-fast': '125ms',
    '--duration-fast-max': '165ms',
    '--duration-medium-min': '225ms',
    '--duration-medium': '300ms',
    '--duration-medium-max': '400ms',
    '--duration-slow-min': '525ms',
    '--duration-slow': '700ms',
    '--duration-slow-max': '935ms',
    '--color-syntax-keyword': 'light-dark(#52237b, #ddb9f6)',
    '--color-syntax-string': 'light-dark(#004800, #a5d29d)',
    '--color-syntax-comment': 'light-dark(#605f52, #adac9e)',
    '--color-syntax-number': 'light-dark(#622e00, #f2bd81)',
    '--color-syntax-function': 'light-dark(#203a6c, #bdc5eb)',
    '--color-syntax-type': 'light-dark(#52237b, #ddb9f6)',
    '--color-syntax-variable': 'light-dark(#605f52, #adac9e)',
    '--color-syntax-operator': 'light-dark(#605f52, #adac9e)',
    '--color-syntax-constant': 'light-dark(#622e00, #f2bd81)',
    '--color-syntax-tag': 'light-dark(#6d211c, #f4b8ae)',
    '--color-syntax-attribute': 'light-dark(#413e00, #d6c957)',
    '--color-syntax-property': 'light-dark(#00482d, #94d3bb)',
    '--color-syntax-punctuation': 'light-dark(#605f52, #adac9e)',
    '--color-syntax-background': 'light-dark(#FDFBE4, #131107)',
  },
  components: {
    'heading': {
      'level:1': {
        'fontFamily': 'var(--font-family-heading)',
        'fontSize': 'var(--text-heading-1-size)',
        'fontWeight': 'var(--text-heading-1-weight)',
        'lineHeight': 'var(--text-heading-1-leading)',
      },
      'level:2': {
        'fontFamily': 'var(--font-family-heading)',
        'fontSize': 'var(--text-heading-2-size)',
        'fontWeight': 'var(--text-heading-2-weight)',
        'lineHeight': 'var(--text-heading-2-leading)',
      },
      'level:3': {
        'fontFamily': 'var(--font-family-heading)',
        'fontSize': 'var(--text-heading-3-size)',
        'fontWeight': 'var(--text-heading-3-weight)',
        'lineHeight': 'var(--text-heading-3-leading)',
      },
      'level:4': {
        'fontFamily': 'var(--font-family-heading)',
        'fontSize': 'var(--text-heading-4-size)',
        'fontWeight': 'var(--text-heading-4-weight)',
        'lineHeight': 'var(--text-heading-4-leading)',
      },
      'level:5': {
        'fontFamily': 'var(--font-family-heading)',
        'fontSize': 'var(--text-heading-5-size)',
        'fontWeight': 'var(--text-heading-5-weight)',
        'lineHeight': 'var(--text-heading-5-leading)',
      },
      'level:6': {
        'fontFamily': 'var(--font-family-heading)',
        'fontSize': 'var(--text-heading-6-size)',
        'fontWeight': 'var(--text-heading-6-weight)',
        'lineHeight': 'var(--text-heading-6-leading)',
      },
    },
    'text': {
      'type:body': {
        'fontFamily': 'var(--font-family-body)',
        'fontSize': 'var(--text-body-size)',
        'lineHeight': 'var(--text-body-leading)',
      },
      'type:large': {
        'fontFamily': 'var(--font-family-body)',
        'fontSize': 'var(--text-large-size)',
        'lineHeight': 'var(--text-large-leading)',
      },
      'type:label': {
        'fontFamily': 'var(--font-family-body)',
        'fontSize': 'var(--text-label-size)',
        'lineHeight': 'var(--text-label-leading)',
      },
      'type:code': {
        'fontFamily': 'var(--font-family-code)',
        'fontSize': 'var(--text-code-size)',
        'lineHeight': 'var(--text-code-leading)',
      },
      'type:supporting': {
        'fontFamily': 'var(--font-family-body)',
        'fontSize': 'var(--text-supporting-size)',
        'lineHeight': 'var(--text-supporting-leading)',
      },
      'type:display-1': {
        'fontFamily': 'Sarina, "Brush Script MT", "Snell Roundhand", cursive',
        'fontSize': 'var(--text-display-1-size)',
        'lineHeight': 'var(--text-display-1-leading)',
      },
      'type:display-2': {
        'fontFamily': 'Sarina, "Brush Script MT", "Snell Roundhand", cursive',
        'fontSize': 'var(--text-display-2-size)',
        'lineHeight': 'var(--text-display-2-leading)',
      },
      'type:display-3': {
        'fontFamily': 'Sarina, "Brush Script MT", "Snell Roundhand", cursive',
        'fontSize': 'var(--text-display-3-size)',
        'lineHeight': 'var(--text-display-3-leading)',
      },
    },
    'top-nav-heading': {
      'base': {
        'color': 'light-dark(#225BFF, #FDEE8C)',
        '--color-text-primary': 'light-dark(#225BFF, #FDEE8C)',
      },
    },
    'top-nav-item': {
      'base': {
        'color': 'light-dark(#6E92FF, #FDEE8CCC)',
      },
      'selected': {
        'color': 'light-dark(#225BFF, #FDEE8C)',
        'backgroundColor': 'transparent',
        ':hover': {
          'backgroundColor': 'var(--color-overlay-hover)',
        },
        ':active': {
          'backgroundColor': 'var(--color-overlay-pressed)',
        },
      },
    },
    'button': {
      'base': {
        'paddingBlock': 'var(--spacing-3)',
        'paddingInline': 'var(--spacing-4)',
        'borderRadius': 'var(--radius-container)',
      },
      'variant:secondary': {
        'backgroundColor': 'transparent',
        'borderWidth': '1.5px',
        'borderStyle': 'solid',
        'borderColor': 'light-dark(#225BFF, #FDEE8C)',
        'color': 'light-dark(#225BFF, #FDEE8C)',
        ':hover': {
          'backgroundColor': 'light-dark(#225BFF14, #FDEE8C14)',
        },
      },
      'variant:ghost': {
        'color': 'light-dark(#225BFF, #FDEE8C)',
      },
      'variant:destructive': {
        'backgroundColor': 'light-dark(#ffdad3, #f4b8ae)',
        'color': 'light-dark(#550000, #6d211c)',
      },
    },
    'badge': {
      'base': {
        'height': '30px',
        'paddingBlock': '0',
        'paddingInline': 'var(--spacing-3)',
      },
      'variant:info': {
        'backgroundColor': '#4883fd',
        'color': '#ffffff',
      },
      'variant:neutral': {
        'backgroundColor': '#ffee7b',
        'color': '#225BFF',
      },
      'variant:success': {
        'backgroundColor': '#91D143',
        'color': '#1d1c11',
      },
      'variant:warning': {
        'backgroundColor': '#ffc502',
        'color': '#1d1c11',
      },
      'variant:error': {
        'backgroundColor': '#fc473b',
        'color': '#ffffff',
      },
    },
    'banner': {
      'status:info': {
        '--color-accent-muted': '#4883fd',
        '--color-text-primary': '#ffffff',
        '--color-text-secondary': '#ffffff',
        '--color-accent': '#ffffff',
      },
      'status:success': {
        '--color-success-muted': '#91D143',
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#1d1c11',
        '--color-success': '#1d1c11',
      },
      'status:warning': {
        '--color-warning-muted': '#ffc502',
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#1d1c11',
        '--color-warning': '#1d1c11',
      },
      'status:error': {
        '--color-error-muted': '#fc473b',
        '--color-text-primary': '#ffffff',
        '--color-text-secondary': '#ffffff',
        '--color-error': '#ffffff',
      },
      'base': {
        'borderRadius': 'var(--radius-container)',
      },
    },
    'card': {
      'base': {
        'borderRadius': 'var(--radius-container)',
        'padding': 'var(--spacing-3)',
      },
      'variant:info': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:success': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:warning': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:error': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:blue': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:cyan': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:gray': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:green': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:orange': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:pink': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:purple': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:red': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:teal': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:yellow': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
      'variant:muted': {
        '--color-text-primary': '#1d1c11',
        '--color-text-secondary': '#605f52',
      },
    },
    'section': {
      'base': {
        'padding': 'var(--spacing-4)',
      },
    },
    'progressbar-track': {
      'base': {
        'backgroundColor': 'light-dark(#e5e3d4, #725538)',
      },
    },
    'progressbar-fill': {
      'variant:success': {
        'backgroundColor': '#91D143',
      },
      'variant:warning': {
        'backgroundColor': '#ffc502',
      },
      'variant:error': {
        'backgroundColor': '#fc473b',
      },
    },
    'field-status': {
      'type:success': {
        'backgroundColor': '#91D143',
        'color': '#1d1c11',
      },
      'type:warning': {
        'backgroundColor': '#ffc502',
        'color': '#1d1c11',
      },
      'type:error': {
        'backgroundColor': '#fc473b',
        'color': '#ffffff',
      },
    },
    'text-input': {
      'base': {
        'paddingBlock': 'var(--spacing-2)',
        'paddingInline': 'var(--spacing-3)',
        'borderColor': 'var(--color-border)',
        '--_field-radius': 'var(--radius-container)',
      },
      'status:success': {
        '--color-success': '#91D143',
      },
      'status:warning': {
        '--color-warning': '#ffc502',
      },
      'status:error': {
        '--color-error': '#fc473b',
      },
    },
    'textarea': {
      'base': {
        'paddingBlock': 'var(--spacing-2)',
        'paddingInline': 'var(--spacing-3)',
        'borderColor': 'var(--color-border)',
        '--_field-radius': 'var(--radius-container)',
      },
      'status:success': {
        '--color-success': '#91D143',
      },
      'status:warning': {
        '--color-warning': '#ffc502',
      },
      'status:error': {
        '--color-error': '#fc473b',
      },
    },
    'number-input': {
      'base': {
        'paddingBlock': 'var(--spacing-2)',
        'paddingInline': 'var(--spacing-3)',
        'borderColor': 'var(--color-border)',
      },
      'status:success': {
        '--color-success': '#91D143',
      },
      'status:warning': {
        '--color-warning': '#ffc502',
      },
      'status:error': {
        '--color-error': '#fc473b',
      },
    },
    'date-input': {
      'base': {
        'paddingBlock': 'var(--spacing-2)',
        'paddingInline': 'var(--spacing-3)',
        'borderColor': 'var(--color-border)',
      },
      'status:success': {
        '--color-success': '#91D143',
      },
      'status:warning': {
        '--color-warning': '#ffc502',
      },
      'status:error': {
        '--color-error': '#fc473b',
      },
    },
    'time-input': {
      'base': {
        'paddingBlock': 'var(--spacing-2)',
        'paddingInline': 'var(--spacing-3)',
        'borderColor': 'var(--color-border)',
      },
      'status:success': {
        '--color-success': '#91D143',
      },
      'status:warning': {
        '--color-warning': '#ffc502',
      },
      'status:error': {
        '--color-error': '#fc473b',
      },
    },
    'selector': {
      'base': {
        'paddingBlock': 'var(--spacing-2)',
        'paddingInline': 'var(--spacing-3)',
        'borderColor': 'var(--color-border)',
        '--_field-radius': 'var(--radius-container)',
      },
      'status:success': {
        '--color-success': '#91D143',
      },
      'status:warning': {
        '--color-warning': '#ffc502',
      },
      'status:error': {
        '--color-error': '#fc473b',
      },
    },
    'multi-selector': {
      'base': {
        'paddingBlock': 'var(--spacing-2)',
        'paddingInline': 'var(--spacing-3)',
        'borderColor': 'var(--color-border)',
      },
      'status:success': {
        '--color-success': '#91D143',
      },
      'status:warning': {
        '--color-warning': '#ffc502',
      },
      'status:error': {
        '--color-error': '#fc473b',
      },
    },
    'typeahead': {
      'base': {
        'paddingBlock': 'var(--spacing-2)',
        'paddingInline': 'var(--spacing-3)',
        'borderColor': 'var(--color-border)',
      },
      'status:success': {
        '--color-success': '#91D143',
      },
      'status:warning': {
        '--color-warning': '#ffc502',
      },
      'status:error': {
        '--color-error': '#fc473b',
      },
    },
    'tokenizer': {
      'base': {
        'paddingBlock': 'var(--spacing-2)',
        'paddingInline': 'var(--spacing-3)',
        'borderColor': 'var(--color-border)',
      },
      'status:success': {
        '--color-success': '#91D143',
      },
      'status:warning': {
        '--color-warning': '#ffc502',
      },
      'status:error': {
        '--color-error': '#fc473b',
      },
    },
  },
});