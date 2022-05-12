export const territorySkins = {
  pattern_squares: 'assets/pattern/squares.png',
  pattern_dots: 'assets/pattern/dots.png',
  pattern_grid: 'assets/pattern/grid.png',
  pattern_smiley: 'assets/pattern/smile.png',
  pattern_question: 'assets/pattern/question.png',
}

export type TSkinName = keyof typeof territorySkins

export const defaultTerritorySkin: TSkinName = 'pattern_squares'
