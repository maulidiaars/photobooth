import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm darkroom paper — the base the whole app sits on.
        paper: {
          DEFAULT: "#F6EEDD",
          light: "#FFFBF2",
          dark: "#E9DBBE",
        },
        // Alias kept so every existing `bg-cream` / `text-cream-*` call
        // site (admin screens included) picks up the new paper tone
        // automatically, with zero call-site changes required.
        cream: {
          DEFAULT: "#F6EEDD",
          light: "#FFFBF2",
          dark: "#E9DBBE",
        },
        // Deep espresso ink for type — richer & more legible than a
        // pastel brown, carries the "printed" feel.
        ink: "#3A281F",
        muted: "#93796A",

        // Signature accent — the garnet-red lifted straight from the
        // scrapbook frame artwork itself, not a generic template hue.
        garnet: {
          DEFAULT: "#9C2B3C",
          dark: "#6E1C29",
          light: "#C24759",
        },

        // Secondary palette — same roles as before (pink/purple/mint/
        // yellow) so existing components keep working, but re-tuned to
        // sit next to garnet instead of reading as candy pastel.
        clay: {
          pink: "#F0C7C9",
          pinkDark: "#D98A90",
          purple: "#D6CBEA",
          purpleDark: "#A991CE",
          mint: "#C9DEC7",
          mintDark: "#8FB88C",
          yellow: "#EFCE8C",
          yellowDark: "#DDA84C",
          blue: "#C3D6E3",
        },

        // A real, saturated forest green — used for every "positive
        // action" surface (save/continue/whatsapp/success) so those
        // never read as a washed-out pastel mint next to garnet.
        forest: {
          DEFAULT: "#2F6B49",
          dark: "#173C28",
          light: "#4F8F68",
        },

        // Deep, near-black maroon — the landing page's new backdrop
        // (distinct from the brighter `garnet` accent so frames sitting
        // on top of it still read as their own object, not a blend).
        maroon: {
          DEFAULT: "#3A0D14",
          dark: "#1F070C",
          mid: "#4E121C",
          light: "#6B1B26",
        },
      },
      fontFamily: {
        // Fraunces: a warm, characterful display serif with real
        // personality for headlines — reads like it belongs on a
        // printed photo strip, not a generic rounded app font.
        display: ["var(--font-fraunces)", "serif"],
        heading: ["var(--font-fraunces)", "serif"],
        // Plus Jakarta Sans: clean, humanist body face.
        body: ["var(--font-jakarta)", "sans-serif"],
        // Caveat: the handwritten "sticker note" accent voice, used
        // sparingly for eyebrows/labels — echoes the washi-tape
        // lettering on the physical frame itself.
        hand: ["var(--font-caveat)", "cursive"],
      },
      borderRadius: {
        clay: "22px",
        "clay-lg": "30px",
        "clay-sm": "14px",
        "clay-xs": "9px",
      },
      boxShadow: {
        clay: "7px 9px 22px rgba(70, 48, 36, 0.16), -6px -6px 16px rgba(255, 255, 255, 0.65)",
        "clay-inset": "inset 5px 5px 12px rgba(70, 48, 36, 0.16), inset -5px -5px 12px rgba(255, 255, 255, 0.6)",
        "clay-sm": "4px 5px 12px rgba(70, 48, 36, 0.14), -3px -3px 8px rgba(255, 255, 255, 0.6)",
        "clay-lg": "12px 16px 36px rgba(60, 40, 30, 0.22), -8px -8px 22px rgba(255, 255, 255, 0.55)",
        "clay-pressed": "inset 4px 4px 10px rgba(60, 40, 30, 0.22), inset -3px -3px 8px rgba(255, 255, 255, 0.5)",
        // A plain, single-direction shadow for anything meant to look
        // like a physical printed photo resting on the table.
        print: "0 24px 48px -16px rgba(58, 40, 31, 0.38), 0 4px 10px -4px rgba(58, 40, 31, 0.18)",
        "print-sm": "0 10px 22px -8px rgba(58, 40, 31, 0.3)",
        glow: "0 0 46px rgba(156, 43, 60, 0.28)",
      },
      backgroundImage: {
        "clay-gradient": "linear-gradient(150deg, #FFFCF4, #ECDFC5)",
        "pink-gradient": "linear-gradient(150deg, #F7DBDC, #E3ABAF)",
        "purple-gradient": "linear-gradient(150deg, #E5DCF3, #C1B2DD)",
        "mint-gradient": "linear-gradient(150deg, #DEEBDC, #A9CBA6)",
        "yellow-gradient": "linear-gradient(150deg, #F7E2B4, #E3B968)",
        "garnet-gradient": "linear-gradient(150deg, #B8394B, #7A1E2B)",
        "maroon-gradient": "linear-gradient(160deg, #4E121C 0%, #3A0D14 45%, #1F070C 100%)",
        "forest-gradient": "linear-gradient(150deg, #3F8058, #173C28)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(2deg)" },
        },
        floatySlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        popIn: {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        flash: {
          "0%": { opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        // A photo sliding out of a printer / developing into view.
        printOut: {
          "0%": { transform: "translateY(-28px) rotate(-1.5deg)", opacity: "0" },
          "60%": { transform: "translateY(4px) rotate(0.5deg)", opacity: "1" },
          "100%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(10px, -14px)" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2.5deg)" },
          "50%": { transform: "rotate(2.5deg)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        "floaty-slow": "floatySlow 8s ease-in-out infinite",
        "floaty-delay": "floaty 7s ease-in-out infinite 1s",
        popIn: "popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        flash: "flash 0.4s ease-out",
        printOut: "printOut 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        drift: "drift 9s ease-in-out infinite",
        sway: "sway 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
