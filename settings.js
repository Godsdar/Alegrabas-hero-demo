// settings.js
export const SETTINGS = {
  PARTICLE_COUNT: 800000,
  CORE_RATIO: 0.98,

  INK_SCALE_X: 3.5,
  INK_SCALE_Y: 2.3,
  INK_OFFSET_X: -0.1,
  INK_OFFSET_Y: -0.55, // Волна опущена, но теперь это не ломает шейдер!

  CORE_THICKNESS: 0.9,
  SPLATTER_SPREAD: 1.0,

  CORE_SIZE_MIN: 1.5,
  CORE_SIZE_MAX: 4.5,
  SPLATTER_SIZE_MIN: 0.5,
  SPLATTER_SIZE_MAX: 2.0,

  NOISE_SPEED: 0.1,
  NOISE_STRENGTH: 0.4,

  DRIFT_X: 0.8,
  DRIFT_Y: 1.5,

  // НАСТРОЙКА ЦВЕТА: Сделали сочнее и ярче, чтобы компенсировать прозрачность точек
  COLOR_TEAL: '#14426b', // Насыщенный сине-бирюзовый (вместо блеклого темного)
  COLOR_PURPLE: '#541b75', // Пурпурный глубокий (вместо чернильно-черного)
  COLOR_GOLD: '#cfa240', // Благородное светящееся золото (вместо грязно-бронзового)
  COLOR_DARK: '#0b071a', // Глубокий бархатный полумрак для перехода к хвосту
  COLOR_BLACK: '#020105', // Финальный черный хвост
};
