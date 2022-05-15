module.exports = {
  content: ["src/client/ui/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        bg: {
          // DEFAULT: '#04004a'
        },
        territory: {
          DEFAULT: '#30E8E4' // 3055E8
        },
      },
      fontFamily: {
        brand: ['Aldrich', 'sans-serif'],
      },
      animation: {
        'tilt-in': 'tilt-in 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) 1s both;'
      },
      keyframes: {
        'fade-in': {
          from: {
            opacity: 0
          },
          to: {
            opacity: 1
          }
        },
        'tilt-in': {
          from: {
            transform: 'rotateY(30deg) translateY(-300px) skewY(-30deg)',
            opacity: 0
          },
          to: {
            transform: 'rotateY(0deg) translateY(0px) skewY(0deg)',
            opacity: 1
          }
        }
      }
    },
  },
  plugins: [],
}
