/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      // ============ 《风筝》视觉设计系统 ============
      colors: {
        // 基础底
        bg: '#080808',          // 极深黑
        card: '#121212',        // 卡片
        card2: '#161616',       // 卡片渐变第二层
        hoverc: '#1a1a1a',      // hover 提亮
        // 强调色
        blood: '#9d2235',       // 暗血红（军统/危险）
        teal: '#1e4a52',        // 暗青灰（地下党/冷静）
        // 文字
        paper: '#e8dcc8',       // 旧纸米黄
        ink: '#8a8275',         // 暗金灰
        dim: '#555048',         // 深灰（弱化）
        line: '#2a2520',        // 暗棕灰边框
        gold: '#b8860b',        // 暗金点缀
        // 阵营
        junton: '#9d2235',      // 军统 暗红
        zhongtong: '#7d3b52',   // 中统 暗紫红（扩展）
        underground: '#1e4a52', // 地下党 暗青
        gongan: '#3d3d3d',      // 公安 深灰
        civilian: '#8b7355',    // 平民 暗棕金
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', 'SimSun', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'], // 电报/打字机
      },
      letterSpacing: {
        widest2: '0.35em',
        widest3: '0.6em',
      },
      boxShadow: {
        glow: '0 0 24px rgba(157, 34, 53, 0.35)',
        'glow-gold': '0 0 18px rgba(184, 134, 11, 0.25)',
        card: 'inset 0 1px 0 rgba(232, 220, 200, 0.04), 0 10px 30px rgba(0,0,0,0.5)',
      },
      // 极简 CSS 动画仅用于颗粒/扫描线等“机器质感”，其余全部走 GSAP
      keyframes: {
        grain: {
          '0%,100%': { transform: 'translate(0,0)' },
          '10%': { transform: 'translate(-5%,-8%)' },
          '30%': { transform: 'translate(4%,-4%)' },
          '50%': { transform: 'translate(-3%,6%)' },
          '70%': { transform: 'translate(6%,3%)' },
          '90%': { transform: 'translate(-6%,-3%)' },
        },
        scanline: {
          '0%': { top: '-10%' },
          '100%': { top: '110%' },
        },
        caret: {
          '0%,49%': { opacity: '1' },
          '50%,100%': { opacity: '0' },
        },
      },
      animation: {
        grain: 'grain 8s steps(10) infinite',
        scanline: 'scanline 9s linear infinite',
        caret: 'caret 1s steps(1) infinite',
      },
    },
  },
  plugins: [],
}
