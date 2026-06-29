// settings.js
export const SETTINGS = {
  PARTICLE_COUNT: 800000,
  CORE_RATIO: 0.75, // Чуть больше плотных частиц для эффекта густой краски

  // МАСШТАБ И ПОЗИЦИЯ: Сделали шире, выше и опустили вниз, чтобы не спамить текст
  INK_SCALE_X: 3.5,
  INK_SCALE_Y: 2.3, // Увеличили (было 1.6) — теперь волна стала объемной
  INK_OFFSET_X: -0.1,
  INK_OFFSET_Y: -0.55, // Опустили ниже (было -0.15) — текст теперь в безопасности

  // ГЕОМЕТРИЯ МАЗКА: Делаем поток плотнее
  CORE_THICKNESS: 0.65, // Толщина ядра увеличена (было 0.42) — эффект "густой краски"
  SPLATTER_SPREAD: 1.8, // Разлет брызг вокруг плотного мазка

  // Размеры микро-точек для сохранения текстуры напыления
  CORE_SIZE_MIN: 1.5,
  CORE_SIZE_MAX: 4.5,
  SPLATTER_SIZE_MIN: 0.5,
  SPLATTER_SIZE_MAX: 2.0,

  NOISE_SPEED: 0.1,
  NOISE_STRENGTH: 0.4,

  DRIFT_X: 0.8,
  DRIFT_Y: 1.5,

  // Цвета в формате HEX для безопасной инициализации Three.js
  COLOR_TEAL: '#051f38',
  COLOR_PURPLE: '#240a3e',
  COLOR_GOLD: '#8a6929',
  COLOR_DARK: '#080511',
  COLOR_BLACK: '#020105',
};
