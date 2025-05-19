/**
 * @jest-environment jsdom
 */

jest.mock('../Utils/Debug.js', () => jest.fn())
jest.mock('../Utils/Sizes.js', () => jest.fn(() => ({
  on: jest.fn(),
})))
jest.mock('../Utils/Time.js', () => jest.fn(() => ({
  on: jest.fn(),
  delta: 16,
})))
jest.mock('../../integrations/VRIntegration.js', () => jest.fn(() => ({
  setUpdateCallback: jest.fn(),
})))
jest.mock('../Camera.js', () => jest.fn(() => ({
  resize: jest.fn(),
  update: jest.fn(),
  instance: {
    position: { copy: jest.fn(), set: jest.fn() },
    lookAt: jest.fn(),
  },
  controls: {
    enabled: true,
    update: jest.fn(),
  }
})))
jest.mock('../Renderer.js', () => jest.fn(() => ({
  instance: {
    xr: { isPresenting: false },
  },
  update: jest.fn(),
  resize: jest.fn(),
})))
jest.mock('../Utils/ModalManager.js', () => jest.fn(() => ({
  show: jest.fn(),
})))
jest.mock('../World/World.js', () => jest.fn(() => ({
  update: jest.fn(),
  resetForChallenge: jest.fn(),
  on: jest.fn(),
})))
jest.mock('../Utils/Resources.js', () => jest.fn())
jest.mock('../World/Sound.js', () => jest.fn())
jest.mock('../Utils/Raycaster.js', () => jest.fn())
jest.mock('../Utils/KeyboardControls.js', () => jest.fn())
jest.mock('../Utils/GameTracker.js', () => jest.fn(() => ({
  start: jest.fn(),
  hideGameButtons: jest.fn(),
  destroy: jest.fn(),
})))
jest.mock('../Utils/Physics.js', () => jest.fn(() => ({
  world: {
    removeBody: jest.fn(),
  },
  update: jest.fn(),
  destroy: jest.fn(),
})))
jest.mock('cannon-es-debugger', () => jest.fn(() => ({ update: jest.fn() })))
jest.mock('../../controls/CircularMenu.js', () => jest.fn(() => ({
  destroy: jest.fn(),
  toggleButton: { style: { display: '' } },
})))
jest.mock('../Challenges/ChallengeManager.js', () => jest.fn(() => ({
  startChallenge: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
})))

import Experience from '../Experience'

describe('Experience Class', () => {
  let canvas

  beforeEach(() => {
    // Asegura una nueva instancia limpia antes de cada test
    canvas = document.createElement('canvas')
    Experience.instance = null
  })

  it('debería crear una instancia de Experience', () => {
    const experience = new Experience(canvas)
    expect(experience).toBeInstanceOf(Experience)
  })

  it('debería mantener patrón singleton (misma instancia)', () => {
    const exp1 = new Experience(canvas)
    const exp2 = new Experience(canvas)
    expect(exp1).toBe(exp2)
  })

  it('debería llamar a resize sin errores', () => {
    const experience = new Experience(canvas)
    expect(() => experience.resize()).not.toThrow()
  })

  it('debería llamar a update sin errores', () => {
    const experience = new Experience(canvas)
    expect(() => experience.update()).not.toThrow()
  })
})
