// 생성 파일 — 손으로 고치지 않는다. internal 조합 생성기 internal-compose-1 (SPEC m3p 2절) · 다시 만들기: node scripts/generate-internal-refs.mjs
import type { ComparisonAttributes } from "../domain/comparisonCells";
import type { ReferenceDetail } from "../domain/referenceDetail";

export const generatedReferenceDetailFixtures: Readonly<Record<string, ReferenceDetail>> = Object.freeze({
  "gen-cafe-fnb-1": {
    "audienceNote": "가족 단위",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-right-cta"
      },
      {
        "name": "Hero",
        "variant": "split"
      },
      {
        "name": "Services",
        "variant": "grid-3"
      },
      {
        "name": "Portfolio",
        "variant": "grid-3"
      },
      {
        "name": "Pricing",
        "variant": "cards"
      },
      {
        "name": "Testimonials",
        "variant": "carousel"
      },
      {
        "name": "Contact",
        "variant": "form"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#1E3A6E"
      },
      {
        "role": "surface",
        "hex": "#EBF0F8"
      },
      {
        "role": "ink",
        "hex": "#1A2233"
      },
      {
        "role": "muted",
        "hex": "#4E5A6E"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 15.9,
    "typography": {
      "family": "Pretendard",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.25
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 96
    },
    "motionNote": "슬라이드 300ms",
    "mobileFlow": [
      "단일 컬럼",
      "햄버거 메뉴",
      "히어로 4:5",
      "카드 세로 스택",
      "하단 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-cafe-fnb-2",
        "ref-a",
        "ref-f"
      ],
      "concept": [
        "gen-beauty-2",
        "ref-a",
        "ref-f"
      ],
      "layout": [
        "gen-education-3",
        "gen-professional-2",
        "ref-b"
      ]
    }
  },
  "gen-cafe-fnb-2": {
    "audienceNote": "20~30대",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-right-cta"
      },
      {
        "name": "Hero",
        "variant": "grid"
      },
      {
        "name": "About",
        "variant": "split"
      },
      {
        "name": "Services",
        "variant": "schedule-table"
      },
      {
        "name": "Testimonials",
        "variant": "quotes-2"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "booking"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#3F3D9E"
      },
      {
        "role": "surface",
        "hex": "#EEEEFA"
      },
      {
        "role": "ink",
        "hex": "#1D1C33"
      },
      {
        "role": "muted",
        "hex": "#57566E"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 16.6,
    "typography": {
      "family": "Noto Sans KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.2
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 64
    },
    "motionNote": "페이드 200ms",
    "mobileFlow": [
      "단일 컬럼",
      "햄버거 메뉴",
      "히어로 16:9",
      "카드 세로 스택",
      "하단 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-cafe-fnb-1",
        "ref-a",
        "ref-f"
      ],
      "concept": [
        "gen-beauty-3",
        "gen-education-1",
        "gen-education-2",
        "gen-education-3",
        "gen-education-4",
        "gen-medical-3"
      ],
      "layout": [
        "gen-beauty-3",
        "gen-medical-3",
        "ref-d"
      ]
    }
  },
  "gen-beauty-1": {
    "audienceNote": "20~30대",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-right-cta"
      },
      {
        "name": "Hero",
        "variant": "center"
      },
      {
        "name": "About",
        "variant": "team-grid-3"
      },
      {
        "name": "Services",
        "variant": "schedule-table"
      },
      {
        "name": "Testimonials",
        "variant": "quotes-2"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "booking"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#2F6B4F"
      },
      {
        "role": "surface",
        "hex": "#EAF4EE"
      },
      {
        "role": "ink",
        "hex": "#1E2A24"
      },
      {
        "role": "muted",
        "hex": "#4F6359"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 14.9,
    "typography": {
      "family": "Noto Serif KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.2
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 64
    },
    "motionNote": "페이드 200ms",
    "mobileFlow": [
      "단일 컬럼",
      "햄버거 메뉴",
      "히어로 1:1",
      "카드 세로 스택",
      "하단 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-beauty-2",
        "gen-beauty-3",
        "ref-b"
      ],
      "concept": [
        "gen-professional-2",
        "gen-professional-3",
        "ref-a",
        "ref-b"
      ],
      "layout": [
        "gen-education-4",
        "gen-professional-3",
        "ref-c"
      ]
    }
  },
  "gen-beauty-2": {
    "audienceNote": "20~30대 · 가족 단위",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-right-cta"
      },
      {
        "name": "Hero",
        "variant": "text"
      },
      {
        "name": "Services",
        "variant": "masonry"
      },
      {
        "name": "Portfolio",
        "variant": "grid-2"
      },
      {
        "name": "Pricing",
        "variant": "cards"
      },
      {
        "name": "Testimonials",
        "variant": "carousel"
      },
      {
        "name": "Contact",
        "variant": "form"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#1565A6"
      },
      {
        "role": "surface",
        "hex": "#E8F2FA"
      },
      {
        "role": "ink",
        "hex": "#15212C"
      },
      {
        "role": "muted",
        "hex": "#4C5D6C"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 16.3,
    "typography": {
      "family": "Noto Serif KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.25
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 96
    },
    "motionNote": "슬라이드 300ms",
    "mobileFlow": [
      "단일 컬럼",
      "햄버거 메뉴",
      "히어로 1:1",
      "카드 세로 스택",
      "하단 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-beauty-1",
        "gen-beauty-3",
        "ref-b"
      ],
      "concept": [
        "gen-cafe-fnb-1",
        "gen-medical-2",
        "gen-professional-3",
        "ref-a",
        "ref-e"
      ],
      "layout": [
        "gen-education-1",
        "gen-medical-1",
        "ref-e"
      ]
    }
  },
  "gen-beauty-3": {
    "audienceNote": "20~30대 · 가족 단위",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "transparent"
      },
      {
        "name": "Hero",
        "variant": "grid"
      },
      {
        "name": "About",
        "variant": "story"
      },
      {
        "name": "Services",
        "variant": "schedule-table"
      },
      {
        "name": "Testimonials",
        "variant": "carousel"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "booking"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#0F6E73"
      },
      {
        "role": "surface",
        "hex": "#E6F4F4"
      },
      {
        "role": "ink",
        "hex": "#142526"
      },
      {
        "role": "muted",
        "hex": "#4A6264"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 15.9,
    "typography": {
      "family": "Noto Sans KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.25
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 96
    },
    "motionNote": "슬라이드 300ms",
    "mobileFlow": [
      "단일 컬럼",
      "하단 탭 메뉴",
      "히어로 16:9",
      "카드 세로 스택",
      "하단 탭 메뉴"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-beauty-1",
        "gen-beauty-2",
        "ref-b"
      ],
      "concept": [
        "gen-cafe-fnb-2",
        "gen-education-1",
        "gen-education-2",
        "gen-education-3",
        "gen-education-4",
        "ref-d"
      ],
      "layout": [
        "gen-cafe-fnb-2",
        "gen-medical-3",
        "ref-d"
      ]
    }
  },
  "gen-medical-1": {
    "audienceNote": "가족 단위",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "transparent"
      },
      {
        "name": "Hero",
        "variant": "text"
      },
      {
        "name": "About",
        "variant": "split"
      },
      {
        "name": "Services",
        "variant": "grid-3"
      },
      {
        "name": "Testimonials",
        "variant": "quotes-2"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "booking"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#A13D2D"
      },
      {
        "role": "surface",
        "hex": "#FBEEEA"
      },
      {
        "role": "ink",
        "hex": "#2D1C18"
      },
      {
        "role": "muted",
        "hex": "#6E5550"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 16.3,
    "typography": {
      "family": "Noto Serif KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.2
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 64
    },
    "motionNote": "페이드 200ms",
    "mobileFlow": [
      "단일 컬럼",
      "하단 탭 메뉴",
      "히어로 4:5",
      "카드 세로 스택",
      "하단 탭 메뉴"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-medical-2",
        "gen-medical-3",
        "ref-c"
      ],
      "concept": [
        "gen-medical-2",
        "gen-medical-3",
        "gen-professional-1",
        "gen-professional-2",
        "ref-c"
      ],
      "layout": [
        "gen-beauty-2",
        "gen-education-1",
        "ref-e"
      ]
    }
  },
  "gen-medical-2": {
    "audienceNote": "가족 단위",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-two-tier"
      },
      {
        "name": "Hero",
        "variant": "image"
      },
      {
        "name": "Services",
        "variant": "grid-2"
      },
      {
        "name": "About",
        "variant": "team-grid-2"
      },
      {
        "name": "Portfolio",
        "variant": "insights-grid-3"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "form"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#3D4B5C"
      },
      {
        "role": "surface",
        "hex": "#EEF1F4"
      },
      {
        "role": "ink",
        "hex": "#1C232B"
      },
      {
        "role": "muted",
        "hex": "#56616E"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 15.9,
    "typography": {
      "family": "Noto Sans KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.2
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 64
    },
    "motionNote": "페이드 200ms",
    "mobileFlow": [
      "2컬럼 카드",
      "2단 메뉴 접기",
      "히어로 16:9",
      "카드 세로 스택",
      "하단 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-medical-1",
        "gen-medical-3",
        "ref-c"
      ],
      "concept": [
        "gen-beauty-2",
        "gen-medical-1",
        "gen-professional-1",
        "gen-professional-3",
        "ref-c",
        "ref-e"
      ],
      "layout": [
        "gen-professional-1",
        "ref-f"
      ]
    }
  },
  "gen-medical-3": {
    "audienceNote": "가족 단위",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-hamburger"
      },
      {
        "name": "Hero",
        "variant": "grid"
      },
      {
        "name": "About",
        "variant": "split"
      },
      {
        "name": "Services",
        "variant": "schedule-table"
      },
      {
        "name": "Testimonials",
        "variant": "quotes-2"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "booking"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#6B4226"
      },
      {
        "role": "surface",
        "hex": "#F6EEE6"
      },
      {
        "role": "ink",
        "hex": "#2A211B"
      },
      {
        "role": "muted",
        "hex": "#6E5A4C"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 15.8,
    "typography": {
      "family": "Pretendard",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.2
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 64
    },
    "motionNote": "페이드 200ms",
    "mobileFlow": [
      "단일 컬럼",
      "햄버거 메뉴",
      "히어로 16:9",
      "카드 세로 스택",
      "스티키 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-medical-1",
        "gen-medical-2",
        "ref-c"
      ],
      "concept": [
        "gen-cafe-fnb-2",
        "gen-education-1",
        "gen-education-2",
        "gen-education-3",
        "gen-education-4",
        "gen-medical-1"
      ],
      "layout": [
        "gen-beauty-3",
        "gen-cafe-fnb-2",
        "ref-d"
      ]
    }
  },
  "gen-professional-1": {
    "audienceNote": "기업 고객",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-two-tier"
      },
      {
        "name": "Hero",
        "variant": "image"
      },
      {
        "name": "Services",
        "variant": "cards-3"
      },
      {
        "name": "About",
        "variant": "team-grid-2"
      },
      {
        "name": "Portfolio",
        "variant": "grid-3"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "map-form"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#6A2C5B"
      },
      {
        "role": "surface",
        "hex": "#F7ECF3"
      },
      {
        "role": "ink",
        "hex": "#2B1D27"
      },
      {
        "role": "muted",
        "hex": "#6B5565"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 16.1,
    "typography": {
      "family": "Noto Sans KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.25
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 96
    },
    "motionNote": "슬라이드 300ms",
    "mobileFlow": [
      "2컬럼 카드",
      "2단 메뉴 접기",
      "히어로 16:9",
      "카드 세로 스택",
      "하단 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-professional-2",
        "gen-professional-3",
        "ref-e"
      ],
      "concept": [
        "gen-medical-1",
        "gen-medical-2",
        "ref-c",
        "ref-e"
      ],
      "layout": [
        "gen-medical-2",
        "ref-f"
      ]
    }
  },
  "gen-professional-2": {
    "audienceNote": "기업 고객",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-two-tier"
      },
      {
        "name": "Hero",
        "variant": "split"
      },
      {
        "name": "Services",
        "variant": "grid-2"
      },
      {
        "name": "About",
        "variant": "story"
      },
      {
        "name": "Portfolio",
        "variant": "grid-3"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "map-form"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#5A6324"
      },
      {
        "role": "surface",
        "hex": "#F3F4E6"
      },
      {
        "role": "ink",
        "hex": "#23261A"
      },
      {
        "role": "muted",
        "hex": "#5C604A"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 15.4,
    "typography": {
      "family": "Noto Serif KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.25
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 96
    },
    "motionNote": "슬라이드 300ms",
    "mobileFlow": [
      "2컬럼 카드",
      "2단 메뉴 접기",
      "히어로 1:1",
      "카드 세로 스택",
      "하단 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-professional-1",
        "gen-professional-3",
        "ref-e"
      ],
      "concept": [
        "gen-beauty-1",
        "gen-medical-1",
        "gen-medical-3",
        "ref-b",
        "ref-c"
      ],
      "layout": [
        "gen-cafe-fnb-1",
        "gen-education-3",
        "ref-b"
      ]
    }
  },
  "gen-professional-3": {
    "audienceNote": "기업 고객",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-two-tier"
      },
      {
        "name": "Hero",
        "variant": "center"
      },
      {
        "name": "Services",
        "variant": "grid-2"
      },
      {
        "name": "About",
        "variant": "text"
      },
      {
        "name": "Portfolio",
        "variant": "insights-grid-3"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "map-form"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#B0304F"
      },
      {
        "role": "surface",
        "hex": "#FCEEF1"
      },
      {
        "role": "ink",
        "hex": "#2E1B20"
      },
      {
        "role": "muted",
        "hex": "#6F5359"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 16.2,
    "typography": {
      "family": "Noto Sans KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.25
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 96
    },
    "motionNote": "슬라이드 300ms",
    "mobileFlow": [
      "2컬럼 카드",
      "2단 메뉴 접기",
      "히어로 16:9",
      "카드 세로 스택",
      "하단 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-professional-1",
        "gen-professional-2",
        "ref-e"
      ],
      "concept": [
        "gen-beauty-1",
        "gen-beauty-2",
        "gen-medical-2",
        "ref-a",
        "ref-e"
      ],
      "layout": [
        "gen-beauty-1",
        "gen-education-4",
        "ref-c"
      ]
    }
  },
  "gen-education-1": {
    "audienceNote": "20~30대",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-right-cta"
      },
      {
        "name": "Hero",
        "variant": "text"
      },
      {
        "name": "Services",
        "variant": "cards-3"
      },
      {
        "name": "About",
        "variant": "text"
      },
      {
        "name": "Portfolio",
        "variant": "case-list"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "map-form"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#8A5A00"
      },
      {
        "role": "surface",
        "hex": "#FFF5E0"
      },
      {
        "role": "ink",
        "hex": "#2B2215"
      },
      {
        "role": "muted",
        "hex": "#6B5B40"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 15.6,
    "typography": {
      "family": "Noto Serif KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.25
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 96
    },
    "motionNote": "슬라이드 300ms",
    "mobileFlow": [
      "단일 컬럼",
      "햄버거 메뉴",
      "히어로 1:1",
      "카드 세로 스택",
      "하단 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-education-2",
        "gen-education-3",
        "gen-education-4"
      ],
      "concept": [
        "gen-beauty-3",
        "gen-cafe-fnb-2",
        "gen-education-2",
        "gen-education-3",
        "gen-education-4",
        "gen-medical-3"
      ],
      "layout": [
        "gen-beauty-2",
        "gen-medical-1",
        "ref-e"
      ]
    }
  },
  "gen-education-2": {
    "audienceNote": "20~30대",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-hamburger"
      },
      {
        "name": "Hero",
        "variant": "fullbleed-left"
      },
      {
        "name": "About",
        "variant": "team-grid-3"
      },
      {
        "name": "Services",
        "variant": "grid-3"
      },
      {
        "name": "Testimonials",
        "variant": "carousel"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "booking"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#1565A6"
      },
      {
        "role": "surface",
        "hex": "#E8F2FA"
      },
      {
        "role": "ink",
        "hex": "#15212C"
      },
      {
        "role": "muted",
        "hex": "#4C5D6C"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 16.3,
    "typography": {
      "family": "Noto Serif KR",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.25
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 96
    },
    "motionNote": "슬라이드 300ms",
    "mobileFlow": [
      "단일 컬럼",
      "햄버거 메뉴",
      "히어로 16:9",
      "카드 세로 스택",
      "스티키 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-education-1",
        "gen-education-3",
        "gen-education-4"
      ],
      "concept": [
        "gen-beauty-3",
        "gen-cafe-fnb-2",
        "gen-education-1",
        "gen-education-3",
        "gen-education-4",
        "gen-medical-3"
      ],
      "layout": [
        "ref-a"
      ]
    }
  },
  "gen-education-3": {
    "audienceNote": "20~30대",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-hamburger"
      },
      {
        "name": "Hero",
        "variant": "split"
      },
      {
        "name": "Services",
        "variant": "cards-3"
      },
      {
        "name": "About",
        "variant": "team-grid-2"
      },
      {
        "name": "Portfolio",
        "variant": "case-list"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "map-form"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#1E3A6E"
      },
      {
        "role": "surface",
        "hex": "#EBF0F8"
      },
      {
        "role": "ink",
        "hex": "#1A2233"
      },
      {
        "role": "muted",
        "hex": "#4E5A6E"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 15.9,
    "typography": {
      "family": "Pretendard",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.25
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 96
    },
    "motionNote": "슬라이드 300ms",
    "mobileFlow": [
      "단일 컬럼",
      "햄버거 메뉴",
      "히어로 4:5",
      "카드 세로 스택",
      "스티키 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-education-1",
        "gen-education-2",
        "gen-education-4"
      ],
      "concept": [
        "gen-beauty-3",
        "gen-cafe-fnb-2",
        "gen-education-1",
        "gen-education-2",
        "gen-education-4",
        "gen-medical-3"
      ],
      "layout": [
        "gen-cafe-fnb-1",
        "gen-professional-2",
        "ref-b"
      ]
    }
  },
  "gen-education-4": {
    "audienceNote": "가족 단위",
    "buildNote": "internal 조합 생성기 internal-compose-1으로 조립",
    "sections": [
      {
        "name": "Header",
        "variant": "sticky-hamburger"
      },
      {
        "name": "Hero",
        "variant": "center"
      },
      {
        "name": "About",
        "variant": "story"
      },
      {
        "name": "Services",
        "variant": "grid-3"
      },
      {
        "name": "Testimonials",
        "variant": "quotes-2"
      },
      {
        "name": "FAQ",
        "variant": "accordion"
      },
      {
        "name": "Contact",
        "variant": "booking"
      }
    ],
    "palette": [
      {
        "role": "primary",
        "hex": "#6A2C5B"
      },
      {
        "role": "surface",
        "hex": "#F7ECF3"
      },
      {
        "role": "ink",
        "hex": "#2B1D27"
      },
      {
        "role": "muted",
        "hex": "#6B5565"
      },
      {
        "role": "bg",
        "hex": "#FFFFFF"
      }
    ],
    "bodyContrast": 16.1,
    "typography": {
      "family": "Pretendard",
      "headingWeight": 700,
      "bodyWeight": 400,
      "scale": 1.2
    },
    "spacing": {
      "grid": "8pt",
      "sectionGap": 64
    },
    "motionNote": "페이드 200ms",
    "mobileFlow": [
      "단일 컬럼",
      "햄버거 메뉴",
      "히어로 16:9",
      "카드 세로 스택",
      "스티키 CTA"
    ],
    "measuredWith": "미측정",
    "similar": {
      "industry": [
        "gen-education-1",
        "gen-education-2",
        "gen-education-3"
      ],
      "concept": [
        "gen-beauty-3",
        "gen-cafe-fnb-2",
        "gen-education-1",
        "gen-education-2",
        "gen-education-3",
        "gen-medical-3"
      ],
      "layout": [
        "gen-beauty-1",
        "gen-professional-3",
        "ref-c"
      ]
    }
  }
});

