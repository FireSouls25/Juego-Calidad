//Comentario tal.
import * as THREE from 'three'
import Debug from './Utils/Debug.js'
import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import VRIntegration from '../integrations/VRIntegration.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import ModalManager from './Utils/ModalManager.js'
import World from './World/World.js'
import Resources from './Utils/Resources.js'
import sources from './sources.js'
import Sounds from './World/Sound.js'
import Raycaster from './Utils/Raycaster.js'
import KeyboardControls from './Utils/KeyboardControls.js'
import GameTracker from './Utils/GameTracker.js'
import Physics from './Utils/Physics.js'
import cannonDebugger from 'cannon-es-debugger'
import CircularMenu from '../controls/CircularMenu.js'
import { Howler } from 'howler'
import ChallengeManager from './Challenges/ChallengeManager.js'

// Instancia 
let instance = null

export default class Experience {
  constructor(_canvas) {
    if (instance) return instance
    instance = this

    // Global access
    window.experience = this
    this.canvas = _canvas

    // Flag de interacción
    window.userInteracted = false

    // Core setup
    this.debug = new Debug()
    this.sizes = new Sizes()
    this.time = new Time()
    this.scene = new THREE.Scene()
    this.physics = new Physics()
    this.debugger = cannonDebugger(this.scene, this.physics.world, { color: 0x00ff00 })
    this.keyboard = new KeyboardControls()

    this.scene.background = new THREE.Color('#87ceeb')

    // Recursos
    this.resources = new Resources(sources)

    // Cámara y renderer
    this.camera = new Camera(this)
    this.renderer = new Renderer(this)

    // Raycaster
    this.raycaster = new Raycaster(this)

    // Modal y VR
    this.modal = new ModalManager({ container: document.body })
    this.vr = new VRIntegration({
      renderer: this.renderer.instance,
      scene: this.scene,
      camera: this.camera.instance,
      modalManager: this.modal,
      experience: this
    })

    // Menú
    this.menu = new CircularMenu({
      container: document.body,
      vrIntegration: this.vr,
      onAudioToggle: () => this.world.toggleAudio(),
      onWalkMode: () => {
        this.resumeAudioContext()
        this.toggleWalkMode()
      },
      onFullscreen: () => {
        if (!document.fullscreenElement) {
          document.body.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    })

    // Challenge system
    this.challengeManager = new ChallengeManager(this)
    
    //Iniciar juego
    this.modal.show({
      icon: '🎮',
      message: '¡Bienvenido al juego!\nSelecciona un desafío para comenzar.',
      buttons: [
        {
          text: '▶️ Seleccionar Desafío',
          onClick: () => this.showChallengeSelector()
        }
      ]
    })

    // Activar tiempos
    if (this.tracker) {
      this.tracker.destroy()
    }

    this.tracker = new GameTracker({ modal: this.modal, menu: this.menu })

    // Mundo
    this.world = new World(this)

    // Flag tercera persona
    this.isThirdPerson = false

    // Iniciar loop adecuado
    this.startLoop()

    // Resize
    this.sizes.on('resize', () => this.resize())

    // Sonidos
    this.sounds = new Sounds({ time: this.time, debug: this.debug })

    // Detectar gesto del usuario
    window.addEventListener('click', this.handleFirstInteraction, { once: true })
    window.addEventListener('touchstart', this.handleFirstInteraction, { once: true })

    // Listen for challenge completion
    this.world.on('challengeComplete', (data) => {
      this.showChallengeResults(data)
    })
  }

  //Control de audio
  handleFirstInteraction() {
    const ctx = Howler.ctx
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log('🔊 AudioContext reanudado por interacción del usuario.')
      }).catch((err) => {
        console.warn('⚠️ Error reanudando AudioContext:', err)
      })
    }
    window.userInteracted = true
  }

  resumeAudioContext() {
    const ctx = Howler.ctx
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log('🔊 AudioContext reanudado manualmente')
      }).catch((err) => {
        console.warn('⚠️ Error reanudando AudioContext:', err)
      })
    }
  }

  toggleWalkMode() {
    this.isThirdPerson = !this.isThirdPerson

    const controls = this.camera.controls
    const cam = this.camera.instance

    if (this.isThirdPerson) {
      controls.enabled = false
      console.log('🟡 Tercera persona ON')
    } else {
      controls.enabled = true
      controls.enableRotate = true
      controls.enableZoom = true
      controls.enablePan = false
      controls.minPolarAngle = 0
      controls.maxPolarAngle = Math.PI * 0.9

      cam.position.set(12, 5, 10)
      cam.up.set(0, 1, 0)
      controls.target.set(0, 0, 0)
      cam.lookAt(controls.target)
      controls.update()

      console.log('🟢 Vista global restaurada')
    }
  }

  startLoop() {
    this.vr.setUpdateCallback((delta) => this.update(delta))

    this.time.on('tick', () => {
      if (!this.renderer.instance.xr.isPresenting) {
        const delta = this.time.delta * 0.001
        this.update(delta)
      }
    })
  }

  resize() {
    this.camera.resize()
    this.renderer.resize()
  }

  update(delta) {
    if (!this.isThirdPerson && !this.renderer.instance.xr.isPresenting) {
      this.camera.update()
    }

    if (this.renderer.instance.xr.isPresenting) {
      this.adjustCameraForVR()
    }

    this.world.update(delta)
    this.renderer.update()
    this.physics.update(delta)
    this.challengeManager.update()
    // this.debugger?.update() // activar fisicas
  }

  adjustCameraForVR() {
    if (this.renderer.instance.xr.isPresenting && this.world.robot?.group) {
      const pos = this.world.robot.group.position
      this.camera.instance.position.copy(pos).add(new THREE.Vector3(0, 1.6, 0))
      this.camera.instance.lookAt(pos.clone().add(new THREE.Vector3(0, 1.6, -1)))
      // console.log('🎯 Cámara ajustada a robot en VR')
    }
  }

  //Generar olas de cubos
  _startObstacleWaves() {
    this.obstacleWaveCount = 10
    this.maxObstacles = 50
    this.currentObstacles = []
    const delay = 30000
  
    const spawnWave = () => {
      if (this.obstacleWavesDisabled) return
  
      for (let i = 0; i < this.obstacleWaveCount; i++) {
        const obstacle = this.raycaster.generateRandomObstacle?.()
        if (obstacle) {
          this.currentObstacles.push(obstacle)
        }
      }
  
      // Mantener máximo 50 obstáculos
      while (this.currentObstacles.length > this.maxObstacles) {
        const oldest = this.currentObstacles.shift()
        if (oldest?.mesh && oldest?.body) {
          // Remover del mundo físico
          this.physics.world.removeBody(oldest.body)
  
          // Remover del escenario visual
          this.scene.remove(oldest.mesh)
  
          // Liberar recursos
          oldest.mesh.geometry.dispose()
          if (Array.isArray(oldest.mesh.material)) {
            oldest.mesh.material.forEach(mat => mat.dispose?.())
          } else {
            oldest.mesh.material.dispose?.()
          }
        }
      }
  
      this.obstacleWaveCount += 10
      this.obstacleWaveTimeout = setTimeout(spawnWave, delay)
    }
  
    // Inicia primera oleada tras 30s
    this.obstacleWaveTimeout = setTimeout(spawnWave, 30000)
  }
  


  destroy() {
    this.sizes.off('resize')
    this.time.off('tick')

    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose && mat.dispose())
        } else {
          child.material.dispose?.()
        }

      }
    })

    this.camera.controls.dispose()
    this.renderer.instance.dispose()
    if (this.debug.active) this.debug.ui.destroy()
  }

  startGame() {
    console.log('🎮 Juego iniciado')
    this.isThirdPerson = true // ⬅️ asegurar el modo
    this.tracker.start()
    this._startObstacleWaves()
    if (this.menu && this.menu.toggleButton && this.menu.toggleButton.style) {
      this.menu.toggleButton.style.display = 'block'
    }
    

    console.log('🎮 Iniciando partida...')
  }



  resetGame() {
    console.log('♻️ Reiniciando juego...')
  
    // 💥 Limpieza explícita del HUD
    if (this.menu) this.menu.destroy()
  
    // 💥 Limpieza del temporizador viejo
    if (this.tracker) this.tracker.destroy()
  
    // 🧼 Destruir todo
    this.destroy()
  
    // 🔁 Reiniciar instancia
    instance = null
    const newExperience = new Experience(this.canvas)
  
    // ✅ Forzar modo tercera persona
    newExperience.isThirdPerson = true
  
    // 🧼 Limpiar botón cancelar
    const cancelBtn = document.getElementById('cancel-button')
    if (cancelBtn) cancelBtn.remove()
  
    // ❌ ❌ ESTA LÍNEA FALLABA:
    // this.tracker.hideGameButtons()
  
    // ✅ Si quieres esconder botones en la nueva instancia:
    newExperience.tracker?.hideGameButtons?.()
  }

  showChallengeSelector() {
    this.modal.show({
      icon: '🎯',
      message: 'Selecciona un desafío:',
      buttons: [
        {
          text: '💰 Coleccionista de Monedas',
          onClick: () => this.startChallenge('coin_collector')
        },
        {
          text: '🚫 Esquivador Experto',
          onClick: () => this.startChallenge('obstacle_avoidance')
        },
        {
          text: '🏃 Corredor Veloz',
          onClick: () => this.startChallenge('speed_runner')
        }
      ]
    })
  }

  showChallengeResults(data) {
    const { challenge, success } = data
    this.modal.show({
      icon: success ? '🎉' : '😢',
      message: success ? '¡Desafío Completado!' : '¡Desafío Fallido!',
      buttons: [
        {
          text: '🔄 Reintentar',
          onClick: () => this.startChallenge(challenge.id)
        },
        {
          text: '🎯 Nuevo Desafío',
          onClick: () => this.showChallengeSelector()
        }
      ]
    })
  }

  startChallenge(challengeId) {
    const challenges = {
      coin_collector: {
        id: 'coin_collector',
        title: 'Coleccionista de Monedas',
        description: '¡Recolecta 10 monedas en 60 segundos!',
        timeLimit: 60,
        target: 10,
        type: 'coins'
      },
      obstacle_avoidance: {
        id: 'obstacle_avoidance',
        title: 'Esquivador Experto',
        description: '¡No toques ningún obstáculo durante 45 segundos!',
        timeLimit: 45,
        type: 'avoidance'
      },
      speed_runner: {
        id: 'speed_runner',
        title: 'Corredor Veloz',
        description: '¡Llega al punto objetivo antes de que se acabe el tiempo!',
        timeLimit: 30,
        type: 'speed'
      }
    }

    const challenge = challenges[challengeId]
    this.challengeManager.startChallenge(challenge)
    this.world.resetForChallenge(challenge)
    
    // Show challenge UI
    this.modal.show({
      icon: '🎮',
      message: `${challenge.title}\n${challenge.description}`,
      buttons: [
        {
          text: '▶️ Comenzar',
          onClick: () => {
            this.modal.hide()
            this.startGame()
          }
        }
      ]
    })
  }
}