export const generatedReferenceComparisonAttributes: Readonly<Record<string, ComparisonAttributes>> = Object.freeze({
  "gen-cafe-fnb-1": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-right-cta"
      },
      {
        "type": "hero",
        "variant": "split"
      },
      {
        "type": "services",
        "variant": "grid-3"
      },
      {
        "type": "portfolio",
        "variant": "grid-3"
      },
      {
        "type": "pricing",
        "variant": "cards"
      },
      {
        "type": "testimonials",
        "variant": "carousel"
      },
      {
        "type": "contact",
        "variant": "form"
      },
      {
        "type": "footer",
        "variant": "biz-extended"
      }
    ],
    "menuLabel": "5개 · 우측 CTA",
    "cta": {
      "label": "헤더 우측 고정",
      "value": "header-fixed"
    },
    "card": {
      "label": "보더 · 12px",
      "style": "bordered-md",
      "surfaceTone": "light"
    },
    "imageRatio": "4:5",
    "mobile": {
      "label": "단일 컬럼 · 하단 CTA",
      "value": "single-column-bottom-cta"
    },
    "paletteNote": "네이비"
  },
  "gen-cafe-fnb-2": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-right-cta"
      },
      {
        "type": "hero",
        "variant": "grid"
      },
      {
        "type": "about",
        "variant": "split"
      },
      {
        "type": "services",
        "variant": "schedule-table"
      },
      {
        "type": "testimonials",
        "variant": "quotes-2"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "booking"
      },
      {
        "type": "footer",
        "variant": "biz-extended-map"
      }
    ],
    "menuLabel": "5개 · 우측 CTA",
    "cta": {
      "label": "헤더 우측 고정",
      "value": "header-fixed"
    },
    "card": {
      "label": "엘리베이티드 · 라이트",
      "style": "elevated",
      "surfaceTone": "light"
    },
    "imageRatio": "16:9",
    "mobile": {
      "label": "단일 컬럼 · 하단 CTA",
      "value": "single-column-bottom-cta"
    },
    "paletteNote": "인디고"
  },
  "gen-beauty-1": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-right-cta"
      },
      {
        "type": "hero",
        "variant": "center"
      },
      {
        "type": "about",
        "variant": "team-grid-3"
      },
      {
        "type": "services",
        "variant": "schedule-table"
      },
      {
        "type": "testimonials",
        "variant": "quotes-2"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "booking"
      },
      {
        "type": "footer",
        "variant": "biz-extended"
      }
    ],
    "menuLabel": "5개 · 우측 CTA",
    "cta": {
      "label": "히어로 중앙",
      "value": "hero-center"
    },
    "card": {
      "label": "엘리베이티드 · 라이트",
      "style": "elevated",
      "surfaceTone": "light"
    },
    "imageRatio": "1:1",
    "mobile": {
      "label": "단일 컬럼 · 하단 CTA",
      "value": "single-column-bottom-cta"
    },
    "paletteNote": "포레스트"
  },
  "gen-beauty-2": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-right-cta"
      },
      {
        "type": "hero",
        "variant": "text"
      },
      {
        "type": "services",
        "variant": "masonry"
      },
      {
        "type": "portfolio",
        "variant": "grid-2"
      },
      {
        "type": "pricing",
        "variant": "cards"
      },
      {
        "type": "testimonials",
        "variant": "carousel"
      },
      {
        "type": "contact",
        "variant": "form"
      },
      {
        "type": "footer",
        "variant": "biz-extended"
      }
    ],
    "menuLabel": "5개 · 우측 CTA",
    "cta": {
      "label": "헤더 우측 고정",
      "value": "header-fixed"
    },
    "card": {
      "label": "플랫 · 구분선",
      "style": "flat",
      "surfaceTone": "light"
    },
    "imageRatio": "1:1",
    "mobile": {
      "label": "단일 컬럼 · 하단 CTA",
      "value": "single-column-bottom-cta"
    },
    "paletteNote": "오션"
  },
  "gen-beauty-3": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "transparent"
      },
      {
        "type": "hero",
        "variant": "grid"
      },
      {
        "type": "about",
        "variant": "story"
      },
      {
        "type": "services",
        "variant": "schedule-table"
      },
      {
        "type": "testimonials",
        "variant": "carousel"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "booking"
      },
      {
        "type": "footer",
        "variant": "biz-extended-map"
      }
    ],
    "menuLabel": "5개 · 투명 헤더",
    "cta": {
      "label": "하단 고정 버튼",
      "value": "sticky-bottom"
    },
    "card": {
      "label": "보더 · 12px",
      "style": "bordered-md",
      "surfaceTone": "light"
    },
    "imageRatio": "16:9",
    "mobile": {
      "label": "단일 컬럼 · 하단 탭 메뉴",
      "value": "single-column-bottom-tabs"
    },
    "paletteNote": "틸"
  },
  "gen-medical-1": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "transparent"
      },
      {
        "type": "hero",
        "variant": "text"
      },
      {
        "type": "about",
        "variant": "split"
      },
      {
        "type": "services",
        "variant": "grid-3"
      },
      {
        "type": "testimonials",
        "variant": "quotes-2"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "booking"
      },
      {
        "type": "footer",
        "variant": "biz-extended"
      }
    ],
    "menuLabel": "5개 · 투명 헤더",
    "cta": {
      "label": "하단 고정 버튼",
      "value": "sticky-bottom"
    },
    "card": {
      "label": "엘리베이티드 · 라이트",
      "style": "elevated",
      "surfaceTone": "light"
    },
    "imageRatio": "4:5",
    "mobile": {
      "label": "단일 컬럼 · 하단 탭 메뉴",
      "value": "single-column-bottom-tabs"
    },
    "paletteNote": "브릭"
  },
  "gen-medical-2": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-two-tier"
      },
      {
        "type": "hero",
        "variant": "image"
      },
      {
        "type": "services",
        "variant": "grid-2"
      },
      {
        "type": "about",
        "variant": "team-grid-2"
      },
      {
        "type": "portfolio",
        "variant": "insights-grid-3"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "form"
      },
      {
        "type": "footer",
        "variant": "minimal-biz"
      }
    ],
    "menuLabel": "6개 · 2단",
    "cta": {
      "label": "히어로 좌측 하단",
      "value": "hero-inline"
    },
    "card": {
      "label": "엘리베이티드 · 라이트",
      "style": "elevated",
      "surfaceTone": "light"
    },
    "imageRatio": "16:9",
    "mobile": {
      "label": "2컬럼 카드",
      "value": "two-column-cards"
    },
    "paletteNote": "슬레이트"
  },
  "gen-medical-3": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-hamburger"
      },
      {
        "type": "hero",
        "variant": "grid"
      },
      {
        "type": "about",
        "variant": "split"
      },
      {
        "type": "services",
        "variant": "schedule-table"
      },
      {
        "type": "testimonials",
        "variant": "quotes-2"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "booking"
      },
      {
        "type": "footer",
        "variant": "biz-extended"
      }
    ],
    "menuLabel": "4개 · 모바일 햄버거",
    "cta": {
      "label": "히어로 좌측 하단",
      "value": "hero-inline"
    },
    "card": {
      "label": "엘리베이티드 · 라이트",
      "style": "elevated",
      "surfaceTone": "light"
    },
    "imageRatio": "16:9",
    "mobile": {
      "label": "단일 컬럼 · 스티키 CTA",
      "value": "single-column-sticky-cta"
    },
    "paletteNote": "에스프레소"
  },
  "gen-professional-1": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-two-tier"
      },
      {
        "type": "hero",
        "variant": "image"
      },
      {
        "type": "services",
        "variant": "cards-3"
      },
      {
        "type": "about",
        "variant": "team-grid-2"
      },
      {
        "type": "portfolio",
        "variant": "grid-3"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "map-form"
      },
      {
        "type": "footer",
        "variant": "biz-extended"
      }
    ],
    "menuLabel": "6개 · 2단",
    "cta": {
      "label": "히어로 좌측 하단",
      "value": "hero-inline"
    },
    "card": {
      "label": "플랫 · 구분선",
      "style": "flat",
      "surfaceTone": "light"
    },
    "imageRatio": "16:9",
    "mobile": {
      "label": "2컬럼 카드",
      "value": "two-column-cards"
    },
    "paletteNote": "플럼"
  },
  "gen-professional-2": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-two-tier"
      },
      {
        "type": "hero",
        "variant": "split"
      },
      {
        "type": "services",
        "variant": "grid-2"
      },
      {
        "type": "about",
        "variant": "story"
      },
      {
        "type": "portfolio",
        "variant": "grid-3"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "map-form"
      },
      {
        "type": "footer",
        "variant": "biz-extended-map"
      }
    ],
    "menuLabel": "6개 · 2단",
    "cta": {
      "label": "히어로 좌측 하단",
      "value": "hero-inline"
    },
    "card": {
      "label": "보더 · 12px",
      "style": "bordered-md",
      "surfaceTone": "light"
    },
    "imageRatio": "1:1",
    "mobile": {
      "label": "2컬럼 카드",
      "value": "two-column-cards"
    },
    "paletteNote": "올리브"
  },
  "gen-professional-3": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-two-tier"
      },
      {
        "type": "hero",
        "variant": "center"
      },
      {
        "type": "services",
        "variant": "grid-2"
      },
      {
        "type": "about",
        "variant": "text"
      },
      {
        "type": "portfolio",
        "variant": "insights-grid-3"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "map-form"
      },
      {
        "type": "footer",
        "variant": "biz-extended-map"
      }
    ],
    "menuLabel": "6개 · 2단",
    "cta": {
      "label": "히어로 중앙",
      "value": "hero-center"
    },
    "card": {
      "label": "플랫 · 구분선",
      "style": "flat",
      "surfaceTone": "light"
    },
    "imageRatio": "16:9",
    "mobile": {
      "label": "2컬럼 카드",
      "value": "two-column-cards"
    },
    "paletteNote": "로즈"
  },
  "gen-education-1": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-right-cta"
      },
      {
        "type": "hero",
        "variant": "text"
      },
      {
        "type": "services",
        "variant": "cards-3"
      },
      {
        "type": "about",
        "variant": "text"
      },
      {
        "type": "portfolio",
        "variant": "case-list"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "map-form"
      },
      {
        "type": "footer",
        "variant": "biz-extended"
      }
    ],
    "menuLabel": "5개 · 우측 CTA",
    "cta": {
      "label": "헤더 우측 고정",
      "value": "header-fixed"
    },
    "card": {
      "label": "플랫 · 구분선",
      "style": "flat",
      "surfaceTone": "light"
    },
    "imageRatio": "1:1",
    "mobile": {
      "label": "단일 컬럼 · 하단 CTA",
      "value": "single-column-bottom-cta"
    },
    "paletteNote": "앰버"
  },
  "gen-education-2": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-hamburger"
      },
      {
        "type": "hero",
        "variant": "fullbleed-left"
      },
      {
        "type": "about",
        "variant": "team-grid-3"
      },
      {
        "type": "services",
        "variant": "grid-3"
      },
      {
        "type": "testimonials",
        "variant": "carousel"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "booking"
      },
      {
        "type": "footer",
        "variant": "biz-extended-map"
      }
    ],
    "menuLabel": "4개 · 모바일 햄버거",
    "cta": {
      "label": "히어로 좌측 하단",
      "value": "hero-inline"
    },
    "card": {
      "label": "보더 · 12px",
      "style": "bordered-md",
      "surfaceTone": "light"
    },
    "imageRatio": "16:9",
    "mobile": {
      "label": "단일 컬럼 · 스티키 CTA",
      "value": "single-column-sticky-cta"
    },
    "paletteNote": "오션"
  },
  "gen-education-3": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-hamburger"
      },
      {
        "type": "hero",
        "variant": "split"
      },
      {
        "type": "services",
        "variant": "cards-3"
      },
      {
        "type": "about",
        "variant": "team-grid-2"
      },
      {
        "type": "portfolio",
        "variant": "case-list"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "map-form"
      },
      {
        "type": "footer",
        "variant": "minimal-biz"
      }
    ],
    "menuLabel": "4개 · 모바일 햄버거",
    "cta": {
      "label": "히어로 좌측 하단",
      "value": "hero-inline"
    },
    "card": {
      "label": "보더 · 12px",
      "style": "bordered-md",
      "surfaceTone": "light"
    },
    "imageRatio": "4:5",
    "mobile": {
      "label": "단일 컬럼 · 스티키 CTA",
      "value": "single-column-sticky-cta"
    },
    "paletteNote": "네이비"
  },
  "gen-education-4": {
    "sectionPlan": [
      {
        "type": "header",
        "variant": "sticky-hamburger"
      },
      {
        "type": "hero",
        "variant": "center"
      },
      {
        "type": "about",
        "variant": "story"
      },
      {
        "type": "services",
        "variant": "grid-3"
      },
      {
        "type": "testimonials",
        "variant": "quotes-2"
      },
      {
        "type": "faq",
        "variant": "accordion"
      },
      {
        "type": "contact",
        "variant": "booking"
      },
      {
        "type": "footer",
        "variant": "minimal-biz"
      }
    ],
    "menuLabel": "4개 · 모바일 햄버거",
    "cta": {
      "label": "히어로 중앙",
      "value": "hero-center"
    },
    "card": {
      "label": "엘리베이티드 · 라이트",
      "style": "elevated",
      "surfaceTone": "light"
    },
    "imageRatio": "16:9",
    "mobile": {
      "label": "단일 컬럼 · 스티키 CTA",
      "value": "single-column-sticky-cta"
    },
    "paletteNote": "플럼"
  }
});
